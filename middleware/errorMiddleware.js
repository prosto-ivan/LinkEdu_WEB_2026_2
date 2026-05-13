const logError = require('../utils/logger');

function errorMiddleware(err, req, res, next) {
    logError(err, `${req.method} ${req.originalUrl}`);

    return res.status(err.status || 500).json({
        message: err.message || 'Помилка сервера'
    });
}

module.exports = errorMiddleware;