const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const UserResource = require('../models/UserResource');
const Resource = require('../models/Resource');
const logError = require('../utils/logger');

const router = express.Router();

// Отримати всі статуси поточного користувача
router.get('/', authMiddleware, async (req, res) => {
    try {
        const items = await UserResource.findAll({
            where: { user_id: req.user.user_id }
        });

        return res.json({
            message: 'Статуси користувача отримано',
            items
        });
    } catch (error) {
        logError(error, 'get-user-resources');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// Створити або оновити статус ресурсу
router.post('/:resourceId', authMiddleware, async (req, res) => {
    try {
        const { resourceId } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['none', 'planned', 'learning', 'learned'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Недійсний статус' });
        }

        const resource = await Resource.findOne({
            where: { resource_id: resourceId }
        });

        if (!resource) {
            return res.status(404).json({ message: 'Ресурс не знайдено' });
        }

        let item = await UserResource.findOne({
            where: {
                user_id: req.user.user_id,
                resource_id: resourceId
            }
        });

        if (item) {
            item.status = status;
            await item.save();
        } else {
            item = await UserResource.create({
                user_id: req.user.user_id,
                resource_id: resourceId,
                status
            });
        }

        return res.json({
            message: 'Статус ресурсу оновлено',
            item
        });
    } catch (error) {
        logError(error, 'save-user-resource-status');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;