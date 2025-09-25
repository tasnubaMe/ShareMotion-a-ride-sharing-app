import { useState } from 'react';
import axios from 'axios';
import LocationSelector from './LocationSelector';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function SOSButton({ rideId, onAlertSent }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    message: ''
  });

  const handleSOS = async (e) => {
    e.preventDefault();
    
    if (!formData.location || !formData.location.address) {
      alert('Please select your current location');
      return;
    }

    if (!window.confirm('Are you sure you want to send an SOS alert? This will notify emergency contacts and authorities.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      await axios.post(`${API}/api/sos`, {
        location: formData.location,
        message: formData.message.trim() || undefined,
        rideId: rideId || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('🚨 SOS alert sent successfully! Emergency contacts have been notified.');
      setShowModal(false);
      setFormData({ location: '', message: '' });
      if (onAlertSent) onAlertSent();
    } catch (err) {
      alert(`Error sending SOS alert: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const shareLiveLocation = async () => {
    if (!formData.location || !formData.location.address) {
      alert('Please select your current location first');
      return;
    }

    if (!window.confirm('Enable live location sharing with your emergency contacts?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      await axios.post(`${API}/api/sos/share-location`, {
        location: formData.location,
        rideId: rideId || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ Live location sharing enabled! Your emergency contacts can now track your location.');
      setShowModal(false);
      setFormData({ location: '', message: '' });
    } catch (err) {
      alert(`Error enabling location sharing: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className="btn" 
        onClick={() => setShowModal(true)}
        style={{
          backgroundColor: '#ef4444',
          color: 'white',
          fontSize: '1.1rem',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        🚨 SOS
      </button>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card pad" style={{
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <h2 style={{margin: 0, color: '#ef4444'}}>🚨 Emergency SOS</h2>
              <button 
                className="btn ghost" 
                onClick={() => setShowModal(false)}
                style={{fontSize: '1.5rem', padding: '4px 8px'}}
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(239,68,68,0.1)',
              borderRadius: '8px',
              marginBottom: 16,
              border: '1px solid rgba(239,68,68,0.3)'
            }}>
              <p style={{margin: 0, color: '#ef4444', fontWeight: 'bold'}}>
                ⚠️ Use this button only in genuine emergency situations.
              </p>
              <p style={{margin: '8px 0 0 0', fontSize: '14px'}}>
                This will immediately notify your emergency contacts and authorities with your location.
              </p>
            </div>

            <form onSubmit={handleSOS}>
              <div style={{marginBottom: 16}}>
                <label className="label">Current Location *</label>
                <LocationSelector
                  value={formData.location}
                  onChange={(location) => setFormData({...formData, location})}
                  placeholder="Select your current location"
                  required
                />
              </div>

              <div style={{marginBottom: 16}}>
                <label className="label">Emergency Message (Optional)</label>
                <textarea 
                  className="input"
                  rows="3"
                  placeholder="Describe the emergency situation..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
                <button 
                  className="btn" 
                  type="submit" 
                  disabled={loading || !formData.location?.address}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    flex: 1
                  }}
                >
                  {loading ? 'Sending...' : '🚨 Send SOS Alert'}
                </button>
                
                <button 
                  className="btn ghost" 
                  type="button" 
                  onClick={shareLiveLocation}
                  disabled={loading || !formData.location?.address}
                >
                  📍 Share Live Location
                </button>
              </div>
            </form>

            <div style={{
              marginTop: 16,
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '6px',
              fontSize: '14px',
              color: 'var(--muted)'
            }}>
              <p style={{margin: '0 0 8px 0'}}><strong>What happens when you press SOS?</strong></p>
              <ul style={{margin: '0', paddingLeft: '20px'}}>
                <li>Your emergency contacts are immediately notified</li>
                <li>Your current location is shared with them</li>
                <li>Authorities are alerted if configured</li>
                <li>Your ride details are included if applicable</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
