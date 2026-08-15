import path from "node:path";
import express, { type ErrorRequestHandler, type Express } from "express";
import type { WorkspaceStore } from "./workspace.js";
import { WorkspaceError } from "./workspace.js";

export function createPublicApp(
	store: WorkspaceStore,
	staticDir?: string,
): Express {
	const app = express();
	app.disable("x-powered-by");
	app.use((_req, res, next) => {
		res.setHeader("X-Content-Type-Options", "nosniff");
		res.setHeader("Referrer-Policy", "no-referrer");
		res.setHeader("X-Frame-Options", "DENY");
		res.setHeader(
			"Content-Security-Policy",
			"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
		);
		next();
	});
	app.use(express.json({ limit: "1mb" }));

	app.get("/api/health", (_req, res) =>
		res.json({ status: "ok", mode: "public-editable" }),
	);
	app.get("/api/files", async (_req, res, next) => {
		try {
			res.json({ files: await store.list() });
		} catch (cause) {
			next(cause);
		}
	});
	app.post("/api/files", async (req, res, next) => {
		try {
			const path = bodyString(req.body, "path");
			const content = bodyString(req.body, "content");
			res.status(201).json(await store.create(path, content));
		} catch (cause) {
			next(cause);
		}
	});
	app.get("/api/files/content", async (req, res, next) => {
		try {
			const requestedPath =
				typeof req.query.path === "string" ? req.query.path : "";
			res.json(await store.read(requestedPath));
		} catch (cause) {
			next(cause);
		}
	});
	app.put("/api/files/content", async (req, res, next) => {
		try {
			const path = bodyString(req.body, "path");
			const content = bodyString(req.body, "content");
			const expectedSha256 = bodyString(req.body, "expectedSha256");
			res.json(await store.update(path, content, expectedSha256));
		} catch (cause) {
			next(cause);
		}
	});
	app.get("/api/search", async (req, res, next) => {
		try {
			const query = typeof req.query.q === "string" ? req.query.q : "";
			res.json({ results: await store.search(query) });
		} catch (cause) {
			next(cause);
		}
	});
	app.all(/^\/api(?:\/.*)?$/, (req, res) => {
		if (req.method !== "GET")
			return res.status(405).json({ error: "API method is not allowed" });
		return res.status(404).json({ error: "API route not found" });
	});

	if (staticDir) {
		app.use(
			express.static(staticDir, { fallthrough: true, index: "index.html" }),
		);
		app.use((req, res, next) => {
			if (req.method !== "GET" || !req.accepts("html")) return next();
			res.sendFile(path.join(staticDir, "index.html"));
		});
	}

	const errors: ErrorRequestHandler = (cause, _req, res, _next) => {
		if (cause instanceof WorkspaceError) {
			const status =
				cause.code === "not_found"
					? 404
					: cause.code === "conflict"
						? 409
						: 400;
			res.status(status).json({ error: cause.message, code: cause.code });
			return;
		}
		console.error(cause);
		res.status(500).json({ error: "Internal workspace error" });
	};
	app.use(errors);
	return app;
}

function bodyString(body: unknown, key: string): string {
	if (!body || typeof body !== "object")
		throw new WorkspaceError("JSON request body is required", "invalid_input");
	const value = (body as Record<string, unknown>)[key];
	if (typeof value !== "string")
		throw new WorkspaceError(`${key} must be a string`, "invalid_input");
	return value;
}
