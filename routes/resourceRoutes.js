const express = require('express');
const { body } = require('express-validator');

const validateRequest = require('../middleware/validationMiddleware');

const Resource = require('../models/Resource');
const User = require('../models/User');
const ResourceType = require('../models/ResourceType');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const logError = require('../utils/logger');

const cache = require('../utils/cache');
const router = express.Router();

const resourceValidation = [
    body('title')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Назва ресурсу має містити мінімум 3 символи'),

    body('url')
        .trim()
        .isURL()
        .withMessage('URL має бути коректним посиланням'),

    body('type_id')
        .isInt({ min: 1 })
        .withMessage('Тип ресурсу має бути числовим ID')
];

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Отримати список навчальних ресурсів
 *     tags: [Resources]
 *     responses:
 *       200:
 *         description: Список ресурсів успішно отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 source:
 *                   type: string
 *                   example: database
 *                 resources:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Resource'
 *       500:
 *         description: Помилка сервера
 */

// GET ALL RESOURCES
router.get('/', async (req, res) => {
    try {
        const cacheKey = 'resources:list';

        const cachedResources = cache.get(cacheKey);

        if (cachedResources) {
            return res.json({
                message: 'Список ресурсів отримано з кешу',
                source: 'cache',
                resources: cachedResources
            });
        }

        const resources = await Resource.findAll({
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['user_id', 'username', 'email']
                },
                {
                    model: ResourceType,
                    as: 'resourceType',
                    attributes: ['type_id', 'type_name']
                }
            ],
            attributes: ['resource_id', 'title', 'url', 'type_id', 'created_by', 'createdAt'],
            order: [['resource_id', 'ASC']]
        });

        const plainResources = resources.map(resource => resource.toJSON());

        cache.set(cacheKey, plainResources);

        return res.json({
            message: 'Список ресурсів отримано з бази даних',
            source: 'database',
            resources: plainResources
        });

        cache.set(cacheKey, resources);

        return res.json({
            message: 'Список ресурсів отримано з бази даних',
            source: 'database',
            resources
        });
    } catch (error) {
        logError(error, 'get-resources');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * @swagger
 * /api/resources/{id}:
 *   get:
 *     summary: Отримати ресурс за ID
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ресурсу
 *     responses:
 *       200:
 *         description: Ресурс успішно отримано
 *       404:
 *         description: Ресурс не знайдено
 *       500:
 *         description: Помилка сервера
 */

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

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Створити новий ресурс
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - url
 *               - type_id
 *             properties:
 *               title:
 *                 type: string
 *                 example: JavaScript Course
 *               url:
 *                 type: string
 *                 example: https://example.com/course
 *               type_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Ресурс успішно створено
 *       400:
 *         description: Помилка валідації
 *       401:
 *         description: Немає токена
 *       403:
 *         description: Недостатньо прав доступу
 *       500:
 *         description: Помилка сервера
 */

// CREATE RESOURCE (ADMIN ONLY)
router.post('/', authMiddleware, roleMiddleware(1), resourceValidation, validateRequest, async (req, res) => {
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

        cache.del('resources:list');

        return res.status(201).json({
            message: 'Ресурс успішно створено',
            resource: newResource
        });
    } catch (error) {
        logError(error, 'create-resource');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * @swagger
 * /api/resources/{id}:
 *   put:
 *     summary: Оновити ресурс за ID
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ресурсу
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated JavaScript Course
 *               url:
 *                 type: string
 *                 example: https://example.com/updated-course
 *               type_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Ресурс успішно оновлено
 *       400:
 *         description: Помилка валідації
 *       401:
 *         description: Немає токена
 *       403:
 *         description: Недостатньо прав доступу
 *       404:
 *         description: Ресурс не знайдено
 *       500:
 *         description: Помилка сервера
 */

// UPDATE RESOURCE (ADMIN ONLY)
router.put('/:id', authMiddleware, roleMiddleware(1), resourceValidation, validateRequest, async (req, res) => {
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

        cache.del('resources:list');

        return res.json({
            message: 'Ресурс успішно оновлено',
            resource
        });
    } catch (error) {
        logError(error, 'update-resource');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * @swagger
 * /api/resources/{id}:
 *   delete:
 *     summary: Видалити ресурс за ID
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ресурсу
 *     responses:
 *       200:
 *         description: Ресурс успішно видалено
 *       401:
 *         description: Немає токена
 *       403:
 *         description: Недостатньо прав доступу
 *       404:
 *         description: Ресурс не знайдено
 *       500:
 *         description: Помилка сервера
 */

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

        cache.del('resources:list');

        return res.json({
            message: 'Ресурс успішно видалено'
        });
    } catch (error) {
        logError(error, 'delete-resource');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;