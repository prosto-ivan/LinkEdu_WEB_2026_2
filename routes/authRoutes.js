const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    generateAccessToken,
    generateRefreshToken,
    REFRESH_SECRET
} = require('../utils/tokenUtils');
const logError = require('../utils/logger');

const router = express.Router();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 1;

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword, role_id } = req.body;

        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "Усі поля обов'язкові" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Невірний email' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Пароль має містити мінімум 6 символів' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Паролі не співпадають' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Користувач з таким email вже існує' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = await User.create({
            username,
            email,
            password_hash: hashedPassword,
            role_id: role_id || 2,
            email_verification_token: emailVerificationToken,
            is_email_confirmed: false
        });

        return res.status(201).json({
            message: 'Користувача успішно зареєстровано',
            verificationToken: emailVerificationToken,
            user: {
                user_id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                role_id: newUser.role_id,
                is_email_confirmed: newUser.is_email_confirmed
            }
        });} catch (error) {
                logError(error, 'register');
                return res.status(500).json({ message: 'Помилка сервера' });
            }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email і пароль обов’язкові' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Користувача не знайдено' });
        }

        if (user.lock_until && new Date(user.lock_until) > new Date()) {
            return res.status(403).json({
                message: 'Акаунт тимчасово заблокований через велику кількість невдалих спроб входу'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            const attempts = user.failed_login_attempts + 1;

            let updateData = {
                failed_login_attempts: attempts
            };

            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                const lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
                updateData.lock_until = lockUntil;
            }

            await user.update(updateData);

            return res.status(400).json({
                message: 'Невірний пароль'
            });
        }

        await user.update({
            failed_login_attempts: 0,
            lock_until: null
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await user.update({
            refresh_token: refreshToken
        });

        return res.json({
            message: 'Авторизація успішна',
            accessToken,
            refreshToken
        });
    } catch (error) {
        logError(error, 'login');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// REFRESH TOKEN
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token відсутній' });
        }

        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

        const user = await User.findOne({
            where: {
                user_id: decoded.user_id,
                refresh_token: refreshToken
            }
        });

        if (!user) {
            return res.status(403).json({ message: 'Недійсний refresh token' });
        }

        const newAccessToken = generateAccessToken(user);

        return res.json({
            message: 'Новий access token згенеровано',
            accessToken: newAccessToken
        });
    } catch (error) {
        logError(error, 'refresh');
        return res.status(403).json({ message: 'Недійсний або протермінований refresh token' });
    }
});

// LOGOUT
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ where: { user_id: req.user.user_id } });

        if (!user) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        await user.update({
            refresh_token: null
        });

        return res.json({ message: 'Вихід із системи виконано успішно' });
    } catch (error) {
        logError(error, 'logout');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// PROFILE
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({
            where: { user_id: req.user.user_id },
            attributes: [
                'user_id',
                'username',
                'email',
                'role_id',
                'is_email_confirmed',
                'createdAt',
                'updatedAt'
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        return res.json({
            message: 'Доступ дозволено',
            user
        });
    } catch (error) {
        logError(error, 'profile');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// UPDATE PROFILE
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { username, email } = req.body;

        const user = await User.findOne({ where: { user_id: req.user.user_id } });

        if (!user) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({ message: 'Цей email уже використовується' });
            }

            const newVerificationToken = crypto.randomBytes(32).toString('hex');

            user.email = email;
            user.is_email_confirmed = false;
            user.email_verification_token = newVerificationToken;
        }

        if (username) {
            user.username = username;
        }

        await user.save();
   
        return res.json({
            message: 'Профіль успішно оновлено',
            verificationToken: user.is_email_confirmed ? null : user.email_verification_token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role_id: user.role_id,
                is_email_confirmed: user.is_email_confirmed
            }
        });
    } catch (error) {
        logError(error, 'update-profile');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// CHANGE PASSWORD
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ message: 'Усі поля обов’язкові' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Новий пароль має містити мінімум 6 символів' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: 'Нові паролі не співпадають' });
        }

        const user = await User.findOne({ where: { user_id: req.user.user_id } });

        if (!user) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password_hash);

        if (!isOldPasswordCorrect) {
            return res.status(400).json({ message: 'Старий пароль неправильний' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await user.update({
            password_hash: hashedPassword
        });

        return res.json({ message: 'Пароль успішно змінено' });
    } catch (error) {
        logError(error, 'change-password');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// DELETE USER (ADMIN ONLY)
router.delete('/user/:id', authMiddleware, roleMiddleware(1), async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({ where: { user_id: id } });

        if (!user) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        await user.destroy();

        return res.json({ message: 'Користувача успішно видалено' });
    } catch (error) {
        logError(error, 'delete-user');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email обов’язковий' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 хвилин

        await user.update({
            reset_password_token: resetToken,
            reset_password_expires: expires
        });

        return res.json({
            message: 'Токен для скидання пароля згенеровано',
            resetToken,
            expiresAt: expires
        });
    } catch (error) {
        logError(error, 'forgot-password');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmNewPassword } = req.body;

        if (!token || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ message: 'Усі поля обов’язкові' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Новий пароль має містити мінімум 6 символів' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: 'Паролі не співпадають' });
        }

        const user = await User.findOne({
            where: { reset_password_token: token }
        });

        if (!user) {
            return res.status(400).json({ message: 'Недійсний токен скидання пароля' });
        }

        if (!user.reset_password_expires || new Date(user.reset_password_expires) < new Date()) {
            return res.status(400).json({ message: 'Термін дії токена закінчився' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await user.update({
            password_hash: hashedPassword,
            reset_password_token: null,
            reset_password_expires: null
        });

        return res.json({ message: 'Пароль успішно скинуто' });
    } catch (error) {
        logError(error, 'reset-password');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

router.get('/verify-email', async (req, res) => {
    try {
        const { token, email } = req.query;

        if (!email) {
            return res.status(400).json({ message: 'Email відсутній' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        // 🔥 ГОЛОВНА ЗМІНА
        if (user.is_email_confirmed) {
            return res.json({ message: 'Вже підтверджено' });
        }

        if (!token) {
            return res.status(400).json({ message: 'Токен відсутній' });
        }

        if (user.email_verification_token !== token) {
            return res.status(400).json({
                message: 'Недійсний токен підтвердження email'
            });
        }

        await user.update({
            is_email_confirmed: true,
            email_verification_token: null
        });

        return res.json({
            message: 'Email успішно підтверджено'
        });

    } catch (error) {
        logError(error, 'verify-email');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET ALL USERS (ADMIN ONLY)
router.get('/users', authMiddleware, roleMiddleware(1), async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: [
                'user_id',
                'username',
                'email',
                'role_id',
                'is_email_confirmed',
                'createdAt'
            ],
            order: [['user_id', 'ASC']]
        });

        return res.json({
            message: 'Список користувачів успішно отримано',
            users
        });
    } catch (error) {
        logError(error, 'get-users');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;