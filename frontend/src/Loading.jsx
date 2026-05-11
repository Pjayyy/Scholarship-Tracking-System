function Loading() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#0f172a",
      color: "white"
    }}>
      
      <div style={{
        width: "60px",
        height: "60px",
        border: "6px solid #334155",
        borderTop: "6px solid #38bdf8",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />

      <h2 style={{ marginTop: "20px" }}>
        Loading Scholarship System...
      </h2>

      <p style={{ fontSize: "12px", opacity: 0.7 }}>
        Please wait...
      </p>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default Loading;