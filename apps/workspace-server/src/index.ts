import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpApp } from "./mcp.js";
import { createPublicApp } from "./public-app.js";
import { WorkspaceStore } from "./workspace.js";

const root = process.env.WORKSPACE_ROOT ?? "/workspace";
const publicPort = parsePort(process.env.PUBLIC_PORT, 3000);
const mcpPort = parsePort(process.env.MCP_PORT, 3001);
const mcpToken = process.env.MCP_API_TOKEN ?? "";
const allowedOrigins = (process.env.MCP_ALLOWED_ORIGINS ?? "")
	.split(",")
	.map((value) => value.trim())
	.filter(Boolean);
const defaultStaticDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../public",
);
const staticDir = process.env.STATIC_DIR ?? defaultStaticDir;

if (!mcpToken) throw new Error("MCP_API_TOKEN is required");
const store = new WorkspaceStore(root);
await store.init();

const publicServer = createPublicApp(store, staticDir).listen(
	publicPort,
	"0.0.0.0",
	() => {
		console.info(
			JSON.stringify({ event: "public_listening", port: publicPort, root }),
		);
	},
);
const mcpServer = createMcpApp(store, mcpToken, allowedOrigins).listen(
	mcpPort,
	"0.0.0.0",
	() => {
		console.info(
			JSON.stringify({ event: "mcp_listening", port: mcpPort, auth: "bearer" }),
		);
	},
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.on(signal, () => {
		publicServer.close();
		mcpServer.close();
	});
}

function parsePort(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
		throw new Error(`Invalid port: ${value}`);
	}
	return parsed;
}
