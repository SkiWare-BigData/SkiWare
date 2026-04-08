import Header from '../components/Header';

export default function FindShopPage({ onBackToHome, onFindShop }) {
  return (
    <div className="app">
      <Header onFindShop={onFindShop} />
      <div className="main-container">
        <div className="find-shop-page">
          <h1>Find a Shop</h1>
          <p className="find-shop-description">
            Looking for a local ski or snowboard service shop? Use this page as your starting point
            to locate tuning, waxing, and repair services near your mountain.
          </p>
          <div className="find-shop-actions">
            <button className="btn-primary" onClick={onBackToHome}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
