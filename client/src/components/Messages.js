import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const { data } = await axios.get(`${API}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Conversations data:', data);
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Error fetching conversations');
      setConversations([]);
    }
  };

  useEffect(() => { fetchConversations(); }, []);

  return (
    <div style={{marginTop:12}}>
      <h2 style={{marginTop:0}}>Messages</h2>
      
      {error && <div className="card pad" style={{borderColor:"rgba(239,68,68,.4)"}}>{error}</div>}
      
      {conversations.length === 0 ? (
        <div className="empty">No conversations yet.</div>
      ) : (
        <div className="list">
          {conversations.map(conv => (
                         <div 
               key={conv._id._id || conv._id} 
               className="card pad" 
               style={{cursor: 'pointer', marginBottom: 8}}
               onClick={() => navigate(`/messages/${conv._id._id || conv._id}`)}
             >
               <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                 <div>
                   <h4 style={{margin:"0 0 4px"}}>
                     {conv._id?.name || conv._id?.email || 'Unknown User'}
                   </h4>
                   <div style={{fontSize:14,color:"var(--muted)"}}>
                     {conv.lastMessage?.content ? 
                       (conv.lastMessage.content.slice(0, 60) + (conv.lastMessage.content.length > 60 ? '...' : ''))
                       : 'No message content'
                     }
                   </div>
                 </div>
                 <div style={{fontSize:12,color:"var(--muted)"}}>
                   {conv.lastMessage?.sentAt ? 
                     new Date(conv.lastMessage.sentAt).toLocaleDateString() 
                     : 'No date'
                   }
                 </div>
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
