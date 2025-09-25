import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function Conversation() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId');



  const fetchConversation = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(data);
      
      if (data.length > 0) {
        const otherPerson = data[0].sender._id === currentUserId ? data[0].receiver : data[0].sender;
        setOtherUser(otherPerson);
      }
    } catch (err) {
      setError('Error fetching conversation');
    }
  }, [userId, currentUserId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token') || '';
      await axios.post(`${API}/api/messages`, {
        receiverId: userId,
        content: newMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewMessage('');
      await fetchConversation();
    } catch (err) {
      alert(`Error sending message: ${err.response?.data?.message || err.message}`);
    }
  };

  useEffect(() => { 
    fetchConversation(); 
  }, [userId]);

  // Poll for new messages every 3 seconds when on individual message page
  useEffect(() => {
    const interval = setInterval(fetchConversation, 3000);
    return () => clearInterval(interval);
  }, [fetchConversation]);



  return (
    <div style={{marginTop:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button className="btn ghost" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{margin:0}}>{otherUser ? `Chat with ${otherUser.email}` : 'Loading...'}</h2>
      </div>

      {error && <div className="card pad" style={{borderColor:"rgba(239,68,68,.4)"}}>{error}</div>}

      <div className="card pad" style={{height: '400px', overflow: 'auto', marginBottom: 16}}>
        {messages.length === 0 ? (
          <div className="empty">No messages yet. Start the conversation!</div>
        ) : (
          <div>
            {messages.map(message => (
              <div 
                key={message._id} 
                style={{
                  marginBottom: 12,
                  textAlign: message.sender._id === currentUserId ? 'right' : 'left'
                }}
              >
                <div 
                  className="card pad"
                  style={{
                    display: 'inline-block',
                    maxWidth: '70%',
                    backgroundColor: message.sender._id === currentUserId ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: message.sender._id === currentUserId ? 'white' : 'var(--text)'
                  }}
                >
                  <div>{message.content}</div>
                  <div style={{fontSize: 11, opacity: 0.7, marginTop: 4}}>
                    {new Date(message.sentAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="card pad">
        <div style={{display:"flex",gap:10}}>
          <input 
            className="input" 
            style={{flex: 1}}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button className="btn primary" type="submit" disabled={!newMessage.trim()}>Send</button>
        </div>
      </form>
    </div>
  );
}
