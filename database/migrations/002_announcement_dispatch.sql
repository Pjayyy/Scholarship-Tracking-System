USE scholarship_system;

-- Track whether an announcement has had email dispatch attempted/sent
ALTER TABLE scholarship_announcements
  MODIFY COLUMN source ENUM('gmail', 'manual', 'admin') NOT NULL DEFAULT 'gmail',
  ADD COLUMN IF NOT EXISTS email_dispatched_at TIMESTAMP NULL AFTER created_at,
  ADD COLUMN IF NOT EXISTS dispatch_error TEXT NULL AFTER email_dispatched_at;

-- Ensure notifications table supports category to identify announcement type
-- (schema.sql currently has title/message/risk_level/is_read only)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS category VARCHAR(80) NULL;

-- MQTT log table
-- Backend writes into:
--   mqtt_logs(announcement_id, event_type, payload_json, created_at)
-- Some older schema.sql versions may have different column names (topic/payload/status).
-- This migration makes the table match the backend contract.
CREATE TABLE IF NOT EXISTS mqtt_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT NULL,
  event_type VARCHAR(120) NOT NULL,
  payload_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mqtt_logs_announcement_id (announcement_id),
  INDEX idx_mqtt_logs_event_type (event_type)
);

-- If mqtt_logs already existed with older columns, add missing backend columns.
ALTER TABLE mqtt_logs
  ADD COLUMN IF NOT EXISTS announcement_id INT NULL,
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS payload_json JSON NULL;

-- Ensure indexes exist even if table was pre-created.
CREATE INDEX IF NOT EXISTS idx_mqtt_logs_announcement_id ON mqtt_logs(announcement_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_logs_event_type ON mqtt_logs(event_type);


-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);


