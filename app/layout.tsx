import "./globals.css";

export const metadata = {
 title: "Bradley High Class Fund",
  description: "Student-selected educational investment portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top-nav">
          <div className="top-nav-inner">
            <div className="brand">Bradley High Class Fund</div>

            <nav>
              <a href="/about">About</a>
              <a href="/portfolio">Portfolio</a>
              <a href="/methodology">Method</a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <p>
            This website is for educational purposes only and reflects positions selected by students.
            Holdings and cost basis may be reconstructed from historical purchase data and adjusted for corporate actions.
            Quotes may be delayed. This website does not constitute investment advice or an offer to buy or sell securities.
          </p>
        </footer>
      </body>
    </html>
  );
}
