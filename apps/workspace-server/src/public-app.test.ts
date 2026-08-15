import { mkdtemp, rm } from "node:fs/promises";
import type { Server } from "node:http";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPublicApp } from "./public-app.js";
import { WorkspaceStore } from "./workspace.js";

let server: Server | undefined;
let root: string | undefined;
afterEach(async () => {
	const activeServer = server;
	if (activeServer)
		await new Promise<void>((resolve) => activeServer.close(() => resolve()));
	if (root) await rm(root, { recursive: true, force: true });
	server = undefined;
	root = undefined;
});

async function start() {
	root = await mkdtemp(path.join(os.tmpdir(), "hubble-public-"));
	const store = new WorkspaceStore(root);
	await store.init();
	await store.create("public.md", "# Public\n");
	const activeServer = createPublicApp(store).listen(0, "127.0.0.1");
	server = activeServer;
	await new Promise<void>((resolve) => activeServer.once("listening", resolve));
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("No test address");
	return `http://127.0.0.1:${address.port}`;
}

describe("public HTTP API", () => {
	it("lists and reads but rejects mutation methods", async () => {
		const base = await start();
		const list = await fetch(`${base}/api/files`);
		expect(list.status).toBe(200);
		expect(
			((await list.json()) as { files: Array<{ path: string }> }).files[0]
				?.path,
		).toBe("public.md");

		const content = await fetch(`${base}/api/files/content?path=public.md`);
		expect(content.status).toBe(200);
		expect(((await content.json()) as { content: string }).content).toBe(
			"# Public\n",
		);

		const mutation = await fetch(`${base}/api/files`, { method: "POST" });
		expect(mutation.status).toBe(405);
		expect(await mutation.json()).toMatchObject({
			error: "Public API is read-only",
		});
		expect(list.headers.get("content-security-policy")).toContain(
			"frame-src 'none'",
		);
	});

	it("does not disclose traversal paths", async () => {
		const base = await start();
		const response = await fetch(
			`${base}/api/files/content?path=${encodeURIComponent("../secret.md")}`,
		);
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ code: "invalid_path" });
	});
});
