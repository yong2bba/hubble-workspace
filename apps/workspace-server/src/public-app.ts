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

	app.get("/api/health", (_req, res) =>
		res.json({ status: "ok", mode: "public-read-only" }),
	);
	app.get("/api/files", async (_req, res, next) => {
		try {
			res.json({ files: await store.list() });
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
			return res.status(405).json({ error: "Public API is read-only" });
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
