// Backend bootstrap + routing registration
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

const db = require("./services/db.js");
const {
  isDocumentIntelligenceConfigured,
} = require("./services/documentIntelligence.js");
const {
  pollGmailAndIngest,
  isGmailIngestConfigured,
} = require("./services/gmailAnnouncements.js");
const {
  dispatchPendingAnnouncements,
  dispatchAnnouncement,
} = require("./services/announcementDispatcher.js");
const {
  initMqtt,
  isMqttEnabled,
  subscribeToAnnouncementIngested,
} = require("./services/mqttClient.js");

const { announcementEvents } = require("./events/announcementEvents.js");

// Routes
const authRoutes = require("./routes/auth.routes.js");
const studentRoutes = require("./routes/student.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const documentsRoutes = require("./routes/documents.routes.js");
const studentsRoutes = require("./routes/students.routes.js");
const attendanceRoutes = require("./routes/attendance.routes.js");
const qrRoutes = require("./routes/qr.routes.js");
const dashboardRoutes = require("./routes/dashboard.routes.js");


const app = express();




/* =========================
   LOGGER
========================= */
const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
  ],
});

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: {
    status: "error",
    message: "Too many requests",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return (
      req.ip === "::1" ||
      req.ip === "127.0.0.1" ||
      req.ip === "::ffff:127.0.0.1"
    );
  },
});
app.use(limiter);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

/* =========================
   ROUTES
========================= */
app.get("/health", (req, res) => res.json({ ok: true }));

app.use(authRoutes);
app.use(studentRoutes);
app.use(adminRoutes);
app.use(documentsRoutes);
app.use("/students", studentsRoutes);
app.use(attendanceRoutes);
app.use(qrRoutes);
app.use(dashboardRoutes);

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.log(err);
  res.status(500).json({ status: "error", message: "Server error" });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

async function startServer() {
  // Allow process to crash fast on DB connection issues
  await db.query("SELECT 1");

  app.listen(PORT, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);



    const cron = require("node-cron");

    // MQTT (optional): publish/subscribe announcement events for real-time integrations.
    if (isMqttEnabled()) {
      initMqtt();
      subscribeToAnnouncementIngested((msg) => {
        const announcementId = Number(msg?.announcementId);
        if (!announcementId) return;
        dispatchAnnouncement({ announcementId }).catch((e) => {
          // eslint-disable-next-line no-console
          console.error(
            "MQTT-triggered dispatch error:",
            e?.message || e
          );
        });
      });
    }

    // Gmail ingest polling (optional)
    if (isGmailIngestConfigured()) {
      const gmailCron = (process.env.GMAIL_POLL_CRON || "*/5 * * * *").trim();
      cron.schedule(gmailCron, () => {
        pollGmailAndIngest().catch((e) => {
          // eslint-disable-next-line no-console
          console.error("Gmail poll error:", e?.message || e);
        });
      });

      // Initial poll
      setTimeout(() => {
        pollGmailAndIngest().catch((e) => {
          // eslint-disable-next-line no-console
          console.error("Gmail initial poll:", e?.message || e);
        });
      }, 2000);
    }

    // Dispatch sweep for pending announcements
    const dispatchCron =
      (process.env.ANNOUNCEMENT_DISPATCH_CRON || "*/1 * * * * *").trim();
    cron.schedule(dispatchCron, () => {
      dispatchPendingAnnouncements({ limit: 10 }).catch((e) => {
        // eslint-disable-next-line no-console
        console.error(
          "Announcement dispatch sweep error:",
          e?.message || e
        );
      });
    });

    setTimeout(() => {
      dispatchPendingAnnouncements({ limit: 10 }).catch((e) => {
        // eslint-disable-next-line no-console
        console.error(
          "Announcement initial dispatch sweep error:",
          e?.message || e
        );
      });
    }, 2500);

    // eslint-disable-next-line no-console
    if (!isDocumentIntelligenceConfigured()) {
      // Documents route will return 503 when called, but this helps visibility.
      // eslint-disable-next-line no-console
      console.log(
        "Document Intelligence not configured (DOCUMENT_INTELLIGENCE_ENDPOINT / DOCUMENT_INTELLIGENCE_API_KEY)."
      );
    }

    // Ensure EventEmitter instance is reachable (referenced by SSE routes)
    void announcementEvents;
  });
}

startServer().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Unable to start backend:", e?.message || e);
  process.exit(1);
});

