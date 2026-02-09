const fs = require('fs');
const path = require('path');

function pad(n) {
  return String(n).padStart(2, '0');
}

function timestampId(date = new Date()) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}${m}${d}_${hh}${mm}${ss}`;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function createSession(rootDir, name) {
  ensureDir(rootDir);
  const id = name ? `${timestampId()}_${name}` : timestampId();
  const sessionDir = path.join(rootDir, id);
  const artifactsDir = path.join(sessionDir, 'artifacts');
  const inputsDir = path.join(sessionDir, 'inputs');

  ensureDir(sessionDir);
  ensureDir(artifactsDir);
  ensureDir(inputsDir);

  const runPath = path.join(sessionDir, 'run.json');
  const run = {
    session_id: id
  };
  fs.writeFileSync(runPath, JSON.stringify(run, null, 2) + '\n', 'utf8');

  return { sessionDir, artifactsDir, inputsDir, runPath, sessionId: id };
}

function appendEvent(eventsPath, event) {
  const line = JSON.stringify(event) + '\n';
  fs.appendFileSync(eventsPath, line, 'utf8');
}

function updateRun(runPath, patch) {
  const raw = fs.readFileSync(runPath, 'utf8');
  const run = JSON.parse(raw);
  const next = { ...run, ...patch };
  fs.writeFileSync(runPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

module.exports = {
  createSession,
  appendEvent,
  updateRun
};
