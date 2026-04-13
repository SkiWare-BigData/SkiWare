import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import FormPage from './pages/FormPage';
import ResultsPage from './pages/ResultsPage';
import FindShopPage from './pages/FindShopPage';
import UserPage from './pages/UserPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [formData, setFormData] = useState(null);
  const [results, setResults] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const handleNavigate = (page) => {
    if (page === 'home') {
      handleBackToHome();
      return;
    }
    setCurrentPage(page);
  };

  const handleLogin = (user) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);

  const handleStartAssessment = () => setCurrentPage('form');
  const handleFindShop = () => setCurrentPage('findShop');

  const handleFormSubmit = async (data) => {
    setFormData(data);
    setResults(null);
    setCurrentPage('results');

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setResults(await response.json());
      } else {
        setResults(null);
      }
    } catch (error) {
      console.error('Assessment request failed', error);
      setResults(null);
    }
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
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      {currentPage === 'home' && (
        <HomePage
          onStartAssessment={handleStartAssessment}
          onFindShop={handleFindShop}
        />
      )}
      {currentPage === 'form' && (
        <FormPage
          onSubmit={handleFormSubmit}
          onCancel={handleBackToHome}
          currentUser={currentUser}
        />
      )}
      {currentPage === 'results' && (
        <ResultsPage
          formData={formData}
          results={results}
          onBackToHome={handleBackToHome}
          onNewAssessment={handleNewAssessment}
        />
      )}
      {currentPage === 'findShop' && <FindShopPage onBackToHome={handleBackToHome} />}
      {currentPage === 'user' && (
        <UserPage
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
}

export default App;
