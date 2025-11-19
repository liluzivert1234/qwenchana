import { runAskFlow } from './askFlow.js';

(async () => {
  const res = await runAskFlow({ message: 'Kailan mag ani ng palay?', crop: 'palay', location: 'Tarlac' });
  console.log('KB length returned:', (res.kb || []).length);
  console.log('Top KB results:', JSON.stringify(res.kb, null, 2));
  process.exit(0);
})();
