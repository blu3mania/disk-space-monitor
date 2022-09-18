'use strict';

const os = require('os');
const path = require('path');
const notifier = require('node-notifier');
const diskusage = require('diskusage');
const nodemailer = require('nodemailer');
const {
    error,
    warning,
    info,
    verbose } = require('./print.js');
const settings = require('./settings.json');

const NotificationType = {
    Email: 'email',
    Desktop: 'desktop',
};

const EmailFormat = {
    Html: 'html',
    Text: 'text',
};

const prefixes = [
    'k',
    'm',
    'g',
    't',
    'p',
];

let emailTransporter = null;

main();

function main() {
    verbose('Starting...');

    if (settings.notificationTypes.find(type => type.toLowerCase() === NotificationType.Email)) {
        emailTransporter = nodemailer.createTransport(settings.email.smtp);
    }

    checkDiskUsage();

    process.on('SIGINT', () => {
        warning('SIGINT received, exiting...');
        process.exit();
    });
}

function checkDiskUsage() {
    Promise.all(settings.disks.map((disk) =>
        diskusage.check(disk.path)
        .then((diskInfo) => {
            if (!disk.hasOwnProperty('thresholdInBytes')) {
                if (!calculateThresholdInBytes(disk, diskInfo)) {
                    return Promise.reject(`Invalid configuration "${disk.threshold}" for disk "${disk.path}".`);
                }
                disk.notificationTriggered = false;
                verbose(`Disk "${disk.path}" threshold "${disk.threshold}", which is ${disk.thresholdInBytes} bytes.`);
            }
            checkDiskFreeSpace(disk, diskInfo);
        })
    ))
    .then(() => {
        setTimeout(checkDiskUsage, settings.checkInterval * 1000);
    })
    .catch((err) => {
        error(err);
        error('Exiting...');
    });
}

function calculateThresholdInBytes(disk, diskInfo) {
    let bytes = 0;
    let invalidConfig = false;

    const value = parseFloat(disk.threshold);
    if (isNaN(value) || value <= 0) {
        // Configured value needs to be positive
        invalidConfig = true;
    } else {
        let prefixToCheck = null;
        let base = 1024;
        const lastChar = disk.threshold.slice(-1).toLowerCase();
        if (lastChar >= '0' && lastChar <= '9') {
            // In bytes
        } else if (lastChar === '%') {
            // In precentage
            if (value >= 100) {
                invalidConfig = true;
            } else {
                disk.thresholdInBytes = diskInfo.total * value / 100;
                disk.threshold = value + '%';
                return true;
            }
        } else if (lastChar === 'b') {
            // Check prefix type.
            prefixToCheck = disk.threshold.slice(-2, -1).toLowerCase();
            if (prefixToCheck >= '0' && prefixToCheck <= '9') {
                // In bytes
                prefixToCheck = null;
            } else if (prefixToCheck === 'i') {
                // Binary prefix
                base = 1024;
                prefixToCheck = disk.threshold.slice(-3, -2).toLowerCase();
            } else {
                // SI prefix
                base = 1000;
            }
        } else {
            // Prefix only (without 'B')
            prefixToCheck = lastChar;
        }

        if (prefixToCheck !== null) {
            const exponent = prefixes.findIndex(prefix => prefix === prefixToCheck) + 1;
            if (exponent === 0) {
                invalidConfig = true;
            } else {
                disk.thresholdInBytes = value * Math.pow(base, exponent);
                if (prefixToCheck === 'k' && base === 1000) {
                    // SI prefix for kilobytes is "k" (lowercase)
                    disk.threshold = value + 'k';
                } else {
                    disk.threshold = value + prefixToCheck.toUpperCase();
                    if (base === 1024) {
                        // Binary prefix
                        disk.threshold += 'i';
                    }
                }
                disk.threshold += 'B';
            }
        } else {
            disk.thresholdInBytes = value;
            disk.threshold = value + ' bytes';
        }
    }

    return !invalidConfig;
}

function checkDiskFreeSpace(disk, diskInfo) {
    if (diskInfo.free < disk.thresholdInBytes) {
        if (!disk.notificationTriggered) {
            disk.notificationTriggered = true;
            if (settings.notificationTypes.find(type => type.toLowerCase() === NotificationType.Email)) {
                warning(replaceMacro('Free space on disk {DISK} has dropped under {THRESHOLD}! Sending email notification...', disk, diskInfo));
                sendEmailNotification(disk, diskInfo);
            }
            if (settings.notificationTypes.find(type => type.toLowerCase() === NotificationType.Desktop)) {
                warning(replaceMacro('Free space on disk {DISK} has dropped under {THRESHOLD}! Showing desktop notification...', disk, diskInfo));
                sendDesktopNotification(disk, diskInfo);
            }
        }
    } else {
        disk.notificationTriggered = false;
    }
}

function sendEmailNotification(disk, diskInfo) {
    const message = {
        from: settings.email.from,
        to: settings.email.to,
        cc: settings.email.cc,
        bcc: settings.email.bcc,
        subject: replaceMacro(settings.email.subject, disk, diskInfo),
    };

    const body = replaceMacro(settings.email.body, disk, diskInfo);
    if (settings.email.format.toLowerCase() === EmailFormat.Text) {
        message.text = body;
    } else {
        message.html = body;
    }
    emailTransporter.sendMail(message, (err, inf) => {
        if (err) {
            error(err);
        } else {
            verbose(`Email sent: ${inf.response}`);
        }
    });
}

function replaceMacro(text, disk, diskInfo) {
    return text
        .replace(/({HOST})/gi, os.hostname())
        .replace(/({DISK})/gi, disk.path)
        .replace(/({THRESHOLD})/gi, disk.threshold)
        .replace(/({THRESHOLDBYTES})/gi, disk.thresholdInBytes.toLocaleString())
        .replace(/({TOTAL})/gi, diskInfo.total.toLocaleString())
        .replace(/({FREE})/gi, diskInfo.free.toLocaleString())
        .replace(/({AVAILABLE})/gi, diskInfo.available);
}

function sendDesktopNotification(disk, diskInfo) {
    notifier.notify({
        title: 'Low disk space warning',
        message: replaceMacro('Free space on disk {DISK} has dropped under {THRESHOLD}!', disk, diskInfo),
        appID: 'Disk Space Monitor',
        icon: getImagePath('low-disk-space.png'),
    });
}

function getImagePath(imageFile) {
    return path.join(__dirname, 'images', imageFile);
}
