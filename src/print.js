'use strict';

const chalk = require('chalk');

const dateTimeFormatOprions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
};

function formatMessage(msg) {
    return `[${new Intl.DateTimeFormat('en-US', dateTimeFormatOprions).format(new Date())}] ${typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)}`;
}

function print(msg, color = chalk.white) {
    console.log(color(formatMessage(msg)));
}

function error(msg) {
    console.log(chalk.red(formatMessage(msg)));
}

function warning(msg) {
    console.log(chalk.yellow(formatMessage(msg)));
}

function info(msg) {
    console.log(chalk.cyan(formatMessage(msg)));
}

function verbose(msg) {
    console.log(chalk.green(formatMessage(msg)));
}

module.exports = {
    print,
    error,
    warning,
    info,
    verbose,
};
