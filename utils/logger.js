const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'errors.log');

function logError(error, place = 'unknown') {
    const time = new Date().toISOString();
    const message = `[${time}] [${place}] ${error.stack || error.message || error}\n`;

    fs.appendFileSync(logFilePath, message, 'utf8');
}

module.exports = logError;