import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Building2, CalendarDays, Check,
  ChevronRight, CircleHelp, Clock3, LayoutDashboard, LogOut, MapPin, Plus, RefreshCw,
  Search, ShieldCheck, Stethoscope, UserRound, Users, X, MessageSquare
} from 'lucide-react';
import { api, clinicApi, getErrorMessage } from '../services/api.js';
import { getSampleDoctorProfile } from '../data/doctorProfiles.js';
import EmergencyInbox from '../components/EmergencyInbox.jsx';
import SupportInbox from '../components/SupportInbox.jsx';
import AppointmentConversation from '../components/AppointmentConversation.jsx';
import './admin.css';

const regions = ['Coimbatore', 'Chennai', 'Madurai', 'Tiruchirappalli', 'Salem', 'Other'];
const specialties = ['General care', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Neurology', 'ENT', 'Ophthalmology', 'Gynecology', 'Dentistry'];
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const blankBranch = { name: '', region: 'Coimbatore', locality: '', address: '', phone: '', emergencyPhone: '112', openingHours: '', services: [...specialties] };
const blankDoctor = { name: '', hospitalId: '', specialty: 'General care', experienceYears: 5, imageUrl: '', consultationFee: 500, availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], isAvailable: true };
const formatDate = (value) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
const doctorDisplayName = (doctor) => {
  const oldSampleName = /^Dr\. CareSlot Demo (\d+)$/i.exec(doctor.name || '');
  return oldSampleName ? getSampleDoctorProfile(doctor.specialty, Number(oldSampleName[1]))?.name || doctor.name : doctor.name;
};
const navItems = [
  ['overview', 'Overview', LayoutDashboard], ['branches', 'Branches', Building2], ['doctors', 'Doctors', Stethoscope],
  ['appointments', 'Appointments', CalendarDays], ['support', 'Support inbox', MessageSquare], ['alerts', 'Urgent alerts', AlertTriangle]
];

function AdminGate({ user, onSignIn, onSignOut }) {
  if (!user) return <main className="admin-gate"><div><span className="admin-gate-mark"><ShieldCheck /></span><small>CARESLOT ADMINISTRATION</small><h1>Admin sign-in</h1><p>Sign in with a CareSlot administrator account. First time here? Set up your account and choose your primary hospital.</p><button className="button button-primary" onClick={onSignIn}>Continue to admin sign-in</button><a href="/">Return to CareSlot</a></div></main>;
  return <main className="admin-gate"><div><span className="admin-gate-mark"><ShieldCheck /></span><small>ADMINISTRATOR ACCESS</small><h1>Administrator account required</h1><p>Choose Admin on the CareSlot sign-in screen and use an authorized administrator account.</p><button className="button button-primary" onClick={onSignIn}>Continue to secure sign-in</button><button className="button button-outline admin-gate-secondary" onClick={onSignOut}>Sign out</button></div></main>;
}

function Metric({ icon: Icon, label, value, hint, tone = 'blue' }) {
  return <article className={`admin-metric ${tone}`}><span className="admin-metric-icon"><Icon size={19} /></span><small>{label}</small><strong>{value}</strong><em>{hint}</em></article>;
}

function StatusPill({ status }) {
  return <span className={`admin-status admin-status-${String(status).toLowerCase()}`}>{status}</span>;
}

