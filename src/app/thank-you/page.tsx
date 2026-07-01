import Script from "next/script";

export default function ThankYou() {
  return (
    <>
      <Script id="google-ads-conversion" strategy="afterInteractive">
        {`gtag('event', 'conversion', {'send_to': 'AW-18276220135/FxAZCNOI7cYcEOf544pE'});`}
      </Script>
      <Script id="meta-pixel-purchase" strategy="afterInteractive">
        {`
          fbq('track', 'Purchase', {
            value: 29.00,
            currency: 'USD'
          });
        `}
      </Script>
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
        <a href="https://www.elevatespacesai.com/sign-in" style={{
          color: "#00B4B4",
          fontSize: "18px",
          textDecoration: "none"
        }}>
          Sign In to Get Started →
        </a>
      </div>
    </>
  );
}
