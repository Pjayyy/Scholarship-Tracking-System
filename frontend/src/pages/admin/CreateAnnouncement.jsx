import { useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import API from "../../services/api";

export default function CreateAnnouncement() {
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [source, setSource] = useState("admin");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();

    const t = String(title || "").trim();
    if (!t) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: t,
        bodyText: String(bodyText || ""),
        fromAddress: fromAddress ? String(fromAddress) : null,
        source: source ? String(source) : "admin",
      };

      const res = await API.post("/admin/announcements", payload);
      const announcementId = res?.data?.data?.announcementId;

      toast.success(
        announcementId
          ? `Announcement created (ID: ${announcementId})`
          : "Announcement created"
      );

      setTitle("");
      setBodyText("");
      setFromAddress("");
      setSource("admin");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <section className="futuristic-card">
        <div className="panel-head" style={{ marginBottom: 16 }}>
          <div className="panel-title">
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              Create Announcement (MQTT-enabled)
            </span>
          </div>
        </div>

        <form onSubmit={submit} className="form" style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Title *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Scholarship renewal deadline"
              required
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Body</span>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Announcement details..."
              rows={8}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>From Address (optional)</span>
              <input
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="sender@email.com"
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Source (optional)</span>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="admin"
              />
            </label>
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create & Dispatch"}
          </button>

          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Creating an announcement triggers dispatch immediately and publishes an MQTT event to
            <code> {" "}
              {"MQTT_TOPIC_BASE"}/announcements/ingested
            </code> (best-effort).
          </div>
        </form>
      </section>
    </motion.div>
  );
}

