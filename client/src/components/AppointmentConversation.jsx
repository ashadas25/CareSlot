import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { api, getErrorMessage } from '../services/api.js';

const formatTime = (value) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) + ' IST';

export default function AppointmentConversation({ appointment, user, onChange }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const updates = appointment.updates?.length ? appointment.updates : [{ status: appointment.status, actorRole: 'hospital', note: 'Visit request created.', createdAt: appointment.createdAt }];
  const send = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true); setError('');
    try {
      await api.post(`/appointments/${appointment._id}/messages`, { body: body.trim() });
      setBody(''); await onChange?.();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSending(false); }
  };
  return <section className="appointment-conversation" aria-label={`History and messages for ${appointment.referenceCode}`}>
    <div className="appointment-history"><div className="appointment-thread-heading"><strong>Visit history</strong><span>{appointment.referenceCode}</span></div><ol>{updates.map((item, index) => <li key={`${item.createdAt}-${index}`}><i/><div><strong>{item.status}</strong><span>{item.note || (item.status === 'requested' ? 'Request sent to hospital.' : `Status changed to ${item.status}.`)}</span><small>{formatTime(item.createdAt)}</small></div></li>)}</ol></div>
    <div className="appointment-chat"><div className="appointment-thread-heading"><strong><MessageCircle size={15}/> Messages with hospital</strong><span>Keep messages about this visit here.</span></div><div className="appointment-message-list" aria-live="polite">{appointment.messages?.length ? appointment.messages.map((message, index) => <article className={`appointment-message ${message.senderRole === 'patient' ? 'from-patient' : 'from-hospital'}`} key={`${message.createdAt}-${index}`}><small>{message.senderRole === 'patient' ? 'You' : 'Hospital team'} · {formatTime(message.createdAt)}</small><p>{message.body}</p></article>) : <p className="appointment-chat-empty">No messages yet. Send a message if you have a question about this visit.</p>}</div><form onSubmit={send}><label className="sr-only" htmlFor={`message-${appointment._id}`}>Write a message</label><textarea id={`message-${appointment._id}`} rows="2" maxLength="1200" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message about this visit…"/><button className="button button-primary" disabled={sending || !body.trim()}>{sending ? 'Sending…' : 'Send'} <Send size={14}/></button></form>{error && <p className="form-error" role="alert">{error}</p>}{user?.role === 'patient' && <small className="appointment-chat-note">Avoid sending emergency details here. Call 112 for immediate danger.</small>}</div>
  </section>;
}
