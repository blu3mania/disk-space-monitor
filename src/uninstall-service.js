import path from 'path';
import url from 'url';

import {
    info,
    verbose } from './print.js';
import settings from './settings.json' with {type: 'json'};

main();

function main() {
    // Dynamically import the module we need depending on current OS
    switch (process.platform) {
        case 'win32':
            import('node-windows')
            .then(module => uninstallService(module.Service));
            break;

        case 'darwin':
            import('node-mac')
            .then(module => uninstallService(module.Service));
            break;

        default:
            import('node-linux')
            .then(module => uninstallService(module.Service));
            break;
    }
}

function uninstallService(Service) {
    // Create a new service object.
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
    const svc = new Service({
        name: settings.service?.name ?? 'Disk Space Monitor',
        script: `${path.join(__dirname, 'app.js')}`,
    });

    // Listen for the "uninstall" event so we know when it's done.
    svc.on('uninstall', () => {
        verbose('Service uninstalled.');
    });

    info('Uninstalling service, please accept UAC prompts if any...');
    svc.uninstall();
}
