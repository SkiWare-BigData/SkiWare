import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dot icons — avoids Vite/Leaflet default-icon path issues
const shopIcon = L.divIcon({
  className: '',
  html: '<div class="map-dot map-dot-shop"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

const userIcon = L.divIcon({
  className: '',
  html: '<div class="map-dot map-dot-user"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Flies to a shop when selectedShop changes
function MapController({ selectedShop }) {
  const map = useMap();
  useEffect(() => {
    if (selectedShop) {
      map.flyTo([selectedShop.lat, selectedShop.lon], 15, { duration: 0.7 });
    }
  }, [selectedShop]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function FindShopPage({ onBackToHome }) {
  const [status, setStatus] = useState('idle');
  const [shops, setShops] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);

  const handleFindShops = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setStatus('error');
      return;
    }

    setStatus('locating');
    setSelectedShop(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords([latitude, longitude]);
        setStatus('loading');
        try {
          const res = await fetch(`/api/shops/nearest?lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          const data = await res.json();
          setShops(data);
          setStatus('success');
        } catch (err) {
          console.error('[FindShopPage]', err);
          setErrorMsg('Could not load nearby shops. Please try again.');
          setStatus('error');
        }
      },
      (err) => {
        setErrorMsg(
          err.code === 1
            ? 'Location access was denied. Please allow location access and try again.'
            : 'Could not determine your location. Please try again.'
        );
        setStatus('error');
      }
    );
  };

  // Map bounds: fit user + all shops
  const mapBounds =
    userCoords && shops.length > 0
      ? [userCoords, ...shops.map((s) => [s.lat, s.lon])]
      : userCoords
      ? [userCoords]
      : null;

  return (
    <div className="main-container">
      <div className={`find-shop-page${status === 'success' ? ' find-shop-page--results' : ''}`}>
        <h1>Find a Nearby Shop</h1>
        <p className="find-shop-description">
          Locate ski and sports shops near you for tuning, waxing, and repair services.
        </p>

        {status === 'idle' && (
          <div className="find-shop-actions">
            <button className="btn-primary" onClick={handleFindShops}>
              Use My Location
            </button>
            <button className="btn-secondary" onClick={onBackToHome}>
              Back to Home
            </button>
          </div>
        )}

        {(status === 'locating' || status === 'loading') && (
          <p className="shop-status-msg">
            {status === 'locating' ? 'Detecting your location…' : 'Searching for nearby shops…'}
          </p>
        )}

        {status === 'error' && (
          <div>
            <p className="shop-error-msg">{errorMsg}</p>
            <div className="find-shop-actions">
              <button className="btn-primary" onClick={handleFindShops}>Try Again</button>
              <button className="btn-secondary" onClick={onBackToHome}>Back to Home</button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="shop-results">
            <p className="shop-results-count">
              {shops.length} shop{shops.length !== 1 ? 's' : ''} found nearby
            </p>

            <div className="shop-results-layout">
              {/* ── List panel ── */}
              <div className="shop-list-panel">
                {shops.length === 0 ? (
                  <p className="shop-status-msg">No shops found within 15 miles.</p>
                ) : (
                  <ul className="shop-list">
                    {shops.map((shop, i) => (
                      <li
                        key={i}
                        className={`shop-card${selectedShop === shop ? ' shop-card--selected' : ''}`}
                        onClick={() => setSelectedShop(shop)}
                      >
                        <div className="shop-card-header">
                          <span className="shop-card-name">{shop.name}</span>
                          <span className="shop-distance">{shop.distance_miles} mi</span>
                        </div>
                        {shop.address && <p className="shop-detail">{shop.address}</p>}
                        <div className="shop-links">
                          {shop.phone && (
                            <a className="shop-link" href={`tel:${shop.phone}`} onClick={(e) => e.stopPropagation()}>
                              {shop.phone}
                            </a>
                          )}
                          {shop.website && (
                            <a className="shop-link" href={shop.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                              Website
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ── Map panel ── */}
              {mapBounds && (
                <div className="shop-map-panel">
                  <MapContainer
                    bounds={mapBounds}
                    boundsOptions={{ padding: [40, 40] }}
                    className="shop-map"
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* User location */}
                    <Marker position={userCoords} icon={userIcon}>
                      <Popup>Your location</Popup>
                    </Marker>

                    {/* Shop markers */}
                    {shops.map((shop, i) => (
                      <Marker key={i} position={[shop.lat, shop.lon]} icon={shopIcon}>
                        <Popup>
                          <strong>{shop.name}</strong>
                          {shop.address && <><br />{shop.address}</>}
                          {shop.phone && (
                            <><br /><a href={`tel:${shop.phone}`}>{shop.phone}</a></>
                          )}
                          {shop.website && (
                            <><br /><a href={shop.website} target="_blank" rel="noreferrer">Website</a></>
                          )}
                          <><br /><span style={{ color: '#3668ef', fontWeight: 700 }}>{shop.distance_miles} mi away</span></>
                        </Popup>
                      </Marker>
                    ))}

                    <MapController selectedShop={selectedShop} />
                  </MapContainer>
                </div>
              )}
            </div>

            <div className="find-shop-actions" style={{ marginTop: '20px' }}>
              <button className="btn-secondary" onClick={onBackToHome}>Back to Home</button>
              <button className="btn-primary" onClick={handleFindShops}>Search Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
