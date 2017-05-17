'use strict';

import { ConnectorHandler } from './connectorHandler';
import { Connector } from '../connector';
import { AffectReader } from './affectReader';
import * as notifier from 'node-notifier';

export class SpellupHandler extends ConnectorHandler {

    constructor(connector: Connector, private spellListFull: { [item: string]: boolean }) {
        super(connector);
    }

    get connectorEvents() {
        return [];
    }

    get connectorCommands() {
        return ['spellup'];
    }

    onCommandSpellup(args) {
        new AffectReader(this.connector, affects => {
            let expiring = {};
            Object.keys(affects).forEach(key => {
                if (affects[key].hours < 2) {
                    expiring[key] = affects[key];
                }
            });

            let phrases = [];
            for (let spell in expiring) {
                phrases.push(`${spell} ${expiring[spell].hours}h`);
            }

            if (phrases.length) {
                notifier.notify({
                    message: this.connector.character.name + ": " + phrases.join(', ')
                });
            }

            for (let item in this.spellListFull) {
                let isSpell = this.spellListFull[item];

                if (!affects[item.toLowerCase()]) {
                    if (!isSpell) {
                        this.connector.write(item, true);
                    } else {
                        this.connector.write(`cast "${item}"`, true);
                    }
                }

            }


        });
    }

};
