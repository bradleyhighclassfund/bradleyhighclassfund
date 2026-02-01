export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Student-Selected Portfolio</h1>
      <p>
        This site displays the current active holdings of a student-selected portfolio with delayed quotes.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 24 }}>
        <a href="/portfolio" style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, textDecoration: "none", color: "inherit" }}>
          <h3 style={{ marginTop: 0 }}>Live Portfolio</h3>
          <p style={{ marginBottom: 0 }}>Holdings, market values, weights, last-updated timestamp.</p>
        </a>
        <a href="/sold" style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, textDecoration: "none", color: "inherit" }}>
          <h3 style={{ marginTop: 0 }}>Sold & Buyouts</h3>
          <p style={{ marginBottom: 0 }}>Displayed separately; excluded from live portfolio metrics.</p>
        </a>
        <a href="/methodology" style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, textDecoration: "none", color: "inherit" }}>
          <h3 style={{ marginTop: 0 }}>Methodology</h3>
          <p style={{ marginBottom: 0 }}>How holdings are selected and how corporate actions are handled.</p>
        </a>
      </div>
    </main>
  );
}
