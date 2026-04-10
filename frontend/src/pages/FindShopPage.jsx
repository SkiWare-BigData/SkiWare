import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

  const mapBounds =
    userCoords && shops.length > 0
      ? [userCoords, ...shops.map((s) => [s.lat, s.lon])]
      : userCoords
      ? [userCoords]
      : null;

  const isBusy = status === 'locating' || status === 'loading';

  return (
    <main className="main-container">
      <section className="shop-page">
        {status !== 'success' ? (
          <div className="shop-intro">
            <h1>Find a nearby shop</h1>
            <p>
              Locate ski and snowboard shops near you for tuning, waxing, and repair
              services within 15 miles.
            </p>
            <div className="shop-actions">
              <button className="btn-primary" onClick={handleFindShops} disabled={isBusy}>
                {isBusy
                  ? status === 'locating'
                    ? 'Detecting location…'
                    : 'Searching…'
                  : 'Use my location'}
              </button>
              <button className="btn-secondary" onClick={onBackToHome}>
                Back to home
              </button>
            </div>
            {status === 'error' && <p className="shop-error-msg">{errorMsg}</p>}
          </div>
        ) : (
          <div className="shop-results">
            <div className="shop-results-header">
              <div className="shop-results-count">
                {shops.length} shop{shops.length !== 1 ? 's' : ''} found
              </div>
              <div className="shop-actions">
                <button className="btn-secondary" onClick={onBackToHome}>
                  Back to home
                </button>
                <button className="btn-primary" onClick={handleFindShops}>
                  Search again
                </button>
              </div>
            </div>

            {shops.length === 0 ? (
              <p className="shop-status-msg">No shops found within 15 miles.</p>
            ) : (
              <div className="shop-results-layout">
                <div className="shop-list-panel">
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
                            <a
                              className="shop-link"
                              href={`tel:${shop.phone}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {shop.phone}
                            </a>
                          )}
                          {shop.website && (
                            <a
                              className="shop-link"
                              href={shop.website}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Website
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

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

                      <Marker position={userCoords} icon={userIcon}>
                        <Popup>Your location</Popup>
                      </Marker>

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
                            <><br /><strong>{shop.distance_miles} mi away</strong></>
                          </Popup>
                        </Marker>
                      ))}

                      <MapController selectedShop={selectedShop} />
                    </MapContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
