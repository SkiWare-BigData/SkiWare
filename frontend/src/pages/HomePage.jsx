const features = [
  {
    title: 'Equipment Analysis',
    description: 'Tell us about your skis or snowboard and how you use them',
    iconClass: 'analysis',
  },
  {
    title: 'Smart Recommendations',
    description: 'Get tailored advice on maintenance and tune-ups',
    iconClass: 'recommendations',
  },
  {
    title: 'Optimize Performance',
    description: 'Keep your gear in peak condition for the best ride',
    iconClass: 'performance',
  },
];

export default function HomePage({ onStartAssessment, onFindShop }) {
  return (
    <main className="main-container">
      <section className="home-page">
        <div className="hero">
          <div className="hero-brand" aria-hidden="true">
            <span className="hero-logo-mark">
              <span className="logo-mark-peak"></span>
            </span>
            <span className="hero-wordmark">
              <span>SKI WARE</span>
              <span className="hero-snowflake">*</span>
            </span>
          </div>
          <p>
            Your intelligent ski and snowboard maintenance assistant. Get personalized
            recommendations for waxing, edge tuning, and equipment care based on your
            gear&apos;s condition and usage.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card">
              <div className={`feature-icon ${feature.iconClass}`} aria-hidden="true"></div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="cta-section">
          <div className="cta-buttons">
            <button className="btn-primary cta-button" onClick={onStartAssessment}>
              Start Assessment
            </button>
            <button className="btn-secondary cta-button" onClick={onFindShop}>
              Find a Shop
            </button>
          </div>
          <p className="cta-text">Takes less than 2 minutes · No account required</p>
        </div>
      </section>
    </main>
  );
}
