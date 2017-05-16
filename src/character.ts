import {Connector} from './connector';

export interface CharacterOptions {
  water: string;
  store: string;
  food: string;
  rug: string;
  morph: any;
}

export interface Stats {
  hp: string;
  hpMax: string;
  hpPercent: string;
  mana: string;
  manaMax: string;
  manaPercent: string;
  mv: string;
  mvMax: string;
  mvPercent: string;
  exits: string;
  battle: Battle;
}

export interface Battle {
  attacker: string;
  attackerHealth: string;
  target: string;
  targetHealth: string;
}

export enum State {
  STANDING,
  RESTING,
  SLEEPING,
  BATTLE,
}

export class Character {
  name: string;

  private water: string;
  private store: string;
  private food: string;
  private rug: string;

  private stats?: Stats;

  private state = State.STANDING;

  private formType?: string;

  constructor(
    private connector: Connector,
    name: string,
    private options: CharacterOptions
  ) {

    this.connector.character = this;

    this.water = this.options.water || 'gourd';
    this.store = this.options.store || 'backpack';
    this.food = this.options.food || 'wafer';
    this.rug = this.options.rug || 'rug';
    this.name = name;

    this.connector = connector;

    connector.on('prompt', prompt => {
      this.updateStats(prompt);
    });

    this.connector.on('readlineServer', line => this.onReadlineServer(line));
  }

  private onReadlineServer(line: string) {
    line = line.replace(/^<.*?>\s+/, '');
    if (line.startsWith('You go to sleep')) {
      this.state = State.SLEEPING;
    }
    if (line === 'You rest.') {
      this.state = State.RESTING;
    }
    if (line.startsWith('You wake and stand') || line === 'You stand up.') {
      this.state = State.STANDING;
    }

    if (this.stats && this.stats.battle) {
      if (line.toLowerCase() === this.stats.battle.target.toLowerCase() + ' is dead!!') {
        this.connector.emit('battleDead');
      }
    }

    if (line === 'Your body undergoes a rapid transformation and you revert to your true form.') {
      this.formType = null;
    }

  }

  private updateStats(stats: Stats) {
    // console.log(stats);
    this.stats = stats;
    if (stats.battle && this.state !== State.BATTLE) {
      this.state = State.BATTLE;
      // console.log("BATTLE START");
      this.connector.emit('battleStart', stats.battle);
    }

    if (!stats.battle && this.state === State.BATTLE) {
      this.state = State.STANDING;

      // console.log("BATTLE FINISH");
      this.connector.emit('battleFinish');
    }

    this.connector.emit('stats', stats);
  }

  // can be improved to track current character state to wake up/sleep
  eat() {
    let connector = this.connector;

    this.wake();
    this.connector.write(`get ${this.food} ${this.store}`);
    this.connector.write(`eat ${this.food}`);


    // if too full in 5 seconds then put back
    connector.on('readlineServer', checkFull);

    setTimeout(() => {
      connector.removeListener('readlineServer', checkFull)
    }, 15000);

    let self = this;

    function checkFull(line: string) {
      if (line.includes('You are too full to eat more.')) {
        connector.removeListener('readlineServer', checkFull);
        connector.write(`put ${self.food} ${self.store}`);
      }
    }

  }

  sleep() {
    this.connector.write('drop ' + this.rug);
    this.connector.write('sleep ' + this.rug);
    this.connector.write('sleep');
  }

  wake() {
    this.connector.write('wake');
    this.connector.write('get ' + this.rug);
  }

  drink() {

    this.wake();
    this.connector.write(`drink ${this.water}`);

    // if empty in 5 seconds then get new
    this.connector.on('readlineServer', checkEmpty);

    setTimeout(() => {
      this.connector.removeListener('readlineServer', checkEmpty)
    }, 15000);

    let connector = this.connector;
    let self = this;

    function checkEmpty(line: string) {
      if (line.includes('It is already empty.')) {
        connector.removeListener('readlineServer', checkEmpty);
        connector.write(`drop ${self.water}`);
        connector.write(`sac ${self.water}`);
        connector.write(`get ${self.water} ${self.store}`);
        connector.write(`drink ${self.water}`);
      }
    }

  }

  // offense || defense
  morph(formType: string) {
    if (!this.options.morph) {
      return;
    }
    let form = this.options.morph[formType];
    if (!form) {
      this.connector.showError('No form: ' + formType);
      return;
    }
    this.connector.write('revert');
    this.connector.write('shapeshift ' + form);
    this.formType = formType;
  }
}
