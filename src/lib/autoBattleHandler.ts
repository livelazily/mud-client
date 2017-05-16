import {ConnectorHandler} from './connectorHandler';
import {Connector} from '../connector';

export class AutoBattleHandler extends ConnectorHandler {
  private repeats = 0;

  constructor(connector: Connector,
              private action: string,
              private repeatOn?: (line: string) => boolean) {
    super(connector);
    this.repeatOn = repeatOn;
  }

  get connectorEvents(): string[] {
    return ['battleStart', 'readlineServer', 'battleDead'];
  }

  get connectorCommands(): string[] {
    return [];
  }

  private act() {
    this.repeats++;
    if (this.repeats % 15 === 0) {
      this.connector.write('nop' + (Math.random() * 10 ^ 0));
      this.repeats = 0;
    }
    this.connector.write(this.action);
  }

  onReadlineServer(line) {
    if (this.repeatOn && this.repeatOn(line)) {
      this.act();
    }
  }

  onBattleStart() {
    this.act();
  }

  onBattleDead() {
    // check if next prompt is still in battle, then do it again
    this.connector.once('stats', (stats) => {
      if (stats.battle) {
        this.act();
      }
    });
  }
}
