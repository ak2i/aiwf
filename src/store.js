const fs = require('fs');
const path = require('path');
const os = require('os');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function defaultRoot() {
  return path.join(os.homedir(), '.aiwf');
}

function defaultDbDir() {
  return path.join(defaultRoot(), 'db');
}

function dbPath(name) {
  return path.join(defaultDbDir(), `${name}.jsonl`);
}

function loadJsonLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.trim()) return [];
  return raw
    .trimEnd()
    .split('\n')
    .map((line) => JSON.parse(line));
}

function appendJsonLine(filePath, obj) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, JSON.stringify(obj) + '\n', 'utf8');
}

function writeJson(filePath, obj) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function makeId(prefix, date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${y}${m}${d}_${hh}${mm}${ss}_${rand}`;
}

module.exports = {
  ensureDir,
  defaultRoot,
  defaultDbDir,
  dbPath,
  loadJsonLines,
  appendJsonLine,
  writeJson,
  readJson,
  makeId
};
