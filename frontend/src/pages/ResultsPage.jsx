import Header from '../components/Header';

export default function ResultsPage({ formData, results, onBackToHome, onNewAssessment }) {
  if (!results) {
    return <div>Loading...</div>;
  }

  const equipmentLabel = formData.equipmentType === 'skis' ? 'Your Skis' : 'Your Snowboard';

  return (
    <div className="app">
      <Header />
      <div className="main-container">
        <div className="results-page">
          {/* Assessment Summary */}
          <div className="assessment-summary">
            <div className="summary-title">Your Equipment Assessment</div>
            <div className="summary-subtitle">{equipmentLabel}</div>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-item-label">Terrain</div>
                <div className="summary-item-value">{capitalizeLabel(formData.terrain)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-label">Style</div>
                <div className="summary-item-value">{capitalizeLabel(formData.style)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-label">Days since wax</div>
                <div className="summary-item-value">{formData.daysSinceWax}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-label">Days since edge work</div>
                <div className="summary-item-value">{formData.daysSinceEdgeWork}</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="recommendations-section">
              <h2>Recommendations</h2>
              {results.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="recommendation-icon">✓</div>
                  <div className="recommendation-content">
                    <div className="recommendation-title">
                      {rec.title}
                      <span className={`severity-badge ${rec.severity.toLowerCase()}`}>
                        {rec.severity}
                      </span>
                    </div>
                    <p className="recommendation-description">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          {results.tips && results.tips.length > 0 && (
            <div className="tips-section">
              <h3>General Maintenance Tips</h3>
              <ul className="tips-list">
                {results.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="results-buttons">
            <button className="btn-secondary" onClick={onBackToHome}>
              ← Back to Home
            </button>
            <button className="btn-primary" onClick={onNewAssessment}>
              ↻ New Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function capitalizeLabel(str) {
  if (str === 'ice-hardpack') return 'Ice/Hardpack';
  if (str === 'park-rails') return 'Park/Rails';
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
