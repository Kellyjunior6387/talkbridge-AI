export function log(level, message) {
  const ts = new Date().toISOString();
  const levels = { info: '✅', warn: '⚠️ ', error: '❌' };
  console.log(`[${ts}] ${levels[level] || '  '} ${message}`);
}
