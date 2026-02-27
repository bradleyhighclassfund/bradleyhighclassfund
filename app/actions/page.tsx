export default function ActionsPage() {
  const managerSales = [
    { ticker: "ORCL", name: "Oracle", detail: "Sold by fund manager" },
    { ticker: "KKD", name: "Krispy Kreme", detail: "Sold by fund manager" },
  ];

  const corporateActions = [
    { ticker: "TBL", name: "Timberland", detail: "Exited via M&A / private equity buyout (not a discretionary sale)" },
    // Add additional M&A / buyout exits here as you identify them in the history document.
  ];

  const lineageMap = [
    { ticker: "XYZ", name: "Block, Inc.", mapping: "SQ → XYZ (ticker change / rename)" },
    { ticker: "FBIN", name: "Fortune Brands Innovations", mapping: "FBHS/FO → FBIN (ticker change / rename)" },
    { ticker: "MBC", name: "MasterBrand, Inc.", mapping: "Spin-off from Fortune Brands" },
    { ticker: "VLTO", name: "Veralto", mapping: "Spin-off from Danaher" },
    { ticker: "SOLV", name: "Solventum", mapping: "Spin-off from 3M" },
    { ticker: "GEHC", name: "GE HealthCare Technologies", mapping: "Spin-off from GE" },
    { ticker: "OGN", name: "Organon & Co.", mapping: "Spin-off from Merck" },
    { ticker: "TKO", name: "TKO Group Holdings", mapping: "WWE → TKO (reorganization/combination)" },
    { ticker: "DD", name: "DuPont de Nemours", mapping: "DowDuPont breakup lineage (DD/DOW/CTVA)" },
    { ticker: "DOW", name: "Dow Inc.", mapping: "DowDuPont breakup lineage (DD/DOW/CTVA)" },
    { ticker: "CTVA", name: "Corteva", mapping: "DowDuPont breakup lineage (DD/DOW/CTVA)" },
  ];

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
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

  return (
    <main className="homeShell">
      <section className="contentCard">
        <h1 className="contentTitle">Actions</h1>

        <div className="prose">
          <p>
            This page documents portfolio transactions and corporate actions. Only two discretionary sales have been
            executed by the fund manager (ORCL and KKD). All other removals reflect mergers, acquisitions, private
            equity buyouts, spin-offs, ticker changes, or related corporate reorganizations.
          </p>

          <h2 style={{ marginTop: 24 }}>Discretionary sales (fund manager)</h2>
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
                  <td style={tdStyle}>{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: 28 }}>M&amp;A / buyouts / corporate exits</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Exit mechanism</th>
              </tr>
            </thead>
            <tbody>
              {corporateActions.map((r) => (
                <tr key={r.ticker}>
                  <td style={tdStyle}>
                    <strong>{r.name}</strong>
                  </td>
                  <td style={tdStyle}>{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: 28 }}>Lineage map for current holdings</h2>
          <p>
            The goal of this table is auditability: each current ticker that reflects a corporate action is mapped back
            to its predecessor security.
          </p>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Current ticker</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Mapping</th>
              </tr>
            </thead>
            <tbody>
              {lineageMap
                .slice()
                .sort((a, b) => a.ticker.localeCompare(b.ticker))
                .map((r) => (
                  <tr key={r.ticker}>
                    <td style={tdStyle}>
                      <strong>{r.ticker}</strong>
                    </td>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={tdStyle}>{r.mapping}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          <p style={{ marginTop: 18 }}>
            Next step: we can extend this into a complete transaction ledger (with dates and source tickers) using the
            historical purchases and corporate-action notes from your portfolio history document.
          </p>
        </div>
      </section>
    </main>
  );
}
