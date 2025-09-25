import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { usePolling } from "../contexts/PollingContext";

export default function Layout(){
  const navigate = useNavigate();
  const isAuthed = !!localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";
  const userIsAdmin = localStorage.getItem("userIsAdmin") === "true";
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { pollingData } = usePolling();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <>
      <nav className="nav">
        <div className="navwrap container">
          <div style={{display:"flex",alignItems:"center",gap:10,fontWeight:700}}>
            <NavLink to="/" style={{textDecoration: 'none', color: 'inherit'}}>
              🚗 ShareMotion
            </NavLink>
          </div>
          <div style={{display:"flex",gap:16,alignItems:"center"}}>
            <NavLink to="/rides" className={({isActive})=> isActive?"active":""}>Rides</NavLink>
            <NavLink to="/post-ride" className={({isActive})=> isActive?"active":""}>Post Ride</NavLink>
            {isAuthed && (
              <>
                <NavLink to="/my-rides" className={({isActive})=> isActive?"active":""}>My Rides</NavLink>
                <NavLink to="/ride-history" className={({isActive})=> isActive?"active":""}>History</NavLink>
                <div style={{position: 'relative'}}>
                  <NavLink to="/messages" className={({isActive})=> isActive?"active":""}>
                    Messages
                    {pollingData.unreadMessages > 0 && (
                      <span className="notification-badge">{pollingData.unreadMessages}</span>
                    )}
                  </NavLink>
                </div>
                <NavLink to="/contracts" className={({isActive})=> isActive?"active":""}>Contracts</NavLink>
                <NavLink to="/emergency-contacts" className={({isActive})=> isActive?"active":""}>Emergency</NavLink>
                {userIsAdmin && (
                  <NavLink to="/admin" className={({isActive})=> isActive?"active":""}>Admin</NavLink>
                )}
              </>
            )}
            {!isAuthed ? (
              <>
                <NavLink to="/login" className={({isActive})=> isActive?"active":""}>Login</NavLink>
                <NavLink to="/register" className={({isActive})=> isActive?"active":""}>Register</NavLink>
              </>
            ) : (
              <div className="user-dropdown">
                <button 
                  className="btn ghost" 
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  style={{display: 'flex', alignItems: 'center', gap: 8}}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', 
                    background: 'var(--primary)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: 14
                  }}>
                    {userName.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {userName}
                </button>
                {showUserDropdown && (
                  <div className="user-dropdown-content">
                    <div className="user-dropdown-item" style={{borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: 8, paddingBottom: 12}}>
                      <div style={{fontWeight: 'bold'}}>{userName}</div>
                      <div style={{fontSize: 12, color: 'var(--muted)'}}>{userEmail}</div>
                    </div>
                    <button className="user-dropdown-item" onClick={() => {navigate('/ride-history'); setShowUserDropdown(false);}}>
                      📊 Ride History
                    </button>
                    <button className="user-dropdown-item" onClick={() => {navigate('/messages'); setShowUserDropdown(false);}}>
                      💬 Messages
                      {pollingData.unreadMessages > 0 && (
                        <span style={{marginLeft: 8, background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: 10}}>
                          {pollingData.unreadMessages}
                        </span>
                      )}
                    </button>
                    <button className="user-dropdown-item" onClick={() => {navigate('/contracts'); setShowUserDropdown(false);}}>
                      📋 Contracts
                    </button>
                    <button className="user-dropdown-item" onClick={() => {navigate('/emergency-contacts'); setShowUserDropdown(false);}}>
                      🚨 Emergency Contacts
                    </button>
                    {userIsAdmin && (
                      <button className="user-dropdown-item" onClick={() => {navigate('/admin'); setShowUserDropdown(false);}}>
                        🛡️ Admin Dashboard
                      </button>
                    )}
                    <button className="user-dropdown-item" onClick={logout} style={{color: 'var(--accent)', borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 8, paddingTop: 12}}>
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="container" style={{paddingTop:20}}><Outlet/></main>
    </>
  );
}
