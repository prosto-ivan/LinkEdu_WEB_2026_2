USE LinkEduHub;
GO

-- 1. INSERT: Додавання тестових даних у довідники та основні таблиці
PRINT '--- КРОК 1: INSERT (Додавання даних) ---';

-- Додаємо типи, якщо вони ще не створені
IF NOT EXISTS (SELECT 1 FROM ResourceTypes WHERE type_name = 'course')
    INSERT INTO ResourceTypes (type_name) VALUES ('video'), ('article'), ('course');

-- Додаємо тестового користувача
INSERT INTO Users (username, email, password_hash, role_id)
VALUES ('Ivan_Tester', 'ivan.test@edu.ua', 'hash_qwerty_123', 1);

-- Додаємо ресурси
INSERT INTO Resources (title, url, type_id, created_by)
VALUES 
('SQL Server Administration', 'https://learn.microsoft.com', 3, SCOPE_IDENTITY()),
('Node.js & Sequelize Guide', 'https://sequelize.org', 2, SCOPE_IDENTITY());

-- 2. SELECT: Отримання даних із використанням JOIN (вимога ЛР)
SELECT 
    r.resource_id AS [ID],
    r.title AS [Назва ресурсу],
    rt.type_name AS [Тип],
    u.username AS [Автор],
    r.createdAt AS [Дата створення]
FROM Resources r
JOIN ResourceTypes rt ON r.type_id = rt.type_id
JOIN Users u ON r.created_by = u.user_id;

-- 3. UPDATE: Оновлення назви ресурсу
UPDATE Resources 
SET title = 'Advanced MS SQL Server' 
WHERE title = 'SQL Server Administration';

-- Перевірка після оновлення
SELECT resource_id, title FROM Resources WHERE title LIKE 'Advanced%';

-- 4. DELETE: Видалення тестового ресурсу
DELETE FROM Resources WHERE title = 'Node.js & Sequelize Guide';

-- Фінальна перевірка таблиці Resources
SELECT * FROM Resources;