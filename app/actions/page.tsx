import React from "react";

type SimpleRow = { ticker: string; name: string; detail: string; notes?: string };
type MapRow = { fromTicker: string; fromName: string; toTicker: string; toName: string; mechanism: string; notes?: string };
type Edge = { from: string; to: string };

export default function ActionsPage() {
  // ---------- 1) Manager-initiated sales (explicit in the PDF narrative) ----------
  const managerSales: SimpleRow[] = [
    { ticker: "ORCL", name: "Oracle", detail: "Sold by fund manager (tax-related sale)" },
    { ticker: "KKD", name: "Krispy Kreme", detail: "Sold by fund manager (tax-related sale)" },
  ];

  // ---------- 2) Corporate exits (not discretionary trading) ----------
  const corporateExits: SimpleRow[] = [
    { ticker: "TBL", name: "Timberland", detail: "Exited via private equity / corporate transaction", notes: "Not a discretionary fund sale" },
  ];

  // ---------- 3) Mapped corporate actions (clean lineage from an explicit buy ticker to a current ticker) ----------
  // These are the ones we can document without inventing facts.
  const mappedCorporateActions: MapRow[] = [
    // Fortune Brands lineage (explicit buy ticker in PDF was FO)
    { fromTicker: "FO", fromName: "Fortune Brands", toTicker: "FBIN", toName: "Fortune Brands Innovations", mechanism: "Ticker change / corporate evolution", notes: "Derived from Fortune Brands lineage" },
    { fromTicker: "FO", fromName: "Fortune Brands", toTicker: "MBC", toName: "MasterBrand", mechanism: "Spin-off / separation", notes: "Corporate separation created a new ticker" },
    { fromTicker: "FO", fromName: "Fortune Brands", toTicker: "ACCO", toName: "ACCO Brands", mechanism: "Corporate action lineage", notes: "Predecessor chain to be confirmed in the transaction ledger" },

    // Square/Block mapping (explicit buy ticker in PDF was SQ; current ticker on your site is XYZ)
    { fromTicker: "SQ", fromName: "Square / Block", toTicker: "XYZ", toName: "Block, Inc.", mechanism: "Ticker change / rename", notes: "Site tracks legacy SQ holding as XYZ" },

    // WWE conversion to TKO
    { fromTicker: "WWE", fromName: "WWE", toTicker: "TKO", toName: "TKO Group Holdings", mechanism: "Reorganization / merger structure", notes: "Converted from WWE holding" },

    // Under Armour share-class evolution (explicit buy in PDF was UA; you currently hold UA and UAA)
    { fromTicker: "UA", fromName: "Under Armour", toTicker: "UAA", toName: "Under Armour (Class A)", mechanism: "Share class conversion / dual-class structure", notes: "Explicit buy was UA; UAA reflects share class structure" },

    // Baker Hughes (explicit buy in PDF was BHI; current ticker is BKR)
    { fromTicker: "BHI", fromName: "Baker Hughes", toTicker: "BKR", toName: "Baker Hughes", mechanism: "Ticker change / reorganization", notes: "Legacy BHI mapped to current BKR" },

    // Harley-Davidson (explicit buy in PDF listed as HDI; current ticker is HOG)
    { fromTicker: "HDI", fromName: "Harley-Davidson", toTicker: "HOG", toName: "Harley-Davidson", mechanism: "Ticker correction / legacy reference", notes: "PDF lists HDI; public ticker is HOG" },

    // Dow / DuPont breakup lineage (you explicitly bought DOW; you now also hold DD and CTVA)
    { fromTicker: "DOW", fromName: "Dow / DowDuPont lineage", toTicker: "DD", toName: "DuPont de Nemours", mechanism: "Corporate breakup / reorganization", notes: "Derived from DowDuPont breakup lineage" },
    { fromTicker: "DOW", fromName: "Dow / DowDuPont lineage", toTicker: "CTVA", toName: "Corteva", mechanism: "Corporate breakup / reorganization", notes: "Derived from DowDuPont breakup lineage" },

    // Spinoffs from explicit buy parents (present in your current holdings list)
    { fromTicker: "GE", fromName: "General Electric", toTicker: "GEHC", toName: "GE HealthCare Technologies", mechanism: "Spin-off / separation", notes: "Derived from GE separation" },
    { fromTicker: "MMM", fromName: "3M", toTicker: "SOLV", toName: "Solventum", mechanism: "Spin-off / separation", notes: "Derived from 3M separation" },
    { fromTicker: "DHR", fromName: "Danaher", toTicker: "VLTO", toName: "Veralto", mechanism: "Spin-off / separation", notes: "Derived from Danaher separation" },
    { fromTicker: "MRK", fromName: "Merck", toTicker: "OGN", toName: "Organon & Co.", mechanism: "Spin-off / separation", notes: "Derived from Merck separation" },

    // Materials lineage (explicit buy in PDF includes BERY; current holdings include AMCR, MAGN, SOLS)
    // We do NOT force a specific chain here until confirmed in your ledger.
    { fromTicker: "BERY", fromName: "Berry Global Group", toTicker: "AMCR", toName: "Amcor", mechanism: "Corporate action lineage (to be confirmed)", notes: "Predecessor chain requires confirmation" },
    { fromTicker: "BERY", fromName: "Berry Global Group", toTicker: "MAGN", toName: "Magnera", mechanism: "Corporate action lineage (unconfirmed)", notes: "Needs predecessor confirmation" },
    { fromTicker: "BERY", fromName: "Berry Global Group", toTicker: "SOLS", toName: "Solstice Advanced Materials", mechanism: "Corporate action lineage (unconfirmed)", notes: "Needs predecessor confirmation" },
  ];

  // ---------- 4) Unreconciled current holdings (in the portfolio today but not listed as explicit buys in the PDF table) ----------
  // These must be either (i) later purchases not captured in the PDF purchase table, or (ii) corporate actions we have not yet mapped.
  const unreconciledCurrentHoldings: SimpleRow[] = [
    { ticker: "AXON", name: "Axon Enterprise", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase or a mapped corporate action" },
    { ticker: "CLH", name: "Clean Harbors", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "ENB", name: "Enbridge", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "ISRG", name: "Intuitive Surgical", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "PYPL", name: "PayPal", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "RIVN", name: "Rivian", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "Q", name: "Qorvo", detail: "Missing quote on portfolio page; not listed as explicit buy ticker in PDF", notes: "Confirm predecessor / origin and why quote fetch fails" },
  ];

  // ---------- 5) Derived lists to ensure the page is complete and self-auditing ----------
  // Full set of “current tickers not listed as explicit buys” (for transparency)
  const fullNotExplicitSet = [
    "ACCO","AMCR","AXON","BKR","CLH","CTVA","DD","ENB","FBIN","GEHC","HOG","ISRG","MAGN","MBC","OGN","PYPL","Q","RIVN","SOLS","SOLV","TKO","UAA","VLTO","XYZ"
  ];

  // ---------- Diagram (SVG) ----------
  // Layout: Roots (explicit buys) -> Mapped corporate-action outcomes -> Unreconciled bucket
  const svgW = 1120;
  const svgH = 560;
  const nodeW = 120;
  const nodeH = 28;

  // Root tickers here are the explicit-buy tickers that generate mapped outcomes
  const roots = ["FO", "SQ", "WWE", "UA", "BHI", "HDI", "DOW", "GE", "MMM", "DHR", "MRK", "BERY"];
  const mapped = ["FBIN", "MBC", "ACCO", "XYZ", "TKO", "UAA", "BKR", "HOG", "DD", "CTVA", "GEHC", "SOLV", "VLTO", "OGN", "AMCR", "MAGN", "SOLS"];
  const unreconciled = ["AXON", "CLH", "ENB", "ISRG", "PYPL", "RIVN", "Q"];

  const edges: Edge[] = [
    { from: "FO", to: "FBIN" },
    { from: "FO", to: "MBC" },
    { from: "FO", to: "ACCO" },

    { from: "SQ", to: "XYZ" },
    { from: "WWE", to: "TKO" },
    { from: "UA", to: "UAA" },

    { from: "BHI", to: "BKR" },
    { from: "HDI", to: "HOG" },

    { from: "DOW", to: "DD" },
    { from: "DOW", to: "CTVA" },

    { from: "GE", to: "GEHC" },
    { from: "MMM", to: "SOLV" },
    { from: "DHR", to: "VLTO" },
    { from: "MRK", to: "OGN" },

    { from: "BERY", to: "AMCR" },
    { from: "BERY", to: "MAGN" },
    { from: "BERY", to: "SOLS" },
  ];

  const pos: Record<string, { x: number; y: number }> = {};
  const colX = { roots: 140, mapped: 560, unreconciled: 980 };

  function place(items: string[], x: number, top: number, gap: number) {
    items.forEach((id, i) => (pos[id] = { x, y: top + i * gap }));
  }

  place(roots, colX.roots, 60, 38);
  place(mapped, colX.mapped, 46, 30);
  place(unreconciled, colX.unreconciled, 140, 46);

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

  function nodeStyle(kind: "root" | "mapped" | "unreconciled") {
    if (kind === "root") return { fill: "#eef6ff", stroke: "#bcd0ee" };
    if (kind === "mapped") return { fill: "#f7fbff", stroke: "#bcd0ee" };
    return { fill: "#fff4f4", stroke: "#e6a7a7" };
  }

  function drawNode(id: string, kind: "root" | "mapped" | "unreconciled") {
    const p = pos[id];
    if (!p) return null;

    const x = p.x - nodeW / 2;
    const y = p.y - nodeH / 2;
    const s = nodeStyle(kind);

    return (
      <g key={`node-${id}`}>
        <rect x={x} y={y} width={nodeW} height={nodeH} rx={10} fill={s.fill} stroke={s.stroke} />
        <text
          x={p.x}
          y={p.y + 5}
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

  // ---------- Table styles ----------
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

  function SimpleTable({ rows }: { rows: SimpleRow[] }) {
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
              <td style={tdStyle}><span style={badge(r.detail)}>{r.detail}</span></td>
              <td style={tdStyle}>{r.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function MapTable({ rows }: { rows: MapRow[] }) {
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>From</th>
            <th style={thStyle}>To</th>
            <th style={thStyle}>Mechanism</th>
            <th style={thStyle}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.fromTicker}->${r.toTicker}`}>
              <td style={tdStyle}>
                <strong>{r.fromTicker}</strong> — {r.fromName}
              </td>
              <td style={tdStyle}>
                <strong>{r.toTicker}</strong> — {r.toName}
              </td>
              <td style={tdStyle}><span style={badge(r.mechanism)}>{r.mechanism}</span></td>
              <td style={tdStyle}>{r.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <main className="homeShell">
      <section className="contentCard">
        <h1 className="contentTitle">Actions</h1>

        <div className="prose">
          <p>
            This page documents portfolio actions and corporate actions. Only two discretionary sales have been executed
            by the fund manager (ORCL and KKD). All other changes reflect corporate events such as mergers, acquisitions,
            private equity buyouts, spin-offs, ticker changes, share-class conversions, or ledger updates.
          </p>

          <SectionTitle>Diagram: lineage and reconciliation map</SectionTitle>
          <p>
            Left: explicit-buy tickers that generate corporate-action outcomes. Middle: mapped outcomes currently held.
            Right: unreconciled tickers (present today, but not listed as explicit buys in the PDF purchase table).
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
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label="Actions lineage diagram">
              <text x={colX.roots} y="24" textAnchor="middle" fontSize="12" fill="#334155" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Explicit-buy roots
              </text>
              <text x={colX.mapped} y="24" textAnchor="middle" fontSize="12" fill="#334155" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Mapped corporate-action outcomes
              </text>
              <text x={colX.unreconciled} y="24" textAnchor="middle" fontSize="12" fill="#334155" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Unreconciled (needs confirmation)
              </text>

              {edges.map(drawEdge)}

              {roots.map((id) => drawNode(id, "root"))}
              {mapped.map((id) => drawNode(id, "mapped"))}
              {unreconciled.map((id) => drawNode(id, "unreconciled"))}
            </svg>
          </div>

          <p style={{ marginTop: 10 }}>
            The unreconciled bucket is deliberate. It flags items that are present today but are not listed as explicit buys in
            the PDF purchase table. These could be later class purchases (not captured in the PDF table) or corporate actions
            that require a confirmed predecessor chain in the ledger.
          </p>

          <SectionTitle>Discretionary sales (fund manager)</SectionTitle>
          <SimpleTable rows={managerSales} />

          <SectionTitle>M&amp;A / private equity / corporate exits</SectionTitle>
          <SimpleTable rows={corporateExits} />

          <SectionTitle>Mapped corporate actions and ticker changes</SectionTitle>
          <MapTable rows={mappedCorporateActions} />

          <SectionTitle>Unreconciled current tickers</SectionTitle>
          <SimpleTable rows={unreconciledCurrentHoldings} />

          <SectionTitle>Full set: current tickers not listed as explicit buys in the PDF table</SectionTitle>
          <p>
            For completeness, the full list is shown below. Items in the mapped table above have at least a plausible corporate-action
            explanation. Items in the unreconciled table require confirmation from the transaction ledger.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {fullNotExplicitSet.sort().map((t) => (
              <span key={t} style={badge("Not explicit in PDF")}>
                <strong style={{ marginRight: 6 }}>{t}</strong>
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
