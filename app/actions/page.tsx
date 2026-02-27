import React from "react";

type Row = {
  ticker: string;
  name: string;
  mechanism: string;
  notes?: string;
};

type Edge = { from: string; to: string };

export default function ActionsPage() {
  // Discretionary sales (manager-initiated)
  const managerSales: Row[] = [
    { ticker: "ORCL", name: "Oracle", mechanism: "Sold by fund manager", notes: "Tax-related sale" },
    { ticker: "KKD", name: "Krispy Kreme", mechanism: "Sold by fund manager", notes: "Tax-related sale" },
  ];

  // Corporate exits (not discretionary trading)
  const corporateExits: Row[] = [
    { ticker: "TBL", name: "Timberland", mechanism: "Private equity buyout / corporate transaction", notes: "Not a discretionary fund sale" },
  ];

  // Current tickers NOT explicitly purchased under that ticker (corporate actions / inherited)
  const inheritedHoldings: Row[] = [
    { ticker: "ACCO", name: "ACCO Brands", mechanism: "Inherited via corporate action", notes: "Predecessor mapping to be confirmed in ledger" },
    { ticker: "AMCR", name: "Amcor", mechanism: "Inherited via corporate action", notes: "Predecessor mapping to be confirmed in ledger" },
    { ticker: "CTVA", name: "Corteva", mechanism: "Corporate breakup / reorganization", notes: "Derived from DOW/DowDuPont lineage" },
    { ticker: "DD", name: "DuPont de Nemours", mechanism: "Corporate breakup / reorganization", notes: "Derived from DOW/DowDuPont lineage" },
    { ticker: "FBIN", name: "Fortune Brands Innovations", mechanism: "Ticker change / corporate evolution", notes: "Derived from FO lineage" },
    { ticker: "GEHC", name: "GE HealthCare Technologies", mechanism: "Spin-off / separation", notes: "Derived from GE separation" },
    { ticker: "MBC", name: "MasterBrand", mechanism: "Spin-off / separation", notes: "Derived from Fortune Brands separation" },
    { ticker: "OGN", name: "Organon & Co.", mechanism: "Spin-off / separation", notes: "Derived from MRK separation" },
    { ticker: "SOLV", name: "Solventum", mechanism: "Spin-off / separation", notes: "Derived from MMM separation" },
    { ticker: "VLTO", name: "Veralto", mechanism: "Spin-off / separation", notes: "Derived from DHR separation" },
    { ticker: "TKO", name: "TKO Group Holdings", mechanism: "Reorganization / merger structure", notes: "Derived from WWE conversion" },
    { ticker: "XYZ", name: "Block, Inc.", mechanism: "Ticker change / rename", notes: "Derived from SQ mapping on the site" },
    { ticker: "UAA", name: "Under Armour (Class A)", mechanism: "Share class conversion", notes: "Explicit buy was UA; now tracked as UAA" },
    { ticker: "Q", name: "Unresolved", mechanism: "Unresolved corporate action", notes: "Needs predecessor ticker confirmed" },
    { ticker: "MAGN", name: "Unresolved", mechanism: "Unresolved corporate action", notes: "Needs predecessor ticker confirmed" },
    { ticker: "SOLS", name: "Unresolved", mechanism: "Unresolved corporate action", notes: "Needs predecessor ticker confirmed" },
  ];

  // Diagram model (roots = explicit buys; leaves = corporate-action tickers)
  const root = ["FO", "DOW", "GE", "MMM", "DHR", "MRK", "WWE", "SQ", "UA", "BERY"];
  const mid = ["FBIN", "MBC", "ACCO", "DD", "CTVA", "GEHC", "SOLV", "VLTO", "OGN", "TKO", "XYZ", "UAA", "AMCR"];
  const unresolved = ["Q", "MAGN", "SOLS"];

  const edges: Edge[] = [
    { from: "FO", to: "FBIN" },
    { from: "FO", to: "MBC" },
    { from: "FO", to: "ACCO" },

    { from: "DOW", to: "DD" },
    { from: "DOW", to: "CTVA" },

    { from: "GE", to: "GEHC" },
    { from: "MMM", to: "SOLV" },
    { from: "DHR", to: "VLTO" },
    { from: "MRK", to: "OGN" },

    { from: "WWE", to: "TKO" },
    { from: "SQ", to: "XYZ" },
    { from: "UA", to: "UAA" },

    { from: "BERY", to: "AMCR" },

    // Unresolved group (visual grouping only)
    { from: "AMCR", to: "Q" },
    { from: "AMCR", to: "MAGN" },
    { from: "AMCR", to: "SOLS" },
  ];

  // Styles
  const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
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
  const badge = (text: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    border: "1px solid #dfe7f3",
    background: "#f8fbff",
    fontSize: 12,
    color: "#0f172a",
    whiteSpace: "nowrap",
  });

  function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 style={{ marginTop: 26, marginBottom: 10 }}>{children}</h2>;
  }

  function RowTable({ rows }: { rows: Row[] }) {
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Ticker</th>
            <th style={thStyle}>Company</th>
            <th style={thStyle}>Action</th>
            <th style={thStyle}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.ticker}-${r.name}`}>
              <td style={tdStyle}><strong>{r.ticker}</strong></td>
              <td style={tdStyle}>{r.name}</td>
              <td style={tdStyle}><span style={badge(r.mechanism)}>{r.mechanism}</span></td>
              <td style={tdStyle}>{r.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // SVG layout
  const svgW = 1060;
  const svgH = 520;
  const nodeW = 110;
  const nodeH = 26;

  const pos: Record<string, { x: number; y: number }> = {};
  function placeColumn(items: string[], x: number, top: number, gap: number) {
    items.forEach((id, i) => (pos[id] = { x, y: top + i * gap }));
  }

  placeColumn(root, 120, 60, 40);
  placeColumn(mid, 520, 40, 34);
  placeColumn(unresolved, 920, 140, 54);

  function drawEdge(e: Edge) {
    const a = pos[e.from];
    const b = pos[e.to];
    if (!a || !b) return null;

    const x1 = a.x + nodeW / 2;
    const y1 = a.y;
    const x2 = b.x - nodeW / 2;
    const y2 = b.y;

    const mx = (x1 + x2) / 2;
    const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    return <path key={`${e.from}->${e.to}`} d={d} fill="none" stroke="#93a6c7" strokeWidth="2" />;
  }

  function drawNode(id: string, tone: "root" | "mid" | "unresolved") {
    const p = pos[id];
    if (!p) return null;
    const x = p.x - nodeW / 2;
    const y = p.y - nodeH / 2;

    const fill = tone === "root" ? "#eef6ff" : tone === "mid" ? "#f7fbff" : "#fff4f4";
    const stroke = tone === "unresolved" ? "#e6a7a7" : "#bcd0ee";

    return (
      <g key={`node-${id}`}>
        <rect x={x} y={y} width={nodeW} height={nodeH} rx={10} fill={fill} stroke={stroke} />
        <text
          x={p.x}
          y={p.y + 4}
          textAnchor="middle"
          fontSize="12"
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
          fill="#0f172a"
        >
          {id}
        </text>
      </g>
    );
  }

  return (
    <main className="homeShell">
      <section className="contentCard">
        <h1 className="contentTitle">Actions</h1>

        <div className="prose">
          <p>
            This page documents portfolio actions and corporate actions. The fund follows a buy-and-hold approach; most
            new tickers arise from spin-offs, mergers, ticker changes, and reorganizations rather than discretionary trading.
          </p>

          <SectionTitle>Diagram: lineage of corporate-action tickers</SectionTitle>
          <p>
            Left: explicit buys (roots). Middle: corporate-action outcomes currently held. Right: unresolved symbols that
            require predecessor confirmation (included for audit completeness).
          </p>

          <div
            style={{
              border: "1px solid #dfe7f3",
              borderRadius: 16,
              padding: 14,
              background: "#f8fbff",
              overflowX: "auto",
              marginTop: 10,
              marginBottom: 6,
            }}
          >
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label="Corporate action lineage diagram">
              <text x="120" y="24" textAnchor="middle" fontSize="12" fill="#334155" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Explicit buys (roots)
              </text>
              <text x="520" y="24" textAnchor="middle" fontSize="12" fill="#334155" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Current corporate-action tickers
              </text>
              <text x="920" y="24" textAnchor="middle" fontSize="12" fill="#334155" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Unresolved mapping
              </text>

              {edges.map(drawEdge)}

              {root.map((id) => drawNode(id, "root"))}
              {mid.map((id) => drawNode(id, "mid"))}
              {unresolved.map((id) => drawNode(id, "unresolved"))}
            </svg>
          </div>

          <p style={{ marginTop: 10 }}>
            Unresolved items (Q, MAGN, SOLS) remain in the diagram until the predecessor ticker and transaction pathway are confirmed
            from the historical ledger. This avoids inventing mappings.
          </p>

          <SectionTitle>Discretionary sales (fund manager)</SectionTitle>
          <RowTable rows={managerSales} />

          <SectionTitle>M&amp;A / private equity / corporate exits</SectionTitle>
          <RowTable rows={corporateExits} />

          <SectionTitle>Current positions not explicitly purchased under that ticker</SectionTitle>
          <p>
            These positions exist due to corporate actions (spin-offs, ticker changes, reorganizations, share-class conversions,
            and similar events). The explicit purchase was in a predecessor security.
          </p>
          <RowTable rows={inheritedHoldings} />
        </div>
      </section>
    </main>
  );
}
