import { mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WorkspaceError, WorkspaceStore } from "./workspace.js";

const roots: string[] = [];
async function createStore() {
	const root = await mkdtemp(path.join(os.tmpdir(), "hubble-workspace-"));
	roots.push(root);
	const store = new WorkspaceStore(root);
	await store.init();
	return { root, store };
}

afterEach(async () => {
	await Promise.all(
		roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
	);
});

describe("WorkspaceStore", () => {
	it("starts without visible documents and supports the safe lifecycle", async () => {
		const { root, store } = await createStore();
		expect(await store.list()).toEqual([]);

		const created = await store.create("notes/hello.md", "# Hello\n");
		expect(created.path).toBe("notes/hello.md");
		expect(created.sha256).toMatch(/^[a-f0-9]{64}$/);
		expect((await store.read("notes/hello.md")).content).toBe("# Hello\n");

		const updated = await store.update(
			"notes/hello.md",
			"# Updated\n",
			created.sha256,
		);
		expect(updated.content).toBe("# Updated\n");
		await expect(
			store.update("notes/hello.md", "stale", created.sha256),
		).rejects.toMatchObject({ code: "conflict" });

		const moved = await store.move("notes/hello.md", "published/hello.md");
		expect(moved.path).toBe("published/hello.md");
		const trashed = await store.trash("published/hello.md");
		expect(trashed.trashedPath).toContain(".trash/");
		expect(await store.list()).toEqual([]);
		expect(await readFile(path.join(root, trashed.trashedPath), "utf8")).toBe(
			"# Updated\n",
		);
	});

	it("blocks traversal, absolute, hidden, non-Markdown, and symlink paths", async () => {
		const { root, store } = await createStore();
		const invalid = [
			"../escape.md",
			"/tmp/escape.md",
			".secret.md",
			"note.txt",
			"a/../../b.md",
			"a\\b.md",
		];
		for (const candidate of invalid) {
			await expect(store.create(candidate, "x")).rejects.toBeInstanceOf(
				WorkspaceError,
			);
		}

		const outside = await mkdtemp(path.join(os.tmpdir(), "hubble-outside-"));
		roots.push(outside);
		await mkdir(path.join(root, "notes"), { recursive: true });
		await symlink(outside, path.join(root, "notes", "linked"));
		await expect(
			store.create("notes/linked/escape.md", "x"),
		).rejects.toMatchObject({ code: "invalid_path" });
	});

	it("searches visible Markdown only", async () => {
		const { store } = await createStore();
		await store.create("one.md", "Alpha beta gamma");
		await store.create("nested/two.md", "Delta epsilon");
		const matches = await store.search("BETA");
		expect(matches).toHaveLength(1);
		expect(matches[0]?.path).toBe("one.md");
		expect(matches[0]?.snippet).toContain("Alpha beta");
	});
});
