'use strict';

const opn = require('opn');
const ConnectorHandler = require('../lib/connectorHandler');

class AntiRobotNotifier extends ConnectorHandler {

  get connectorEvents() {
    return ['readlineServer'];
  }

  onReadlineServer(line) {
    if (line.indexOf('http://pkuxkx.net/antirobot/robot.php') >= 0) {
      opn(line);
    }
  }
}

module.exports = AntiRobotNotifier;

