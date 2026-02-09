# Tools Registry

aiwf uses a simple tools registry to map tool names to commands.

Default registry file:

- `~/.aiwf/tools.json`

## Example

Register a tool:

```bash
aiwf tool add flowmark --cmd "flowmark"
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
    "cmd": "flowmark"
  }
}
```

## File Format

```json
{
  "tools": {
    "flowmark": {
      "cmd": "flowmark"
    }
  }
}
```
