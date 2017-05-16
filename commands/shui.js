'use strict';

const ConnectorHandler = require('../lib/connectorHandler');
const notifier = require('node-notifier');
const chalk = require('chalk');

const checkTexts = [
  '对抗寒气中'
];
module.exports = class Shui extends ConnectorHandler {

  get connectorCommands() {
    return ['shui'];
  }

  onCommandShui(args) {
    let times = parseInt(args[0]) || 0;
    if (!times) {
      return;
    }

    let count = 1;
    let connector = this.connector;
    repeat(checkTexts[0]);

    connector.on('readlineServer', repeat);

    function repeat(line) {
      if (count > times) {
        connector.removeListener('readlineServer', repeat);
        notify('睡觉完毕');
        return;
      }
      for (let i = 0; i < checkTexts.length; i++) {
        let text = checkTexts[i];
        if (line.indexOf(text) < 0) {
          continue;
        }

        console.log(chalk.gray(`第${count}次睡觉`));
        count++;
        connector.write('shui bed');
        break;
      }
    }

    function notify(message) {
      notifier.notify({
        message: message,
        sound: true
      });
      console.log(message);
    }
  }
};
