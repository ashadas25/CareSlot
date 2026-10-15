import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, Check, MapPin, Phone, RefreshCw, Siren } from 'lucide-react';
import { api, getErrorMessage } from '../services/api.js';
import './emergency.css';

const alertTime = (value) => new Date(value).toLocaleString('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
}) + ' IST';

export default function EmergencyInbox() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [permission, setPermission] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const seenIds = useRef(new Set());
  const firstLoad = useRef(true);

  const loadAlerts = useCallback(async (notifyNew = true) => {
    try {
      const { data } = await api.get('/emergency-alerts/hospital');
      const incoming = data.alerts || [];
      if (!firstLoad.current && notifyNew && permission === 'granted') {
        incoming.filter((alert) => alert.status === 'new' && !seenIds.current.has(alert._id)).forEach((alert) => {
          try {
            const notice = new Notification('New CareSlot emergency alert', {
              body: `${alert.patientName} · ${alert.hospitalName} · ${alert.region}`,
              tag: alert._id,
              requireInteraction: true
            });
            notice.onclick = () => { window.focus(); notice.close(); };
          } catch { /* The live inbox remains available if browser alerts are unavailable. */ }
        });
      }
      incoming.forEach((alert) => seenIds.current.add(alert._id));
      firstLoad.current = false;
      setAlerts(incoming);
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [permission]);

  useEffect(() => {
    loadAlerts(false);
    const timer = window.setInterval(() => loadAlerts(true), 10000);
    const onFocus = () => loadAlerts(true);
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [loadAlerts]);

  const enableNotifications = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') new Notification('CareSlot alerts enabled', { body: 'New clinic emergency alerts will appear while this dashboard is open.' });
  };

  const updateStatus = async (alertId, status) => {
    setUpdating(alertId);
    try {
      await api.patch(`/emergency-alerts/${alertId}`, { status });
      await loadAlerts(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setUpdating('');
    }
  };

  const newCount = alerts.filter((alert) => alert.status === 'new').length;

  return (
    <section className="emergency-inbox queue-card" aria-live="polite">
      <div className="queue-heading emergency-inbox-heading">
        <div><div className="eyebrow eyebrow-dark"><Siren size={13} /> URGENT CLINIC ALERTS · LIVE CHECK EVERY 10 SECONDS</div><h2>Emergency alerts <span>({newCount} new)</span></h2></div>
        <div className="emergency-inbox-tools">
          {permission === 'default' && <button type="button" className="button button-outline" onClick={enableNotifications}><Bell size={14} /> Enable desktop alerts</button>}
          {permission === 'denied' && <small className="notification-denied">Browser notifications are blocked. Keep this dashboard open.</small>}
          <button type="button" className="button button-outline" onClick={() => loadAlerts(false)} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh</button>
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {loading ? <div className="queue-empty"><RefreshCw size={20} className="spin" /><p>Checking urgent alerts…</p></div> : alerts.length === 0 ? <div className="queue-empty"><Siren size={22} /><strong>No emergency alerts</strong><p>New in-app alerts for this hospital will appear here while this dashboard is open.</p></div> : (
        <div className="emergency-alert-list">{alerts.map((alert) => (
          <article className={`emergency-alert-row alert-status-${alert.status}`} key={alert._id}>
            <div className="emergency-alert-symbol"><AlertTriangle size={18} /></div>
            <div className="emergency-alert-patient"><div className="emergency-alert-title"><strong>{alert.patientName}</strong><span className={`emergency-priority-badge ${alert.priority || 'urgent'}`}>{alert.priority === 'emergency' ? 'Immediate danger' : 'Urgent'}</span><span className={`emergency-status-badge ${alert.status}`}>{alert.status}</span></div><a href={`tel:${alert.patientPhone}`}><Phone size={13} /> {alert.patientPhone}</a><p>{alert.situation}</p><small><MapPin size={12} /> {alert.hospitalName} · {alert.region} <span>· {alertTime(alert.createdAt)}</span></small></div>
            {alert.status === 'new' && <button type="button" className="emergency-ack-button" disabled={updating === alert._id} onClick={() => updateStatus(alert._id, 'acknowledged')}><Check size={14} /> Acknowledge</button>}
            {alert.status === 'acknowledged' && <button type="button" className="emergency-ack-button" disabled={updating === alert._id} onClick={() => updateStatus(alert._id, 'resolved')}><Check size={14} /> Mark resolved</button>}
            <small className="emergency-alert-code">{alert.alertCode}</small>
          </article>
        ))}</div>
      )}
      <p className="emergency-inbox-note">CareSlot alerts are in-app only. They do not contact ambulance dispatch or emergency number 112.</p>
    </section>
  );
}
