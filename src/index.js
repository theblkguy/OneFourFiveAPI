const express = require('express');
const progressionsRouter = require('./routes/progressions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/progressions', progressionsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chord-progression-api' });
});

app.listen(PORT, () => {
  console.log(`Chord Progression API listening on http://localhost:${PORT}`);
});
