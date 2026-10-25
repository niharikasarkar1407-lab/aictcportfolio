const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

const colleges = [
  { id: '1', name: 'D.J. Sanghvi College of Engineering', aisheCode: 'C-12345', status: 'PENDING', apiKey: null },
  { id: '2', name: 'ABC Institute of Technology', aisheCode: 'C-98765', status: 'PENDING', apiKey: null }
];

const students = [
  { id: '1', collegeName: 'D.J. Sanghvi College of Engineering', name: 'Rahul Sharma', apaarId: 'APAAR-9988-11', course: 'B.Tech IT', syncedAt: '10:30 AM' }
];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/admin/colleges', (req, res) => {
  res.json(colleges);
});

app.post('/api/admin/approve-college', (req, res) => {
  const { aisheCode } = req.body;
  const college = colleges.find(c => c.aisheCode === aisheCode);

  if (!college) {
    return res.status(404).json({ error: 'College not found' });
  }

  const generatedKey = 'aicte_live_' + crypto.randomBytes(8).toString('hex');
  college.status = 'APPROVED';
  college.apiKey = generatedKey;

  res.json({ message: 'College Approved Successfully!', apiKey: generatedKey, college });
});

app.post('/api/admin/revoke-college', (req, res) => {
  const { aisheCode } = req.body;
  const college = colleges.find(c => c.aisheCode === aisheCode);

  if (!college) {
    return res.status(404).json({ error: 'College not found' });
  }

  college.status = 'PENDING';
  college.apiKey = null;

  res.json({ message: 'College status revoked back to PENDING!', college });
});

app.get('/api/college/credentials/:aisheCode', (req, res) => {
  const college = colleges.find(c => c.aisheCode === req.params.aisheCode);
  if (!college) {
    return res.status(404).json({ error: 'College not found' });
  }
  res.json(college);
});

app.post('/api/v1/students/sync', (req, res) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: '401 Unauthorized: Missing API Key' });
  }

  const college = colleges.find(c => c.apiKey === apiKey && c.status === 'APPROVED');
  if (!college) {
    return res.status(403).json({ error: '403 Forbidden: Invalid or Revoked API Key' });
  }

  const { name, apaarId, course } = req.body;
  if (!name || !apaarId || !course) {
    return res.status(400).json({ error: 'Missing required student details' });
  }

  const newStudent = {
    id: String(students.length + 1),
    collegeName: college.name,
    name,
    apaarId,
    course,
    syncedAt: new Date().toLocaleTimeString()
  };

  students.unshift(newStudent);

  res.status(200).json({
    success: true,
    message: `Student '${name}' successfully synced to AICTE Central Database!`,
    student: newStudent
  });
});

app.get('/api/admin/students', (req, res) => {
  res.json(students);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`AICTE Server running at http://localhost:${PORT}`));