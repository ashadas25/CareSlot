import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Check, PhoneCall, Send, Siren, X } from 'lucide-react';
import { api, clinicApi, getErrorMessage } from '../services/api.js';

const regions = ['Coimbatore', 'Chennai', 'Madurai', 'Tiruchirappalli', 'Salem'];

function guidanceForSituation(value) {
  const text = value.toLowerCase();
  const critical = /unconscious|not breathing|difficulty breathing|trouble breathing|chest pain|severe bleeding|heavy bleeding|won't stop bleeding|stroke|face.{0,20}swelling|throat.{0,20}swelling|seizure|poison|overdose/.test(text);
  if (/head|neck|spine|back injury|jaw/.test(text) || (/fall|crash|accident/.test(text) && /head|neck|back/.test(text))) return {
    critical: critical || /head injury|neck injury|spinal|can't move|cannot move|severe/.test(text) || (/fall|crash|accident/.test(text) && /head|neck|back|unconscious/.test(text)),
    title: 'Possible head, neck or back injury',
    steps: ['Keep the person as still as possible and support them in the position found.', 'Do not move or twist the head, neck or jaw unless staying there is immediately dangerous.', 'Call 112 for a serious injury, loss of consciousness, worsening pain or any breathing problem; follow the call-handler’s instructions.']
  };
  if (/bleed|bleeding|cut|wound/.test(text)) return {
    critical: critical || /severe|heavy|won't stop|does not stop|doesn't stop/.test(text),
    title: 'Bleeding or a wound',
    steps: ['For severe or uncontrolled bleeding, call 112 now.', 'If it is safe, press firmly on the wound with a clean dressing or cloth.', 'If blood soaks through, add another layer without removing the first. Do not press directly on an embedded object.']
  };
  if (/poison|swallow|overdose|ingest/.test(text)) return {
    critical: true,
    title: 'Possible poisoning or overdose',
    steps: ['Call 112 or seek urgent professional advice now if the person is unwell, drowsy, having trouble breathing or deteriorating.', 'Do not make them vomit or give food, drink or medicine unless a qualified professional tells you to.', 'Keep the container or product information available for responders, if it is safe to do so.']
  };
  if (/burn|scald|hot water|fire|electric shock|chemical.{0,20}burn|burn.{0,20}chemical/.test(text)) return {
    critical: critical || /large|face|eye|hand|foot|deep|chemical|electric|smoke|breath/.test(text),
    title: 'A burn or scald',
    steps: ['For a large, deep, chemical or electrical burn, a burn to the face or eyes, or any breathing difficulty, call 112 or seek urgent medical care.', 'For a small heat burn, cool it promptly under clean, cool running water. Remove nearby jewellery or loose clothing only if it is not stuck.', 'Do not use ice or pull away anything stuck to the burn. Follow a clinician or emergency call-handler’s advice.']
  };
  if (/seizure|convulsion|fit/.test(text)) return {
    critical: true,
    title: 'A seizure or convulsion',
    steps: ['Call 112 for a first seizure, a seizure lasting about five minutes or more, repeated seizures, injury or difficulty breathing.', 'Move nearby objects away and cushion the head if possible; do not restrain the person.', 'Do not put anything in their mouth. Note when it began and follow the call-handler’s instructions.']
  };
  if (/allerg|swelling|anaphylaxis/.test(text)) return {
    critical: /breath|throat|face|swelling|anaphylaxis|faint|collapse/.test(text),
    title: 'An allergic reaction',
    steps: ['Call 112 immediately if breathing is difficult, the face or throat is swelling, or the person is fainting or becoming unresponsive.', 'Stay with the person and follow the emergency call-handler’s instructions.', 'If the person has a prescribed emergency plan, follow that plan while getting professional help.']
  };
  if (/chok|suffocat|breath|asthma|chest pain/.test(text)) return {
    critical: true,
    title: /chest pain/.test(text) ? 'Chest pain' : 'Breathing difficulty or choking',
    steps: ['Call 112 now. Do not wait for an in-app clinic response.', 'Stay with the person, keep the area clear and follow the emergency call-handler’s instructions.', 'If the person becomes unresponsive or their breathing worsens, tell the call-handler immediately.']
  };
  if (/fracture|broken bone|sprain|twist|ankle|wrist|limb|injury/.test(text)) return {
    critical: critical || /deform|numb|cannot move|can't move|severe/.test(text),
    title: 'A possible bone or joint injury',
    steps: ['Help the person keep the injured area still and supported in the position found.', 'Do not straighten or force a painful limb or joint.', 'Seek urgent medical care; call 112 for severe injury, major bleeding, numbness or any breathing problem.']
  };
  return {
    critical,
    title: 'General safety while you contact a clinician',
    steps: ['Make sure the area is safe and stay with the person.', 'Avoid moving someone with a possible serious injury unless there is immediate danger.', 'If symptoms become severe, the person is unconscious, has difficulty breathing or is bleeding heavily, call 112 now.']
  };
}

