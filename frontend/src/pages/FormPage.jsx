import { useState } from 'react';

const equipmentTypeOptions = [
  { value: 'skis', label: 'Skis' },
  { value: 'snowboard', label: 'Snowboard' },
];

const terrainOptions = [
  { value: 'powder', label: 'Powder' },
  { value: 'hybrid', label: 'Mixed' },
  { value: 'ice', label: 'Hard / Icy' },
];

const styleOptions = [
  { value: 'groomed', label: 'Groomed' },
  { value: 'hybrid', label: 'Both' },
  { value: 'ungroomed', label: 'Off-piste' },
];

const equipmentAgeOptions = [
  { value: '0-1 year', label: '0-1 years' },
  { value: '1-2 years', label: '1-2 years' },
  { value: '2-5 years', label: '2-5 years' },
  { value: '5+ years', label: '5+ years' },
];

const INITIAL_FORM = {
  equipmentType: 'skis',
  brand: '',
  length: '',
  age: '1-2 years',
  terrain: 'hybrid',
  style: 'hybrid',
  daysSinceWax: 0,
  daysSinceEdgeWork: 0,
  coreShots: 0,
  height: '',
  weight: '',
};

export default function FormPage({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState(INITIAL_FORM);

  const handleChange = (event) => {
    const { name, value, type } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value,
    }));
  };

  const handleSliderChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const handleTileSelect = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <main className="main-container">
      <section className="form-page">
        <div className="page-header">
          <h1>Gear Assessment</h1>
          <p>Tell us about your setup and how it has been running.</p>
        </div>

        <form onSubmit={handleSubmit} className="assessment-form">
          <div className="form-section">
            <div className="section-title">Equipment</div>
            <div className="section-subtitle">What are you riding?</div>
            <div className="segmented-grid grid-2">
              {equipmentTypeOptions.map((option) => (
                <TileOption
                  key={option.value}
                  name="equipmentType"
                  value={option.value}
                  checked={formData.equipmentType === option.value}
                  onSelect={handleTileSelect}
                  label={option.label}
                />
              ))}
            </div>

            <div className="input-grid" style={{ marginTop: '18px' }}>
              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Rossignol"
                />
              </div>
              <div className="form-group">
                <label htmlFor="length">Length (cm)</label>
                <input
                  type="number"
                  id="length"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  placeholder="e.g. 170"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label htmlFor="age">Equipment age</label>
              <select id="age" name="age" value={formData.age} onChange={handleChange}>
                {equipmentAgeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title">Conditions</div>
            <div className="section-subtitle">Where do you usually ride?</div>

            <div className="choice-group">
              <div className="choice-group-title">Snow type</div>
              <div className="segmented-grid grid-3">
                {terrainOptions.map((option) => (
                  <TileOption
                    key={option.value}
                    name="terrain"
                    value={option.value}
                    checked={formData.terrain === option.value}
                    onSelect={handleTileSelect}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div className="choice-group">
              <div className="choice-group-title">Terrain</div>
              <div className="segmented-grid grid-3">
                {styleOptions.map((option) => (
                  <TileOption
                    key={option.value}
                    name="style"
                    value={option.value}
                    checked={formData.style === option.value}
                    onSelect={handleTileSelect}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title">Rider</div>
            <div className="section-subtitle">Used to tune the recommendations.</div>
            <div className="input-grid">
              <div className="form-group">
                <label htmlFor="height">Height (in)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g. 69"
                />
              </div>
              <div className="form-group">
                <label htmlFor="weight">Weight (lbs)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g. 155"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title">Maintenance history</div>
            <div className="section-subtitle">When did you last service your gear?</div>

            <SliderField
              id="daysSinceWax"
              name="daysSinceWax"
              label="Days of riding since last wax"
              value={formData.daysSinceWax}
              max={30}
              onChange={handleSliderChange}
            />
            <SliderField
              id="daysSinceEdgeWork"
              name="daysSinceEdgeWork"
              label="Days of riding since last edge tune"
              value={formData.daysSinceEdgeWork}
              max={30}
              onChange={handleSliderChange}
            />
            <SliderField
              id="coreShots"
              name="coreShots"
              label="Visible core shots in the base"
              value={formData.coreShots}
              max={10}
              onChange={handleSliderChange}
            />
          </div>

          <div className="form-buttons">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Back
            </button>
            <button type="submit" className="btn-primary">
              Get recommendations
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function TileOption({ name, value, checked, onSelect, label }) {
  return (
    <button
      type="button"
      className={`tile-option ${checked ? 'selected' : ''}`}
      onClick={() => onSelect(name, value)}
      aria-pressed={checked}
    >
      {label}
    </button>
  );
}

function SliderField({ id, name, label, value, max, onChange }) {
  return (
    <div className="slider-field">
      <div className="slider-label-row">
        <label htmlFor={id}>{label}</label>
        <span className="slider-value">{value}</span>
      </div>
      <input
        type="range"
        id={id}
        name={name}
        min="0"
        max={max}
        value={value}
        onChange={onChange}
        style={{ '--slider-fill': `${(value / max) * 100}%` }}
      />
    </div>
  );
}
