import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoadingPage } from './Loading';
import SOSButton from './SOSButton';
import Feedback from './Feedback';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function valToAddress(v){
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.address || v.name || `${v.lat ?? ''} ${v.lng ?? ''}`.trim();
}

export default function RideDetails() {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const navigate = useNavigate();

  const fetchRide = async () => {
    try {
      const { data } = await axios.get(`${API}/api/rides/${id}`);
      console.log('Raw ride data received:', data);
      
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      
      console.log('Debug user:', { userId, userEmail, ridePostedBy: data.postedBy?._id });
      
      setIsOwner(data.postedBy?._id === userId || data.host === userId);
      
      // Check if user is a participant (confirmed request)
      if (data.requests) {
        const confirmedRequest = data.requests.find(req => 
          req.requester === userId && req.status === 'Confirmed'
        );
        setIsParticipant(!!confirmedRequest);
        console.log('Debug participant check:', { confirmedRequest, isParticipant: !!confirmedRequest });
      }
      
      // If we're the owner, also fetch the requests to populate the feedback section
      if (data.postedBy?._id === userId || data.host === userId) {
        try {
          const token = localStorage.getItem('token') || '';
          const requestsResponse = await axios.get(`${API}/api/requests/ride/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Requests fetched for feedback:', requestsResponse.data);
          // Merge the requests into the ride data
          data.requests = requestsResponse.data;
        } catch (err) {
          console.error('Error fetching requests for feedback:', err);
        }
      }
      
      setRide(data);
    } catch (err) {
      setError('Error fetching ride details');
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token') || '';
      await axios.patch(`${API}/api/requests/${requestId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh the entire ride data to update the feedback section
      await fetchRide();
    } catch (err) {
      alert(`Error updating request: ${err.response?.data?.message || err.message}`);
    }
  };

  const completeRide = async () => {
    if (!window.confirm('Are you sure you want to mark this ride as completed?')) return;
    
    try {
      const token = localStorage.getItem('token') || '';
      await axios.patch(`${API}/api/rides/${id}`, { status: 'Completed' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Ride marked as completed! Users can now provide feedback.');
      await fetchRide();
    } catch (err) {
      alert(`Error completing ride: ${err.response?.data?.message || err.message}`);
    }
  };

  const sendMessage = (userId) => {
    navigate(`/messages/${userId}`);
  };

  useEffect(() => { fetchRide(); }, [id]);
  // Remove the separate fetchRequests useEffect since we're now fetching requests in fetchRide

  if (error) return <div className="card pad" style={{borderColor:"rgba(239,68,68,.4)"}}>{error}</div>;
  if (!ride) return <LoadingPage message="Loading ride details..." />;

  const canShowFeedback = ride.status === 'Completed' && (isOwner || isParticipant);
  const canCompleteRide = isOwner && ride.status === 'Open';

  console.log('Debug feedback:', {
    rideStatus: ride.status,
    isOwner,
    isParticipant,
    canShowFeedback,
    rideRequests: ride.requests
  });

  return (
    <div style={{marginTop:12}}>
      <div className="card pad" style={{marginBottom: 16}}>
        <h2 style={{marginTop:0}}>{valToAddress(ride.startLocation)} ➜ {valToAddress(ride.endLocation)}</h2>
        
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
          <span className={`badge ${ride.status === 'Open' ? 'open' : ride.status === 'Completed' ? 'completed' : 'closed'}`}>
            {ride.status}
          </span>
          <span className="badge">🪑 {ride.seats} seat{ride.seats > 1 ? "s" : ""}</span>
          <span className="badge">📅 {ride.dateTime ? new Date(ride.dateTime).toLocaleDateString() : ''}</span>
          <span className="badge">⏰ {ride.dateTime ? new Date(ride.dateTime).toLocaleTimeString() : ''}</span>
          <span className="badge">💸 {ride.basePrice ? `${ride.basePrice}` : "Free"}</span>
          {ride.isRecurring && <span className="badge">🔄 Recurring</span>}
        </div>

        <div style={{marginBottom:16}}>
          <strong>Posted by:</strong> {ride.postedBy?.name || 'Unknown'}
          {!isOwner && (
            <button 
              className="btn ghost" 
              style={{marginLeft: 10}}
              onClick={() => sendMessage(ride.postedBy?._id)}
            >
              Message
            </button>
          )}
        </div>

        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button className="btn ghost" onClick={() => navigate(-1)}>
            Back
          </button>
          
          {/* SOS Button - Show for ride participants and during active rides */}
          {(isOwner || isParticipant) && ride.status === 'Open' && (
            <SOSButton rideId={id} />
          )}
          
          {/* Complete Ride Button - Show for ride owner when ride is open */}
          {canCompleteRide && (
            <button 
              className="btn primary" 
              onClick={completeRide}
            >
              ✅ Complete Ride
            </button>
          )}
        </div>
      </div>

      {/* Feedback Section - Show after ride completion */}
      {canShowFeedback && (
        <div className="card pad" style={{marginBottom: 16}}>
          <h3 style={{marginTop:0}}>Ride Feedback</h3>
          <p style={{color: 'var(--muted)', marginBottom: 16}}>
            The ride has been completed. You can now provide feedback to other participants.
          </p>
          
          {console.log('Debug feedback section:', {
            canShowFeedback,
            isOwner,
            isParticipant,
            rideRequests: ride.requests,
            confirmedRequests: ride.requests?.filter(req => req.status === 'Confirmed')
          })}
          
          {isOwner && ride.requests && (
            <div style={{marginBottom: 16}}>
              <h4>Give Feedback to Passengers:</h4>
              {(() => {
                const confirmedRequests = ride.requests.filter(req => req.status === 'Confirmed');
                console.log('Confirmed requests for feedback:', confirmedRequests);
                
                if (confirmedRequests.length === 0) {
                  return <p style={{color: 'var(--muted)'}}>No confirmed passengers to give feedback to.</p>;
                }
                
                return confirmedRequests.map(request => {
                  console.log('Rendering feedback for request:', request);
                  return (
                    <div key={request._id} style={{marginBottom: 12, border: '1px solid var(--border)', padding: 16, borderRadius: 8}}>
                      <div style={{marginBottom: 12}}>
                        <strong>Passenger:</strong> {request.requester?.name || 'Unknown User'}
                      </div>
                      <Feedback 
                        rideId={id} 
                        toUserId={request.requester?._id}
                        onFeedbackSubmitted={() => {
                          console.log('Feedback submitted for:', request.requester?.name);
                        }}
                      />
                    </div>
                  );
                });
              })()}
            </div>
          )}
          
          {isParticipant && (
            <div>
              <h4>Give Feedback to Driver:</h4>
              <div style={{border: '1px solid var(--border)', padding: 16, borderRadius: 8}}>
                <div style={{marginBottom: 12}}>
                  <strong>Driver:</strong> {ride.postedBy?.name || 'Unknown User'}
                </div>
                <Feedback 
                  rideId={id} 
                  toUserId={ride.postedBy?._id}
                  onFeedbackSubmitted={() => {
                    console.log('Feedback submitted for driver:', ride.postedBy?.name);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {isOwner && (
        <div className="card pad">
          <h3 style={{marginTop:0}}>Ride Requests ({ride.requests?.length || 0})</h3>
          
          {!ride.requests || ride.requests.length === 0 ? (
            <div className="empty">No requests yet.</div>
          ) : (
            <div className="list">
              {ride.requests.map(request => (
                <div key={request._id} className="card pad" style={{marginBottom: 8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <strong>{request.requester?.name}</strong>
                      <div style={{fontSize:14,color:"var(--muted)"}}>
                        Bid: ${request.bidPrice} • Status: {request.status}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button 
                        className="btn ghost" 
                        onClick={() => sendMessage(request.requester?._id)}
                      >
                        Message
                      </button>
                      {request.status === 'Pending' && (
                        <>
                          <button 
                            className="btn primary" 
                            onClick={() => updateRequestStatus(request._id, 'Confirmed')}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn ghost" 
                            onClick={() => updateRequestStatus(request._id, 'Cancelled')}
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
