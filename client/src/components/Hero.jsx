import { ArrowDown, ArrowUpRight, Info, MapPin, Search, ShieldPlus, Stethoscope } from 'lucide-react';

export default function Hero({ onBook, onRegion }) {
  return <section className="hero" id="home"><div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/>
    <div className="hero-grid">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-pulse"/> A BETTER WAY TO FIND CARE <span className="eyebrow-line"/></div>
        <h1>Care that fits<br/>your <span>life.</span></h1>
        <p className="hero-lead">The right doctor, at the right place, at a time that works for you. Your next step to feeling better starts here.</p>
        <div className="hero-buttons"><button className="button button-primary" onClick={onBook}>Find your doctor <ArrowUpRight size={17}/></button><a className="text-link" href="/how-it-works">How it works <ArrowDown size={15}/></a></div>
        <div className="trust-row"><div className="trust-avatars"><img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Illustrative clinician portrait"/><img src="https://randomuser.me/api/portraits/men/46.jpg" alt="Illustrative clinician portrait"/><img src="https://randomuser.me/api/portraits/women/33.jpg" alt="Illustrative clinician portrait"/></div><div><strong>Care begins with connection</strong><span>Illustrative clinician profiles.</span></div><Info size={20} className="trust-check"/></div>
      </div>
      <div className="hero-visual"><img className="hero-photo" src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1400&q=90" alt="A doctor speaking with a patient in a bright clinic"/><div className="hero-photo-overlay"/>
        <div className="floating-card location-card"><div className="float-icon"><MapPin size={18}/></div><div><small>CARE CLOSE TO HOME</small><strong>Choose your city</strong><button onClick={onRegion}>Explore regions <ArrowUpRight size={13}/></button></div></div>
        <div className="floating-card doctor-card"><div className="doctor-mini"><img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Illustrative clinician portrait"/><i/></div><div><small>YOUR CARE, YOUR CHOICE</small><strong>Meet your care team</strong><span>Illustrative profiles</span></div><Stethoscope className="doctor-card-mark" size={22}/></div>
        <div className="photo-caption"><span>01</span><i/>CARE, CLOSER TO YOU</div>
        <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><span className="hero-cross cross-one">✳</span><span className="hero-cross cross-two">✳</span>
      </div>
    </div>
    <div className="hero-bottom"><div className="hero-bottom-note"><ShieldPlus size={17}/><span>Your health journey stays in your hands.</span></div><div className="hero-bottom-links"><a href="/services">Explore specialties <ArrowDown size={13}/></a><a href="/how-it-works#emergency">Need urgent help? <ArrowUpRight size={13}/></a></div></div>
  </section>;
}
