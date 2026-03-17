import cron from 'node-cron';
import { resolve } from 'path';
import { migrate } from '@devpulse/core';
import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3377', 10);
const DB_PATH = process.env.DB_PATH || resolve(process.cwd(), 'devpulse.db');

async function main() {
  migrate(DB_PATH);
  const app = await buildApp(DB_PATH);

  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled fetch...');
    try {
      await app.services.fetcherService.fetchAll();
    } catch (err) {
      console.error('Scheduled fetch failed:', err);
    }
  });

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`DevPulse running at http://localhost:${PORT}`);
}

main().catch(console.error);
