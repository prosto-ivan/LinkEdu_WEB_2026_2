const { logger } = require('../utils/logger');

function performanceMiddleware(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        logger.info({
            type: 'performance',
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });

    next();
}

module.exports = performanceMiddleware;