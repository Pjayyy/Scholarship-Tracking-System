import { useEffect } from "react";
import API from "./api";
import { Html5QrcodeScanner } from "html5-qrcode";

function QRScanner() {
  useEffect(() => {

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    const onScanSuccess = async (decodedText) => {

      try {

        // ✅ JWT TOKEN AUTOMATICALLY INCLUDED
        // Backend expects a value that can match:
        // - students.student_id
        // - students.qr_code
        // - students.award_number
        // We normalize by trimming whitespace.
        const qrValue = String(decodedText ?? "").trim();

        await API.post("/attendance", {
          student_id: qrValue,
        });

        alert("Attendance Recorded: " + decodedText);

      } catch (err) {

        console.error(err);

        const data = err.response?.data;
        const msg = data?.message || "Error recording attendance";
        const debug = data?.debug;
        const debugText = debug
          ? `\n\nDEBUG:\n${JSON.stringify(debug, null, 2)}`
          : "";

        alert(`QR Attendance failed: ${msg}${debugText}`);

        // Helpful in case alert is blocked
        console.log("ATTENDANCE_FAIL_DATA", data);

      }
    };

    scanner.render(onScanSuccess);

    // ✅ CLEANUP
    return () => {
      scanner
        .clear()
        .catch((error) => {
          console.error(
            "Scanner cleanup error:",
            error
          );
        });
    };

  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>QR Attendance Scanner</h2>

      <div id="reader"></div>
    </div>
  );
}

export default QRScanner;