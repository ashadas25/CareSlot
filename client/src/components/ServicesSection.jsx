import { Activity, ArrowUpRight, Baby, Bone, Brain, Ear, Eye, HeartHandshake, HeartPulse, Smile, Sparkles, Stethoscope } from 'lucide-react';
import { services } from '../data/sampleData.js';

const icons = {
  heart: HeartPulse,
  baby: Baby,
  bone: Bone,
  sparkles: Sparkles,
  doctor: Stethoscope,
  activity: Activity,
  brain: Brain,
  ear: Ear,
  eye: Eye,
  women: HeartHandshake,
  smile: Smile
};

export default function ServicesSection({ onBook }) {
  return (
    <section className="section services-section" id="services">
      <div className="section-heading">
        <div>
          <div className="eyebrow eyebrow-dark">CARE THAT MEETS YOU HERE</div>
          <h2>Explore what you<br /><span>need today.</span></h2>
        </div>
        <p>From everyday questions to specialist care, start with the support that feels right for you.</p>
      </div>

      <div className="service-grid">
        {services.map((service, index) => {
          const Icon = icons[service.icon] || Stethoscope;

          return (
            <button
              key={service.specialty}
              className={`service-card service-card-${index + 1}`}
              onClick={() => onBook(service.specialty)}
            >
              <img src={service.image} alt={service.imageAlt || `${service.title} service`} loading="lazy" />
              <div className="service-image-shade" />
              <span className="service-icon"><Icon size={20} /></span>
              <span className="service-number">
                {String(index + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')}
              </span>
              <div className="service-card-copy">
                <small>{service.note}</small>
                <strong>{service.title}</strong>
                <span className="service-link">Explore care <ArrowUpRight size={14} /></span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="service-footnote">
        <span className="blue-dot" />
        More specialties are available at participating branches.
        <button onClick={() => onBook()}>
          Browse all care <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  );
}
