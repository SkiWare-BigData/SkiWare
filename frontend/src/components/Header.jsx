export default function Header({ onFindShop }) {
  return (
    <header className="header">
      <div className="header-content">
        <a href="/" className="logo">
          <span className="logo-icon"></span> SKIWARE
        </a>
        <div className="header-actions">
          <button type="button" className="btn-secondary find-shop-button" onClick={onFindShop}>
            find a shop
          </button>
        </div>
      </div>
    </header>
  );
}
