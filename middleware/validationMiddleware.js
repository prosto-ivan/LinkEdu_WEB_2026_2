const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Помилка валідації даних',
            errors: errors.array()
        });
    }

    next();
}

module.exports = validateRequest;