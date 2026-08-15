export type WorkspaceFile = {
	path: string;
	size: number;
	modifiedAt: number;
	sha256: string;
};

export type FileContent = WorkspaceFile & { content: string };

async function readJson<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as {
			error?: string;
		} | null;
		throw new Error(body?.error ?? `Request failed (${response.status})`);
	}
	return response.json() as Promise<T>;
}

export async function listFiles(
	signal?: AbortSignal,
): Promise<WorkspaceFile[]> {
	const data = await readJson<{ files: WorkspaceFile[] }>(
		await fetch("/api/files", { signal }),
	);
	return data.files;
}

export async function readFile(
	path: string,
	signal?: AbortSignal,
): Promise<FileContent> {
	return readJson<FileContent>(
		await fetch(`/api/files/content?path=${encodeURIComponent(path)}`, {
			signal,
		}),
	);
}
