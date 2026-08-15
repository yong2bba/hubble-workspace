import { wikiDisplayNameForTarget } from "@hubble.md/editor";
import {
	AppShellFrame,
	EditorView,
	Sidebar,
	type SidebarSortMode,
	Toolbar,
	type WikiTarget,
} from "@hubble.md/ui";
import { useEffect, useState } from "react";
import {
	type FileContent,
	listFiles,
	readFile,
	type WorkspaceFile,
} from "./api";

type LoadState = "loading" | "ready" | "error";

export default function App() {
	const [files, setFiles] = useState<WorkspaceFile[]>([]);
	const [currentPath, setCurrentPath] = useState<string | null>(null);
	const [document, setDocument] = useState<FileContent | null>(null);
	const [fileState, setFileState] = useState<LoadState>("loading");
	const [documentState, setDocumentState] = useState<LoadState>("ready");
	const [error, setError] = useState<string | null>(null);
	const [sortMode, setSortMode] = useState<SidebarSortMode>("recent");

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
			setDocumentState("ready");
			return;
		}
		const controller = new AbortController();
		setDocumentState("loading");
		setError(null);
		readFile(currentPath, controller.signal)
			.then((next) => {
				setDocument(next);
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

	const wikiTargets: WikiTarget[] = files.map((file) => ({
		path: file.path,
		target: file.path,
		title: wikiDisplayNameForTarget(file.path),
	}));

	return (
		<AppShellFrame
			toolbar={
				<Toolbar
					currentPath={currentPath}
					sidebarOpen
					platformInset={false}
					rightSlot={
						<span className="read-only-badge">Public · 읽기 전용</span>
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
								아직 공개 문서가 없습니다. 이 공간은 기존 Artifact Garden이나
								개인 문서를 가져오지 않고 시작했습니다.
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
	onOpenWikiLink,
}: {
	state: LoadState;
	error: string | null;
	document: FileContent | null;
	files: WorkspaceFile[];
	wikiTargets: WikiTarget[];
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
					<p className="text-sm font-medium">격리된 공개 Markdown 공간</p>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">
						{files.length === 0
							? "현재 volume은 비어 있습니다. 문서는 인증된 내부 MCP를 통해서만 추가됩니다."
							: "왼쪽에서 문서를 선택하세요."}
					</p>
				</div>
			</div>
		);
	}
	return (
		<EditorView
			key={`${document.path}:${document.sha256}`}
			path={document.path}
			initialMarkdown={document.content}
			editable={false}
			wikiTargets={wikiTargets}
			onLocalChange={() => undefined}
			onSave={() => undefined}
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
