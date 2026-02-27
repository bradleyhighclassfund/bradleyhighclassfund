import React from "react";

type Row = {
  ticker: string;
  name: string;
  mechanism: string;
  notes?: string;
};

type Edge = { from: string; to: string };

export default function ActionsPage() {
  // 1) Discretionary sales (only these were manager-initiated)
  const managerSales: Row[] = [
    { ticker: "ORCL", name: "Oracle", mechanism: "Sold by fund manager", notes: "Tax-related sale" },
    { ticker: "KKD", name: "Krispy Kreme", mechanism: "Sold by fund manager", notes: "Tax-related sale" },
  ];

  // 2) Exits that occurred via buyout / corporate transaction (not discretionary trading)
  const corporateExits: Row[] = [
    { ticker: "TBL", name: "Timberland", mechanism: "Private equity buyout / corporate transaction", notes: "Not a discretionary fund sale" },
  ];

  // 3) Current tickers that were NOT explicitly purchased under that ticker
  //    (These exist due to ticker changes, spin-offs, reorganizations, or other corporate actions.)
  //    NOTE: For some symbols (Q, MAGN, SOLS), mapping is intentionally labeled unresolved until we pin the predecessor.
  const inheritedHoldings: Row[] = [
    { ticker: "ACCO", name: "ACCO Brands", mechanism: "Inherited via corporate action", notes: "Predecessor mapping required in ledger" },
    { ticker: "AMCR", name: "Amcor", mechanism: "Inherited via corporate action", notes: "Predecessor mapping required in ledger" },
    { ticker: "CTVA", name: "Corteva", mechanism: "Inherited via corporate action", notes: "Corporate breakup lineage" },
    { ticker: "DD", name: "DuPont de Nemours", mechanism: "Inherited via corporate action", notes: "Corporate breakup lineage" },
    { ticker: "FBIN", name: "Fortune Brands Innovations", mechanism: "Ticker change / corporate evolution", notes: "From Fortune Brands lineage" },
    { ticker: "GEHC", name: "GE HealthCare Technologies", mechanism: "Spin-off / separation", notes: "From GE separation" },
    { ticker: "MBC", name: "MasterBrand", mechanism: "Spin-off / separation", notes: "From Fortune Brands separation" },
    { ticker: "OGN", name: "Organon & Co.", mechanism: "Spin-off / separation", notes: "From Merck separation" },
    { ticker: "SOLV", name: "Solventum", mechanism: "Spin-off / separation", notes: "From 3M separation" },
    { ticker: "VLTO", name: "Veralto", mechanism: "Spin-off / separation", notes: "From Danaher separation" },
    { ticker: "TKO", name: "TKO Group Holdings", mechanism: "Reorganization / merger structure", notes: "From WWE conversion" },
    { ticker: "XYZ", name: "Block, Inc.", mechanism: "Ticker change / rename", notes: "From SQ mapping on the site" },
    { ticker: "UAA", name: "Under Armour (Class A)", mechanism: "Share class conversion", notes: "Explicit buy was UA; now tracked as UAA" },
    { ticker: "Q", name: "Unresolved", mechanism: "Unresolved corporate action", notes: "Needs predecessor ticker confirmed" },
    { ticker: "MAGN", name: "Unresolved", mechanism: "Unresolved corporate action", notes: "Needs predecessor ticker confirmed" },
    { ticker: "SOLS", name: "Unresolved", mechanism: "Unresolved corporate action", notes: "Needs predecessor ticker confirmed" },
  ];

  // ---- Diagram model ----
  // We show a “tree” from explicit buys (roots) to current corporate-action tickers (leaves).
  // Unresolved tickers go into a separate bucket so the page is honest and auditable.
  const nodes = [
    // Roots (explicit buys in the purchase ledger)
    "FO",
    "DOW",
    "GE",
    "MMM",
    "DHR",
    "MRK",
    "WWE",
    "SQ",
    "UA",
    "BERY",

    // Corporate action outcomes
    "FBIN",
    "MBC",
    "ACCO",
    "DD",
    "CTVA",
    "GEHC",
    "SOLV",
    "VLTO",
    "OGN",
    "TKO",
    "XYZ",
    "UAA",
    "AMCR",

    // Unresolved
    "Q",
    "MAGN",
    "SOLS",
  ];

  const edges: Edge[] = [
    // Fortune Brands lineage (FO → FBIN / MBC / legacy outcomes)
    { from: "FO", to: "FBIN" },
    { from: "FO", to: "MBC" },
    { from: "FO", to: "ACCO" },

    // Dow/DuPont breakup lineage (DOW → DD / CTVA)
    { from: "DOW", to: "DD" },
    { from: "DOW", to: "CTVA" },

    // GE separation
    { from: "GE", to: "GEHC" },

    // 3M separation
    { from: "MMM", to: "SOLV" },

    // Danaher separation
    { from: "DHR", to: "VLTO" },

    // Merck separation
    { from: "MRK", to: "OGN" },

    // WWE conversion
    { from: "WWE", to: "TKO" },

    // SQ → XYZ mapping (as implemented on the site)
    { from: "SQ", to: "XYZ" },

    // Under Armour share class conversion
    { from: "UA", to: "UAA" },

    // Materials lineage placeholder
    { from: "BERY", to: "AMCR" },

    // Unresolved bucket (visual grouping only)
    { from: "AMCR", to: "MAGN" },
    { from: "AMCR", to: "SOLS" },
    { from: "AMCR", to: "Q" },
  ];

  // ---- Rendering helpers ----
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
              <td style={tdStyle}>
                <strong>{r.ticker}</strong>
              </td>
              <td style={tdStyle}>{r.name}</td>
              <td style={tdStyle}>
                <span style={badge(r.mechanism)}>{r.mechanism}</span>
              </td>
              <td style={tdStyle}>{r.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // ---- Simple SVG diagram ----
  // Layout: left column = explicit buys (roots), middle = corporate-action outcomes, right = unresolved bucket
  const svgW = 1060;
  const svgH = 520;

  const root = ["FO", "DOW", "GE", "MMM", "DHR", "MRK", "WWE", "SQ", "UA", "BERY"];
  const mid = ["FBIN", "MBC", "ACCO", "DD", "CTVA", "GEHC", "SOLV", "VLTO", "OGN", "TKO", "XYZ", "UAA", "AMCR"];
  const unresolved = ["Q", "MAGN", "SOLS"];

  const pos: Record<string, { x: number; y: number }> = {};

  function placeColumn(items: string[], x: number, top: number, gap: number) {
    items.forEach((id, i) => {
      pos[id] = { x, y: top + i * gap };
    });
  }

  placeColumn(root, 120, 60, 40);
  placeColumn(mid, 520, 40, 34);
  placeColumn(unresolved, 920, 140, 54);

  const nodeW = 110;
  const nodeH = 26;

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

  function drawNode(id: string, label: string, tone: "root" | "mid" | "unresolved") {
    const p = pos[id];
    if (!p) return null;

    const x = p.x - nodeW / 2;
    const y = p.y - nodeH / 2;

    const fill =
      tone === "root" ? "#eef6ff" : tone === "mid" ? "#f7fbff" : "#fff4f4";

    const stroke =
      tone === "unresolved" ? "#e6a7a7" : "#bcd0ee";

    const textFill = "#0f172a";

    return (
      <g key={`node-${id}`}>
        <rect x={x} y={y} width={nodeW} height={nodeH} rx={10} fill={fill} stroke={stroke} />
        <text
          x={p.x}
          y={p.y + 4}
          textAnchor="middle"
          fontSize="12"
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
          fill={textFill}
        >
          {label}
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
            This page documents portfolio actions and corporate actions. The fund follows a buy-and-hold approach; the
            majority of new tickers arise from spin-offs, mergers, ticker changes, and reorganizations rather than
            discretionary trading.
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
              {/* Column labels */}
              <text x="120" y="24" textAnchor="middle" fontSize="12" fill="#334155" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Explicit buys (roots)
              </text>
              <text x="520" y="24" textAnchor="middle" fontSize="12" fill="#334155" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Current corporate-action tickers
              </text>
              <text x="920" y="24" textAnchor="middle" fontSize="12" fill="#334155" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Unresolved mapping
              </text>

              {/* Edges */}
              {edges.map(drawEdge)}

              {/* Nodes */}
              {root.map((id) => drawNode(id, id, "root"))}
              {mid.map((id) => drawNode(id, id, "mid"))}
              {unresolved.map((id) => drawNode(id, id, "unresolved"))}
            </svg>
          </div>

          <p style={{ marginTop: 10 }}>
            Unresolved items (Q, MAGN, SOLS) remain in the diagram until the predecessor ticker and transaction pathway
            are confirmed from the historical ledger. This avoids inventing mappings.
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

          <SectionTitle>How this maps every position</SectionTitle>
          <p>
            The Actions page has two roles:
          </p>
          <ul>
            <li>Identify the only discretionary sales (ORCL, KKD).</li>
            <li>Provide a traceable lineage from explicit buys to today&apos;s holdings, including corporate-action tickers.</li>
          </ul>

          <p style={{ marginTop: 10 }}>
            Next step: if you want a complete audit trail (dates, predecessor tickers, and transaction events for every item),
            we can extend this page to ingest a machine-readable ledger (CSV/JSON) and auto-generate the lineage map.
          </p>
        </div>
      </section>
    </main>
  );
}
