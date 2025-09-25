import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [authStatus, setAuthStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: ''
  });

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const userIsAdmin = localStorage.getItem('userIsAdmin');
    
    if (!token) {
      setAuthStatus('No token found - please log in');
    } else if (!userEmail) {
      setAuthStatus('Token found but no user email - please log in again');
    } else {
      setAuthStatus(`Authenticated as: ${userEmail} ${userIsAdmin === 'true' ? '(Admin)' : ''}`);
    }
  };

  const fetchContacts = async () => {
    try {
      setError('');
      setLoading(true);
      const token = localStorage.getItem('token') || '';
      
      console.log('Token found:', !!token);
      console.log('Token length:', token.length);
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      console.log('Making API call to:', `${API}/api/auth/profile`);
      
      const { data } = await axios.get(`${API}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Profile data received:', data);
      console.log('Emergency contacts:', data.emergencyContacts);
      setContacts(data.emergencyContacts || []);
    } catch (err) {
      console.error('Error fetching emergency contacts:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('User profile not found.');
      } else {
        setError(`Error fetching emergency contacts: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Name and phone number are required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const newContact = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        relationship: formData.relationship.trim() || undefined
      };

      await axios.patch(`${API}/api/auth/profile`, {
        emergencyContacts: [...contacts, newContact]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setContacts([...contacts, newContact]);
      setFormData({ name: '', phone: '', email: '', relationship: '' });
      setShowForm(false);
    } catch (err) {
      alert(`Error adding contact: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeContact = async (index) => {
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) return;

    try {
      const token = localStorage.getItem('token') || '';
      const updatedContacts = contacts.filter((_, i) => i !== index);
      
      await axios.patch(`${API}/api/auth/profile`, {
        emergencyContacts: updatedContacts
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setContacts(updatedContacts);
    } catch (err) {
      alert(`Error removing contact: ${err.response?.data?.message || err.message}`);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div style={{marginTop: 12}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
        <h2 style={{margin: 0}}>Emergency Contacts</h2>
        <div style={{display: 'flex', gap: 8}}>
          <button 
            className="btn ghost" 
            onClick={fetchContacts}
            disabled={loading}
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
          <button 
            className="btn primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Contact'}
          </button>
        </div>
      </div>

      {error && <div className="card pad" style={{borderColor: "rgba(239,68,68,.4)"}}>{error}</div>}

      {loading ? (
        <div className="empty">
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 24, marginBottom: 8}}>⏳</div>
            Loading emergency contacts...
          </div>
        </div>
      ) : (
        <>
          {showForm && (
            <form className="card pad" onSubmit={addContact} style={{marginBottom: 16}}>
              <h3 style={{marginTop: 0}}>Add Emergency Contact</h3>
              <div className="row two">
                <div>
                  <label className="label">Name *</label>
                  <input 
                    className="input" 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contact name"
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input 
                    className="input" 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>
              <div className="row two">
                <div>
                  <label className="label">Email</label>
                  <input 
                    className="input" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Email address (optional)"
                  />
                </div>
                <div>
                  <label className="label">Relationship</label>
                  <input 
                    className="input" 
                    type="text" 
                    value={formData.relationship}
                    onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                    placeholder="e.g., Spouse, Parent, Friend"
                  />
                </div>
              </div>
              <div style={{display: 'flex', gap: 10, marginTop: 16}}>
                <button 
                  className="btn primary" 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Contact'}
                </button>
                <button 
                  className="btn ghost" 
                  type="button" 
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {contacts.length === 0 ? (
            <div className="empty">
              No emergency contacts added yet. Add contacts to ensure your safety during rides.
            </div>
          ) : (
            <div className="list">
              {contacts.map((contact, index) => (
                <div key={index} className="card pad">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <h4 style={{margin: '0 0 8px'}}>{contact.name}</h4>
                      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
                        <span className="badge">📞 {contact.phone}</span>
                        {contact.email && <span className="badge">📧 {contact.email}</span>}
                        {contact.relationship && <span className="badge">👥 {contact.relationship}</span>}
                      </div>
                    </div>
                    <button 
                      className="btn ghost" 
                      onClick={() => removeContact(index)}
                      style={{color: '#ef4444'}}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="card pad" style={{marginTop: 16, backgroundColor: 'rgba(255,255,255,0.05)'}}>
        <h4 style={{margin: '0 0 12px'}}>🛡️ Safety Information</h4>
        <div style={{fontSize: 14, color: 'var(--muted)'}}>
          <p>Emergency contacts will be automatically notified when you:</p>
          <ul style={{margin: '8px 0', paddingLeft: 20}}>
            <li>Press the SOS button during a ride</li>
            <li>Enable live location sharing</li>
            <li>Send an emergency alert</li>
          </ul>
          <p>Make sure to add trusted contacts who can help in emergency situations.</p>
        </div>
      </div>
    </div>
  );
}
