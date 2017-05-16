'use strict';

const ConnectorHandler = require('../lib/connectorHandler');
const notifier = require('node-notifier');
const chalk = require('chalk');

const dzText = [
  '内力增加了',
  '感觉内力充盈，显然内功又有进境'
];
module.exports = class Dz extends ConnectorHandler {

  get connectorCommands() {
    return ['dz'];
  }

  onCommandDz(args) {
    let times = parseInt(args[0]) || 0;
    if (!times) {
      return;
    }

    let count = 1;
    let connector = this.connector;
    dz();
    connector.on('readlineServer', repeatDz);

    function repeatDz(line) {
      if (count > times) {
        connector.removeListener('readlineServer', repeatDz);
        notifier.notify({
          message: '打坐完毕',
          sound: true
        });
        console.log('打坐完毕');
        return;
      }
      for (let i = 0; i < dzText.length; i++) {
        let text = dzText[i];
        if (line.indexOf(text) >= 0) {
          count++;
          dz();
          break;
        }
      }
    }

    function dz() {
      console.log(chalk.gray(`第${count}次打坐`));
      connector.write('dz');
    }
  }
};
