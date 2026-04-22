function roleMiddleware(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role_id) {
            return res.status(403).json({ message: 'Доступ заборонено' });
        }

        if (!allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ message: 'Недостатньо прав доступу' });
        }

        next();
    };
}

module.exports = roleMiddleware;