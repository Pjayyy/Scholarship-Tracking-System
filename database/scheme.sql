-- =========================================
-- SCHOLARSHIP TRACKING SYSTEM DATABASE
-- TES + TDP ONLY VERSION
-- =========================================

CREATE DATABASE IF NOT EXISTS scholarship_system;

USE scholarship_system;

-- =========================================
-- USERS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS users (

    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id VARCHAR(50) NULL,

    name VARCHAR(255) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

    role ENUM(
        'admin',
        'student'
    ) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    last_login TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- SCHOLARSHIP PROGRAMS
-- =========================================
CREATE TABLE IF NOT EXISTS scholarship_programs (

    id INT AUTO_INCREMENT PRIMARY KEY,

    program_name VARCHAR(255) NOT NULL,

    sponsor VARCHAR(255),

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- STUDENTS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS students (

    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id VARCHAR(50) UNIQUE NOT NULL,

    award_number VARCHAR(100) UNIQUE,

    name VARCHAR(255) NOT NULL,

    sex ENUM(
        'Male',
        'Female'
    ),

    birthdate DATE,

    email VARCHAR(255),

    contact_number VARCHAR(50),

    address TEXT,

    guardian_name VARCHAR(255),

    guardian_contact VARCHAR(50),

    course VARCHAR(255) NOT NULL,

    year_level VARCHAR(50) NOT NULL,

    semester VARCHAR(50),

    academic_year VARCHAR(50),

    scholarship_type ENUM(
        'TES',
        'TDP'
    ) NOT NULL,

    scholarship_status ENUM(
        'Active',
        'Pending',
        'Suspended',
        'Graduated'
    ) DEFAULT 'Active',

    qr_code TEXT,

    profile_picture TEXT,

    scholarship_program_id INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (scholarship_program_id)
    REFERENCES scholarship_programs(id)

);

-- =========================================
-- ATTENDANCE LOGS
-- =========================================
CREATE TABLE IF NOT EXISTS attendance_logs (

    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id VARCHAR(50) NOT NULL,

    attendance_date DATE NOT NULL,

    time_in DATETIME NOT NULL,

    semester VARCHAR(50),

    academic_year VARCHAR(50),

    status ENUM(
        'Present',
        'Late',
        'Absent'
    ) DEFAULT 'Present',

    remarks VARCHAR(255),

    scan_type ENUM(
        'QR',
        'Manual'
    ) DEFAULT 'QR',

    mqtt_status VARCHAR(50),

    device_info TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
    REFERENCES students(student_id),

    CONSTRAINT unique_attendance
    UNIQUE(student_id, attendance_date)
);

-- =========================================
-- FORECAST TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS forecasts (

    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id VARCHAR(50),

    gpa DECIMAL(3,2),

    attendance_rate DECIMAL(5,2),

    risk_level ENUM(
        'SAFE',
        'WARNING',
        'AT RISK'
    ),

    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
);

-- =========================================
-- NOTIFICATIONS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS notifications (

    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id VARCHAR(50),

    title VARCHAR(255),

    message TEXT,

    risk_level ENUM(
        'SAFE',
        'WARNING',
        'AT RISK',
        'INFO'
    ),

    category VARCHAR(80) NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
);


-- =========================================
-- SCHOLARSHIP ANNOUNCEMENTS (e.g. Gmail ingest)
-- =========================================
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

-- =========================================
-- MQTT LOGS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS mqtt_logs (

    id INT AUTO_INCREMENT PRIMARY KEY,

    topic VARCHAR(255),

    payload TEXT,

    status VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX idx_student_id
ON attendance_logs(student_id);

CREATE INDEX idx_attendance_date
ON attendance_logs(attendance_date);

CREATE INDEX idx_risk_level
ON forecasts(risk_level);

-- =========================================
-- TES + TDP PROGRAMS ONLY
-- =========================================
INSERT IGNORE INTO scholarship_programs
(
    id,
    program_name,
    sponsor,
    description
)
VALUES
(
    1,
    'TES',
    'CHED',
    'Tertiary Education Subsidy Program'
),
(
    2,
    'TDP',
    'CHED',
    'Tulong Dunong Program'
);

-- =========================================
-- SAMPLE ADMIN USER
-- PASSWORD: password123
-- =========================================
INSERT IGNORE INTO users
(
    id,
    name,
    email,
    password,
    role
)
VALUES
(
    1,
    'Admin User',
    'admin@admin.com',
    'password123',
    'admin'
);
-- NOTE: Student portal login uses `users` table.
-- Add student grantee accounts here (one row per student), with `role='student'` and `student_id` matching `students.student_id`.
-- Generated test accounts (use INSERT IGNORE so it won’t fail if already present).
INSERT IGNORE INTO users (name, email, password, role, student_id) VALUES
('Philip, Justine, Gunda', 'justine.gunda@example.com', 'password123', 'student', '23000802700'),
('Grace, Villanueva', 'grace.villanueva@example.com', 'password123', 'student', '2300092711'),
('Emmanuel, Cruz', 'emmanuel.cruz@example.com', 'password123', 'student', '2300092710'),
('Nina, Navarro', 'nina.navarro@example.com', 'password123', 'student', '2300092709'),
('Luis, Garcia', 'luis.garcia@example.com', 'password123', 'student', '2300092708'),
('Sophia, Ramirez', 'sophia.ramirez@example.com', 'password123', 'student', '2300092707'),
('Paul, Mendoza', 'paul.mendoza@example.com', 'password123', 'student', '2300092706'),
('Kelly, Reyes', 'kelly.reyes@example.com', 'password123', 'student', '2300092705'),
('Mark, Santos', 'mark.santos@example.com', 'password123', 'student', '2300092704'),
('Anne, Dela, Cruz', 'anne.cruz@example.com', 'password123', 'student', '2300092703'),
('John, Rivera', 'john.rivera@example.com', 'password123', 'student', '2300092702'),
('Maria, Santos', 'maria.santos@example.com', 'password123', 'student', '2300092701'),
('Pjong', 'pjong@example.com', 'password123', 'student', '2300092700');



-- =========================================
-- SAMPLE TES/TDP STUDENTS
-- =========================================
INSERT IGNORE INTO students
(
    student_id,
    award_number,
    name,
    sex,
    birthdate,
    email,
    contact_number,
    address,
    guardian_name,
    guardian_contact,
    course,
    year_level,
    semester,
    academic_year,
    scholarship_type,
    scholarship_status,
    scholarship_program_id
)
VALUES
(
    '2300092700',
    'TDP-2025-001',
    'Pjong',
    'Male',
    '2004-05-15',
    'pjong@example.com',
    '09123456789',
    'Tacloban City',
    'Pedro G.',
    '09998887777',
    'BSIT',
    '3rd Year',
    '2nd Semester',
    '2024-2025',
    'TDP',
    'Active',
    2
),
(
    '2300092701',
    'TES-2025-002',
    'Maria Santos',
    'Female',
    '2003-08-10',
    'maria@example.com',
    '09987654321',
    'Tacloban City',
    'Ana Santos',
    '09112223333',
    'BSCS',
    '2nd Year',
    '2nd Semester',
    '2024-2025',
    'TES',
    'Active',
    1
);

-- =========================================
-- ADDITIONAL SAMPLE STUDENTS (10)
-- =========================================
INSERT IGNORE INTO students
(
    student_id,
    award_number,
    name,
    sex,
    birthdate,
    email,
    contact_number,
    address,
    guardian_name,
    guardian_contact,
    course,
    year_level,
    semester,
    academic_year,
    scholarship_type,
    scholarship_status,
    scholarship_program_id
)
VALUES
(
    '2300092702',
    'TDP-2025-003',
    'John Rivera',
    'Male',
    '2004-01-20',
    'john.rivera@example.com',
    '09120000001',
    'Tacloban City',
    'Rosa Rivera',
    '09120000011',
    'BSIT',
    '1st Year',
    '2nd Semester',
    '2024-2025',
    'TDP',
    'Active',
    2
),
(
    '2300092703',
    'TDP-2025-004',
    'Anne Dela Cruz',
    'Female',
    '2004-02-15',
    'anne.delacruz@example.com',
    '09120000002',
    'Tacloban City',
    'Juan Dela Cruz',
    '09120000012',
    'BSCS',
    '2nd Year',
    '2nd Semester',
    '2024-2025',
    'TDP',
    'Active',
    2
),
(
    '2300092704',
    'TES-2025-005',
    'Mark Santos',
    'Male',
    '2003-03-10',
    'mark.santos@example.com',
    '09120000003',
    'Tacloban City',
    'Luisa Santos',
    '09120000013',
    'BSCS',
    '3rd Year',
    '2nd Semester',
    '2024-2025',
    'TES',
    'Pending',
    1
),
(
    '2300092705',
    'TES-2025-006',
    'Kelly Reyes',
    'Female',
    '2004-04-05',
    'kelly.reyes@example.com',
    '09120000004',
    'Tacloban City',
    'Henry Reyes',
    '09120000014',
    'BSIT',
    '1st Year',
    '2nd Semester',
    '2024-2025',
    'TES',
    'Active',
    1
),
(
    '2300092706',
    'TDP-2025-007',
    'Paul Mendoza',
    'Male',
    '2003-05-01',
    'paul.mendoza@example.com',
    '09120000005',
    'Tacloban City',
    'Cathy Mendoza',
    '09120000015',
    'BSHM',
    '2nd Year',
    '2nd Semester',
    '2024-2025',
    'TDP',
    'Active',
    2
),
(
    '2300092707',
    'TDP-2025-008',
    'Sophia Ramirez',
    'Female',
    '2004-06-18',
    'sophia.ramirez@example.com',
    '09120000006',
    'Tacloban City',
    'Miguel Ramirez',
    '09120000016',
    'BSBA',
    '3rd Year',
    '2nd Semester',
    '2024-2025',
    'TDP',
    'Suspended',
    2
),
(
    '2300092708',
    'TES-2025-009',
    'Luis Garcia',
    'Male',
    '2002-07-22',
    'luis.garcia@example.com',
    '09120000007',
    'Tacloban City',
    'Marites Garcia',
    '09120000017',
    'WAD',
    '1st Year',
    '2nd Semester',
    '2024-2025',
    'TES',
    'Active',
    1
),
(
    '2300092709',
    'TES-2025-010',
    'Nina Navarro',
    'Female',
    '2003-08-12',
    'nina.navarro@example.com',
    '09120000008',
    'Tacloban City',
    'Oscar Navarro',
    '09120000018',
    'BSHM',
    '2nd Year',
    '2nd Semester',
    '2024-2025',
    'TES',
    'Pending',
    1
),
(
    '2300092710',
    'TDP-2025-011',
    'Emmanuel Cruz',
    'Male',
    '2004-09-09',
    'emmanuel.cruz@example.com',
    '09120000009',
    'Tacloban City',
    'Maria Cruz',
    '09120000019',
    'BSCS',
    '1st Year',
    '2nd Semester',
    '2024-2025',
    'TDP',
    'Active',
    2
),
(
    '2300092711',
    'TDP-2025-012',
    'Grace Villanueva',
    'Female',
    '2003-10-30',
    'grace.villanueva@example.com',
    '09120000010',
    'Tacloban City',
    'Jose Villanueva',
    '09120000020',
    'BSIT',
    '3rd Year',
    '2nd Semester',
    '2024-2025',
    'TDP',
    'Graduated',
    2
);

-- =========================================
-- SAMPLE ATTENDANCE
-- =========================================
INSERT IGNORE INTO attendance_logs
(
    student_id,
    attendance_date,
    time_in,
    semester,
    academic_year,
    status,
    scan_type
)
VALUES
(
    '2300092700',
    CURDATE(),
    NOW(),
    '2nd Semester',
    '2024-2025',
    'Present',
    'QR'
);

-- =========================================
-- SAMPLE FORECAST
-- =========================================
INSERT IGNORE INTO forecasts
(
    student_id,
    gpa,
    attendance_rate,
    risk_level
)
VALUES
(
    '2300092700',
    2.50,
    90.00,
    'SAFE'
);

-- =========================================
-- SAMPLE NOTIFICATION
-- =========================================
INSERT IGNORE INTO notifications
(
    student_id,
    title,
    message,
    risk_level
)
VALUES
(
    '2300092700',
    'Attendance Warning',
    'Student attendance dropped below 85%',
    'WARNING'
);

-- =========================================
-- VERIFY TABLES
-- =========================================
SHOW TABLES;

SELECT * FROM users;

SELECT * FROM students;

SELECT * FROM attendance_logs;

SELECT * FROM forecasts;

SELECT * FROM notifications;