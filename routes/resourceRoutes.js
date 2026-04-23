const express = require('express');
const Resource = require('../models/Resource');
const User = require('../models/User');
const ResourceType = require('../models/ResourceType');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const logError = require('../utils/logger');

const router = express.Router();

// GET ALL RESOURCES
router.get('/', async (req, res) => {
    try {
        const resources = await Resource.findAll({
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['user_id', 'username', 'email']
                },
                {
                    model: require('../models/ResourceType'),
                    as: 'resourceType',
                    attributes: ['type_id', 'type_name']
                }
            ],
            order: [['resource_id', 'ASC']]
        });

        return res.json({
            message: 'Список ресурсів успішно отримано',
            resources
        });
    } catch (error) {
        logError(error, 'get-resources');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET ONE RESOURCE
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resource = await Resource.findOne({
            where: { resource_id: id },
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['user_id', 'username', 'email']
                }
            ]
        });

        if (!resource) {
            return res.status(404).json({ message: 'Ресурс не знайдено' });
        }

        return res.json({
            message: 'Ресурс успішно отримано',
            resource
        });
    } catch (error) {
        logError(error, 'get-resource-by-id');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// CREATE RESOURCE (ADMIN ONLY)
router.post('/', authMiddleware, roleMiddleware(1), async (req, res) => {
    try {
        const { title, url, type_id } = req.body;

        if (!title || !url || !type_id) {
            return res.status(400).json({ message: 'Усі поля обов’язкові' });
        }

        const newResource = await Resource.create({
            title,
            url,
            type_id,
            created_by: req.user.user_id
        });

        return res.status(201).json({
            message: 'Ресурс успішно створено',
            resource: newResource
        });
    } catch (error) {
        logError(error, 'create-resource');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// UPDATE RESOURCE (ADMIN ONLY)
router.put('/:id', authMiddleware, roleMiddleware(1), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, type_id } = req.body;

        const resource = await Resource.findOne({
            where: { resource_id: id }
        });

        if (!resource) {
            return res.status(404).json({ message: 'Ресурс не знайдено' });
        }

        if (title) resource.title = title;
        if (url) resource.url = url;
        if (type_id) resource.type_id = type_id;

        await resource.save();

        return res.json({
            message: 'Ресурс успішно оновлено',
            resource
        });
    } catch (error) {
        logError(error, 'update-resource');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// DELETE RESOURCE (ADMIN ONLY)
router.delete('/:id', authMiddleware, roleMiddleware(1), async (req, res) => {
    try {
        const { id } = req.params;

        const resource = await Resource.findOne({
            where: { resource_id: id }
        });

        if (!resource) {
            return res.status(404).json({ message: 'Ресурс не знайдено' });
        }

        await resource.destroy();

        return res.json({
            message: 'Ресурс успішно видалено'
        });
    } catch (error) {
        logError(error, 'delete-resource');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;