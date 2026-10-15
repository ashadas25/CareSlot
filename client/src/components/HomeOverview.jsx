import { ArrowUpRight, Building2, CalendarHeart, ShieldCheck, Stethoscope } from 'lucide-react';

const destinations = [
  { href: '/services', icon: Stethoscope, label: 'Find a specialty', title: 'Start with the care you need', text: 'Explore specialties, choose your city and compare CareSlot branches before requesting a visit.', accent: 'blue' },
  { href: '/doctors', icon: CalendarHeart, label: 'Meet the clinicians', title: 'Find a doctor who fits', text: 'Review clinician specialties and profiles. Doctor choices depend on your selected branch and date.', accent: 'cyan' },
  { href: '/how-it-works', icon: Building2, label: 'Your next steps', title: 'Know what happens next', text: 'See how a request reaches your chosen branch, what confirmation means and where to go for urgent help.', accent: 'violet' }
];

export default function HomeOverview() {
  return <section className="home-overview"><div className="home-overview-heading"><div><div className="eyebrow eyebrow-dark">A SIMPLE PLACE TO START</div><h2>CareSlot brings your next step<br/><span>closer to home.</span></h2></div><p>Tell us where you need care and what kind of appointment you are looking for. Explore specialties, choose a nearby branch and request a suitable time. The branch team reviews your request and contacts you to confirm availability.</p></div>
    <div className="home-destination-grid">{destinations.map(({ href, icon: Icon, label, title, text, accent }, index) => <a className={`home-destination ${accent}`} href={href} key={href}><span className="home-destination-icon"><Icon size={20}/></span><small>0{index + 1} · {label}</small><strong>{title}</strong><p>{text}</p><span className="home-destination-link">Explore <ArrowUpRight size={15}/></span><i className="home-destination-glow"/></a>)}</div>
    <div className="home-next-steps"><div><span>01</span><strong>Choose a location</strong><p>Select a city and the clinic branch that is convenient for you.</p></div><div><span>02</span><strong>Make your request</strong><p>Choose a specialty, date and a specific doctor or any available doctor.</p></div><div><span>03</span><strong>Wait for confirmation</strong><p>Your request is pending until the selected branch contacts you.</p></div></div>
    <div className="home-trust-band"><span><ShieldCheck size={17}/></span><div><strong>Your request goes to the branch you choose.</strong><small>CareSlot is an appointment coordination project. It does not provide medical diagnosis or emergency dispatch. For immediate danger in India, call 112.</small></div><a href="/how-it-works#emergency">Urgent help <ArrowUpRight size={14}/></a></div>
  </section>;
}
