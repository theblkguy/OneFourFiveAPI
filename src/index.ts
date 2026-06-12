import app, { ensureDatabaseReady } from './app';

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  ensureDatabaseReady()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Chord Progression API listening on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

export default app;
