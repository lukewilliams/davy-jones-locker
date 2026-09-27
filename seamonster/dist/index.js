import { r as e, t } from "./menu-ByXvYfw3.js";
import { Fragment as n, computed as r, createBlock as i, createCommentVNode as a, createElementBlock as o, createElementVNode as s, createTextVNode as c, createVNode as l, inject as u, normalizeClass as d, normalizeStyle as f, onBeforeUnmount as p, onMounted as m, openBlock as h, provide as g, reactive as _, ref as v, renderList as y, renderSlot as b, toDisplayString as x, unref as S, useId as C, vModelText as w, watch as T, withCtx as E, withDirectives as D, withKeys as O, withModifiers as k } from "vue";
import { ConnectionMode as A, Handle as j, Position as M, VueFlow as N, getBezierPath as P, useNodeConnections as F, useVueFlow as I } from "@vue-flow/core";
import { Background as L } from "@vue-flow/background";
//#region components/NodeFace.vue
var R = { class: "flow-node-status" }, ee = { class: "flow-node-label" }, z = {
	__name: "NodeFace",
	props: {
		label: {
			type: String,
			required: !0
		},
		status: {
			type: String,
			default: ""
		},
		selected: Boolean
	},
	setup(e) {
		return (t, n) => (h(), o("div", { class: d(["flow-node-face", { "is-selected": e.selected }]) }, [s("span", R, x(e.status), 1), s("span", ee, x(e.label), 1)], 2));
	}
}, B = [
	{
		id: "fetch",
		label: "Fetch"
	},
	{
		id: "modify",
		label: "Modify"
	},
	{
		id: "debug",
		label: "Debug"
	},
	{
		id: "import",
		label: "Import"
	},
	{
		id: "export",
		label: "Export"
	},
	{
		id: "custom",
		label: "Custom"
	}
], V = {
	"sql-query": {
		label: "SQLQuery",
		category: "fetch",
		idPrefix: "sqlnode",
		runs: !0,
		outputName: !0
	},
	"3d-asset": {
		label: "3D Asset",
		category: "fetch",
		idPrefix: "asset"
	},
	"http-request": {
		label: "HTTP Request",
		category: "fetch",
		idPrefix: "httprequest"
	},
	"python-script": {
		label: "PythonScript",
		category: "modify",
		idPrefix: "pythonscript",
		runs: !0,
		outputName: !0,
		where: "server"
	},
	javascript: {
		label: "JavaScript",
		category: "modify",
		idPrefix: "javascript",
		runs: !0,
		outputName: !0,
		where: "browser"
	},
	"geometry-script": {
		label: "GeometryScript",
		category: "modify",
		idPrefix: "geoscript"
	},
	hlsl: {
		label: "HLSL",
		category: "modify",
		idPrefix: "hlsl"
	},
	"network-fuse": {
		label: "Network Fuse",
		category: "modify",
		idPrefix: "networkfuse",
		runs: !0
	},
	debug: {
		label: "Debug",
		category: "debug",
		idPrefix: "debug"
	},
	"data-ingest": {
		label: "DataIngest",
		category: "import",
		idPrefix: "dataingest",
		runs: !0,
		outputName: !0
	},
	"dxf-import": {
		label: "DXF Import",
		category: "import",
		idPrefix: "dxfimport",
		runs: !0
	},
	"data-export": {
		label: "DataExport",
		category: "export",
		idPrefix: "dataexport",
		runs: !0
	},
	subnet: {
		label: "Subnet",
		category: "custom",
		idPrefix: "subnet",
		runs: !0
	}
}, H = "application/x-flow-node-kind", U = (e) => Object.keys(V).filter((t) => V[t].category === e);
function te(e) {
	let t = V[e];
	return {
		inputs: t.inputs ?? 1,
		outputs: t.outputs ?? 1
	};
}
function ne(e, t) {
	let n = 1;
	for (; t.has(`${e}${n}`);) n++;
	return `${e}${n}`;
}
var re = (e, t) => ne(V[e].idPrefix, new Set(t));
function ie(e, t) {
	let n = new Set(t);
	return n.has(e) ? ne(e, n) : e;
}
var ae = (e, t) => RegExp(`^${V[e].idPrefix}\\d+$`).test(t);
function oe(e) {
	let t = e.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
	return /^\d/.test(t) ? `_${t}` : t;
}
var W = (e, t) => `${e}_${t.outputSuffix || "data"}`, se = (e) => V[e.kind]?.where === "server" || !!e.sqlServerTables?.length, ce = (e) => Array.from({ length: e }, (t, n) => `${(n + 1) / (e + 1) * 100}%`), le = Symbol("flow-open-menu"), ue = [
	{ command: "panel.toggleCollapsed" },
	{
		type: "checkbox",
		label: "Linked",
		command: "panel.toggleLinked",
		shortcut: "Ctrl+Space"
	},
	{ type: "separator" },
	{
		label: "Set unlinked size to current",
		command: "panel.resetUnlinked"
	}
], G = [
	{
		label: "Reset",
		command: "node.reset"
	},
	{ type: "separator" },
	{
		label: "Delete node",
		command: "node.delete",
		shortcut: "Del"
	}
], de = [{
	label: "Delete wire",
	command: "wire.delete",
	shortcut: "Del"
}], fe = (e) => B.map((t) => ({
	type: "submenu",
	label: t.label,
	badge: { class: `flow-node--${t.id}` },
	items: U(t.id).map((t) => ({
		label: V[t].label,
		command: e,
		args: { kind: t }
	}))
})), pe = fe("node.addConnected");
function me(e, t) {
	return {
		commands: {
			"panel.toggleCollapsed": {
				label: (t) => e.find(t).collapsed ? "Expand" : "Collapse",
				run: (t) => e.setCollapsed(t, !e.find(t).collapsed)
			},
			"panel.toggleLinked": {
				checked: (t) => e.find(t).linked,
				run: (t) => e.toggleLinked(t)
			},
			"panel.resetUnlinked": (t) => e.resetUnlinkedRect(t),
			"panels.toggleMaximise": {
				label: () => e.maximiseAction.value === "restore" ? "Restore panels" : "Collapse all panels",
				disabled: () => !e.maximiseAction.value,
				run: () => e.toggleMaximise()
			},
			"node.add": (e, { kind: n }) => t.addNode(n),
			"node.addConnected": ({ point: e, from: n }, { kind: r }) => t.addConnectedNode(r, e, n),
			"node.reset": {
				disabled: (e) => !t.run.status[e] || t.run.status[e] === "running",
				run: (e) => t.resetNode(e)
			},
			"node.delete": (e) => t.remove({ nodeIds: [e] }),
			"wire.delete": (e) => t.remove({ edgeIds: [e] })
		},
		canvasMenu: [{
			type: "submenu",
			label: "Nodes",
			items: fe("node.add")
		}, {
			type: "submenu",
			label: "Panels",
			items: () => [
				...e.panels.map((t) => ({
					type: "checkbox",
					label: t.title,
					shortcut: t.hotkey,
					checked: !t.collapsed,
					action: () => e.setCollapsed(t.name, !t.collapsed)
				})),
				{ type: "separator" },
				{
					command: "panels.toggleMaximise",
					shortcut: "Ctrl+Space"
				}
			]
		}]
	};
}
//#endregion
//#region lib/fileFormats.js
var K = {
	csv: {
		label: "CSV",
		extensions: ["csv"],
		contentType: "text/csv",
		read: !0,
		write: !0
	},
	tsv: {
		label: "TSV",
		extensions: ["tsv", "tab"],
		contentType: "text/tab-separated-values",
		read: !0,
		write: !0
	},
	json: {
		label: "JSON",
		extensions: ["json"],
		contentType: "application/json",
		read: !0,
		write: !0
	},
	geojson: {
		label: "GeoJSON",
		extensions: ["geojson"],
		contentType: "application/geo+json",
		read: !0,
		write: !0
	},
	parquet: {
		label: "Parquet",
		extensions: ["parquet"],
		contentType: "application/vnd.apache.parquet",
		read: !0,
		write: !0
	},
	xlsx: {
		label: "Excel (.xlsx)",
		extensions: ["xlsx"],
		contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		read: !0,
		write: !0,
		multi: "read"
	},
	sqlite: {
		label: "SQLite",
		extensions: [
			"sqlite",
			"sqlite3",
			"db"
		],
		contentType: "application/vnd.sqlite3",
		read: !0,
		write: !0,
		multi: "read-write"
	}
}, he = Object.keys(K).filter((e) => K[e].read), ge = Object.keys(K).filter((e) => K[e].write), _e = he.flatMap((e) => K[e].extensions).map((e) => `.${e}`).join(","), ve = (e) => /\.([^./\\]+)$/.exec(e)?.[1].toLowerCase() ?? "";
function ye(e) {
	let t = ve(e);
	return Object.keys(K).find((e) => K[e].extensions.includes(t)) ?? null;
}
function be(e, t) {
	let { extensions: n } = K[t];
	return n.includes(ve(e)) ? e : `${e}.${n[0]}`;
}
var xe = (e) => e.replace(/\.[^.]*$/, "").replace(/[_\-\s]+/g, " ").trim();
function Se(e) {
	if (e < 1024) return `${e} B`;
	let t = [
		"KB",
		"MB",
		"GB"
	], n = e, r = -1;
	for (; n >= 1024 && r < t.length - 1;) n /= 1024, r++;
	return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${t[r]}`;
}
//#endregion
//#region lib/graphDocument.js
var Ce = {
	format: "pipeline",
	nodes: [],
	edges: []
};
function we(e, t, n) {
	return {
		format: "pipeline",
		nodes: e.map(({ id: e, position: t, data: n }) => ({
			id: e,
			...n,
			position: {
				x: t.x,
				y: t.y
			}
		})),
		edges: t.map(({ id: e, source: t, sourceHandle: n, target: r, targetHandle: i }) => ({
			id: e,
			source: t,
			sourceHandle: n,
			target: r,
			targetHandle: i
		})),
		viewport: {
			x: n.x,
			y: n.y,
			zoom: n.zoom
		}
	};
}
var Te = (e) => Number.isFinite(e?.x) && Number.isFinite(e?.y);
function Ee(e) {
	if (e?.format !== "pipeline" || !Array.isArray(e.nodes) || !Array.isArray(e.edges)) return null;
	let t = e.nodes.filter((e) => typeof e?.id == "string" && V[e.kind] && Te(e.position)).map(({ id: e, position: t, ...n }) => ({
		id: e,
		type: "pipeline",
		position: {
			x: t.x,
			y: t.y
		},
		data: n
	})), n = new Set(t.map((e) => e.id));
	return {
		nodes: t,
		edges: e.edges.filter((e) => n.has(e?.source) && n.has(e?.target)),
		viewport: Te(e.viewport) && Number.isFinite(e.viewport.zoom) ? e.viewport : null
	};
}
//#endregion
//#region lib/jsSandbox.js
var De = 30;
function Oe() {
	let e = [], t = (e) => {
		if (typeof e == "string") return e;
		try {
			return JSON.stringify(e) ?? String(e);
		} catch {
			return String(e);
		}
	}, n = (...n) => e.push(n.map(t).join(" "));
	self.console = {
		log: n,
		info: n,
		warn: n,
		error: n,
		debug: n
	}, self.print = n, self.sleep = (e) => new Promise((t) => setTimeout(t, e * 1e3));
	let r = Object.getPrototypeOf(async () => {}).constructor;
	self.onmessage = async ({ data: { code: t, inputs: n } }) => {
		let i;
		try {
			let a = Object.keys(n);
			i = {
				value: await new r(...a, t)(...a.map((e) => n[e])),
				logs: e
			};
		} catch (t) {
			i = {
				error: String(t),
				logs: e
			};
		}
		try {
			self.postMessage(i);
		} catch {
			self.postMessage({
				error: "The code returned something that can't be passed out of it (like a function).",
				logs: e
			});
		}
	};
}
function ke(e) {
	let t = URL.createObjectURL(new Blob([e], { type: "text/javascript" })), n = new Worker(t);
	n.onmessage = (e) => parent.postMessage(e.data, "*"), n.onerror = (e) => {
		e.preventDefault(), parent.postMessage({
			error: e.message,
			logs: []
		}, "*");
	}, window.addEventListener("message", (e) => {
		e.source === parent && n.postMessage(e.data);
	}), parent.postMessage({ ready: !0 }, "*");
}
var Ae = `<script>(${ke})(${JSON.stringify(`(${Oe})()`)})<\/script>`;
function je(e, t, { timeoutSeconds: n = De } = {}) {
	return new Promise((r, i) => {
		let a = document.createElement("iframe");
		a.sandbox = "allow-scripts", a.hidden = !0, a.srcdoc = Ae;
		let o = (e, t) => {
			clearTimeout(c), window.removeEventListener("message", l), a.remove(), e(t);
		}, s = `Stopped after ${n} ${n === 1 ? "second" : "seconds"}.`, c = setTimeout(() => o(i, Object.assign(Error(s), { logs: [] })), n * 1e3);
		function l(n) {
			if (n.source === a.contentWindow) {
				if (n.data?.ready) return a.contentWindow.postMessage({
					code: e,
					inputs: t
				}, "*");
				n.data?.error === void 0 ? o(r, n.data) : o(i, Object.assign(Error(n.data.error), { logs: n.data.logs ?? [] }));
			}
		}
		window.addEventListener("message", l), document.body.append(a);
	});
}
//#endregion
//#region lib/xlsx.js
var Me = 67324752, Ne = 33639248, Pe = 101010256, Fe = "This doesn't look like an .xlsx file.", Ie = (e) => new DataView(e.buffer, e.byteOffset, e.byteLength);
function Le(e, t) {
	for (let n = e.length - 22; n >= Math.max(0, e.length - 65557); n--) if (t.getUint32(n, !0) === Pe) return n;
	return -1;
}
async function Re(e) {
	return [...(await q(e, "xl/workbook.xml")).matchAll(/<sheet\b[^>]*?\bname="([^"]*)"/g)].map((e) => ze(e[1]));
}
var ze = (e) => e.replace(/&(lt|gt|quot|apos|amp);/g, (e, t) => ({
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	amp: "&"
})[t]);
function Be(e) {
	let t = Ie(e);
	if (e.length >= 4 && t.getUint32(0, !0) === Me) return e;
	let n = Le(e, t);
	if (n < 0) return e;
	let r = t.getUint32(n + 12, !0), i = t.getUint32(n + 16, !0), a = n - r - i;
	return a > 0 && t.getUint32(a, !0) === Me ? e.slice(a) : e;
}
async function q(e, t) {
	let n = Ie(e), r = Le(e, n);
	if (r < 0) throw Error(Fe);
	let i = n.getUint16(r + 10, !0), a = n.getUint32(r + 16, !0);
	for (let r = 0; r < i && n.getUint32(a, !0) === Ne; r++) {
		let r = n.getUint16(a + 10, !0), i = n.getUint32(a + 20, !0), o = n.getUint16(a + 28, !0), s = o + n.getUint16(a + 30, !0) + n.getUint16(a + 32, !0);
		if (new TextDecoder().decode(e.subarray(a + 46, a + 46 + o)) === t) {
			let t = n.getUint32(a + 42, !0), o = t + 30 + n.getUint16(t + 26, !0) + n.getUint16(t + 28, !0), s = e.subarray(o, o + i);
			if (r === 0) return new TextDecoder().decode(s);
			if (r === 8) {
				let e = new Blob([s]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
				return new Response(e).text();
			}
			throw Error(Fe);
		}
		a += 46 + s;
	}
	throw Error(Fe);
}
var J = "flow_out", Ve = "flow_in", He = /* @__PURE__ */ new Set([
	"memory",
	"system",
	"temp"
]), Ue = /* @__PURE__ */ new Set(["information_schema", "pg_catalog"]), Y = (e) => `"${e.replaceAll("\"", "\"\"")}"`, X = (e) => `'${e.replaceAll("'", "''")}'`, We = (e) => e?.message ?? String(e);
function Ge(e, t) {
	Array.isArray(e) ? e.forEach((e) => Ge(e, t)) : e && typeof e == "object" && (t(e), Object.values(e).forEach((e) => Ge(e, t)));
}
function Ke(e) {
	let t = Promise.resolve(), n = [];
	function r(e) {
		let n = t.then(e);
		return t = n.catch(() => {}), n;
	}
	let i = (e, t, { paged: n = null, getFile: i, server: o = { state: "unavailable" } }) => r(async () => (await a(e, t, n, {
		getFile: i,
		server: o
	})).results);
	async function a(t, n, r, { getFile: i, server: a }) {
		if (!e) throw Error("No SQL engine is connected, so nodes can't run.");
		let o = new Map(t.nodes.map((e) => [e.id, e])), { order: s, inputs: c } = Ye(t, n);
		await e.query(`DROP SCHEMA IF EXISTS ${J} CASCADE`), await e.query(`CREATE SCHEMA ${J}`);
		let u = /* @__PURE__ */ new Map(), d = {
			outputs: u,
			getFile: i,
			server: a
		}, f = {};
		for (let e of s) {
			let t = [...new Set(c.get(e) ?? [])], n = t.find((e) => f[e].error);
			if (n) {
				f[e] = { error: `Upstream node ${n} failed.` };
				continue;
			}
			let i = o.get(e), a = r?.id === e ? r : { page: 0 };
			try {
				await v(t.map((e) => o.get(e)), u), f[e] = await l(i, t.map((e) => o.get(e)), a, d);
			} catch (t) {
				f[e] = { error: We(t) };
			}
		}
		return {
			results: f,
			outputs: u
		};
	}
	let o = (e, t, { getFile: n, server: i = { state: "unavailable" }, sampleRows: a = 0 }) => r(() => s(e, t, {
		getFile: n,
		server: i,
		sampleRows: a
	}));
	async function s(t, n, { getFile: r, server: i, sampleRows: o }) {
		let s = [...new Set(t.edges.filter((e) => e.target === n).map((e) => e.source))];
		if (!s.length) return [];
		if (!e) throw Error("No SQL engine is connected, so the inputs can't be read.");
		let l = new Map(t.nodes.map((e) => [e.id, e])), { results: u, outputs: d } = await a(t, s, null, {
			getFile: r,
			server: i
		}), f = [];
		for (let e of s) {
			let t = l.get(e), n = {
				name: W(e, t),
				kind: V[t.kind]?.label ?? t.kind,
				label: t.label ?? ""
			}, r = d.get(e);
			if (!r) {
				f.push({
					...n,
					error: u[e]?.error ?? "It didn't run."
				});
				continue;
			}
			let i = r.table ? [{
				name: null,
				table: r.table
			}] : r.tables;
			f.push({
				...n,
				tables: await Promise.all(i.map(async (e) => ({
					name: e.name,
					...await c(e.table, o)
				})))
			});
		}
		return f;
	}
	async function c(t, n) {
		return {
			columns: (await e.query(`DESCRIBE SELECT * FROM ${t}`)).rows.map(([e, t]) => ({
				name: e,
				type: t
			})),
			rowCount: Number((await e.query(`SELECT count(*) FROM ${t}`)).rows[0][0]),
			sample: (n > 0 ? (await e.query(`SELECT * FROM ${t} LIMIT ${Math.floor(n)}`)).rows : []).map((e) => e.map(qe))
		};
	}
	function l(e, t, n, r) {
		switch (e.kind) {
			case "sql-query": return b(e, t, n, r);
			case "data-ingest": return S(e, n, r);
			case "data-export": return C(e, t, r);
			case "javascript": return _(e, t, n, r);
			case "python-script": return h(e, t, n, r);
			default: return { error: `${V[e.kind].label} nodes can't run yet.` };
		}
	}
	async function u(t, n) {
		let r = t.trim().replace(/;+\s*$/, "");
		if (!r || !e) return [];
		let i;
		try {
			i = JSON.parse((await e.query(`SELECT json_serialize_sql(${X(r)})`)).rows[0][0]);
		} catch {
			return [];
		}
		if (i.error) return [];
		let a = (e) => (e ?? "").toLowerCase(), o = new Set(n.map((e) => a(e.name))), s = new Map(n.filter((e) => e.tables).map((e) => [a(e.name), new Set(e.tables.map(a))])), c = [], l = /* @__PURE__ */ new Set();
		Ge(i, (e) => {
			for (let { key: t } of e.cte_map?.map ?? []) l.add(a(t));
			e.type === "BASE_TABLE" && c.push(e);
		});
		let u = ({ catalog_name: e, schema_name: t, table_name: n }) => e ? He.has(a(e)) : t ? Ue.has(a(t)) || !!s.get(a(t))?.has(a(n)) : o.has(a(n)) || l.has(a(n)), d = c.filter((e) => !u(e)).map((e) => [
			e.catalog_name,
			e.schema_name,
			e.table_name
		].filter(Boolean).join("."));
		return [...new Set(d)];
	}
	async function d(e, t) {
		let n = [];
		for (let r of e) {
			let e = W(r.id, r), i = t.get(r.id);
			if (i.table) n.push({
				name: e,
				bytes: await f(i.table)
			});
			else for (let t of i.tables) n.push({
				name: `${e}.${t.name}`,
				bytes: await f(t.table)
			});
		}
		return n;
	}
	async function f(t) {
		let n = `flow-send-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`;
		await E(`SELECT * FROM ${t}`, n, "FORMAT parquet");
		try {
			return await e.readFile(n);
		} finally {
			await e.dropFile(n);
		}
	}
	async function p(t, n) {
		let r = `flow-received-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`;
		await e.registerFile(r, n);
		try {
			await e.query(`CREATE TABLE ${t} AS SELECT * FROM read_parquet(${X(r)})`);
		} finally {
			await e.dropFile(r);
		}
	}
	let m = (e, t) => e.state === "connected" && typeof e[t] == "function";
	async function h(t, n, r, { outputs: i, server: a }) {
		if (!m(a, "runPython")) return { error: "PythonScript nodes run on the server, which isn't available. Every other kind runs here in the browser." };
		let o = t.pythonCode ?? "";
		if (!o.trim()) return { error: "Write some code first." };
		let s = await a.runPython({
			code: o,
			inputs: await d(n, i)
		}), c = s.output ?? "";
		if (s.error) return {
			error: s.error,
			output: c
		};
		let l = `${J}.${Y(t.id)}`;
		s.table ? await p(l, s.table) : await e.query(`CREATE TABLE ${l} AS SELECT NULL::VARCHAR AS value WHERE false`), i.set(t.id, { table: l });
		let u = {
			output: c,
			variables: s.variables ?? []
		};
		return s.table ? {
			data: await y(l, r.page),
			...u
		} : {
			value: s.value ?? { kind: "none" },
			...u
		};
	}
	async function g(t) {
		let n = async (t) => {
			let { columns: n, rows: r } = await e.query(`SELECT * FROM ${t}`);
			return r.map((e) => Object.fromEntries(n.map((t, n) => [t, e[n]])));
		};
		return t.table ? n(t.table) : Object.fromEntries(await Promise.all(t.tables.map(async (e) => [e.name, await n(e.table)])));
	}
	async function _(t, n, r, { outputs: i }) {
		let a = t.jsCode ?? "";
		if (!a.trim()) return { error: "Write some code first." };
		let o = {};
		for (let e of n) o[W(e.id, e)] = await g(i.get(e.id));
		let s, c;
		try {
			({value: s, logs: c} = await je(a, o));
		} catch (e) {
			return {
				error: We(e),
				output: (e.logs ?? []).join("\n")
			};
		}
		let l = c.join("\n");
		if (s !== void 0 && !Array.isArray(s)) return {
			error: "Return an array of rows (objects, one per row) to output a table, or return nothing.",
			output: l
		};
		let u = `${J}.${Y(t.id)}`, d = (s ?? []).map((e) => typeof e == "object" && e && !Array.isArray(e) ? e : { value: e });
		if (d.length) {
			let n = `flow-js-${t.id}-${Date.now()}.json`;
			await e.registerFile(n, new TextEncoder().encode(JSON.stringify(d)));
			try {
				await e.query(`CREATE TABLE ${u} AS SELECT * FROM read_json_auto(${X(n)}, format = 'array')`);
			} finally {
				await e.dropFile(n);
			}
		} else await e.query(`CREATE TABLE ${u} AS SELECT NULL::VARCHAR AS value WHERE false`);
		return i.set(t.id, { table: u }), s === void 0 ? { output: l } : {
			data: await y(u, r.page),
			output: l
		};
	}
	async function v(t, r) {
		for (let t of [Ve, ...n]) await e.query(`DROP SCHEMA IF EXISTS ${Y(t)} CASCADE`);
		n = [], await e.query(`CREATE SCHEMA ${Ve}`), await e.query(`SET search_path = '${Ve},main'`);
		for (let i of t) {
			let t = W(i.id, i), a = r.get(i.id);
			if (a.table) {
				await e.query(`CREATE VIEW ${Ve}.${Y(t)} AS SELECT * FROM ${a.table}`);
				continue;
			}
			await e.query(`CREATE SCHEMA ${Y(t)}`), n.push(t);
			for (let n of a.tables) await e.query(`CREATE VIEW ${Y(t)}.${Y(n.name)} AS SELECT * FROM ${n.table}`);
		}
	}
	async function y(t, n) {
		let r = Number((await e.query(`SELECT count(*) FROM ${t}`)).rows[0][0]), { columns: i, rows: a } = await e.query(`SELECT * FROM ${t} LIMIT 100 OFFSET ${n * 100}`);
		return {
			columns: i,
			rows: a,
			rowCount: r,
			page: n,
			pageSize: 100,
			hasMore: (n + 1) * 100 < r
		};
	}
	async function b(t, n, r, { outputs: i, server: a }) {
		let o = (t.sqlQuery ?? "").trim().replace(/;+\s*$/, "");
		if (!o) return { error: "Write a query first." };
		let s = `${J}.${Y(t.id)}`, c = await u(o, n.map((e) => x(e, i.get(e.id))));
		if (!c.length) await e.query(`CREATE TABLE ${s} AS ${o}`);
		else if (m(a, "query")) await p(s, await a.query({
			sql: o,
			inputs: await d(n, i)
		}));
		else return { error: `This query reads ${c.length === 1 ? `${c[0]}, which isn't` : `${c.join(", ")}, which aren't`} wired in, so it runs on the server, which isn't available.` };
		return i.set(t.id, { table: s }), { data: await y(s, r.page) };
	}
	function x(e, t) {
		return {
			name: W(e.id, e),
			tables: t?.tables?.map((e) => e.name) ?? null
		};
	}
	async function S(t, n, { outputs: r, getFile: i }) {
		let a = t.ingest;
		if (!a) return { error: "Choose a file first." };
		let o = [];
		for (let n of a.tables) {
			let r = await i(n.key);
			if (!r) return { error: `The data read from "${a.fileName}" isn't stored any more. Choose the file again.` };
			let s = `flow-ingest-${n.key}.parquet`;
			await e.registerFile(s, r);
			let c = `${J}.${Y(`${t.id}/${n.name}`)}`;
			try {
				await e.query(`CREATE TABLE ${c} AS SELECT * FROM read_parquet(${X(s)})`);
			} finally {
				await e.dropFile(s);
			}
			o.push({
				...n,
				table: c
			});
		}
		if (!K[a.format].multi) return r.set(t.id, { table: o[0].table }), { data: await y(o[0].table, n.page) };
		r.set(t.id, { tables: o });
		let s = [];
		for (let e of o) {
			let t = await y(e.table, n.table === e.name ? n.page : 0);
			s.push({
				name: e.name,
				label: e.label,
				data: t
			});
		}
		return { tables: s };
	}
	async function C(e, t, { outputs: n }) {
		let r = w(e, t, n);
		if (r.error) return r;
		let { source: i, input: a } = r, o = (e.exportFilename ?? "").trim() || "export", s = e.exportFormat || ye(o) || "csv", c = be(o, s), l = K[s], u = a.table ? [{
			name: oe(i.id) || "data",
			table: a.table
		}] : a.tables;
		if (u.length > 1 && l.multi !== "read-write") return { error: `${l.label} holds one table, and ${i.id} has ${u.length}. Put a SQLQuery node in between to pick one.` };
		let d = await T(s, u, c);
		return n.set(e.id, a), { export: {
			filename: c,
			contentType: l.contentType,
			size: d.length,
			bytes: d
		} };
	}
	function w(e, t, n) {
		if (!t.length) return { error: "Wire a node into this one to export its data." };
		let r = t.map((e) => W(e.id, e)), i = (e.exportInput ?? "").trim();
		if (!i) return t.length > 1 ? { error: `${t.length} nodes are wired in (${r.join(", ")}). Name the one to write under Input.` } : {
			source: t[0],
			input: n.get(t[0].id)
		};
		let a = (e) => t.find((t, n) => r[n] === e || t.id === e), o = a(i), s = null;
		if (!o && i.includes(".") && (o = a(i.slice(0, i.lastIndexOf("."))), s = i.slice(i.lastIndexOf(".") + 1)), !o) return { error: `No input called "${i}" is wired in. Wired in: ${r.join(", ")}.` };
		let c = n.get(o.id);
		if (!s) return {
			source: o,
			input: c
		};
		let l = c.tables?.find((e) => e.name === s);
		if (!l) {
			let e = c.tables ? `its tables are ${c.tables.map((e) => e.name).join(", ")}` : "it has one table";
			return { error: `${o.id} has no table called "${s}": ${e}.` };
		}
		return {
			source: o,
			input: { table: l.table }
		};
	}
	async function T(t, n, r) {
		let i = async (t) => e.query(`SELECT * FROM ${t}`);
		if (t === "geojson") return new TextEncoder().encode(JSON.stringify(Je(await i(n[0].table))));
		if (t === "sqlite") {
			if (!e.writeSqlite) throw Error("This SQL engine can't write SQLite files.");
			return e.writeSqlite(await Promise.all(n.map(async (e) => ({
				name: e.name,
				...await i(e.table)
			}))));
		}
		let a = {
			csv: "FORMAT csv, HEADER",
			tsv: "FORMAT csv, DELIMITER '	', HEADER",
			json: "FORMAT json, ARRAY true",
			parquet: "FORMAT parquet",
			xlsx: "FORMAT xlsx, HEADER true"
		}[t];
		t === "xlsx" && await D();
		let o = `flow-export-${Date.now()}-${r}`;
		await E(`SELECT * FROM ${n[0].table}`, o, a);
		try {
			let n = await e.readFile(o);
			return t === "xlsx" ? Be(n) : n;
		} finally {
			await e.dropFile(o);
		}
	}
	async function E(t, n, r) {
		let i = await e.query(`COPY (${t}) TO ${X(n)} (${r})`);
		return Number(i.rows[0]?.[0] ?? 0);
	}
	async function D() {
		await e.query("INSTALL excel"), await e.query("LOAD excel");
	}
	let O = (e, t, n) => r(() => k(e, t, n));
	async function k(t, n, r) {
		if (!e) throw Error("No SQL engine is connected, so files can't be read.");
		let i = `flow-upload-${Date.now()}.${K[r].extensions[0]}`, a = [];
		await e.registerFile(i, t);
		try {
			let o = await A(r, i, t, n, a), s = [], c = [];
			for (let [t, { label: n, select: r }] of o.entries()) {
				let o = ie(oe(n) || "table", c);
				c.push(o);
				let l = `${i}-${t}.parquet`;
				a.push(l);
				let u = await E(r, l, "FORMAT parquet");
				s.push({
					name: o,
					label: n,
					rowCount: u,
					bytes: await e.readFile(l)
				});
			}
			return s;
		} finally {
			for (let t of [i, ...a]) await e.dropFile(t);
		}
	}
	async function A(t, n, r, i, a) {
		let o = X(n), s = (e) => [{
			label: i.replace(/\.[^.]*$/, ""),
			select: e
		}];
		switch (t) {
			case "csv": return s(`SELECT * FROM read_csv(${o})`);
			case "tsv": return s(`SELECT * FROM read_csv(${o}, delim = '\t')`);
			case "json": return s(`SELECT * FROM read_json_auto(${o})`);
			case "parquet": return s(`SELECT * FROM read_parquet(${o})`);
			case "geojson": return s(`SELECT unnest(f.properties), to_json(f.geometry)::VARCHAR AS geometry FROM (SELECT unnest(features) AS f FROM read_json_auto(${o}))`);
			case "xlsx": return await D(), (await Re(r)).map((e) => ({
				label: e,
				select: `SELECT * FROM read_xlsx(${o}, sheet = ${X(e)}, header = true)`
			}));
			case "sqlite": {
				if (!e.readSqlite) throw Error("This SQL engine can't read SQLite files.");
				let t = await e.readSqlite(r), i = [];
				for (let [e, r] of t.entries()) i.push({
					label: r.name,
					select: await j(r, `${n}-rows-${e}.json`, a)
				});
				return i;
			}
			default: throw Error(`Can't read ${K[t]?.label ?? t} files.`);
		}
	}
	async function j({ columns: t, rows: n }, r, i) {
		if (!n.length) return `SELECT ${t.map((e) => `NULL::VARCHAR AS ${Y(e)}`).join(", ") || "NULL AS empty"} WHERE false`;
		let a = n.map((e) => Object.fromEntries(t.map((t, n) => [t, e[n]])));
		return await e.registerFile(r, new TextEncoder().encode(JSON.stringify(a))), i.push(r), `SELECT * FROM read_json_auto(${X(r)}, format = 'array')`;
	}
	return {
		run: i,
		readFile: O,
		serverTables: u,
		describeInputs: o
	};
}
function qe(e) {
	if (e instanceof Uint8Array) return `(${e.length} bytes)`;
	let t = typeof e == "bigint" ? String(e) : typeof e == "object" && e ? JSON.stringify(e, (e, t) => typeof t == "bigint" ? String(t) : t) : e;
	return typeof t == "string" && t.length > 200 ? `${t.slice(0, 200)}…` : t;
}
function Je({ columns: e, rows: t }) {
	let n = e.findIndex((e) => e.toLowerCase() === "geometry");
	if (n < 0) throw Error("GeoJSON needs a geometry column of GeoJSON text, like a .geojson file read by DataIngest has.");
	return {
		type: "FeatureCollection",
		features: t.map((t) => ({
			type: "Feature",
			geometry: typeof t[n] == "string" ? JSON.parse(t[n]) : t[n],
			properties: Object.fromEntries(e.flatMap((e, r) => r === n ? [] : [[e, t[r]]]))
		}))
	};
}
function Ye(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e.edges) n.has(t.target) || n.set(t.target, []), n.get(t.target).push(t.source);
	let r = [], i = /* @__PURE__ */ new Set(), a = (e) => {
		if (!i.has(e)) {
			i.add(e);
			for (let t of n.get(e) ?? []) a(t);
			r.push(e);
		}
	};
	return t.forEach(a), {
		order: r,
		inputs: n
	};
}
//#endregion
//#region lib/keyboard.js
var Xe = (e) => !!e.target.closest?.("input, textarea, select, [contenteditable=\"true\"]"), Z = Symbol("flow-graph"), Ze = 190, Qe = 90, $e = {
	x: 0,
	y: .5
}, et = {
	x: 1,
	y: .5
}, tt = /* @__PURE__ */ new Set([
	"label",
	"autoRun",
	"sqlServerTables"
]), nt = (e) => e?.message ?? String(e), rt = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
function it({ sql: e = null, files: t = null, server: n = null } = {}) {
	let i = I(), a = Ke(e), o = r(() => ({
		state: n?.status?.state ?? "unavailable",
		address: n?.status?.address ?? null,
		assistant: typeof n?.assist == "function" && n?.status?.assistant || null
	})), s = [], c = {
		x: 0,
		y: 0
	}, l = _({
		started: !1,
		executing: !1,
		status: {},
		results: {}
	}), u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new WeakMap(), p = r(() => i.getSelectedNodes.value[0] ?? null), m = () => [...i.nodes.value, ...s.flatMap((e) => e.nodes)].map((e) => e.id);
	function h(e, t) {
		return {
			id: re(e, m()),
			type: "pipeline",
			position: t,
			data: { kind: e }
		};
	}
	function g({ source: e, sourceHandle: t, target: n, targetHandle: r }) {
		return {
			id: `${e}.${t}-${n}.${r}`,
			type: "wire",
			source: e,
			sourceHandle: t,
			target: n,
			targetHandle: r
		};
	}
	let v = r(() => we(i.nodes.value, i.edges.value, i.viewport.value));
	function y(e) {
		let { nodes: t, edges: n, viewport: r } = Ee(e) ?? Ee(Ce);
		s.length = 0, u.clear(), Object.assign(l, {
			started: !1,
			executing: !1,
			status: {},
			results: {}
		}), i.setNodes(t), i.setEdges(n.map(g));
		for (let e of t) e.data.kind === "sql-query" && e.data.sqlQuery && !e.data.sqlServerTables && O(e.id);
		if (r) i.setViewport(r);
		else if (t.length) {
			let { off: e } = i.onNodesInitialized(() => {
				i.fitView({ maxZoom: 1 }), e();
			});
		}
	}
	function b(e) {
		c = {
			x: e.clientX,
			y: e.clientY
		};
	}
	function x(e, t = c, n = {
		x: 0,
		y: 0
	}) {
		let r = i.screenToFlowCoordinate(t), a = h(e, {
			x: r.x - n.x * Ze,
			y: r.y - n.y * Qe
		});
		return i.addNodes(a), a;
	}
	function S(e, t, n) {
		let r = n.handleType === "source", i = x(e, t, r ? $e : et), [a, o] = r ? [n, {
			nodeId: i.id,
			handleId: "target-0"
		}] : [{
			nodeId: i.id,
			handleId: "source-0"
		}, n];
		C({
			source: a.nodeId,
			sourceHandle: a.handleId,
			target: o.nodeId,
			targetHandle: o.handleId
		});
	}
	function C(e) {
		i.addEdges(g(e)), D(e.target);
	}
	function w(e) {
		let t = /* @__PURE__ */ new Set(), n = [e];
		for (; n.length;) {
			let e = n.pop();
			for (let r of i.edges.value) r.source === e && !t.has(r.target) && (t.add(r.target), n.push(r.target));
		}
		return [...t];
	}
	let T = (e, t) => e === t || w(e).includes(t), E = ({ source: e, target: t }) => !T(t, e);
	function D(e, { self: t = !0 } = {}) {
		for (let n of [...t ? [e] : [], ...w(e)]) u.set(n, (u.get(n) ?? 0) + 1), (l.status[n] === "completed" || l.status[n] === "failed") && (l.status[n] = "stale"), i.findNode(n)?.data.kind === "sql-query" && O(n);
	}
	async function O(t) {
		let n = i.findNode(t);
		if (!n || !e) return;
		let r = [...new Set(i.edges.value.filter((e) => e.target === t).map((e) => e.source))].map((e) => i.findNode(e)).filter(Boolean).map((e) => ({
			name: W(e.id, e.data),
			tables: e.data.ingest && K[e.data.ingest.format].multi ? e.data.ingest.tables.map((e) => e.name) : null
		})), o = await a.serverTables(n.data.sqlQuery ?? "", r);
		if (i.findNode(t) !== n) return;
		let s = n.data.sqlServerTables;
		(!s || o.join("\n") !== s.join("\n")) && i.updateNodeData(t, { sqlServerTables: o });
	}
	function k(e) {
		delete l.status[e], delete l.results[e], u.set(e, (u.get(e) ?? 0) + 1), D(e, { self: !1 });
	}
	function A(e, t) {
		if (t === e) return;
		let n = (n) => {
			let r = (n) => n === e ? t : n;
			return g({
				...n,
				source: r(n.source),
				target: r(n.target)
			});
		};
		i.findNode(e).id = t, i.setEdges(i.edges.value.map(n));
		for (let e of s) e.edges = e.edges.map(n);
		for (let n of [l.status, l.results]) e in n && (n[t] = n[e], delete n[e]);
		u.has(e) && u.set(t, u.get(e)), D(t, { self: !1 });
	}
	function j(e, t) {
		return t = t.trim(), t ? t === e ? null : m().includes(t) ? "Another node already uses this ID." : (A(e, t), null) : "ID cannot be empty.";
	}
	function M(e, t) {
		t = t.trim();
		let n = i.findNode(e);
		if (t === (n.data.label ?? "")) return;
		i.updateNodeData(e, { label: t || void 0 });
		let r = oe(t);
		r && ae(n.data.kind, e) && A(e, ie(r, m().filter((t) => t !== e)));
	}
	function N(e, t) {
		let n = oe(t), r = n && n !== "data" ? n : void 0;
		r !== i.findNode(e).data.outputSuffix && (i.updateNodeData(e, { outputSuffix: r }), D(e, { self: !1 }));
	}
	function P(e, t) {
		let n = i.findNode(e).data, r = Object.keys(t).filter((e) => JSON.stringify(t[e]) !== JSON.stringify(n[e]));
		r.length && (i.updateNodeData(e, t), r.some((e) => !tt.has(e)) && D(e));
	}
	async function F(e) {
		if (!d.has(e)) {
			let n = await t?.getFile?.(e);
			n && d.set(e, n);
		}
		return d.get(e) ?? null;
	}
	async function L(e, n) {
		d.set(e, n), await t?.putFile?.(e, n);
	}
	function R(e) {
		d.delete(e), t?.deleteFile?.(e);
	}
	async function ee(e, t) {
		let n = i.findNode(e), r = {
			name: t.name,
			size: t.size,
			bytes: new Uint8Array(await t.arrayBuffer())
		};
		return f.set(n, r), ye(t.name) && P(e, { ingestFormat: void 0 }), z(n, r, n.data.ingestFormat);
	}
	async function z(e, { name: t, size: n, bytes: r }, o) {
		let s = o || ye(t);
		if (!s || !K[s].read) return `Can't tell what kind of file "${t}" is. Pick its type under File Type.`;
		let c;
		try {
			c = await a.readFile(r, t, s);
		} catch (e) {
			return `Couldn't read "${t}" as ${K[s].label}. ${nt(e)}`;
		}
		if (i.findNode(e.id) !== e) return null;
		let l = [];
		for (let e of c) {
			let t = rt();
			await L(t, e.bytes), l.push({
				name: e.name,
				label: e.label,
				rowCount: e.rowCount,
				key: t
			});
		}
		let u = e.data.ingest?.tables ?? [];
		return P(e.id, { ingest: {
			fileName: t,
			fileSize: n,
			format: s,
			tables: l
		} }), u.forEach((e) => R(e.key)), null;
	}
	async function B(e, t) {
		let n = i.findNode(e);
		P(e, { ingestFormat: t || void 0 });
		let r = f.get(n);
		if (r) return z(n, r, t);
		let a = n.data.ingest;
		return !a || (t || ye(a.fileName)) === a.format ? null : `Choose "${a.fileName}" again to read it as ${K[t]?.label ?? "that type"}.`;
	}
	function V({ filename: e, contentType: t, bytes: n }) {
		let r = URL.createObjectURL(new Blob([n], { type: t }));
		Object.assign(document.createElement("a"), {
			href: r,
			download: e
		}).click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
	}
	let H = () => ({
		state: o.value.state,
		query: n?.query,
		runPython: n?.runPython
	});
	async function U(e, t = null) {
		if (!e.length) return;
		l.started = !0;
		for (let t of e) l.status[t] = "running";
		let n = new Map(u), r;
		try {
			r = await a.run(v.value, e, {
				paged: t,
				getFile: F,
				server: H()
			});
		} catch (t) {
			r = Object.fromEntries(e.map((e) => [e, { error: nt(t) }]));
		}
		for (let [t, a] of Object.entries(r)) {
			if (!i.findNode(t)) continue;
			if (a.export) {
				let { bytes: n, ...r } = a.export, i = e.includes(t);
				i && V(a.export), a = { export: {
					...r,
					downloaded: i
				} };
			}
			l.results[t] = a;
			let r = (u.get(t) ?? 0) !== (n.get(t) ?? 0);
			l.status[t] = r ? "stale" : a.error ? "failed" : "completed";
		}
	}
	let te = (e, t = 0, n = null) => U([e], {
		id: e,
		page: t,
		table: n
	});
	async function ne() {
		l.executing = !0;
		try {
			await U(i.nodes.value.filter((e) => e.data.autoRun !== !1).map((e) => e.id));
		} finally {
			l.executing = !1;
		}
	}
	async function se(e, t, r, s = () => {}) {
		let c = i.findNode(e), l = o.value.assistant;
		if (!c) return { error: "That node is gone." };
		if (o.value.state !== "connected" || !l) return { error: "The assistant works through the server, which isn't available." };
		try {
			s("reading");
			let i = await a.describeInputs(v.value, e, {
				getFile: F,
				server: H(),
				sampleRows: l.sampleRows ?? 0
			});
			return s("writing"), await n.assist({
				kind: c.data.kind,
				request: t,
				code: r,
				inputs: i
			});
		} catch (e) {
			return { error: nt(e) };
		}
	}
	function ce({ nodeIds: e = [], edgeIds: t = [] }) {
		let n = i.nodes.value.filter((t) => e.includes(t.id)), r = i.edges.value.filter((n) => t.includes(n.id) || e.includes(n.source) || e.includes(n.target));
		if (n.length || r.length) {
			s.push({
				nodes: n.map(({ id: e, type: t, position: n, data: r }) => ({
					id: e,
					type: t,
					position: { ...n },
					data: r
				})),
				edges: r.map(g)
			}), i.removeEdges(r.map((e) => e.id)), i.removeNodes(n.map((e) => e.id));
			for (let t of r) e.includes(t.target) || D(t.target);
		}
	}
	function le() {
		let e = s.pop();
		if (e) {
			i.addNodes(e.nodes), i.addEdges(e.edges);
			for (let t of e.edges) D(t.target);
		}
	}
	function ue(e) {
		if (Xe(e)) return;
		let t = e.ctrlKey || e.metaKey;
		(e.key === "Delete" || e.key === "Backspace") && !t && !e.altKey ? (e.preventDefault(), ce({
			nodeIds: i.getSelectedNodes.value.map((e) => e.id),
			edgeIds: i.getSelectedEdges.value.map((e) => e.id)
		})) : t && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z" && (e.preventDefault(), le());
	}
	return {
		flow: i,
		selectedNode: p,
		snapshot: v,
		run: l,
		server: o,
		load: y,
		setContextPoint: b,
		addNode: x,
		addConnectedNode: S,
		connect: C,
		isValidConnection: E,
		renameNode: j,
		setLabel: M,
		setOutputName: N,
		updateData: P,
		chooseFile: ee,
		setIngestFormat: B,
		runNode: te,
		executeGraph: ne,
		resetNode: k,
		askAssistant: se,
		remove: ce,
		undoDelete: le,
		onKeydown: ue
	};
}
//#endregion
//#region components/FlowNode.vue
var at = {
	key: 0,
	class: "flow-node-kind"
}, ot = {
	key: 1,
	class: "flow-blink-dot flow-node-server-dot",
	role: "img",
	"aria-label": "Executes on server",
	title: "Executes on server"
}, st = {
	key: 2,
	class: "flow-node-ref-hint"
}, ct = {
	__name: "FlowNode",
	props: {
		id: {
			type: String,
			required: !0
		},
		data: {
			type: Object,
			required: !0
		},
		selected: Boolean
	},
	setup(t) {
		let s = {
			running: "Running…",
			completed: "Run completed.",
			failed: "Run failed.",
			stale: "Stale."
		}, c = t, p = u(Z), m = r(() => V[c.data.kind]), g = r(() => se(c.data)), _ = r(() => p.server.value.state), b = r(() => g.value && _.value === "unavailable" ? "Backend not available." : s[p.run.status[c.id]] ?? ""), C = (e) => r(() => {
			let { inputs: t, outputs: n } = te(c.data.kind);
			return ce(e === "target" ? t : n).map((t, n) => ({
				id: `${e}-${n}`,
				top: t
			}));
		}), w = C("target"), T = C("source"), E = F(), O = r(() => new Set(E.value.map((e) => e.source === c.id ? e.sourceHandle : e.targetHandle))), k = v(!1), A = v(!1);
		return (r, s) => D((h(), o("div", {
			class: d(["flow-node", [`flow-node--${m.value.category}`, { "is-hovered": k.value }]]),
			onPointerenter: s[2] ||= (e) => k.value = !0,
			onPointerleave: s[3] ||= (e) => k.value = !1
		}, [
			t.data.label ? (h(), o("span", at, x(m.value.label), 1)) : a("", !0),
			l(z, {
				label: t.data.label || m.value.label,
				status: b.value,
				selected: t.selected
			}, null, 8, [
				"label",
				"status",
				"selected"
			]),
			g.value && _.value === "connected" ? (h(), o("span", ot)) : a("", !0),
			(h(!0), o(n, null, y(S(w), (e) => (h(), i(S(j), {
				id: e.id,
				key: e.id,
				type: "target",
				position: S(M).Left,
				class: d(["flow-handle flow-handle--in", { "is-connected": O.value.has(e.id) }]),
				style: f({ top: e.top })
			}, null, 8, [
				"id",
				"position",
				"class",
				"style"
			]))), 128)),
			(h(!0), o(n, null, y(S(T), (e) => (h(), i(S(j), {
				id: e.id,
				key: e.id,
				type: "source",
				position: S(M).Right,
				class: d(["flow-handle flow-handle--out", { "is-connected": O.value.has(e.id) }]),
				style: f({ top: e.top }),
				onPointerenter: s[0] ||= (e) => A.value = !0,
				onPointerleave: s[1] ||= (e) => A.value = !1
			}, null, 8, [
				"id",
				"position",
				"class",
				"style"
			]))), 128)),
			A.value ? (h(), o("span", st, x(S(W)(t.id, t.data)), 1)) : a("", !0)
		], 34)), [[S(e), {
			items: S(G),
			context: t.id
		}]]);
	}
}, lt = ["d"], ut = [
	"id",
	"x1",
	"y1",
	"x2",
	"y2"
], dt = ["d", "stroke"], ft = ["d", "stroke"], pt = ["d"], mt = ["d"], ht = {
	__name: "FlowWire",
	props: {
		id: {
			type: String,
			required: !0
		},
		source: {
			type: String,
			required: !0
		},
		target: {
			type: String,
			required: !0
		},
		selected: Boolean,
		sourceX: {
			type: Number,
			required: !0
		},
		sourceY: {
			type: Number,
			required: !0
		},
		sourcePosition: {
			type: String,
			required: !0
		},
		targetX: {
			type: Number,
			required: !0
		},
		targetY: {
			type: Number,
			required: !0
		},
		targetPosition: {
			type: String,
			required: !0
		}
	},
	setup(t) {
		let i = t, c = u(Z), l = r(() => P(i)[0]), f = (e) => c.run.status[e] === "completed", p = r(() => f(i.source) ? f(i.target) ? "flowed" : "flowing" : c.run.started ? "dormant" : "pristine"), m = (e) => `flow-node--${V[c.flow.findNode(e)?.data.kind]?.category}`, g = C().replace(/[^\w-]/g, ""), _ = `flow-wire-flowed-${g}`, v = `flow-wire-flowing-${g}`;
		return (r, i) => D((h(), o("g", null, [
			p.value === "pristine" || p.value === "dormant" ? (h(), o("path", {
				key: 0,
				class: d(["flow-wire", p.value === "pristine" ? "flow-wire--idle" : "flow-wire--waiting"]),
				d: l.value
			}, null, 10, lt)) : (h(), o(n, { key: 1 }, [
				s("defs", null, [(h(!0), o(n, null, y([_, v], (e) => (h(), o("linearGradient", {
					id: e,
					key: e,
					gradientUnits: "userSpaceOnUse",
					x1: t.sourceX,
					y1: t.sourceY,
					x2: t.targetX,
					y2: t.targetY
				}, [s("stop", {
					offset: "0",
					class: d(["flow-wire-stop-source", m(t.source)])
				}, null, 2), s("stop", {
					offset: "1",
					class: d(e === _ ? ["flow-wire-stop-target", m(t.target)] : "flow-wire-stop-dormant")
				}, null, 2)], 8, ut))), 128))]),
				s("path", {
					class: "flow-wire",
					d: l.value,
					stroke: `url(#${_})`
				}, null, 8, dt),
				s("path", {
					class: d(["flow-wire flow-wire--grow", { "is-complete": p.value === "flowed" }]),
					d: l.value,
					pathLength: "1",
					stroke: `url(#${v})`
				}, null, 10, ft)
			], 64)),
			t.selected ? (h(), o("path", {
				key: 2,
				class: "flow-wire-gaps",
				d: l.value
			}, null, 8, pt)) : a("", !0),
			s("path", {
				class: "flow-wire-hit",
				d: l.value
			}, null, 8, mt)
		])), [[S(e), {
			items: S(de),
			context: t.id
		}]]);
	}
}, gt = [
	"x1",
	"y1",
	"x2",
	"y2"
], _t = ["d", "stroke"], vt = {
	__name: "FlowConnectionLine",
	props: {
		sourceX: {
			type: Number,
			required: !0
		},
		sourceY: {
			type: Number,
			required: !0
		},
		sourcePosition: {
			type: String,
			required: !0
		},
		targetX: {
			type: Number,
			required: !0
		},
		targetY: {
			type: Number,
			required: !0
		},
		targetPosition: {
			type: String,
			required: !0
		},
		sourceNode: {
			type: Object,
			default: null
		},
		targetNode: {
			type: Object,
			default: null
		},
		fromInput: Boolean
	},
	setup(e) {
		let t = e, i = u(Z), a = r(() => P(t)[0]), c = r(() => {
			let e = {
				x: t.sourceX,
				y: t.sourceY
			}, n = {
				x: t.targetX,
				y: t.targetY
			};
			return t.fromInput ? [n, e] : [e, n];
		}), l = (e) => `flow-node--${V[e.data.kind].category}`, f = r(() => {
			let [e, n] = t.fromInput ? [t.targetNode, t.sourceNode] : [t.sourceNode, t.targetNode];
			return !e || i.run.status[e.id] !== "completed" ? ["flow-connection-line-from", "flow-connection-line-to"] : [["flow-wire-stop-source", l(e)], n ? ["flow-wire-stop-target", l(n)] : "flow-wire-stop-dormant"];
		}), p = `flow-connection-line-${C().replace(/[^\w-]/g, "")}`;
		return (e, t) => (h(), o(n, null, [s("defs", null, [s("linearGradient", {
			id: p,
			gradientUnits: "userSpaceOnUse",
			x1: c.value[0].x,
			y1: c.value[0].y,
			x2: c.value[1].x,
			y2: c.value[1].y
		}, [s("stop", {
			offset: "0",
			class: d(f.value[0])
		}, null, 2), s("stop", {
			offset: "1",
			class: d(f.value[1])
		}, null, 2)], 8, gt)]), s("path", {
			class: "flow-wire flow-connection-line",
			d: a.value,
			stroke: `url(#${p})`
		}, null, 8, _t)], 64));
	}
}, yt = {
	__name: "FlowCanvas",
	emits: ["connection-dropped"],
	setup(e, { emit: t }) {
		let n = t, r = u(Z), { onConnect: i, onConnectStart: a, onConnectEnd: s } = r.flow, c = null, d = !1;
		a(({ nodeId: e, handleId: t, handleType: n }) => {
			c = {
				nodeId: e,
				handleId: t,
				handleType: n
			}, d = !1;
		}), i((e) => {
			d = !0, r.connect(e);
		}), s((e) => {
			if (d || !c || !e?.target?.classList?.contains("vue-flow__pane")) return;
			let { clientX: t, clientY: r } = e.changedTouches?.[0] ?? e;
			n("connection-dropped", {
				point: {
					x: t,
					y: r
				},
				from: c
			}), c = null;
		});
		let f = (e) => e.dataTransfer.types.includes(H);
		function p(e) {
			f(e) && (e.preventDefault(), e.dataTransfer.dropEffect = "copy");
		}
		function m(e) {
			if (!f(e)) return;
			e.preventDefault();
			let t;
			try {
				t = JSON.parse(e.dataTransfer.getData(H));
			} catch {
				return;
			}
			V[t?.kind] && r.addNode(t.kind, {
				x: e.clientX,
				y: e.clientY
			}, t.grab ?? void 0);
		}
		return (e, t) => (h(), o("div", {
			class: "flow-canvas-layer",
			onContextmenu: t[0] ||= (...e) => S(r).setContextPoint && S(r).setContextPoint(...e),
			onDragover: p,
			onDrop: m
		}, [l(S(N), {
			"min-zoom": .25,
			"max-zoom": 2,
			"connection-mode": S(A).Strict,
			"is-valid-connection": S(r).isValidConnection,
			"delete-key-code": null,
			"nodes-focusable": !1,
			"edges-focusable": !1,
			"selection-key-code": null,
			"multi-selection-key-code": null
		}, {
			"node-pipeline": E(({ id: e, data: t, selected: n }) => [l(ct, {
				id: e,
				data: t,
				selected: n
			}, null, 8, [
				"id",
				"data",
				"selected"
			])]),
			"edge-wire": E((e) => [l(ht, {
				id: e.id,
				source: e.source,
				target: e.target,
				selected: e.selected,
				"source-x": e.sourceX,
				"source-y": e.sourceY,
				"source-position": e.sourcePosition,
				"target-x": e.targetX,
				"target-y": e.targetY,
				"target-position": e.targetPosition
			}, null, 8, [
				"id",
				"source",
				"target",
				"selected",
				"source-x",
				"source-y",
				"source-position",
				"target-x",
				"target-y",
				"target-position"
			])]),
			"connection-line": E((e) => [l(vt, {
				"source-x": e.sourceX,
				"source-y": e.sourceY,
				"source-position": e.sourcePosition,
				"target-x": e.targetX,
				"target-y": e.targetY,
				"target-position": e.targetPosition,
				"source-node": e.sourceNode,
				"target-node": e.targetNode,
				"from-input": e.sourceHandle?.type === "target"
			}, null, 8, [
				"source-x",
				"source-y",
				"source-position",
				"target-x",
				"target-y",
				"target-position",
				"source-node",
				"target-node",
				"from-input"
			])]),
			default: E(() => [l(S(L), {
				class: "flow-canvas-dots",
				gap: 24,
				size: 1
			})]),
			_: 1
		}, 8, ["connection-mode", "is-valid-connection"])], 32));
	}
}, bt = Symbol("flow-panel-layout"), xt = "seamonster:unlinked-panel-rects", St = [
	"left",
	"right",
	"bottom"
], Ct = 5, Q = (e, t, n) => Math.max(t, Math.min(n, e));
function wt() {
	try {
		let e = JSON.parse(localStorage.getItem(xt));
		return e && typeof e == "object" ? e : {};
	} catch {
		return {};
	}
}
function Tt(e) {
	try {
		localStorage.setItem(xt, JSON.stringify(e));
	} catch {}
}
function Et(e) {
	return e && [
		"x",
		"y",
		"w",
		"h"
	].every((t) => Number.isFinite(e[t])) ? e : null;
}
function Dt() {
	let e = _({
		width: 0,
		height: 0,
		gap: 0,
		leftTop: 0
	}), t = _([]), n = v([]), i = v(null), a = wt(), o = v(null), s = () => ({
		w: e.width - 2 * e.gap,
		h: e.height - 2 * e.gap
	}), c = (e) => t.find((t) => t.name === e), l = (e, t) => e.name === t || e.linked && !e.collapsed, u = (e, n = null) => t.filter((t) => t.dock === e && l(t, n));
	function d({ name: e, title: r, dock: i, defaultSize: o, minWidth: s, minHeight: c, collapsed: l, hotkey: u, aboveBottom: d }) {
		t.push({
			name: e,
			title: r,
			dock: i,
			defaultSize: o,
			minWidth: s,
			minHeight: c,
			collapsed: l,
			hotkey: u,
			aboveBottom: d,
			linked: !0,
			linkedFrac: null,
			unlinkedRect: Et(a[e])
		}), n.value.push(e);
	}
	function f(e) {
		t.splice(t.indexOf(c(e)), 1), n.value = n.value.filter((t) => t !== e), i.value === e && (i.value = null);
	}
	function p(t) {
		Object.assign(e, t);
	}
	function m(e) {
		let { w: t, h: n } = s();
		return e.dock === "bottom" ? Q(e.linkedFrac === null ? e.defaultSize : e.linkedFrac * n, e.minHeight, n) : Q(e.linkedFrac === null ? e.defaultSize : e.linkedFrac * t, e.minWidth, t);
	}
	function h(e = null) {
		let t = u("left", e), n = t.length;
		if (u("bottom", e).length) for (; n > 0 && t[n - 1].aboveBottom;) n--;
		return {
			full: t.slice(0, n),
			above: t.slice(n)
		};
	}
	function g(t) {
		if (!t.length) return s().h;
		let n = e.height - 2 * e.gap - e.leftTop - Math.max(...t.map((e) => e.minHeight));
		return Math.max(0, n);
	}
	let y = (e, t) => Q(m(e), e.minHeight, Math.max(e.minHeight, g(t)));
	function b(t) {
		let { w: n, h: r } = s(), i = e.gap;
		return {
			x: (t.left - i) / n,
			y: (t.top - i) / r,
			w: t.width / n,
			h: t.height / r
		};
	}
	function x(t) {
		let { w: n, h: r } = s(), i = e.gap, a = t.unlinkedRect, o = Q(a.w * n, t.minWidth, n), c = Q(a.h * r, t.minHeight, r);
		return {
			left: Q(i + a.x * n, i, i + n - o),
			top: Q(i + a.y * r, i, i + r - c),
			width: o,
			height: c
		};
	}
	function S(n = null) {
		let r = {};
		if (!e.width) return r;
		let { width: i, height: a, gap: o, leftTop: s } = e, { full: c, above: d } = h(n), f = u("bottom", n), p = a - o - Math.max(0, ...f.map((e) => y(e, d))), g = o;
		for (let e of c) {
			let t = m(e);
			r[e.name] = {
				left: g,
				top: s,
				width: t,
				height: a - o - s
			}, g += t + o;
		}
		let _ = g;
		for (let e of d) {
			let t = m(e);
			r[e.name] = {
				left: g,
				top: s,
				width: t,
				height: Math.max(0, p - o - s)
			}, g += t + o;
		}
		let v = i - o;
		for (let e of u("right", n)) {
			let t = m(e);
			v -= t, r[e.name] = {
				left: v,
				top: o,
				width: t,
				height: a - 2 * o
			}, v -= o;
		}
		for (let e of f) {
			let t = y(e, d);
			r[e.name] = {
				left: _,
				top: a - o - t,
				width: Math.max(0, v - _),
				height: t
			};
		}
		for (let e of t) !l(e, n) && !e.linked && !e.collapsed && e.unlinkedRect && (r[e.name] = x(e));
		return r;
	}
	let C = r(() => S());
	function w(t) {
		let { full: n, above: r } = h(), i = [...n, ...u("right")].filter((e) => e !== t), a = r.filter((e) => e !== t), o = u("bottom"), s = (e) => e.reduce((e, t) => e + m(t), 0), c = s(a) + e.gap * Math.max(0, a.length - 1), l = o.length ? Math.max(...o.map((e) => e.minWidth)) : 0, d = r.includes(t) ? c : Math.max(c, l), f = i.length + +(d > 0);
		return {
			width: s(i) + d + e.gap * Math.max(0, f - 1),
			items: f
		};
	}
	function E(e, t) {
		let n = C.value;
		for (let r of e) !t && r.linked && n[r.name] && (r.unlinkedRect ??= b(n[r.name])), r.linked = t;
	}
	function D(e) {
		let t = c(e);
		E([t], !t.linked);
	}
	T(() => [
		e.width,
		e.height,
		...t.map((e) => `${e.collapsed}:${e.linked}`)
	], () => {
		!e.width || w(null).width <= s().w || E(St.flatMap((e) => u(e)), !1);
	});
	function O(t, n, r, i, a) {
		let o = c(t), { w: l, h: u } = s(), d = e.gap;
		if (o.linked) {
			if (o.dock === "bottom") {
				let e = Math.max(o.minHeight, g(h().above));
				o.linkedFrac = Q(r.height - a, o.minHeight, e) / u;
			} else {
				let { width: e, items: t } = w(o), n = l - e - (t ? d : 0), a = o.dock === "right" ? -i : i;
				o.linkedFrac = Q(r.width + a, o.minWidth, n) / l;
			}
			return;
		}
		let { left: f, top: p, width: m, height: _ } = r, v = f + m, y = p + _;
		n.includes("w") && (f = Q(f + i, d, v - o.minWidth), m = v - f), n.includes("e") && (m = Q(m + i, o.minWidth, d + l - f)), n.includes("n") && (p = Q(p + a, d, y - o.minHeight), _ = y - p), n.includes("s") && (_ = Q(_ + a, o.minHeight, d + u - p)), o.unlinkedRect = b({
			left: f,
			top: p,
			width: m,
			height: _
		});
	}
	function k(t, n, r, i) {
		let a = c(t);
		if (a.linked) return;
		let { w: o, h: l } = s(), u = e.gap;
		a.unlinkedRect = b({
			...n,
			left: Q(n.left + r, u, u + o - n.width),
			top: Q(n.top + i, u, u + l - n.height)
		});
	}
	function A(e) {
		a[e.name] = e.unlinkedRect, Tt(a);
	}
	function j(e) {
		let t = c(e);
		t.linked || A(t);
	}
	function M(e) {
		let t = S(e)[e];
		if (!t) return;
		let n = c(e);
		n.unlinkedRect = b(t), A(n);
	}
	let N = (e, t) => e.left < t.left + t.width && t.left < e.left + e.width && e.top < t.top + t.height && t.top < e.top + e.height;
	function P(e) {
		let t = C.value;
		return t[e] ? n.value.slice(n.value.indexOf(e) + 1).some((n) => t[n] && N(t[e], t[n])) : !1;
	}
	let F = (e) => Ct + n.value.indexOf(e);
	function I(e) {
		n.value = [...n.value.filter((t) => t !== e), e], i.value = e;
	}
	function L() {
		i.value = null;
	}
	function R(e, t) {
		c(e).collapsed = t, t && i.value === e && (i.value = null), t || I(e);
	}
	let ee = r(() => Object.fromEntries(St.map((e) => {
		let n = t.filter((t) => t.dock === e), r = n.length > 1 && n.some((e) => !e.linked);
		return [e, n.filter((e) => e.collapsed || r)];
	})));
	function z(e) {
		c(e).collapsed ? R(e, !1) : P(e) ? I(e) : R(e, !0);
	}
	let B = r(() => t.some((e) => !e.collapsed) ? "collapse" : o.value ? "restore" : null);
	function V() {
		let e = t.filter((e) => !e.collapsed);
		e.length ? (o.value = e.map((e) => e.name), e.forEach((e) => e.collapsed = !0), i.value = null) : o.value &&= (o.value.forEach((e) => c(e) && (c(e).collapsed = !1)), null);
	}
	function H(e) {
		if (e.ctrlKey && e.code === "Space") {
			if (e.preventDefault(), e.repeat) return;
			i.value ? D(i.value) : V();
			return;
		}
		if (e.ctrlKey || e.metaKey || e.altKey || Xe(e)) return;
		let n = t.find((t) => t.hotkey?.toLowerCase() === e.key.toLowerCase());
		n && (e.preventDefault(), e.repeat || z(n.name));
	}
	return {
		panels: t,
		rects: C,
		rails: ee,
		active: i,
		maximiseAction: B,
		find: c,
		register: d,
		unregister: f,
		setFrame: p,
		resize: O,
		move: k,
		commitRect: j,
		resetUnlinkedRect: M,
		toggleLinked: D,
		isCovered: P,
		zIndex: F,
		activate: I,
		deactivate: L,
		setCollapsed: R,
		toggle: z,
		toggleMaximise: V,
		onKeydown: H
	};
}
//#endregion
//#region components/FlowPanel.vue
var Ot = ["aria-label"], kt = { class: "flow-panel-body" }, At = ["onPointerdown"], jt = [
	"aria-pressed",
	"aria-label",
	"title"
], Mt = 4, Nt = {
	__name: "FlowPanel",
	props: {
		name: {
			type: String,
			required: !0
		},
		title: {
			type: String,
			required: !0
		},
		dock: {
			type: String,
			required: !0,
			validator: (e) => [
				"left",
				"right",
				"bottom"
			].includes(e)
		},
		defaultSize: {
			type: Number,
			default: 320
		},
		minWidth: {
			type: Number,
			default: 200
		},
		minHeight: {
			type: Number,
			default: 140
		},
		collapsed: {
			type: Boolean,
			default: !1
		},
		hotkey: {
			type: String,
			default: null
		},
		aboveBottom: {
			type: Boolean,
			default: !1
		}
	},
	setup(t) {
		let i = t, l = u(bt);
		l.register({ ...i }), p(() => l.unregister(i.name));
		let m = r(() => l.find(i.name)), g = r(() => l.rects.value[i.name]), _ = {
			left: ["e"],
			right: ["w"],
			bottom: ["n"]
		}, v = [
			"n",
			"s",
			"e",
			"w",
			"ne",
			"nw",
			"se",
			"sw"
		], C = r(() => m.value.linked ? _[i.dock] : v), w = r(() => ({
			left: `${g.value.left}px`,
			top: `${g.value.top}px`,
			width: `${g.value.width}px`,
			height: `${g.value.height}px`,
			zIndex: l.zIndex(i.name)
		})), T = r(() => `${m.value.linked ? "Unlink" : "Link"} ${i.title} panel`), E = !1;
		function O() {
			E = l.isCovered(i.name), l.activate(i.name);
		}
		let k = null, A = !1;
		function j(e) {
			e.button === 0 && (A = !1, k = {
				x: e.clientX,
				y: e.clientY,
				start: { ...g.value },
				moved: !1
			}, e.currentTarget.setPointerCapture(e.pointerId));
		}
		function M(e) {
			if (!k || m.value.linked) return;
			let t = e.clientX - k.x, n = e.clientY - k.y;
			!k.moved && Math.hypot(t, n) < Mt || (k.moved = !0, l.move(i.name, k.start, t, n));
		}
		function N() {
			k &&= (k.moved && (A = !0, l.commitRect(i.name)), null);
		}
		function P() {
			!A && !E && l.setCollapsed(i.name, !0), A = !1, E = !1;
		}
		let F = null;
		function I(e, t) {
			t.preventDefault(), F = {
				edge: e,
				x: t.clientX,
				y: t.clientY,
				start: { ...g.value }
			}, t.currentTarget.setPointerCapture(t.pointerId);
		}
		function L(e) {
			F && l.resize(i.name, F.edge, F.start, e.clientX - F.x, e.clientY - F.y);
		}
		function R() {
			F && (F = null, l.commitRect(i.name));
		}
		return (r, i) => !m.value.collapsed && g.value ? (h(), o("section", {
			key: 0,
			class: d([
				"flow-panel",
				`flow-panel--dock-${t.dock}`,
				{
					"is-active": S(l).active.value === t.name,
					"is-unlinked": !m.value.linked
				}
			]),
			style: f(w.value),
			onPointerdown: O
		}, [
			D((h(), o("button", {
				type: "button",
				class: "flow-panel-title",
				"aria-label": `Hide ${t.title} panel`,
				onPointerdown: j,
				onPointermove: M,
				onPointerup: N,
				onPointercancel: N,
				onClick: P
			}, [c(x(t.title), 1)], 40, Ot)), [[S(e), {
				items: S(ue),
				context: t.name
			}]]),
			s("div", kt, [b(r.$slots, "default")]),
			(h(!0), o(n, null, y(C.value, (e) => (h(), o("div", {
				key: e,
				class: d(["flow-panel-resize", `flow-panel-resize--${e}`]),
				onPointerdown: (t) => I(e, t),
				onPointermove: L,
				onPointerup: R,
				onPointercancel: R
			}, null, 42, At))), 128)),
			s("button", {
				type: "button",
				class: "flow-panel-link-btn",
				"aria-pressed": m.value.linked,
				"aria-label": T.value,
				title: `${T.value} (Ctrl+Space)`,
				onClick: i[0] ||= (e) => S(l).toggleLinked(t.name)
			}, [s("span", {
				class: d(["flow-panel-link-icon", m.value.linked ? "is-linked" : "is-unlinked"]),
				"aria-hidden": "true"
			}, null, 2)], 8, jt)
		], 38)) : a("", !0);
	}
}, Pt = { class: "flow-console" }, Ft = {
	key: 0,
	class: "flow-panel-empty"
}, It = {
	key: 0,
	class: "flow-console-line flow-console-note"
}, Lt = {
	key: 1,
	class: "flow-console-output"
}, Rt = {
	key: 2,
	class: "flow-console-error"
}, zt = {
	key: 3,
	class: "flow-console-line"
}, Bt = {
	key: 4,
	class: "flow-console-line"
}, Vt = {
	key: 5,
	class: "flow-console-line"
}, Ht = {
	key: 6,
	class: "flow-console-line"
}, Ut = {
	key: 7,
	class: "flow-console-line flow-console-note"
}, Wt = {
	__name: "ConsolePanel",
	setup(e) {
		let t = u(Z), c = t.selectedNode, l = r(() => c.value && t.run.results[c.value.id]), d = r(() => c.value && t.run.status[c.value.id] === "stale"), f = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`, p = (e) => e.map((e) => `${e.label} (${f(e.data.rowCount)})`).join(", ");
		return (e, t) => (h(), i(Nt, {
			class: "console-panel",
			name: "console",
			title: "Console",
			dock: "left",
			hotkey: "C",
			"default-size": 280,
			collapsed: ""
		}, {
			default: E(() => [s("div", Pt, [l.value ? (h(), o(n, { key: 1 }, [
				d.value ? (h(), o("p", It, " This node has changed since it ran (or something upstream has). Run it again to update this. ")) : a("", !0),
				l.value.output ? (h(), o("pre", Lt, x(l.value.output), 1)) : a("", !0),
				l.value.error ? (h(), o("pre", Rt, x(l.value.error), 1)) : l.value.export ? (h(), o("p", zt, " Wrote “" + x(l.value.export.filename) + "” (" + x(l.value.export.contentType) + ", " + x(S(Se)(l.value.export.size)) + "). ", 1)) : l.value.tables ? (h(), o("p", Bt, " Read " + x(l.value.tables.length) + " " + x(l.value.tables.length === 1 ? "table" : "tables") + ": " + x(p(l.value.tables)) + ". ", 1)) : l.value.data ? (h(), o("p", Vt, "Returned " + x(f(l.value.data.rowCount)) + ".", 1)) : l.value.value && l.value.value.kind !== "none" ? (h(), o("p", Ht, " Returned a " + x(l.value.value.type) + " (see the Data panel). ", 1)) : l.value.output ? a("", !0) : (h(), o("p", Ut, "(no output)"))
			], 64)) : (h(), o("p", Ft, " Nothing to show yet — run a node to see its output or errors here. "))])]),
			_: 1
		}));
	}
}, Gt = { class: "flow-library" }, Kt = { class: "flow-library-heading" }, qt = { class: "flow-library-cards" }, Jt = ["title", "onDragstart"], Yt = {
	__name: "LibraryPanel",
	setup(e) {
		let t = B.map((e) => ({
			...e,
			kinds: U(e.id)
		}));
		function r(e, t) {
			let n = t.currentTarget.getBoundingClientRect(), r = {
				x: (t.clientX - n.left) / n.width,
				y: (t.clientY - n.top) / n.height
			};
			t.dataTransfer.setData(H, JSON.stringify({
				kind: e,
				grab: r
			})), t.dataTransfer.effectAllowed = "copy";
		}
		return (e, a) => (h(), i(Nt, {
			class: "library-panel",
			name: "library",
			title: "Library",
			dock: "left",
			hotkey: "L",
			"default-size": 238,
			collapsed: ""
		}, {
			default: E(() => [s("div", Gt, [(h(!0), o(n, null, y(S(t), (e) => (h(), o("section", {
				key: e.id,
				class: "flow-library-section"
			}, [s("h3", Kt, [s("span", {
				class: d(["flow-library-dot", `flow-node--${e.id}`]),
				"aria-hidden": "true"
			}, null, 2), c(" " + x(e.label), 1)]), s("div", qt, [(h(!0), o(n, null, y(e.kinds, (t) => (h(), o("div", {
				key: t,
				class: d(["flow-library-card", `flow-node--${e.id}`]),
				draggable: "true",
				title: `Drag onto the canvas to add ${S(V)[t].label}`,
				onDragstart: (e) => r(t, e)
			}, [l(z, { label: S(V)[t].label }, null, 8, ["label"])], 42, Jt))), 128))])]))), 128))])]),
			_: 1
		}));
	}
}, Xt = { class: "flow-props" }, Zt = { class: "flow-field" }, Qt = ["aria-disabled"], $t = {
	__name: "FlowgraphsPanel",
	setup(e) {
		let t = u(Z);
		return (e, n) => (h(), i(Nt, {
			class: "flowgraphs-panel",
			name: "flowgraphs",
			title: "Flowgraphs",
			dock: "left",
			hotkey: "G",
			"default-size": 278,
			"above-bottom": "",
			collapsed: ""
		}, {
			default: E(() => [s("div", Xt, [s("div", Zt, [s("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": S(t).run.executing,
				onClick: n[0] ||= (e) => S(t).run.executing || S(t).executeGraph()
			}, x(S(t).run.executing ? "Executing…" : "Execute Graph"), 9, Qt), n[1] ||= s("p", { class: "flow-field-hint" }, " Runs every node with Auto Run on, and the nodes they depend on. ", -1)])])]),
			_: 1
		}));
	}
}, en = { class: "flow-data" }, tn = { class: "flow-table-wrap" }, nn = { class: "flow-table" }, rn = { class: "flow-pager" }, an = ["aria-disabled"], on = ["aria-disabled"], sn = {
	__name: "DataTable",
	props: {
		data: {
			type: Object,
			required: !0
		},
		busy: Boolean
	},
	emits: ["turn"],
	setup(e, { emit: t }) {
		let r = e, i = t, a = (e) => !r.busy && (e < 0 ? r.data.page > 0 : r.data.hasMore), c = (e) => a(e) && i("turn", e), l = (e) => e == null ? "" : typeof e == "object" ? JSON.stringify(e) : String(e);
		return (t, r) => (h(), o("div", en, [s("div", tn, [s("table", nn, [s("thead", null, [s("tr", null, [(h(!0), o(n, null, y(e.data.columns, (e, t) => (h(), o("th", { key: t }, x(e), 1))), 128))])]), s("tbody", null, [(h(!0), o(n, null, y(e.data.rows, (e, t) => (h(), o("tr", { key: t }, [(h(!0), o(n, null, y(e, (e, t) => (h(), o("td", { key: t }, x(l(e)), 1))), 128))]))), 128))])])]), s("div", rn, [
			s("span", null, "Page " + x(e.data.page + 1), 1),
			s("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !a(-1),
				onClick: r[0] ||= (e) => c(-1)
			}, " Prev ", 8, an),
			s("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !a(1),
				onClick: r[1] ||= (e) => c(1)
			}, " Next ", 8, on)
		])]));
	}
}, cn = {
	key: 0,
	class: "flow-panel-empty"
}, ln = {
	key: 1,
	class: "flow-panel-empty"
}, un = {
	key: 2,
	class: "flow-panel-empty"
}, dn = {
	key: 3,
	class: "flow-value"
}, fn = { class: "flow-value-type" }, pn = { class: "flow-value-text" }, mn = {
	key: 4,
	class: "flow-panel-empty"
}, hn = {
	key: 5,
	class: "flow-data-tabs"
}, gn = {
	key: 0,
	class: "flow-tabs",
	role: "tablist"
}, _n = [
	"aria-selected",
	"title",
	"onClick"
], vn = {
	key: 1,
	class: "flow-panel-empty"
}, yn = {
	__name: "DataPanel",
	setup(e) {
		let t = u(Z), c = t.selectedNode, l = r(() => c.value && t.run.results[c.value.id]), d = r(() => c.value && t.run.status[c.value.id] === "running"), f = v(null);
		T(c, () => f.value = null);
		let p = r(() => {
			let e = l.value?.tables;
			return e && (e.find((e) => e.name === f.value) ?? e[0]);
		}), m = r(() => l.value?.data ?? p.value?.data), g = (e) => t.runNode(c.value.id, m.value.page + e, p.value?.name ?? null);
		return (e, t) => (h(), i(Nt, {
			class: "data-panel",
			name: "data",
			title: "Data",
			dock: "bottom",
			hotkey: "D",
			"default-size": 240,
			collapsed: ""
		}, {
			default: E(() => [!l.value || l.value.error ? (h(), o("p", cn, "Run a node to see its output here.")) : l.value.export && l.value.export.downloaded ? (h(), o("p", ln, " “" + x(l.value.export.filename) + "” was downloaded to your computer. ", 1)) : l.value.export ? (h(), o("p", un, " “" + x(l.value.export.filename) + "” was written as this node ran upstream of another, not downloaded. Run this node to download it. ", 1)) : l.value.value && l.value.value.kind !== "none" ? (h(), o("div", dn, [s("p", fn, x(l.value.value.type), 1), s("pre", pn, x(l.value.value.kind === "json" ? JSON.stringify(l.value.value.value, null, 2) : l.value.value.text), 1)])) : !l.value.data && !l.value.tables ? (h(), o("p", mn, " This node's output isn't tabular — see the Console panel. ")) : (h(), o("div", hn, [l.value.tables ? (h(), o("div", gn, [(h(!0), o(n, null, y(l.value.tables, (e) => (h(), o("button", {
				key: e.name,
				type: "button",
				role: "tab",
				class: "flow-tab",
				"aria-selected": e === p.value,
				title: e.label === e.name ? void 0 : `${e.label} (${e.name} in SQL)`,
				onClick: (t) => f.value = e.name
			}, x(e.label), 9, _n))), 128))])) : a("", !0), m.value.rowCount ? (h(), i(sn, {
				key: 2,
				data: m.value,
				busy: d.value,
				onTurn: g
			}, null, 8, ["data", "busy"])) : (h(), o("p", vn, "No rows."))]))]),
			_: 1
		}));
	}
}, bn = {
	key: 0,
	class: "flow-field"
}, xn = ["for"], Sn = { class: "flow-assist" }, Cn = [
	"id",
	"placeholder",
	"aria-describedby"
], wn = ["aria-disabled"], Tn = ["id"], En = {
	key: 0,
	class: "flow-field-hint"
}, Dn = {
	key: 1,
	class: "flow-field-error"
}, On = {
	key: 2,
	class: "flow-field-note"
}, kn = { class: "flow-field-hint" }, An = {
	__name: "AssistantField",
	props: {
		node: {
			type: Object,
			required: !0
		},
		code: {
			type: String,
			default: ""
		}
	},
	setup(e) {
		let t = {
			"sql-query": {
				field: "sqlQuery",
				language: "SQL"
			},
			"python-script": {
				field: "pythonCode",
				language: "Python"
			},
			javascript: {
				field: "jsCode",
				language: "JavaScript"
			}
		}, n = e, i = u(Z), l = r(() => i.server.value.assistant), d = r(() => t[n.node.data.kind]), f = v(""), p = v(null), m = v(""), g = v(""), _ = v(null), y = r(() => p.value !== null), b = r(() => !y.value && !!f.value.trim()), S = r(() => !!_.value && n.code === _.value.written);
		async function T() {
			if (!b.value) return;
			let e = n.node, t = n.code;
			g.value = "", m.value = "";
			let r;
			try {
				r = await i.askAssistant(e.id, f.value.trim(), t, (e) => p.value = e);
			} finally {
				p.value = null;
			}
			if (r.error) {
				g.value = r.error;
				return;
			}
			i.flow.findNode(e.id) === e && (i.updateData(e.id, { [d.value.field]: r.code }), m.value = r.note || "Done.", _.value = {
				previous: t,
				written: r.code
			}, f.value = "");
		}
		function E() {
			i.updateData(n.node.id, { [d.value.field]: _.value.previous }), _.value = null, m.value = "";
		}
		function O(e) {
			e.key !== "Enter" || e.shiftKey || e.isComposing || (e.preventDefault(), T());
		}
		let k = r(() => {
			let e = l.value.sampleRows, t = e > 0 ? `its inputs' columns and first ${e} ${e === 1 ? "row" : "rows"}` : "its inputs' columns", r = n.node.data.kind === "sql-query" ? ", and the server database's tables and columns," : "";
			return `Sends your request, this node's ${d.value.language}, ${t}${r} to ${l.value.model} through the server.`;
		}), A = C(), j = {
			request: `${A}-request`,
			note: `${A}-note`
		};
		return (e, t) => l.value && d.value ? (h(), o("div", bn, [
			s("label", {
				class: "flow-field-label",
				for: j.request
			}, "Assistant", 8, xn),
			s("div", Sn, [D(s("textarea", {
				id: j.request,
				"onUpdate:modelValue": t[0] ||= (e) => f.value = e,
				class: "flow-field-input flow-assist-input",
				rows: "2",
				placeholder: `Say what the ${d.value.language} should do`,
				"aria-describedby": j.note,
				onKeydown: O
			}, null, 40, Cn), [[w, f.value]]), s("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": !b.value,
				onClick: T
			}, x(y.value ? "Writing…" : "Write"), 9, wn)]),
			s("div", {
				id: j.note,
				class: "flow-assist-status",
				"aria-live": "polite"
			}, [y.value ? (h(), o("p", En, x(p.value === "reading" ? "Reading its inputs…" : `Writing with ${l.value.model}…`), 1)) : g.value ? (h(), o("p", Dn, x(g.value), 1)) : m.value ? (h(), o("p", On, [c(x(m.value) + " ", 1), S.value ? (h(), o("button", {
				key: 0,
				type: "button",
				class: "flow-suggestion",
				onClick: E
			}, "Undo")) : a("", !0)])) : a("", !0), s("p", kn, x(k.value) + " Check what it writes before you run it.", 1)], 8, Tn)
		])) : a("", !0);
	}
}, jn = { class: "flow-props" }, Mn = { class: "flow-field" }, Nn = ["for"], Pn = [
	"id",
	"aria-invalid",
	"aria-describedby"
], Fn = ["id"], In = {
	key: 0,
	class: "flow-field-error"
}, Ln = { class: "flow-field-hint" }, Rn = { class: "flow-field" }, zn = ["for"], Bn = ["id", "placeholder"], Vn = {
	key: 0,
	class: "flow-field"
}, Hn = ["for"], Un = ["id", "onKeydown"], Wn = {
	key: 1,
	class: "flow-field"
}, Gn = ["for"], Kn = ["id", "onKeydown"], qn = {
	key: 2,
	class: "flow-field"
}, Jn = ["for"], Yn = ["id", "onKeydown"], Xn = { class: "flow-field" }, Zn = [
	"id",
	"accept",
	"disabled",
	"aria-describedby"
], Qn = ["id"], $n = {
	key: 0,
	class: "flow-field-error"
}, er = {
	key: 1,
	class: "flow-field-hint"
}, tr = {
	key: 2,
	class: "flow-field-hint"
}, nr = { class: "flow-field" }, rr = ["for"], ir = [
	"id",
	"value",
	"disabled"
], ar = { value: "" }, or = ["value"], sr = {
	key: 0,
	class: "flow-field"
}, cr = ["for"], lr = [
	"id",
	"placeholder",
	"aria-describedby",
	"onKeydown"
], ur = ["id"], dr = { class: "flow-field" }, fr = ["for"], pr = ["id", "aria-describedby"], mr = ["id"], hr = { class: "flow-field" }, gr = ["for"], _r = ["id", "value"], vr = ["value"], yr = {
	key: 5,
	class: "flow-field"
}, br = ["for"], xr = { class: "flow-field-prefixed" }, Sr = {
	class: "flow-field-prefix",
	"aria-hidden": "true"
}, Cr = ["id"], wr = { class: "flow-field-check" }, Tr = ["checked"], Er = { class: "flow-field" }, Dr = { class: "flow-actions" }, Or = ["aria-disabled"], kr = { class: "flow-field-hint" }, Ar = {
	key: 7,
	class: "flow-field-hint"
}, jr = {
	__name: "NodeProperties",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, l = u(Z), f = r(() => V[t.node.data.kind]), p = r(() => l.run.status[t.node.id]), m = r(() => p.value === "running"), g = v(""), _ = v(""), b = v(""), E = v(""), A = v(""), j = v(""), M = v(""), N = v(""), P = v(""), F = v(""), I = v(!1), L = null;
		T(() => {
			let { id: e, data: n } = t.node;
			return [
				t.node,
				e,
				n.label,
				n.outputSuffix,
				n.sqlQuery,
				n.jsCode,
				n.pythonCode,
				n.exportInput,
				n.exportFilename
			];
		}, ([e], [n] = []) => {
			L = t.node, g.value = t.node.id, _.value = "", b.value = t.node.data.label ?? "", E.value = t.node.data.outputSuffix ?? "", A.value = t.node.data.sqlQuery ?? "", j.value = t.node.data.jsCode ?? "", M.value = t.node.data.pythonCode ?? "", N.value = t.node.data.exportInput ?? "", P.value = t.node.data.exportFilename ?? "", e !== n && (F.value = "");
		}, { immediate: !0 });
		let R = () => l.flow.findNode(L.id) === L ? L : null;
		function ee() {
			R() && (_.value = l.renameNode(L.id, g.value) ?? "", _.value || (g.value = L.id));
		}
		function z() {
			R() && l.setLabel(L.id, b.value);
		}
		function B() {
			R() && (l.setOutputName(L.id, E.value), E.value = L.data.outputSuffix ?? "");
		}
		function H() {
			R() && l.updateData(L.id, { sqlQuery: A.value });
		}
		function U() {
			H(), R() && l.runNode(L.id);
		}
		function te() {
			R() && l.updateData(L.id, { jsCode: j.value });
		}
		function ne() {
			te(), R() && l.runNode(L.id);
		}
		function re() {
			R() && l.updateData(L.id, { pythonCode: M.value });
		}
		function ie() {
			re(), R() && l.runNode(L.id);
		}
		function ae() {
			R() && l.updateData(L.id, { exportInput: N.value.trim() || void 0 });
		}
		function oe() {
			R() && l.updateData(L.id, { exportFilename: P.value.trim() || void 0 });
		}
		let ce = r(() => ({
			"sql-query": A,
			"python-script": M,
			javascript: j
		})[t.node.data.kind]?.value ?? ""), ue = r(() => {
			let e = W(t.node.id, t.node.data), n = t.node.data.ingest;
			if (!n || !K[n.format].multi) return `this node's data as “${e}”`;
			let r = n.tables.map((t) => `“${e}.${t.name}”`);
			return `this node's tables as ${r.slice(0, 3).join(", ")}${r.length > 3 ? ", …" : ""}`;
		}), G = r(() => t.node.data.ingest), de = r(() => G.value && ye(G.value.fileName)), fe = r(() => {
			let { fileName: e, fileSize: t, format: n, tables: r } = G.value, i = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`, a = K[n].multi ? `${r.length} ${n === "xlsx" ? "sheets" : "tables"}, ${i(r.reduce((e, t) => e + t.rowCount, 0))}` : i(r[0]?.rowCount ?? 0);
			return `${e} · ${Se(t)} · ${K[n].label}, ${a}`;
		}), pe = r(() => G.value && !t.node.data.label && xe(G.value.fileName));
		async function me(e) {
			let n = t.node;
			I.value = !0, F.value = "";
			try {
				let r = await e();
				t.node === n && (F.value = r ?? "");
			} finally {
				I.value = !1;
			}
		}
		function ve(e) {
			let n = e.target.files[0];
			e.target.value = "", n && me(() => l.chooseFile(t.node.id, n));
		}
		let Ce = (e) => me(() => l.setIngestFormat(t.node.id, e.target.value)), we = r(() => [...new Set(l.flow.edges.value.filter((e) => e.target === t.node.id).map((e) => e.source))].map((e) => l.flow.findNode(e)).filter(Boolean).flatMap((e) => {
			let t = W(e.id, e.data), n = V[e.data.kind].category, r = e.data.ingest && K[e.data.ingest.format].multi ? e.data.ingest.tables : [];
			return [{
				name: t,
				category: n
			}, ...r.map((e) => ({
				name: `${t}.${e.name}`,
				category: n,
				table: !0
			}))];
		})), Te = r(() => we.value.filter((e) => !e.table).length > 1 || !!t.node.data.exportInput), Ee = u(le), De = v(null);
		function Oe() {
			let e = De.value.getBoundingClientRect();
			Ee({
				x: e.left,
				y: e.bottom + 4
			}, { items: we.value.map(({ name: e, category: t }) => ({
				label: e,
				badge: { class: `flow-node--${t}` },
				action: () => {
					N.value = e, ae();
				}
			})) });
		}
		let ke = r(() => t.node.data.exportFormat ?? ""), Ae = r(() => {
			let e = P.value.trim() || "export";
			return be(e, ke.value || ye(e) || "csv");
		}), je = (e) => l.updateData(t.node.id, { exportFormat: e.target.value || void 0 }), Me = r(() => t.node.data.autoRun !== !1), Ne = (e) => l.updateData(t.node.id, { autoRun: e.target.checked ? void 0 : !1 }), Pe = r(() => t.node.data.sqlServerTables ?? []), Fe = r(() => se(t.node.data)), Ie = l.server, Le = r(() => Fe.value && Ie.value.state !== "connected"), Re = r(() => !m.value && !I.value && !Le.value && (t.node.data.kind !== "data-ingest" || !!G.value)), ze = r(() => t.node.data.kind === "data-export" ? "Writes whatever's wired into this node on Run. Downloads to your computer immediately; errors show in the Console panel." : "Results land in the Data panel; errors show in the Console panel.");
		function Be(e) {
			let t = e.target.parentElement.closest("[tabindex]");
			t ? t.focus() : e.target.blur();
		}
		let q = C(), J = {
			id: `${q}-id`,
			idNote: `${q}-id-note`,
			label: `${q}-label`,
			sql: `${q}-sql`,
			output: `${q}-output`,
			file: `${q}-file`,
			fileNote: `${q}-file-note`,
			format: `${q}-format`,
			filename: `${q}-filename`,
			filenameNote: `${q}-filename-note`,
			js: `${q}-js`,
			py: `${q}-py`,
			input: `${q}-input`,
			inputNote: `${q}-input-note`
		};
		return (t, r) => (h(), o("div", jn, [
			s("div", Mn, [
				s("label", {
					class: "flow-field-label",
					for: J.id
				}, "ID", 8, Nn),
				D(s("input", {
					id: J.id,
					"onUpdate:modelValue": r[0] ||= (e) => g.value = e,
					class: d(["flow-field-input flow-field-input--mono", { "is-invalid": _.value }]),
					"aria-invalid": !!_.value,
					"aria-describedby": J.idNote,
					spellcheck: "false",
					autocomplete: "off",
					onInput: r[1] ||= (e) => _.value = "",
					onBlur: ee,
					onKeydown: O(Be, ["enter"])
				}, null, 42, Pn), [[w, g.value]]),
				s("div", { id: J.idNote }, [_.value ? (h(), o("p", In, x(_.value), 1)) : a("", !0), s("p", Ln, " Downstream nodes reference " + x(ue.value) + ". Renaming doesn't update that text inside other nodes' queries or code — you'll need to update those yourself. ", 1)], 8, Fn)
			]),
			s("div", Rn, [s("label", {
				class: "flow-field-label",
				for: J.label
			}, "Name", 8, zn), D(s("input", {
				id: J.label,
				"onUpdate:modelValue": r[2] ||= (e) => b.value = e,
				class: "flow-field-input",
				placeholder: f.value.label,
				autocomplete: "off",
				onBlur: z,
				onKeydown: O(Be, ["enter"])
			}, null, 40, Bn), [[w, b.value]])]),
			(h(), i(An, {
				key: e.node.id,
				node: e.node,
				code: ce.value
			}, null, 8, ["node", "code"])),
			e.node.data.kind === "sql-query" ? (h(), o("div", Vn, [
				s("label", {
					class: "flow-field-label",
					for: J.sql
				}, "SQL", 8, Hn),
				D(s("textarea", {
					id: J.sql,
					"onUpdate:modelValue": r[3] ||= (e) => A.value = e,
					class: "flow-field-input flow-field-input--mono flow-field-code",
					rows: "8",
					spellcheck: "false",
					placeholder: "SELECT * FROM upstream_node_data",
					onBlur: H,
					onKeydown: [O(k(U, ["ctrl", "prevent"]), ["enter"]), O(k(U, ["meta", "prevent"]), ["enter"])]
				}, null, 40, Un), [[w, A.value]]),
				r[12] ||= s("p", { class: "flow-field-hint" }, [
					c(" DuckDB SQL. A node wired in is a table named by its output, like "),
					s("code", null, "sqlnode1_data"),
					c(", and the query runs here. Read any other table and it runs on the server, over its database ("),
					s("code", null, "db"),
					c("; plain names look in its "),
					s("code", null, "public"),
					c(" schema) and the nodes wired in. Ctrl+Enter runs. ")
				], -1)
			])) : a("", !0),
			e.node.data.kind === "python-script" ? (h(), o("div", Wn, [
				s("label", {
					class: "flow-field-label",
					for: J.py
				}, "Python", 8, Gn),
				D(s("textarea", {
					id: J.py,
					"onUpdate:modelValue": r[4] ||= (e) => M.value = e,
					class: "flow-field-input flow-field-input--mono flow-field-code",
					rows: "8",
					spellcheck: "false",
					placeholder: "upstream_node_data.groupby('region').sum()",
					onBlur: re,
					onKeydown: [O(k(ie, ["ctrl", "prevent"]), ["enter"]), O(k(ie, ["meta", "prevent"]), ["enter"])]
				}, null, 40, Kn), [[w, M.value]]),
				r[13] ||= s("p", { class: "flow-field-hint" }, [
					c(" Each node wired in is a pandas DataFrame named by its output, like "),
					s("code", null, "sqlnode1_data"),
					c(" (several tables: "),
					s("code", null, "dataingest1_data.sheet1"),
					c("). The last line's value is this node's output: a DataFrame as its table, anything else shown as a value. "),
					s("code", null, "print"),
					c(" shows in the Console; "),
					s("code", null, "sleep(seconds)"),
					c(" waits. Ctrl+Enter runs. ")
				], -1)
			])) : a("", !0),
			e.node.data.kind === "javascript" ? (h(), o("div", qn, [
				s("label", {
					class: "flow-field-label",
					for: J.js
				}, "JavaScript", 8, Jn),
				D(s("textarea", {
					id: J.js,
					"onUpdate:modelValue": r[5] ||= (e) => j.value = e,
					class: "flow-field-input flow-field-input--mono flow-field-code",
					rows: "8",
					spellcheck: "false",
					placeholder: "return upstream_node_data.filter((row) => row.amount > 10)",
					onBlur: te,
					onKeydown: [O(k(ne, ["ctrl", "prevent"]), ["enter"]), O(k(ne, ["meta", "prevent"]), ["enter"])]
				}, null, 40, Yn), [[w, j.value]]),
				r[14] ||= s("p", { class: "flow-field-hint" }, [
					c(" Each node wired in is a variable named by its output, like "),
					s("code", null, "sqlnode1_data"),
					c(": an array of rows (objects), or an object of them for several tables ("),
					s("code", null, "dataingest1_data.sheet1"),
					c("). Return an array of rows to output a table. "),
					s("code", null, "console.log"),
					c(" and "),
					s("code", null, "print"),
					c(" show in the Console; "),
					s("code", null, "await sleep(seconds)"),
					c(" waits. Runs in a sandbox in this browser, with no access to this page, and stops after 30 seconds. Ctrl+Enter runs. ")
				], -1)
			])) : a("", !0),
			e.node.data.kind === "data-ingest" ? (h(), o(n, { key: 3 }, [s("div", Xn, [
				r[15] ||= s("span", { class: "flow-field-label" }, "File", -1),
				s("label", { class: d(["flow-file", { "is-busy": I.value }]) }, [s("input", {
					id: J.file,
					type: "file",
					class: "flow-file-input",
					accept: S(_e),
					disabled: I.value,
					"aria-describedby": J.fileNote,
					onChange: ve
				}, null, 40, Zn), c(" " + x(I.value ? "Reading…" : G.value ? "Choose another file…" : "Choose file…"), 1)], 2),
				s("div", { id: J.fileNote }, [F.value ? (h(), o("p", $n, x(F.value), 1)) : a("", !0), G.value ? (h(), o("p", er, x(fe.value), 1)) : (h(), o("p", tr, " CSV, TSV, JSON, GeoJSON, Parquet, Excel (.xlsx) or SQLite. Its data is read and kept; the file itself isn't. "))], 8, Qn),
				pe.value ? (h(), o("button", {
					key: 0,
					type: "button",
					class: "flow-suggestion",
					onClick: r[6] ||= (t) => S(l).setLabel(e.node.id, pe.value)
				}, " Rename to “" + x(pe.value) + "” to match " + x(G.value.fileName) + "? ", 1)) : a("", !0)
			]), s("div", nr, [s("label", {
				class: "flow-field-label",
				for: J.format
			}, "File Type", 8, rr), s("select", {
				id: J.format,
				class: "flow-field-input flow-field-select",
				value: e.node.data.ingestFormat ?? "",
				disabled: I.value,
				onChange: Ce
			}, [s("option", ar, " From file name" + x(de.value ? ` (${S(K)[de.value].label})` : ""), 1), (h(!0), o(n, null, y(S(he), (e) => (h(), o("option", {
				key: e,
				value: e
			}, x(S(K)[e].label), 9, or))), 128))], 40, ir)])], 64)) : a("", !0),
			e.node.data.kind === "data-export" ? (h(), o(n, { key: 4 }, [
				Te.value ? (h(), o("div", sr, [
					s("label", {
						class: "flow-field-label",
						for: J.input
					}, "Input", 8, cr),
					s("div", {
						ref_key: "inputField",
						ref: De,
						class: "flow-field-combo"
					}, [D(s("input", {
						id: J.input,
						"onUpdate:modelValue": r[7] ||= (e) => N.value = e,
						class: "flow-field-input flow-field-input--mono",
						placeholder: we.value[0]?.name ?? "",
						autocomplete: "off",
						spellcheck: "false",
						"aria-describedby": J.inputNote,
						onBlur: ae,
						onKeydown: [O(Be, ["enter"]), O(k(Oe, ["alt", "prevent"]), ["down"])]
					}, null, 40, lr), [[w, N.value]]), s("button", {
						type: "button",
						class: "flow-field-combo-button",
						"aria-label": "Choose from the nodes wired in",
						"aria-haspopup": "menu",
						onClick: Oe
					}, [...r[16] ||= [s("svg", {
						viewBox: "0 0 12 12",
						"aria-hidden": "true"
					}, [s("path", { d: "M3 4.5 6 7.5 9 4.5" })], -1)]])], 512),
					s("p", {
						id: J.inputNote,
						class: "flow-field-hint"
					}, [
						r[17] ||= c(" Several nodes are wired in: name the one to write, by its output (like ", -1),
						s("code", null, x(we.value[0]?.name), 1),
						r[18] ||= c("), or choose it from the list. Left empty, it only runs with one wired in. ", -1)
					], 8, ur)
				])) : a("", !0),
				s("div", dr, [
					s("label", {
						class: "flow-field-label",
						for: J.filename
					}, "Filename", 8, fr),
					D(s("input", {
						id: J.filename,
						"onUpdate:modelValue": r[8] ||= (e) => P.value = e,
						class: "flow-field-input",
						placeholder: "export",
						autocomplete: "off",
						spellcheck: "false",
						"aria-describedby": J.filenameNote,
						onBlur: oe,
						onKeydown: O(Be, ["enter"])
					}, null, 40, pr), [[w, P.value]]),
					s("p", {
						id: J.filenameNote,
						class: "flow-field-hint"
					}, "Saves as " + x(Ae.value), 9, mr)
				]),
				s("div", hr, [s("label", {
					class: "flow-field-label",
					for: J.format
				}, "File Type", 8, gr), s("select", {
					id: J.format,
					class: "flow-field-input flow-field-select",
					value: ke.value,
					onChange: je
				}, [r[19] ||= s("option", { value: "" }, "From file name (CSV if none)", -1), (h(!0), o(n, null, y(S(ge), (e) => (h(), o("option", {
					key: e,
					value: e
				}, x(S(K)[e].label), 9, vr))), 128))], 40, _r)])
			], 64)) : a("", !0),
			f.value.outputName ? (h(), o("div", yr, [s("label", {
				class: "flow-field-label",
				for: J.output
			}, "Output Name", 8, br), s("div", xr, [s("span", Sr, x(e.node.id) + "_", 1), D(s("input", {
				id: J.output,
				"onUpdate:modelValue": r[9] ||= (e) => E.value = e,
				class: "flow-field-input flow-field-input--mono",
				placeholder: "data",
				spellcheck: "false",
				autocomplete: "off",
				onBlur: B,
				onKeydown: O(Be, ["enter"])
			}, null, 40, Cr), [[w, E.value]])])])) : a("", !0),
			f.value.runs ? (h(), o(n, { key: 6 }, [
				Fe.value ? (h(), o("p", {
					key: 0,
					class: d(["flow-field-note", { "is-warning": Le.value }])
				}, [
					Pe.value.length ? (h(), o(n, { key: 0 }, [c(" Reads " + x(Pe.value.join(", ")) + " from the server, so it runs there: ", 1)], 64)) : (h(), o(n, { key: 1 }, [c("Runs on the server:")], 64)),
					c(" running this node sends its input data to the server" + x(S(Ie).state === "connected" && S(Ie).address ? ` at ${S(Ie).address}` : "") + " to complete. ", 1),
					Le.value ? (h(), o(n, { key: 2 }, [c("The server isn't available, so it can't run now.")], 64)) : a("", !0)
				], 2)) : a("", !0),
				s("label", wr, [r[20] ||= c(" Auto Run ", -1), s("input", {
					type: "checkbox",
					checked: Me.value,
					onChange: Ne
				}, null, 40, Tr)]),
				s("div", Er, [s("div", Dr, [s("button", {
					type: "button",
					class: "flow-button flow-button--wide",
					"aria-disabled": !Re.value,
					onClick: r[10] ||= (t) => Re.value && S(l).runNode(e.node.id)
				}, x(m.value ? "Running…" : "Run"), 9, Or), p.value && !m.value ? (h(), o("button", {
					key: 0,
					type: "button",
					class: "flow-button flow-button--quiet",
					title: "Back to not run: clears its status and output",
					onClick: r[11] ||= (t) => S(l).resetNode(e.node.id)
				}, " Reset ")) : a("", !0)]), s("p", kr, x(ze.value), 1)])
			], 64)) : (h(), o("p", Ar, "No editable properties yet for this node kind."))
		]));
	}
}, Mr = {
	key: 1,
	class: "flow-panel-empty"
}, Nr = {
	__name: "ManagePanel",
	setup(e) {
		let t = u(Z);
		return (e, n) => (h(), i(Nt, {
			class: "manage-panel",
			name: "manage",
			title: "Manage",
			dock: "right",
			hotkey: "M"
		}, {
			default: E(() => [S(t).selectedNode.value ? (h(), i(jr, {
				key: 0,
				node: S(t).selectedNode.value
			}, null, 8, ["node"])) : (h(), o("p", Mr, "Select a node to see its properties."))]),
			_: 1
		}));
	}
}, Pr = [
	"aria-label",
	"aria-expanded",
	"onClick"
], Fr = { class: "flow-panel-rail-text" }, Ir = {
	__name: "FlowPanelRails",
	setup(t) {
		let r = u(bt);
		return (t, i) => (h(!0), o(n, null, y(S(r).rails.value, (t, i) => (h(), o(n, { key: i }, [t.length ? (h(), o("div", {
			key: 0,
			class: d(["flow-rail-group", `flow-rail-group--${i}`])
		}, [(h(!0), o(n, null, y(t, (t) => D((h(), o("button", {
			key: t.name,
			type: "button",
			class: d([
				"flow-panel-rail",
				`flow-panel-rail--${i}`,
				{ "is-open": !t.collapsed }
			]),
			"aria-label": `${t.title} panel`,
			"aria-expanded": !t.collapsed,
			onClick: (e) => S(r).toggle(t.name)
		}, [s("span", Fr, x(t.title), 1)], 10, Pr)), [[S(e), {
			items: S(ue),
			context: t.name
		}]])), 128))], 2)) : a("", !0)], 64))), 128));
	}
}, Lr = {
	__name: "ServerStatus",
	setup(e) {
		let t = u(Z), i = t.server, l = r(() => i.value.state === "connected"), f = r(() => l.value && t.flow.nodes.value.some((e) => se(e.data)));
		return (e, t) => S(i).state === "checking" ? a("", !0) : (h(), o("div", {
			key: 0,
			class: d(["flow-server-status", l.value ? "flow-node--modify" : "flow-node--fetch"]),
			role: "status"
		}, [s("span", {
			class: d(["flow-blink-dot", { "is-steady": !f.value }]),
			"aria-hidden": "true"
		}, null, 2), l.value ? (h(), o(n, { key: 0 }, [c(" LIVE · connected to server" + x(S(i).address ? ` ${S(i).address}` : ""), 1)], 64)) : (h(), o(n, { key: 1 }, [c("backend not available, client execution only")], 64))], 2));
	}
}, Rr = 400;
function zr(e, t) {
	let n = null, r = null;
	function i() {
		n && (clearTimeout(n), n = null, t.save(e.snapshot.value));
	}
	function a() {
		clearTimeout(n), n = setTimeout(i, Rr);
	}
	let o = () => document.visibilityState === "hidden" && i();
	m(async () => {
		e.load(t ? await t.load() : null), t && (r = T(e.snapshot, a), window.addEventListener("pagehide", i), document.addEventListener("visibilitychange", o));
	}), p(() => {
		r?.(), window.removeEventListener("pagehide", i), document.removeEventListener("visibilitychange", o), t && i();
	});
}
//#endregion
//#region lib/themes.js
var Br = [
	"FLOW",
	"FLOWDARK",
	"LUX",
	"LUXDARK"
], Vr = new Map(Br.map((e) => [e, {
	name: e,
	base: null,
	tokens: {}
}])), $ = (e) => String(e).toUpperCase();
function Hr({ name: e, base: t = "FLOW", tokens: n = {} }) {
	if (!e) throw Error("A theme needs a name.");
	if (Br.includes($(e))) throw Error(`${$(e)} is a built-in theme; give yours another name.`);
	if (!Vr.has($(t))) throw Error(`Theme ${$(e)} is based on ${$(t)}, which isn't defined.`);
	Vr.set($(e), {
		name: $(e),
		base: $(t),
		tokens: { ...n }
	});
}
var Ur = (e) => Vr.has($(e)), Wr = () => [...Vr.keys()];
function Gr(e) {
	let t = Vr.get($(e)) ?? Vr.get("FLOW");
	if (!t.base) return {
		name: t.name,
		className: `flow-theme-${t.name.toLowerCase()}`,
		tokens: {}
	};
	let n = Gr(t.base);
	return {
		name: t.name,
		className: n.className,
		tokens: {
			...n.tokens,
			...t.tokens
		}
	};
}
//#endregion
//#region widgets/FlowgraphEditor.vue
var Kr = { class: "flow-title flow-pan-trigger" }, qr = { class: "flow-brand-text flow-title-text" }, Jr = {
	__name: "FlowgraphEditor",
	props: {
		storage: {
			type: Object,
			default: null
		},
		sql: {
			type: Object,
			default: null
		},
		server: {
			type: Object,
			default: null
		},
		title: {
			type: String,
			default: "SEAMONSTER"
		},
		theme: {
			type: String,
			default: "FLOW",
			validator: Ur
		}
	},
	setup(n) {
		let a = n, o = r(() => Gr(a.theme)), c = r(() => o.value.className), u = r(() => o.value.tokens), _ = Dt();
		g(bt, _);
		let y = it({
			sql: a.sql,
			files: a.storage,
			server: a.server
		});
		g(Z, y), zr(y, a.storage);
		let { commands: b, canvasMenu: C } = me(_, y), w = v(null), T = r(() => w.value?.el), O = v(null), k = null;
		function A(e, t) {
			let n = document.createElement("div");
			n.style.cssText = `position:absolute;visibility:hidden;width:var(${t})`, e.appendChild(n);
			let r = n.offsetWidth;
			return n.remove(), r;
		}
		function j() {
			let e = T.value, t = O.value, n = A(e, "--flow-panel-radius");
			_.setFrame({
				width: e.clientWidth,
				height: e.clientHeight,
				gap: n,
				leftTop: t.offsetTop + t.offsetHeight + n
			});
		}
		m(() => {
			k = new ResizeObserver(j), k.observe(T.value);
		}), p(() => k?.disconnect());
		let M = (e) => !!e.target.closest(".wm-content");
		function N(e) {
			!e.target.closest(".flow-panel, .flow-panel-rail") && !M(e) && _.deactivate();
		}
		function P(e) {
			M(e) || (_.onKeydown(e), y.onKeydown(e));
		}
		function F(e) {
			w.value.open(e.point, {
				items: pe,
				context: e
			});
		}
		return g(le, (e, t) => w.value.open(e, t)), (r, a) => (h(), i(S(t), {
			ref_key: "host",
			ref: w,
			class: d(["flow-editor", c.value]),
			commands: S(b),
			tabindex: "-1",
			role: "application",
			"aria-label": n.title,
			style: f(u.value),
			onPointerdown: N,
			onKeydown: P
		}, {
			default: E(() => [
				D(l(yt, { onConnectionDropped: F }, null, 512), [[S(e), S(C)]]),
				s("div", {
					ref_key: "titleBarEl",
					ref: O,
					class: "flow-title-bar"
				}, [s("span", Kr, [s("span", qr, x(n.title), 1)])], 512),
				l(Wt),
				l(Yt),
				l($t),
				l(yn),
				l(Nr),
				l(Ir),
				l(Lr)
			]),
			_: 1
		}, 8, [
			"class",
			"commands",
			"aria-label",
			"style"
		]));
	}
};
//#endregion
export { Z as FLOW_GRAPH, Nt as FlowPanel, Jr as FlowgraphEditor, B as NODE_CATEGORIES, V as NODE_KINDS, bt as PANEL_LAYOUT, Hr as defineTheme, Gr as resolveTheme, Wr as themeNames };