export default function EmergencyBanner() {
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [directoryError, setDirectoryError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [urgency, setUrgency] = useState('emergency');
  const [form, setForm] = useState({
    region: 'Coimbatore', hospitalId: '', patientName: '', patientPhone: '', situation: ''
  });

  const visibleBranches = useMemo(
    () => branches.filter((branch) => branch.region === form.region),
    [branches, form.region]
  );
  const firstAidGuidance = useMemo(() => guidanceForSituation(form.situation), [form.situation]);

  useEffect(() => {
    if (!open || branches.length) return;
    clinicApi.get('/hospitals')
      .then(({ data }) => {
        setBranches(data.hospitals);
        setDirectoryError('');
      })
      .catch((requestError) => setDirectoryError(getErrorMessage(requestError)));
  }, [open, branches.length]);

  useEffect(() => {
    if (!visibleBranches.some((branch) => branch._id === form.hospitalId)) {
      setForm((previous) => ({ ...previous, hospitalId: visibleBranches[0]?._id || '' }));
    }
  }, [form.region, form.hospitalId, visibleBranches]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(null);
    setBusy(true);
    try {
      const { data } = await api.post('/emergency-alerts', {
        patientName: form.patientName,
        patientPhone: form.patientPhone,
        hospitalId: form.hospitalId,
        urgency,
        situation: urgency === 'emergency'
          ? 'Immediate emergency. The caller could not provide a description; use the callback number.'
          : form.situation
      });
      setSuccess(data.alert);
      setForm((previous) => ({ ...previous, patientName: '', patientPhone: '', situation: '' }));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`emergency-section ${open ? 'has-emergency-form' : ''}`} id="emergency">
      <div className="emergency-icon"><Siren size={25} /><span>!</span></div>
      <div className="emergency-copy">
        <small>IF SOMEONE NEEDS HELP RIGHT NOW</small>
        <h2>Urgent? Get help <span>now.</span></h2>
        <p>Call India’s emergency response service on 112 first. You can also send an in-app alert to a selected CareSlot clinic branch.</p>
      </div>
      <div className="emergency-actions">
        <a className="emergency-call" href="tel:112" aria-label="Call emergency number 112">
          <PhoneCall size={19} /><span><small>INDIA EMERGENCY NUMBER</small><strong>Call 112</strong></span><ArrowUpRight size={16} />
        </a>
        <button className="emergency-notify-button" type="button" onClick={() => { setOpen((value) => !value); setSuccess(null); setError(''); }}>
          {open ? <X size={16} /> : <Siren size={16} />}{open ? 'Close alert form' : 'Alert a clinic'}
        </button>
      </div>
      {open && (
        <div className="emergency-alert-panel">
          <div className="emergency-alert-heading">
            <span><AlertTriangle size={19} /></span>
            <div><strong>Send an urgent clinic alert</strong><small>The selected branch’s CareSlot staff dashboard checks for new alerts every 10 seconds.</small></div>
          </div>
          <div className="emergency-alert-warning"><AlertTriangle size={15} />This is an in-app notification only. It does not contact 112 or dispatch an ambulance. Call 112 for immediate danger.</div>
          {success ? (
            <div className="emergency-alert-success" role="status"><Check size={20} /><div><strong>Alert sent to {success.hospitalName}</strong><span>Reference {success.alertCode}. The hospital team can see it in its CareSlot dashboard.</span></div><button type="button" onClick={() => setSuccess(null)}>Send another</button></div>
          ) : (
            <form className="emergency-alert-form" onSubmit={submit}>
              <fieldset className="emergency-urgency-choice">
                <legend>How urgent is it?</legend>
                <label className={urgency === 'emergency' ? 'is-selected' : ''}>
                  <input type="radio" name="urgency" value="emergency" checked={urgency === 'emergency'} onChange={() => setUrgency('emergency')} />
                  <span><strong>Immediate danger</strong><small>Call 112 now. No description is needed to send this clinic alert.</small></span>
                </label>
                <label className={urgency === 'urgent' ? 'is-selected' : ''}>
                  <input type="radio" name="urgency" value="urgent" checked={urgency === 'urgent'} onChange={() => setUrgency('urgent')} />
                  <span><strong>Urgent, but not life-threatening</strong><small>Describe briefly so the clinic can understand what help you need.</small></span>
                </label>
              </fieldset>
              <div className="form-row">
                <label>Your name<input required maxLength="100" autoComplete="name" value={form.patientName} onChange={(event) => setForm({ ...form, patientName: event.target.value })} /></label>
                <label>Callback phone<input required type="tel" maxLength="25" autoComplete="tel" placeholder="+91 90000 00000" value={form.patientPhone} onChange={(event) => setForm({ ...form, patientPhone: event.target.value })} /></label>
              </div>
              <div className="form-row">
                <label>City / district<select value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })}>{regions.map((region) => <option key={region}>{region}</option>)}</select></label>
                <label>Notify this clinic branch<select required disabled={!visibleBranches.length} value={form.hospitalId} onChange={(event) => setForm({ ...form, hospitalId: event.target.value })}>{visibleBranches.map((branch) => <option key={branch._id} value={branch._id}>{branch.locality} — {branch.name}</option>)}</select></label>
              </div>
              {urgency === 'urgent' && <>
                <label>Briefly describe what is happening<textarea required maxLength="500" rows="3" value={form.situation} onChange={(event) => setForm({ ...form, situation: event.target.value })} placeholder="Share a short summary for the clinic team." /></label>
                <aside className={`emergency-first-aid ${firstAidGuidance.critical ? 'is-critical' : ''}`} aria-live="polite" aria-label="First-aid guidance based on the description">
                  <strong>{firstAidGuidance.critical ? 'This may need emergency help — call 112 now' : `While you wait — ${firstAidGuidance.title}`}</strong>
                  {firstAidGuidance.critical && <a className="first-aid-call" href="tel:112">Call 112</a>}
                  <ul>{firstAidGuidance.steps.map((step) => <li key={step}>{step}</li>)}</ul>
                  <small>General safety information only; it cannot assess an emergency or replace trained help. Follow the emergency call-handler’s instructions. <a href="https://www.indianredcross.org/ircs/program/FirstAid/" target="_blank" rel="noreferrer">Indian Red Cross first-aid resources</a>.</small>
                </aside>
              </>}
              {directoryError && <div className="form-error" role="alert">Could not load clinic branches. {directoryError}</div>}
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="button button-primary emergency-alert-submit" type="submit" disabled={busy || !form.hospitalId || !!directoryError}>{busy ? 'Sending clinic alert…' : urgency === 'emergency' ? 'Send immediate clinic alert' : 'Send urgent clinic alert'} <Send size={15} /></button>
              <small className="emergency-alert-privacy">Your alert and callback number are stored for clinic follow-up. Do not include detailed medical history.</small>
            </form>
          )}
        </div>
      )}
      <a className="emergency-info" href="https://112.gov.in/" target="_blank" rel="noreferrer">About 112 <ArrowUpRight size={13} /></a>
      <div className="emergency-decoration">✳</div>
    </section>
  );
}
