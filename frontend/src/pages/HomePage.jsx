import Header from '../components/Header';

export default function HomePage({ onStartAssessment, onFindShop }) {
  return (
    <div className="app">
      <Header onFindShop={onFindShop} />
      <div className="main-container">
        <div className="home-page">
          <div className="hero">
            <h1>
              <span className="logo-icon"></span> SKIWARE
              <span className="snowflake">❄️</span>
            </h1>
            <p>
              Your intelligent ski and snowboard maintenance assistant. Get personalized
              recommendations for waxing, edge tuning, and equipment care based on your
              gear's condition and usage.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🛠️</div>
              <h3>Equipment Analysis</h3>
              <p>Tell us about your skis or snowboard and how you use them</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Smart Recommendations</h3>
              <p>Get tailored advice on maintenance and tune-ups</p>
            </div>
            <div className="feature-card optimize">
              <div className="feature-icon">⛷️</div>
              <h3>Optimize Performance</h3>
              <p>Keep your gear in peak condition for the best ride</p>
            </div>
          </div>

          <div className="cta-section">
            <button className="btn-primary" onClick={onStartAssessment}>
              Start Assessment
            </button>
            <p className="cta-text">Takes less than 2 minutes • No account required</p>
          </div>
        </div>
      </div>
    </div>
  );
}
