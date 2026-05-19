USE scholarship_system;

-- Track whether an announcement has had email dispatch attempted/sent
ALTER TABLE scholarship_announcements
  ADD COLUMN IF NOT EXISTS email_dispatched_at TIMESTAMP NULL AFTER created_at,
  ADD COLUMN IF NOT EXISTS dispatch_error TEXT NULL AFTER email_dispatched_at;

-- Ensure notifications table supports category to identify announcement type
-- (schema.sql currently has title/message/risk_level/is_read only)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS category VARCHAR(80) NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

