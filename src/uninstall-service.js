'use strict';

const path = require('path');
const Service = require(process.platform === 'win32' ? 'node-windows' : process.platform === 'darwin' ? 'node-mac' : 'node-linux').Service;
const {
    info,
    verbose } = require('./print.js');

// Create a new service object.
const svc = new Service({
    name: 'Disk Space Monitor',
    script: `${path.join(__dirname, 'app.js')}`,
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', () => {
    verbose('Service uninstalled.');
});

info('Uninstalling service, please accept UAC prompts if any...');
svc.uninstall();
