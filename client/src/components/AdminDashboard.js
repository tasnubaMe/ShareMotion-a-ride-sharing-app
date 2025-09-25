import { useEffect, useState } from 'react';
import axios from 'axios';
import { LoadingSpinner } from './Loading';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [activityReport, setActivityReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data);
    } catch (err) {
      setError('Error fetching users');
    }
  };

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/admin/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback(data);
    } catch (err) {
      setError('Error fetching feedback');
    }
  };

  const fetchSOSAlerts = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/admin/sos-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSosAlerts(data);
    } catch (err) {
      setError('Error fetching SOS alerts');
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/admin/reports/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityReport(data);
    } catch (err) {
      setError('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const warnUser = async (userId, message) => {
    if (!message || !message.trim()) {
      alert('Please enter a warning message');
      return;
    }

    try {
      const token = localStorage.getItem('token') || '';
      await axios.post(`${API}/api/admin/users/${userId}/warn`, 
        { message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Warning issued successfully');
      fetchUsers();
    } catch (err) {
      alert(`Error issuing warning: ${err.response?.data?.message || err.message}`);
    }
  };

  const suspendUser = async (userId, reason) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;

    try {
      const token = localStorage.getItem('token') || '';
      await axios.post(`${API}/api/admin/users/${userId}/suspend`, 
        { reason: reason || 'No reason provided' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User suspended successfully');
      fetchUsers();
    } catch (err) {
      alert(`Error suspending user: ${err.response?.data?.message || err.message}`);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token') || '';
      await axios.delete(`${API}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User deleted successfully');
      fetchUsers();
    } catch (err) {
      alert(`Error deleting user: ${err.response?.data?.message || err.message}`);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchFeedback();
    fetchSOSAlerts();
  }, []);

  const renderOverview = () => (
    <div className="row two">
      <div className="card pad">
        <h3>👥 Users</h3>
        <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)'}}>
          {users.filter(u => u.status === 'Active').length}
        </div>
        <div style={{color: 'var(--muted)'}}>Active Users</div>
        <div style={{marginTop: 8, fontSize: 14}}>
          {users.filter(u => u.status === 'Suspended').length} suspended
        </div>
      </div>

      <div className="card pad">
        <h3>⭐ Feedback</h3>
        <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)'}}>
          {feedback.length}
        </div>
        <div style={{color: 'var(--muted)'}}>Total Reviews</div>
      </div>

      <div className="card pad">
        <h3>🚨 SOS Alerts</h3>
        <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#ef4444'}}>
          {sosAlerts.filter(a => a.status === 'Active').length}
        </div>
        <div style={{color: 'var(--muted)'}}>Active Alerts</div>
        <div style={{marginTop: 8, fontSize: 14}}>
          {sosAlerts.length} total
        </div>
      </div>

      <div className="card pad">
        <h3>📊 Reports</h3>
        <button 
          className="btn primary" 
          onClick={generateReport}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="list">
      {users.map(user => (
        <div key={user._id} className="card pad">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <h4 style={{margin:"0 0 8px"}}>{user.name}</h4>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <span className="badge">{user.email}</span>
                <span className={`badge ${user.status === 'Active' ? 'open' : 'closed'}`}>
                  {user.status}
                </span>
                {user.isAdmin && <span className="badge" style={{backgroundColor: 'var(--accent)'}}>Admin</span>}
                {user.warnings?.length > 0 && (
                  <span className="badge" style={{backgroundColor: '#f59e0b'}}>
                    ⚠️ {user.warnings.length} warning{user.warnings.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button 
                className="btn ghost" 
                onClick={() => {
                  const message = prompt('Enter warning message:');
                  if (message) warnUser(user._id, message);
                }}
              >
                Warn
              </button>
              {user.status === 'Active' && (
                <button 
                  className="btn ghost" 
                  onClick={() => {
                    const reason = prompt('Enter suspension reason (optional):');
                    suspendUser(user._id, reason);
                  }}
                >
                  Suspend
                </button>
              )}
              {user.status !== 'Deleted' && (
                <button 
                  className="btn ghost" 
                  onClick={() => deleteUser(user._id)}
                  style={{color: '#ef4444'}}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderFeedback = () => (
    <div className="list">
      {feedback.map(item => (
        <div key={item._id} className="card pad">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <div style={{display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8}}>
                <span style={{fontWeight: 'bold'}}>{item.fromUser?.name}</span>
                <span style={{color: 'var(--muted)'}}>→</span>
                <span style={{fontWeight: 'bold'}}>{item.toUser?.name}</span>
              </div>
              <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8}}>
                <span className="badge">⭐ {item.rating}/5</span>
                <span className="badge">{item.category}</span>
                {item.rideId && (
                  <span className="badge">
                    🚗 {item.rideId.startLocation?.address} → {item.rideId.endLocation?.address}
                  </span>
                )}
              </div>
              {item.comment && (
                <div style={{color: 'var(--muted)', fontStyle: 'italic'}}>
                  "{item.comment}"
                </div>
              )}
            </div>
            <div style={{fontSize: 12, color: 'var(--muted)'}}>
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSOSAlerts = () => (
    <div className="list">
      {sosAlerts.map(alert => (
        <div key={alert._id} className="card pad">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <h4 style={{margin: '0 0 8px'}}>🚨 SOS Alert from {alert.user?.name}</h4>
              <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8}}>
                <span className={`badge ${alert.status === 'Active' ? 'closed' : 'open'}`}>
                  {alert.status}
                </span>
                <span className="badge">📍 {alert.location?.address}</span>
                {alert.rideId && (
                  <span className="badge">
                    🚗 {alert.rideId.startLocation?.address} → {alert.rideId.endLocation?.address}
                  </span>
                )}
              </div>
              {alert.message && (
                <div style={{color: 'var(--muted)', fontStyle: 'italic'}}>
                  "{alert.message}"
                </div>
              )}
              <div style={{fontSize: 12, color: 'var(--muted)', marginTop: 8}}>
                Created: {new Date(alert.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderActivityReport = () => {
    if (!activityReport) return <div className="empty">Generate a report to view activity data</div>;

    return (
      <div className="card pad">
        <h3>📊 Activity Report</h3>
        <div style={{fontSize: 14, color: 'var(--muted)', marginBottom: 16}}>
          Period: {new Date(activityReport.period.start).toLocaleDateString()} - {new Date(activityReport.period.end).toLocaleDateString()}
        </div>

        <div className="row two" style={{marginBottom: 24}}>
          <div>
            <h4>👥 User Statistics</h4>
            <div>Total Users: {activityReport.userStats.total}</div>
            <div>Active Users: {activityReport.userStats.active}</div>
            <div>Suspended Users: {activityReport.userStats.suspended}</div>
          </div>
          <div>
            <h4>🚗 Ride Statistics</h4>
            <div>Total Rides: {activityReport.rideStats.total}</div>
            <div>Completed Rides: {activityReport.rideStats.completed}</div>
            <div>Completion Rate: {activityReport.rideStats.completionRate}</div>
          </div>
        </div>

        <div className="row two" style={{marginBottom: 24}}>
          <div>
            <h4>📋 Request Statistics</h4>
            <div>Total Requests: {activityReport.requestStats.total}</div>
            <div>Confirmed Requests: {activityReport.requestStats.confirmed}</div>
            <div>Confirmation Rate: {activityReport.requestStats.confirmationRate}</div>
          </div>
          <div>
            <h4>🛡️ Safety Statistics</h4>
            <div>Warnings Issued: {activityReport.safetyStats.warningsIssued}</div>
            <div>SOS Alerts: {activityReport.safetyStats.sosAlerts}</div>
            <div>Active Alerts: {activityReport.safetyStats.activeAlerts}</div>
          </div>
        </div>

        <div style={{fontSize: 12, color: 'var(--muted)'}}>
          Report generated: {new Date(activityReport.generatedAt).toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div style={{marginTop: 12}}>
      <h2 style={{marginTop: 0}}>Admin Dashboard</h2>

      {error && <div className="card pad" style={{borderColor: "rgba(239,68,68,.4)"}}>{error}</div>}

      <div style={{display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap'}}>
        <button 
          className={`btn ${activeTab === 'overview' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`btn ${activeTab === 'users' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button 
          className={`btn ${activeTab === 'feedback' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback ({feedback.length})
        </button>
        <button 
          className={`btn ${activeTab === 'sos' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('sos')}
        >
          SOS Alerts ({sosAlerts.filter(a => a.status === 'Active').length})
        </button>
        <button 
          className={`btn ${activeTab === 'reports' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'feedback' && renderFeedback()}
      {activeTab === 'sos' && renderSOSAlerts()}
      {activeTab === 'reports' && renderActivityReport()}
    </div>
  );
}
