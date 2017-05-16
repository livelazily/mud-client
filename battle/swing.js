'use strict';

const AutoBattleHandler = require('../lib/autoBattleHandler');

module.exports = class extends AutoBattleHandler {

  constructor(connector) {
    super(connector, 'swing', function (line) {
      return line.startsWith('You smash');
    });
  }

};
