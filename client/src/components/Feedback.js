import { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function Feedback({ rideId, toUserId, onFeedbackSubmitted }) {
  console.log('Feedback component rendered with props:', { rideId, toUserId, onFeedbackSubmitted });
  
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    category: 'Overall'
  });

  const [existingFeedback, setExistingFeedback] = useState(null);
  const [userFeedback, setUserFeedback] = useState(null);
  const [currentUserFeedback, setCurrentUserFeedback] = useState(null);

  useEffect(() => {
    console.log('Feedback useEffect triggered, toUserId:', toUserId);
    if (toUserId) {
      fetchUserFeedback();
      fetchCurrentUserFeedback();
    }
  }, [toUserId]);

  const fetchUserFeedback = async () => {
    console.log('fetchUserFeedback called for toUserId:', toUserId);
    try {
      const token = localStorage.getItem('token') || '';
      console.log('Token found:', !!token, 'Token length:', token.length);
      
      const { data } = await axios.get(`${API}/api/feedback/user/${toUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('User feedback data received:', data);
      setUserFeedback(data);
    } catch (err) {
      console.error('Error fetching user feedback:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const fetchCurrentUserFeedback = async () => {
    console.log('fetchCurrentUserFeedback called for rideId:', rideId, 'toUserId:', toUserId);
    try {
      const token = localStorage.getItem('token') || '';
      const currentUserId = localStorage.getItem('userId');
      
      if (!currentUserId || !toUserId || !rideId) return;
      
      const { data } = await axios.get(`${API}/api/feedback/check/${currentUserId}/${toUserId}/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Current user feedback check:', data);
      setCurrentUserFeedback(data.feedback || null);
      setExistingFeedback(data.feedback || null);
    } catch (err) {
      console.error('Error checking current user feedback:', err);
      // If the endpoint doesn't exist, we'll handle it gracefully
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    
    if (!toUserId) {
      alert('Recipient user is required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const feedbackData = {
        toUserId,
        rideId: rideId || undefined,
        rating: parseInt(formData.rating),
        comment: formData.comment.trim() || undefined,
        category: formData.category
      };

      if (existingFeedback) {
        await axios.patch(`${API}/api/feedback/${existingFeedback._id}`, feedbackData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/api/feedback`, feedbackData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      alert('Feedback submitted successfully!');
      setShowForm(false);
      setFormData({ rating: 5, comment: '', category: 'Overall' });
      setExistingFeedback(null);
      if (onFeedbackSubmitted) onFeedbackSubmitted();
      if (toUserId) {
        fetchUserFeedback();
        fetchCurrentUserFeedback();
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already exists')) {
        alert('You have already given feedback for this user and ride. You can edit your existing feedback.');
        setExistingFeedback(err.response.data.existingFeedback);
      } else {
        alert(`Error submitting feedback: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async () => {
    if (!existingFeedback || !window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const token = localStorage.getItem('token') || '';
      await axios.delete(`${API}/api/feedback/${existingFeedback._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Feedback deleted successfully');
      setExistingFeedback(null);
      setFormData({ rating: 5, comment: '', category: 'Overall' });
      if (toUserId) fetchUserFeedback();
    } catch (err) {
      alert(`Error deleting feedback: ${err.response?.data?.message || err.message}`);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const renderUserFeedback = () => {
    if (!userFeedback || userFeedback.feedback.length === 0) {
      return <div className="empty">No feedback yet</div>;
    }

    return (
      <div className="list">
        {userFeedback.feedback.map(item => (
          <div key={item._id} className="card pad">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <div style={{display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8}}>
                  <span style={{fontWeight: 'bold'}}>{item.fromUser?.name}</span>
                  <span style={{color: 'var(--muted)'}}>→</span>
                  <span style={{fontWeight: 'bold'}}>{item.toUser?.name}</span>
                </div>
                <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8}}>
                  <span className="badge">{renderStars(item.rating)}</span>
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
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
        <h3 style={{margin: 0}}>Feedback & Ratings</h3>
        {!currentUserFeedback && (
          <button 
            className="btn primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Give Feedback'}
          </button>
        )}
        {currentUserFeedback && (
          <div style={{color: 'var(--success)', fontSize: 14}}>
            ✅ Feedback submitted
          </div>
        )}
      </div>

      {userFeedback && (
        <div style={{marginBottom: 16}}>
          <div style={{display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12}}>
            <div>
              <strong>Average Rating:</strong> {renderStars(Math.round(userFeedback.averageRating))} 
              <span style={{marginLeft: 8, color: 'var(--muted)'}}>
                ({userFeedback.averageRating}/5)
              </span>
            </div>
            <div>
              <strong>Total Reviews:</strong> {userFeedback.totalFeedback}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form className="card pad" onSubmit={submitFeedback} style={{marginBottom: 16}}>
          <h4 style={{marginTop: 0}}>
            {existingFeedback ? 'Edit Feedback' : 'Give Feedback'}
          </h4>
          
          <div style={{marginBottom: 16}}>
            <label className="label">Rating *</label>
            <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({...formData, rating: star})}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: star <= formData.rating ? '#fbbf24' : '#6b7280'
                  }}
                >
                  {star <= formData.rating ? '⭐' : '☆'}
                </button>
              ))}
              <span style={{marginLeft: 8, color: 'var(--muted)'}}>
                {formData.rating}/5
              </span>
            </div>
          </div>

          <div style={{marginBottom: 16}}>
            <label className="label">Category</label>
            <select 
              className="select"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="Overall">Overall Experience</option>
              <option value="Punctuality">Punctuality</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Communication">Communication</option>
              <option value="Safety">Safety</option>
            </select>
          </div>

          <div style={{marginBottom: 16}}>
            <label className="label">Comment (Optional)</label>
            <textarea 
              className="input"
              rows="3"
              placeholder="Share your experience..."
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
            />
          </div>

          <div style={{display: 'flex', gap: 10}}>
            <button 
              className="btn primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : (existingFeedback ? 'Update Feedback' : 'Submit Feedback')}
            </button>
            
            {existingFeedback && (
              <button 
                className="btn ghost" 
                type="button" 
                onClick={deleteFeedback}
                style={{color: '#ef4444'}}
              >
                Delete
              </button>
            )}
            
            <button 
              className="btn ghost" 
              type="button" 
              onClick={() => {
                setShowForm(false);
                setFormData({ rating: 5, comment: '', category: 'Overall' });
                setExistingFeedback(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {userFeedback && (
        <>
          <h4>All Reviews</h4>
          {renderUserFeedback()}
        </>
      )}
    </div>
  );
}
