import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SOSButton from "./SOSButton";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const token = () => localStorage.getItem("token") || "";
const me = () => localStorage.getItem("userId") || "";

function addr(v){ if(!v) return ""; if(typeof v==="string") return v; return v.address || v.name || ""; }

// Try to read the owner id from any plausible field
function getOwnerId(ride){
  // direct id fields
  for (const k of ["host","postedBy","owner","user","createdBy"]) {
    const v = ride[k];
    if (!v) continue;
    if (typeof v === "string") return v;
    if (typeof v === "object") return v._id || v.id;
  }
  return undefined;
}

export default function MyRides(){
  const [allRides, setAllRides] = useState(null);
  const [myRideIds, setMyRideIds] = useState(null);
  const [error, setError] = useState("");
  const [openRideId, setOpenRideId] = useState(null);
  const [requests, setRequests] = useState({});
  const [contracts, setContracts] = useState({});

  // 1) Load all rides
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/rides`);
        setAllRides(Array.isArray(data) ? data : []);
      } catch {
        setError("Error fetching rides");
        setAllRides([]);
      }
    })();
  }, []);

  // Load contracts for recurring rides
  useEffect(() => {
    if (!token()) return;
    (async () => {
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
    })();
  }, []);

  // 2) Determine "my" rides by owner field; if none match, probe per-ride
  useEffect(() => {
    if (!allRides) return;
    const myId = me();
    if (!myId) { setMyRideIds(new Set()); return; }

    const directMatches = allRides.filter(r => String(getOwnerId(r) || "") === String(myId));
    if (directMatches.length > 0) {
      setMyRideIds(new Set(directMatches.map(r => r._id)));
      return;
    }

    // Fallback probe: call GET /api/requests/ride/:rideId (host-only). 200 => I'm host.
    (async () => {
      const headers = { Authorization: `Bearer ${token()}` };
      const owned = new Set();
      // Light concurrency
      await Promise.all(
        allRides.map(async (r) => {
          try {
            await axios.get(`${API}/api/requests/ride/${r._id}`, { headers });
            owned.add(r._id); // success -> host
          } catch (e) {
            // 403/404 -> not host, ignore
          }
        })
      );
      setMyRideIds(owned);
    })();
  }, [allRides]);

  const myRides = useMemo(() => {
    if (!allRides || !myRideIds) return [];
    return allRides.filter(r => myRideIds.has(r._id));
  }, [allRides, myRideIds]);

  const loadRequests = async (rideId) => {
    try {
      const { data } = await axios.get(`${API}/api/requests/ride/${rideId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setRequests(prev => ({ ...prev, [rideId]: data || [] }));
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load requests";
      alert(msg);
    }
  };

  const togglePanel = async (rideId) => {
    if (openRideId === rideId) { setOpenRideId(null); return; }
    setOpenRideId(rideId);
    if (!requests[rideId]) await loadRequests(rideId);
  };

  const setStatus = async (requestId, status, rideId) => {
    try {
      await axios.patch(`${API}/api/requests/${requestId}`, { status }, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      await loadRequests(rideId);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      alert(`Failed to update: ${msg}`);
    }
  };

  return (
    <div className="container" style={{marginTop:12}}>
      <h2 style={{margin:"12px 0"}}>My Rides</h2>

      {error && <div className="card pad" style={{borderColor:"rgba(239,68,68,.4)"}}>{error}</div>}
      {!allRides && <div className="skeleton" />}

      {allRides && myRides.length === 0 && (
        <div className="empty">You haven't posted any rides yet.</div>
      )}

      <div className="list">
        {myRides.map(ride => {
          const isOpen = (ride.status || "Open").toLowerCase() === "open";
          const rideReqs = requests[ride._id] || [];
          return (
            <div key={ride._id} className="card pad">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <h3 style={{margin:"0 0 6px"}}>{addr(ride.startLocation)} ➜ {addr(ride.endLocation)}</h3>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <span className={`badge ${isOpen ? "open":"closed"}`}>{ride.status || "Open"}</span>
                    <span className="badge">📅 {ride.dateTime?.slice(0,10)} · {ride.dateTime?.slice(11,16)}</span>
                    <span className="badge">💸 {ride.basePrice ?? "—"}</span>
                    {ride.isRecurring && <span className="badge" style={{backgroundColor: 'var(--accent)'}}>🔄 Recurring</span>}
                    {ride.contractId && contracts[ride.contractId] && (
                      <span className="badge" style={{backgroundColor: 'var(--accent)'}}>📋 {contracts[ride.contractId]}</span>
                    )}
                  </div>
                  {ride.isRecurring && ride.contractId && contracts[ride.contractId] && (
                    <div style={{marginTop: 4, fontSize: 14, color: 'var(--muted)'}}>
                      Part of {contracts[ride.contractId]} contract
                    </div>
                  )}
                </div>
                <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                  {/* SOS Button for active rides */}
                  {isOpen && (
                    <SOSButton rideId={ride._id} />
                  )}
                  <button className="btn" onClick={()=>togglePanel(ride._id)}>
                    {openRideId === ride._id ? "Hide requests" : `View requests (${rideReqs.length || ""})`}
                  </button>
                </div>
              </div>

              {openRideId === ride._id && (
                <div style={{marginTop:14}}>
                  {rideReqs.length === 0 ? (
                    <div className="empty">No requests yet.</div>
                  ) : (
                    <div className="list">
                      {rideReqs.map(req => (
                        <div key={req._id} className="card pad" style={{background:"rgba(255,255,255,.02)"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontWeight:600}}>{req.requester?.name || "Request"}</div>
                              <div style={{display:"flex",gap:10,marginTop:6}}>
                                <span className="badge">💸 {req.bidPrice ?? "—"}</span>
                                <span className={`badge ${req.status==="Confirmed"?"open": req.status==="Cancelled"?"closed":""}`}>
                                  {req.status}
                                </span>
                              </div>
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              {req.status === "Pending" ? (
                                <>
                                  <button className="btn primary" onClick={()=>setStatus(req._id,"Confirmed", ride._id)}>Confirm</button>
                                  <button className="btn ghost" onClick={()=>setStatus(req._id,"Cancelled", ride._id)}>Cancel</button>
                                </>
                              ) : (
                                <span style={{opacity:.8}}>No actions</span>
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
        })}
      </div>
    </div>
  );
}
