import { ArrowUpRight, CalendarDays, Check, MapPinned, UserRoundSearch } from 'lucide-react';
const steps = [
  { icon: MapPinned, number: '01', title: 'Choose your region', text: 'Find a participating hospital in a city that works for you.' },
  { icon: UserRoundSearch, number: '02', title: 'Find your specialist', text: 'Explore care options and request the doctor you prefer.' },
  { icon: CalendarDays, number: '03', title: 'Pick a time', text: 'Send a visit request. The hospital team will confirm it with you.' }
];
export default function HowItWorks({ onBook }) {
  return <section className="how-section" id="how-it-works"><div className="how-decoration deco-a">✳</div><div className="how-decoration deco-b">✳</div><div className="how-inner"><div className="how-intro"><div className="eyebrow">THREE STEPS TO YOUR NEXT VISIT</div><h2>Simple steps.<br/><span>More peace of mind.</span></h2><p>We take the busywork out of booking so you can focus on what matters: feeling your best.</p><button className="button button-light" onClick={() => onBook()}>Get started <ArrowUpRight size={16}/></button></div><div className="steps-list">{steps.map(({ icon: Icon, number, title, text }) => <div className="step-item" key={number}><div className="step-symbol"><Icon size={20}/></div><div><small>STEP {number}</small><h3>{title}</h3><p>{text}</p></div><span className="step-check"><Check size={15}/></span></div>)}</div></div><div className="how-bottom"><span><i/> Simple to use, wherever you are</span><span>THE CARESLOT PROMISE <b>✳</b></span></div></section>;
}
