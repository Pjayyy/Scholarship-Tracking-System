-- Run once if your database already exists without this table:
-- mysql -u root -p scholarship_system < database/migrations/001_scholarship_announcements.sql

USE scholarship_system;

CREATE TABLE IF NOT EXISTS scholarship_announcements (

    id INT AUTO_INCREMENT PRIMARY KEY,

    source ENUM(
        'gmail',
        'manual'
    ) NOT NULL DEFAULT 'gmail',

    gmail_message_id VARCHAR(128) NULL,

    title VARCHAR(512) NOT NULL,

    body_text MEDIUMTEXT,

    from_address VARCHAR(512),

    received_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_gmail_message (gmail_message_id)

);
