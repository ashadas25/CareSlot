import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleHelp, Clock3, LifeBuoy, MapPin, MessageCircle, Send, X } from 'lucide-react';
import { api, clinicApi, getErrorMessage } from '../services/api.js';

const faqs = [
  ['How do I book an appointment?', 'Choose a region, hospital and specialty, then request a time. The hospital team will contact you to confirm.'],
  ['Is my appointment confirmed?', 'A request stays pending until the hospital team confirms it. Sign in and open My visits to follow updates and message the clinic team.'],
  ['Can I choose a clinic branch?', 'Yes. Choose a region first, then select an available CareSlot branch in that city.'],
  ['I need urgent medical help.', 'Call India emergency services at 112 or go to your nearest emergency department. An in-app clinic alert is not an ambulance dispatch service.']
];

function answerHospitalQuestion(question, branch) {
  const text = question.toLowerCase();
  if (/\b(112|immediate danger|unconscious|can't breathe|cannot breathe|not breathing|severe bleeding|trouble breathing|chest pain)\b/.test(text)) {
    return 'If someone may be in immediate danger, call India emergency services on 112 now. This assistant and clinic alerts do not dispatch emergency responders.';
  }
  if (/\b(hour|hours|timing|timings|open|opening|close|closing)\b/.test(text)) {
    if (!branch) return 'Choose the hospital branch above first. I can show its published hours or its contact number.';
    return branch.openingHours?.trim()
      ? `${branch.name}: ${branch.openingHours}. Please call ${branch.phone} to confirm holiday or same-day changes.`
      : `Published opening hours are not available for ${branch.name}. Please call ${branch.phone} to confirm when it is open.`;
  }
  if (/\b(phone|number|call|contact|telephone)\b/.test(text)) return branch ? `Contact ${branch.name} at ${branch.phone}${branch.emergencyPhone ? `. Branch emergency contact: ${branch.emergencyPhone}.` : '.'}` : 'Choose a hospital branch above and I can show its contact number.';
  if (/\b(address|location|where|directions|located)\b/.test(text)) return branch ? `${branch.name} is listed at ${branch.address}, ${branch.locality}, ${branch.region}. Please contact the branch if you need directions.` : 'Choose a hospital branch above first and I can show its listed address.';
  if (/\b(specialt|service|doctor|clinician)\b/.test(text)) return branch ? `${branch.name} lists these services: ${(branch.services || []).join(', ') || 'No services listed'}. Doctor availability depends on the selected date.` : 'Choose a hospital branch above and I can show its listed services.';
  if (/how .*\b(book|request)|\b(book|request) (a|an )?(visit|appointment)\b/.test(text)) return 'To request a visit, choose Find care, select a city and branch, then choose a specialty, date and time. Sign in as a patient to submit the request. The hospital will confirm it in My visits.';
  if (/\b(status|confirm|confirmed|history|reference)\b|\bmy (visit|appointment)\b/.test(text)) return 'Open My visits to see request status, hospital updates and the saved message history for each visit.';
  if (/\b(pain|symptom|diagnos|medicine|medication|treat|treatment|first aid|injury|illness|medical advice)\b/.test(text)) return 'I can help with hospital information, but I cannot assess symptoms or recommend treatment. Contact a qualified clinician. For immediate danger in India, call 112.';
  return 'I can help with a selected branch’s published hours, address, phone number, services, booking steps and visit status. For a medical concern, contact a qualified clinician; for immediate danger in India, call 112.';
}

export default function HelpWidget({ user }) {
  const [open, setOpen] = useState(false); const [tab, setTab] = useState('answers'); const [expanded, setExpanded] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', message: '' }); const [status, setStatus] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [branches, setBranches] = useState([]); const [branchId, setBranchId] = useState(''); const [question, setQuestion] = useState(''); const [chat, setChat] = useState([{ from: 'assistant', text: 'Hello. Choose a branch and ask about its published hours, location, phone number or services.' }]); const [chatError, setChatError] = useState('');
  useEffect(() => {
    const openHelp = (event) => { setOpen(true); setTab(event.detail === 'message' ? 'message' : 'answers'); };
    window.addEventListener('careslot:open-help', openHelp);
    return () => window.removeEventListener('careslot:open-help', openHelp);
  }, []);
  useEffect(() => {
    if (tab !== 'hospital' || branches.length) return;
    clinicApi.get('/hospitals').then(({ data }) => { setBranches(data.hospitals || []); setBranchId(data.hospitals?.[0]?._id || ''); }).catch((e) => setChatError(getErrorMessage(e)));
  }, [tab, branches.length]);
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { await api.post('/support', form); setStatus('Your question was added to CareSlot’s support queue. This sample environment does not send email replies.'); setForm({ name: '', email: '', message: '' }); } catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); } };
  const askAssistant = async (event) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    const branch = branches.find((item) => item._id === branchId);
    setChat((items) => [...items, { from: 'you', text: trimmed }]);
    setQuestion(''); setChatError('');
    let answer = answerHospitalQuestion(trimmed, branch);
    const wantsVisitStatus = /\b(status|confirm|confirmed|history|reference)\b|\bmy (visit|appointment)\b/i.test(trimmed);
    if (wantsVisitStatus && user?.role === 'patient') {
      try {
        const { data } = await api.get('/appointments/mine');
        const matches = data.appointments || [];
        const reference = trimmed.match(/CS-[A-Z0-9]+/i)?.[0]?.toUpperCase();
        const appointment = (reference && matches.find((item) => item.referenceCode === reference)) || matches[0];
        answer = appointment
          ? `Your ${appointment.referenceCode} request for ${appointment.specialty} at ${appointment.hospital?.name || 'your selected branch'} is currently ${appointment.status}. Open My visits for the full update history and to message the hospital team.`
          : 'There are no visit requests on this account yet. When you request one, its status and hospital messages will appear in My visits.';
      } catch (requestError) { answer = getErrorMessage(requestError); }
    } else if (wantsVisitStatus && !user) {
      answer = 'Sign in as a patient and open My visits to see request status, hospital updates and messages for each visit.';
    }
    setChat((items) => [...items, { from: 'assistant', text: answer }]);
  };
  return <div className="help-widget" id="help"><button type="button" className={`help-launcher ${open ? 'is-active' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="careslot-help-panel" aria-label={open ? 'Close help' : 'Open CareSlot help'}><span className="help-launcher-ping"/>{open ? <X size={22}/> : <CircleHelp size={22}/>}<span>{open ? 'Close' : 'Need a hand?'}</span></button>
    {open && <section className="help-panel" id="careslot-help-panel" aria-label="CareSlot help" tabIndex={-1}><div className="help-panel-head"><div className="help-head-icon"><LifeBuoy size={20}/></div><div><small>WE’RE HERE FOR YOU</small><h3>How can we help?</h3></div><button type="button" onClick={() => setOpen(false)} aria-label="Close help"><X size={18}/></button></div>
      <div className="help-tabs"><button className={tab === 'answers' ? 'active' : ''} onClick={() => setTab('answers')}>Quick answers</button><button className={tab === 'hospital' ? 'active' : ''} onClick={() => setTab('hospital')}>Hospital info</button><button className={tab === 'message' ? 'active' : ''} onClick={() => setTab('message')}>Contact</button></div>
      {tab === 'answers' ? <div className="faq-list">{faqs.map(([questionText, answer], index) => <div className={`faq-item ${expanded === index ? 'expanded' : ''}`} key={questionText}><button onClick={() => setExpanded(expanded === index ? -1 : index)}>{questionText}<span>{expanded === index ? '−' : '+'}</span></button>{expanded === index && <p>{answer}</p>}</div>)}<button className="help-contact-link" onClick={() => setTab('hospital')}><MessageCircle size={15}/> Ask about a hospital <ArrowRight size={14}/></button></div>
        : tab === 'hospital' ? <div className="hospital-assistant"><label>Select a clinic branch<select value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">Choose a branch</option>{branches.map((branch) => <option value={branch._id} key={branch._id}>{branch.locality} · {branch.name}</option>)}</select></label>{chatError && <div className="form-error" role="alert">{chatError}</div>}<div className="hospital-chat-log" aria-live="polite">{chat.map((item, index) => <p className={`hospital-chat-message ${item.from}`} key={`${index}-${item.from}`}>{item.text}</p>)}</div><form onSubmit={askAssistant} className="hospital-chat-form"><input aria-label="Ask a hospital information question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about hours, address, services…"/><button className="button button-primary" aria-label="Send question"><Send size={15}/></button></form><small><Clock3 size={12}/> Hours appear only when published by the clinic. This assistant does not give medical advice.</small></div>
        : <form className="help-form" onSubmit={submit}>{status ? <div className="help-success"><span><Check size={19}/></span><strong>Message received</strong><p>{status}</p><button type="button" onClick={() => setStatus('')}>Send another question</button></div> : <><label>Your name<input required maxLength="100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name"/></label><label>Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"/></label><label>Your question<textarea required maxLength="1200" rows="4" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what you need help with"/></label>{error && <div className="form-error">{error}</div>}<button className="button button-primary help-submit" disabled={busy}>{busy ? 'Sending…' : 'Send question'} <Send size={15}/></button><small className="support-expectation">Our team usually replies within one working day.</small></>}</form>}
      <div className="help-panel-foot"><i/> CareSlot support is here for you</div></section>}</div>;
}
