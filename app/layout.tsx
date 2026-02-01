import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bradley High Class Fund",
  description: "Educational student-selected portfolio with delayed quotes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
        <header style={{ padding: "16px 24px", borderBottom: "1px solid #eee" }}>
          <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a href="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 700 }}>Bradley High Class Fund</a>
            <a href="/portfolio">Portfolio</a>
            <a href="/sold">Sold</a>
            <a href="/methodology">Methodology</a>
            <a href="/disclosures">Disclosures</a>
          </nav>
        </header>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
        <footer style={{ padding: "20px 24px", borderTop: "1px solid #eee", marginTop: 32, fontSize: 12, color: "#444" }}>
          <div>
            This website is for educational purposes only and reflects positions selected by students. Holdings and cost basis may be reconstructed from historical purchase data and adjusted for corporate actions using market-value allocation. Figures may differ from custodian records. Quotes may be delayed. This website does not constitute investment advice or an offer to buy or sell securities.
          </div>
        </footer>
      </body>
    </html>
  );
}
