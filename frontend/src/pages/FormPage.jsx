import { useState } from 'react';

const snowTypeOptions = [
  { value: 'powder', label: 'Powder' },
  { value: 'ice', label: 'Ice' },
  { value: 'hybrid', label: 'Hybrid' },
];

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Intermediate' },
  { value: 'hard', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' },
  { value: 'Park', label: 'Park/Freestyle' },
];

const terrainTypeOptions = [
  { value: 'groomed', label: 'Groomed' },
  { value: 'ungroomed', label: 'Ungroomed' },
  { value: 'hybrid', label: 'Hybrid' },
];

const equipmentAgeOptions = [
  { value: '0-1 year', label: '0-1 years old' },
  { value: '1-2 years', label: '1-2 years old' },
  { value: '2-5 years', label: '2-5 years old' },
  { value: '5+ years', label: '5+ years old' },
];

export default function FormPage({ onSubmit, onCancel, onFindShop }) {
  const [formData, setFormData] = useState({
    equipmentType: '',
    brand: '',
    length: '',
    age: '',
    terrain: '',
    difficulty: '',
    style: '',
    daysSinceWax: 0,
    daysSinceEdgeWork: 0,
    coreShots: 0,
    height: '',
    weight: '',
    issueDescription: '',
  });

  const handleChange = (event) => {
    const { name, value, type } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value,
    }));
  };

  const handleSliderChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value, 10),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <main className="main-container">
      <section className="form-page">
        <form onSubmit={handleSubmit} className="assessment-form">
          <div className="form-section">
            <div className="form-section-title">Equipment Type</div>
            <div className="form-section-subtitle">What are you riding?</div>
            <div className="segmented-grid equipment-grid">
              <TileOption
                name="equipmentType"
                value="skis"
                checked={formData.equipmentType === 'skis'}
                onChange={handleChange}
                label="Skis"
              />
              <TileOption
                name="equipmentType"
                value="snowboard"
                checked={formData.equipmentType === 'snowboard'}
                onChange={handleChange}
                label="Snowboard"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Snow Type &amp; Terrain</div>
            <div className="form-section-subtitle">What conditions do you typically ride?</div>

            <Fieldset title="Snow Type">
              <div className="segmented-grid triple-grid">
                {snowTypeOptions.map((option) => (
                  <TileOption
                    key={option.value}
                    name="terrain"
                    value={option.value}
                    checked={formData.terrain === option.value}
                    onChange={handleChange}
                    label={option.label}
                  />
                ))}
              </div>
            </Fieldset>

            <Fieldset title="Difficulty Level">
              <div className="segmented-grid difficulty-grid">
                {difficultyOptions.map((option) => (
                  <TileOption
                    key={option.value}
                    name="difficulty"
                    value={option.value}
                    checked={formData.difficulty === option.value}
                    onChange={handleChange}
                    label={option.label}
                    compact
                  />
                ))}
              </div>
            </Fieldset>

            <Fieldset title="Terrain Type">
              <div className="segmented-grid triple-grid">
                {terrainTypeOptions.map((option) => (
                  <TileOption
                    key={option.value}
                    name="style"
                    value={option.value}
                    checked={formData.style === option.value}
                    onChange={handleChange}
                    label={option.label}
                  />
                ))}
              </div>
            </Fieldset>
          </div>

          <div className="form-section">
            <div className="form-section-title">Equipment Details</div>
            <div className="form-section-subtitle">Tell us about your gear</div>

            <div className="input-grid">
              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Rossignol, Burton, K2"
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

            <div className="form-group">
              <label htmlFor="age">Equipment Age</label>
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
            <div className="form-section-title">Rider Info</div>
            <div className="form-section-subtitle">
              Helps us provide better recommendations
            </div>
            <div className="input-grid">
              <div className="form-group">
                <label htmlFor="height">Height (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g. 175"
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g. 70"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Maintenance History</div>
            <div className="form-section-subtitle">When did you last service your gear?</div>

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
              label="Days of riding since last edge sharpening"
              value={formData.daysSinceEdgeWork}
              max={30}
              onChange={handleSliderChange}
            />

            <SliderField
              id="coreShots"
              name="coreShots"
              label="Number of core shots (visible damage)"
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
              Get Recommendations
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Fieldset({ title, children }) {
  return (
    <div className="choice-group">
      <div className="choice-group-title">{title}</div>
      {children}
    </div>
  );
}

function TileOption({ name, value, checked, onChange, label, compact = false }) {
  const id = `${name}-${value}`;

  return (
    <label htmlFor={id} className={`tile-option ${checked ? 'selected' : ''} ${compact ? 'compact' : ''}`}>
      <input
        className="sr-only"
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function SliderField({ id, name, label, value, max, onChange }) {
  return (
    <div className="form-group slider-field">
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
