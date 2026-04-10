import { useState } from 'react';

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const SKIER_TYPES = [
  { value: '1', label: 'Type 1', sub: 'Cautious' },
  { value: '2', label: 'Type 2', sub: 'Moderate' },
  { value: '3', label: 'Type 3', sub: 'Aggressive' },
];

const SPORTS = ['Skier', 'Snowboarder'];
const TERRAIN = ['groomers', 'park', 'powder', 'backcountry', 'hybrid'];

const EMPTY_FORM = {
  name: '',
  email: '',
  skillLevel: 'intermediate',
  skierType: '',
  birthday: '',
  weightLbs: '',
  heightFt: '',
  heightInPart: '',
  bootSoleLengthMm: '',
  preferredSport: 'Skier',
  equipment: [],
  preferredTerrain: 'hybrid',
  password: '',
  confirmPassword: '',
};

function userToForm(user) {
  return {
    name: user.name ?? '',
    email: user.email ?? '',
    skillLevel: user.skillLevel ?? 'intermediate',
    skierType: user.skierType != null ? String(user.skierType) : '',
    birthday: user.birthday ?? '',
    weightLbs: user.weightLbs != null ? String(user.weightLbs) : '',
    heightFt: user.heightIn != null ? String(Math.floor(user.heightIn / 12)) : '',
    heightInPart: user.heightIn != null ? String(parseFloat((user.heightIn % 12).toFixed(1))) : '',
    bootSoleLengthMm: user.bootSoleLengthMm != null ? String(user.bootSoleLengthMm) : '',
    preferredSport: user.preferredSport ?? 'Skier',
    equipment: user.equipment ?? [],
    preferredTerrain: user.preferredTerrain ?? 'hybrid',
    password: '',
    confirmPassword: '',
  };
}

function buildPayload(form) {
  const payload = {
    name: form.name,
    email: form.email,
    skillLevel: form.skillLevel,
    skierType: form.skierType !== '' ? parseInt(form.skierType) : null,
    birthday: form.birthday || null,
    weightLbs: form.weightLbs !== '' ? parseFloat(form.weightLbs) : null,
    heightIn: (form.heightFt !== '' || form.heightInPart !== '')
      ? (parseInt(form.heightFt) || 0) * 12 + (parseFloat(form.heightInPart) || 0)
      : null,
    bootSoleLengthMm: form.bootSoleLengthMm !== '' ? parseInt(form.bootSoleLengthMm) : null,
    preferredSport: form.preferredSport,
    equipment: form.equipment,
    preferredTerrain: form.preferredTerrain,
  };
  if (form.password) {
    payload.password = form.password;
  }
  return payload;
}

