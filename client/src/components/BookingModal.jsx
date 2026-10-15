import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  ShieldCheck,
  Stethoscope,
  X
} from 'lucide-react';
import { api, clinicApi, getErrorMessage, isApiUnavailable } from '../services/api.js';
import { doctors as sampleDoctors, sampleHospitals } from '../data/sampleData.js';
import { getSampleDoctorProfile } from '../data/doctorProfiles.js';

const regions = ['Coimbatore', 'Chennai', 'Madurai', 'Tiruchirappalli', 'Salem'];
const fallbackSpecialties = [
  'General care', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology',
  'Neurology', 'ENT', 'Ophthalmology', 'Gynecology', 'Dentistry'
];
const portraitBySpecialty = Object.fromEntries(sampleDoctors.map((doctor) => [doctor.specialty, doctor.imageUrl]));

const indiaInputDate = (date = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export default function BookingModal({
  user,
  initialSpecialty = '',
  initialRegion = '',
  onClose,
  onSignIn
}) {
  const [form, setForm] = useState({
    region: initialRegion || 'Coimbatore',
    hospitalId: '',
    specialty: initialSpecialty || '',
    doctorId: 'any',
    appointmentAt: '',
    patientName: user?.name || '',
    patientEmail: user?.email || '',
    patientPhone: user?.phone || '',
    reason: ''
  });
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [directoryMode, setDirectoryMode] = useState('loading');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  const visibleHospitals = useMemo(
    () => hospitals.filter((hospital) => hospital.region === form.region),
    [hospitals, form.region]
  );

  const selectedHospital = visibleHospitals.find(
    (hospital) => hospital._id === form.hospitalId
  );

  const specialties = selectedHospital?.services?.length
    ? selectedHospital.services
    : fallbackSpecialties;

  useEffect(() => {
    let active = true;

    clinicApi.get('/hospitals')
      .then(({ data }) => {
        if (!active) return;
        setHospitals(data.hospitals);
        setDirectoryMode('live');
      })
      .catch((requestError) => {
        if (!active) return;

        if (isApiUnavailable(requestError)) {
          setHospitals(sampleHospitals);
          setDirectoryMode('sample');
        } else {
          setDirectoryMode('error');
          setError(getErrorMessage(requestError));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const nextHospital =
      visibleHospitals.find((hospital) => hospital._id === form.hospitalId) ||
      visibleHospitals[0];

    setForm((previous) => ({
      ...previous,
      hospitalId: nextHospital?._id || '',
      doctorId: 'any'
    }));
  }, [form.region, hospitals]);

  useEffect(() => {
    if (!form.hospitalId || directoryMode !== 'live') {
      setDoctors([]);
      setDoctorLoading(false);
      return;
    }

    if (!form.specialty || !form.appointmentAt) { setDoctors([]); setDoctorLoading(false); return; }
    const selectedDate = form.appointmentAt ? new Date(`${form.appointmentAt}:00+05:30`) : null;
    const day = selectedDate && !Number.isNaN(selectedDate.valueOf())
      ? new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(selectedDate)
      : undefined;
    let active = true;
    setDoctorLoading(true);
    clinicApi.get('/doctors', {
      params: { hospitalId: form.hospitalId, specialty: form.specialty, day }
    })
      .then(({ data }) => { if (active) setDoctors(data.doctors); })
      .catch(() => { if (active) setDoctors([]); })
      .finally(() => { if (active) setDoctorLoading(false); });
    return () => { active = false; };
  }, [form.hospitalId, form.specialty, form.appointmentAt, directoryMode]);

  const update = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in or create a patient account before booking.');
      return;
    }

    if (directoryMode !== 'live') {
      setError('The sample directory is for preview only. Connect the API and database to book.');
      return;
    }

    setBusy(true);

    try {
      const appointmentAt = new Date(`${form.appointmentAt}:00+05:30`).toISOString();
      const { data } = await api.post('/appointments', { ...form, appointmentAt });
      setSuccess(data.appointment);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const minDate = indiaInputDate();

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="dialog booking-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
      >
        <div className="booking-side">
          <button className="booking-back" onClick={onClose}>
            <ArrowLeft size={15} /> Back to CareSlot
          </button>
          <span className="booking-side-orb orb-a" />
          <span className="booking-side-orb orb-b" />
          <div className="booking-side-content">
            <div className="booking-side-icon"><CalendarDays size={24} /></div>
            <small>YOUR NEXT STEP, MADE SIMPLE</small>
            <h2>Make time<br />for <span>you.</span></h2>
            <p>Your visit request goes to the branch you choose. Its care team will follow up to confirm.</p>
            <div className="booking-step"><i><Check size={13} /></i>Choose a branch and specialty</div>
            <div className="booking-step"><i><Check size={13} /></i>Choose a doctor and time</div>
            <div className="booking-step"><i><Check size={13} /></i>The branch receives your request</div>
          </div>
          <div className="booking-side-foot">
            <ShieldCheck size={15} /> Your information is kept private.
          </div>
        </div>

        <div className="booking-content">
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>

          {success ? (
            <div className="booking-success">
              <div className="success-icon"><Check size={28} /></div>
              <span className="eyebrow eyebrow-dark">REQUEST SENT SUCCESSFULLY</span>
              <h2>You're one step<br />closer to care.</h2>
              <p>{success.hospital?.name} received your request. Its team will contact you to confirm.</p>
              <div className="reference-card">
                <small>YOUR REFERENCE</small>
                <strong>{success.referenceCode}</strong>
                <span>
                  {new Date(success.appointmentAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Kolkata'
                  })} IST
                </span>
              </div>
              <button className="button button-primary" onClick={onClose}>
                Done <Check size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="booking-heading">
                <span className="eyebrow eyebrow-dark">LET’S GET YOU THERE</span>
                <h1 id="booking-title">Request a visit<span>.</span></h1>
                <p>A member of the selected branch will confirm your requested time.</p>
              </div>

              {directoryMode === 'sample' && (
                <div className="sample-banner">
                  <span>SAMPLE DIRECTORY</span>
                  Branch names, clinicians and addresses are fictional examples.
                </div>
              )}

              <form onSubmit={submit} className="booking-form">
                <div className="form-row">
                  <label>
                    District / city
                    <select
                      required
                      value={form.region}
                      onChange={(event) => update('region', event.target.value)}
                    >
                      {regions.map((region) => <option key={region}>{region}</option>)}
                    </select>
                  </label>

                  <label>
                    CareSlot branch
                    <select
                      required
                      disabled={!visibleHospitals.length}
                      value={form.hospitalId}
                      onChange={(event) => update('hospitalId', event.target.value)}
                    >
                      {visibleHospitals.length ? visibleHospitals.map((hospital) => (
                        <option key={hospital._id} value={hospital._id}>
                          {hospital.locality
                            ? `${hospital.locality} — ${hospital.name}`
                            : hospital.name}
                        </option>
                      )) : <option value="">No branches listed</option>}
                    </select>
                  </label>
                </div>

                {selectedHospital && (
                  <div className="selected-hospital">
                    <MapPin size={15} />
                    <span>
                      <strong>
                        {selectedHospital.branchCode
                          ? `${selectedHospital.branchCode} · `
                          : ''}
                        {selectedHospital.locality || selectedHospital.region}
                      </strong>
                      {' — '}{selectedHospital.address}
                      <br />
                      <small>{visibleHospitals.length} branches in {form.region}</small>
                    </span>
                  </div>
                )}

                <label>
                  Specialty
                  <select required value={form.specialty} onChange={(event) => {
                    update('specialty', event.target.value);
                    update('doctorId', 'any');
                  }}>
                    <option value="">Choose a specialty</option>
                    {specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}
                  </select>
                </label>

                <label>
                  Preferred date &amp; time
                  <div className="input-wrap">
                    <Clock3 size={16} />
                    <input
                      type="datetime-local"
                      required
                      min={minDate}
                      value={form.appointmentAt}
                      onChange={(event) => { update('appointmentAt', event.target.value); update('doctorId', 'any'); }}
                    />
                  </div>
                </label>

                <fieldset className="doctor-choice-fieldset" disabled={!form.specialty || !form.appointmentAt || doctorLoading}>
                  <legend>Choose a doctor</legend>
                  <p className="doctor-choice-help">Choose any available doctor or select a specific clinician for this branch, specialty and date.</p>
                  {!form.specialty || !form.appointmentAt ? (
                    <div className="doctor-choice-empty">Select a specialty and appointment date first to see available clinicians.</div>
                  ) : doctorLoading ? (
                    <div className="doctor-choice-empty">Checking clinician availability for your selected date…</div>
                  ) : doctors.length === 0 ? (
                    <div className="doctor-choice-empty">No clinicians are listed for this specialty on that day. Try another date or branch.</div>
                  ) : (
                    <div className="doctor-choice-grid">
                      <label className={`doctor-choice-card doctor-any-card ${form.doctorId === 'any' ? 'is-selected' : ''}`}>
                        <input type="radio" name="doctor-choice" value="any" checked={form.doctorId === 'any'} onChange={() => update('doctorId', 'any')} />
                        <span className="doctor-choice-avatar doctor-any-avatar"><Stethoscope size={22} /></span>
                        <span className="doctor-choice-copy"><strong>Any available doctor</strong><small>Let the care team match you with an available clinician.</small><em>{doctors.length} available on your selected date</em></span>
                      </label>
                      {doctors.map((doctor, index) => {
                        const profile = getSampleDoctorProfile(doctor.specialty, index);
                        const legacyDemoName = /^Dr\. CareSlot Demo \d+$/i.test(doctor.name || '');
                        const doctorName = legacyDemoName && profile ? profile.name : doctor.name;
                        const doctorImage = legacyDemoName && profile ? profile.imageUrl : doctor.imageUrl || profile?.imageUrl || portraitBySpecialty[doctor.specialty];
                        return <label className={`doctor-choice-card ${form.doctorId === doctor._id ? 'is-selected' : ''}`} key={doctor._id}>
                          <input type="radio" name="doctor-choice" value={doctor._id} checked={form.doctorId === doctor._id} onChange={() => update('doctorId', doctor._id)} />
                          <img className="doctor-choice-avatar" src={doctorImage} alt={`Illustrative sample portrait for ${doctorName}, ${doctor.specialty}`} loading="lazy" />
                          <span className="doctor-choice-copy"><strong>{doctorName}</strong><small>{doctor.specialty} · Illustrative sample profile</small><em>Available {doctor.availableDays?.join(', ') || 'on selected date'}</em></span>
                        </label>;
                      })}
                    </div>
                  )}
                </fieldset>

                <div className="form-row">
                  <label>
                    Your name
                    <input
                      required
                      maxLength="100"
                      autoComplete="name"
                      value={form.patientName}
                      onChange={(event) => update('patientName', event.target.value)}
                    />
                  </label>
                  <label>
                    Phone number
                    <input
                      required
                      type="tel"
                      maxLength="20"
                      autoComplete="tel"
                      placeholder="+91 90000 00000"
                      value={form.patientPhone}
                      onChange={(event) => update('patientPhone', event.target.value)}
                    />
                  </label>
                </div>

                <label>
                  Email address
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.patientEmail}
                    onChange={(event) => update('patientEmail', event.target.value)}
                  />
                </label>

                <label>
                  What would you like help with? <span className="optional">(optional)</span>
                  <textarea
                    maxLength="500"
                    rows="3"
                    value={form.reason}
                    onChange={(event) => update('reason', event.target.value)}
                    placeholder="Share a short note for the care team"
                  />
                </label>

                {!user && (
                  <div className="signin-notice">
                    Already have an account? <button type="button" onClick={onSignIn}>Sign in</button> to book.
                  </div>
                )}

                {error && <div className="form-error" role="alert">{error}</div>}

                <button
                  className="button button-primary booking-submit"
                  disabled={busy || directoryMode === 'loading'}
                >
                  {busy ? 'Sending your request…' : 'Send appointment request'}
                  <ArrowRight size={16} />
                </button>

                <small className="booking-disclaimer">
                  <Stethoscope size={13} />
                  This is a request. Your branch will contact you to confirm.
                </small>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
