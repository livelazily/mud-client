import * as nodeIpc from 'node-ipc';

export function ipc(charName) {

  nodeIpc.config.id = charName;
  nodeIpc.config.silent = true;

  nodeIpc.connectToNet('mud', 3232);

  return nodeIpc;
}
