#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { createSession, appendEvent, updateRun } = require('../src/session');
const { defaultToolsPath, setTool, listTools, getTool, deleteTool } = require('../src/tools');
const {
  ensureDir,
  defaultRoot,
  dbPath,
  loadJsonLines,
  appendJsonLine,
  readJson,
  writeJson,
  makeId
} = require('../src/store');

function printHelp() {
  const msg = `aiwf (v0.1.3)

Usage:
  aiwf run --cmd "..."
  aiwf run --tool <id> -- <args...>
  aiwf <tool-id> -- <args...>
  aiwf session <subcommand>
  aiwf tool <subcommand>
  aiwf material <subcommand>
  aiwf catalog <kind> [options]
  aiwf fetch <ref> [options]
  aiwf artifact <subcommand>
  aiwf event <subcommand>

Options:
  --cmd            Command to execute (required)
  --tool           Tool id (use with run)
  --session-root   Session root directory (default: ~/.aiwf/sessions)
  --name           Optional session name suffix
  --cwd            Working directory for the command
  --tools-path     Tools registry file (default: ~/.aiwf/tools.json)
  --spec-stack     Comma-separated spec stack identifiers
  --participant    Participant (name:role), repeatable
  --format         Output format (table|json|jsonl)
  --fields         Comma-separated fields to select
  --limit          Max rows
  --offset         Offset rows
  --sort           Sort field
  --order          Sort order (asc|desc)
  --query          Substring query
  --filter         Key=value filter, repeatable
  --since          ISO8601 start time
  --until          ISO8601 end time
  --type           Material type
  --tag            Material tag
  --source         Material source
  --include        Include material id (repeatable)
  --exclude        Exclude material id (repeatable)
  --material-set   Material set id
  --tool-version   Tool version
  --latest         Latest artifacts per tool/material-set
  --out            Output path or "-"
  --pretty         Pretty JSON output
  --help           Show help
  --version        Show version
`;
  process.stdout.write(msg);
}

function readVersion() {
  const pkgPath = path.resolve(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version || '0.0.0';
}

function parseArgs(argv) {
  const defaultSessionRoot = path.join(os.homedir(), '.aiwf', 'sessions');
  const opts = {
    cmd: null,
    tool: null,
    sessionRoot: defaultSessionRoot,
    name: null,
    cwd: process.cwd(),
    toolsPath: defaultToolsPath(),
    specStack: null,
    participants: [],
    format: null,
    fields: null,
    limit: null,
    offset: null,
    sort: null,
    order: null,
    query: null,
    filters: [],
    since: null,
    until: null,
    type: null,
    tag: null,
    source: null,
    include: [],
    exclude: [],
    materialSet: null,
    toolVersion: null,
    latest: false,
    out: null,
    pretty: false,
    help: false,
    version: false
  };
  let command = null;
  const rest = [];
  let afterDoubleDash = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') {
      afterDoubleDash = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--version') {
      opts.version = true;
    } else if (arg === '--cmd') {
      opts.cmd = argv[++i] || null;
    } else if (arg === '--tool') {
      opts.tool = argv[++i] || null;
    } else if (arg === '--session-root') {
      opts.sessionRoot = argv[++i] || opts.sessionRoot;
    } else if (arg === '--name') {
      opts.name = argv[++i] || null;
    } else if (arg === '--cwd') {
      opts.cwd = argv[++i] || opts.cwd;
    } else if (arg === '--tools-path') {
      opts.toolsPath = argv[++i] || opts.toolsPath;
    } else if (arg === '--spec-stack') {
      opts.specStack = argv[++i] || null;
    } else if (arg === '--participant') {
      const value = argv[++i] || '';
      if (value) opts.participants.push(value);
    } else if (arg === '--format') {
      opts.format = argv[++i] || null;
    } else if (arg === '--fields') {
      opts.fields = argv[++i] || null;
    } else if (arg === '--limit') {
      const value = argv[++i];
      opts.limit = value ? Number(value) : null;
    } else if (arg === '--offset') {
      const value = argv[++i];
      opts.offset = value ? Number(value) : null;
    } else if (arg === '--sort') {
      opts.sort = argv[++i] || null;
    } else if (arg === '--order') {
      opts.order = argv[++i] || null;
    } else if (arg === '--query') {
      opts.query = argv[++i] || null;
    } else if (arg === '--filter') {
      const value = argv[++i] || '';
      if (value) opts.filters.push(value);
    } else if (arg === '--since') {
      opts.since = argv[++i] || null;
    } else if (arg === '--until') {
      opts.until = argv[++i] || null;
    } else if (arg === '--type') {
      opts.type = argv[++i] || null;
    } else if (arg === '--tag') {
      opts.tag = argv[++i] || null;
    } else if (arg === '--source') {
      opts.source = argv[++i] || null;
    } else if (arg === '--include') {
      const value = argv[++i] || '';
      if (value) opts.include.push(value);
    } else if (arg === '--exclude') {
      const value = argv[++i] || '';
      if (value) opts.exclude.push(value);
    } else if (arg === '--material-set') {
      opts.materialSet = argv[++i] || null;
    } else if (arg === '--tool-version') {
      opts.toolVersion = argv[++i] || null;
    } else if (arg === '--latest') {
      opts.latest = true;
    } else if (arg === '--out') {
      opts.out = argv[++i] || null;
    } else if (arg === '--pretty') {
      opts.pretty = true;
    } else if (!command) {
      command = arg;
    } else if (afterDoubleDash) {
      rest.push(arg);
    } else {
      rest.push(arg);
    }
  }

  return { command, rest, opts };
}

