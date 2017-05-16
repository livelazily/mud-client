'use strict';

const AutoBattleHandler = require('../lib/autoBattleHandler');

module.exports = class extends AutoBattleHandler {

  constructor(connector) {
    super(connector, 'bleed', function (line) {
      return line.startsWith('You try to sever an artery');
    });

  }

};
