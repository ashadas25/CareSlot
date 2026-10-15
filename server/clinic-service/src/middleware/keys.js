import { timingSafeEqual } from 'node:crypto';

function matches(provided, expected) {
  if (!provided || !expected) return false;
  const left = Buffer.from(String(provided));
  const right = Buffer.from(String(expected));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function requireServiceKey(req, res, next) {
  if (!matches(req.get('x-service-key'), process.env.SERVICE_API_KEY)) {
    return res.status(401).json({ message: 'Service authentication required.' });
  }
  next();
}

export function requireClinicAdmin(req, res, next) {
  if (!matches(req.get('x-clinic-admin-key'), process.env.CLINIC_ADMIN_KEY)) {
    return res.status(401).json({ message: 'Clinic directory administrator key required.' });
  }
  next();
}