function parseFilters(filters) {
  return filters
    .map((entry) => {
      const idx = entry.indexOf('=');
      if (idx === -1) return null;
      return { key: entry.slice(0, idx), value: entry.slice(idx + 1) };
    })
    .filter(Boolean);
}

function getRecordTime(record) {
  return record.created_at || record.added_at || record.started_at || record.ts || null;
}

function applyQuery(items, query) {
  if (!query) return items;
  const q = String(query).toLowerCase();
  return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
}

function applyFilters(items, filters) {
  if (!filters || filters.length === 0) return items;
  return items.filter((item) => {
    return filters.every(({ key, value }) => {
      const current = item[key];
      if (current === undefined || current === null) return false;
      if (Array.isArray(current)) {
        return current.map(String).includes(String(value));
      }
      return String(current) === String(value);
    });
  });
}

function applyTimeRange(items, since, until) {
  if (!since && !until) return items;
  const sinceTime = since ? new Date(since).getTime() : null;
  const untilTime = until ? new Date(until).getTime() : null;
  return items.filter((item) => {
    const t = getRecordTime(item);
    if (!t) return true;
    const time = new Date(t).getTime();
    if (Number.isNaN(time)) return true;
    if (sinceTime && time < sinceTime) return false;
    if (untilTime && time > untilTime) return false;
    return true;
  });
}

function applySort(items, field, order) {
  if (!field) return items;
  const dir = order && order.toLowerCase() === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === undefined && bv === undefined) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    if (av === bv) return 0;
    return av > bv ? dir : -dir;
  });
}

function applyLimitOffset(items, limit, offset) {
  const start = offset && offset > 0 ? offset : 0;
  const sliced = items.slice(start);
  if (!limit || limit <= 0) return sliced;
  return sliced.slice(0, limit);
}

function selectFields(items, fields) {
  if (!fields) return items;
  const keys = fields.split(',').map((f) => f.trim()).filter(Boolean);
  if (keys.length === 0) return items;
  return items.map((item) => {
    const next = {};
    keys.forEach((key) => {
      next[key] = item[key];
    });
    return next;
  });
}

function formatTable(items, fields) {
  if (items.length === 0) return '';
  const keys = fields
    ? fields.split(',').map((f) => f.trim()).filter(Boolean)
    : Object.keys(items[0]);
  const header = keys.join('\t');
  const rows = items.map((item) => keys.map((key) => (item[key] === undefined ? '' : String(item[key]))).join('\t'));
  return [header, ...rows].join('\n') + '\n';
}

function outputItems(items, opts) {
  const format = (opts.format || 'table').toLowerCase();
  if (format === 'json') {
    const json = opts.pretty ? JSON.stringify(items, null, 2) : JSON.stringify(items);
    process.stdout.write(json + '\n');
    return;
  }
  if (format === 'jsonl') {
    items.forEach((item) => process.stdout.write(JSON.stringify(item) + '\n'));
    return;
  }
  process.stdout.write(formatTable(items, opts.fields));
}

function globalEventsPath() {
  return dbPath('events');
}

function attachedSessionPath() {
  return path.join(defaultRoot(), 'attached-session.json');
}

