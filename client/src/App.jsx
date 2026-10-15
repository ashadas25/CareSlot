import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import HomeOverview from './components/HomeOverview.jsx';
import ServicesSection from './components/ServicesSection.jsx';
import DoctorsSection from './components/DoctorsSection.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import EmergencyBanner from './components/EmergencyBanner.jsx';
import Footer from './components/Footer.jsx';
import BookingModal from './components/BookingModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import HelpWidget from './components/HelpWidget.jsx';
import HelpCenter from './pages/HelpCenter.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import StaffDashboard from './pages/StaffDashboard.jsx';
import MyAppointments from './pages/MyAppointments.jsx';
import { api } from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem('careslot_token'));
  const [authOpen, setAuthOpen] = useState(false);
  const [authAudience, setAuthAudience] = useState('patient');
  const [booking, setBooking] = useState(null);
  const page = window.location.pathname.replace(/\/$/, '') || '/';

  useEffect(() => {
    const token = localStorage.getItem('careslot_token');
    if (!token) { setAuthReady(true); return; }
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => localStorage.removeItem('careslot_token')).finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) { if (page !== '/signin') window.location.replace('/signin'); return; }
    if (page === '/signin') { window.location.replace(user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/'); return; }
    if (page === '/admin' && user.role !== 'admin') window.location.replace(user.role === 'staff' ? '/staff' : '/');
    if (page === '/staff' && user.role === 'patient') window.location.replace('/');
  }, [authReady, page, user]);

  const signOut = () => {
    localStorage.removeItem('careslot_token');
    setUser(null);
    window.location.href = '/signin';
  };
  const showAuth = (audience = 'patient') => { setAuthAudience(audience); setAuthOpen(true); };
  const completeSignIn = (account) => {
    setUser(account);
    const destination = account.role === 'admin' ? '/admin' : account.role === 'staff' ? '/staff' : '/';
    if (account.role !== 'patient' || ['/signin', '/admin', '/staff', '/visits'].includes(page)) window.location.assign(destination);
  };
  const onBook = (specialty = '') => setBooking({ specialty });

  if (!authReady) return <main className="staff-gate"><div className="staff-gate-card">Checking your secure CareSlot sign-in…</div></main>;
  if (!user && page !== '/signin') return <AuthModal audience="choose" standalone onClose={() => {}} onSuccess={completeSignIn}/>;
  if (page === '/signin') return <AuthModal audience="choose" standalone onClose={() => {}} onSuccess={completeSignIn}/>;

  if (['/admin', '/staff'].includes(page) && (!authReady || !user || (page === '/admin' ? user.role !== 'admin' : user.role === 'patient'))) return <main className="staff-gate"><div className="staff-gate-card">Opening your secure CareSlot sign-in…</div></main>;
  if (page === '/admin') return <><AdminDashboard user={user} onSignIn={() => showAuth('admin')} onSignOut={signOut}/>{authOpen && <AuthModal audience={authAudience} onClose={() => setAuthOpen(false)} onSuccess={completeSignIn}/>}</>;
  if (page === '/staff') return <><StaffDashboard user={user} onSignIn={() => showAuth('staff')} onSignOut={signOut}/>{authOpen && <AuthModal audience={authAudience} onClose={() => setAuthOpen(false)} onSuccess={completeSignIn}/>}</>;
  if (page === '/visits') return <><MyAppointments user={user} onBook={() => onBook('')} onSignIn={() => showAuth('patient')} onSignOut={signOut}/>{booking && <BookingModal user={user} initialSpecialty={booking.specialty} onClose={() => setBooking(null)} onSignIn={() => showAuth('patient')}/>}{authOpen && <AuthModal audience={authAudience} onClose={() => setAuthOpen(false)} onSuccess={completeSignIn}/>}</>;

  let pageContent;
  if (page === '/services') pageContent = <ServicesSection onBook={onBook}/>;
  else if (page === '/doctors') pageContent = <DoctorsSection onBook={onBook}/>;
  else if (page === '/how-it-works') pageContent = <><HowItWorks onBook={() => onBook('')}/><EmergencyBanner/></>;
  else if (page === '/help') pageContent = <HelpCenter/>;
  else pageContent = <><Hero onBook={() => onBook('')} onRegion={() => { window.location.href = '/services'; }}/><HomeOverview/></>;

  return <div className="app-shell">
    <Navbar user={user} onSignIn={() => showAuth('patient')} onBook={() => onBook('')} onSignOut={signOut}/>
    <main className="route-content">{pageContent}</main>
    <Footer user={user}/><HelpWidget user={user}/>
    {booking && <BookingModal user={user} initialSpecialty={booking.specialty} onClose={() => setBooking(null)} onSignIn={() => showAuth('patient')}/>}
    {authOpen && <AuthModal audience={authAudience} onClose={() => setAuthOpen(false)} onSuccess={completeSignIn}/>}
  </div>;
}
