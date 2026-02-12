# Tools Registry

aiwf uses a simple tools registry to map tool names to commands.

Default registry file:

- `~/.aiwf/tools.json`

## Example

Register a tool:

```bash
aiwf tool add flowmark --cmd "flowmark"
```

Register from a manifest:

```bash
aiwf tool add ./tool-manifest.json
```

Run with the tool:

```bash
aiwf run --tool flowmark -- validate docs/dev/v0.1.2/samples/minimal.md
```

List tools:

```bash
aiwf tool list
```

Example output:

```json
{
  "flowmark": {
    "tool_id": "flowmark",
    "cmd": "flowmark",
    "invocation_type": "command",
    "capabilities": [],
    "request_model": "unknown",
    "compliance": "unknown",
    "execution_environment": "local",
    "adapter_required": false,
    "adapter_notes": ""
  }
}
```

## File Format

```json
{
  "tools": {
    "flowmark": {
      "tool_id": "flowmark",
      "cmd": "flowmark"
    }
  }
}
```
