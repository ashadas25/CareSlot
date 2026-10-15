import { Activity, Menu, X, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function Navbar({ user, onSignIn, onBook, onSignOut }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (user?.role !== 'patient') { setUnreadCount(0); return undefined; }
    let active = true;
    const refresh = () => api.get('/appointments/notifications').then(({ data }) => { if (active) setUnreadCount(data.unreadCount || 0); }).catch(() => {});
    refresh();
    const timer = window.setInterval(() => { if (!document.hidden) refresh(); }, 20000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user]);
  return <header className="site-header"><div className="nav-shell">
    <a className="brand" href="/" aria-label="CareSlot home"><span className="brand-mark"><Activity size={21} strokeWidth={2.5} /></span><span>care<span>slot</span><small>CARE, MADE SIMPLER</small></span></a>
    <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
    <nav className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">
      <a href="/services" onClick={() => setOpen(false)}>Find care</a><a href="/doctors" onClick={() => setOpen(false)}>Our doctors</a><a href="/how-it-works" onClick={() => setOpen(false)}>How it works</a><a href="/help" onClick={() => setOpen(false)}>Help</a>
    </nav>
    <div className="nav-actions">
      {user ? <>
        {user.role === 'patient' && <a className="nav-user" href="/visits" aria-label={`My visits${unreadCount ? `, ${unreadCount} new updates` : ''}`}><UserRound size={16}/><span>My visits</span>{unreadCount > 0 && <span className="nav-unread-count">{unreadCount}</span>}</a>}
        {user.role === 'staff' && <a className="nav-user" href="/staff"><UserRound size={16}/><span>Staff portal</span></a>}
        {user.role === 'admin' && <><a className="nav-user" href="/admin"><UserRound size={16}/><span>Admin portal</span></a><a className="nav-user" href="/visits"><span>Patient portal</span></a></>}
        <button className="nav-signin" onClick={onSignOut}>Sign out</button>
      </> : <a className="nav-signin" href="/signin" onClick={() => setOpen(false)}>Sign in</a>}
      <button className="button button-small" onClick={onBook}>Book a visit <span>↗</span></button>
    </div>
  </div></header>;
}
