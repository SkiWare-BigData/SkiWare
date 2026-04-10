export default function ResultsPage({ formData, results, onBackToHome, onNewAssessment }) {
  if (!formData) {
    return <main className="main-container">Loading…</main>;
  }

  const equipmentName = buildEquipmentName(formData);

  return (
    <main className="main-container">
      <section className="results-page">
        <div className="assessment-summary">
          <div className="section-title" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Your assessment
          </div>
          <h2>{equipmentName}</h2>
          <p className="summary-subtitle">Based on what you told us about your setup.</p>
          <div className="summary-grid">
            <SummaryItem label="Snow" value={capitalize(formData.terrain)} />
            <SummaryItem label="Terrain" value={capitalize(formData.style)} />
            <SummaryItem label="Days since wax" value={String(formData.daysSinceWax)} />
            <SummaryItem label="Days since edge" value={String(formData.daysSinceEdgeWork)} />
          </div>
        </div>

        {!results ? (
          <div className="error-banner">
            We could not reach the assessment service. Please try again in a moment.
          </div>
        ) : (
          <>
            <div className="recommendations-section">
              <h2>Recommendations</h2>
              {results.recommendations.map((rec, index) => (
                <article key={`${rec.title}-${index}`} className="recommendation-card">
                  <div
                    className={`recommendation-icon ${rec.severity.toLowerCase()}`}
                    aria-hidden="true"
                  >
                    <SeverityIcon severity={rec.severity} />
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

            {results.tips?.length > 0 && (
              <div className="tips-section">
                <h3>General maintenance tips</h3>
                <ul className="tips-list">
                  {results.tips.map((tip, index) => (
                    <li key={`${tip}-${index}`}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="results-buttons">
          <button className="btn-secondary" onClick={onBackToHome}>
            Back to home
          </button>
          <button className="btn-primary" onClick={onNewAssessment}>
            New assessment
          </button>
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

function SeverityIcon({ severity }) {
  if (severity === 'HIGH') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12" y2="17" />
      </svg>
    );
  }
  if (severity === 'MEDIUM') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12" y2="16" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function buildEquipmentName(formData) {
  const brand = formData.brand ? `${formData.brand} ` : '';
  const equipment = formData.equipmentType === 'skis' ? 'Skis' : 'Snowboard';
  const length = formData.length ? ` · ${formData.length}cm` : '';
  return `${brand}${equipment}${length}`.trim();
}

function capitalize(value) {
  if (!value) return '—';
  return value
    .split(/[-\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
