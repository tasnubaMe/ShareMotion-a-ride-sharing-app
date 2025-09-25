import { useState } from 'react';
import axios from 'axios';
import LocationSelector from './LocationSelector';
import { LoadingButton } from './Loading';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function RideForm(){
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [seats, setSeats] = useState(1);
  const [status, setStatus] = useState('Open');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startLoc = typeof startLocation === 'string' ? { address: startLocation } : startLocation;
      const endLoc = typeof endLocation === 'string' ? { address: endLocation } : endLocation;

      const newRide = {
        startLocation: startLoc,
        endLocation: endLoc,
        dateTime: new Date(dateTime).toISOString(),
        basePrice: Number(basePrice),
        seats: Number(seats) || 1,
        status
      };

      const token = localStorage.getItem('token') || '';
      const { data } = await axios.post(`${API}/api/rides`, newRide, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      alert('Ride posted successfully!');
      setStartLocation('');
      setEndLocation('');
      setDateTime('');
      setBasePrice('');
      setSeats(1);
      setStatus('Open');
      console.log('Created ride:', data);
    } catch (err) {
      const statusCode = err?.response?.status;
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message;
      console.error('POST /api/rides failed:', err?.response || err);
      alert(`Error posting ride${statusCode ? ` (${statusCode})` : ''}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card pad" style={{maxWidth:840, margin:"24px auto"}} onSubmit={handleSubmit}>
      <h2 style={{marginTop:0}}>Post a ride</h2>
      <div style={{marginBottom: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 14}}>
        💡 <strong>Location Selection:</strong> Click the "🗺️ Select on Map" button for each location to open the map and select your pickup and destination points.
      </div>
      <div className="row two">
        <LocationSelector
          label="Start Location *"
          value={startLocation}
          onChange={setStartLocation}
          placeholder="Click the map button to select pickup location"
          required
        />
        <LocationSelector
          label="End Location *"
          value={endLocation}
          onChange={setEndLocation}
          placeholder="Click the map button to select destination"
          required
        />
        <div>
          <label className="label">Date & Time</label>
          <input className="input" type="datetime-local" value={dateTime}
                 onChange={(e)=>setDateTime(e.target.value)} required/>
        </div>
        <div>
          <label className="label">Base / Tentative Price</label>
          <input className="input" type="number" min="0" step="1" value={basePrice}
                 onChange={(e)=>setBasePrice(e.target.value)} />
        </div>
        <div>
          <label className="label">Seats</label>
          <input className="input" type="number" min="1" value={seats}
                 onChange={(e)=>setSeats(Number(e.target.value)||1)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
            <option>Open</option><option>Closed</option>
          </select>
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <LoadingButton 
          className="btn primary" 
          type="submit" 
          loading={loading}
          disabled={!startLocation || !endLocation || !dateTime}
        >
          Post Ride
        </LoadingButton>
        <button className="btn ghost" type="button" onClick={()=>window.history.back()}>Cancel</button>
      </div>
    </form>
  );
}
