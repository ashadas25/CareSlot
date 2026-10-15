import dotenv from 'dotenv';
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '../.env' });
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import Hospital from './models/Hospital.js';
import Doctor from './models/Doctor.js';

const specialties = ['General care', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Neurology', 'ENT', 'Ophthalmology', 'Gynecology', 'Dentistry'];
const profilePortrait = (group, number) => `https://randomuser.me/api/portraits/${group}/${number}.jpg`;
const doctorProfiles = {
  'General care': [['Dr. Asha Raman', 'women', 44], ['Dr. Rishi Kumar', 'men', 32], ['Dr. Kavya Menon', 'women', 68]],
  Cardiology: [['Dr. Kavin Shah', 'men', 46], ['Dr. Nandita Rao', 'women', 65], ['Dr. Arvind Nair', 'men', 75]],
  Pediatrics: [['Dr. Meera Iyer', 'women', 33], ['Dr. Aditya Bose', 'men', 52], ['Dr. Pooja Das', 'women', 26]],
  Orthopedics: [['Dr. Nila Thomas', 'women', 49], ['Dr. Rahul Dev', 'men', 11], ['Dr. Sana Mathew', 'women', 12]],
  Dermatology: [['Dr. Arjun Menon', 'men', 22], ['Dr. Isha Kapoor', 'women', 21], ['Dr. Neil Joseph', 'men', 15]],
  Neurology: [['Dr. Divya Rao', 'women', 50], ['Dr. Varun Sen', 'men', 41], ['Dr. Anjali Pillai', 'women', 17]],
  ENT: [['Dr. Rohan Das', 'men', 64], ['Dr. Priya Nair', 'women', 57], ['Dr. Sameer Ali', 'men', 55]],
  Ophthalmology: [['Dr. Leela Kumar', 'women', 39], ['Dr. Siddharth Rao', 'men', 62], ['Dr. Tara George', 'women', 29]],
  Gynecology: [['Dr. Vikram Nair', 'men', 67], ['Dr. Ananya Bose', 'women', 63], ['Dr. Farah Khan', 'women', 56]],
  Dentistry: [['Dr. Sana Joseph', 'women', 36], ['Dr. Imran Patel', 'men', 78], ['Dr. Mira Krishnan', 'women', 25]]
};
const regions = [
  ['Coimbatore', ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Saibaba Colony', 'Singanallur']],
  ['Chennai', ['Anna Nagar', 'Adyar', 'Velachery', 'T. Nagar', 'Tambaram', 'Mylapore', 'Porur', 'Guindy', 'Perambur', 'OMR']],
  ['Madurai', ['Anna Nagar', 'Tallakulam', 'KK Nagar', 'Thiruparankundram', 'Goripalayam']],
  ['Tiruchirappalli', ['Thillai Nagar', 'Srirangam', 'Cantonment', 'Woraiyur', 'K. K. Nagar', 'Tennur', 'Thiruverumbur', 'Palakarai', 'Edamalaipatti Pudur', 'Bharathidasan Salai']],
  ['Salem', ['Fairlands', 'Alagapuram', 'Hasthampatti', 'Ammapet', 'Suramangalam']]
];
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

try {
  await connectDatabase();
  let branchCount = 0;
  const operations = [];
  for (const [region, localities] of regions) {
    for (const locality of localities) {
      const branchSlug = `careslot-${slug(region)}-${slug(locality)}`;
      const hospital = await Hospital.findOneAndUpdate({ slug: branchSlug }, { $set: {
        name: `CareSlot Clinic — ${locality} Branch`, slug: branchSlug,
        branchCode: `CS-${slug(region).slice(0, 3).toUpperCase()}-${slug(locality).slice(0, 5).toUpperCase()}`,
        region, locality, address: `${locality}, ${region}, Tamil Nadu (fictional sample address)`,
        phone: '+91 00000 00000', emergencyPhone: '112', services: specialties, isActive: true
      } }, { upsert: true, new: true, setDefaultsOnInsert: true });
      branchCount += 1;
      for (const specialty of specialties) {
        const profiles = doctorProfiles[specialty];
        const profileNames = profiles.map(([name]) => name);
        const existing = await Doctor.find({
          hospital: hospital._id,
          specialty,
          $or: [
            { name: /^Dr\. CareSlot Demo \d+$/ },
            { name: { $in: profileNames } }
          ]
        }).sort({ _id: 1 }).lean();

        for (let i = 0; i < profiles.length; i += 1) {
          const [name, group, portraitNumber] = profiles[i];
          const values = {
            name, specialty, hospital: hospital._id, experienceYears: 5 + i,
            qualifications: ['MBBS', 'MD'], consultationFee: 500, isAvailable: true, isActive: true,
            imageUrl: profilePortrait(group, portraitNumber),
            availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          };
          operations.push(existing[i]
            ? { updateOne: { filter: { _id: existing[i]._id }, update: { $set: values } } }
            : { updateOne: { filter: { hospital: hospital._id, specialty, name }, update: { $set: values }, upsert: true } });
        }
      }
    }
  }
  if (operations.length) await Doctor.bulkWrite(operations, { ordered: false });
  console.log(`Updated or seeded ${branchCount} fictional clinic branches and ${operations.length} sample clinician profiles.`);
} finally {
  await mongoose.disconnect();
}
