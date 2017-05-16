import * as ipc from 'node-ipc';

ipc.config.id = 'mud';
ipc.config.retry = 1500;

ipc.serveNet('127.0.0.1', 3232, () =>
  ipc.server.on('all', (data, socket) =>
    ipc.server.broadcast('all', data)
  )
);

ipc.server.start();
