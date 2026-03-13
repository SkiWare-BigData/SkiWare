import { useState } from 'react';
import Header from '../components/Header';

export default function FormPage({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    equipmentType: 'skis',
    brand: '',
    length: '',
    age: '1-2 years',
    terrain: 'hybrid',
    style: 'both',
    daysSinceWax: 5,
    daysSinceEdgeWork: 10,
    coreShots: 0,
    height: '',
    weight: '',
    issueDescription: '',
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="app">
      <Header />
      <div className="main-container">
        <div className="form-page">
          <form onSubmit={handleSubmit}>
            {/* Equipment Type */}
            <div className="form-section">
              <div className="form-section-title">Equipment Type</div>
              <div className="form-section-subtitle">What are you riding?</div>
              
              <div className="radio-group">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="skis"
                    name="equipmentType"
                    value="skis"
                    checked={formData.equipmentType === 'skis'}
                    onChange={handleChange}
                  />
                  <label htmlFor="skis" className="radio-label">Skis</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="snowboard"
                    name="equipmentType"
                    value="snowboard"
                    checked={formData.equipmentType === 'snowboard'}
                    onChange={handleChange}
                  />
                  <label htmlFor="snowboard" className="radio-label">Snowboard</label>
                </div>
              </div>
            </div>

            {/* Equipment Details */}
            <div className="form-section">
              <div className="form-section-title">Equipment Details</div>
              <div className="form-section-subtitle">Tell us about your gear</div>

              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Rossignol, Burton, K2"
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
                  placeholder="e.g., 170"
                />
              </div>

              <div className="form-group">
                <label htmlFor="age">Equipment Age</label>
                <select
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                >
                  <option value="0-1 year">0-1 year old</option>
                  <option value="1-2 years">1-2 years old</option>
                  <option value="2-5 years">2-5 years old</option>
                  <option value="5+ years">5+ years old</option>
                </select>
              </div>
            </div>

            {/* Riding Preferences */}
            <div className="form-section">
              <div className="form-section-title">Riding Preferences</div>
              <div className="form-section-subtitle">How and where do you ride?</div>

              <div className="form-group">
                <label>Terrain Preference</label>
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="powder"
                      name="terrain"
                      value="powder"
                      checked={formData.terrain === 'powder'}
                      onChange={handleChange}
                    />
                    <label htmlFor="powder" className="radio-label">Powder</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="ice-hardpack"
                      name="terrain"
                      value="ice-hardpack"
                      checked={formData.terrain === 'ice-hardpack'}
                      onChange={handleChange}
                    />
                    <label htmlFor="ice-hardpack" className="radio-label">Ice/Hardpack</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="hybrid"
                      name="terrain"
                      value="hybrid"
                      checked={formData.terrain === 'hybrid'}
                      onChange={handleChange}
                    />
                    <label htmlFor="hybrid" className="radio-label">Hybrid (All conditions)</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="park-rails"
                      name="terrain"
                      value="park-rails"
                      checked={formData.terrain === 'park-rails'}
                      onChange={handleChange}
                    />
                    <label htmlFor="park-rails" className="radio-label">Park/Rails</label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Skiing Style</label>
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="on-piste"
                      name="style"
                      value="on-piste"
                      checked={formData.style === 'on-piste'}
                      onChange={handleChange}
                    />
                    <label htmlFor="on-piste" className="radio-label">On-Piste (Groomed runs)</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="off-piste"
                      name="style"
                      value="off-piste"
                      checked={formData.style === 'off-piste'}
                      onChange={handleChange}
                    />
                    <label htmlFor="off-piste" className="radio-label">Off-Piste (Backcountry)</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="both"
                      name="style"
                      value="both"
                      checked={formData.style === 'both'}
                      onChange={handleChange}
                    />
                    <label htmlFor="both" className="radio-label">Both</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance History */}
            <div className="form-section">
              <div className="form-section-title">Maintenance History</div>
              <div className="form-section-subtitle">When did you last service your gear?</div>

              <div className="form-group">
                <label htmlFor="wax">Days of riding since last wax: {formData.daysSinceWax}</label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="wax"
                    name="daysSinceWax"
                    min="0"
                    max="30"
                    value={formData.daysSinceWax}
                    onChange={handleSliderChange}
                    style={{ '--slider-fill': `${(formData.daysSinceWax / 30) * 100}%` }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edge">Days of riding since last edge sharpening: {formData.daysSinceEdgeWork}</label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="edge"
                    name="daysSinceEdgeWork"
                    min="0"
                    max="30"
                    value={formData.daysSinceEdgeWork}
                    onChange={handleSliderChange}
                    style={{ '--slider-fill': `${(formData.daysSinceEdgeWork / 30) * 100}%` }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="coreShots">Number of core shots (visible damage): {formData.coreShots}</label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="coreShots"
                    name="coreShots"
                    min="0"
                    max="10"
                    value={formData.coreShots}
                    onChange={handleSliderChange}
                    style={{ '--slider-fill': `${(formData.coreShots / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Rider Info */}
            <div className="form-section">
              <div className="form-section-title">Rider Info (Optional)</div>
              <div className="form-section-subtitle">Helps us provide better recommendations</div>

              <div className="form-group">
                <label htmlFor="height">Height (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g., 175"
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
                  placeholder="e.g., 70"
                />
              </div>
            </div>

            {/* Form Buttons */}
            <div className="form-buttons">
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Get Recommendations →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
