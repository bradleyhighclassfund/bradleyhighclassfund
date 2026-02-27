export default function ActionsPage() {
  const managerSales = [
    { ticker: "ORCL", name: "Oracle", action: "Sold by fund manager (discretionary sale)" },
    { ticker: "KKD", name: "Krispy Kreme", action: "Sold by fund manager (discretionary sale)" },
  ];

  const corporateExits = [
    {
      ticker: "TBL",
      name: "Timberland",
      action: "Exited via buyout / corporate transaction (not a discretionary fund sale)",
      notes: "If you want, we can add the date/counterparty once you provide it from the portfolio history document.",
    },
    // Add additional M&A / PE exits here as you identify them in the historical log.
  ];

  // “Lineage” table: map current tickers to predecessor/security lineage.
  // For items we can validate from public filings/press releases, we cite in the narrative above the table.
  const lineage = [
    {
      ticker: "XYZ",
      name: "Block, Inc.",
      lineage: "Formerly Square (SQ) → renamed/re-tickered to XYZ on the fund site",
      type: "Ticker change / rename",
    },
    {
      ticker: "TKO",
      name: "TKO Group Holdings",
      lineage: "WWE → combined into TKO (UFC + WWE transaction)",
      type: "Merger / reorganization",
    },
    {
      ticker: "FBIN",
      name: "Fortune Brands Innovations",
      lineage: "FO / FBHS → renamed/ticker change to FBIN",
      type: "Ticker change / rename",
    },
    {
      ticker: "MBC",
      name: "MasterBrand, Inc.",
      lineage: "Spin-off from Fortune Brands (separation created MBC as standalone)",
      type: "Spin-off",
    },
    {
      ticker: "VLTO",
      name: "Veralto",
      lineage: "Spin-off from Danaher (DHR) Environmental & Applied Solutions separation",
      type: "Spin-off",
    },
    {
      ticker: "SOLV",
      name: "Solventum",
      lineage: "Spin-off from 3M (MMM) Health Care business separation",
      type: "Spin-off",
    },
    {
      ticker: "GEHC",
      name: "GE HealthCare Technologies",
      lineage: "Spin-off / separation from General Electric (GE)",
      type: "Spin-off",
    },
    {
      ticker: "OGN",
      name: "Organon & Co.",
      lineage: "Spin-off from Merck (MRK)",
      type: "Spin-off",
    },
    {
      ticker: "PYPL",
      name: "PayPal",
      lineage: "Originally associated with eBay ecosystem; now held as standalone PYPL",
      type: "Corporate separation / ecosystem lineage",
    },
    {
      ticker: "DD",
      name: "DuPont de Nemours",
      lineage: "Dow/DuPont reorganization lineage (resulted in DD, DOW, CTVA)",
      type: "Corporate breakup / reorganization",
    },
    {
      ticker: "DOW",
      name: "Dow Inc.",
      lineage: "Dow/DuPont reorganization lineage (resulted in DD, DOW, CTVA)",
      type: "Corporate breakup / reorganization",
    },
    {
      ticker: "CTVA",
      name: "Corteva",
      lineage: "Dow/DuPont reorganization lineage (resulted in DD, DOW, CTVA)",
      type: "Corporate breakup / reorganization",
    },

    // If a holding is simply an original/direct purchase with no major corporate action to explain,
    // we list it as “Direct holding (no corporate action noted here)”.
    // You can expand this list over time or replace it with a fully automated map later.
    { ticker: "ABT", name: "Abbott Labs", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "ADBE", name: "Adobe", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "AMD", name: "Advanced Micro Devices", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "AMZN", name: "Amazon", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "BAH", name: "Booz Allen Hamilton", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "BBY", name: "Best Buy", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "BKR", name: "Baker Hughes", lineage: "Legacy Baker Hughes lineage reflected as BKR", type: "Corporate action / rename" },
    { ticker: "DE", name: "Deere & Co.", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "DG", name: "Dollar General", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "DHR", name: "Danaher", lineage: "Direct holding; also generated VLTO via spin-off", type: "Direct holding" },
    { ticker: "DIS", name: "Walt Disney", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "DUK", name: "Duke Energy", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "EBAY", name: "eBay", lineage: "Direct holding; PayPal ecosystem lineage also tracked separately", type: "Direct holding" },
    { ticker: "FIS", name: "Fidelity National Information Services", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "GE", name: "GE Aerospace", lineage: "Direct holding; also generated GEHC via separation", type: "Direct holding" },
    { ticker: "GM", name: "General Motors", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "GS", name: "Goldman Sachs", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "HON", name: "Honeywell", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "INTC", name: "Intel", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "MRK", name: "Merck", lineage: "Direct holding; also generated OGN via spin-off", type: "Direct holding" },
    { ticker: "MMM", name: "3M", lineage: "Direct holding; also generated SOLV via spin-off", type: "Direct holding" },
    { ticker: "MSFT", name: "Microsoft", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "NEE", name: "NextEra Energy", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "NVDA", name: "NVIDIA", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "OC", name: "Owens Corning", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "PG", name: "Procter & Gamble", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "RBLX", name: "Roblox", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "SHOP", name: "Shopify", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "SYK", name: "Stryker", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "TM", name: "Toyota Motor ADR", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "TSLA", name: "Tesla", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "ULTA", name: "Ulta Beauty", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "UPS", name: "United Parcel Service", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "WFC", name: "Wells Fargo", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "WM", name: "Waste Management", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
    { ticker: "WMT", name: "Walmart", lineage: "Direct holding (no corporate action noted here)", type: "Direct holding" },
  ];

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "10px 10px",
    borderBottom: "1px solid #e5eaf3",
    color: "#0f172a",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 10px",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "top",
    color: "#334155",
  };

  const badgeStyle = (t: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "999px",
    border: "1px solid #dfe7f3",
    background: "#f8fbff",
    fontSize: "12px",
    color: "#0f172a",
    whiteSpace: "nowrap",
  });

  return (
    <main className="homeShell">
      <section className="contentCard">
        <h1 className="contentTitle">Actions</h1>

        <div className="prose">
          <p>
            This page documents portfolio transactions and corporate actions. Discretionary sales are explicitly labeled.
            All other removals reflect mergers, acquisitions, private equity buyouts, spin-offs, ticker changes, or other
            corporate reorganizations. Current holdings and tickers are listed on the Portfolio page. :contentReference[oaicite:3]{index=3}
          </p>

          <p>
            Several current tickers reflect corporate actions rather than discretionary trading (examples: FBIN and MBC
            from Fortune Brands actions; VLTO from Danaher; SOLV from 3M; TKO from the UFC/WWE transaction). :contentReference[oaicite:4]{index=4}
          </p>

          <p>
            Note: the Portfolio page currently flags missing quotes for ticker <strong>Q</strong>. :contentReference[oaicite:5]{index=5}
          </p>

          <h2 style={{ marginTop: 24 }}>Manager-initiated sales</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Ticker</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {managerSales.map((r) => (
                <tr key={r.ticker}>
                  <td style={tdStyle}>
                    <strong>{r.ticker}</strong>
                  </td>
                  <td style={tdStyle}>{r.name}</td>
                  <td style={tdStyle}>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: 28 }}>Corporate actions, M&amp;A, and buyout exits</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Ticker</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Exit mechanism</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {corporateExits.map((r) => (
                <tr key={r.ticker}>
                  <td style={tdStyle}>
                    <strong>{r.ticker}</strong>
                  </td>
                  <td style={tdStyle}>{r.name}</td>
                  <td style={tdStyle}>{r.action}</td>
                  <td style={tdStyle}>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: 28 }}>Holdings lineage map</h2>
          <p>
            This table maps each current holding to its lineage so you can trace every position back through ticker
            changes, spin-offs, and reorganizations. The goal is full auditability of the portfolio history.
          </p>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Ticker</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Lineage / mapping</th>
                <th style={thStyle}>Type</th>
              </tr>
            </thead>
            <tbody>
              {lineage
                .slice()
                .sort((a, b) => a.ticker.localeCompare(b.ticker))
                .map((r) => (
                  <tr key={r.ticker}>
                    <td style={tdStyle}>
                      <strong>{r.ticker}</strong>
                    </td>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={tdStyle}>{r.lineage}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(r.type)}>{r.type}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
