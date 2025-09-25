import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const PollingContext = createContext();

export const usePolling = () => {
  const context = useContext(PollingContext);
  if (!context) {
    throw new Error('usePolling must be used within a PollingProvider');
  }
  return context;
};

export const PollingProvider = ({ children }) => {
  const [pollingData, setPollingData] = useState({
    unreadMessages: 0,
    recommendedRides: [],
    newRequests: 0,
    timestamp: null
  });
  const [isPolling, setIsPolling] = useState(false);

  const fetchPollingData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { data } = await axios.get(`${API}/api/polling/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPollingData(data);
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    fetchPollingData();

    const interval = setInterval(fetchPollingData, 5000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, []);

  const value = {
    pollingData,
    isPolling,
    refetch: fetchPollingData
  };

  return (
    <PollingContext.Provider value={value}>
      {children}
    </PollingContext.Provider>
  );
};
