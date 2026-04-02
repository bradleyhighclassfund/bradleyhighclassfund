import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white p-6">

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-semibold">
          Bradley High Class Fund
        </h1>
        <p className="text-gray-600 mt-2">
          An experiential student-selected investment portfolio focused on long-term capital appreciation
        </p>
      </div>

      {/* Portfolio Value */}
      <div className="text-center mb-8">
        <h2 className="text-lg text-gray-600">Portfolio Value</h2>
        <p className="text-3xl font-bold">$197,313.42</p>
      </div>

      {/* Performance Chart */}
      <div className="mb-6">
        <Image
          src="/performance.png"
          alt="Portfolio performance"
          width={1400}
          height={800}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Beta Chart (NEW — centered + smaller) */}
      <div className="mt-6 text-center">
        <p className="text-gray-700 mb-2">
          Portfolio Beta Over Time
        </p>

        <div className="flex justify-center">
          <Image
            src="/portfolio_beta_homepage.png"
            alt="Portfolio beta over time"
            width={900}
            height={500}
            className="w-full max-w-3xl h-auto"
          />
        </div>
      </div>

    </main>
  );
}
