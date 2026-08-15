import { wikiDisplayNameForTarget } from "@hubble.md/editor";
import {
	AppShellFrame,
	EditorView,
	NewNoteButton,
	Sidebar,
	type SidebarSortMode,
	Toolbar,
	type WikiTarget,
} from "@hubble.md/ui";
import { useEffect, useRef, useState } from "react";
import {
	createFile,
	type FileContent,
	listFiles,
	readFile,
	updateFile,
	type WorkspaceFile,
} from "./api";

type LoadState = "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

export default function App() {
	const [files, setFiles] = useState<WorkspaceFile[]>([]);
	const [currentPath, setCurrentPath] = useState<string | null>(null);
	const [document, setDocument] = useState<FileContent | null>(null);
	const [fileState, setFileState] = useState<LoadState>("loading");
	const [documentState, setDocumentState] = useState<LoadState>("ready");
	const [saveState, setSaveState] = useState<SaveState>("idle");
	const [error, setError] = useState<string | null>(null);
	const [sortMode, setSortMode] = useState<SidebarSortMode>("recent");
	const revisionRef = useRef<string | null>(null);

	async function refreshFiles() {
		const next = await listFiles();
		setFiles(next);
		return next;
	}

	useEffect(() => {
		const controller = new AbortController();
		setFileState("loading");
		listFiles(controller.signal)
			.then((next) => {
				setFiles(next);
				setFileState("ready");
			})
			.catch((cause: unknown) => {
				if (controller.signal.aborted) return;
				setError(
					cause instanceof Error
						? cause.message
						: "파일 목록을 불러오지 못했습니다.",
				);
				setFileState("error");
			});
		return () => controller.abort();
	}, []);

	useEffect(() => {
		if (!currentPath) {
			setDocument(null);
			revisionRef.current = null;
			setDocumentState("ready");
			return;
		}
		const controller = new AbortController();
		setDocumentState("loading");
		setError(null);
		setSaveState("idle");
		readFile(currentPath, controller.signal)
			.then((next) => {
				setDocument(next);
				revisionRef.current = next.sha256;
				setDocumentState("ready");
			})
			.catch((cause: unknown) => {
				if (controller.signal.aborted) return;
				setError(
					cause instanceof Error
						? cause.message
						: "문서를 불러오지 못했습니다.",
				);
				setDocumentState("error");
			});
		return () => controller.abort();
	}, [currentPath]);

	async function handleNewFile() {
		const requested = window.prompt("새 Markdown 파일 경로", "새-문서.md");
		if (!requested?.trim()) return;
		const path = requested.trim().endsWith(".md")
			? requested.trim()
			: `${requested.trim()}.md`;
		setSaveState("saving");
		setError(null);
		try {
			const next = await createFile(
				path,
				`# ${wikiDisplayNameForTarget(path)}\n\n`,
			);
			revisionRef.current = next.sha256;
			setDocument(next);
			await refreshFiles();
			setCurrentPath(next.path);
			setDocumentState("ready");
			setSaveState("saved");
		} catch (cause: unknown) {
			setError(
				cause instanceof Error ? cause.message : "문서를 만들지 못했습니다.",
			);
			setSaveState("error");
		}
	}

	async function handleSave(path: string, markdown: string) {
		const expectedSha256 = revisionRef.current;
		if (!expectedSha256) throw new Error("저장할 문서 버전이 없습니다.");
		setSaveState("saving");
		setError(null);
		try {
			const next = await updateFile(path, markdown, expectedSha256);
			revisionRef.current = next.sha256;
			setDocument(next);
			setFiles((current) =>
				current.map((file) => (file.path === next.path ? next : file)),
			);
			setSaveState("saved");
		} catch (cause: unknown) {
			const message =
				cause instanceof Error ? cause.message : "저장하지 못했습니다.";
			setError(message);
			setSaveState("error");
			throw cause;
		}
	}

	const wikiTargets: WikiTarget[] = files.map((file) => ({
		path: file.path,
		target: file.path,
		title: wikiDisplayNameForTarget(file.path),
	}));
	const saveLabel =
		saveState === "saving"
			? "저장 중…"
			: saveState === "saved"
				? "저장됨"
				: saveState === "error"
					? "저장 오류"
					: "편집 가능";

	return (
		<AppShellFrame
			toolbar={
				<Toolbar
					currentPath={currentPath}
					sidebarOpen
					platformInset={false}
					rightSlot={
						<>
							<NewNoteButton onClick={() => void handleNewFile()} />
							<span className="read-only-badge">Access · {saveLabel}</span>
						</>
					}
				/>
			}
			sidebar={
				<Sidebar
					files={files}
					currentPath={currentPath}
					pendingPath={documentState === "loading" ? currentPath : null}
					sortMode={sortMode}
					storageScope="md-yongduct-work"
					header={
						<div className="min-w-0 px-2.5 py-2">
							<p className="truncate text-sm font-medium">md.yongduct.work</p>
							<p className="truncate text-xs text-muted-foreground">
								격리된 Markdown workspace
							</p>
						</div>
					}
					onSortModeChange={setSortMode}
					onSelectFile={setCurrentPath}
					emptyState={
						fileState === "ready" ? (
							<p className="px-2.5 py-3 text-xs leading-5 text-muted-foreground">
								아직 문서가 없습니다. 오른쪽 위 새 문서 버튼으로 시작하세요.
							</p>
						) : null
					}
				/>
			}
		>
			<WorkspaceContent
				state={currentPath ? documentState : fileState}
				error={error}
				document={document}
				files={files}
				wikiTargets={wikiTargets}
				onSave={handleSave}
				onNewFile={handleNewFile}
				onOpenWikiLink={(target) => {
					const path = target.split("#")[0];
					if (path && files.some((file) => file.path === path))
						setCurrentPath(path);
				}}
			/>
		</AppShellFrame>
	);
}

