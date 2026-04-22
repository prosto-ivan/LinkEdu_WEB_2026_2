const jwt = require('jsonwebtoken');

const ACCESS_SECRET = 'access_secret_123';
const REFRESH_SECRET = 'refresh_secret_123';

function generateAccessToken(user) {
    return jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            username: user.username,
            role_id: user.role_id
        },
        ACCESS_SECRET,
        { expiresIn: '15m' }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            user_id: user.user_id,
            email: user.email
        },
        REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    ACCESS_SECRET,
    REFRESH_SECRET
};