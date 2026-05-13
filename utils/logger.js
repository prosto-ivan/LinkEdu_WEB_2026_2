const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'errors.log');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: 'logs/app.log',
            level: 'info'
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        })
    ]
});

function logError(error, place = 'unknown') {
    logger.error({
        place,
        message: error.message,
        stack: error.stack
    });
}

module.exports = logError;
module.exports.logger = logger;

function logError(error, place = 'unknown') {
    logger.error({
        place,
        message: error.message,
        stack: error.stack
    });
}

module.exports = logError;
module.exports.logger = logger;