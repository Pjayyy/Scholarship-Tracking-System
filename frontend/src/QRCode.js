import { useState } from "react";
import QRCode from "qrcode";

function QRCodePage() {
  const [studentId, setStudentId] = useState("");
  const [qrImage, setQrImage] = useState("");

  const generateQR = async () => {
    try {
      const qr = await QRCode.toDataURL(studentId);
      setQrImage(qr);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Generate QR Code</h2>

      {/* INPUT */}
      <input
        type="text"
        placeholder="Enter Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        style={{ padding: 10, marginRight: 10 }}
      />

      {/* BUTTON */}
      <button onClick={generateQR}>
        Generate QR
      </button>

      {/* QR OUTPUT */}
      {qrImage && (
        <div style={{ marginTop: 20 }}>
          <img src={qrImage} alt="QR Code" />
        </div>
      )}
    </div>
  );
}

export default QRCodePage;