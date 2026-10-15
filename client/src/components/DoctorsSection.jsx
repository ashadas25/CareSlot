import { ArrowRight, ArrowUpRight, Info, Stethoscope } from 'lucide-react';
import { doctors } from '../data/sampleData.js';

export default function DoctorsSection({ onBook }) {
  return <section className="section doctors-section" id="doctors"><div className="section-heading"><div><div className="eyebrow eyebrow-dark">GOOD CARE STARTS WITH TRUST</div><h2>Meet people who<br/><span>listen first.</span></h2></div><p>Get to know the care team before you meet. Browse specialties and find a doctor who feels right for you.</p></div>
    <div className="doctor-grid">{doctors.map((doctor, index) => <article className="doctor-profile" key={doctor.name}><div className="doctor-photo"><img src={doctor.imageUrl} alt={`Illustrative portrait for ${doctor.name}, ${doctor.specialty}`} loading="lazy"/><span className="doctor-availability"><i/>Illustrative profile</span><span className="doctor-photo-index">0{index + 1}</span><strong className="doctor-name-overlay">{doctor.name}</strong></div><div className="doctor-info"><div className="doctor-specialty"><Stethoscope size={14}/>{doctor.specialty}</div><h3>{doctor.name}</h3><p>Sample profile · {doctor.experienceYears} years' sample experience</p><button onClick={() => onBook(doctor.specialty)}>Check branch availability <ArrowRight size={15}/></button><Info className="doctor-verified" size={19}/></div></article>)}</div>
    <div className="doctors-note"><div className="note-symbol">✳</div><span>Care is personal.<br/><strong>Make the choice that feels right for you.</strong></span><button onClick={() => onBook()}>Find a doctor <ArrowUpRight size={15}/></button></div>
  </section>;
}
