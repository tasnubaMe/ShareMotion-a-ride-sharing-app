import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LoadingPage } from './Loading';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function valToAddress(v){
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.address || v.name || `${v.lat ?? ''} ${v.lng ?? ''}`.trim();
}

export default function RideHistory() {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/rides/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(data);
    } catch (err) {
      setError('Error fetching ride history');
      setHistory({ postedRides: [], joinedRides: [] });
    }
  };

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contractMap = {};
      (data || []).forEach(contract => {
        contractMap[contract._id] = contract.name;
      });
      setContracts(contractMap);
    } catch {
      setContracts({});
    }
  };

  useEffect(() => { 
    fetchHistory(); 
    fetchContracts();
  }, []);

  const RideCard = ({ ride, type }) => (
    <div className="card pad" style={{marginBottom: 12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
        <div>
          <h4 style={{margin:"0 0 6px"}}>{valToAddress(ride.startLocation)} ➜ {valToAddress(ride.endLocation)}</h4>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <span className={`badge ${ride.status === 'Open' ? 'open' : ride.status === 'Completed' ? 'completed' : 'closed'}`}>
              {ride.status}
            </span>
            <span className="badge">🪑 {ride.seats} seat{ride.seats > 1 ? "s" : ""}</span>
            <span className="badge">📅 {ride.dateTime ? ride.dateTime.slice(0,10) : ''}</span>
            <span className="badge">💸 {ride.basePrice ? `${ride.basePrice}` : "Free"}</span>
            <span className="badge">{type === 'posted' ? '📝 Posted' : '👥 Joined'}</span>
            {ride.isRecurring && <span className="badge" style={{backgroundColor: 'var(--accent)'}}>🔄 Recurring</span>}
            {ride.contractId && contracts[ride.contractId] && (
              <span className="badge" style={{backgroundColor: 'var(--accent)'}}>📋 {contracts[ride.contractId]}</span>
            )}
          </div>
        </div>
        <button className="btn ghost" onClick={() => navigate(`/ride/${ride._id}`)}>
          View Details
        </button>
      </div>
      {ride.isRecurring && ride.contractId && contracts[ride.contractId] && (
        <div style={{marginTop: 8, fontSize: 14, color: 'var(--muted)'}}>
          Part of {contracts[ride.contractId]} contract
        </div>
      )}
    </div>
  );

  return (
    <div style={{marginTop:12}}>
      <h2 style={{marginTop:0}}>Ride History</h2>
      
      {error && <div className="card pad" style={{borderColor:"rgba(239,68,68,.4)"}}>{error}</div>}
      {!history && <LoadingPage message="Loading your ride history..." />}
      
      {history && (
        <>
          <h3>Posted Rides ({history.postedRides.length})</h3>
          {history.postedRides.length === 0 ? (
            <div className="empty">No posted rides yet.</div>
          ) : (
            <div className="list">
              {history.postedRides.map(ride => (
                <RideCard key={ride._id} ride={ride} type="posted" />
              ))}
            </div>
          )}

          <h3 style={{marginTop: 32}}>Joined Rides ({history.joinedRides.length})</h3>
          {history.joinedRides.length === 0 ? (
            <div className="empty">No joined rides yet.</div>
          ) : (
            <div className="list">
              {history.joinedRides.map(ride => (
                <RideCard key={ride._id} ride={ride} type="joined" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
