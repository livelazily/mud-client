import * as net from 'net';
import * as path from 'path';
import * as readline from 'readline';
import { EventEmitter } from 'events';

import * as chalk from 'chalk';
import * as iconv from 'iconv-lite';
import * as fse from 'fs-extra';
import * as through2 from 'through2';
import * as debug from 'debug';
import { TelnetInput, TelnetOutput } from 'telnet-stream';

import { Character } from './character';
import { ConnectorHandler } from './lib/connectorHandler';
import { ipc } from './lib/ipc';

const connectorDebug = debug('connector');

export class Connector extends EventEmitter {
  character: Character;
  readlineServerDisabled = false;

  private handlers: { [scriptPath: string]: ConnectorHandler };
  private telnetInput: TelnetInput;
  private telnetOutput: TelnetOutput;
  private ipc: any;
  private socket: net.Socket;
  private readlineServer: readline.ReadLine;
  private readlineClient: readline.ReadLine;

  constructor() {
    super();
    this.handlers = {};
    this.setMaxListeners(0);
  }

  connect(config, charName: string) {
    let charConfig = config[charName];
    let port = charConfig.port;
    let host = charConfig.host;
    let encoding = charConfig.encoding || 'utf-8';

    const telnetInput = this.telnetInput = new TelnetInput();
    const telnetOutput = this.telnetOutput = new TelnetOutput();

    this.ipc = ipc(charName);
    this.socket = net.createConnection(port, host);
    this.socket.setKeepAlive(true);
    this.socket.setNoDelay(true);

    this.socket.pipe(telnetInput);

    // convert terminal input to custom encoding
    telnetOutput
      .pipe(iconv.decodeStream('utf-8'))
      .pipe(iconv.encodeStream(encoding))
      .pipe(this.socket);

    this.socket.on('close', () => {
      this.socket.unpipe(telnetInput);
      telnetOutput.unpipe(this.socket);
      this.readlineServer.close();
      this.readlineClient.close();
    });

    this.readlineServer = readline.createInterface({
      input: telnetInput
        .pipe(iconv.decodeStream(encoding))
        .pipe(iconv.encodeStream('utf-8'))
    });

    this.readlineClient = readline.createInterface(
      process.stdin,
      process.stdout // need that for history and special keys to work
    );

    telnetInput.on('data', data => this.emit('dataServer', data));

    fse.ensureDirSync('./logs/' + charName);

    telnetInput.pipe(through2((chunk, enc, callback) => {
      let text = iconv.decode(chunk, encoding);
      text = chalk.stripColor(text);
      text = text.replace(/\r/g, '');
      callback(null, text);
    })).pipe(fse.createWriteStream('./logs/' + charName + '/' + now() + '.log'));

    telnetInput.pipe(through2((chunk, enc, callback) => {
      // remove ending newline from the prompt to show more nicely
      let text = iconv.decode(chunk, encoding);
      text = text.replace(/((?:[\n\r]|^)<.*?>)\n\r?/g, '$1 ');
      // chunk = this.ignoreFilter(chunk);
      if (text) {
        callback(null, text);
      } else {
        callback(null);
      }
    })).pipe(process.stdout);

    this.readlineServer = readline.createInterface({
      input: telnetInput
        .pipe(iconv.decodeStream(encoding))
        .pipe(iconv.encodeStream('utf-8'))
    });

    this.readlineServer.resume();


    // wait until the prompt and login
    this.readlineServer.on('line', function login(line: string) {
      line = chalk.stripColor(line.trim());

      if (line.includes('位玩家在线上')) {
        this.write(charName);
        setTimeout(() => {
          this.write(charConfig.password);
        }, 1000);

        this.readlineServer.removeListener('line', login);
      }

      if (line === 'The realm will await your return.') {
        process.exit();
      }

      if (line === '[Hit Return to continue]') {
        this.write('\r\n');
      }
    }.bind(this));

    this.readlineServer.on('line', line => {

      if (this.readlineServerDisabled) {
        return;
      }

      line = chalk.stripColor(line.trim());

      // console.log("LINE", JSON.stringify(line));

      if (this.processServerPrompt(line)) {
        return;
      }

      // otherwise
      this.emit('readlineServer', line);

      connectorDebug('<--', line);
    });


    this.readlineClient.on('line', line => {
      line = line.trim();

      connectorDebug('-->', line);

      this.processClientInput(line);

      this.readlineClient.prompt(true);
    });

    if (charConfig.loadHandlers) {
      for (let handler of charConfig.loadHandlers) {
        this.loadHandler(handler);
      }
    }

    function now() {
      return new Date().toISOString().replace(/[T:]/g, '_').replace(/[Z]|\.\d{3}/g, '');
    }
  }

