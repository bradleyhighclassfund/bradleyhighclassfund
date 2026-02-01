import sold from "@/data/sold_positions.json";

type SoldRow = {
  ticker: string;
  company?: string;
  buy_date?: string;
  sell_date?: string;
  exit_type?: "SOLD" | "BUYOUT";
  notes?: string;
};

export default function SoldPage() {
  const rows = sold as SoldRow[];

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Sold & Buyouts</h1>
      <p>Displayed separately and excluded from live portfolio metrics.</p>

      <table cellPadding={10} style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #eee" }}>
            <th align="left">Ticker</th>
            <th align="left">Company</th>
            <th align="left">Buy Date</th>
            <th align="left">Exit Date</th>
            <th align="left">Exit Type</th>
            <th align="left">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr style={{ borderTop: "1px solid #eee" }}>
              <td colSpan={6} style={{ padding: 16, color: "#666" }}>
                No sold/buyout positions listed yet.
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                <td>{r.ticker}</td>
                <td>{r.company ?? ""}</td>
                <td>{r.buy_date ?? ""}</td>
                <td>{r.sell_date ?? ""}</td>
                <td>{r.exit_type ?? ""}</td>
                <td>{r.notes ?? ""}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
