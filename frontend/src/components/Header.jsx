const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'form', label: 'Assessment' },
  { id: 'myfit', label: 'MyFit' },
];

export default function Header({ currentPage, onNavigate }) {
  return (
    <header className="header">
      <div className="header-content">
        <button
          type="button"
          className="logo"
          onClick={() => onNavigate('home')}
          aria-label="Go to Ski Ware home"
        >
          <span className="logo-mark" aria-hidden="true">
            <span className="logo-mark-peak"></span>
          </span>
          <span className="logo-text">SKI WARE</span>
        </button>

        <nav className="header-nav" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => item.id !== 'myfit' && onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button type="button" className="auth-link">
            Login
          </button>
          <button type="button" className="auth-button">
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}
