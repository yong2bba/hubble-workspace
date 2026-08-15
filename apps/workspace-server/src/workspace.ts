import { createHash, randomUUID } from "node:crypto";
import {
	appendFile,
	type FileHandle,
	lstat,
	mkdir,
	open,
	opendir,
	readFile,
	realpath,
	rename,
	stat,
} from "node:fs/promises";
import path from "node:path";

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_RESULTS = 500;

export type WorkspaceFile = {
	path: string;
	size: number;
	modifiedAt: number;
	sha256: string;
};

export type WorkspaceContent = WorkspaceFile & { content: string };

export class WorkspaceError extends Error {
	constructor(
		message: string,
		readonly code:
			| "invalid_path"
			| "not_found"
			| "conflict"
			| "too_large"
			| "io_error",
	) {
		super(message);
	}
}

export class WorkspaceStore {
	root: string;

	constructor(root: string) {
		this.root = path.resolve(root);
	}

	async init(): Promise<void> {
		await mkdir(this.root, { recursive: true });
		this.root = await realpath(this.root);
		await mkdir(path.join(this.root, ".trash"), { recursive: true });
		await mkdir(path.join(this.root, ".workspace"), { recursive: true });
		const rootInfo = await lstat(this.root);
		if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
			throw new WorkspaceError(
				"WORKSPACE_ROOT must be a real directory",
				"invalid_path",
			);
		}
	}

	async list(): Promise<WorkspaceFile[]> {
		const output: WorkspaceFile[] = [];
		await this.walk(this.root, "", output);
		output.sort(
			(a, b) => b.modifiedAt - a.modifiedAt || a.path.localeCompare(b.path),
		);
		return output.slice(0, MAX_RESULTS);
	}

	async read(relativePath: string): Promise<WorkspaceContent> {
		const target = await this.resolveExisting(relativePath);
		const info = await stat(target);
		if (!info.isFile())
			throw new WorkspaceError("Markdown file not found", "not_found");
		if (info.size > MAX_FILE_BYTES) {
			throw new WorkspaceError(
				`File exceeds ${MAX_FILE_BYTES} bytes`,
				"too_large",
			);
		}
		const content = await readFile(target, "utf8");
		return {
			path: this.validatePath(relativePath),
			size: info.size,
			modifiedAt: info.mtimeMs,
			sha256: sha256(content),
			content,
		};
	}

	async search(
		query: string,
		limit = 20,
	): Promise<Array<WorkspaceFile & { snippet: string }>> {
		const needle = query.trim().toLocaleLowerCase();
		if (!needle) return [];
		const files = await this.list();
		const results: Array<WorkspaceFile & { snippet: string }> = [];
		for (const file of files) {
			const item = await this.read(file.path);
			const lower = item.content.toLocaleLowerCase();
			const index = lower.indexOf(needle);
			if (index === -1 && !file.path.toLocaleLowerCase().includes(needle))
				continue;
			const start = index < 0 ? 0 : Math.max(0, index - 80);
			const snippet = item.content
				.slice(start, start + 240)
				.replace(/\s+/g, " ")
				.trim();
			results.push({ ...file, snippet });
			if (results.length >= Math.min(Math.max(limit, 1), 100)) break;
		}
		return results;
	}

	async create(
		relativePath: string,
		content: string,
	): Promise<WorkspaceContent> {
		this.assertContent(content);
		const normalized = this.validatePath(relativePath);
		const target = await this.resolveForCreate(normalized);
		await mkdir(path.dirname(target), { recursive: true });
		await this.assertNoSymlink(normalized, true);
		let handle: FileHandle | undefined;
		try {
			handle = await open(target, "wx", 0o640);
			await handle.writeFile(content, "utf8");
		} catch (cause: unknown) {
			if (isNodeError(cause) && cause.code === "EEXIST") {
				throw new WorkspaceError("File already exists", "conflict");
			}
			throw cause;
		} finally {
			await handle?.close();
		}
		await this.audit("create", { path: normalized, sha256: sha256(content) });
		return this.read(normalized);
	}

	async update(
		relativePath: string,
		content: string,
		expectedSha256: string,
	): Promise<WorkspaceContent> {
		this.assertContent(content);
		if (!/^[a-f0-9]{64}$/.test(expectedSha256)) {
			throw new WorkspaceError(
				"expected_sha256 must be a lowercase SHA-256",
				"conflict",
			);
		}
		const normalized = this.validatePath(relativePath);
		const current = await this.read(normalized);
		if (current.sha256 !== expectedSha256) {
			throw new WorkspaceError(
				`File changed: expected ${expectedSha256}, current ${current.sha256}`,
				"conflict",
			);
		}
		const target = await this.resolveExisting(normalized);
		const temp = `${target}.tmp-${randomUUID()}`;
		let handle: FileHandle | undefined;
		try {
			handle = await open(temp, "wx", 0o640);
			await handle.writeFile(content, "utf8");
			await handle.sync();
			await handle.close();
			handle = undefined;
			await rename(temp, target);
		} finally {
			await handle?.close();
		}
		await this.audit("update", {
			path: normalized,
			previousSha256: current.sha256,
			sha256: sha256(content),
		});
		return this.read(normalized);
	}

	async move(fromPath: string, toPath: string): Promise<WorkspaceContent> {
		const from = this.validatePath(fromPath);
		const to = this.validatePath(toPath);
		const source = await this.resolveExisting(from);
		const destination = await this.resolveForCreate(to);
		await mkdir(path.dirname(destination), { recursive: true });
		await this.assertNoSymlink(to, true);
		try {
			await lstat(destination);
			throw new WorkspaceError("Destination already exists", "conflict");
		} catch (cause: unknown) {
			if (!(isNodeError(cause) && cause.code === "ENOENT")) throw cause;
		}
		await rename(source, destination);
		await this.audit("move", { from, to });
		return this.read(to);
	}

	async trash(
		relativePath: string,
	): Promise<{ path: string; trashedPath: string }> {
		const normalized = this.validatePath(relativePath);
		const source = await this.resolveExisting(normalized);
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const trashedPath = path.posix.join(
			".trash",
			`${timestamp}-${randomUUID()}`,
			normalized,
		);
		const destination = path.join(this.root, ...trashedPath.split("/"));
		await mkdir(path.dirname(destination), { recursive: true });
		await rename(source, destination);
		await this.audit("trash", { path: normalized, trashedPath });
		return { path: normalized, trashedPath };
	}

	validatePath(input: string): string {
		if (
			typeof input !== "string" ||
			!input ||
			input.includes("\0") ||
			input.includes(String.fromCharCode(92))
		) {
			throw new WorkspaceError(
				"Path must be a non-empty POSIX relative path",
				"invalid_path",
			);
		}
		if (path.posix.isAbsolute(input) || input !== path.posix.normalize(input)) {
			throw new WorkspaceError(
				"Absolute and non-normalized paths are not allowed",
				"invalid_path",
			);
		}
		const segments = input.split("/");
		if (
			segments.some(
				(segment) =>
					!segment ||
					segment === "." ||
					segment === ".." ||
					segment.startsWith("."),
			)
		) {
			throw new WorkspaceError(
				"Hidden and traversal path segments are not allowed",
				"invalid_path",
			);
		}
		if (!input.toLocaleLowerCase().endsWith(".md")) {
			throw new WorkspaceError(
				"Only Markdown (.md) files are allowed",
				"invalid_path",
			);
		}
		return input;
	}

	private async walk(
		absoluteDir: string,
		relativeDir: string,
		output: WorkspaceFile[],
	): Promise<void> {
		const directory = await opendir(absoluteDir);
		for await (const entry of directory) {
			if (entry.name.startsWith(".") || entry.isSymbolicLink()) continue;
			const relative = relativeDir
				? `${relativeDir}/${entry.name}`
				: entry.name;
			const absolute = path.join(absoluteDir, entry.name);
			if (entry.isDirectory()) {
				await this.walk(absolute, relative, output);
			} else if (
				entry.isFile() &&
				relative.toLocaleLowerCase().endsWith(".md")
			) {
				const info = await stat(absolute);
				if (info.size > MAX_FILE_BYTES) continue;
				const content = await readFile(absolute, "utf8");
				output.push({
					path: relative,
					size: info.size,
					modifiedAt: info.mtimeMs,
					sha256: sha256(content),
				});
				if (output.length >= MAX_RESULTS) return;
			}
		}
	}

	private async resolveExisting(relativePath: string): Promise<string> {
		const normalized = this.validatePath(relativePath);
		await this.assertNoSymlink(normalized, false);
		const target = path.join(this.root, ...normalized.split("/"));
		try {
			const resolved = await realpath(target);
			this.assertInsideRoot(resolved);
			return resolved;
		} catch (cause: unknown) {
			if (isNodeError(cause) && cause.code === "ENOENT") {
				throw new WorkspaceError("Markdown file not found", "not_found");
			}
			throw cause;
		}
	}

	private async resolveForCreate(relativePath: string): Promise<string> {
		const normalized = this.validatePath(relativePath);
		await this.assertNoSymlink(normalized, true);
		const target = path.join(this.root, ...normalized.split("/"));
		this.assertInsideRoot(target);
		return target;
	}

	private async assertNoSymlink(
		relativePath: string,
		allowMissing: boolean,
	): Promise<void> {
		let current = this.root;
		const segments = relativePath.split("/");
		for (let index = 0; index < segments.length; index += 1) {
			const segment = segments[index];
			if (!segment) {
				throw new WorkspaceError(
					"Empty path segment is not allowed",
					"invalid_path",
				);
			}
			current = path.join(current, segment);
			try {
				const info = await lstat(current);
				if (info.isSymbolicLink()) {
					throw new WorkspaceError(
						"Symlinks are not allowed in workspace paths",
						"invalid_path",
					);
				}
			} catch (cause: unknown) {
				if (allowMissing && isNodeError(cause) && cause.code === "ENOENT")
					return;
				throw cause;
			}
		}
	}

	private assertInsideRoot(target: string): void {
		const relative = path.relative(this.root, target);
		if (relative.startsWith("..") || path.isAbsolute(relative)) {
			throw new WorkspaceError("Path escapes workspace root", "invalid_path");
		}
	}

	private assertContent(content: string): void {
		if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) {
			throw new WorkspaceError(
				`Content exceeds ${MAX_FILE_BYTES} bytes`,
				"too_large",
			);
		}
	}

	private async audit(
		action: string,
		detail: Record<string, unknown>,
	): Promise<void> {
		const event = JSON.stringify({
			at: new Date().toISOString(),
			action,
			...detail,
		});
		await appendFile(
			path.join(this.root, ".workspace", "audit.jsonl"),
			`${event}
`,
			{ mode: 0o640 },
		);
		console.info(event);
	}
}

export function sha256(content: string): string {
	return createHash("sha256").update(content, "utf8").digest("hex");
}

function isNodeError(cause: unknown): cause is NodeJS.ErrnoException {
	return cause instanceof Error && "code" in cause;
}
