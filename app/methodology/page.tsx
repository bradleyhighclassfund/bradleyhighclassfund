export default function MethodologyPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Methodology</h1>

      <h3>Selection</h3>
      <p>Holdings are selected by students for educational purposes.</p>

      <h3>Portfolio Construction</h3>
      <ul>
        <li>Only ACTIVE positions are shown in the Portfolio page and included in totals/weights.</li>
        <li>Sold positions and buyouts are shown separately and excluded from live portfolio metrics.</li>
        <li>Quotes are delayed and refreshed on a schedule.</li>
      </ul>

      <h3>Corporate Actions</h3>
      <ul>
        <li>Splits: shares are adjusted by split ratio.</li>
        <li>Spin-offs: basis can be allocated using market-value allocation (when you enable it).</li>
        <li>Ticker changes: mapped explicitly (e.g., SQ → XYZ).</li>
      </ul>
    </main>
  );
}
