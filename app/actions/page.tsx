type SimpleRow = { ticker: string; name: string; detail: string; notes?: string };
type MapRow = {
  fromTicker: string;
  fromName: string;
  toTicker: string;
  toName: string;
  mechanism: string;
  notes?: string;
};
type Edge = { from: string; to: string };

export default function ActionsPage() {
  const managerSales: SimpleRow[] = [
    { ticker: "ORCL", name: "Oracle", detail: "Sold by fund manager", notes: "Tax-related sale" },
    { ticker: "KKD", name: "Krispy Kreme", detail: "Sold by fund manager", notes: "Tax-related sale" },
  ];

  const corporateExits: SimpleRow[] = [
    { ticker: "TBL", name: "Timberland", detail: "Private equity buyout / corporate transaction", notes: "Not a discretionary fund sale" },
  ];

  const mappedCorporateActions: MapRow[] = [
    { fromTicker: "FO", fromName: "Fortune Brands", toTicker: "FBIN", toName: "Fortune Brands Innovations", mechanism: "Ticker change / corporate evolution", notes: "Derived from Fortune Brands lineage" },
    { fromTicker: "FO", fromName: "Fortune Brands", toTicker: "MBC", toName: "MasterBrand", mechanism: "Spin-off / separation", notes: "Corporate separation created a new ticker" },
    { fromTicker: "FO", fromName: "Fortune Brands", toTicker: "ACCO", toName: "ACCO Brands", mechanism: "Corporate action lineage", notes: "Predecessor chain to be confirmed in the ledger" },

    { fromTicker: "SQ", fromName: "Square / Block", toTicker: "XYZ", toName: "Block, Inc.", mechanism: "Ticker change / rename", notes: "Site tracks legacy SQ holding as XYZ" },
    { fromTicker: "WWE", fromName: "WWE", toTicker: "TKO", toName: "TKO Group Holdings", mechanism: "Reorganization / merger structure", notes: "Converted from WWE holding" },

    { fromTicker: "UA", fromName: "Under Armour", toTicker: "UAA", toName: "Under Armour (Class A)", mechanism: "Share class conversion", notes: "Explicit buy was UA; UAA reflects share class structure" },

    { fromTicker: "BHI", fromName: "Baker Hughes", toTicker: "BKR", toName: "Baker Hughes", mechanism: "Ticker change / reorganization", notes: "Legacy BHI mapped to current BKR" },
    { fromTicker: "HDI", fromName: "Harley-Davidson", toTicker: "HOG", toName: "Harley-Davidson", mechanism: "Ticker correction / legacy reference", notes: "PDF lists HDI; public ticker is HOG" },

    { fromTicker: "DOW", fromName: "Dow / DowDuPont lineage", toTicker: "DD", toName: "DuPont de Nemours", mechanism: "Corporate breakup / reorganization", notes: "Derived from DowDuPont breakup lineage" },
    { fromTicker: "DOW", fromName: "Dow / DowDuPont lineage", toTicker: "CTVA", toName: "Corteva", mechanism: "Corporate breakup / reorganization", notes: "Derived from DowDuPont breakup lineage" },

    { fromTicker: "GE", fromName: "General Electric", toTicker: "GEHC", toName: "GE HealthCare Technologies", mechanism: "Spin-off / separation", notes: "Derived from GE separation" },
    { fromTicker: "MMM", fromName: "3M", toTicker: "SOLV", toName: "Solventum", mechanism: "Spin-off / separation", notes: "Derived from 3M separation" },
    { fromTicker: "DHR", fromName: "Danaher", toTicker: "VLTO", toName: "Veralto", mechanism: "Spin-off / separation", notes: "Derived from Danaher separation" },
    { fromTicker: "MRK", fromName: "Merck", toTicker: "OGN", toName: "Organon & Co.", mechanism: "Spin-off / separation", notes: "Derived from Merck separation" },

    { fromTicker: "BERY", fromName: "Berry Global Group", toTicker: "AMCR", toName: "Amcor", mechanism: "Corporate action lineage (to be confirmed)", notes: "Predecessor chain requires confirmation" },
    { fromTicker: "BERY", fromName: "Berry Global Group", toTicker: "MAGN", toName: "Magnera", mechanism: "Corporate action lineage (unconfirmed)", notes: "Needs predecessor confirmation" },
    { fromTicker: "BERY", fromName: "Berry Global Group", toTicker: "SOLS", toName: "Solstice Advanced Materials", mechanism: "Corporate action lineage (unconfirmed)", notes: "Needs predecessor confirmation" },
  ];

  const unreconciledCurrentHoldings: SimpleRow[] = [
    { ticker: "AXON", name: "Axon Enterprise", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase or a mapped corporate action" },
    { ticker: "CLH", name: "Clean Harbors", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "ENB", name: "Enbridge", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "ISRG", name: "Intuitive Surgical", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "PYPL", name: "PayPal", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "RIVN", name: "Rivian", detail: "Current holding not listed as explicit buy ticker in PDF", notes: "Confirm whether this was a later class purchase" },
    { ticker: "Q", name: "Qorvo", detail: "Missing quote and not listed as explicit buy ticker in PDF", notes: "Confirm predecessor origin and why quote fetch fails" },
  ];

  const fullNotExplicitSet = [
    "ACCO","AMCR","AXON","BKR","CLH","CTVA","DD","ENB","FBIN","GEHC","HOG","ISRG","MAGN","MBC","OGN","PYPL","Q","RIVN","SOLS","SOLV","TKO","UAA","VLTO","XYZ"
  ];

  // Diagram setup
  const svgW = 1120;
  const svgH = 560;
  const nodeW = 120;
  const nodeH = 28;

  const roots = ["FO", "SQ", "WWE", "UA", "BHI", "HDI", "DOW", "GE", "MMM", "DHR", "MRK", "BERY"];
  const mapped = ["FBIN", "MBC", "ACCO", "XYZ", "TKO", "UAA", "BKR", "HOG", "DD", "CTVA", "GEHC", "SOLV", "VLTO", "OGN", "AMCR", "MAGN", "SOLS"];
  const unreconciled = ["AXON", "CLH", "ENB", "ISRG", "PYPL", "RIVN", "Q"];

  const edges: Edge[] = [
    { from: "FO", to: "FBIN" }, { from: "FO", to: "MBC" }, { from: "FO", to: "ACCO" },
    { from: "SQ", to: "XYZ" }, { from: "WWE", to: "TKO" }, { from: "UA", to: "UAA" },
    { from: "BHI", to: "BKR" }, { from: "HDI", to: "HOG" },
    { from: "DOW", to: "DD" }, { from: "DOW", to: "CTVA" },
    { from: "GE", to: "GEHC" }, { from: "MMM", to: "SOLV" }, { from: "DHR", to: "VLTO" }, { from: "MRK", to: "OGN" },
    { from: "BERY", to: "AMCR" }, { from: "BERY", to: "MAGN" }, { from: "BERY", to: "SOLS" },
  ];

  const pos: Record<string, { x: number; y: number }> = {};
  const colX = { roots: 140, mapped: 560, unreconciled: 980 };

  function place(items: string[], x: number, top: number, gap: number) {
    items.forEach((id, i) => { pos[id] = { x, y: top + i * gap }; });
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

  function drawNode(id: string, kind: "root" | "mapped" | "unreconciled") {
    const p = pos[id];
    if (!p) return null;

    const x = p.x - nodeW / 2;
    const y = p.y - nodeH / 2;

    const fill = kind === "root" ? "#eef6ff" : kind === "mapped" ? "#f7fbff" : "#fff4f4";
    const stroke = kind === "unreconciled" ? "#e6a7a7" : "#bcd0ee";

    return (
      <g key={`n-${id}`}>
        <rect x={x} y={y} width={nodeW} height={nodeH} rx={10} fill={fill} stroke={stroke} />
        <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="12" fill="#0f172a"
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
          {id}
        </text>
      </g>
    );
  }

  const tableStyle: any = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
  const thStyle: any = { textAlign: "left", padding: "10px 10px", borderBottom: "1px solid #e5eaf3", color: "#0f172a", fontWeight: 700, whiteSpace: "nowrap" };
  const tdStyle: any = { padding: "10px 10px", borderBottom: "1px solid #eef2f7", verticalAlign: "top", color: "#334155" };
  const pill: any = { display: "inline-block", padding: "3px 10px", borderRadius: 999, border: "1px solid #dfe7f3", background: "#f8fbff", fontSize: 12, color: "#0f172a", whiteSpace: "nowrap" };

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
              <td style={tdStyle}><span style={pill}>{r.detail}</span></td>
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
              <td style={tdStyle}><strong>{r.fromTicker}</strong> — {r.fromName}</td>
              <td style={tdStyle}><strong>{r.toTicker}</strong> — {r.toName}</td>
              <td style={tdStyle}><span style={pill}>{r.mechanism}</span></td>
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
            private equity buyouts, spin-offs, ticker changes, share class conversions, or ledger updates.
          </p>

          <SectionTitle>Diagram: lineage and reconciliation map</SectionTitle>
          <div style={{ border: "1px solid #dfe7f3", borderRadius: 16, padding: 14, background: "#f8fbff", overflowX: "auto", marginTop: 10 }}>
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label="Actions lineage diagram">
              <text x={colX.roots} y="24" textAnchor="middle" fontSize="12" fill="#334155"
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">Explicit-buy roots</text>
              <text x={colX.mapped} y="24" textAnchor="middle" fontSize="12" fill="#334155"
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">Mapped corporate-action outcomes</text>
              <text x={colX.unreconciled} y="24" textAnchor="middle" fontSize="12" fill="#334155"
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">Unreconciled (needs confirmation)</text>

              {edges.map(drawEdge)}
              {roots.map((id) => drawNode(id, "root"))}
              {mapped.map((id) => drawNode(id, "mapped"))}
              {unreconciled.map((id) => drawNode(id, "unreconciled"))}
            </svg>
          </div>

          <SectionTitle>Discretionary sales (fund manager)</SectionTitle>
          <SimpleTable rows={managerSales} />

          <SectionTitle>M and A / private equity / corporate exits</SectionTitle>
          <SimpleTable rows={corporateExits} />

          <SectionTitle>Mapped corporate actions and ticker changes</SectionTitle>
          <MapTable rows={mappedCorporateActions} />

          <SectionTitle>Unreconciled current tickers</SectionTitle>
          <SimpleTable rows={unreconciledCurrentHoldings} />

          <SectionTitle>Full set: current tickers not listed as explicit buys in the PDF table</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {fullNotExplicitSet.slice().sort().map((t) => (
              <span key={t} style={pill}><strong style={{ marginRight: 6 }}>{t}</strong></span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
