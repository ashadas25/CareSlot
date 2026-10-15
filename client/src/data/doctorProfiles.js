// Fictional sample profiles and generated stock portraits.
// These are UI examples only; they do not represent verified clinicians.
const portrait = (group, number) => `https://randomuser.me/api/portraits/${group}/${number}.jpg`;

export const doctorProfilesBySpecialty = {
  'General care': [
    { name: 'Dr. Asha Raman', imageUrl: portrait('women', 44) },
    { name: 'Dr. Rishi Kumar', imageUrl: portrait('men', 32) },
    { name: 'Dr. Kavya Menon', imageUrl: portrait('women', 68) }
  ],
  Cardiology: [
    { name: 'Dr. Kavin Shah', imageUrl: portrait('men', 46) },
    { name: 'Dr. Nandita Rao', imageUrl: portrait('women', 65) },
    { name: 'Dr. Arvind Nair', imageUrl: portrait('men', 75) }
  ],
  Pediatrics: [
    { name: 'Dr. Meera Iyer', imageUrl: portrait('women', 33) },
    { name: 'Dr. Aditya Bose', imageUrl: portrait('men', 52) },
    { name: 'Dr. Pooja Das', imageUrl: portrait('women', 26) }
  ],
  Orthopedics: [
    { name: 'Dr. Nila Thomas', imageUrl: portrait('women', 49) },
    { name: 'Dr. Rahul Dev', imageUrl: portrait('men', 11) },
    { name: 'Dr. Sana Mathew', imageUrl: portrait('women', 12) }
  ],
  Dermatology: [
    { name: 'Dr. Arjun Menon', imageUrl: portrait('men', 22) },
    { name: 'Dr. Isha Kapoor', imageUrl: portrait('women', 21) },
    { name: 'Dr. Neil Joseph', imageUrl: portrait('men', 15) }
  ],
  Neurology: [
    { name: 'Dr. Divya Rao', imageUrl: portrait('women', 50) },
    { name: 'Dr. Varun Sen', imageUrl: portrait('men', 41) },
    { name: 'Dr. Anjali Pillai', imageUrl: portrait('women', 17) }
  ],
  ENT: [
    { name: 'Dr. Rohan Das', imageUrl: portrait('men', 64) },
    { name: 'Dr. Priya Nair', imageUrl: portrait('women', 57) },
    { name: 'Dr. Sameer Ali', imageUrl: portrait('men', 55) }
  ],
  Ophthalmology: [
    { name: 'Dr. Leela Kumar', imageUrl: portrait('women', 39) },
    { name: 'Dr. Siddharth Rao', imageUrl: portrait('men', 62) },
    { name: 'Dr. Tara George', imageUrl: portrait('women', 29) }
  ],
  Gynecology: [
    { name: 'Dr. Vikram Nair', imageUrl: portrait('men', 67) },
    { name: 'Dr. Ananya Bose', imageUrl: portrait('women', 63) },
    { name: 'Dr. Farah Khan', imageUrl: portrait('women', 56) }
  ],
  Dentistry: [
    { name: 'Dr. Sana Joseph', imageUrl: portrait('women', 36) },
    { name: 'Dr. Imran Patel', imageUrl: portrait('men', 78) },
    { name: 'Dr. Mira Krishnan', imageUrl: portrait('women', 25) }
  ]
};

export const getSampleDoctorProfile = (specialty, index = 0) => {
  const profiles = doctorProfilesBySpecialty[specialty] || [];
  return profiles[index % Math.max(profiles.length, 1)] || null;
};
