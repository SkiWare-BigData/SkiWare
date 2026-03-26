import { useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import FormPage from './pages/FormPage';
import ResultsPage from './pages/ResultsPage';
import FindShopPage from './pages/FindShopPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [formData, setFormData] = useState(null);
  const [results, setResults] = useState(null);

  const handleStartAssessment = () => {
    setCurrentPage('form');
  };

  const handleFindShop = () => {
    setCurrentPage('findShop');
  };

  const handleFormSubmit = async (data) => {
    setFormData(data);
    // In a real app, this would call the backend API
    // For now, we'll just go to results with mock data
    console.log('Form submitted:', data);
    
    // Mock API call - replace with actual backend call
    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        setResults(result);
      } else {
        // For demo purposes, use mock results
        setResults(getMockResults(data));
      }
    } catch (error) {
      console.error('Error:', error);
      // Use mock results if API fails
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
    setFormData(null);
    setResults(null);
  };

  return (
    <div className="app">
      {currentPage === 'home' && (
        <HomePage onStartAssessment={handleStartAssessment} onFindShop={handleFindShop} />
      )}
      {currentPage === 'form' && (
        <FormPage onSubmit={handleFormSubmit} onCancel={handleBackToHome} onFindShop={handleFindShop} />
      )}
      {currentPage === 'results' && (
        <ResultsPage 
          formData={formData}
          results={results}
          onBackToHome={handleBackToHome}
          onNewAssessment={handleNewAssessment}
          onFindShop={handleFindShop}
        />
      )}
      {currentPage === 'findShop' && (
        <FindShopPage onBackToHome={handleBackToHome} onFindShop={handleFindShop} />
      )}
    </div>
  );
}

function getMockResults(data) {
  return {
    equipmentType: data.equipmentType,
    brand: data.brand,
    terrain: data.terrain,
    style: data.style,
    daysSinceWax: data.daysSinceWax,
    daysSinceEdgeWork: data.daysSinceEdgeWork,
    recommendations: [
      {
        title: 'Waxing Recommended Soon',
        severity: 'LOW',
        description: `You're at ${data.daysSinceWax} days since waxing. Plan to wax within the next few sessions to maintain optimal glide.`,
      },
    ],
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
