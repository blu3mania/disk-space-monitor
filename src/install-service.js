import path from 'path';
import url from 'url';

import {
    warning,
    info,
    verbose } from './print.js';
import settings from './settings.json' assert {type: 'json'};

main();

function main() {
    // Dynamically import the module we need depending on current OS
    switch (process.platform) {
        case 'win32':
            import('node-windows')
            .then(module => installService(module.Service));
            break;

        case 'darwin':
            import('node-mac')
            .then(module => installService(module.Service));
            break;

        default:
            import('node-linux')
            .then(module => installService(module.Service));
            break;
    }
}

function installService(Service) {
    // Create a new service object.
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
    const svc = new Service({
        name: settings.service?.name ?? 'Disk Space Monitor',
        description: 'Monotr disk space usage and notify user by email or Windows Toast.',
        script: `${path.join(__dirname, 'app.js')}`,
        nodeOptions: [
            '--harmony',
            '--max_old_space_size=4096'
        ]
    });

    if (process.platform === 'win32') {
        if (settings.service?.account?.name && settings.service?.account?.password) {
            svc.logOnAs.account = settings.service.account.name;
            svc.logOnAs.password = settings.service.account.password;
            if (settings.service?.account?.domain) {
                svc.logOnAs.domain = settings.service.account.domain;
            }
        }
    } else if (process.platform !== 'darwin') {
        if (settings.service?.account?.user) {
            svc.user  = settings.service.account.user;
        }

        if (settings.service?.account?.group) {
            svc.group = settings.service.account.group;
        }
    }

    // Listen for the "install" event, which indicates the process is available as a service.
    svc.on('install', () => {
        verbose('Service installed.');
        info('Starting service, please accept UAC prompts if any...');
        svc.start();
    });

    svc.on('start', () => {
        verbose('Service started.');
    });

    svc.on('alreadyinstalled', () => {
        warning('Service is already installed!');
        info('Starting the service in case it is not running, please accept UAC prompts if any...');
        svc.start();
    });

    info('Installing service, please accept UAC prompts if any...');
    svc.install();
}
