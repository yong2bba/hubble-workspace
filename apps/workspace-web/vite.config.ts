import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { reactCompilerPlugin } from "../../config/react-compiler-audit";

export default defineConfig({
	plugins: [
		react({ babel: { plugins: [reactCompilerPlugin("workspace-web")] } }),
		icons({ compiler: "jsx", jsx: "react" }),
		tailwindcss(),
	],
	server: {
		port: 5174,
		proxy: { "/api": "http://127.0.0.1:3000" },
	},
});
