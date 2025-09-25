import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function ContractDetails() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId');

  const fetchContract = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/contracts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContract(data);
    } catch (err) {
      setError('Error fetching contract details');
    }
  }, [id]);

  const toggleAutoPost = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      await axios.patch(`${API}/api/contracts/${id}`, {
        autoPostExtraSeats: !contract.autoPostExtraSeats
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchContract();
    } catch (err) {
      alert(`Error updating contract: ${err.response?.data?.message || err.message}`);
    }
  };

  const updateStatus = async (status) => {
    try {
      const token = localStorage.getItem('token') || '';
      await axios.patch(`${API}/api/contracts/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchContract();
    } catch (err) {
      alert(`Error updating status: ${err.response?.data?.message || err.message}`);
    }
  };

  useEffect(() => { 
    fetchContract(); 
  }, [fetchContract]);

  if (error) return <div className="card pad" style={{borderColor:"rgba(239,68,68,.4)"}}>{error}</div>;
  if (!contract) return <div className="skeleton" />;

  const isCreator = contract.creator._id === currentUserId;
  const extraSeats = contract.totalSeats - contract.members.length;

  return (
    <div style={{marginTop:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button className="btn ghost" onClick={() => navigate('/contracts')}>← Back</button>
        <h2 style={{margin:0}}>{contract.name}</h2>
      </div>

      <div className="card pad" style={{marginBottom: 16}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
          <span className={`badge ${contract.status === 'Active' ? 'open' : 'closed'}`}>
            {contract.status}
          </span>
          <span className="badge">👥 {contract.members.length}/{contract.totalSeats}</span>
          <span className="badge">
            📅 {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
          </span>
          {contract.autoPostExtraSeats && <span className="badge">🔄 Auto-post</span>}
          {extraSeats > 0 && <span className="badge">🪑 {extraSeats} extra seats</span>}
        </div>

        <div style={{marginBottom:16}}>
          <h4>Route</h4>
          <p>{contract.route.startLocation.address} ➜ {contract.route.endLocation.address}</p>
        </div>

        <div style={{marginBottom:16}}>
          <h4>Weekly Schedule</h4>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {contract.weeklySchedule.map(schedule => (
              <span key={schedule.day} className="badge">
                {schedule.day} {schedule.time}
              </span>
            ))}
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <h4>Members</h4>
          <div className="list">
            {contract.members.map(member => (
              <div key={member._id} className="card pad" style={{marginBottom: 8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <strong>{member.name}</strong>
                    {member._id === contract.creator._id && <span className="badge" style={{marginLeft: 8}}>Creator</span>}
                  </div>
                  <button 
                    className="btn ghost" 
                    onClick={() => navigate(`/messages/${member._id}`)}
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isCreator && (
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button 
              className="btn primary" 
              onClick={toggleAutoPost}
            >
              {contract.autoPostExtraSeats ? 'Disable' : 'Enable'} Auto-post
            </button>
            
            {contract.status === 'Active' && (
              <button 
                className="btn ghost" 
                onClick={() => updateStatus('Completed')}
              >
                Mark Complete
              </button>
            )}
            
            {contract.status === 'Active' && (
              <button 
                className="btn ghost" 
                onClick={() => updateStatus('Cancelled')}
              >
                Cancel Contract
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
