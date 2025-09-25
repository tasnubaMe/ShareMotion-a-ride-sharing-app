import { useState } from 'react';
import MapComponent from './MapComponent';

export default function LocationSelector({ label, value, onChange, placeholder, required, error }) {
  const [showMap, setShowMap] = useState(false);
  const [tempLocation, setTempLocation] = useState({ address: '', lat: null, lng: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        setTempLocation({
          address: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        });
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      alert('Error searching for location. Please try again.');
    }
  };

  const confirmLocation = () => {
    onChange(tempLocation);
    setShowMap(false);
  };

  const handleLocationSelect = (location) => {
    if (location.isLoading) {
      setIsGettingLocation(true);
      setTempLocation({ lat: location.lat, lng: location.lng, address: '' });
    } else {
      setIsGettingLocation(false);
      setTempLocation(location);
    }
  };


  return (
    <div>
      <label className="label">{label}</label>
      <div style={{display: 'flex', gap: 8}}>
        <input
          className={`input ${error ? 'error' : ''}`}
          type="text"
          placeholder={typeof value === 'string' ? value : value?.address || placeholder}
          value={typeof value === 'string' ? value : value?.address || ''}
          readOnly
          required={required}
          style={{flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed'}}
        />
        <button
          type="button"
          className="btn primary"
          onClick={() => setShowMap(true)}
          title="Select location on map"
        >
          🗺️ Select on Map
        </button>
      </div>
      {error && <div className="validation-error">{error}</div>}

      {showMap && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card pad" style={{width: 'min(90vw, 600px)', maxHeight: '80vh'}}>
            <h3 style={{marginTop: 0}}>Select Location</h3>
            
            <div style={{marginBottom: 16}}>
              <label className="label">Search for a location</label>
              <div style={{display: 'flex', gap: 8}}>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g., Dhaka, Bangladesh"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                  style={{flex: 1}}
                />
                <button 
                  type="button" 
                  className="btn primary" 
                  onClick={searchLocation}
                >
                  Search
                </button>
              </div>
            </div>
            
            <MapComponent
              height={300}
              onLocationSelect={handleLocationSelect}
              selectedLocation={tempLocation}
              style={{ marginBottom: 16 }}
            />

            <div style={{marginBottom: 16}}>
              <p style={{color: 'var(--muted)', fontSize: 14, marginBottom: 8}}>
                💡 Click anywhere on the map to select a location, or use the 📍 button on the map for your current location
              </p>
              
              {isGettingLocation && (
                <div className="card pad" style={{background: 'rgba(255,255,255,0.05)', textAlign: 'center'}}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid var(--primary)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Getting location name...
                  </div>
                </div>
              )}
              
              {tempLocation.address && !isGettingLocation && (
                <div className="card pad" style={{background: 'rgba(255,255,255,0.05)'}}>
                  <strong>Selected:</strong> {tempLocation.address}
                  <br />
                  <small style={{color: 'var(--muted)'}}>
                    Coordinates: {tempLocation.lat?.toFixed(4)}, {tempLocation.lng?.toFixed(4)}
                  </small>
                </div>
              )}
            </div>

            <div style={{display: 'flex', gap: 10}}>
              <button 
                type="button" 
                className="btn primary" 
                onClick={confirmLocation}
                disabled={!tempLocation.lat}
              >
                Confirm Location
              </button>
              <button 
                type="button" 
                className="btn ghost" 
                onClick={() => setShowMap(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
