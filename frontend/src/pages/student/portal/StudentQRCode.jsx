import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { FiDownload, FiRefreshCw, FiCopy, FiCheck } from "react-icons/fi";

function StudentQRCode({ studentData }) {
  const [qrCode, setQrCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    setLoading(true);
    try {
      const qrValue = `${studentData?.studentId}-${studentData?.awardNumber}`;
      const dataUrl = await QRCode.toDataURL(qrValue, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrCode(dataUrl);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
    setLoading(false);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `QR-${studentData?.studentId}.png`;
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${studentData?.studentId}-${studentData?.awardNumber}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "white",
          borderRadius: "1.5rem",
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ margin: "0 0 2rem", fontSize: "1.5rem", fontWeight: 700 }}>
          🔲 My QR Code
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            alignItems: "center",
          }}
        >
          {/* QR Code Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "1.5rem",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 50px rgba(102, 126, 234, 0.3)",
            }}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: "3rem" }}
              >
                ⚙️
              </motion.div>
            ) : (
              <>
                <div
                  style={{
                    background: "white",
                    padding: "1.5rem",
                    borderRadius: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <img
                    src={qrCode}
                    alt="Student QR Code"
                    style={{ width: "250px", height: "250px" }}
                  />
                </div>
                <div style={{ textAlign: "center", color: "white" }}>
                  <div style={{ fontSize: "0.95rem", opacity: 0.9 }}>
                    Student ID
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, marginTop: "0.25rem" }}>
                    {studentData?.studentId}
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* QR Code Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div
              style={{
                background: "#f0f9ff",
                borderRadius: "1rem",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                borderLeft: "4px solid #3b82f6",
              }}
            >
              <h3 style={{ margin: "0 0 1rem", fontSize: "1.05rem", fontWeight: 700 }}>
                📋 QR Code Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                    Student ID
                  </span>
                  <div style={{ fontSize: "1rem", fontWeight: 600, marginTop: "0.25rem" }}>
                    {studentData?.studentId}
                  </div>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                    Award Number
                  </span>
                  <div style={{ fontSize: "1rem", fontWeight: 600, marginTop: "0.25rem" }}>
                    {studentData?.awardNumber}
                  </div>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                    Status
                  </span>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      marginTop: "0.25rem",
                      color: "#22c55e",
                    }}
                  >
                    ✓ {studentData?.qrGenerated ? "Generated" : "Not Generated"}
                  </div>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                    Last Scan
                  </span>
                  <div style={{ fontSize: "1rem", fontWeight: 600, marginTop: "0.25rem" }}>
                    {studentData?.lastQrScan || "Not scanned yet"}
                  </div>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                    Total Scans
                  </span>
                  <div style={{ fontSize: "1rem", fontWeight: 600, marginTop: "0.25rem" }}>
                    {studentData?.totalScans}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "1rem",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                <FiDownload size={18} /> Download QR Code
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "1rem",
                  background: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                {copied ? (
                  <>
                    <FiCheck size={18} /> Copied!
                  </>
                ) : (
                  <>
                    <FiCopy size={18} /> Copy Student ID
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateQR}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "1rem",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "1rem",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <FiRefreshCw size={18} /> Regenerate QR Code
              </motion.button>
            </div>

            {/* Tips */}
            <div
              style={{
                marginTop: "2rem",
                padding: "1.25rem",
                background: "#fef3c7",
                borderRadius: "0.875rem",
                borderLeft: "4px solid #f59e0b",
              }}
            >
              <strong style={{ display: "block", marginBottom: "0.5rem" }}>
                💡 Usage Tips
              </strong>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.25rem",
                  color: "#6b7280",
                  fontSize: "0.9rem",
                }}
              >
                <li>Scan this QR code to view official announcements and requirements</li>
                <li>Keep your QR code confidential and do not share publicly</li>
                <li>You can regenerate your QR code if needed</li>
                <li>Download and save a copy for records</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default StudentQRCode;
