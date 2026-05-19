# Backend restructuring TODO

- [ ] Create backend/src folder structure
  - [ ] server bootstrap
  - [ ] routes/controllers/middleware/services/events
- [ ] Move existing domain modules into backend/src/services
  - [ ] db.js
  - [ ] documentIntelligence.js
  - [ ] gmailAnnouncements.js
  - [ ] announcementDispatcher.js
  - [ ] mqttClient.js
  - [ ] scholarshipRequirements.js
- [ ] Move event emitter into backend/src/events
  - [ ] announcementEvents.js
- [ ] Create authentication middleware in backend/src/middleware
- [ ] Extract multer documentUpload + document role middleware into backend/src/middleware
- [ ] Extract route handlers from backend/server.js into backend/src/routes + backend/src/controllers
- [ ] Convert backend/server.js into a shim that loads backend/src/server.js
- [ ] Update all require/import paths after moves
- [ ] Run backend smoke tests (npm start; hit key endpoints)

