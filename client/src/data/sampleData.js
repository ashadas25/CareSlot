const sampleBranchLocations = [
  ['Coimbatore', ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Saibaba Colony', 'Singanallur']],
  ['Chennai', ['Anna Nagar', 'Adyar', 'Velachery', 'T. Nagar', 'Tambaram', 'Mylapore', 'Porur', 'Guindy', 'Perambur', 'OMR']],
  ['Madurai', ['Anna Nagar', 'Tallakulam', 'KK Nagar', 'Thiruparankundram', 'Goripalayam']],
  ['Tiruchirappalli', ['Thillai Nagar', 'Srirangam', 'Cantonment', 'Woraiyur', 'K. K. Nagar', 'Tennur', 'Thiruverumbur', 'Palakarai', 'Edamalaipatti Pudur', 'Bharathidasan Salai']],
  ['Salem', ['Fairlands', 'Alagapuram', 'Hasthampatti', 'Ammapet', 'Suramangalam']]
];

const sampleSlug = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const specialties = [
  'General care',
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Neurology',
  'ENT',
  'Ophthalmology',
  'Gynecology',
  'Dentistry'
];

export const sampleHospitals = sampleBranchLocations.flatMap(([region, localities]) =>
  localities.map((locality) => ({
    _id: `sample-${sampleSlug(region)}-${sampleSlug(locality)}`,
    name: `CareSlot Clinic — ${locality} Branch`,
    region,
    locality,
    branchCode: `CS-${sampleSlug(region).slice(0, 3).toUpperCase()}-${sampleSlug(locality).slice(0, 5).toUpperCase()}`,
    address: `${locality}, ${region}, Tamil Nadu (fictional sample address)`,
    phone: '+91 00000 00000',
    services: specialties
  }))
);

export const services = [
  {
    title: 'Heart & circulation',
    specialty: 'Cardiology',
    icon: 'heart',
    image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Cardiology clinician reviewing a heart scan',
    note: 'Thoughtful care for your heart health'
  },
  {
    title: 'Family & children',
    specialty: 'Pediatrics',
    icon: 'baby',
    image: 'https://images.unsplash.com/photo-1632053002928-bf8e6f70174c?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Pediatric clinician caring for a young patient',
    note: 'Care that grows with your family'
  },
  {
    title: 'Bones & movement',
    specialty: 'Orthopedics',
    icon: 'bone',
    image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Orthopedic clinician discussing mobility care',
    note: 'Get back to what moves you'
  },
  {
    title: 'Skin & wellbeing',
    specialty: 'Dermatology',
    icon: 'sparkles',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Dermatology clinician in a bright clinic',
    note: 'Expert support for healthy skin'
  },
  {
    title: 'Brain & nerves',
    specialty: 'Neurology',
    icon: 'brain',
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Neurology clinician reviewing a brain scan',
    note: 'Specialist support for your nervous system'
  },
  {
    title: 'Ear, nose & throat',
    specialty: 'ENT',
    icon: 'ear',
    image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'ENT clinician speaking with a patient',
    note: 'Help with hearing, breathing and voice'
  },
  {
    title: 'Vision & eye care',
    specialty: 'Ophthalmology',
    icon: 'eye',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Eye care clinician helping a patient with vision',
    note: 'Clear, comfortable vision care'
  },
  {
    title: 'Women’s health',
    specialty: 'Gynecology',
    icon: 'women',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Women’s health clinician in a consultation room',
    note: 'Respectful support at every life stage'
  },
  {
    title: 'Dental care',
    specialty: 'Dentistry',
    icon: 'smile',
    image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Dental clinician providing a checkup',
    note: 'Healthy smiles start with a visit'
  },
  {
    title: 'Everyday health',
    specialty: 'General care',
    icon: 'doctor',
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'General care clinician talking with a patient',
    note: 'A helpful first step for your health'
  }
];

export const doctors = Object.entries(doctorProfilesBySpecialty).map(([specialty, profiles]) => ({
  ...profiles[0],
  specialty,
  experienceYears: 6,
  qualifications: ['MBBS', 'MD']
}));
import { doctorProfilesBySpecialty } from './doctorProfiles.js';

