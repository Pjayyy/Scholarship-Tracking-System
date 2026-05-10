## TODO - Backend for QR Attendance Modernization

- [x] Update DB schema: add `time_in DATETIME` and optional `remarks` to `attendance_logs`


- [x] Update `POST /attendance`:
  - [x] store `time_in = NOW()`
  - [x] compute `late` based on cutoff (default 08:00 AM)
  - [x] return enriched student preview data + time_in + late + remarks

- [x] Add endpoints:
  - [x] `GET /attendance/stats/today`
  - [x] `GET /attendance/logs` with search/status pagination
  - [x] `GET /attendance/export/csv` with same filters

- [ ] (Optional later) PDF export

