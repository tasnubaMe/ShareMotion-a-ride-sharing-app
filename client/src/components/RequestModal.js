import React, { useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function RequestModal({ rideId, onClose, onSuccess }) {
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const token = localStorage.getItem("token") || "";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Your backend expects { bidPrice } at POST /api/requests/:rideId
      const body = { bidPrice: Number(offer) || 0 };
      await axios.post(`${API}/api/requests/${rideId}`, body, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      onSuccess?.();   // let parent refresh "my requests"
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      alert(`Failed to send request: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{position:"fixed", inset:0, display:"grid", placeItems:"center", background:"rgba(0,0,0,.5)", zIndex:50}}>
      <form className="card pad" style={{width:"min(520px, 92vw)"}} onSubmit={submit}>
        <h3 style={{marginTop:0}}>Request to join</h3>
        <label className="label">Your offer (price)</label>
        <input className="input" type="number" min="0" value={offer} onChange={e=>setOffer(e.target.value)} />
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <button className="btn primary" type="submit" disabled={busy || !offer.trim()}>{busy ? "Sending..." : "Send request"}</button>
          <button className="btn ghost" type="button" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
