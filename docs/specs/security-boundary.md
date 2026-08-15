# Security Boundary

## Public plane (`:3000`)
- Static Hubble UI
- `GET /api/health`
- `GET /api/files`
- `GET /api/files/content?path=...`
- `GET /api/search?q=...`
- All `/api` non-GET methods return 405
- CSP blocks frames, objects, remote scripts, and remote connections

## Agent plane (`:3001`)
- MCP Streamable HTTP at `/mcp`
- Bearer token required
- Browser `Origin` rejected unless explicitly allowlisted
- Homebox publishes this only on `127.0.0.1:13001` for an SSH tunnel
- Traefik never routes this port

## Storage plane
- Only the app container mounts `homebox_hubble_workspace_data`
- No Artifact Garden, Mac mini, Homebox host, Docker socket, SSH, or secret paths are mounted
- Only normalized visible `.md` paths are accepted
- Absolute, traversal, hidden, backslash, symlink, oversized, and overwrite paths fail closed
- Updates require exact current SHA-256
- Delete is recoverable trash move

## Deliberate omissions
- Public editor/upload/create/delete
- HTML App execution
- terminal/PTY and arbitrary commands
- A2A
- Artifact Garden publish/import
