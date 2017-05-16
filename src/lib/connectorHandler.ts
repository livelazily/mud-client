import * as _ from 'lodash';
import {Connector} from '../connector';

// reloadable handler for Connector#loadHandler
// enable/disable is used for reloading
export abstract class ConnectorHandler {
  private _eventMap: any;
  private _commandMap: any;

  connector: Connector;

  constructor(connector: Connector) {
    this.connector = connector;
  }


  // enable() {
  //   this.listenToConnectorEvent('readlineClient');
  // }
  //
  // disable() {
  //   this.stopListenToConnectorEvents().removeListener('readlineClient', this.onReadlineClient);
  // }

  abstract get connectorEvents() : string[];

  abstract get connectorCommands(): string[];

  // readlineServer -> onReadlineServer(line)
  private listenToConnectorEvents() {
    let map = Object.create(null);
    for (let eventName of this.connectorEvents) {
      let methodName = 'on' + eventName[0].toUpperCase() + eventName.slice(1);
      if (!this[methodName]) {
        throw new Error("No method " + methodName);
      }

      let method = this[methodName].bind(this);
      map[eventName] = method;
      this.connector.on(eventName, method);
    }

    this._eventMap = map;
  }

  // on('command') for #back -> onCommandBack(args)
  private listenToConnectorCommands() {
    let map = Object.create(null);
    for (let commandName of this.connectorCommands) {
      let methodName = 'onCommand' + commandName[0].toUpperCase() + commandName.slice(1);
      if (!this[methodName]) {
        throw new Error("No method " + methodName);
      }
      let method = this[methodName].bind(this);
      let onCommand = function (checkName, args) {
        if (checkName != commandName) {
          return;
        }
        method(args);
      };
      map[commandName] = onCommand;
      this.connector.on('command', onCommand);
    }

    this._commandMap = map;
  }

  private stopListenToConnectorCommands() {
    if (!this._commandMap) {
      return;
    }

    for (let commandName of this._commandMap) {
      this.connector.removeListener(commandName, this._commandMap[commandName])
    }
    delete this._commandMap;
  }

  private stopListenToConnectorEvents() {
    if (!this._eventMap) {
      return;
    }

    for (let eventName of this._eventMap) {
      this.connector.removeListener(eventName, this._eventMap[eventName])
    }
    delete this._eventMap;
  }

  enable() {
    this.listenToConnectorEvents();
    this.listenToConnectorCommands();
  }

  disable() {
    this.stopListenToConnectorEvents();
    this.stopListenToConnectorCommands();
  }

}
