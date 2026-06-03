import { repositoryWorker } from './workers/repositoryWorker';

console.log('Starting Continuum Background Workers...');
console.log('Listening to Redis on process.env.REDIS_HOST...');

repositoryWorker.on('completed', (job) => {
  console.log(`[JOB COMPLETED] ${job.id} - Repository import finished.`);
});

repositoryWorker.on('failed', (job, err) => {
  console.error(`[JOB FAILED] ${job?.id} - Error: ${err.message}`);
});
