CREATE DATABASE LinkEduHub;
GO
USE LinkEduHub;
GO

-- 1. Таблиця ролей
CREATE TABLE Roles (
    role_id INT PRIMARY KEY IDENTITY(1,1),
    role_name NVARCHAR(20) NOT NULL UNIQUE -- 'admin', 'user', 'guest'
);

-- 2. Таблиця типів ресурсів
CREATE TABLE ResourceTypes (
    type_id INT PRIMARY KEY IDENTITY(1,1),
    type_name NVARCHAR(20) NOT NULL UNIQUE -- 'video', 'article', 'course'
);

-- 3. Таблиця користувачів
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);

-- 4. Таблиця ресурсів (Каталог)
CREATE TABLE Resources (
    resource_id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
    url NVARCHAR(MAX) NOT NULL,
    type_id INT NOT NULL,
    created_by INT NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Resources_Types FOREIGN KEY (type_id) REFERENCES ResourceTypes(type_id),
    CONSTRAINT FK_Resources_Users FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

-- 5. Прогрес користувачів (UserResource - Many-to-Many)
CREATE TABLE UserResources (
    user_resource_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'planned', -- 'planned', 'learning', 'learned'
    last_visited_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_UR_Users FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_UR_Resources FOREIGN KEY (resource_id) REFERENCES Resources(resource_id) ON DELETE CASCADE
);

-- Початкові дані
INSERT INTO Roles (role_name) VALUES ('admin'), ('user'), ('guest');
INSERT INTO ResourceTypes (type_name) VALUES ('video'), ('article'), ('course');