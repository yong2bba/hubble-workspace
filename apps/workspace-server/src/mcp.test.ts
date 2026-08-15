import { mkdtemp, rm } from "node:fs/promises";
import type { Server } from "node:http";
import { request } from "node:http";
import os from "node:os";
import path from "node:path";
import {
	Client,
	StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { afterEach, describe, expect, it } from "vitest";
import { createMcpApp } from "./mcp.js";
import { WorkspaceStore } from "./workspace.js";

let server: Server | undefined;
let root: string | undefined;
let client: Client | undefined;
afterEach(async () => {
	await client?.close();
	const activeServer = server;
	if (activeServer)
		await new Promise<void>((resolve) => activeServer.close(() => resolve()));
	if (root) await rm(root, { recursive: true, force: true });
	server = undefined;
	root = undefined;
	client = undefined;
});

async function start(token = "test-token") {
	root = await mkdtemp(path.join(os.tmpdir(), "hubble-mcp-"));
	const store = new WorkspaceStore(root);
	await store.init();
	const activeServer = createMcpApp(store, token).listen(0, "127.0.0.1");
	server = activeServer;
	await new Promise<void>((resolve) => activeServer.once("listening", resolve));
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("No test address");
	return { url: new URL(`http://127.0.0.1:${address.port}/mcp`), token };
}

function text(result: unknown): string {
	const content = (result as { content?: unknown }).content;
	if (!Array.isArray(content)) throw new Error("Missing content array");
	const first = content[0] as { type?: string; text?: string } | undefined;
	if (!first || first.type !== "text" || typeof first.text !== "string")
		throw new Error("Missing text result");
	return first.text;
}

const modernListBody = JSON.stringify({
	jsonrpc: "2.0",
	id: 1,
	method: "tools/list",
	params: {
		_meta: {
			"io.modelcontextprotocol/protocolVersion": "2026-07-28",
			"io.modelcontextprotocol/clientCapabilities": {},
			"io.modelcontextprotocol/clientInfo": {
				name: "raw-test",
				version: "1.0.0",
			},
		},
	},
});

async function rawPost(
	url: URL,
	headers: Record<string, string>,
	body: string,
): Promise<number> {
	return new Promise<number>((resolve, reject) => {
		const req = request(
			{
				hostname: url.hostname,
				port: url.port,
				path: url.pathname,
				method: "POST",
				headers: { ...headers, "content-length": Buffer.byteLength(body) },
			},
			(res) => {
				res.resume();
				res.on("end", () => resolve(res.statusCode ?? 0));
			},
		);
		req.on("error", reject);
		req.end(body);
	});
}

describe("MCP 2026-07-28 Streamable HTTP", () => {
	it("requires bearer auth and rejects hostile Host and Origin headers", async () => {
		const { url } = await start();
		const baseHeaders = {
			"content-type": "application/json",
			accept: "application/json, text/event-stream",
		};
		const unauthorized = await fetch(url, {
			method: "POST",
			headers: baseHeaders,
			body: modernListBody,
		});
		expect(unauthorized.status).toBe(401);

		const origin = await fetch(url, {
			method: "POST",
			headers: {
				...baseHeaders,
				authorization: "Bearer test-token",
				origin: "https://evil.example",
			},
			body: modernListBody,
		});
		expect(origin.status).toBe(403);

		const hostileHostStatus = await rawPost(
			url,
			{
				...baseHeaders,
				authorization: "Bearer test-token",
				host: "evil.example",
			},
			modernListBody,
		);
		expect(hostileHostStatus).toBe(403);
	});

	it("rejects legacy-only transport methods", async () => {
		const { url, token } = await start();
		for (const method of ["GET", "DELETE"]) {
			const response = await fetch(url, {
				method,
				headers: { authorization: `Bearer ${token}` },
			});
			expect(response.status).toBe(405);
		}
	});

	it("negotiates 2026-07-28 and completes a file workflow", async () => {
		const { url, token } = await start();
		const transport = new StreamableHTTPClientTransport(url, {
			requestInit: { headers: { authorization: `Bearer ${token}` } },
		});
		client = new Client(
			{ name: "workspace-test", version: "1.0.0" },
			{ versionNegotiation: { mode: { pin: "2026-07-28" } } },
		);
		await client.connect(transport);
		expect(client.getNegotiatedProtocolVersion()).toBe("2026-07-28");

		const tools = await client.listTools();
		expect(tools.tools.map((tool) => tool.name)).toEqual([
			"list_files",
			"read_file",
			"search_files",
			"create_file",
			"update_file",
			"move_file",
			"trash_file",
		]);

		const created = await client.callTool({
			name: "create_file",
			arguments: { path: "agent/hello.md", content: "# Agent hello\n" },
		});
		expect(created.isError).not.toBe(true);
		const createdValue = JSON.parse(text(created)) as { sha256: string };

		const read = await client.callTool({
			name: "read_file",
			arguments: { path: "agent/hello.md" },
		});
		expect(text(read)).toContain("Agent hello");

		const updated = await client.callTool({
			name: "update_file",
			arguments: {
				path: "agent/hello.md",
				content: "# Updated by agent\n",
				expected_sha256: createdValue.sha256,
			},
		});
		expect(updated.isError).not.toBe(true);

		const stale = await client.callTool({
			name: "update_file",
			arguments: {
				path: "agent/hello.md",
				content: "stale",
				expected_sha256: createdValue.sha256,
			},
		});
		expect(stale.isError).toBe(true);
		expect(text(stale)).toContain("conflict");
	});
});
