import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContracts(data);
    } catch (err) {
      setError('Error fetching contracts');
      setContracts([]);
    }
  };

  useEffect(() => { fetchContracts(); }, []);

  return (
    <div style={{marginTop:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0}}>Ride Contracts</h2>
        <button className="btn primary" onClick={() => navigate('/contracts/new')}>
          Create Contract
        </button>
      </div>
      
      {error && <div className="card pad" style={{borderColor:"rgba(239,68,68,.4)"}}>{error}</div>}
      
      {contracts.length === 0 ? (
        <div className="empty">No contracts yet. Create your first weekly ride contract!</div>
      ) : (
        <div className="list">
          {contracts.map(contract => (
            <div 
              key={contract._id} 
              className="card pad" 
              style={{marginBottom: 12, cursor: 'pointer'}}
              onClick={() => navigate(`/contracts/${contract._id}`)}
            >
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <h4 style={{margin:"0 0 6px"}}>{contract.name}</h4>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <span className={`badge ${contract.status === 'Active' ? 'open' : 'closed'}`}>
                      {contract.status}
                    </span>
                    <span className="badge">👥 {contract.members.length}/{contract.totalSeats}</span>
                    <span className="badge">
                      📅 {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                    </span>
                    {contract.autoPostExtraSeats && <span className="badge">🔄 Auto-post</span>}
                  </div>
                  <div style={{fontSize:14,color:"var(--muted)",marginTop:4}}>
                    {contract.route.startLocation.address} ➜ {contract.route.endLocation.address}
                  </div>
                </div>
                <button className="btn ghost" onClick={(e) => {e.stopPropagation(); navigate(`/contracts/${contract._id}`)}}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
