Announcement dispatch implementation (portal + email)

Files added/updated:
- backend/announcementDispatcher.js
- backend/gmailAnnouncements.js (calls dispatch after inserting)
- database/migrations/002_announcement_dispatch.sql

Required env vars (SMTP):
- SMTP_HOST
- SMTP_PORT (optional, default 587)
- SMTP_SECURE (optional, true/false)
- SMTP_USER
- SMTP_PASS
- SMTP_FROM (optional; defaults to SMTP_USER)

Behavior:
- When a new row is inserted into scholarship_announcements, dispatchAnnouncement runs.
- It creates rows in notifications (per student) so students can read them later.
- It sends an email best-effort via SMTP and records success/failure on scholarship_announcements.

