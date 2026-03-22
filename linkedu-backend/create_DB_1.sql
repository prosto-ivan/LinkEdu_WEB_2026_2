CREATE DATABASE LinkEduHub;
 PRINT 'Database LinkEduHub created.';
GO

USE LinkEduHub;
GO

-- 2. Table Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        user_id       INT           PRIMARY KEY IDENTITY(1,1),
        username      NVARCHAR(50)  NOT NULL,
        email         NVARCHAR(100) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        role          NVARCHAR(20)  NOT NULL DEFAULT 'user',  -- 'admin', 'user', 'guest'
        settings_json NVARCHAR(MAX) NULL,
        createdAt     DATETIME2     NOT NULL DEFAULT GETDATE(),
        updatedAt     DATETIME2     NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table Users created.';
END
GO

-- 3. Table Resources (learning resources)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Resources')
BEGIN
    CREATE TABLE Resources (
        resource_id INT           PRIMARY KEY IDENTITY(1,1),
        title       NVARCHAR(255) NOT NULL,
        url         NVARCHAR(MAX) NOT NULL,
        description NVARCHAR(MAX) NULL,
        type        NVARCHAR(20)  NOT NULL,               -- 'video', 'article', 'course'
        status      NVARCHAR(20)  NOT NULL DEFAULT 'none', -- 'none', 'planned', 'learning', 'learned'
        created_by  INT           NULL,                   -- foreign key -> Users.user_id
        createdAt   DATETIME2     NOT NULL DEFAULT GETDATE(),
        updatedAt   DATETIME2     NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_Resources_Users
            FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
    );
    PRINT 'Table Resources created.';
END
GO

-- 4. Seed Data -- initial records for demonstration

-- Insert test users
INSERT INTO Users (username, email, password_hash, role)
VALUES
    ('admin_ivan',  'ivan@linkedu.ua',   'hash_admin123', 'admin'),
    ('user_oksana', 'oksana@linkedu.ua', 'hash_user456',  'user'),
    ('user_petro',  'petro@linkedu.ua',  'hash_user789',  'user');
GO

-- Insert learning resources (created_by = 1, i.e. admin_ivan)
INSERT INTO Resources (title, url, description, type, status, created_by)
VALUES
    ('JavaScript and TypeScript: Complete Guide',
     'https://example.com/js-ts',
     'Comprehensive course on modern JavaScript and TypeScript',
     'course', 'learning', 1),

    ('Spring Framework: Building REST API',
     'https://example.com/spring',
     'Video course on Spring Boot and REST',
     'video', 'none', 1),

    ('Python for Data Analysis',
     'https://example.com/python-data',
     'Pandas, NumPy, Matplotlib',
     'course', 'planned', 1),

    ('Design Patterns in IT',
     'https://example.com/patterns',
     'Classic GoF patterns with examples',
     'article', 'learned', 1),

    ('Git and GitHub Fundamentals',
     'https://example.com/git',
     'Version control for beginners',
     'video', 'none', 1),

    ('Algorithms and Data Structures',
     'https://example.com/algorithms',
     'Arrays, trees, graphs, complexity',
     'course', 'learned', 1),

    ('Docker Basics for Developers',
     'https://example.com/docker',
     'Application containerization',
     'video', 'planned', 1),

    ('Clean Code: Writing Principles',
     'https://example.com/clean-code',
     'Clean code principles by Robert Martin',
     'article', 'none', 1);
GO

-- 5. Demo SQL queries

-- SELECT: All resources
PRINT '--- SELECT: All resources ---';
SELECT resource_id, title, type, status FROM Resources;

-- SELECT: Courses only
PRINT '--- SELECT: Courses only ---';
SELECT title, status FROM Resources WHERE type = 'course';

-- SELECT with JOIN: Resources with their author (One-to-Many)
PRINT '--- SELECT JOIN: Resources with author ---';
SELECT
    r.resource_id,
    r.title,
    r.type,
    r.status,
    u.username AS author,
    u.email    AS author_email
FROM Resources r
LEFT JOIN Users u ON r.created_by = u.user_id;

-- INSERT: Add a new resource
PRINT '--- INSERT: New resource ---';
INSERT INTO Resources (title, url, description, type, status, created_by)
VALUES ('Sequelize ORM Basics', 'https://sequelize.org', 'ORM for Node.js', 'article', 'learning', 1);

-- UPDATE: Change status of a resource
PRINT '--- UPDATE: Update status ---';
UPDATE Resources
SET status = 'learned', updatedAt = GETDATE()
WHERE title = 'Git and GitHub Fundamentals';

SELECT title, status FROM Resources WHERE title = 'Git and GitHub Fundamentals';

-- DELETE: Remove the test resource
PRINT '--- DELETE: Remove resource ---';
DELETE FROM Resources WHERE title = 'Sequelize ORM Basics';

-- Final SELECT: check row counts
PRINT '--- Final SELECT: row counts ---';
SELECT 'Users'     AS TableName, COUNT(*) AS TotalRows FROM Users
UNION ALL
SELECT 'Resources' AS TableName, COUNT(*) AS TotalRows FROM Resources;
GO