export default function AdminDashboard({ user, onSignIn, onSignOut }) {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState({ appointments: 'checking', directory: 'checking' });
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [branchQuery, setBranchQuery] = useState('');
  const [doctorQuery, setDoctorQuery] = useState('');
  const [doctorBranch, setDoctorBranch] = useState('all');
  const [appointmentStatus, setAppointmentStatus] = useState('all');
  const [appointmentRegion, setAppointmentRegion] = useState('all');
  const [branchEditor, setBranchEditor] = useState(null);
  const [doctorEditor, setDoctorEditor] = useState(null);
  const [branchForm, setBranchForm] = useState(blankBranch);
  const [doctorForm, setDoctorForm] = useState(blankDoctor);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [conversationId, setConversationId] = useState('');

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true); setError('');
    const checks = await Promise.allSettled([
      api.get('/admin/overview'),
      api.get('/admin/hospitals'),
      api.get('/admin/doctors'),
      api.get('/appointments/hospital'),
      api.get('/health'),
      clinicApi.get('/health')
    ]);
    if (checks[0].status === 'fulfilled') setOverview(checks[0].value.data);
    else setError(getErrorMessage(checks[0].reason));
    if (checks[1].status === 'fulfilled') setBranches(checks[1].value.data.hospitals || []);
    else setError((previous) => previous || getErrorMessage(checks[1].reason));
    if (checks[2].status === 'fulfilled') setDoctors(checks[2].value.data.doctors || []);
    else setError((previous) => previous || getErrorMessage(checks[2].reason));
    if (checks[3].status === 'fulfilled') setAppointments(checks[3].value.data.appointments || []);
    else setError((previous) => previous || getErrorMessage(checks[3].reason));
    setHealth({
      appointments: checks[4].status === 'fulfilled' ? 'online' : 'offline',
      directory: checks[5].status === 'fulfilled' ? 'online' : 'offline'
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (user?.role !== 'admin') return undefined;
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try { const { data } = await api.get('/appointments/hospital'); setAppointments(data.appointments || []); }
      catch (requestError) { setError(getErrorMessage(requestError)); }
    }, 20000);
    return () => window.clearInterval(timer);
  }, [user]);

  const filteredBranches = useMemo(() => branches.filter((branch) => `${branch.name} ${branch.region} ${branch.locality} ${branch.branchCode}`.toLowerCase().includes(branchQuery.toLowerCase())), [branches, branchQuery]);
  const filteredDoctors = useMemo(() => doctors.filter((doctor) => {
    const matchesBranch = doctorBranch === 'all' || doctor.hospital?._id === doctorBranch;
    return matchesBranch && `${doctorDisplayName(doctor)} ${doctor.specialty} ${doctor.hospital?.name || ''}`.toLowerCase().includes(doctorQuery.toLowerCase());
  }), [doctors, doctorBranch, doctorQuery]);
  const filteredAppointments = useMemo(() => appointments.filter((appointment) =>
    (appointmentStatus === 'all' || appointment.status === appointmentStatus) &&
    (appointmentRegion === 'all' || appointment.region === appointmentRegion)
  ), [appointments, appointmentStatus, appointmentRegion]);

  if (!user || user.role !== 'admin') return <AdminGate user={user} onSignIn={onSignIn} onSignOut={onSignOut} />;

  const resetBranchEditor = () => { setBranchEditor(null); setBranchForm(blankBranch); };
  const resetDoctorEditor = () => { setDoctorEditor(null); setDoctorForm({ ...blankDoctor, hospitalId: branches.find((branch) => branch.isActive)?._id || '' }); };
  const startBranchEdit = (branch) => { setBranchEditor(branch._id); setBranchForm({ name: branch.name, region: branch.region, locality: branch.locality, address: branch.address, phone: branch.phone, emergencyPhone: branch.emergencyPhone || '', openingHours: branch.openingHours || '', services: branch.services || [] }); };
  const startDoctorEdit = (doctor) => { setDoctorEditor(doctor._id); setDoctorForm({ name: doctorDisplayName(doctor), hospitalId: doctor.hospital?._id || '', specialty: doctor.specialty, experienceYears: doctor.experienceYears || 0, imageUrl: doctor.imageUrl || '', consultationFee: doctor.consultationFee || 0, availableDays: doctor.availableDays || [], isAvailable: doctor.isAvailable }); };
  const saveBranch = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const isEditing = Boolean(branchEditor && branchEditor !== 'new');
    const values = { ...branchForm, name: branchForm.name.trim() || `CareSlot Clinic — ${branchForm.locality} Branch` };
    try {
      if (isEditing) await api.patch(`/admin/hospitals/${branchEditor}`, values);
      else await api.post('/admin/hospitals', values);
      resetBranchEditor(); setNotice(isEditing ? 'Branch details updated.' : 'Clinic branch added.'); await refresh();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  };
  const saveDoctor = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const isEditing = Boolean(doctorEditor && doctorEditor !== 'new');
    try {
      if (isEditing) await api.patch(`/admin/doctors/${doctorEditor}`, doctorForm);
      else await api.post('/admin/doctors', doctorForm);
      resetDoctorEditor(); setNotice(isEditing ? 'Clinician details updated.' : 'Clinician added to the selected branch.'); await refresh();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  };
  const toggleBranch = async (branch) => {
    setUpdatingId(branch._id); setError('');
    try { await api.patch(`/admin/hospitals/${branch._id}`, { isActive: !branch.isActive }); setNotice(branch.isActive ? 'Branch paused.' : 'Branch reopened.'); await refresh(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setUpdatingId(''); }
  };
  const toggleDoctor = async (doctor, field) => {
    setUpdatingId(doctor._id); setError('');
    try { await api.patch(`/admin/doctors/${doctor._id}`, { [field]: !doctor[field] }); setNotice(field === 'isAvailable' ? (doctor.isAvailable ? 'Clinician marked unavailable.' : 'Clinician marked available.') : (doctor.isActive ? 'Clinician deactivated.' : 'Clinician reactivated.')); await refresh(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setUpdatingId(''); }
  };
  const updateAppointment = async (appointment, status) => {
    setUpdatingId(appointment._id); setError('');
    try { await api.patch(`/appointments/${appointment._id}/status`, { status }); setNotice(`Request ${appointment.referenceCode} marked ${status}.`); await refresh(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setUpdatingId(''); }
  };
  const toggleConversation = async (appointment) => {
    if (conversationId === appointment._id) { setConversationId(''); return; }
    setConversationId(appointment._id);
    if (appointment.unreadCount) {
      try { await api.post(`/appointments/${appointment._id}/read`); await refresh(); }
      catch (requestError) { setError(getErrorMessage(requestError)); }
    }
  };

  const counts = overview?.appointments?.byStatus || {};
  const maxRegionCount = Math.max(1, ...(overview?.regions || []).map((region) => region.count));

  return <div className="admin-app">
    <aside className="admin-rail">
      <a className="admin-brand" href="/"><span><Activity size={21}/></span><strong>care<span>slot</span></strong></a>
      <div className="admin-rail-label">WORKSPACE</div>
      <nav className="admin-nav" aria-label="Admin sections">{navItems.map(([key, label, Icon]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setError(''); setNotice(''); }}><Icon size={17}/><span>{label}</span>{key === 'alerts' && <i className="admin-nav-pulse"/>}</button>)}</nav>
      <div className="admin-rail-spacer"/>
      <a className="admin-rail-link" href="/"><ArrowUpRight size={15}/> Patient website</a>
      <a className="admin-rail-link" href="/visits"><CalendarDays size={15}/> Patient portal</a>
      <div className="admin-account"><span>{user.name?.slice(0, 1).toUpperCase() || 'A'}</span><div><strong>{user.name}</strong><small>Administrator</small></div><button aria-label="Sign out" onClick={onSignOut}><LogOut size={16}/></button></div>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar"><div><span>CARESLOT / ADMIN</span><strong>{navItems.find(([key]) => key === tab)?.[1]}</strong></div><div className="admin-top-actions"><span className="admin-live-indicator"><i/> {health.appointments === 'online' && health.directory === 'online' ? 'Services online' : 'Checking services'}</span><button className="admin-refresh" onClick={refresh} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/> Refresh</button><a href="/" className="admin-home-link">Home <ArrowUpRight size={14}/></a></div></header>

      <section className="admin-content">
        <div className="admin-welcome"><div><small>CARESLOT CONTROL CENTER</small><h1>{tab === 'overview' ? <>Good day, {user.name?.split(' ')[0] || 'Admin'}<span>.</span></> : <>{navItems.find(([key]) => key === tab)?.[1]}<span>.</span></>}</h1><p>{tab === 'overview' ? 'A clear view of clinic activity across every connected branch.' : `Manage CareSlot ${navItems.find(([key]) => key === tab)?.[1].toLowerCase()} from one workspace.`}</p></div><div className="admin-welcome-orb"><Activity size={27}/></div></div>
        {error && <div className="admin-flash error" role="alert"><AlertTriangle size={16}/>{error}</div>}
        {notice && <div className="admin-flash success" role="status"><Check size={16}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14}/></button></div>}

        {tab === 'overview' && <>
          <div className="admin-metric-grid">
            <Metric icon={CalendarDays} label="ALL APPOINTMENTS" value={overview?.appointments?.total ?? '—'} hint={`${counts.requested || 0} awaiting review`} tone="blue"/>
            <Metric icon={Building2} label="ACTIVE BRANCHES" value={overview?.directory?.activeBranches ?? '—'} hint={`${overview?.directory?.branches ?? '—'} branches in directory`} tone="cyan"/>
            <Metric icon={Stethoscope} label="AVAILABLE CLINICIANS" value={overview?.directory?.availableClinicians ?? '—'} hint={`${overview?.directory?.clinicians ?? '—'} clinician profiles`} tone="violet"/>
            <Metric icon={Clock3} label="NEEDS ATTENTION" value={counts.requested ?? '—'} hint="Appointment requests awaiting confirmation" tone="amber"/>
          </div>

          <div className="admin-overview-grid">
            <section className="admin-card admin-chart-card"><div className="admin-card-heading"><div><small>REGIONAL ACTIVITY</small><h2>Appointments by city</h2></div><MapPin size={18}/></div>
              {(overview?.regions || []).length ? <div className="admin-bars">{overview.regions.map(({ region, count }) => <div className="admin-bar-row" key={region}><span>{region}</span><div><i style={{ width: `${Math.max(5, (count / maxRegionCount) * 100)}%` }}/></div><strong>{count}</strong></div>)}</div> : <div className="admin-empty-chart">Appointment activity will appear here as requests arrive.</div>}
              <div className="admin-status-summary"><span><i className="dot-requested"/>{counts.requested || 0} requested</span><span><i className="dot-confirmed"/>{counts.confirmed || 0} confirmed</span><span><i className="dot-completed"/>{counts.completed || 0} completed</span></div>
            </section>
            <section className="admin-card admin-activity-card"><div className="admin-card-heading"><div><small>LATEST UPDATES</small><h2>Recent activity</h2></div><Activity size={18}/></div>
              {(overview?.recentActivity || []).length ? <div className="admin-activity-list">{overview.recentActivity.slice(0, 6).map((item) => <div className="admin-activity-item" key={item._id}><span><CalendarDays size={14}/></span><div><strong>{item.referenceCode}</strong><small>{item.specialty} · {item.region} · {formatDate(item.createdAt)}</small></div><StatusPill status={item.status}/></div>)}</div> : <div className="admin-empty-chart">No appointment updates yet.</div>}
              <button className="admin-text-action" onClick={() => setTab('appointments')}>Open appointment queue <ChevronRight size={15}/></button>
            </section>
          </div>

          <section className="admin-card admin-health-card"><div className="admin-card-heading"><div><small>PLATFORM STATUS</small><h2>Connected services</h2></div><ShieldCheck size={18}/></div><div className="admin-health-grid">{[['Appointment service', health.appointments], ['Clinic directory service', health.directory]].map(([label, state]) => <div className="admin-health-item" key={label}><span className={`health-dot ${state}`}/><div><strong>{label}</strong><small>{state === 'online' ? 'API and database are responding' : state === 'offline' ? 'Could not reach this service' : 'Checking connection'}</small></div><b className={state}>{state}</b></div>)}</div></section>
        </>}

        {tab === 'branches' && <section className="admin-card admin-directory-card"><div className="admin-card-heading directory-heading"><div><small>CLINIC DIRECTORY</small><h2>CareSlot branches <span>{branches.length}</span></h2></div><button className="button button-primary" onClick={() => { setBranchEditor('new'); setBranchForm(blankBranch); }}><Plus size={16}/> Add branch</button></div>
          <div className="admin-list-tools"><label className="admin-search"><Search size={16}/><input value={branchQuery} onChange={(event) => setBranchQuery(event.target.value)} placeholder="Search city, area or branch"/></label><span>{filteredBranches.length} results</span></div>
          {branchEditor && <form className="admin-editor" onSubmit={saveBranch}><div className="admin-editor-title"><div><small>{branchEditor === 'new' ? 'NEW LOCATION' : 'EDIT LOCATION'}</small><h3>{branchEditor === 'new' ? 'Add a clinic branch' : 'Update branch details'}</h3></div><button type="button" onClick={resetBranchEditor} aria-label="Close editor"><X size={18}/></button></div><div className="admin-form-grid"><label>Branch name<input value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="CareSlot Clinic — Area Branch"/></label><label>City / district<select value={branchForm.region} onChange={(e) => setBranchForm({ ...branchForm, region: e.target.value })}>{regions.map((region) => <option key={region}>{region}</option>)}</select></label><label>Locality<input required value={branchForm.locality} onChange={(e) => setBranchForm({ ...branchForm, locality: e.target.value })}/></label><label>Address<input required value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}/></label><label>Contact phone<input required value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}/></label><label>Emergency phone<input value={branchForm.emergencyPhone} onChange={(e) => setBranchForm({ ...branchForm, emergencyPhone: e.target.value })}/></label><label>Opening hours <span>(shown in the patient assistant)</span><input maxLength="240" value={branchForm.openingHours} onChange={(e) => setBranchForm({ ...branchForm, openingHours: e.target.value })} placeholder="e.g. Mon–Sat, 9:00 AM–6:00 PM"/></label></div><div className="admin-service-checks"><strong>Specialties at this branch</strong><div>{specialties.map((specialty) => <label key={specialty}><input type="checkbox" checked={branchForm.services.includes(specialty)} onChange={(event) => setBranchForm({ ...branchForm, services: event.target.checked ? [...branchForm.services, specialty] : branchForm.services.filter((item) => item !== specialty) })}/>{specialty}</label>)}</div></div><div className="admin-editor-actions"><button type="button" className="button button-outline" onClick={resetBranchEditor}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : branchEditor === 'new' ? 'Create branch' : 'Save changes'}</button></div></form>}
          <div className="admin-branch-grid">{filteredBranches.map((branch) => <article className={`admin-branch-card ${!branch.isActive ? 'is-inactive' : ''}`} key={branch._id}><div className="admin-branch-card-top"><span><Building2 size={19}/></span><StatusPill status={branch.isActive ? 'Active' : 'Paused'}/></div><small>{branch.branchCode}</small><h3>{branch.name}</h3><p><MapPin size={14}/>{branch.locality}, {branch.region}</p><div className="admin-branch-specialties">{(branch.services || []).slice(0, 4).map((item) => <span key={item}>{item}</span>)}{branch.services?.length > 4 && <span>+{branch.services.length - 4}</span>}</div><div className="admin-branch-actions"><button onClick={() => startBranchEdit(branch)}>Edit details <ArrowUpRight size={13}/></button><button disabled={updatingId === branch._id} onClick={() => toggleBranch(branch)}>{branch.isActive ? 'Pause branch' : 'Reopen branch'}</button></div></article>)}</div>
          {!filteredBranches.length && <div className="admin-empty-state"><Building2 size={25}/><strong>No branches match that search.</strong><span>Try another city or locality.</span></div>}
        </section>}

        {tab === 'doctors' && <section className="admin-card admin-directory-card"><div className="admin-card-heading directory-heading"><div><small>CLINICIAN DIRECTORY</small><h2>Doctors and availability <span>{doctors.length}</span></h2></div><button className="button button-primary" onClick={() => { setDoctorEditor('new'); setDoctorForm({ ...blankDoctor, hospitalId: branches.find((branch) => branch.isActive)?._id || '' }); }}><Plus size={16}/> Add doctor</button></div>
          <div className="admin-list-tools"><label className="admin-search"><Search size={16}/><input value={doctorQuery} onChange={(e) => setDoctorQuery(e.target.value)} placeholder="Search doctor or specialty"/></label><select value={doctorBranch} onChange={(e) => setDoctorBranch(e.target.value)}><option value="all">All branches</option>{branches.map((branch) => <option value={branch._id} key={branch._id}>{branch.locality} · {branch.region}</option>)}</select><span>{filteredDoctors.length} results</span></div>
          {doctorEditor && <form className="admin-editor" onSubmit={saveDoctor}><div className="admin-editor-title"><div><small>{doctorEditor === 'new' ? 'NEW CLINICIAN' : 'EDIT CLINICIAN'}</small><h3>{doctorEditor === 'new' ? 'Add a doctor' : 'Update clinician details'}</h3></div><button type="button" onClick={resetDoctorEditor} aria-label="Close editor"><X size={18}/></button></div><div className="admin-form-grid"><label>Doctor name<input required value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}/></label><label>Clinic branch<select required value={doctorForm.hospitalId} onChange={(e) => setDoctorForm({ ...doctorForm, hospitalId: e.target.value })}><option value="">Choose a branch</option>{branches.filter((branch) => branch.isActive).map((branch) => <option value={branch._id} key={branch._id}>{branch.locality} · {branch.region}</option>)}</select></label><label>Specialty<select value={doctorForm.specialty} onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}>{specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}</select></label><label>Years of experience<input type="number" min="0" max="60" value={doctorForm.experienceYears} onChange={(e) => setDoctorForm({ ...doctorForm, experienceYears: Number(e.target.value) })}/></label><label>Portrait image URL <span>(optional)</span><input type="url" value={doctorForm.imageUrl} onChange={(e) => setDoctorForm({ ...doctorForm, imageUrl: e.target.value })} placeholder="https://…"/></label><label>Consultation fee<input type="number" min="0" value={doctorForm.consultationFee} onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: Number(e.target.value) })}/></label></div><div className="admin-service-checks"><strong>Available days</strong><div>{weekdays.map((day) => <label key={day}><input type="checkbox" checked={doctorForm.availableDays.includes(day)} onChange={(event) => setDoctorForm({ ...doctorForm, availableDays: event.target.checked ? [...doctorForm.availableDays, day] : doctorForm.availableDays.filter((item) => item !== day) })}/>{day}</label>)}</div></div><div className="admin-editor-actions"><button type="button" className="button button-outline" onClick={resetDoctorEditor}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : doctorEditor === 'new' ? 'Add doctor' : 'Save changes'}</button></div></form>}
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Clinician</th><th>Specialty</th><th>Branch</th><th>Schedule</th><th>Availability</th><th>Actions</th></tr></thead><tbody>{filteredDoctors.slice(0, 60).map((doctor) => <tr key={doctor._id}><td><div className="admin-doctor-cell"><img src={doctor.imageUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt=""/><span><strong>{doctorDisplayName(doctor)}</strong><small>{doctor.experienceYears || 0} years experience</small></span></div></td><td>{doctor.specialty}</td><td>{doctor.hospital?.locality || '—'}<small className="admin-table-sub">{doctor.hospital?.region || ''}</small></td><td>{doctor.availableDays?.length ? `${doctor.availableDays.slice(0, 3).join(', ')}${doctor.availableDays.length > 3 ? '…' : ''}` : 'Not set'}</td><td><StatusPill status={!doctor.isActive ? 'Inactive' : doctor.isAvailable ? 'Available' : 'Unavailable'}/></td><td><div className="admin-row-actions"><button title="Edit doctor" onClick={() => startDoctorEdit(doctor)}>Edit</button><button disabled={updatingId === doctor._id || !doctor.isActive} onClick={() => toggleDoctor(doctor, 'isAvailable')}>{doctor.isAvailable ? 'Mark away' : 'Set available'}</button></div></td></tr>)}</tbody></table></div>
          {filteredDoctors.length > 60 && <div className="admin-table-note">Showing the first 60 matching doctors. Filter by branch or specialty to narrow the list.</div>}
          {!filteredDoctors.length && <div className="admin-empty-state"><Stethoscope size={25}/><strong>No clinicians match those filters.</strong><span>Try another branch or add a doctor.</span></div>}
        </section>}

        {tab === 'appointments' && <section className="admin-card admin-directory-card"><div className="admin-card-heading directory-heading"><div><small>ALL CLINIC LOCATIONS</small><h2>Appointment requests <span>{filteredAppointments.length}</span></h2></div><div className="admin-filter-pair"><select value={appointmentRegion} onChange={(e) => setAppointmentRegion(e.target.value)}><option value="all">All cities</option>{regions.filter((region) => region !== 'Other').map((region) => <option key={region}>{region}</option>)}</select><select value={appointmentStatus} onChange={(e) => setAppointmentStatus(e.target.value)}><option value="all">All statuses</option>{['requested', 'confirmed', 'completed', 'cancelled'].map((status) => <option key={status}>{status}</option>)}</select></div></div>
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Patient request</th><th>City / branch</th><th>Specialty</th><th>Requested time</th><th>Status</th><th>Update</th><th>Conversation</th></tr></thead><tbody>{filteredAppointments.map((appointment) => <Fragment key={appointment._id}><tr><td><div className="admin-appointment-cell"><strong>{appointment.patientName}</strong><small>{appointment.referenceCode}</small></div></td><td>{appointment.region}<small className="admin-table-sub">{appointment.hospital?.locality || appointment.hospital?.name || 'Clinic'}</small></td><td>{appointment.specialty}<small className="admin-table-sub">{appointment.doctor?.name || 'Any available doctor'}</small></td><td>{formatDate(appointment.appointmentAt)}</td><td><StatusPill status={appointment.status}/></td><td>{appointment.status === 'requested' ? <div className="admin-row-actions"><button disabled={updatingId === appointment._id} onClick={() => updateAppointment(appointment, 'confirmed')}>Confirm</button><button disabled={updatingId === appointment._id} onClick={() => updateAppointment(appointment, 'cancelled')}>Cancel</button></div> : appointment.status === 'confirmed' ? <button className="admin-action-link" disabled={updatingId === appointment._id} onClick={() => updateAppointment(appointment, 'completed')}>Mark complete</button> : '—'}</td><td><button className="admin-action-link" onClick={() => toggleConversation(appointment)}>{conversationId === appointment._id ? 'Hide' : `Messages${appointment.messages?.length ? ` (${appointment.messages.length})` : ''}`}{appointment.unreadCount > 0 && <b className="admin-unread-pill">{appointment.unreadCount} new</b>}</button></td></tr>{conversationId === appointment._id && <tr><td colSpan="7"><AppointmentConversation appointment={appointment} user={user} onChange={refresh}/></td></tr>}</Fragment>)}</tbody></table></div>
          {!filteredAppointments.length && <div className="admin-empty-state"><CalendarDays size={25}/><strong>No requests match those filters.</strong><span>New requests will appear here.</span></div>}
        </section>}

        {tab === 'alerts' && <EmergencyInbox/>}
        {tab === 'support' && <SupportInbox/>}
        <footer className="admin-footer"><span><ShieldCheck size={14}/> Administrator actions are recorded by CareSlot services.</span><span>Use verified clinic data before launch.</span></footer>
      </section>
    </main>
  </div>;
}