function WorkspaceContent({
	state,
	error,
	document,
	files,
	wikiTargets,
	onSave,
	onNewFile,
	onOpenWikiLink,
}: {
	state: LoadState;
	error: string | null;
	document: FileContent | null;
	files: WorkspaceFile[];
	wikiTargets: WikiTarget[];
	onSave: (path: string, markdown: string) => Promise<void>;
	onNewFile: () => Promise<void>;
	onOpenWikiLink: (target: string) => void;
}) {
	if (state === "loading") {
		return <StatusMessage>불러오는 중…</StatusMessage>;
	}
	if (state === "error") {
		return (
			<StatusMessage tone="error">
				{error ?? "Workspace를 불러오지 못했습니다."}
			</StatusMessage>
		);
	}
	if (!document) {
		return (
			<div className="flex h-full items-center justify-center p-8">
				<div className="max-w-md text-center">
					<p className="text-sm font-medium">격리된 Markdown 공간</p>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">
						{files.length === 0
							? "현재 volume은 비어 있습니다. 새 문서를 만들어 바로 편집할 수 있습니다."
							: "왼쪽에서 문서를 선택하세요."}
					</p>
					{files.length === 0 ? (
						<button
							type="button"
							className="mt-4 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
							onClick={() => void onNewFile()}
						>
							첫 문서 만들기
						</button>
					) : null}
				</div>
			</div>
		);
	}
	return (
		<EditorView
			key={document.path}
			path={document.path}
			initialMarkdown={document.content}
			editable
			wikiTargets={wikiTargets}
			onLocalChange={() => undefined}
			onSave={onSave}
			onOpenExternalLink={(href) => {
				window.open(href, "_blank", "noopener,noreferrer");
			}}
			onOpenWikiLink={onOpenWikiLink}
		/>
	);
}

function StatusMessage({
	children,
	tone = "muted",
}: {
	children: React.ReactNode;
	tone?: "muted" | "error";
}) {
	return (
		<div className="flex h-full items-center justify-center p-6">
			<p
				className={
					tone === "error"
						? "text-sm text-destructive"
						: "text-sm text-muted-foreground"
				}
			>
				{children}
			</p>
		</div>
	);
}
