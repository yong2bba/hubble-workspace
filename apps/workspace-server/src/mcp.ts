import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import type { Express } from "express";
import { z } from "zod/v4";
import type { WorkspaceStore } from "./workspace.js";
import { WorkspaceError } from "./workspace.js";

const DEFAULT_ALLOWED_HOSTS = [
	"127.0.0.1",
	"localhost",
	"homebox-hubble-workspace",
];

export function createMcpApp(
	store: WorkspaceStore,
	token: string,
	allowedOrigins: string[] = [],
	allowedHosts: string[] = DEFAULT_ALLOWED_HOSTS,
): Express {
	if (!token) throw new Error("MCP_API_TOKEN is required");
	const app = createMcpExpressApp({
		host: "0.0.0.0",
		allowedHosts,
		allowedOrigins,
		jsonLimit: "1mb",
	});
	app.disable("x-powered-by");
	app.get("/health", (_req, res) =>
		res.json({
			status: "ok",
			transport: "streamable-http",
			protocol: "2026-07-28",
		}),
	);
	app.use("/mcp", (req, res, next) => {
		if (req.headers.authorization !== `Bearer ${token}`) {
			res.setHeader("WWW-Authenticate", "Bearer");
			return res.status(401).json({ error: "MCP authentication required" });
		}
		next();
	});

	const handler = createMcpHandler(() => buildMcpServer(store), {
		legacy: "reject",
	});
	const nodeHandler = toNodeHandler(handler, {
		onerror: (cause) => console.error(cause),
	});
	app.all("/mcp", (req, res) => void nodeHandler(req, res, req.body));
	return app;
}

export function buildMcpServer(store: WorkspaceStore): McpServer {
	const server = new McpServer({ name: "hubble-workspace", version: "0.2.0" });

	server.registerTool(
		"list_files",
		{
			title: "List workspace Markdown files",
			description:
				"List visible Markdown files in the isolated workspace with size, modified time, and SHA-256. Use this before reading or changing files. Hidden control/trash data is never returned.",
			inputSchema: z.object({}),
		},
		async () => result(() => store.list()),
	);
	server.registerTool(
		"read_file",
		{
			title: "Read a workspace Markdown file",
			description:
				"Read one Markdown file and return its content plus SHA-256. Use the returned hash as expected_sha256 for a later update. Paths are POSIX-relative and must end in .md.",
			inputSchema: z.object({
				path: z
					.string()
					.describe("Workspace-relative Markdown path, e.g. notes/idea.md"),
			}),
		},
		async ({ path }) => result(() => store.read(path)),
	);
	server.registerTool(
		"search_files",
		{
			title: "Search workspace Markdown",
			description:
				"Search visible Markdown paths and content, returning short snippets. Use this to locate candidate files before reading them; it does not search hidden history or trash.",
			inputSchema: z.object({
				query: z
					.string()
					.min(1)
					.max(200)
					.describe("Case-insensitive search text"),
				limit: z
					.number()
					.int()
					.min(1)
					.max(100)
					.optional()
					.describe("Maximum results; defaults to 20"),
			}),
		},
		async ({ query, limit }) => result(() => store.search(query, limit)),
	);
	server.registerTool(
		"create_file",
		{
			title: "Create a workspace Markdown file",
			description:
				"Create a new Markdown file without overwriting anything. Parent folders are created safely; hidden, absolute, traversal, symlink, and non-Markdown paths are rejected.",
			inputSchema: z.object({
				path: z.string().describe("New workspace-relative .md path"),
				content: z.string().describe("UTF-8 Markdown content, maximum 1 MiB"),
			}),
		},
		async ({ path, content }) => result(() => store.create(path, content)),
	);
	server.registerTool(
		"update_file",
		{
			title: "Update a workspace Markdown file",
			description:
				"Atomically replace a Markdown file only when expected_sha256 matches the current file. Read first and pass that exact lowercase hash to prevent lost updates.",
			inputSchema: z.object({
				path: z.string().describe("Existing workspace-relative .md path"),
				content: z
					.string()
					.describe("Complete replacement Markdown, maximum 1 MiB"),
				expected_sha256: z
					.string()
					.regex(/^[a-f0-9]{64}$/)
					.describe("SHA-256 returned by read_file"),
			}),
		},
		async ({ path, content, expected_sha256 }) =>
			result(() => store.update(path, content, expected_sha256)),
	);
	server.registerTool(
		"move_file",
		{
			title: "Move or rename a workspace Markdown file",
			description:
				"Move one Markdown file to a new non-existing Markdown path inside the workspace. It never overwrites a destination and cannot cross the volume boundary.",
			inputSchema: z.object({
				from_path: z.string().describe("Existing workspace-relative .md path"),
				to_path: z.string().describe("New workspace-relative .md path"),
			}),
		},
		async ({ from_path, to_path }) =>
			result(() => store.move(from_path, to_path)),
	);
	server.registerTool(
		"trash_file",
		{
			title: "Move a workspace Markdown file to trash",
			description:
				"Remove a visible Markdown file by moving it into the hidden workspace trash. This is recoverable storage, not permanent deletion.",
			inputSchema: z.object({
				path: z.string().describe("Existing workspace-relative .md path"),
			}),
		},
		async ({ path }) => result(() => store.trash(path)),
	);

	return server;
}

async function result<T>(operation: () => Promise<T>) {
	try {
		const value = await operation();
		return {
			content: [
				{ type: "text" as const, text: JSON.stringify(value, null, 2) },
			],
		};
	} catch (cause: unknown) {
		const message =
			cause instanceof WorkspaceError
				? `${cause.code}: ${cause.message}`
				: cause instanceof Error
					? cause.message
					: "Unknown workspace error";
		return {
			isError: true,
			content: [{ type: "text" as const, text: message }],
		};
	}
}
