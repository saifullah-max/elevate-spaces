export default function ThankYou() {
  return (
    <div style={{
      fontFamily: "Arial",
      textAlign: "center",
      padding: "80px 20px",
      backgroundColor: "#1A1A2E",
      minHeight: "100vh",
      color: "white"
    }}>
      <h1 style={{ color: "#4747C4", fontSize: "36px" }}>
        Welcome to Elevate Spaces AI!
      </h1>
      <p style={{ color: "#ccc", fontSize: "18px", margin: "20px 0" }}>
        You're all set. Let's start staging.
      </p>
      <a href="/dashboard" style={{
        color: "#00B4B4",
        fontSize: "18px",
        textDecoration: "none"
      }}>
        Go to Dashboard →
      </a>
    </div>
  );
}
