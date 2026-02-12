const fs = require('fs');
const path = require('path');
const os = require('os');

function defaultToolsPath() {
  return path.join(os.homedir(), '.aiwf', 'tools.json');
}

function loadTools(toolsPath = defaultToolsPath()) {
  if (!fs.existsSync(toolsPath)) {
    return { path: toolsPath, tools: {} };
  }
  const raw = fs.readFileSync(toolsPath, 'utf8');
  const data = JSON.parse(raw);
  return { path: toolsPath, tools: data.tools || {} };
}

function saveTools(toolsPath, tools) {
  const dir = path.dirname(toolsPath);
  fs.mkdirSync(dir, { recursive: true });
  const payload = { tools };
  fs.writeFileSync(toolsPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function setTool(name, tool, toolsPath = defaultToolsPath()) {
  const { tools } = loadTools(toolsPath);
  tools[name] = { ...(tools[name] || {}), ...tool };
  saveTools(toolsPath, tools);
}

function listTools(toolsPath = defaultToolsPath()) {
  const { tools } = loadTools(toolsPath);
  return tools;
}

function getTool(name, toolsPath = defaultToolsPath()) {
  const { tools } = loadTools(toolsPath);
  return tools[name] || null;
}

function deleteTool(name, toolsPath = defaultToolsPath()) {
  const { tools } = loadTools(toolsPath);
  if (!tools[name]) return false;
  delete tools[name];
  saveTools(toolsPath, tools);
  return true;
}

module.exports = {
  defaultToolsPath,
  loadTools,
  saveTools,
  setTool,
  listTools,
  getTool,
  deleteTool
};
