export default function StatsStrip() {
  return (
    <section className="bg-white border-y border-cream-200 py-10">
      <div className="max-w-4xl mx-auto px-4 md:px-6 grid grid-cols-3 gap-6 text-center">
        <div>
          <div className="font-display text-3xl md:text-4xl font-bold text-brand-500">49%</div>
          <p className="text-xs text-cream-800/60 mt-1">agents report staged homes sell faster</p>
        </div>
        <div>
          <div className="font-display text-3xl md:text-4xl font-bold text-brand-500">29%</div>
          <p className="text-xs text-cream-800/60 mt-1">saw a 1–10% higher offer</p>
        </div>
        <div>
          <div className="font-display text-3xl md:text-4xl font-bold text-brand-500">83%</div>
          <p className="text-xs text-cream-800/60 mt-1">of buyers' agents say staging helps</p>
        </div>
      </div>
      <p className="text-center text-[10px] text-cream-800/40 mt-4">
        Source:{" "}
        <a
          href="https://www.nar.realtor/research-and-statistics/research-reports/profile-of-home-staging"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-cream-800/60"
        >
          National Association of Realtors, 2025 Profile of Home Staging
        </a>
      </p>
    </section>
  );
}
