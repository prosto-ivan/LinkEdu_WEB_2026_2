-- 1. Створення бази даних
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'LinkEduHub')
BEGIN
    CREATE DATABASE LinkEduHub;
END
GO

USE LinkEduHub;
GO

-- 2. Таблиця ролей
CREATE TABLE Roles (
    role_id INT PRIMARY KEY IDENTITY(1,1),
    role_name NVARCHAR(20) NOT NULL UNIQUE
);

-- 3. Таблиця користувачів
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    settings_json NVARCHAR(MAX), 
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);

-- 4. Таблиця категорій
CREATE TABLE Categories (
    category_id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL,
    color_hex NVARCHAR(7) DEFAULT '#ff3b30'
);

-- 5. Таблиця типів ресурсів
CREATE TABLE ResourceTypes (
    type_id INT PRIMARY KEY IDENTITY(1,1),
    type_name NVARCHAR(20) NOT NULL -- 'Video', 'Article', 'Course'
);

-- 6. Таблиця ресурсів (Зв'язок One-to-Many з Users через created_by)
CREATE TABLE Resources (
    resource_id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
    url NVARCHAR(MAX) NOT NULL,
    description NVARCHAR(MAX),
    type_id INT NOT NULL,
    category_id INT,
    created_by INT, 
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Resources_Types FOREIGN KEY (type_id) REFERENCES ResourceTypes(type_id),
    CONSTRAINT FK_Resources_Categories FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL,
    CONSTRAINT FK_Resources_Admin FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- 7. Таблиця персональних списків (UserResources)
CREATE TABLE UserResources (
    user_resource_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'planned', -- 'planned', 'learning', 'learned'
    last_visited_at DATETIME2 DEFAULT GETDATE(),
    is_favorite BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_UserResources_Users FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_UserResources_Resources FOREIGN KEY (resource_id) REFERENCES Resources(resource_id) ON DELETE CASCADE
);
GO

-- 8. Початкові дані (Seed Data) для тестування SELECT
INSERT INTO Roles (role_name) VALUES ('Admin'), ('User'), ('Guest');

INSERT INTO ResourceTypes (type_name) VALUES ('Video'), ('Article'), ('Course');

INSERT INTO Categories (name) VALUES ('Frontend'), ('Backend'), ('Design');
GO