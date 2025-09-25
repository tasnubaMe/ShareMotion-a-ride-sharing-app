import { useState } from 'react';
import axios from 'axios';

const RequestForm = ({ rideId }) => {
  const [bidPrice, setBidPrice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `http://localhost:5000/api/requests/${rideId}`,
        { bidPrice },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Ride request sent!');
    } catch (err) {
      alert('Error sending request');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Bid Price:</label>
      <input
        type="number"
        value={bidPrice}
        onChange={(e) => setBidPrice(e.target.value)}
        required
      />
      <button type="submit" disabled={!bidPrice}>Send Request</button>
    </form>
  );
};

export default RequestForm;

