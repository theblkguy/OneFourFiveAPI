const express = require('express');
const path = require('path');
const progressionsRouter = require('./routes/progressions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const publicDir = path.resolve(__dirname, '..', 'public');
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) res.status(500).send('Server error loading page');
  });
});
app.use(express.static(publicDir));
app.use('/progressions', progressionsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chord-progression-api' });
});

app.listen(PORT, () => {
  console.log(`Chord Progression API listening on http://localhost:${PORT}`);
});
