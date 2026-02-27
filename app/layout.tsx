import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bradley High Class Fund",
  description: "Educational student-selected portfolio with delayed quotes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top-nav">
          <div className="top-nav-inner">
            <nav>
              <a href="/">Home</a>
              <a href="/about">About</a>
              <a href="/portfolio">Portfolio</a>
              <a href="/ondeck">On Deck</a>
              <a href="/methodology">Method</a>
            </nav>
          </div>
        </header>

        <div className="page-wrap">
          {children}
        </div>

        <footer className="site-footer">
          <div>
            This website is for educational purposes only and reflects positions selected by students.
            Holdings and cost basis may be reconstructed from historical purchase data and adjusted for corporate actions
            using market-value allocation. Figures may differ from custodian records. Quotes may be delayed.
            This website does not constitute investment advice or an offer to buy or sell securities.
          </div>
        </footer>
      </body>
    </html>
  );
}
