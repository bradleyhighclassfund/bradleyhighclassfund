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
  // Manager-initiated sales (discretionary)
  const managerSales: SimpleRow[] = [
    { ticker: "ORCL", name: "Oracle", detail: "Sold by fund manager", notes: "Tax-related sale" },
    { ticker: "KKD", name: "Krispy Kreme", detail: "Sold by fund manager", notes: "Tax-related sale" },
  ];

  // Corporate exits (not discretionary trading)
  const corporateExits: SimpleRow[] = [
    { ticker: "TBL", name: "Timberland", detail: "Exited via private equity / corporate transaction", notes: "Not a discretionary fund sale" },
  ];

  // Mapped corporate actions: who the holding came from
  const mappedCorporateActions: MapRow[] = [
    // Fortune Brands lineage (explicit buy ticker in your history is FO)
    {
      fromTicker: "FO",
      fromName: "Fortune Brands",
      toTicker: "ACCO",
      toName: "ACCO Brands",
      mechanism: "Spin-off / corporate separation",
      notes: "ACCO World spun out of Fortune Brands (FO) and merged with GBC to form ACCO Brands",
    },
    {
      fromTicker: "FO",
      fromName: "Fortune Brands",
      toTicker: "FBIN",
      toName: "Fortune Brands Innovations",
      mechanism: "Ticker change / corporate evolution",
      notes: "Derived from Fortune Brands lineage (FO → later structure)",
    },
    {
      fromTicker: "FO",
      fromName: "Fortune Brands",
      toTicker: "MBC",
      toName: "MasterBrand",
      mechanism: "Spin-off / separation",
      notes: "Corporate separation created a new ticker",
    },

    // eBay / PayPal
    {
      fromTicker: "EBAY",
      fromName: "eBay",
      toTicker: "PYPL",
      toName: "PayPal",
      mechanism: "Spin-off",
      notes: "PayPal separated from eBay in 2015",
    },

    // DuPont / Q (Qnity Electronics)
    {
      fromTicker: "DD",
      fromName: "DuPont de Nemours",
      toTicker: "Q",
      toName: "Qnity Electronics",
      mechanism: "Spin-off",
      notes: "Spun off from DuPont (DD); ticker trades as Q",
    },

    // Square / Block mapping used by your site
    {
      fromTicker: "SQ",
      fromName: "Square / Block",
      toTicker: "XYZ",
      toName: "Block, Inc.",
      mechanism: "Ticker change / rename",
      notes: "Legacy SQ holding tracked as XYZ on the portfolio page",
    },

    // WWE conversion to TKO
    {
      fromTicker: "WWE",
      fromName: "WWE",
      toTicker: "TKO",
      toName: "TKO Group Holdings",
      mechanism: "Reorganization / merger structure",
      notes: "Converted from WWE holding",
    },

    // Under Armour share class (not a spin-off)
    {
      fromTicker: "UA",
      fromName: "Under Armour",
      toTicker: "UAA",
      toName: "Under Armour (Class A)",
      mechanism: "Share class conversion / dual-class structure",
      notes: "UA and UAA are different share classes (not a spin-off)",
    },

    // Baker Hughes: legacy ticker to current
    {
      fromTicker: "BHI",
      fromName: "Baker Hughes",
      toTicker: "BKR",
      toName: "Baker Hughes",
      mechanism: "Ticker change / reorganization",
      notes: "Legacy BHI mapped to current BKR",
    },

    // Harley-Davidson: legacy reference to current ticker
    {
      fromTicker: "HDI",
      fromName: "Harley-Davidson",
      toTicker: "HOG",
      toName: "Harley-Davidson",
      mechanism: "Ticker correction / legacy reference",
      notes: "Historical materials list HDI; public ticker is HOG",
    },

    // Dow/DuPont breakup lineage
    {
      fromTicker: "DOW",
      fromName: "Dow / DowDuPont lineage",
      toTicker: "DD",
      toName: "DuPont de Nemours",
      mechanism: "Corporate breakup / reorganization",
      notes: "Derived from DowDuPont breakup lineage",
    },
    {
      fromTicker: "DOW",
      fromName: "Dow / DowDuPont lineage",
      toTicker: "CTVA",
      toName: "Corteva",
      mechanism: "Corporate breakup / reorganization",
      notes: "Derived from DowDuPont breakup lineage",
    },

    // Spinoffs from explicit buy parents
    {
      fromTicker: "GE",
      fromName: "General Electric",
      toTicker: "GEHC",
      toName: "GE HealthCare Technologies",
      mechanism: "Spin-off / separation",
      notes: "Derived from GE separation",
    },
    {
      fromTicker: "MMM",
      fromName: "3M",
      toTicker: "SOLV",
      toName: "Solventum",
      mechanism: "Spin-off / separation",
      notes: "Derived from 3M separation",
    },
    {
      fromTicker: "DHR",
      fromName: "Danaher",
      toTicker: "VLTO",
      toName: "Veralto",
      mechanism: "Spin-off / separation",
      notes: "Derived from Danaher separation",
    },
    {
      fromTicker: "MRK",
      fromName: "Merck",
      toTicker: "OGN",
      toName: "Organon & Co.",
      mechanism: "Spin-off / separation",
      notes: "Derived from Merck separation",
    },

    // Honeywell / Solstice Advanced Materials
    {
      fromTicker: "HON",
      fromName: "Honeywell",
      toTicker: "SOLS",
      toName: "Solstice Advanced Materials",
      mechanism: "Spin-off",
      notes: "Spin-off from Honeywell completed in 2025; trades as SOLS",
    },

    // Berry / Magnera
    {
      fromTicker: "BERY",
      fromName: "Berry Global",
      toTicker: "MAGN",
      toName: "Magnera",
      mechanism: "Spin-off (Reverse Morris Trust) + merger",
      notes: "Berry HHNF business spun off and merged with Glatfelter; Magnera formed",
    },

    // Berry / Amcor (not a spin-off; combination/exchange)
    {
      fromTicker: "BERY",
      fromName: "Berry Global",
      toTicker: "AMCR",
      toName: "Amcor",
      mechanism: "Corporate action exchange (all-stock combination)",
      notes: "Berry shareholders received Amcor shares upon completion of the combination",
    },

    // ENB pathway (received via merger if predecessor was held)
    {
      fromTicker: "SE",
      fromName: "Spectra Energy",
      toTicker: "ENB",
      toName: "Enbridge",
      mechanism: "Merger exchange",
      notes: "Spectra merged into Enbridge; Spectra was originally a Duke Energy spin-off",
    },
  ];

  // Basic diagram buckets
  const roots = ["FO", "EBAY", "DD", "SQ", "WWE", "UA", "BHI", "HDI", "DOW", "GE", "MMM", "DHR", "MRK", "HON", "BERY", "SE"];
  const mapped = ["ACCO", "FBIN", "MBC", "PYPL", "Q", "XYZ", "TKO", "UAA", "BKR", "HOG", "DD", "CTVA", "GEHC", "SOLV", "VLTO", "OGN", "SOLS", "MAGN", "AMCR", "ENB"];

  const edges: Edge[] = [
    { from: "FO", to: "ACCO" },
    { from: "FO", to: "FBIN" },
    { from: "FO", to: "MBC" },

    { from: "EBAY", to: "PYPL" },
    { from: "DD", to: "Q" },

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

    { from: "HON", to: "SOLS" },

    { from: "BERY", to: "MAGN" },
    { from: "BERY", to: "AMCR" },

    { from: "SE", to: "ENB" },
  ];

  // SVG layout
  const svgW = 1120;
  const svgH = 560;
  const nodeW = 120;
  const nodeH = 28;

  const pos: Record<string, { x: number; y: number }> = {};
  const colX = { roots: 180, mapped: 760 };

  function place(items: string[], x: number, top: number, gap: number) {
    items.forEach((id, i) => {
      pos[id] = { x, y: top + i * gap };
    });
  }

  place(roots, colX.roots, 60, 34);
  place(mapped, colX.mapped, 46, 26);

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

  function drawNode(id: string, kind: "root" | "mapped") {
    const p = pos[id];
    if (!p) return null;

    const x = p.x - nodeW / 2;
    const y = p.y - nodeH / 2;

    const fill = kind === "root" ? "#eef6ff" : "#f7fbff";
    const stroke = "#bcd0ee";

    return (
      <g key={`n-${id}`}>
        <rect x={x} y={y} width={nodeW} height={nodeH} rx={10} fill={fill} stroke={stroke} />
        <text
          x={p.x}
          y={p.y + 5}
          textAnchor="middle"
          fontSize="12"
          fill="#0f172a"
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
        >
          {id}
        </text>
      </g>
    );
  }

  // Tables
  const tableStyle: any = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
  const thStyle: any = { textAlign: "left", padding: "10px 10px", borderBottom: "1px solid #e5eaf3", color: "#0f172a", fontWeight: 700, whiteSpace: "nowrap" };
  const tdStyle: any = { padding: "10px 10px", borderBottom: "1px solid #eef2f7", verticalAlign: "top", color: "#334155" };
  const pill: any = { display: "inline-block", padding: "3px 10px", borderRadius: 999, border: "1px solid #dfe7f3", background: "#f8fbff", fontSize: 12, color: "#0f172a", whiteSpace: "nowrap" };

  function SectionTitle({ children }: { children: any }) {
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
            private equity buyouts, spin-offs, ticker changes, share class conversions, or reorganizations.
          </p>

          <SectionTitle>Diagram: corporate action map</SectionTitle>
          <div style={{ border: "1px solid #dfe7f3", borderRadius: 16, padding: 14, background: "#f8fbff", overflowX: "auto", marginTop: 10 }}>
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label="Corporate action diagram">
              <text x={colX.roots} y="24" textAnchor="middle" fontSize="12" fill="#334155"
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Predecessor / parent
              </text>
              <text x={colX.mapped} y="24" textAnchor="middle" fontSize="12" fill="#334155"
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
                Current ticker
              </text>

              {edges.map(drawEdge)}
              {roots.map((id) => drawNode(id, "root"))}
              {mapped.map((id) => drawNode(id, "mapped"))}
            </svg>
          </div>

          <SectionTitle>Discretionary sales (fund manager)</SectionTitle>
          <SimpleTable rows={managerSales} />

          <SectionTitle>M and A / private equity / corporate exits</SectionTitle>
          <SimpleTable rows={corporateExits} />

          <SectionTitle>Corporate actions, spin-offs, and ticker changes</SectionTitle>
          <MapTable rows={mappedCorporateActions} />
        </div>
      </section>
    </main>
  );
}
