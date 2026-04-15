import { useCallback, useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import Header from '../components/Header';

const RADIUS_OPTIONS = [10, 25, 50];
const DEFAULT_CENTER = { lat: 39.7392, lng: -104.9903 };

function getDirectionsUrl(shop) {
  if (shop.google_maps_url) {
    return shop.google_maps_url;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name)}`;
}

export default function FindShopPage({ onBackToHome, onFindShop }) {
  const [radiusIndex, setRadiusIndex] = useState(1);
  const [shops, setShops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const radiusMiles = RADIUS_OPTIONS[radiusIndex];

  const sortedShops = useMemo(
    () => [...shops].sort((a, b) => a.distance_miles - b.distance_miles),
    [shops],
  );

  const fetchShops = useCallback(async (lat, lng, activeRadius = radiusMiles) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/shops?lat=${lat}&lng=${lng}&radius_miles=${activeRadius}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Failed to load nearby shops.');
      }
      const payload = await response.json();
      setShops(payload.shops ?? []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load nearby shops.');
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [radiusMiles]);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setError('Geolocation is not available in your browser.');
      return;
    }

    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(nextLocation);
        setMapCenter(nextLocation);
        setLocationDenied(false);
        setLocationLabel('Using your current location');
      },
      () => {
        setLocationDenied(true);
        setError('Location access denied. Enter a city or zip code to search.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    requestBrowserLocation();
  }, []);

  useEffect(() => {
    if (!userLocation) {
      return;
    }
    fetchShops(userLocation.lat, userLocation.lng, radiusMiles);
  }, [userLocation, radiusMiles, fetchShops]);

  const handleFallbackSubmit = async (event) => {
    event.preventDefault();
    const query = locationQuery.trim();
    if (!query) {
      setError('Please enter a city or zip code.');
      return;
    }

    setGeocoding(true);
    setError('');
    try {
      const response = await fetch(`/api/geocode?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Unable to geocode that location.');
      }
      const payload = await response.json();
      const nextLocation = { lat: payload.lat, lng: payload.lng };
      setUserLocation(nextLocation);
      setMapCenter(nextLocation);
      setLocationLabel(`Searching near ${payload.formatted_address}`);
      setLocationDenied(false);
    } catch (requestError) {
      setError(requestError.message || 'Unable to geocode that location.');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="app">
      <Header onFindShop={onFindShop} />
      <div className="main-container">
        <div className="find-shop-page">
          <h1>Find a Shop</h1>
          <p className="find-shop-description">
            Find nearby ski and snowboard tuning shops based on your location.
          </p>

          <div className="shop-controls">
            <label htmlFor="radius-range">Search radius: {radiusMiles} miles</label>
            <input
              id="radius-range"
              type="range"
              min="0"
              max="2"
              step="1"
              value={radiusIndex}
              onChange={(event) => setRadiusIndex(parseInt(event.target.value, 10))}
              style={{ '--slider-fill': `${(radiusIndex / 2) * 100}%` }}
            />
            <div className="radius-labels">
              {RADIUS_OPTIONS.map((value) => (
                <span key={value}>{value} mi</span>
              ))}
            </div>
          </div>

          {(locationDenied || !userLocation) && (
            <form className="fallback-location-form" onSubmit={handleFallbackSubmit}>
              <label htmlFor="location-query">Use city or zip code instead</label>
              <div className="fallback-location-actions">
                <input
                  id="location-query"
                  type="text"
                  value={locationQuery}
                  onChange={(event) => setLocationQuery(event.target.value)}
                  placeholder="e.g., Park City, UT or 84060"
                />
                <button type="submit" className="btn-primary" disabled={geocoding}>
                  {geocoding ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
          )}

          {locationLabel && <p className="location-label">{locationLabel}</p>}
          {error && <p className="shop-error">{error}</p>}

          <div className="shop-results-layout">
            <div className="shop-map">
              {!mapsApiKey ? (
                <div className="shop-empty-state">
                  Missing `VITE_GOOGLE_MAPS_API_KEY` in frontend environment.
                </div>
              ) : (
                <APIProvider apiKey={mapsApiKey}>
                  <Map
                    style={{ width: '100%', height: '100%' }}
                    defaultCenter={mapCenter}
                    defaultZoom={10}
                    gestureHandling="greedy"
                  >
                    {sortedShops.map((shop) => (
                      <Marker key={`${shop.name}-${shop.address}`} position={{ lat: shop.lat, lng: shop.lng }} />
                    ))}
                  </Map>
                </APIProvider>
              )}
            </div>

            <aside className="shop-sidebar">
              {loading && <p>Loading nearby shops...</p>}
              {!loading && sortedShops.length === 0 && !error && (
                <p>No ski shops found within {radiusMiles} miles.</p>
              )}
              {!loading && sortedShops.length > 0 && (
                <ul className="shop-list">
                  {sortedShops.map((shop) => (
                    <li key={`${shop.name}-${shop.address}`} className="shop-list-item">
                      <h3>{shop.name}</h3>
                      <p>{shop.address}</p>
                      <p>{shop.rating ? `Rating: ${shop.rating.toFixed(1)} / 5` : 'Rating unavailable'}</p>
                      <p>{shop.phone || 'Phone unavailable'}</p>
                      <p>
                        {shop.open_now === true && 'Open now'}
                        {shop.open_now === false && 'Closed now'}
                        {shop.open_now == null && 'Hours unavailable'}
                      </p>
                      <p>{shop.distance_miles.toFixed(2)} miles away</p>
                      <a
                        className="btn-secondary get-directions-link"
                        href={getDirectionsUrl(shop)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Get Directions
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>

          <div className="find-shop-actions">
            <button className="btn-secondary" onClick={onBackToHome}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
