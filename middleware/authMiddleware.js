const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('../utils/tokenUtils');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Немає токена' });
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Невірний або протермінований токен' });
    }
}

module.exports = authMiddleware;