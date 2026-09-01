// @ts-check

const { defineConfig } = require("eslint/config");
const js = require("@eslint/js");
const globals = require("globals");

module.exports = defineConfig([
	// ========== 全局忽略（替代 .eslintignore）==========
	{
		ignores: ["dist/**", "build/**", "node_modules/**", ".git/**", "**/*.min.js"],
	},

	// ========== 基础推荐规则（全员生效）==========
	// js.configs.recommended,

	// ========== Web 前端代码（ES Module + 浏览器环境）==========
	{
		files: ["js/**/*.js"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				...globals.browser,
			},
		},
	},

	// ========== Node.js 构建脚本（CommonJS）==========
	{
		files: ["tools/**/*.js", "*.config.js", "*.config.cjs"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs",
			globals: {
				...globals.node,
			},
		},
	},

	// ========== 你原来的自定义规则（全员生效）==========
	{
		rules: {
			curly: ["warn", "multi"],
			"object-curly-newline": "warn",
			eqeqeq: "warn",
			"no-throw-literal": "warn",
			semi: "off",
		},
	},
]);
