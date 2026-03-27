import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import FormPage from './pages/FormPage';
import ResultsPage from './pages/ResultsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [formData, setFormData] = useState(null);
  const [results, setResults] = useState(null);

  const handleNavigate = (page) => {
    if (page === 'myfit') {
      return;
    }

    if (page === 'home') {
      handleBackToHome();
      return;
    }

    setCurrentPage(page);
  };

  const handleStartAssessment = () => {
    setCurrentPage('form');
  };

  const handleFormSubmit = async (data) => {
    setFormData(data);

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setResults(await response.json());
      } else {
        setResults(getMockResults(data));
      }
    } catch (error) {
      console.error('Assessment request failed', error);
      setResults(getMockResults(data));
    }

    setCurrentPage('results');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setFormData(null);
    setResults(null);
  };

  const handleNewAssessment = () => {
    setCurrentPage('form');
    setResults(null);
  };

  return (
    <div className="app">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      {currentPage === 'home' && <HomePage onStartAssessment={handleStartAssessment} />}
      {currentPage === 'form' && (
        <FormPage onSubmit={handleFormSubmit} onCancel={handleBackToHome} />
      )}
      {currentPage === 'results' && (
        <ResultsPage
          formData={formData}
          results={results}
          onBackToHome={handleBackToHome}
          onNewAssessment={handleNewAssessment}
        />
      )}
    </div>
  );
}

function getMockResults(data) {
  const recommendations = [];

  if (data.age === '5+ years') {
    recommendations.push({
      title: 'Consider Equipment Inspection',
      severity: 'MEDIUM',
      description:
        'Your gear is 5+ years old. Check bindings for wear, inspect for delamination, and consider a full tune-up before the next trip.',
    });
  }

  if (data.daysSinceWax >= 5) {
    recommendations.push({
      title: 'Waxing Recommended Soon',
      severity: 'LOW',
      description: `You are at ${data.daysSinceWax} days since waxing. Plan to wax within the next few sessions to maintain optimal glide.`,
    });
  }

  if (data.daysSinceEdgeWork >= 10) {
    recommendations.push({
      title: 'Tune Edges for Better Hold',
      severity: 'MEDIUM',
      description: `At ${data.daysSinceEdgeWork} riding days since edge work, edge grip may start dropping off on firm or mixed snow.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Maintenance Looks On Track',
      severity: 'LOW',
      description:
        'Your reported maintenance schedule looks healthy. Keep drying and checking your edges after each day out.',
    });
  }

  return {
    equipmentType: data.equipmentType,
    brand: data.brand,
    terrain: data.terrain,
    style: data.style,
    daysSinceWax: data.daysSinceWax,
    daysSinceEdgeWork: data.daysSinceEdgeWork,
    recommendations,
    tips: [
      'Wax your skis every 5-7 days of riding',
      'Check edges for burrs after every session, especially on hard snow',
      'Store with a storage wax coat during off-season',
      'Always dry your equipment after riding to prevent rust',
      'Get a professional tune at the start of each season',
    ],
  };
}

export default App;
