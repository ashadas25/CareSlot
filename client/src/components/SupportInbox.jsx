import { useCallback, useEffect, useState } from 'react';
import { Mail, MessageCircle, RefreshCw, UserRound } from 'lucide-react';
import { api, getErrorMessage } from '../services/api.js';
import './support.css';

export default function SupportInbox() {
  const [requests, setRequests] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [updating, setUpdating] = useState('');
  const loadRequests = useCallback(async () => { setLoading(true); setError(''); try { const { data } = await api.get('/support'); setRequests(data.requests); } catch (e) { setError(getErrorMessage(e)); } finally { setLoading(false); } }, []);
  useEffect(() => { loadRequests(); }, [loadRequests]);
  const updateStatus = async (id, status) => { setUpdating(id); setError(''); try { await api.patch(`/support/${id}/status`, { status }); await loadRequests(); } catch (e) { setError(getErrorMessage(e)); } finally { setUpdating(''); } };
  return <section className="queue-card support-inbox"><div className="queue-heading"><div><div className="eyebrow eyebrow-dark">ADMIN SUPPORT INBOX</div><h2>Help questions <span>({requests.length})</span></h2></div><button className="button button-outline" onClick={loadRequests} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''}/> Refresh</button></div>
    {error && <div className="form-error">{error}</div>}{loading ? <div className="queue-empty"><RefreshCw size={20} className="spin"/><p>Loading support questions…</p></div> : requests.length === 0 ? <div className="queue-empty"><MessageCircle size={22}/><strong>No open questions</strong><p>Questions sent from the CareSlot help form will appear here.</p></div> : <div className="support-request-list">{requests.map((request) => <article className="support-request" key={request._id}><div className="support-request-main"><div className="support-request-meta"><strong><UserRound size={13}/>{request.name}</strong><a href={`mailto:${request.email}`}><Mail size={12}/>{request.email}</a><time>{new Date(request.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time></div><p>{request.message}</p></div><label className="support-status-label">Status<select value={request.status} disabled={updating === request._id} onChange={(e) => updateStatus(request._id, e.target.value)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></label></article>)}</div>}
  </section>;
}
