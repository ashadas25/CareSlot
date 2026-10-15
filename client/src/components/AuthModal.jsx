import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Building2, Eye, EyeOff, LockKeyhole, Mail, MapPin, Phone, ShieldCheck, Stethoscope, UserRound, X } from 'lucide-react';
import { api, clinicApi, getErrorMessage } from '../services/api.js';

export default function AuthModal({ onClose, onSuccess, audience = 'patient', standalone = false }) {
  const [selectedAudience, setSelectedAudience] = useState(audience === 'choose' ? 'patient' : audience);
  const showRolePicker = audience === 'choose';
  const isAdminPortal = selectedAudience === 'admin';
  const isStaffPortal = selectedAudience === 'staff';
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ name: '', email: '', password: '', phone: '', hospitalId: '' });
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchError, setBranchError] = useState('');
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [setupStatusLoading, setSetupStatusLoading] = useState(true);
  const [setupStatusError, setSetupStatusError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAdminPortal) return;
    setBranchesLoading(true);
    clinicApi.get('/hospitals').then(({ data }) => setBranches(data.hospitals || []))
      .catch((requestError) => setBranchError(getErrorMessage(requestError)))
      .finally(() => setBranchesLoading(false));
    setSetupStatusLoading(true);
    api.get('/auth/admin-setup-status').then(({ data }) => setSetupAvailable(Boolean(data.setupAvailable)))
      .catch((requestError) => setSetupStatusError(getErrorMessage(requestError)))
      .finally(() => setSetupStatusLoading(false));
  }, [isAdminPortal]);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      let data;
      if (mode === 'provision') {
        ({ data } = await api.post('/auth/provision-admin', values));
        setValues((current) => ({ ...current, password: '' }));
        setSetupAvailable(false);
        setMode('login');
        setNotice(`${data.message} Sign in with this email and the password you just set.`);
        return;
      } else {
        ({ data } = await api.post(mode === 'register' ? '/auth/register' : '/auth/login', mode === 'register'
          ? { name: values.name, email: values.email, password: values.password, phone: values.phone }
          : { email: values.email, password: values.password }));
        const acceptedRoles = isAdminPortal ? ['admin', 'staff'] : isStaffPortal ? ['staff', 'admin'] : ['patient'];
        if (!acceptedRoles.includes(data.user.role)) {
          const wrongRoleMessage = isAdminPortal
            ? 'This account is registered as a patient. Choose Patient to sign in.'
            : isStaffPortal
              ? 'This is a patient account. Hospital team members must use their staff account.'
              : 'This is a hospital team account. Choose Staff or Admin above, then sign in.';
          setError(wrongRoleMessage); setBusy(false); return;
        }
      }
      localStorage.setItem('careslot_token', data.token);
      if (audience === 'choose') onSuccess(data.user);
      else { onClose(); onSuccess(data.user); }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally { setBusy(false); }
  };

  const isProvisioning = mode === 'provision';
  const title = isAdminPortal
    ? isProvisioning ? 'Set up administrator access.' : 'Administrator sign in.'
    : isStaffPortal ? 'Hospital team sign in.' : mode === 'login' ? 'Welcome back.' : 'Let’s get you started.';
  const description = isAdminPortal
    ? isProvisioning ? 'Create an admin account or assign admin access to an existing account.' : 'Use your CareSlot administrator account to manage clinics and appointments.'
    : isStaffPortal ? 'Use the account assigned to you by your hospital administrator.' : mode === 'login' ? 'Sign in to manage your care.' : 'Create your free patient account.';

  return <div className={`modal-backdrop ${standalone ? 'auth-entry-backdrop' : ''}`} onMouseDown={(event) => !standalone && event.target === event.currentTarget && onClose()}>
    <section className={`dialog auth-dialog ${isAdminPortal ? 'admin-auth-dialog' : ''}`} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      {!standalone && <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button>}
      <div className="auth-brand"><span className="brand-mark"><Activity size={20}/></span> careslot</div>
      <div className="auth-art"><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80" alt="A clinician offering compassionate care"/><div><span>YOUR HEALTH, YOUR WAY</span><strong>Care should feel<br/>like coming home.</strong></div></div>
      <div className="auth-content">
        {showRolePicker && <>
          <p className="signin-choice-prompt">Are you a patient or a hospital admin?</p>
          <div className="signin-role-picker" role="group" aria-label="Choose account type">
          {[[ 'patient', 'Patient', UserRound], ['admin', 'Admin', ShieldCheck]].map(([role, label, Icon]) => <button key={role} type="button" className={selectedAudience === role ? 'active' : ''} aria-pressed={selectedAudience === role} onClick={() => { setSelectedAudience(role); setMode('login'); setError(''); setNotice(''); }}>{<Icon size={15}/>} {label}</button>)}
          </div>
        </>}
        <div className="eyebrow eyebrow-dark">{isAdminPortal ? 'CARESLOT HOSPITAL ADMIN' : 'A LITTLE CLOSER TO CARE'}</div>
        <h2 id="auth-title">{title}</h2><p>{description}</p>
        {isProvisioning && <div className="admin-setup-hint"><Building2 size={15}/><span>Choose the administrator’s primary hospital. This records their hospital affiliation; admin access can manage all branches.</span></div>}
        <form onSubmit={submit} className="auth-form">
          {(mode === 'register' || isProvisioning) && <label>Full name<div className="input-wrap"><UserRound size={16}/><input required autoComplete="name" maxLength="100" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="e.g. Ananya Kumar"/></div></label>}
          <label>Email address<div className="input-wrap"><Mail size={16}/><input type="email" required autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com"/></div></label>
          {(mode === 'register' || isProvisioning) && <label>Phone number <span className="optional">(for hospital coordination)</span><div className="input-wrap"><Phone size={16}/><input type="tel" autoComplete="tel" maxLength="20" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} placeholder="+91 90000 00000"/></div></label>}
          {isProvisioning && <>
            <label>Primary hospital<div className="input-wrap"><MapPin size={16}/><select required value={values.hospitalId} onChange={(event) => setValues({ ...values, hospitalId: event.target.value })}><option value="">{branchesLoading ? 'Loading hospitals…' : branches.length ? 'Choose a hospital' : 'No active hospitals found'}</option>{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name} · {branch.locality}, {branch.region}</option>)}</select></div></label>
            {branchError && <small className="admin-setup-error">{branchError}</small>}
            {!branchesLoading && !branchError && branches.length === 0 && <small className="admin-setup-error">Start the clinic directory service and seed its hospital list, then try again.</small>}
          </>}
          <label>Password<div className="input-wrap"><LockKeyhole size={16}/><input type={showPassword ? 'text' : 'password'} required minLength="8" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="At least 8 characters"/><button className="input-trailing" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
          {notice && <div className="admin-setup-success" role="status">{notice}</div>}
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary auth-submit" disabled={busy || (isProvisioning && (!setupAvailable || setupStatusLoading || branchesLoading || branches.length === 0))}>{busy ? 'Please wait…' : isProvisioning ? 'Register administrator' : isAdminPortal ? 'Admin sign in' : isStaffPortal ? 'Staff sign in' : mode === 'login' ? 'Patient sign in' : 'Create patient account'} <ArrowRight size={16}/></button>
        </form>
          {isAdminPortal ? <>
          <div className="admin-auth-tabs" role="tablist" aria-label="Administrator account options">
            <button type="button" role="tab" aria-selected={!isProvisioning} className={!isProvisioning ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Admin sign in</button>
            <button type="button" role="tab" aria-selected={isProvisioning} className={isProvisioning ? 'active' : ''} disabled={!setupAvailable || setupStatusLoading} onClick={() => { setMode('provision'); setError(''); setNotice(''); }}>{setupStatusLoading ? 'Checking setup…' : setupAvailable ? 'Register admin' : 'Registration closed'}</button>
          </div>
          {setupStatusError && <small className="admin-setup-error">Could not check first-time admin setup: {setupStatusError}</small>}
          {!setupStatusLoading && !setupStatusError && !setupAvailable && <small className="admin-setup-note">First-time admin registration is closed. Ask a CareSlot server owner or existing administrator for access.</small>}
        </>
          : !isStaffPortal ? <p className="auth-switch">{mode === 'login' ? 'New to CareSlot?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
            : <p className="auth-switch">Hospital staff accounts are set up by a CareSlot administrator.</p>}
        <small className="auth-privacy">{isAdminPortal ? 'Administrator access is limited to authorized CareSlot accounts.' : isStaffPortal ? 'Hospital team accounts are provided by a CareSlot administrator.' : 'Your account is protected. We only use your details to coordinate your care.'}</small>
      </div>
    </section>
  </div>;
}
