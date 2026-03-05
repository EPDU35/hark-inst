const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'hackathon.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const ALLOWED_ORIGINS = [
  'https://hark-inst.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

function readDB() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return { registrations: [] }; }
}

function writeDB(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generateRef(existing) {
  let ref;
  do { ref = 'HCK-' + crypto.randomBytes(3).toString('hex').toUpperCase(); }
  while (existing.includes(ref));
  return ref;
}

app.post('/api/register', (req, res) => {
  const { nom, prenom, email, tel, mode, teammates, payment_method, phone_payment, transaction_id, total } = req.body;

  if (!nom || !prenom || !email)
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Adresse email invalide.' });

  const db = readDB();

  if (db.registrations.find(r => r.email === email.toLowerCase().trim()))
    return res.status(409).json({ error: 'Cette adresse email est deja inscrite.' });

  const reference = generateRef(db.registrations.map(r => r.reference));

  db.registrations.push({
    id: db.registrations.length + 1,
    reference,
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: email.trim().toLowerCase(),
    tel: tel?.trim() || '',
    mode: mode || 'solo',
    teammates: teammates || [],
    payment_method: payment_method || 'mobile_money',
    phone_payment: phone_payment?.trim() || '',
    transaction_id: transaction_id?.trim() || '',
    total: total || 1000,
    paid: !!(transaction_id && transaction_id.trim()),
    created_at: new Date().toISOString(),
  });

  writeDB(db);
  res.status(201).json({ success: true, reference });
});

app.get('/api/admin/registrations', (req, res) => {
  const db = readDB();
  const registrations = [...db.registrations].reverse();
  res.json({
    registrations,
    total: registrations.length,
    solos: registrations.filter(r => r.mode === 'solo').length,
    groups: registrations.filter(r => r.mode === 'groupe').length,
    revenue: registrations.reduce((s, r) => s + (r.total || 0), 0),
  });
});

app.get('/api/admin/registrations/:ref', (req, res) => {
  const db = readDB();
  const entry = db.registrations.find(r => r.reference === req.params.ref);
  if (!entry) return res.status(404).json({ error: 'Inscription introuvable.' });
  res.json(entry);
});

app.patch('/api/admin/registrations/:ref/paid', (req, res) => {
  const db = readDB();
  const entry = db.registrations.find(r => r.reference === req.params.ref);
  if (!entry) return res.status(404).json({ error: 'Inscription introuvable.' });
  entry.paid = true;
  writeDB(db);
  res.json({ success: true });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log('Hackathon L1 - Backend OK sur le port ' + PORT);
});
