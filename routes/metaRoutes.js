const express = require('express');
const Role = require('../models/Role');
const ResourceType = require('../models/ResourceType');
const logError = require('../utils/logger');

const router = express.Router();

// GET /api/meta/roles
router.get('/roles', async (req, res) => {
    try {
        const roles = await Role.findAll({
            attributes: ['role_id', 'role_name'],
            order: [['role_id', 'ASC']]
        });

        return res.json({
            message: 'Ролі успішно отримано',
            roles
        });
    } catch (error) {
        logError(error, 'get-roles');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET /api/meta/resource-types
router.get('/resource-types', async (req, res) => {
    try {
        const resourceTypes = await ResourceType.findAll({
            attributes: ['type_id', 'type_name'],
            order: [['type_id', 'ASC']]
        });

        return res.json({
            message: 'Типи ресурсів успішно отримано',
            resourceTypes
        });
    } catch (error) {
        logError(error, 'get-resource-types');
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;