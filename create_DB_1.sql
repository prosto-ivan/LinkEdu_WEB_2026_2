-- 1. Створення бази даних
CREATE DATABASE LinkEduHub;
GO

USE LinkEduHub;
GO

-- 2. Таблиця ролей (Admin, User)
CREATE TABLE Roles (
    role_id INT PRIMARY KEY IDENTITY(1,1),
    role_name NVARCHAR(20) NOT NULL UNIQUE -- 'Admin', 'User', 'Guest'
);

-- 3. Таблиця користувачів
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    settings_json NVARCHAR(MAX), -- Для збереження теми (light/dark)
    CONSTRAINT FK_Users_Roles FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);

-- 4. Таблиця категорій (Java, Дизайн, Математика тощо)
CREATE TABLE Categories (
    category_id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL,
    color_hex NVARCHAR(7) DEFAULT '#ff3b30'
);

-- 5. Таблиця типів ресурсів (Відео, Стаття, Курс)
CREATE TABLE ResourceTypes (
    type_id INT PRIMARY KEY IDENTITY(1,1),
    type_name NVARCHAR(20) NOT NULL -- 'Video', 'Article', 'Course'
);

-- 6. Таблиця ресурсів (Глобальний каталог)
CREATE TABLE Resources (
    resource_id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
    url NVARCHAR(MAX) NOT NULL,
    description NVARCHAR(MAX),
    type_id INT NOT NULL,
    category_id INT,
    created_by INT, -- ID адміна, який додав ресурс
    CONSTRAINT FK_Resources_Types FOREIGN KEY (type_id) REFERENCES ResourceTypes(type_id),
    CONSTRAINT FK_Resources_Categories FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL,
    CONSTRAINT FK_Resources_Admin FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

-- 7. Таблиця персональних списків та статусів (Мій план, Вчу, Вивчено)
-- Також містить дату останнього візиту для модуля "Останні відвідані"
CREATE TABLE UserResources (
    user_resource_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'planned', -- 'planned', 'learning', 'learned'
    last_visited_at DATETIME DEFAULT GETDATE(),
    is_favorite BIT DEFAULT 0,
    CONSTRAINT FK_UserResources_Users FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_UserResources_Resources FOREIGN KEY (resource_id) REFERENCES Resources(resource_id) ON DELETE CASCADE
);
GO

-- Додавання базових ролей та типів
INSERT INTO Roles (role_name) VALUES ('Admin'), ('User');
INSERT INTO ResourceTypes (type_name) VALUES ('Video'), ('Article'), ('Course');
GO