import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePolling } from '../contexts/PollingContext';


export default function Home() {
  const navigate = useNavigate();
  const { pollingData } = usePolling();
  const [stats, setStats] = useState(null);
  const isAuthed = !!localStorage.getItem('token');
  const userName = localStorage.getItem('userName') || '';

  useEffect(() => {
    setStats({
      totalRides: Math.floor(Math.random() * 1000) + 500,
      activeUsers: Math.floor(Math.random() * 200) + 100,
      ridesCompleted: Math.floor(Math.random() * 800) + 400
    });
  }, []);

  if (!isAuthed) {
    return (
      <div style={{marginTop:12}}>
        <div className="card pad" style={{textAlign: 'center', marginBottom: 24}}>
          <h1 style={{margin: '0 0 16px', fontSize: '3rem'}}>🚗 ShareMotion</h1>
          <p style={{fontSize: '1.2rem', color: 'var(--muted)', marginBottom: 32}}>
            Connect, Share, and Save on Every Journey
          </p>
          <div style={{display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap'}}>
            <button className="btn primary" onClick={() => navigate('/register')}>
              Get Started
            </button>
            <button className="btn ghost" onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </div>

        <div className="row two" style={{marginBottom: 24}}>
          <div className="card pad">
            <h3 style={{margin: '0 0 12px'}}>🤝 Share Rides</h3>
            <p style={{color: 'var(--muted)'}}>
              Connect with others heading to the same destination and split the cost.
            </p>
          </div>
          <div className="card pad">
            <h3 style={{margin: '0 0 12px'}}>💰 Save Money</h3>
            <p style={{color: 'var(--muted)'}}>
              Reduce travel expenses by sharing rides with trusted community members.
            </p>
          </div>
          <div className="card pad">
            <h3 style={{margin: '0 0 12px'}}>🌱 Go Green</h3>
            <p style={{color: 'var(--muted)'}}>
              Help reduce carbon footprint by sharing vehicles and reducing traffic.
            </p>
          </div>
          <div className="card pad">
            <h3 style={{margin: '0 0 12px'}}>📱 Easy to Use</h3>
            <p style={{color: 'var(--muted)'}}>
              Simple interface to post rides, find matches, and communicate with riders.
            </p>
          </div>
        </div>

        {stats && (
          <div className="card pad" style={{textAlign: 'center'}}>
            <h3 style={{margin: '0 0 20px'}}>Join Our Growing Community</h3>
            <div className="row two">
              <div>
                <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)'}}>{stats.totalRides}</div>
                <div style={{color: 'var(--muted)'}}>Total Rides Posted</div>
              </div>
              <div>
                <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)'}}>{stats.activeUsers}</div>
                <div style={{color: 'var(--muted)'}}>Active Users</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{marginTop:12}}>
      <div className="card pad" style={{marginBottom: 24}}>
        <h1 style={{margin: '0 0 8px'}}>Welcome back, {userName}! 👋</h1>
        <p style={{color: 'var(--muted)', marginBottom: 24}}>
          Ready for your next journey? Here's what's happening in your ShareMotion community.
        </p>
        
        <div className="row two">
          <button 
            className="btn primary" 
            onClick={() => navigate('/post-ride')}
            style={{padding: '16px 24px'}}
          >
            🚗 Post a Ride
          </button>
          <button 
            className="btn ghost" 
            onClick={() => navigate('/rides')}
            style={{padding: '16px 24px'}}
          >
            🔍 Find Rides
          </button>
        </div>
      </div>

      <div className="row two" style={{marginBottom: 24}}>
        <div className="card pad">
          <h3 style={{margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8}}>
            💬 Messages
            {pollingData.unreadMessages > 0 && (
              <span className="notification-badge">{pollingData.unreadMessages}</span>
            )}
          </h3>
          <p style={{color: 'var(--muted)', marginBottom: 16}}>
            {pollingData.unreadMessages > 0 
              ? `You have ${pollingData.unreadMessages} unread message${pollingData.unreadMessages > 1 ? 's' : ''}`
              : 'No new messages'
            }
          </p>
          <button className="btn ghost" onClick={() => navigate('/messages')}>
            View Messages
          </button>
        </div>

        <div className="card pad">
          <h3 style={{margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8}}>
            📋 Ride Requests
            {pollingData.newRequests > 0 && (
              <span className="notification-badge">{pollingData.newRequests}</span>
            )}
          </h3>
          <p style={{color: 'var(--muted)', marginBottom: 16}}>
            {pollingData.newRequests > 0 
              ? `You have ${pollingData.newRequests} new ride request${pollingData.newRequests > 1 ? 's' : ''}`
              : 'No new ride requests'
            }
          </p>
          <button className="btn ghost" onClick={() => navigate('/my-rides')}>
            Manage Rides
          </button>
        </div>
      </div>

      {pollingData.recommendedRides.length > 0 && (
        <div className="card pad">
          <h3 style={{margin: '0 0 16px'}}>🎯 Recommended for You</h3>
          <div className="list">
            {pollingData.recommendedRides.slice(0, 3).map(ride => (
              <div key={ride._id} className="card pad" style={{marginBottom: 8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <h4 style={{margin:"0 0 4px"}}>
                      {ride.startLocation?.address} ➜ {ride.endLocation?.address}
                    </h4>
                    <div style={{fontSize: 14, color: 'var(--muted)'}}>
                      by {ride.postedBy?.name} • ${ride.basePrice}
                    </div>
                  </div>
                  <button 
                    className="btn primary" 
                    onClick={() => navigate(`/ride/${ride._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="btn ghost" 
            onClick={() => navigate('/rides')}
            style={{marginTop: 16}}
          >
            View All Recommendations
          </button>
        </div>
      )}
    </div>
  );
}
