import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-300 p-6">

      {/* Header */}
      <div className="max-w-5xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-semibold text-slate-900">
          Bradley High Class Fund
        </h1>
        <p className="text-slate-600 mt-2">
          An experiential student-selected investment portfolio focused on long-term capital appreciation
        </p>
      </div>

      {/* Portfolio Value */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="bg-white/90 rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
          <h2 className="text-lg text-slate-600">Portfolio Value</h2>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            $197,313.42
          </p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="bg-white/90 rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="px-6 py-4 bg-slate-100 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-center text-slate-900">
              Portfolio Performance
            </h2>
          </div>

          <div className="p-6">
            <Image
              src="/performance.png"
              alt="Portfolio performance"
              width={1400}
              height={800}
              className="w-full h-auto rounded-xl border border-slate-200"
              priority
            />
          </div>
        </div>
      </div>

      {/* Beta Chart */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="bg-white/90 rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="px-6 py-4 bg-slate-100 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-center text-slate-900">
              Portfolio Beta Over Time
            </h2>
          </div>

          <div className="p-6">
            <Image
              src="/portfolio_beta_homepage.png"
              alt="Portfolio beta over time"
              width={1400}
              height={800}
              className="w-full h-auto rounded-xl border border-slate-200"
            />
          </div>
        </div>
      </div>

    </main>
  );
}
