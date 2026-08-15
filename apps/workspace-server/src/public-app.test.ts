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
	it("lists and reads Markdown with security headers", async () => {
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
		expect(list.headers.get("content-security-policy")).toContain(
			"frame-src 'none'",
		);
	});

	it("creates and updates Markdown while destructive HTTP methods stay blocked", async () => {
		const base = await start();
		const created = await fetch(`${base}/api/files`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ path: "drafts/new.md", content: "# New\n" }),
		});
		expect(created.status).toBe(201);
		const createdBody = (await created.json()) as { sha256: string };

		const updated = await fetch(`${base}/api/files/content`, {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				path: "drafts/new.md",
				content: "# Updated\n",
				expectedSha256: createdBody.sha256,
			}),
		});
		expect(updated.status).toBe(200);
		expect(((await updated.json()) as { content: string }).content).toBe(
			"# Updated\n",
		);

		const destructive = await fetch(`${base}/api/files/content`, {
			method: "DELETE",
		});
		expect(destructive.status).toBe(405);
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
