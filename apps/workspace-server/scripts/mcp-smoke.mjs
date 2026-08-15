import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = process.env.MCP_URL;
const token = process.env.MCP_API_TOKEN;
if (!url || !token) throw new Error("MCP_URL and MCP_API_TOKEN are required");

const client = new Client({ name: "hubble-workspace-smoke", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL(url), {
	requestInit: { headers: { authorization: `Bearer ${token}` } },
});
await client.connect(transport);
try {
	const tools = await client.listTools();
	const files = await client.callTool({ name: "list_files", arguments: {} });
	const expected = [
		"list_files",
		"read_file",
		"search_files",
		"create_file",
		"update_file",
		"move_file",
		"trash_file",
	];
	const names = tools.tools.map((tool) => tool.name);
	if (JSON.stringify(names) !== JSON.stringify(expected)) {
		throw new Error(`Unexpected tool list: ${names.join(",")}`);
	}

	const writePath = process.env.SMOKE_WRITE_PATH;
	if (writePath) {
		const created = await client.callTool({
			name: "create_file",
			arguments: { path: writePath, content: "# Container smoke\n" },
		});
		if (created.isError) throw new Error("create_file smoke failed");
		const trashed = await client.callTool({
			name: "trash_file",
			arguments: { path: writePath },
		});
		if (trashed.isError) throw new Error("trash_file smoke failed");
	}
	console.log(JSON.stringify({ ok: true, tools: names.length, files }));
} finally {
	await client.close();
}