export default function UserPage({ currentUser, onLogin, onLogout, onBackToHome }) {
  const [view, setView] = useState(currentUser ? 'profile' : 'idle');
  const [form, setForm] = useState(currentUser ? userToForm(currentUser) : EMPTY_FORM);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));
  const setFieldE = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSignIn = async () => {
    const email = loginEmail.trim();
    if (!email || !loginPassword) {
      setLoginError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: loginPassword }),
      });
      if (res.ok) {
        const user = await res.json();
        onLogin(user);
        setForm(userToForm(user));
        setView('profile');
      } else if (res.status === 401) {
        setLoginError('Invalid email or password.');
      } else {
        setLoginError('Something went wrong. Please try again.');
      }
    } catch {
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (view === 'create') {
      if (!form.password) {
        setSubmitError('Password is required.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setSubmitError('Passwords do not match.');
        return;
      }
    }
    if (view === 'edit' && form.password) {
      if (form.password !== form.confirmPassword) {
        setSubmitError('Passwords do not match.');
        return;
      }
    }
    setLoading(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(form.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(form)),
      });
      if (res.ok) {
        const user = await res.json();
        onLogin(user);
        setForm(userToForm(user));
        setView('profile');
      } else {
        const err = await res.json();
        setSubmitError(
          typeof err.detail === 'string' ? err.detail : 'Please check your inputs and try again.'
        );
      }
    } catch {
      setSubmitError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    onLogout();
    setForm(EMPTY_FORM);
    setLoginEmail('');
    setLoginPassword('');
    setView('idle');
  };

  function TileOption({ field, value, label, sub }) {
    return (
      <button
        type="button"
        className={`tile-option${sub ? ' compact' : ''}${form[field] === value ? ' selected' : ''}`}
        onClick={() => setField(field)(value)}
      >
        {label}
        {sub && <><br /><span style={{ fontWeight: 500, opacity: 0.75 }}>{sub}</span></>}
      </button>
    );
  }

  // ── Idle ────────────────────────────────────────────────────────────────────
  if (view === 'idle') {
    return (
      <div className="main-container">
        <div className="user-page">
          <h1>My Account</h1>
          <p className="find-shop-description">
            Sign in to view your profile and DIN settings, or create a new account.
          </p>
          <div className="find-shop-actions">
            <button className="btn-primary" onClick={() => setView('login')}>Sign In</button>
            <button className="btn-secondary" onClick={() => { setForm(EMPTY_FORM); setView('create'); }}>
              Create Account
            </button>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={onBackToHome}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  if (view === 'login') {
    return (
      <div className="main-container">
        <div className="user-page">
          <h1>Sign In</h1>
          <p className="find-shop-description">Enter your email and password to access your account.</p>
          <div className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                placeholder="••••••••"
              />
            </div>
            {loginError && <p className="shop-error-msg">{loginError}</p>}
          </div>
          <div className="find-shop-actions" style={{ marginTop: '16px' }}>
            <button className="btn-primary" onClick={handleSignIn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button className="btn-secondary" onClick={() => setView('idle')}>Cancel</button>
          </div>
          <p className="cta-text" style={{ marginTop: '14px' }}>
            No account?{' '}
            <button
              type="button"
              className="inline-link"
              onClick={() => { setForm(EMPTY_FORM); setView('create'); }}
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Profile ─────────────────────────────────────────────────────────────────
  if (view === 'profile' && currentUser) {
    const u = currentUser;
    return (
      <div className="main-container">
        <div className="form-page">
          <div className="user-profile-header">
            <div>
              <h1 className="user-profile-name">{u.name}</h1>
              <p className="user-profile-email">{u.email}</p>
            </div>
            {u.DIN != null && (
              <div className="user-din-badge">
                <span className="user-din-label">DIN</span>
                <span className="user-din-value">{u.DIN}</span>
              </div>
            )}
          </div>

          <div className="assessment-summary">
            <p className="summary-title">Profile</p>
            <p className="summary-subtitle">Your account and equipment details</p>
            <div className="summary-grid">
              <div>
                <p className="summary-item-label">Sport</p>
                <p className="summary-item-value">{u.preferredSport}</p>
              </div>
              <div>
                <p className="summary-item-label">Skill Level</p>
                <p className="summary-item-value" style={{ textTransform: 'capitalize' }}>{u.skillLevel}</p>
              </div>
              <div>
                <p className="summary-item-label">Skier Type</p>
                <p className="summary-item-value">{u.skierType != null ? `Type ${u.skierType}` : '—'}</p>
              </div>
              <div>
                <p className="summary-item-label">Preferred Terrain</p>
                <p className="summary-item-value" style={{ textTransform: 'capitalize' }}>{u.preferredTerrain}</p>
              </div>
              {u.birthday && (
                <div>
                  <p className="summary-item-label">Birthday</p>
                  <p className="summary-item-value">{u.birthday}</p>
                </div>
              )}
              {u.weightLbs != null && (
                <div>
                  <p className="summary-item-label">Weight</p>
                  <p className="summary-item-value">{u.weightLbs} lbs</p>
                </div>
              )}
              {u.heightIn != null && (
                <div>
                  <p className="summary-item-label">Height</p>
                  <p className="summary-item-value">
                    {Math.floor(u.heightIn / 12)}'{parseFloat((u.heightIn % 12).toFixed(1))}"
                  </p>
                </div>
              )}
              {u.bootSoleLengthMm != null && (
                <div>
                  <p className="summary-item-label">Boot Sole Length</p>
                  <p className="summary-item-value">{u.bootSoleLengthMm} mm</p>
                </div>
              )}
            </div>
            {u.equipment && u.equipment.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <p className="summary-item-label">Equipment</p>
                <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                  {u.equipment.map((item, i) => (
                    <li key={i} className="summary-item-value">
                      {[item.name, item.length && `${item.length}cm`, item.width && `${item.width}mm`]
                        .filter(Boolean)
                        .join(' · ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="form-buttons">
            <button className="btn-primary" onClick={() => { setForm(userToForm(u)); setView('edit'); }}>
              Edit Profile
            </button>
            <button className="btn-secondary" onClick={handleSignOut}>Sign Out</button>
          </div>
          <div style={{ marginTop: '12px' }}>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={onBackToHome}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Create / Edit form ──────────────────────────────────────────────────────
  const isEdit = view === 'edit';
  return (
    <div className="main-container">
      <div className="form-page">
        <h1>{isEdit ? 'Edit Profile' : 'Create Account'}</h1>

        {/* ── Required: Account ─────────────────────────────── */}
        <div className="form-section">
          <p className="form-section-title">Account</p>
          <p className="form-section-subtitle">Required</p>
          <div className="stacked-fields">
            <div className="form-group">
              <label htmlFor="u-name">Full name</label>
              <input
                id="u-name"
                type="text"
                value={form.name}
                onChange={setFieldE('name')}
                placeholder="Alex Smith"
              />
            </div>
            <div className="form-group">
              <label htmlFor="u-email">Email</label>
              <input
                id="u-email"
                type="text"
                value={form.email}
                onChange={setFieldE('email')}
                placeholder="you@example.com"
                disabled={isEdit}
                style={isEdit ? { opacity: 0.6 } : {}}
              />
            </div>
            {!isEdit && (
              <>
                <div className="form-group">
                  <label htmlFor="u-password">Password</label>
                  <input
                    id="u-password"
                    type="password"
                    value={form.password}
                    onChange={setFieldE('password')}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="u-confirm-password">Confirm password</label>
                  <input
                    id="u-confirm-password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={setFieldE('confirmPassword')}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
          </div>
          <div className="choice-group" style={{ marginTop: '14px' }}>
            <p className="choice-group-title">SKILL LEVEL</p>
            <div className="segmented-grid equipment-grid">
              {SKILL_LEVELS.map(({ value, label }) => (
                <TileOption key={value} field="skillLevel" value={value} label={label} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Required: DIN inputs ──────────────────────────── */}
        <div className="form-section">
          <p className="form-section-title">Binding & Physical Info</p>
          <p className="form-section-subtitle">Required — used to calculate your DIN setting</p>
          <div className="choice-group">
            <p className="choice-group-title">SKIER TYPE</p>
            <div className="segmented-grid triple-grid">
              {SKIER_TYPES.map(({ value, label, sub }) => (
                <TileOption key={value} field="skierType" value={value} label={label} sub={sub} />
              ))}
            </div>
          </div>
          <div className="stacked-fields" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label htmlFor="u-birthday">Birthday</label>
              <input id="u-birthday" type="date" value={form.birthday} onChange={setFieldE('birthday')} />
            </div>
            <div className="form-group">
              <label htmlFor="u-weight">Weight (lbs)</label>
              <input
                id="u-weight"
                type="number"
                value={form.weightLbs}
                onChange={setFieldE('weightLbs')}
                placeholder="155"
                min="44"
                max="661"
                step="0.5"
              />
            </div>
            <div className="form-group">
              <label>Height</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  value={form.heightFt}
                  onChange={setFieldE('heightFt')}
                  placeholder="ft"
                  min="3"
                  max="8"
                  step="1"
                />
                <input
                  type="number"
                  value={form.heightInPart}
                  onChange={setFieldE('heightInPart')}
                  placeholder="in"
                  min="0"
                  max="11"
                  step="0.5"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="u-bsl">Boot Sole Length (mm)</label>
              <input
                id="u-bsl"
                type="number"
                value={form.bootSoleLengthMm}
                onChange={setFieldE('bootSoleLengthMm')}
                placeholder="295"
                min="200"
                max="400"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* ── Optional: Preferences ────────────────────────── */}
        <div className="form-section">
          <p className="form-section-title">Preferences</p>
          <p className="form-section-subtitle">Optional — personalizes your recommendations</p>
          <div className="choice-group">
            <p className="choice-group-title">SPORT</p>
            <div className="segmented-grid equipment-grid">
              {SPORTS.map((s) => (
                <TileOption key={s} field="preferredSport" value={s} label={s} />
              ))}
            </div>
          </div>
          <div className="choice-group">
            <p className="choice-group-title">EQUIPMENT</p>
            <div className="stacked-fields">
              {form.equipment.map((item, i) => {
                const updateItem = (field) => (e) => {
                  const updated = form.equipment.map((eq, j) =>
                    j === i ? { ...eq, [field]: e.target.value } : eq
                  );
                  setField('equipment')(updated);
                };
                return (
                  <div key={i} className="equipment-item">
                    <div className="equipment-item-fields">
                      <div className="form-group">
                        <label>Name / Brand</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={updateItem('name')}
                          placeholder="e.g. Rossignol Experience 88"
                        />
                      </div>
                      <div className="form-group">
                        <label>Length (cm)</label>
                        <input
                          type="text"
                          value={item.length}
                          onChange={updateItem('length')}
                          placeholder="e.g. 180"
                        />
                      </div>
                      <div className="form-group">
                        <label>Width (mm)</label>
                        <input
                          type="text"
                          value={item.width}
                          onChange={updateItem('width')}
                          placeholder="e.g. 88"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setField('equipment')(form.equipment.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setField('equipment')([...form.equipment, { name: '', length: '', width: '' }])}
              >
                + Add Equipment
              </button>
            </div>
          </div>
          <div className="choice-group">
            <p className="choice-group-title">PREFERRED TERRAIN</p>
            <div className="segmented-grid difficulty-grid">
              {TERRAIN.map((t) => (
                <TileOption key={t} field="preferredTerrain" value={t} label={t.charAt(0).toUpperCase() + t.slice(1)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Optional: Change Password (edit only) ────────── */}
        {isEdit && (
          <div className="form-section">
            <p className="form-section-title">Change Password</p>
            <p className="form-section-subtitle">Optional — leave blank to keep your current password</p>
            <div className="stacked-fields">
              <div className="form-group">
                <label htmlFor="u-new-password">New password</label>
                <input
                  id="u-new-password"
                  type="password"
                  value={form.password}
                  onChange={setFieldE('password')}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="u-confirm-new-password">Confirm new password</label>
                <input
                  id="u-confirm-new-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={setFieldE('confirmPassword')}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
        )}

        {submitError && <p className="shop-error-msg">{submitError}</p>}

        <div className="form-buttons">
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Account'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setView(currentUser ? 'profile' : 'idle')}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
