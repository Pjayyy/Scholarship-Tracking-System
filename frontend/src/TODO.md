# TODO - Edit Grantee Record (Performance/Working Tabs)

- [ ] Implement Scholarship Information tab in `frontend/src/GranteeDashboard.jsx`
  - [ ] Add form controls for backend-supported scholarship fields
  - [ ] Persist via `PUT /students/:id`

- [ ] Implement Attendance tab (view-only)
  - [ ] Show student-specific attendance entries (filter from `/attendance/logs`)
  - [ ] Add basic refresh/loading states

- [ ] Fix QR Code tab to actually persist `qr_code`
  - [ ] Add `qr_code` input + use it in QR preview
  - [ ] Ensure Save persists to backend

- [ ] Ensure Personal Information tab saves consistently with backend supported fields

- [ ] Build / run checks
  - [ ] Frontend compile

