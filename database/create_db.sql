-- Create scholarship_system database and tables
-- Run: mysql -u root < create_db.sql

CREATE DATABASE IF NOT EXISTS scholarship_system;
USE scholarship_system;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  course VARCHAR(255) NOT NULL,
  year_level VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  time_in DATETIME NOT NULL,
  status ENUM('Present', 'Absent') DEFAULT 'Present',
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);


-- Sample admin user (plain password: password123)
INSERT IGNORE INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@admin.com', 'password123', 'admin');

-- Verify
SELECT * FROM users;
SHOW TABLES;
