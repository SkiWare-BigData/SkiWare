export default function ResultsPage({ formData, results, onBackToHome, onNewAssessment, onFindShop }) {
  if (!results || !formData) {
    return <main className="main-container">Loading...</main>;
  }

  const equipmentName = buildEquipmentName(formData);

  return (
    <main className="main-container">
      <section className="results-page">
        <div className="assessment-summary">
          <div className="summary-title">Your Equipment Assessment</div>
          <div className="summary-subtitle">{equipmentName}</div>
          <div className="summary-grid">
            <SummaryItem label="Terrain" value={capitalizeLabel(formData.terrain)} />
            <SummaryItem label="Style" value={capitalizeLabel(formData.style)} />
            <SummaryItem label="Days since wax" value={String(formData.daysSinceWax)} />
            <SummaryItem
              label="Days since edge work"
              value={String(formData.daysSinceEdgeWork)}
            />
          </div>
        </div>

        <div className="recommendations-section">
          <h2>Recommendations</h2>
          {results.recommendations.map((rec, index) => (
            <article key={`${rec.title}-${index}`} className="recommendation-card">
              <div className={`recommendation-icon ${rec.severity.toLowerCase()}`} aria-hidden="true">
                {severityGlyph(rec.severity)}
              </div>
              <div className="recommendation-content">
                <div className="recommendation-heading">
                  <h3>{rec.title}</h3>
                  <span className={`severity-badge ${rec.severity.toLowerCase()}`}>
                    {rec.severity}
                  </span>
                </div>
                <p className="recommendation-description">{rec.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="results-buttons">
          <button className="btn-secondary" onClick={onBackToHome}>
            Back to Home
          </button>
          <button className="btn-primary" onClick={onNewAssessment}>
            New Assessment
          </button>
        </div>

        <div className="tips-section">
          <h3>General Maintenance Tips</h3>
          <ul className="tips-list">
            {results.tips.map((tip, index) => (
              <li key={`${tip}-${index}`}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="summary-item">
      <div className="summary-item-label">{label}</div>
      <div className="summary-item-value">{value}</div>
    </div>
  );
}

function buildEquipmentName(formData) {
  const brand = formData.brand ? `${formData.brand} ` : '';
  const equipment = formData.equipmentType === 'skis' ? 'Skis' : 'Snowboard';
  const length = formData.length ? ` (${formData.length}in)` : '';
  return `${brand}${equipment}${length}`;
}

function severityGlyph(severity) {
  if (severity === 'HIGH') return '!';
  if (severity === 'MEDIUM') return '!';
  return 'o';
}

function capitalizeLabel(value) {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