  private processClientInput(line: string): void {
    // no nested { } supported

    // #cmd {arg1;smth} {arg2}
    if (line[0] === '#') {
      let command = line.slice(1);
      let commandName = command.split(' ')[0];
      command = command.slice(commandName.length).trim(); // {arg1;smth} {arg2}

      let args = [];

      while (true) {
        let count = args.length;
        command = command.trim();
        if (!command) {
          break;
        }
        command = command.replace(/\{(.*?)\}|([#'"a-zA-Z0-9-_\/.\\]+)/, (match, bracketed, bare) => {
          args.push(bracketed || bare);
          return '';
        });

        if (args.length === count) {
          // no new args found
          this.showError('Command fail to parse command: ' + line);
          return;
        }
      }

      this.emit('command', commandName, args);
      return;
    }
  }

  // process server line, try to see if it's a prompt
  // @returns true if it was a prompt
  private processServerPrompt(line: string): boolean {

    let reg = /(?:^|[\r\n])<\w+ (-?\d+)\/(-?\d+)hp (-?\d+)\/(-?\d+)mana (-?\d+)\/(-?\d+)mv \|([ a-zA-Z!]*)>(?: \[(.*?)\]: (.*?)\[(.*?)\]: (.*?)(?:$|[\r\n]))?/g;

    let prompt, match;

    while ((match = reg.exec(line)) !== null) {
      // look for last stats
      prompt = match;
    }

    if (!prompt) {
      return false;
    }

    prompt = {
      hp: +prompt[1],
      hpMax: +prompt[2],
      hpPercent: prompt[1] / prompt[2],
      mana: +prompt[3],
      manaMax: +prompt[4],
      manaPercent: prompt[3] / prompt[4],
      mv: +prompt[5],
      mvMax: +prompt[6],
      mvPercent: prompt[5] / prompt[6],
      exits: prompt[7].trim(),
      battle: prompt[8] ? {
        attacker: prompt[8].trim(),
        attackerHealth: prompt[9].trim(),
        target: prompt[10].trim(),
        targetHealth: prompt[11].trim()
      } : null
    };

    this.emit('prompt', prompt);

    return true;
  }

  write(line: string, quiet?: boolean) {
    if (!quiet) {
      // show to user
      // speedwalk doesn't do that
      this.show(line);
    }

    this.telnetOutput.write(line + '\n');
  }

  show(line: string) {
    process.stdout.write(line + '\n');
  }

  showError(line: string) {
    this.show(chalk.red('#' + line));
  }

  showInfo(line: string) {
    this.show(chalk.gray('#' + line));
  }

  loadHandler(scriptPath) {
    scriptPath = path.resolve(scriptPath);
    delete require.cache[scriptPath];
    let HandlerClass;
    try {
      HandlerClass = require(scriptPath);
    } catch (e) {
      this.showError(e.message + ' for ' + scriptPath + '\n' + e.stack);
      return;
    }
    if (this.handlers[scriptPath]) {
      this.handlers[scriptPath].disable();
      this.showInfo('Unloaded ' + scriptPath);
    }
    this.handlers[scriptPath] = new HandlerClass(this);
    this.handlers[scriptPath].enable();
    this.showInfo('Loaded ' + scriptPath);
  }

  unloadHandler(scriptPath) {
    scriptPath = path.resolve(scriptPath);
    if (!this.handlers[scriptPath]) {
      this.showError('Not loaded ' + scriptPath);
    } else {
      this.handlers[scriptPath].disable();
      delete this.handlers[scriptPath];

      this.showInfo('Unloaded ' + scriptPath);
    }
  }

  disconnect() {
    this.socket.end();
  }
}
