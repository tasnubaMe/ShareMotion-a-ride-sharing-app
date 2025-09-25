// client/src/components/RideCard.js
import React from "react";
import SOSButton from "./SOSButton";

export default function RideCard({ ride, onRequest, onCancelRequest }) {
  const {
    from, to, date, time, price, seats = 1,
    status = "Open", postedBy = "Someone",
    requestStatus, requestId, isRecurring, contractName, rideId
  } = ride;

  const isOpen = String(status).toLowerCase() === "open";
  const hasReq = !!requestStatus;

  const renderCTA = () => {
    if (hasReq) {
      const st = requestStatus.toLowerCase();
      if (st === "pending") {
        return (
          <div style={{display:"flex",gap:8}}>
            <span className="badge">⏳ Pending</span>
            <button className="btn ghost" onClick={()=>onCancelRequest?.(requestId)}>Cancel</button>
          </div>
        );
      }
      if (st === "confirmed") return <span className="badge open">✔ Confirmed</span>;
      if (st === "cancelled") return <span className="badge closed">✖ Cancelled</span>;
      return <span className="badge">{requestStatus}</span>;
    }
    return (
      <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
        <button className={`btn ${isOpen ? "primary":"ghost"}`}
          disabled={!isOpen} onClick={onRequest}>
          {isOpen ? "Request to join" : "Closed"}
        </button>
        {/* SOS Button for active rides */}
        {isOpen && rideId && (
          <SOSButton rideId={rideId} />
        )}
      </div>
    );
  };

  return (
    <div className="card pad">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
        <div>
          <h3 style={{margin:"0 0 6px"}}>{from} ➜ {to}</h3>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <span className={`badge ${isOpen ? "open":"closed"}`}>{status}</span>
            <span className="badge">🪑 {seats} seat{seats>1?"s":""}</span>
            <span className="badge">📅 {date} · {time}</span>
            <span className="badge">💸 {price ? `~ ${price}` : "Bid price"}</span>
            {isRecurring && <span className="badge" style={{backgroundColor: 'var(--accent)'}}>🔄 Recurring</span>}
            {contractName && <span className="badge" style={{backgroundColor: 'var(--accent)'}}>📋 {contractName}</span>}
          </div>
        </div>
        {renderCTA()}
      </div>
      <div style={{marginTop:10,color:"var(--muted)",fontSize:13}}>
        Posted by {postedBy}
        {isRecurring && contractName && (
          <span style={{marginLeft: 8}}>• Part of {contractName} contract</span>
        )}
      </div>
    </div>
  );
}
