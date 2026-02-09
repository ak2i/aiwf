#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { createSession, appendEvent, updateRun } = require('../src/session');
const { defaultToolsPath, setTool, listTools, getTool } = require('../src/tools');

function printHelp() {
  const msg = `aiwf (v0.1)

Usage:
  aiwf run --cmd "..."
  aiwf tool add <name> --cmd "..."
  aiwf tool list
  aiwf run --tool <name> -- <args...>

Options:
  --cmd            Command to execute (required)
  --tool           Tool name (use with run)
  --session-root   Session root directory (default: ~/.aiwf/sessions)
  --name           Optional session name suffix
  --cwd            Working directory for the command
  --tools-path     Tools registry file (default: ~/.aiwf/tools.json)
  --spec-stack     Comma-separated spec stack identifiers
  --participant    Participant (name:role), repeatable
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

  appendEvent(eventsPath, { ts: new Date().toISOString(), type: 'session_start' });
  appendEvent(eventsPath, { ts: new Date().toISOString(), type: 'tool_start', tool: opts.toolName || 'cmd', argv });

  const child = spawn(opts.cmd, {
    shell: true,
    cwd: opts.cwd,
    env: process.env
  });

  const stdoutStream = fs.createWriteStream(stdoutPath, { flags: 'a' });
  const stderrStream = fs.createWriteStream(stderrPath, { flags: 'a' });

  child.stdout.on('data', (data) => {
    const text = data.toString();
    stdoutStream.write(text);
    appendEvent(eventsPath, { ts: new Date().toISOString(), type: 'stdout', data: text });
    appendEvent(eventsPath, { ts: new Date().toISOString(), type: 'artifact_written', path: stdoutPath });
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    stderrStream.write(text);
    appendEvent(eventsPath, { ts: new Date().toISOString(), type: 'stderr', data: text });
    appendEvent(eventsPath, { ts: new Date().toISOString(), type: 'artifact_written', path: stderrPath });
  });

  child.on('close', (code) => {
    appendEvent(eventsPath, { ts: new Date().toISOString(), type: 'tool_end', code });
    updateRun(session.runPath, {
      finished_at: new Date().toISOString(),
      exit_code: code
    });
    stdoutStream.end();
    stderrStream.end();
    process.exit(code || 0);
  });
}

function main() {
  const { command, rest, opts } = parseArgs(process.argv.slice(2));

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
      if (!tool) {
        process.stderr.write(`Unknown tool: ${opts.tool}\n`);
        return process.exit(2);
      }
      const args = rest.join(' ');
      return runCommand({
        ...opts,
        cmd: `${tool.cmd} ${args}`.trim(),
        toolName: opts.tool,
        argv: rest
      });
    }
    return runCommand(opts);
  }

  if (command === 'tool') {
    const sub = rest[0];
    if (sub === 'add') {
      const name = rest[1];
      if (!name) {
        process.stderr.write('Missing tool name\n');
        return process.exit(2);
      }
      if (!opts.cmd) {
        process.stderr.write('Missing --cmd for tool add\n');
        return process.exit(2);
      }
      setTool(name, opts.cmd, opts.toolsPath);
      process.stdout.write(`Registered tool: ${name}\n`);
      return process.exit(0);
    }
    if (sub === 'list') {
      const tools = listTools(opts.toolsPath);
      process.stdout.write(JSON.stringify(tools, null, 2) + '\\n');
      return process.exit(0);
    }
    process.stderr.write('Unknown tool subcommand\n');
    printHelp();
    return process.exit(2);
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  printHelp();
  return process.exit(2);
}

main();
