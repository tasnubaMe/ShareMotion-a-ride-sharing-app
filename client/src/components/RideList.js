import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import RideCard from './RideCard';
import RequestModal from './RequestModal';
import SOSButton from './SOSButton';
import { LoadingSpinner } from './Loading';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const token = () => localStorage.getItem('token') || '';

function valToAddress(v){
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.address || v.name || `${v.lat ?? ''} ${v.lng ?? ''}`.trim();
}

export default function RideList() {
  const [rides, setRides] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ to:'', date:'' });
  const [requestForRide, setRequestForRide] = useState(null);
  const [myRequests, setMyRequests] = useState({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [contracts, setContracts] = useState({});

  const fetchRides = async () => {
    try {
      const { data } = await axios.get(`${API}/api/rides`);
      setRides(Array.isArray(data) ? data : []);
    } catch {
      setError('Error fetching rides');
      setRides([]);
    }
  };

  const fetchContracts = async () => {
    try {
      const { data } = await axios.get(`${API}/api/contracts`, {
        headers: { Authorization: `Bearer ${token()}` },
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

  const fetchMyRequests = async () => {
    if (!token()) return setMyRequests({});
    try {
      const { data } = await axios.get(`${API}/api/requests/user`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const map = {};
      (data || []).forEach(r => {
        const rideId = r.ride?._id || r.ride;
        if (rideId) map[rideId] = { _id: r._id, status: r.status };
      });
      setMyRequests(map);
    } catch {
      setMyRequests({});
    }
  };

  const fetchRecommendations = async () => {
    if (!token()) return;
    try {
      const { data } = await axios.get(`${API}/api/rides/recommended`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setRecommendations(Array.isArray(data) ? data : []);
    } catch {
      setRecommendations([]);
    }
  };

  useEffect(() => { 
    fetchRides(); 
    fetchMyRequests(); 
    fetchRecommendations();
    if (token()) {
      fetchContracts();
    }
  }, []);

  const filtered = useMemo(() => {
    if (!rides) return [];
    const qTo = filters.to.toLowerCase();
    const qDate = filters.date;
    return rides.filter(r => {
      const toAddr = valToAddress(r.endLocation).toLowerCase();
      const matchesTo = !qTo || toAddr.includes(qTo);
      const matchesDate = !qDate || (r.dateTime && r.dateTime.slice(0,10) === qDate);
      return matchesTo && matchesDate;
    });
  }, [rides, filters]);

  const cancelRequest = async (requestId) => {
    if (!requestId) return;
    if (!window.confirm("Cancel this request?")) return;
    try {
      await axios.patch(`${API}/api/requests/${requestId}`, { status: 'Cancelled' }, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      await fetchMyRequests();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      alert(`Failed to cancel: ${msg}`);
    }
  };

  const prepareRideData = (ride) => {
    const req = myRequests[ride._id];
    return {
      from: valToAddress(ride.startLocation),
      to: valToAddress(ride.endLocation),
      date: ride.dateTime ? ride.dateTime.slice(0,10) : '',
      time: ride.dateTime ? ride.dateTime.slice(11,16) : '',
      price: ride.basePrice,
      seats: ride.seats ?? 1,
      status: ride.status ?? 'Open',
      postedBy: ride.postedBy?.name || 'User',
      requestStatus: req?.status,
      requestId: req?._id,
      isRecurring: ride.isRecurring || false,
      contractName: ride.contractId ? contracts[ride.contractId] : null,
      rideId: ride._id
    };
  };

  return (
    <div style={{marginTop:12}}>
      <div className="card pad" style={{marginBottom:16}}>
        <div className="row two">
          <div>
            <label className="label">Destination</label>
            <input className="input" placeholder="e.g., Banani"
              value={filters.to} onChange={e=>setFilters(f=>({...f,to:e.target.value}))}/>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date"
              value={filters.date} onChange={e=>setFilters(f=>({...f,date:e.target.value}))}/>
          </div>
        </div>
        {recommendations.length > 0 && (
          <div style={{marginTop: 16}}>
            <button 
              className="btn ghost" 
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              {showRecommendations ? 'Hide' : 'Show'} Recommendations ({recommendations.length})
            </button>
          </div>
        )}
      </div>

      {error && <div className="card pad" style={{borderColor:"rgba(239,68,68,.4)"}}>{error}</div>}
      
      {showRecommendations && recommendations.length > 0 && (
        <>
          <h3>Recommended for You</h3>
          <div className="list">
            {recommendations.map((ride) => (
              <RideCard
                key={`rec-${ride._id}`}
                ride={prepareRideData(ride)}
                onRequest={() => setRequestForRide(ride._id)}
                onCancelRequest={cancelRequest}
              />
            ))}
          </div>
        </>
      )}

      {!rides && (
        <div style={{display: 'flex', justifyContent: 'center', padding: '40px'}}>
          <LoadingSpinner size="large" />
        </div>
      )}
      {rides && filtered.length===0 && <div className="empty">No rides match your filters.</div>}

      <div className="list">
        {filtered.map((ride) => (
          <RideCard
            key={ride._id}
            ride={prepareRideData(ride)}
            onRequest={() => setRequestForRide(ride._id)}
            onCancelRequest={cancelRequest}
          />
        ))}
      </div>

      {requestForRide && (
        <RequestModal
          rideId={requestForRide}
          onClose={() => setRequestForRide(null)}
          onSuccess={async () => { await fetchMyRequests(); }}
        />
      )}
    </div>
  );
}
