'use strict';

const AutoBattleHandler = require('../lib/autoBattleHandler');

module.exports = class extends AutoBattleHandler {

  constructor(connector) {
    super(connector, 'kick', function (line) {
      return line.match(/^Your kick /);
    });
  }

};
