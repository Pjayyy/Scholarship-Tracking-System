const { dispatchAnnouncement } = require("./announcementDispatcher");

/**
 * Usage:
 *   node testDispatchAnnouncement.js <announcementId>
 * Example:
 *   node testDispatchAnnouncement.js 1
 */
async function main() {
  const announcementId = process.argv[2];
  if (!announcementId) {
    console.error("Missing announcementId. Usage: node testDispatchAnnouncement.js <announcementId>");
    process.exit(1);
  }

  try {
    const result = await dispatchAnnouncement({ announcementId: Number(announcementId) });
    console.log("dispatch result:", result);
  } catch (e) {
    console.error("dispatch threw:", e?.message || e);
    process.exit(1);
  }
}

main();

