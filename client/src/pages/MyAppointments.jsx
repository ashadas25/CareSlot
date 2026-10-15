import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, Bell, CalendarDays, Clock3, MapPin, RefreshCw, Stethoscope } from 'lucide-react';
import { api, getErrorMessage } from '../services/api.js';
import AppointmentConversation from '../components/AppointmentConversation.jsx';
import './patient.css';

const formatDate = (value) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) + ' IST';

export default function MyAppointments({ user, onBook, onSignIn, onSignOut }) {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState('');
  const loadAppointments = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/appointments/mine'); setAppointments(data.appointments); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (user) loadAppointments(); }, [user, loadAppointments]);
  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setInterval(() => { if (!document.hidden) loadAppointments(); }, 20000);
    return () => window.clearInterval(timer);
  }, [user, loadAppointments]);
  const unreadTotal = useMemo(() => appointments.reduce((sum, item) => sum + (item.unreadCount || 0), 0), [appointments]);
  const openHistory = async (appointment) => {
    if (expandedId === appointment._id) { setExpandedId(''); return; }
    setExpandedId(appointment._id);
    if (appointment.unreadCount) {
      try { await api.post(`/appointments/${appointment._id}/read`); await loadAppointments(); }
      catch (requestError) { setError(getErrorMessage(requestError)); }
    }
  };
  if (!user) return <main className="staff-gate"><div className="staff-gate-card"><span className="brand-mark"><Activity size={23}/></span><div className="eyebrow eyebrow-dark">YOUR CARE JOURNEY</div><h1>Sign in to see your visits<span>.</span></h1><p>Your appointment requests, hospital updates and messages will appear here.</p><button className="button button-primary" onClick={onSignIn}>Sign in to continue</button><a href="/" className="staff-back-link"><ArrowLeft size={14}/> Back to CareSlot</a></div></main>;
  return <main className="staff-dashboard"><header className="staff-topbar"><a className="brand" href="/"><span className="brand-mark"><Activity size={21}/></span><span>care<span>slot</span><small>YOUR CARE JOURNEY</small></span></a><div className="staff-top-right"><span className="staff-hospital-label">Hello, {user.name.split(' ')[0]}</span><button className="staff-signout" onClick={onSignOut}>Sign out</button></div></header><div className="staff-content"><a href="/" className="staff-back-link"><ArrowLeft size={14}/> CareSlot home</a><div className="staff-heading"><div><div className="eyebrow eyebrow-dark">YOUR CARE JOURNEY</div><h1>My visits<span>.</span></h1><p>Follow requests and get updates from each hospital here.</p></div><button className="button button-primary" onClick={onBook}>Request a visit <CalendarDays size={15}/></button></div>
    {unreadTotal > 0 && <div className="patient-notification" role="status"><Bell size={18}/><span><strong>{unreadTotal} new hospital {unreadTotal === 1 ? 'update' : 'updates'}</strong><small>Open a visit to read the status update or message.</small></span><button onClick={() => { const first = appointments.find((item) => item.unreadCount); if (first) openHistory(first); }}>View update</button></div>}
    {error && <div className="form-error" role="alert">{error}</div>}{loading && !appointments.length ? <div className="queue-card queue-empty"><RefreshCw size={20} className="spin"/><p>Loading your visits…</p></div> : appointments.length === 0 ? <div className="queue-card queue-empty"><CalendarDays size={25}/><strong>No visit requests yet</strong><p>When you request a visit, it will appear here with its status.</p><button className="button button-primary" onClick={onBook}>Find a doctor</button></div> : <div className="patient-appointments">{appointments.map((appointment) => <article className="patient-appointment-card" key={appointment._id}><div className="patient-appointment-top"><div><small>{appointment.referenceCode}</small><h2>{appointment.specialty}</h2></div><span className={`status-badge status-${appointment.status}`}>{appointment.status}</span></div><div className="patient-appointment-details"><span><CalendarDays size={15}/>{formatDate(appointment.appointmentAt)}</span><span><MapPin size={15}/>{appointment.hospital?.name} · {appointment.hospital?.region}</span><span><Stethoscope size={15}/>{appointment.doctor?.name || 'First available doctor'}</span></div><div className="patient-appointment-note"><Clock3 size={14}/>{appointment.status === 'requested' ? 'Your hospital has received the request and will contact you to confirm.' : appointment.status === 'confirmed' ? 'Your hospital confirmed this visit. Check the visit history for details.' : appointment.status === 'completed' ? 'This visit is marked complete.' : 'This request was cancelled.'}</div><button className="patient-history-toggle" aria-expanded={expandedId === appointment._id} onClick={() => openHistory(appointment)}>{expandedId === appointment._id ? 'Hide visit history' : 'View history & message hospital'}{appointment.unreadCount > 0 && <span>{appointment.unreadCount} new</span>}</button>{expandedId === appointment._id && <AppointmentConversation appointment={appointment} user={user} onChange={loadAppointments}/>}</article>)}</div>}
    <p className="staff-privacy-note">Updates refresh while this page is open. CareSlot does not send email or text notifications.</p></div></main>;
}