function runCommand(opts) {
  if (!opts.cmd) {
    process.stderr.write('Missing --cmd\n');
    process.exit(2);
  }

  const sessionRoot = path.resolve(opts.cwd, opts.sessionRoot);
  const session = createSession(sessionRoot, opts.name);
  const eventsPath = path.join(session.sessionDir, 'events.jsonl');
  const stdoutPath = path.join(session.artifactsDir, 'stdout.txt');
  const stderrPath = path.join(session.artifactsDir, 'stderr.txt');

  const argv = opts.argv || [];
  const runPatch = {
    tool: opts.toolName || 'cmd',
    argv,
    started_at: new Date().toISOString()
  };
  if (opts.toolMeta) {
    if (opts.toolMeta.tool_id) runPatch.tool_id = opts.toolMeta.tool_id;
    if (opts.toolMeta.tool_version) runPatch.tool_version = opts.toolMeta.tool_version;
    runPatch.tool_meta = opts.toolMeta;
  }
  if (opts.specStack) {
    runPatch.spec_stack = opts.specStack.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (opts.participants && opts.participants.length > 0) {
    runPatch.participants = opts.participants.map((p) => {
      const [name, role] = p.split(':');
      return {
        name: (name || '').trim(),
        role: (role || '').trim()
      };
    }).filter((p) => p.name);
  }
  updateRun(session.runPath, {
    command: opts.cmd,
    cwd: opts.cwd,
    ...runPatch
  });

  const sessionStart = { ts: new Date().toISOString(), type: 'session_start', session_id: session.sessionId };
  appendEvent(eventsPath, sessionStart);
  appendJsonLine(globalEventsPath(), { event_id: makeId('event'), ...sessionStart });
  const toolStart = {
    ts: new Date().toISOString(),
    type: 'tool_start',
    tool: opts.toolName || 'cmd',
    argv,
    session_id: session.sessionId
  };
  appendEvent(eventsPath, toolStart);
  appendJsonLine(globalEventsPath(), { event_id: makeId('event'), ...toolStart });

  const child = spawn(opts.cmd, {
    shell: true,
    cwd: opts.cwd,
    env: {
      ...process.env,
      AIWF_SESSION_ID: session.sessionId,
      AIWF_SESSION_PATH: session.sessionDir,
      AIWF_MATERIAL_SET_ID: process.env.AIWF_MATERIAL_SET_ID || ''
    }
  });

  const stdoutStream = fs.createWriteStream(stdoutPath, { flags: 'a' });
  const stderrStream = fs.createWriteStream(stderrPath, { flags: 'a' });

  child.stdout.on('data', (data) => {
    const text = data.toString();
    stdoutStream.write(text);
    const stdoutEvent = { ts: new Date().toISOString(), type: 'stdout', data: text, session_id: session.sessionId };
    appendEvent(eventsPath, stdoutEvent);
    appendJsonLine(globalEventsPath(), { event_id: makeId('event'), ...stdoutEvent });
    const artifactEvent = { ts: new Date().toISOString(), type: 'artifact_written', path: stdoutPath, session_id: session.sessionId };
    appendEvent(eventsPath, artifactEvent);
    appendJsonLine(globalEventsPath(), { event_id: makeId('event'), ...artifactEvent });
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    stderrStream.write(text);
    const stderrEvent = { ts: new Date().toISOString(), type: 'stderr', data: text, session_id: session.sessionId };
    appendEvent(eventsPath, stderrEvent);
    appendJsonLine(globalEventsPath(), { event_id: makeId('event'), ...stderrEvent });
    const artifactEvent = { ts: new Date().toISOString(), type: 'artifact_written', path: stderrPath, session_id: session.sessionId };
    appendEvent(eventsPath, artifactEvent);
    appendJsonLine(globalEventsPath(), { event_id: makeId('event'), ...artifactEvent });
  });

  child.on('close', (code) => {
    const toolEnd = { ts: new Date().toISOString(), type: 'tool_end', code, session_id: session.sessionId };
    appendEvent(eventsPath, toolEnd);
    appendJsonLine(globalEventsPath(), { event_id: makeId('event'), ...toolEnd });
    updateRun(session.runPath, {
      finished_at: new Date().toISOString(),
      exit_code: code
    });
    stdoutStream.end();
    stderrStream.end();
    process.exit(code || 0);
  });
}

function resolveSessionRoot(opts) {
  return path.resolve(opts.cwd, opts.sessionRoot);
}

function listSessionRecords(sessionRoot) {
  if (!fs.existsSync(sessionRoot)) return [];
  const entries = fs.readdirSync(sessionRoot, { withFileTypes: true }).filter((d) => d.isDirectory());
  return entries.map((entry) => {
    const sessionDir = path.join(sessionRoot, entry.name);
    const runPath = path.join(sessionDir, 'run.json');
    const run = readJson(runPath) || {};
    return {
      session_id: run.session_id || entry.name,
      path: sessionDir,
      created_at: run.created_at || run.started_at || null,
      archived_at: run.archived_at || null,
      tool: run.tool || null,
      status: run.archived_at ? 'archived' : 'active'
    };
  });
}

function loadMaterials() {
  return loadJsonLines(dbPath('materials'));
}

function loadMaterialSets() {
  return loadJsonLines(dbPath('material_sets'));
}

function loadArtifacts() {
  return loadJsonLines(dbPath('artifacts'));
}

function loadEvents() {
  return loadJsonLines(globalEventsPath());
}

function findById(items, id, idKey) {
  return items.find((item) => item[idKey] === id) || null;
}

function writeOut(content, outPath) {
  if (!outPath || outPath === '-') {
    process.stdout.write(content);
    return;
  }
  if (Buffer.isBuffer(content)) {
    fs.writeFileSync(outPath, content);
  } else {
    fs.writeFileSync(outPath, content, 'utf8');
  }
}

function normalizeToolMeta(toolId, cmd, meta) {
  const base = {
    tool_id: toolId,
    invocation_type: 'command',
    capabilities: [],
    request_model: 'unknown',
    compliance: 'unknown',
    execution_environment: 'local',
    adapter_required: false,
    adapter_notes: ''
  };
  const next = { ...base, ...(meta || {}) };
  if (cmd) next.cmd = cmd;
  if (!next.tool_id) next.tool_id = toolId;
  return next;
}

function main() {
  const { command, rest, opts } = parseArgs(process.argv.slice(2));
  const filters = parseFilters(opts.filters);

  if (opts.version) {
    process.stdout.write(readVersion() + '\n');
    return process.exit(0);
  }

  if (opts.help || !command) {
    printHelp();
    return process.exit(opts.help ? 0 : 2);
  }

  if (command === 'run') {
    if (opts.tool && !opts.cmd) {
      const tool = getTool(opts.tool, opts.toolsPath);
      if (!tool || !tool.cmd) {
        process.stderr.write(`Unknown tool: ${opts.tool}\n`);
        return process.exit(2);
      }
      const args = rest.join(' ');
      return runCommand({
        ...opts,
        cmd: `${tool.cmd} ${args}`.trim(),
        toolName: opts.tool,
        argv: rest,
        toolMeta: tool
      });
    }
    return runCommand(opts);
  }

  if (command === 'session') {
    const sub = rest[0];
    const sessionRoot = resolveSessionRoot(opts);
    if (sub === 'new') {
      const session = createSession(sessionRoot, opts.name);
      updateRun(session.runPath, {
        created_at: new Date().toISOString(),
        status: 'created'
      });
      appendJsonLine(globalEventsPath(), {
        event_id: makeId('event'),
        ts: new Date().toISOString(),
        type: 'session_created',
        session_id: session.sessionId
      });
      process.stdout.write(session.sessionId + '\n');
      return process.exit(0);
    }
    if (sub === 'list') {
      let items = listSessionRecords(sessionRoot);
      items = applyQuery(items, opts.query);
      items = applyFilters(items, filters);
      items = applyTimeRange(items, opts.since, opts.until);
      items = applySort(items, opts.sort, opts.order);
      items = applyLimitOffset(items, opts.limit, opts.offset);
      items = selectFields(items, opts.fields);
      outputItems(items, opts);
      return process.exit(0);
    }
    if (sub === 'attach') {
      const id = rest[1];
      if (!id) {
        process.stderr.write('Missing session id\n');
        return process.exit(2);
      }
      const sessionDir = path.join(sessionRoot, id);
      if (!fs.existsSync(sessionDir)) {
        process.stderr.write('Session not found\n');
        return process.exit(2);
      }
      const payload = {
        session_id: id,
        session_path: sessionDir,
        attached_at: new Date().toISOString()
      };
      writeJson(attachedSessionPath(), payload);
      process.stdout.write(`Attached: ${id}\n`);
      return process.exit(0);
    }
    if (sub === 'detach') {
      const filePath = attachedSessionPath();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      process.stdout.write('Detached\n');
      return process.exit(0);
    }
    if (sub === 'archive') {
      const id = rest[1];
      if (!id) {
        process.stderr.write('Missing session id\n');
        return process.exit(2);
      }
      const runPath = path.join(sessionRoot, id, 'run.json');
      if (!fs.existsSync(runPath)) {
        process.stderr.write('Session not found\n');
        return process.exit(2);
      }
      updateRun(runPath, { archived_at: new Date().toISOString() });
      process.stdout.write(`Archived: ${id}\n`);
      return process.exit(0);
    }
    if (sub === 'remove') {
      const id = rest[1];
      if (!id) {
        process.stderr.write('Missing session id\n');
        return process.exit(2);
      }
      if (!rest.includes('--hard')) {
        process.stderr.write('Missing --hard for session remove\n');
        return process.exit(2);
      }
      const sessionDir = path.join(sessionRoot, id);
      if (!fs.existsSync(sessionDir)) {
        process.stderr.write('Session not found\n');
        return process.exit(2);
      }
      fs.rmSync(sessionDir, { recursive: true, force: true });
      process.stdout.write(`Removed: ${id}\n`);
      return process.exit(0);
    }
    process.stderr.write('Unknown session subcommand\n');
    return process.exit(2);
  }

  if (command === 'tool') {
    const sub = rest[0];
    if (sub === 'add') {
      const target = rest[1];
      if (!target) {
        process.stderr.write('Missing tool id or path\n');
        return process.exit(2);
      }
      let meta = null;
      let toolId = target;
      if (fs.existsSync(target)) {
        const raw = fs.readFileSync(target, 'utf8');
        meta = JSON.parse(raw);
        toolId = meta.tool_id || path.basename(target, path.extname(target));
      } else if (/^https?:\/\//i.test(target)) {
        process.stderr.write('URL tool manifests are not supported in this build\n');
        return process.exit(2);
      } else if (!opts.cmd) {
        process.stderr.write('Missing --cmd for tool add\n');
        return process.exit(2);
      }
      if (opts.toolVersion) {
        meta = { ...(meta || {}), tool_version: opts.toolVersion };
      }
      const tool = normalizeToolMeta(toolId, opts.cmd, meta);
      setTool(toolId, tool, opts.toolsPath);
      process.stdout.write(`Registered tool: ${toolId}\n`);
      return process.exit(0);
    }
    if (sub === 'delete') {
      const id = rest[1];
      if (!id) {
        process.stderr.write('Missing tool id\n');
        return process.exit(2);
      }
      const ok = deleteTool(id, opts.toolsPath);
      if (!ok) {
        process.stderr.write('Tool not found\n');
        return process.exit(2);
      }
      process.stdout.write(`Deleted tool: ${id}\n`);
      return process.exit(0);
    }
    if (sub === 'list') {
      const tools = listTools(opts.toolsPath);
      let items = Object.keys(tools).map((toolId) => ({ tool_id: toolId, ...tools[toolId] }));
      items = applyQuery(items, opts.query);
      items = applyFilters(items, filters);
      items = applySort(items, opts.sort, opts.order);
      items = applyLimitOffset(items, opts.limit, opts.offset);
      items = selectFields(items, opts.fields);
      outputItems(items, opts);
      return process.exit(0);
    }
    if (sub === 'run') {
      const id = rest[1];
      if (!id) {
        process.stderr.write('Missing tool id\n');
        return process.exit(2);
      }
      const tool = getTool(id, opts.toolsPath);
      if (!tool || !tool.cmd) {
        process.stderr.write(`Unknown tool: ${id}\n`);
        return process.exit(2);
      }
      const args = rest.slice(2);
      return runCommand({
        ...opts,
        cmd: `${tool.cmd} ${args.join(' ')}`.trim(),
        toolName: id,
        argv: args,
        toolMeta: tool
      });
    }
    process.stderr.write('Unknown tool subcommand\n');
    return process.exit(2);
  }

  if (command === 'material') {
    const sub = rest[0];
    if (sub === 'add') {
      const target = rest[1];
      if (!target) {
        process.stderr.write('Missing material path\n');
        return process.exit(2);
      }
      let type = opts.type;
      if (!type) {
        if (/^https?:\/\//i.test(target)) {
          type = 'url';
        } else if (fs.existsSync(target)) {
          type = 'file';
        } else {
          type = 'text';
        }
      }
      const material = {
        material_id: makeId('material'),
        type,
        path: target,
        tag: opts.tag || null,
        source: opts.source || null,
        added_at: new Date().toISOString()
      };
      appendJsonLine(dbPath('materials'), material);
      appendJsonLine(globalEventsPath(), {
        event_id: makeId('event'),
        ts: new Date().toISOString(),
        type: 'material_added',
        material_id: material.material_id
      });
      process.stdout.write(material.material_id + '\n');
      return process.exit(0);
    }
    if (sub === 'set') {
      const action = rest[1];
      if (action === 'create') {
        const materialSet = {
          material_set_id: makeId('material_set'),
          include: opts.include,
          exclude: opts.exclude,
          created_at: new Date().toISOString()
        };
        appendJsonLine(dbPath('material_sets'), materialSet);
        appendJsonLine(globalEventsPath(), {
          event_id: makeId('event'),
          ts: new Date().toISOString(),
          type: 'material_set_created',
          material_set_id: materialSet.material_set_id
        });
        process.stdout.write(materialSet.material_set_id + '\n');
        return process.exit(0);
      }
      if (action === 'list') {
        let items = loadMaterialSets();
        items = applyQuery(items, opts.query);
        items = applyFilters(items, filters);
        items = applyTimeRange(items, opts.since, opts.until);
        items = applySort(items, opts.sort, opts.order);
        items = applyLimitOffset(items, opts.limit, opts.offset);
        items = selectFields(items, opts.fields);
        outputItems(items, opts);
        return process.exit(0);
      }
    }
    if (sub === 'list') {
      let items = loadMaterials();
      items = applyQuery(items, opts.query);
      items = applyFilters(items, filters);
      items = applyTimeRange(items, opts.since, opts.until);
      items = applySort(items, opts.sort, opts.order);
      items = applyLimitOffset(items, opts.limit, opts.offset);
      items = selectFields(items, opts.fields);
      outputItems(items, opts);
      return process.exit(0);
    }
    process.stderr.write('Unknown material subcommand\n');
    return process.exit(2);
  }

  if (command === 'catalog') {
    const kind = rest[0];
    if (!kind) {
      process.stderr.write('Missing catalog kind\n');
      return process.exit(2);
    }
    let items = [];
    if (kind === 'sessions') items = listSessionRecords(resolveSessionRoot(opts));
    if (kind === 'tools') {
      const tools = listTools(opts.toolsPath);
      items = Object.keys(tools).map((toolId) => ({ tool_id: toolId, ...tools[toolId] }));
    }
    if (kind === 'materials') items = loadMaterials();
    if (kind === 'material-sets') items = loadMaterialSets();
    if (kind === 'artifacts') items = loadArtifacts();
    if (kind === 'events') items = loadEvents();
    if (kind === 'timeline') {
      items = loadEvents();
      const sessionRoot = resolveSessionRoot(opts);
      listSessionRecords(sessionRoot).forEach((session) => {
        const eventsPath = path.join(session.path, 'events.jsonl');
        if (!fs.existsSync(eventsPath)) return;
        const raw = fs.readFileSync(eventsPath, 'utf8');
        if (!raw.trim()) return;
        raw.trimEnd().split('\n').forEach((line) => {
          const event = JSON.parse(line);
          if (!event.session_id) event.session_id = session.session_id;
          if (!event.event_id) event.event_id = makeId('event');
          items.push(event);
        });
      });
    }
    if (items.length === 0 && !['sessions', 'tools', 'materials', 'material-sets', 'artifacts', 'events', 'timeline'].includes(kind)) {
      process.stderr.write('Unknown catalog kind\n');
      return process.exit(2);
    }
    if (kind === 'materials') {
      if (opts.type) filters.push({ key: 'type', value: opts.type });
      if (opts.tag) filters.push({ key: 'tag', value: opts.tag });
      if (opts.source) filters.push({ key: 'source', value: opts.source });
    }
    if (kind === 'artifacts') {
      if (opts.tool) filters.push({ key: 'tool_id', value: opts.tool });
      if (opts.materialSet) filters.push({ key: 'material_set_id', value: opts.materialSet });
      if (opts.latest) {
        const grouped = {};
        items.forEach((item) => {
          const key = `${item.tool_id || ''}::${item.material_set_id || ''}`;
          if (!grouped[key] || (item.created_at && item.created_at > grouped[key].created_at)) {
            grouped[key] = item;
          }
        });
        items = Object.values(grouped);
      }
    }
    items = applyQuery(items, opts.query);
    items = applyFilters(items, filters);
    items = applyTimeRange(items, opts.since, opts.until);
    items = applySort(items, opts.sort, opts.order);
    items = applyLimitOffset(items, opts.limit, opts.offset);
    items = selectFields(items, opts.fields);
    outputItems(items, opts);
    return process.exit(0);
  }

  if (command === 'fetch') {
    const ref = rest[0];
    if (!ref || !ref.includes(':')) {
      process.stderr.write('Invalid ref\n');
      return process.exit(2);
    }
    const [kind, id] = ref.split(':', 2);
    let record = null;
    if (kind === 'material') record = findById(loadMaterials(), id, 'material_id');
    if (kind === 'material-set') record = findById(loadMaterialSets(), id, 'material_set_id');
    if (kind === 'artifact') record = findById(loadArtifacts(), id, 'artifact_id');
    if (kind === 'event') record = findById(loadEvents(), id, 'event_id');
    if (kind === 'tool') {
      const tool = getTool(id, opts.toolsPath);
      if (tool) record = { tool_id: id, ...tool };
    }
    if (!record) {
      process.stderr.write('Not found\n');
      return process.exit(2);
    }
    const format = (opts.format || 'raw').toLowerCase();
    if (format === 'json') {
      const content = opts.pretty ? JSON.stringify(record, null, 2) : JSON.stringify(record);
      writeOut(content + '\n', opts.out);
      return process.exit(0);
    }
    if (format === 'text') {
      writeOut(JSON.stringify(record) + '\n', opts.out);
      return process.exit(0);
    }
    if (kind === 'material' && record.type === 'file' && fs.existsSync(record.path)) {
      const buf = fs.readFileSync(record.path);
      writeOut(buf, opts.out);
      return process.exit(0);
    }
    if (kind === 'artifact' && record.path && fs.existsSync(record.path)) {
      const buf = fs.readFileSync(record.path);
      writeOut(buf, opts.out);
      return process.exit(0);
    }
    writeOut(JSON.stringify(record) + '\n', opts.out);
    return process.exit(0);
  }

  if (command === 'artifact') {
    const sub = rest[0];
    if (sub === 'add') {
      const target = rest[1];
      if (!target) {
        process.stderr.write('Missing artifact path\n');
        return process.exit(2);
      }
      if (!opts.materialSet || !opts.tool || !opts.toolVersion) {
        process.stderr.write('Missing required meta (use --material-set, --tool, --tool-version)\n');
        return process.exit(2);
      }
      const artifact = {
        artifact_id: makeId('artifact'),
        path: target,
        material_set_id: opts.materialSet,
        tool_id: opts.tool,
        tool_version: opts.toolVersion,
        created_at: new Date().toISOString()
      };
      appendJsonLine(dbPath('artifacts'), artifact);
      appendJsonLine(globalEventsPath(), {
        event_id: makeId('event'),
        ts: new Date().toISOString(),
        type: 'artifact_added',
        artifact_id: artifact.artifact_id
      });
      process.stdout.write(artifact.artifact_id + '\n');
      return process.exit(0);
    }
    process.stderr.write('Unknown artifact subcommand\n');
    return process.exit(2);
  }

  if (command === 'event') {
    const sub = rest[0];
    if (!sub || sub === 'list') {
      let items = loadEvents();
      items = applyQuery(items, opts.query);
      items = applyFilters(items, filters);
      items = applyTimeRange(items, opts.since, opts.until);
      items = applySort(items, opts.sort, opts.order);
      items = applyLimitOffset(items, opts.limit, opts.offset);
      items = selectFields(items, opts.fields);
      outputItems(items, opts);
      return process.exit(0);
    }
    process.stderr.write('Unknown event subcommand\n');
    return process.exit(2);
  }

  const toolFallback = getTool(command, opts.toolsPath);
  if (toolFallback && toolFallback.cmd) {
    const args = rest.join(' ');
    return runCommand({
      ...opts,
      cmd: `${toolFallback.cmd} ${args}`.trim(),
      toolName: command,
      argv: rest,
      toolMeta: toolFallback
    });
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  printHelp();
  return process.exit(2);
}

main();
