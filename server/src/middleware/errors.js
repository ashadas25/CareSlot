export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.status && error.status >= 400 && error.status <= 599) return res.status(error.status).json({ message: error.message });
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please check the submitted details.', details: Object.values(error.errors).map((item) => item.message) });
  if (error.code === 11000) return res.status(409).json({ message: 'This record already exists.' });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid record identifier.' });
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
