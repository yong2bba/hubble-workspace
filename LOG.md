# Log

## 2026-08-15
- Confirmed Homebox Docker/Traefik foundation and unused `md.yongduct.work` route.
- Cloned Hubble upstream commit `c4235c9` and recorded MIT reuse boundary.
- Locked architecture: public read-only Hubble UI, authenticated internal MCP, empty named volume, no A2A/Access/host document mount.
- Implemented Hubble shared UI web, public REST, authenticated Streamable HTTP MCP, path guard, hash conflict control, trash, and audit log.
- Passed 7 tests, production builds, React Compiler audit (3/0), and ephemeral Docker volume smoke; removed smoke container/volume.
