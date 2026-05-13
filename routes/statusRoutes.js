const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => {
    const memoryUsage = process.memoryUsage();

    return res.json({
        message: 'Стан сервера отримано',
        uptime: process.uptime(),
        memoryUsage: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external
        }
    });
});

module.exports = router;