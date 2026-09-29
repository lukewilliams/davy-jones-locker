import { r as e } from "./menu-ByXvYfw3.js";
import { a as t, c as n, i as r, n as i, o as a, r as o, s, t as c } from "./panels-dfiW9ww3.js";
import { Fragment as l, computed as u, createBlock as d, createCommentVNode as f, createElementBlock as p, createElementVNode as m, createTextVNode as h, createVNode as g, inject as _, normalizeClass as v, normalizeStyle as y, onBeforeUnmount as b, onMounted as x, openBlock as S, provide as C, reactive as w, ref as T, renderList as E, toDisplayString as D, unref as O, useId as k, vModelText as A, watch as j, withCtx as M, withDirectives as N, withKeys as P, withModifiers as F } from "vue";
import { ConnectionMode as I, Handle as L, Position as R, VueFlow as ee, getBezierPath as te, useNodeConnections as ne, useVueFlow as re } from "@vue-flow/core";
import { Background as ie } from "@vue-flow/background";
//#region components/NodeFace.vue
var ae = { class: "flow-node-status" }, oe = { class: "flow-node-label" }, se = {
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
		return (t, n) => (S(), p("div", { class: v(["flow-node-face", { "is-selected": e.selected }]) }, [m("span", ae, D(e.status), 1), m("span", oe, D(e.label), 1)], 2));
	}
}, ce = [
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
], z = {
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
}, le = "application/x-flow-node-kind", ue = (e) => Object.keys(z).filter((t) => z[t].category === e), B = (e) => Object.hasOwn(z, e), V = (e) => B(e) ? z[e] : {
	label: String(e),
	category: "unknown",
	unknown: !0
};
function H(e) {
	let t = V(e);
	return {
		inputs: t.inputs ?? 1,
		outputs: t.outputs ?? 1
	};
}
function de(e, t) {
	let n = 1;
	for (; t.has(`${e}${n}`);) n++;
	return `${e}${n}`;
}
var fe = (e, t) => de(z[e].idPrefix, new Set(t));
function pe(e, t) {
	let n = new Set(t);
	return n.has(e) ? de(e, n) : e;
}
var me = (e, t) => B(e) && RegExp(`^${z[e].idPrefix}\\d+$`).test(t);
function he(e) {
	let t = e.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
	return /^\d/.test(t) ? `_${t}` : t;
}
var U = (e, t) => `${e}_${t.outputSuffix || "data"}`, ge = (e) => B(e.kind) && (z[e.kind].where === "server" || !!e.sqlServerTables?.length), _e = (e) => Array.from({ length: e }, (t, n) => `${(n + 1) / (e + 1) * 100}%`), ve = Symbol("flow-open-menu"), ye = [
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
], be = [{
	label: "Delete wire",
	command: "wire.delete",
	shortcut: "Del"
}], xe = (e) => ce.map((t) => ({
	type: "submenu",
	label: t.label,
	badge: { class: `flow-node--${t.id}` },
	items: ue(t.id).map((t) => ({
		label: z[t].label,
		command: e,
		args: { kind: t }
	}))
})), Se = xe("node.addConnected");
function Ce(e, n) {
	return {
		commands: {
			"node.add": (e, { kind: t }) => n.addNode(t),
			"node.addConnected": ({ point: e, from: t }, { kind: r }) => n.addConnectedNode(r, e, t),
			"node.reset": {
				disabled: (e) => !n.run.status[e] || n.run.status[e] === "running",
				run: (e) => n.resetNode(e)
			},
			"node.delete": (e) => n.remove({ nodeIds: [e] }),
			"wire.delete": (e) => n.remove({ edgeIds: [e] })
		},
		canvasMenu: [{
			type: "submenu",
			label: "Nodes",
			items: xe("node.add")
		}, t(e)]
	};
}
//#endregion
//#region lib/fileFormats.js
var W = {
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
}, we = Object.keys(W).filter((e) => W[e].read), Te = Object.keys(W).filter((e) => W[e].write), Ee = we.flatMap((e) => W[e].extensions).map((e) => `.${e}`).join(","), De = (e) => /\.([^./\\]+)$/.exec(e)?.[1].toLowerCase() ?? "";
function G(e) {
	let t = De(e);
	return Object.keys(W).find((e) => W[e].extensions.includes(t)) ?? null;
}
function Oe(e, t) {
	let { extensions: n } = W[t];
	return n.includes(De(e)) ? e : `${e}.${n[0]}`;
}
var ke = (e) => e.replace(/\.[^.]*$/, "").replace(/[_\-\s]+/g, " ").trim();
function Ae(e) {
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
var je = {
	format: "pipeline",
	nodes: [],
	edges: []
};
function Me(e, t, n) {
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
var Ne = (e) => Number.isFinite(e?.x) && Number.isFinite(e?.y);
function Pe(e) {
	if (e?.format !== "pipeline" || !Array.isArray(e.nodes) || !Array.isArray(e.edges)) return null;
	let t = e.nodes.filter((e) => typeof e?.id == "string" && typeof e.kind == "string" && e.kind && Ne(e.position)).map(({ id: e, position: t, ...n }) => ({
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
		viewport: Ne(e.viewport) && Number.isFinite(e.viewport.zoom) ? e.viewport : null
	};
}
//#endregion
//#region lib/jsSandbox.js
var Fe = 30;
function Ie() {
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
function Le(e) {
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
var Re = `<script>(${Le})(${JSON.stringify(`(${Ie})()`)})<\/script>`;
function ze(e, t, { timeoutSeconds: n = Fe } = {}) {
	return new Promise((r, i) => {
		let a = document.createElement("iframe");
		a.sandbox = "allow-scripts", a.hidden = !0, a.srcdoc = Re;
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
var Be = 67324752, K = 33639248, q = 101010256, J = "This doesn't look like an .xlsx file.", Ve = (e) => new DataView(e.buffer, e.byteOffset, e.byteLength);
function He(e, t) {
	for (let n = e.length - 22; n >= Math.max(0, e.length - 65557); n--) if (t.getUint32(n, !0) === q) return n;
	return -1;
}
async function Ue(e) {
	return [...(await Ke(e, "xl/workbook.xml")).matchAll(/<sheet\b[^>]*?\bname="([^"]*)"/g)].map((e) => We(e[1]));
}
var We = (e) => e.replace(/&(lt|gt|quot|apos|amp);/g, (e, t) => ({
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	amp: "&"
})[t]);
function Ge(e) {
	let t = Ve(e);
	if (e.length >= 4 && t.getUint32(0, !0) === Be) return e;
	let n = He(e, t);
	if (n < 0) return e;
	let r = t.getUint32(n + 12, !0), i = t.getUint32(n + 16, !0), a = n - r - i;
	return a > 0 && t.getUint32(a, !0) === Be ? e.slice(a) : e;
}
async function Ke(e, t) {
	let n = Ve(e), r = He(e, n);
	if (r < 0) throw Error(J);
	let i = n.getUint16(r + 10, !0), a = n.getUint32(r + 16, !0);
	for (let r = 0; r < i && n.getUint32(a, !0) === K; r++) {
		let r = n.getUint16(a + 10, !0), i = n.getUint32(a + 20, !0), o = n.getUint16(a + 28, !0), s = o + n.getUint16(a + 30, !0) + n.getUint16(a + 32, !0);
		if (new TextDecoder().decode(e.subarray(a + 46, a + 46 + o)) === t) {
			let t = n.getUint32(a + 42, !0), o = t + 30 + n.getUint16(t + 26, !0) + n.getUint16(t + 28, !0), s = e.subarray(o, o + i);
			if (r === 0) return new TextDecoder().decode(s);
			if (r === 8) {
				let e = new Blob([s]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
				return new Response(e).text();
			}
			throw Error(J);
		}
		a += 46 + s;
	}
	throw Error(J);
}
var Y = "flow_out", qe = "flow_in", Je = /* @__PURE__ */ new Set([
	"memory",
	"system",
	"temp"
]), Ye = /* @__PURE__ */ new Set(["information_schema", "pg_catalog"]), X = (e) => `"${e.replaceAll("\"", "\"\"")}"`, Z = (e) => `'${e.replaceAll("'", "''")}'`, Xe = (e) => e?.message ?? String(e);
function Ze(e, t) {
	Array.isArray(e) ? e.forEach((e) => Ze(e, t)) : e && typeof e == "object" && (t(e), Object.values(e).forEach((e) => Ze(e, t)));
}
function Qe(e) {
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
		let o = new Map(t.nodes.map((e) => [e.id, e])), { order: s, inputs: c } = tt(t, n);
		await e.query(`DROP SCHEMA IF EXISTS ${Y} CASCADE`), await e.query(`CREATE SCHEMA ${Y}`);
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
				f[e] = { error: Xe(t) };
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
				name: U(e, t),
				kind: V(t.kind).label,
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
			sample: (n > 0 ? (await e.query(`SELECT * FROM ${t} LIMIT ${Math.floor(n)}`)).rows : []).map((e) => e.map($e))
		};
	}
	function l(e, t, n, r) {
		switch (e.kind) {
			case "sql-query": return b(e, t, n, r);
			case "data-ingest": return S(e, n, r);
			case "data-export": return C(e, t, r);
			case "javascript": return _(e, t, n, r);
			case "python-script": return h(e, t, n, r);
			default: return { error: B(e.kind) ? `${V(e.kind).label} nodes can't run yet.` : `This app doesn't have ${e.kind} nodes, so this one can't run here. It's kept as it was, and saving the graph keeps it.` };
		}
	}
	async function u(t, n) {
		let r = t.trim().replace(/;+\s*$/, "");
		if (!r || !e) return [];
		let i;
		try {
			i = JSON.parse((await e.query(`SELECT json_serialize_sql(${Z(r)})`)).rows[0][0]);
		} catch {
			return [];
		}
		if (i.error) return [];
		let a = (e) => (e ?? "").toLowerCase(), o = new Set(n.map((e) => a(e.name))), s = new Map(n.filter((e) => e.tables).map((e) => [a(e.name), new Set(e.tables.map(a))])), c = [], l = /* @__PURE__ */ new Set();
		Ze(i, (e) => {
			for (let { key: t } of e.cte_map?.map ?? []) l.add(a(t));
			e.type === "BASE_TABLE" && c.push(e);
		});
		let u = ({ catalog_name: e, schema_name: t, table_name: n }) => e ? Je.has(a(e)) : t ? Ye.has(a(t)) || !!s.get(a(t))?.has(a(n)) : o.has(a(n)) || l.has(a(n)), d = c.filter((e) => !u(e)).map((e) => [
			e.catalog_name,
			e.schema_name,
			e.table_name
		].filter(Boolean).join("."));
		return [...new Set(d)];
	}
	async function d(e, t) {
		let n = [];
		for (let r of e) {
			let e = U(r.id, r), i = t.get(r.id);
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
			await e.query(`CREATE TABLE ${t} AS SELECT * FROM read_parquet(${Z(r)})`);
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
		let l = `${Y}.${X(t.id)}`;
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
		for (let e of n) o[U(e.id, e)] = await g(i.get(e.id));
		let s, c;
		try {
			({value: s, logs: c} = await ze(a, o));
		} catch (e) {
			return {
				error: Xe(e),
				output: (e.logs ?? []).join("\n")
			};
		}
		let l = c.join("\n");
		if (s !== void 0 && !Array.isArray(s)) return {
			error: "Return an array of rows (objects, one per row) to output a table, or return nothing.",
			output: l
		};
		let u = `${Y}.${X(t.id)}`, d = (s ?? []).map((e) => typeof e == "object" && e && !Array.isArray(e) ? e : { value: e });
		if (d.length) {
			let n = `flow-js-${t.id}-${Date.now()}.json`;
			await e.registerFile(n, new TextEncoder().encode(JSON.stringify(d)));
			try {
				await e.query(`CREATE TABLE ${u} AS SELECT * FROM read_json_auto(${Z(n)}, format = 'array')`);
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
		for (let t of [qe, ...n]) await e.query(`DROP SCHEMA IF EXISTS ${X(t)} CASCADE`);
		n = [], await e.query(`CREATE SCHEMA ${qe}`), await e.query(`SET search_path = '${qe},main'`);
		for (let i of t) {
			let t = U(i.id, i), a = r.get(i.id);
			if (a.table) {
				await e.query(`CREATE VIEW ${qe}.${X(t)} AS SELECT * FROM ${a.table}`);
				continue;
			}
			await e.query(`CREATE SCHEMA ${X(t)}`), n.push(t);
			for (let n of a.tables) await e.query(`CREATE VIEW ${X(t)}.${X(n.name)} AS SELECT * FROM ${n.table}`);
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
		let s = `${Y}.${X(t.id)}`, c = await u(o, n.map((e) => x(e, i.get(e.id))));
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
			name: U(e.id, e),
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
			let c = `${Y}.${X(`${t.id}/${n.name}`)}`;
			try {
				await e.query(`CREATE TABLE ${c} AS SELECT * FROM read_parquet(${Z(s)})`);
			} finally {
				await e.dropFile(s);
			}
			o.push({
				...n,
				table: c
			});
		}
		if (!W[a.format].multi) return r.set(t.id, { table: o[0].table }), { data: await y(o[0].table, n.page) };
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
		let { source: i, input: a } = r, o = (e.exportFilename ?? "").trim() || "export", s = e.exportFormat || G(o) || "csv", c = Oe(o, s), l = W[s], u = a.table ? [{
			name: he(i.id) || "data",
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
		let r = t.map((e) => U(e.id, e)), i = (e.exportInput ?? "").trim();
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
		if (t === "geojson") return new TextEncoder().encode(JSON.stringify(et(await i(n[0].table))));
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
			return t === "xlsx" ? Ge(n) : n;
		} finally {
			await e.dropFile(o);
		}
	}
	async function E(t, n, r) {
		let i = await e.query(`COPY (${t}) TO ${Z(n)} (${r})`);
		return Number(i.rows[0]?.[0] ?? 0);
	}
	async function D() {
		await e.query("INSTALL excel"), await e.query("LOAD excel");
	}
	let O = (e, t, n) => r(() => k(e, t, n));
	async function k(t, n, r) {
		if (!e) throw Error("No SQL engine is connected, so files can't be read.");
		let i = `flow-upload-${Date.now()}.${W[r].extensions[0]}`, a = [];
		await e.registerFile(i, t);
		try {
			let o = await A(r, i, t, n, a), s = [], c = [];
			for (let [t, { label: n, select: r }] of o.entries()) {
				let o = pe(he(n) || "table", c);
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
		let o = Z(n), s = (e) => [{
			label: i.replace(/\.[^.]*$/, ""),
			select: e
		}];
		switch (t) {
			case "csv": return s(`SELECT * FROM read_csv(${o})`);
			case "tsv": return s(`SELECT * FROM read_csv(${o}, delim = '\t')`);
			case "json": return s(`SELECT * FROM read_json_auto(${o})`);
			case "parquet": return s(`SELECT * FROM read_parquet(${o})`);
			case "geojson": return s(`SELECT unnest(f.properties), to_json(f.geometry)::VARCHAR AS geometry FROM (SELECT unnest(features) AS f FROM read_json_auto(${o}))`);
			case "xlsx": return await D(), (await Ue(r)).map((e) => ({
				label: e,
				select: `SELECT * FROM read_xlsx(${o}, sheet = ${Z(e)}, header = true)`
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
			default: throw Error(`Can't read ${W[t]?.label ?? t} files.`);
		}
	}
	async function j({ columns: t, rows: n }, r, i) {
		if (!n.length) return `SELECT ${t.map((e) => `NULL::VARCHAR AS ${X(e)}`).join(", ") || "NULL AS empty"} WHERE false`;
		let a = n.map((e) => Object.fromEntries(t.map((t, n) => [t, e[n]])));
		return await e.registerFile(r, new TextEncoder().encode(JSON.stringify(a))), i.push(r), `SELECT * FROM read_json_auto(${Z(r)}, format = 'array')`;
	}
	return {
		run: i,
		readFile: O,
		serverTables: u,
		describeInputs: o
	};
}
function $e(e) {
	if (e instanceof Uint8Array) return `(${e.length} bytes)`;
	let t = typeof e == "bigint" ? String(e) : typeof e == "object" && e ? JSON.stringify(e, (e, t) => typeof t == "bigint" ? String(t) : t) : e;
	return typeof t == "string" && t.length > 200 ? `${t.slice(0, 200)}…` : t;
}
function et({ columns: e, rows: t }) {
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
function tt(e, t) {
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
//#region lib/flowGraph.js
var Q = Symbol("flow-graph"), nt = 190, rt = 90, it = {
	x: 0,
	y: .5
}, at = {
	x: 1,
	y: .5
}, ot = /* @__PURE__ */ new Set([
	"label",
	"autoRun",
	"sqlServerTables"
]), st = (e) => e?.message ?? String(e), ct = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
function lt({ sql: e = null, files: t = null, server: r = null } = {}) {
	let i = re(), a = Qe(e), o = u(() => ({
		state: r?.status?.state ?? "unavailable",
		address: r?.status?.address ?? null,
		assistant: typeof r?.assist == "function" && r?.status?.assistant || null
	})), s = [], c = {
		x: 0,
		y: 0
	}, l = w({
		started: !1,
		executing: !1,
		status: {},
		results: {}
	}), d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new WeakMap(), m = u(() => i.getSelectedNodes.value[0] ?? null), h = () => [...i.nodes.value, ...s.flatMap((e) => e.nodes)].map((e) => e.id);
	function g(e, t) {
		return {
			id: fe(e, h()),
			type: "pipeline",
			position: t,
			data: { kind: e }
		};
	}
	function _({ source: e, sourceHandle: t, target: n, targetHandle: r }) {
		return {
			id: `${e}.${t}-${n}.${r}`,
			type: "wire",
			source: e,
			sourceHandle: t,
			target: n,
			targetHandle: r
		};
	}
	let v = u(() => Me(i.nodes.value, i.edges.value, i.viewport.value));
	function y(e) {
		let { nodes: t, edges: n, viewport: r } = Pe(e) ?? Pe(je);
		s.length = 0, d.clear(), Object.assign(l, {
			started: !1,
			executing: !1,
			status: {},
			results: {}
		}), i.setNodes(t), i.setEdges(n.map(_));
		for (let e of t) e.data.kind === "sql-query" && e.data.sqlQuery && !e.data.sqlServerTables && k(e.id);
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
		let r = i.screenToFlowCoordinate(t), a = g(e, {
			x: r.x - n.x * nt,
			y: r.y - n.y * rt
		});
		return i.addNodes(a), a;
	}
	function S(e, t, n) {
		let r = n.handleType === "source", i = x(e, t, r ? it : at), [a, o] = r ? [n, {
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
		i.addEdges(_(e)), O(e.target);
	}
	function T(e) {
		let t = /* @__PURE__ */ new Set(), n = [e];
		for (; n.length;) {
			let e = n.pop();
			for (let r of i.edges.value) r.source === e && !t.has(r.target) && (t.add(r.target), n.push(r.target));
		}
		return [...t];
	}
	let E = (e, t) => e === t || T(e).includes(t), D = ({ source: e, target: t }) => !E(t, e);
	function O(e, { self: t = !0 } = {}) {
		for (let n of [...t ? [e] : [], ...T(e)]) d.set(n, (d.get(n) ?? 0) + 1), (l.status[n] === "completed" || l.status[n] === "failed") && (l.status[n] = "stale"), i.findNode(n)?.data.kind === "sql-query" && k(n);
	}
	async function k(t) {
		let n = i.findNode(t);
		if (!n || !e) return;
		let r = [...new Set(i.edges.value.filter((e) => e.target === t).map((e) => e.source))].map((e) => i.findNode(e)).filter(Boolean).map((e) => ({
			name: U(e.id, e.data),
			tables: e.data.ingest && W[e.data.ingest.format].multi ? e.data.ingest.tables.map((e) => e.name) : null
		})), o = await a.serverTables(n.data.sqlQuery ?? "", r);
		if (i.findNode(t) !== n) return;
		let s = n.data.sqlServerTables;
		(!s || o.join("\n") !== s.join("\n")) && i.updateNodeData(t, { sqlServerTables: o });
	}
	function A(e) {
		delete l.status[e], delete l.results[e], d.set(e, (d.get(e) ?? 0) + 1), O(e, { self: !1 });
	}
	function j(e, t) {
		if (t === e) return;
		let n = (n) => {
			let r = (n) => n === e ? t : n;
			return _({
				...n,
				source: r(n.source),
				target: r(n.target)
			});
		};
		i.findNode(e).id = t, i.setEdges(i.edges.value.map(n));
		for (let e of s) e.edges = e.edges.map(n);
		for (let n of [l.status, l.results]) e in n && (n[t] = n[e], delete n[e]);
		d.has(e) && d.set(t, d.get(e)), O(t, { self: !1 });
	}
	function M(e, t) {
		return t = t.trim(), t ? t === e ? null : h().includes(t) ? "Another node already uses this ID." : (j(e, t), null) : "ID cannot be empty.";
	}
	function N(e, t) {
		t = t.trim();
		let n = i.findNode(e);
		if (t === (n.data.label ?? "")) return;
		i.updateNodeData(e, { label: t || void 0 });
		let r = he(t);
		r && me(n.data.kind, e) && j(e, pe(r, h().filter((t) => t !== e)));
	}
	function P(e, t) {
		let n = he(t), r = n && n !== "data" ? n : void 0;
		r !== i.findNode(e).data.outputSuffix && (i.updateNodeData(e, { outputSuffix: r }), O(e, { self: !1 }));
	}
	function F(e, t) {
		let n = i.findNode(e).data, r = Object.keys(t).filter((e) => JSON.stringify(t[e]) !== JSON.stringify(n[e]));
		r.length && (i.updateNodeData(e, t), r.some((e) => !ot.has(e)) && O(e));
	}
	async function I(e) {
		if (!f.has(e)) {
			let n = await t?.getFile?.(e);
			n && f.set(e, n);
		}
		return f.get(e) ?? null;
	}
	async function L(e, n) {
		f.set(e, n), await t?.putFile?.(e, n);
	}
	function R(e) {
		f.delete(e), t?.deleteFile?.(e);
	}
	async function ee(e, t) {
		let n = i.findNode(e), r = {
			name: t.name,
			size: t.size,
			bytes: new Uint8Array(await t.arrayBuffer())
		};
		return p.set(n, r), G(t.name) && F(e, { ingestFormat: void 0 }), te(n, r, n.data.ingestFormat);
	}
	async function te(e, { name: t, size: n, bytes: r }, o) {
		let s = o || G(t);
		if (!s || !W[s].read) return `Can't tell what kind of file "${t}" is. Pick its type under File Type.`;
		let c;
		try {
			c = await a.readFile(r, t, s);
		} catch (e) {
			return `Couldn't read "${t}" as ${W[s].label}. ${st(e)}`;
		}
		if (i.findNode(e.id) !== e) return null;
		let l = [];
		for (let e of c) {
			let t = ct();
			await L(t, e.bytes), l.push({
				name: e.name,
				label: e.label,
				rowCount: e.rowCount,
				key: t
			});
		}
		let u = e.data.ingest?.tables ?? [];
		return F(e.id, { ingest: {
			fileName: t,
			fileSize: n,
			format: s,
			tables: l
		} }), u.forEach((e) => R(e.key)), null;
	}
	async function ne(e, t) {
		let n = i.findNode(e);
		F(e, { ingestFormat: t || void 0 });
		let r = p.get(n);
		if (r) return te(n, r, t);
		let a = n.data.ingest;
		return !a || (t || G(a.fileName)) === a.format ? null : `Choose "${a.fileName}" again to read it as ${W[t]?.label ?? "that type"}.`;
	}
	function ie({ filename: e, contentType: t, bytes: n }) {
		let r = URL.createObjectURL(new Blob([n], { type: t }));
		Object.assign(document.createElement("a"), {
			href: r,
			download: e
		}).click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
	}
	let ae = () => ({
		state: o.value.state,
		query: r?.query,
		runPython: r?.runPython
	});
	async function oe(e, t = null) {
		if (!e.length) return;
		l.started = !0;
		for (let t of e) l.status[t] = "running";
		let n = new Map(d), r;
		try {
			r = await a.run(v.value, e, {
				paged: t,
				getFile: I,
				server: ae()
			});
		} catch (t) {
			r = Object.fromEntries(e.map((e) => [e, { error: st(t) }]));
		}
		for (let [t, a] of Object.entries(r)) {
			if (!i.findNode(t)) continue;
			if (a.export) {
				let { bytes: n, ...r } = a.export, i = e.includes(t);
				i && ie(a.export), a = { export: {
					...r,
					downloaded: i
				} };
			}
			l.results[t] = a;
			let r = (d.get(t) ?? 0) !== (n.get(t) ?? 0);
			l.status[t] = r ? "stale" : a.error ? "failed" : "completed";
		}
	}
	let se = (e, t = 0, n = null) => oe([e], {
		id: e,
		page: t,
		table: n
	});
	async function ce() {
		l.executing = !0;
		try {
			await oe(i.nodes.value.filter((e) => e.data.autoRun !== !1).map((e) => e.id));
		} finally {
			l.executing = !1;
		}
	}
	async function z(e, t, n, s = () => {}) {
		let c = i.findNode(e), l = o.value.assistant;
		if (!c) return { error: "That node is gone." };
		if (o.value.state !== "connected" || !l) return { error: "The assistant works through the server, which isn't available." };
		try {
			s("reading");
			let i = await a.describeInputs(v.value, e, {
				getFile: I,
				server: ae(),
				sampleRows: l.sampleRows ?? 0
			});
			return s("writing"), await r.assist({
				kind: c.data.kind,
				request: t,
				code: n,
				inputs: i
			});
		} catch (e) {
			return { error: st(e) };
		}
	}
	function le({ nodeIds: e = [], edgeIds: t = [] }) {
		let n = i.nodes.value.filter((t) => e.includes(t.id)), r = i.edges.value.filter((n) => t.includes(n.id) || e.includes(n.source) || e.includes(n.target));
		if (n.length || r.length) {
			s.push({
				nodes: n.map(({ id: e, type: t, position: n, data: r }) => ({
					id: e,
					type: t,
					position: { ...n },
					data: r
				})),
				edges: r.map(_)
			}), i.removeEdges(r.map((e) => e.id)), i.removeNodes(n.map((e) => e.id));
			for (let t of r) e.includes(t.target) || O(t.target);
		}
	}
	function ue() {
		let e = s.pop();
		if (e) {
			i.addNodes(e.nodes), i.addEdges(e.edges);
			for (let t of e.edges) O(t.target);
		}
	}
	function B(e) {
		if (n(e)) return;
		let t = e.ctrlKey || e.metaKey;
		(e.key === "Delete" || e.key === "Backspace") && !t && !e.altKey ? (e.preventDefault(), le({
			nodeIds: i.getSelectedNodes.value.map((e) => e.id),
			edgeIds: i.getSelectedEdges.value.map((e) => e.id)
		})) : t && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z" && (e.preventDefault(), ue());
	}
	return {
		flow: i,
		selectedNode: m,
		snapshot: v,
		run: l,
		server: o,
		load: y,
		setContextPoint: b,
		addNode: x,
		addConnectedNode: S,
		connect: C,
		isValidConnection: D,
		renameNode: M,
		setLabel: N,
		setOutputName: P,
		updateData: F,
		chooseFile: ee,
		setIngestFormat: ne,
		runNode: se,
		executeGraph: ce,
		resetNode: A,
		askAssistant: z,
		remove: le,
		undoDelete: ue,
		onKeydown: B
	};
}
//#endregion
//#region components/FlowNode.vue
var ut = {
	key: 0,
	class: "flow-node-kind"
}, dt = {
	key: 1,
	class: "flow-blink-dot flow-node-server-dot",
	role: "img",
	"aria-label": "Executes on server",
	title: "Executes on server"
}, ft = {
	key: 2,
	class: "flow-node-ref-hint"
}, pt = {
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
		let n = {
			running: "Running…",
			completed: "Run completed.",
			failed: "Run failed.",
			stale: "Stale."
		}, r = t, i = _(Q), a = u(() => V(r.data.kind)), o = u(() => ge(r.data)), s = u(() => i.server.value.state), c = u(() => o.value && s.value === "unavailable" ? "Backend not available." : n[i.run.status[r.id]] ?? (a.value.unknown ? "Not available here." : "")), m = ne(), h = u(() => new Set(m.value.map((e) => e.source === r.id ? e.sourceHandle : e.targetHandle))), b = (e) => u(() => {
			let t;
			if (a.value.unknown) {
				let n = m.value.filter((t) => (e === "source" ? t.source : t.target) === r.id).map((t) => e === "source" ? t.sourceHandle : t.targetHandle);
				t = [.../* @__PURE__ */ new Set([`${e}-0`, ...n])].sort((e, t) => e.localeCompare(t, void 0, { numeric: !0 }));
			} else {
				let { inputs: n, outputs: i } = H(r.data.kind);
				t = Array.from({ length: e === "target" ? n : i }, (t, n) => `${e}-${n}`);
			}
			let n = _e(t.length);
			return t.map((e, t) => ({
				id: e,
				top: n[t]
			}));
		}), x = b("target"), C = b("source"), w = T(!1), k = T(!1);
		return (n, r) => N((S(), p("div", {
			class: v(["flow-node", [`flow-node--${a.value.category}`, { "is-hovered": w.value }]]),
			onPointerenter: r[2] ||= (e) => w.value = !0,
			onPointerleave: r[3] ||= (e) => w.value = !1
		}, [
			t.data.label ? (S(), p("span", ut, D(a.value.label), 1)) : f("", !0),
			g(se, {
				label: t.data.label || a.value.label,
				status: c.value,
				selected: t.selected
			}, null, 8, [
				"label",
				"status",
				"selected"
			]),
			o.value && s.value === "connected" ? (S(), p("span", dt)) : f("", !0),
			(S(!0), p(l, null, E(O(x), (e) => (S(), d(O(L), {
				id: e.id,
				key: e.id,
				type: "target",
				position: O(R).Left,
				connectable: !a.value.unknown,
				class: v(["flow-handle flow-handle--in", { "is-connected": h.value.has(e.id) }]),
				style: y({ top: e.top })
			}, null, 8, [
				"id",
				"position",
				"connectable",
				"class",
				"style"
			]))), 128)),
			(S(!0), p(l, null, E(O(C), (e) => (S(), d(O(L), {
				id: e.id,
				key: e.id,
				type: "source",
				position: O(R).Right,
				connectable: !a.value.unknown,
				class: v(["flow-handle flow-handle--out", { "is-connected": h.value.has(e.id) }]),
				style: y({ top: e.top }),
				onPointerenter: r[0] ||= (e) => k.value = !0,
				onPointerleave: r[1] ||= (e) => k.value = !1
			}, null, 8, [
				"id",
				"position",
				"connectable",
				"class",
				"style"
			]))), 128)),
			k.value ? (S(), p("span", ft, D(O(U)(t.id, t.data)), 1)) : f("", !0)
		], 34)), [[O(e), {
			items: O(ye),
			context: t.id
		}]]);
	}
}, mt = ["d"], ht = [
	"id",
	"x1",
	"y1",
	"x2",
	"y2"
], gt = ["d", "stroke"], _t = ["d", "stroke"], vt = ["d"], yt = ["d"], bt = {
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
		let n = t, r = _(Q), i = u(() => te(n)[0]), a = (e) => r.run.status[e] === "completed", o = u(() => a(n.source) ? a(n.target) ? "flowed" : "flowing" : r.run.started ? "dormant" : "pristine"), s = (e) => {
			let t = r.flow.findNode(e);
			return t ? `flow-node--${V(t.data.kind).category}` : "";
		}, c = k().replace(/[^\w-]/g, ""), d = `flow-wire-flowed-${c}`, h = `flow-wire-flowing-${c}`;
		return (n, r) => N((S(), p("g", null, [
			o.value === "pristine" || o.value === "dormant" ? (S(), p("path", {
				key: 0,
				class: v(["flow-wire", o.value === "pristine" ? "flow-wire--idle" : "flow-wire--waiting"]),
				d: i.value
			}, null, 10, mt)) : (S(), p(l, { key: 1 }, [
				m("defs", null, [(S(!0), p(l, null, E([d, h], (e) => (S(), p("linearGradient", {
					id: e,
					key: e,
					gradientUnits: "userSpaceOnUse",
					x1: t.sourceX,
					y1: t.sourceY,
					x2: t.targetX,
					y2: t.targetY
				}, [m("stop", {
					offset: "0",
					class: v(["flow-wire-stop-source", s(t.source)])
				}, null, 2), m("stop", {
					offset: "1",
					class: v(e === d ? ["flow-wire-stop-target", s(t.target)] : "flow-wire-stop-dormant")
				}, null, 2)], 8, ht))), 128))]),
				m("path", {
					class: "flow-wire",
					d: i.value,
					stroke: `url(#${d})`
				}, null, 8, gt),
				m("path", {
					class: v(["flow-wire flow-wire--grow", { "is-complete": o.value === "flowed" }]),
					d: i.value,
					pathLength: "1",
					stroke: `url(#${h})`
				}, null, 10, _t)
			], 64)),
			t.selected ? (S(), p("path", {
				key: 2,
				class: "flow-wire-gaps",
				d: i.value
			}, null, 8, vt)) : f("", !0),
			m("path", {
				class: "flow-wire-hit",
				d: i.value
			}, null, 8, yt)
		])), [[O(e), {
			items: O(be),
			context: t.id
		}]]);
	}
}, xt = [
	"x1",
	"y1",
	"x2",
	"y2"
], St = ["d", "stroke"], Ct = {
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
		let t = e, n = _(Q), r = u(() => te(t)[0]), i = u(() => {
			let e = {
				x: t.sourceX,
				y: t.sourceY
			}, n = {
				x: t.targetX,
				y: t.targetY
			};
			return t.fromInput ? [n, e] : [e, n];
		}), a = (e) => `flow-node--${V(e.data.kind).category}`, o = u(() => {
			let [e, r] = t.fromInput ? [t.targetNode, t.sourceNode] : [t.sourceNode, t.targetNode];
			return !e || n.run.status[e.id] !== "completed" ? ["flow-connection-line-from", "flow-connection-line-to"] : [["flow-wire-stop-source", a(e)], r ? ["flow-wire-stop-target", a(r)] : "flow-wire-stop-dormant"];
		}), s = `flow-connection-line-${k().replace(/[^\w-]/g, "")}`;
		return (e, t) => (S(), p(l, null, [m("defs", null, [m("linearGradient", {
			id: s,
			gradientUnits: "userSpaceOnUse",
			x1: i.value[0].x,
			y1: i.value[0].y,
			x2: i.value[1].x,
			y2: i.value[1].y
		}, [m("stop", {
			offset: "0",
			class: v(o.value[0])
		}, null, 2), m("stop", {
			offset: "1",
			class: v(o.value[1])
		}, null, 2)], 8, xt)]), m("path", {
			class: "flow-wire flow-connection-line",
			d: r.value,
			stroke: `url(#${s})`
		}, null, 8, St)], 64));
	}
}, wt = {
	__name: "FlowCanvas",
	emits: ["connection-dropped"],
	setup(e, { emit: t }) {
		let n = t, r = _(Q), { onConnect: i, onConnectStart: a, onConnectEnd: o } = r.flow, s = null, c = !1;
		a(({ nodeId: e, handleId: t, handleType: n }) => {
			s = {
				nodeId: e,
				handleId: t,
				handleType: n
			}, c = !1;
		}), i((e) => {
			c = !0, r.connect(e);
		}), o((e) => {
			if (c || !s || !e?.target?.classList?.contains("vue-flow__pane")) return;
			let { clientX: t, clientY: r } = e.changedTouches?.[0] ?? e;
			n("connection-dropped", {
				point: {
					x: t,
					y: r
				},
				from: s
			}), s = null;
		});
		let l = (e) => e.dataTransfer.types.includes(le);
		function u(e) {
			l(e) && (e.preventDefault(), e.dataTransfer.dropEffect = "copy");
		}
		function d(e) {
			if (!l(e)) return;
			e.preventDefault();
			let t;
			try {
				t = JSON.parse(e.dataTransfer.getData(le));
			} catch {
				return;
			}
			B(t?.kind) && r.addNode(t.kind, {
				x: e.clientX,
				y: e.clientY
			}, t.grab ?? void 0);
		}
		return (e, t) => (S(), p("div", {
			class: "flow-canvas-layer",
			onContextmenu: t[0] ||= (...e) => O(r).setContextPoint && O(r).setContextPoint(...e),
			onDragover: u,
			onDrop: d
		}, [g(O(ee), {
			"min-zoom": .25,
			"max-zoom": 2,
			"connection-mode": O(I).Strict,
			"is-valid-connection": O(r).isValidConnection,
			"delete-key-code": null,
			"nodes-focusable": !1,
			"edges-focusable": !1,
			"selection-key-code": null,
			"multi-selection-key-code": null
		}, {
			"node-pipeline": M(({ id: e, data: t, selected: n }) => [g(pt, {
				id: e,
				data: t,
				selected: n
			}, null, 8, [
				"id",
				"data",
				"selected"
			])]),
			"edge-wire": M((e) => [g(bt, {
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
			"connection-line": M((e) => [g(Ct, {
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
			default: M(() => [g(O(ie), {
				class: "flow-canvas-dots",
				gap: 24,
				size: 1
			})]),
			_: 1
		}, 8, ["connection-mode", "is-valid-connection"])], 32));
	}
}, Tt = { class: "flow-terminal" }, Et = {
	key: 0,
	class: "flow-panel-empty"
}, Dt = {
	key: 0,
	class: "flow-terminal-line flow-terminal-note"
}, Ot = {
	key: 1,
	class: "flow-terminal-output"
}, kt = {
	key: 2,
	class: "flow-terminal-error"
}, At = {
	key: 3,
	class: "flow-terminal-line"
}, jt = {
	key: 4,
	class: "flow-terminal-line"
}, Mt = {
	key: 5,
	class: "flow-terminal-line"
}, Nt = {
	key: 6,
	class: "flow-terminal-line"
}, Pt = {
	key: 7,
	class: "flow-terminal-line flow-terminal-note"
}, Ft = {
	__name: "TerminalPanel",
	setup(e) {
		let t = _(Q), n = t.selectedNode, r = u(() => n.value && t.run.results[n.value.id]), i = u(() => n.value && t.run.status[n.value.id] === "stale"), a = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`, o = (e) => e.map((e) => `${e.label} (${a(e.data.rowCount)})`).join(", ");
		return (e, t) => (S(), d(c, {
			class: "terminal-panel",
			name: "terminal",
			title: "Terminal",
			dock: "left",
			hotkey: "T",
			"default-size": 280,
			collapsed: ""
		}, {
			default: M(() => [m("div", Tt, [r.value ? (S(), p(l, { key: 1 }, [
				i.value ? (S(), p("p", Dt, " This node has changed since it ran (or something upstream has). Run it again to update this. ")) : f("", !0),
				r.value.output ? (S(), p("pre", Ot, D(r.value.output), 1)) : f("", !0),
				r.value.error ? (S(), p("pre", kt, D(r.value.error), 1)) : r.value.export ? (S(), p("p", At, " Wrote “" + D(r.value.export.filename) + "” (" + D(r.value.export.contentType) + ", " + D(O(Ae)(r.value.export.size)) + "). ", 1)) : r.value.tables ? (S(), p("p", jt, " Read " + D(r.value.tables.length) + " " + D(r.value.tables.length === 1 ? "table" : "tables") + ": " + D(o(r.value.tables)) + ". ", 1)) : r.value.data ? (S(), p("p", Mt, "Returned " + D(a(r.value.data.rowCount)) + ".", 1)) : r.value.value && r.value.value.kind !== "none" ? (S(), p("p", Nt, " Returned a " + D(r.value.value.type) + " (see the Data panel). ", 1)) : r.value.output ? f("", !0) : (S(), p("p", Pt, "(no output)"))
			], 64)) : (S(), p("p", Et, " Nothing to show yet — run a node to see its output or errors here. "))])]),
			_: 1
		}));
	}
}, It = { class: "flow-library" }, Lt = { class: "flow-library-heading" }, Rt = { class: "flow-library-cards" }, zt = ["title", "onDragstart"], Bt = {
	__name: "LibraryPanel",
	setup(e) {
		let t = ce.map((e) => ({
			...e,
			kinds: ue(e.id)
		}));
		function n(e, t) {
			let n = t.currentTarget.getBoundingClientRect(), r = {
				x: (t.clientX - n.left) / n.width,
				y: (t.clientY - n.top) / n.height
			};
			t.dataTransfer.setData(le, JSON.stringify({
				kind: e,
				grab: r
			})), t.dataTransfer.effectAllowed = "copy";
		}
		return (e, r) => (S(), d(c, {
			class: "library-panel",
			name: "library",
			title: "Library",
			dock: "left",
			hotkey: "L",
			"default-size": 238,
			collapsed: ""
		}, {
			default: M(() => [m("div", It, [(S(!0), p(l, null, E(O(t), (e) => (S(), p("section", {
				key: e.id,
				class: "flow-library-section"
			}, [m("h3", Lt, [m("span", {
				class: v(["flow-library-dot", `flow-node--${e.id}`]),
				"aria-hidden": "true"
			}, null, 2), h(" " + D(e.label), 1)]), m("div", Rt, [(S(!0), p(l, null, E(e.kinds, (t) => (S(), p("div", {
				key: t,
				class: v(["flow-library-card", `flow-node--${e.id}`]),
				draggable: "true",
				title: `Drag onto the canvas to add ${O(z)[t].label}`,
				onDragstart: (e) => n(t, e)
			}, [g(se, { label: O(z)[t].label }, null, 8, ["label"])], 42, zt))), 128))])]))), 128))])]),
			_: 1
		}));
	}
}, Vt = { class: "flow-props" }, Ht = { class: "flow-field" }, Ut = ["aria-disabled"], Wt = {
	__name: "FlowgraphsPanel",
	setup(e) {
		let t = _(Q);
		return (e, n) => (S(), d(c, {
			class: "flowgraphs-panel",
			name: "flowgraphs",
			title: "Flowgraphs",
			dock: "left",
			hotkey: "G",
			"default-size": 278,
			"above-bottom": "",
			collapsed: ""
		}, {
			default: M(() => [m("div", Vt, [m("div", Ht, [m("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": O(t).run.executing,
				onClick: n[0] ||= (e) => O(t).run.executing || O(t).executeGraph()
			}, D(O(t).run.executing ? "Executing…" : "Execute Graph"), 9, Ut), n[1] ||= m("p", { class: "flow-field-hint" }, " Runs every node with Auto Run on, and the nodes they depend on. ", -1)])])]),
			_: 1
		}));
	}
}, Gt = { class: "flow-data" }, Kt = { class: "flow-table-wrap" }, qt = { class: "flow-table" }, Jt = { class: "flow-pager" }, Yt = ["aria-disabled"], Xt = ["aria-disabled"], Zt = {
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
		let n = e, r = t, i = (e) => !n.busy && (e < 0 ? n.data.page > 0 : n.data.hasMore), a = (e) => i(e) && r("turn", e), o = (e) => e == null ? "" : typeof e == "object" ? JSON.stringify(e) : String(e);
		return (t, n) => (S(), p("div", Gt, [m("div", Kt, [m("table", qt, [m("thead", null, [m("tr", null, [(S(!0), p(l, null, E(e.data.columns, (e, t) => (S(), p("th", { key: t }, D(e), 1))), 128))])]), m("tbody", null, [(S(!0), p(l, null, E(e.data.rows, (e, t) => (S(), p("tr", { key: t }, [(S(!0), p(l, null, E(e, (e, t) => (S(), p("td", { key: t }, D(o(e)), 1))), 128))]))), 128))])])]), m("div", Jt, [
			m("span", null, "Page " + D(e.data.page + 1), 1),
			m("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(-1),
				onClick: n[0] ||= (e) => a(-1)
			}, " Prev ", 8, Yt),
			m("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(1),
				onClick: n[1] ||= (e) => a(1)
			}, " Next ", 8, Xt)
		])]));
	}
}, Qt = {
	key: 0,
	class: "flow-panel-empty"
}, $t = {
	key: 1,
	class: "flow-panel-empty"
}, en = {
	key: 2,
	class: "flow-panel-empty"
}, tn = {
	key: 3,
	class: "flow-value"
}, nn = { class: "flow-value-type" }, rn = { class: "flow-value-text" }, an = {
	key: 4,
	class: "flow-panel-empty"
}, on = {
	key: 5,
	class: "flow-data-tabs"
}, sn = {
	key: 0,
	class: "flow-tabs",
	role: "tablist"
}, cn = [
	"aria-selected",
	"title",
	"onClick"
], ln = {
	key: 1,
	class: "flow-panel-empty"
}, un = {
	__name: "DataPanel",
	setup(e) {
		let t = _(Q), n = t.selectedNode, r = u(() => n.value && t.run.results[n.value.id]), i = u(() => n.value && t.run.status[n.value.id] === "running"), a = T(null);
		j(n, () => a.value = null);
		let o = u(() => {
			let e = r.value?.tables;
			return e && (e.find((e) => e.name === a.value) ?? e[0]);
		}), s = u(() => r.value?.data ?? o.value?.data), h = (e) => t.runNode(n.value.id, s.value.page + e, o.value?.name ?? null);
		return (e, t) => (S(), d(c, {
			class: "data-panel",
			name: "data",
			title: "Data",
			dock: "bottom",
			hotkey: "D",
			"default-size": 240,
			collapsed: ""
		}, {
			default: M(() => [!r.value || r.value.error ? (S(), p("p", Qt, "Run a node to see its output here.")) : r.value.export && r.value.export.downloaded ? (S(), p("p", $t, " “" + D(r.value.export.filename) + "” was downloaded to your computer. ", 1)) : r.value.export ? (S(), p("p", en, " “" + D(r.value.export.filename) + "” was written as this node ran upstream of another, not downloaded. Run this node to download it. ", 1)) : r.value.value && r.value.value.kind !== "none" ? (S(), p("div", tn, [m("p", nn, D(r.value.value.type), 1), m("pre", rn, D(r.value.value.kind === "json" ? JSON.stringify(r.value.value.value, null, 2) : r.value.value.text), 1)])) : !r.value.data && !r.value.tables ? (S(), p("p", an, " This node's output isn't tabular — see the Terminal panel. ")) : (S(), p("div", on, [r.value.tables ? (S(), p("div", sn, [(S(!0), p(l, null, E(r.value.tables, (e) => (S(), p("button", {
				key: e.name,
				type: "button",
				role: "tab",
				class: "flow-tab",
				"aria-selected": e === o.value,
				title: e.label === e.name ? void 0 : `${e.label} (${e.name} in SQL)`,
				onClick: (t) => a.value = e.name
			}, D(e.label), 9, cn))), 128))])) : f("", !0), s.value.rowCount ? (S(), d(Zt, {
				key: 2,
				data: s.value,
				busy: i.value,
				onTurn: h
			}, null, 8, ["data", "busy"])) : (S(), p("p", ln, "No rows."))]))]),
			_: 1
		}));
	}
}, dn = {
	key: 0,
	class: "flow-field"
}, fn = ["for"], pn = { class: "flow-assist" }, mn = [
	"id",
	"placeholder",
	"aria-describedby"
], hn = ["aria-disabled"], gn = ["id"], _n = {
	key: 0,
	class: "flow-field-hint"
}, vn = {
	key: 1,
	class: "flow-field-error"
}, yn = {
	key: 2,
	class: "flow-field-note"
}, bn = { class: "flow-field-hint" }, xn = {
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
		}, n = e, r = _(Q), i = u(() => r.server.value.assistant), a = u(() => t[n.node.data.kind]), o = T(""), s = T(null), c = T(""), l = T(""), d = T(null), g = u(() => s.value !== null), v = u(() => !g.value && !!o.value.trim()), y = u(() => !!d.value && n.code === d.value.written);
		async function b() {
			if (!v.value) return;
			let e = n.node, t = n.code;
			l.value = "", c.value = "";
			let i;
			try {
				i = await r.askAssistant(e.id, o.value.trim(), t, (e) => s.value = e);
			} finally {
				s.value = null;
			}
			if (i.error) {
				l.value = i.error;
				return;
			}
			r.flow.findNode(e.id) === e && (r.updateData(e.id, { [a.value.field]: i.code }), c.value = i.note || "Done.", d.value = {
				previous: t,
				written: i.code
			}, o.value = "");
		}
		function x() {
			r.updateData(n.node.id, { [a.value.field]: d.value.previous }), d.value = null, c.value = "";
		}
		function C(e) {
			e.key !== "Enter" || e.shiftKey || e.isComposing || (e.preventDefault(), b());
		}
		let w = u(() => {
			let e = i.value.sampleRows, t = e > 0 ? `its inputs' columns and first ${e} ${e === 1 ? "row" : "rows"}` : "its inputs' columns", r = n.node.data.kind === "sql-query" ? ", and the server database's tables and columns," : "";
			return `Sends your request, this node's ${a.value.language}, ${t}${r} to ${i.value.model} through the server.`;
		}), E = k(), O = {
			request: `${E}-request`,
			note: `${E}-note`
		};
		return (e, t) => i.value && a.value ? (S(), p("div", dn, [
			m("label", {
				class: "flow-field-label",
				for: O.request
			}, "Assistant", 8, fn),
			m("div", pn, [N(m("textarea", {
				id: O.request,
				"onUpdate:modelValue": t[0] ||= (e) => o.value = e,
				class: "flow-field-input flow-assist-input",
				rows: "2",
				placeholder: `Say what the ${a.value.language} should do`,
				"aria-describedby": O.note,
				onKeydown: C
			}, null, 40, mn), [[A, o.value]]), m("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": !v.value,
				onClick: b
			}, D(g.value ? "Writing…" : "Write"), 9, hn)]),
			m("div", {
				id: O.note,
				class: "flow-assist-status",
				"aria-live": "polite"
			}, [g.value ? (S(), p("p", _n, D(s.value === "reading" ? "Reading its inputs…" : `Writing with ${i.value.model}…`), 1)) : l.value ? (S(), p("p", vn, D(l.value), 1)) : c.value ? (S(), p("p", yn, [h(D(c.value) + " ", 1), y.value ? (S(), p("button", {
				key: 0,
				type: "button",
				class: "flow-suggestion",
				onClick: x
			}, "Undo")) : f("", !0)])) : f("", !0), m("p", bn, D(w.value) + " Check what it writes before you run it.", 1)], 8, gn)
		])) : f("", !0);
	}
}, Sn = { class: "flow-props" }, Cn = { class: "flow-field" }, wn = ["for"], Tn = [
	"id",
	"aria-invalid",
	"aria-describedby"
], En = ["id"], Dn = {
	key: 0,
	class: "flow-field-error"
}, On = { class: "flow-field-hint" }, kn = { class: "flow-field" }, An = ["for"], jn = ["id", "placeholder"], Mn = {
	key: 0,
	class: "flow-field"
}, Nn = ["for"], Pn = ["id", "onKeydown"], Fn = {
	key: 1,
	class: "flow-field"
}, In = ["for"], Ln = ["id", "onKeydown"], Rn = {
	key: 2,
	class: "flow-field"
}, zn = ["for"], Bn = ["id", "onKeydown"], Vn = { class: "flow-field" }, Hn = [
	"id",
	"accept",
	"disabled",
	"aria-describedby"
], Un = ["id"], Wn = {
	key: 0,
	class: "flow-field-error"
}, Gn = {
	key: 1,
	class: "flow-field-hint"
}, Kn = {
	key: 2,
	class: "flow-field-hint"
}, qn = { class: "flow-field" }, Jn = ["for"], Yn = [
	"id",
	"value",
	"disabled"
], Xn = { value: "" }, Zn = ["value"], Qn = {
	key: 0,
	class: "flow-field"
}, $n = ["for"], er = [
	"id",
	"placeholder",
	"aria-describedby",
	"onKeydown"
], tr = ["id"], nr = { class: "flow-field" }, rr = ["for"], ir = ["id", "aria-describedby"], ar = ["id"], or = { class: "flow-field" }, sr = ["for"], cr = ["id", "value"], lr = ["value"], ur = {
	key: 5,
	class: "flow-field"
}, dr = ["for"], fr = { class: "flow-field-prefixed" }, pr = {
	class: "flow-field-prefix",
	"aria-hidden": "true"
}, mr = ["id"], hr = { class: "flow-field-check" }, gr = ["checked"], _r = { class: "flow-field" }, vr = { class: "flow-actions" }, yr = ["aria-disabled"], br = { class: "flow-field-hint" }, xr = {
	key: 7,
	class: "flow-field-note is-warning"
}, Sr = {
	key: 8,
	class: "flow-field-hint"
}, Cr = {
	__name: "NodeProperties",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = _(Q), r = u(() => V(t.node.data.kind)), i = u(() => n.run.status[t.node.id]), a = u(() => i.value === "running"), o = T(""), s = T(""), c = T(""), g = T(""), y = T(""), b = T(""), x = T(""), C = T(""), w = T(""), M = T(""), I = T(!1), L = null;
		j(() => {
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
			L = t.node, o.value = t.node.id, s.value = "", c.value = t.node.data.label ?? "", g.value = t.node.data.outputSuffix ?? "", y.value = t.node.data.sqlQuery ?? "", b.value = t.node.data.jsCode ?? "", x.value = t.node.data.pythonCode ?? "", C.value = t.node.data.exportInput ?? "", w.value = t.node.data.exportFilename ?? "", e !== n && (M.value = "");
		}, { immediate: !0 });
		let R = () => n.flow.findNode(L.id) === L ? L : null;
		function ee() {
			R() && (s.value = n.renameNode(L.id, o.value) ?? "", s.value || (o.value = L.id));
		}
		function te() {
			R() && n.setLabel(L.id, c.value);
		}
		function ne() {
			R() && (n.setOutputName(L.id, g.value), g.value = L.data.outputSuffix ?? "");
		}
		function re() {
			R() && n.updateData(L.id, { sqlQuery: y.value });
		}
		function ie() {
			re(), R() && n.runNode(L.id);
		}
		function ae() {
			R() && n.updateData(L.id, { jsCode: b.value });
		}
		function oe() {
			ae(), R() && n.runNode(L.id);
		}
		function se() {
			R() && n.updateData(L.id, { pythonCode: x.value });
		}
		function ce() {
			se(), R() && n.runNode(L.id);
		}
		function z() {
			R() && n.updateData(L.id, { exportInput: C.value.trim() || void 0 });
		}
		function le() {
			R() && n.updateData(L.id, { exportFilename: w.value.trim() || void 0 });
		}
		let ue = u(() => ({
			"sql-query": y,
			"python-script": x,
			javascript: b
		})[t.node.data.kind]?.value ?? ""), B = u(() => {
			let e = U(t.node.id, t.node.data), n = t.node.data.ingest;
			if (!n || !W[n.format].multi) return `this node's data as “${e}”`;
			let r = n.tables.map((t) => `“${e}.${t.name}”`);
			return `this node's tables as ${r.slice(0, 3).join(", ")}${r.length > 3 ? ", …" : ""}`;
		}), H = u(() => t.node.data.ingest), de = u(() => H.value && G(H.value.fileName)), fe = u(() => {
			let { fileName: e, fileSize: t, format: n, tables: r } = H.value, i = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`, a = W[n].multi ? `${r.length} ${n === "xlsx" ? "sheets" : "tables"}, ${i(r.reduce((e, t) => e + t.rowCount, 0))}` : i(r[0]?.rowCount ?? 0);
			return `${e} · ${Ae(t)} · ${W[n].label}, ${a}`;
		}), pe = u(() => H.value && !t.node.data.label && ke(H.value.fileName));
		async function me(e) {
			let n = t.node;
			I.value = !0, M.value = "";
			try {
				let r = await e();
				t.node === n && (M.value = r ?? "");
			} finally {
				I.value = !1;
			}
		}
		function he(e) {
			let r = e.target.files[0];
			e.target.value = "", r && me(() => n.chooseFile(t.node.id, r));
		}
		let _e = (e) => me(() => n.setIngestFormat(t.node.id, e.target.value)), ye = u(() => [...new Set(n.flow.edges.value.filter((e) => e.target === t.node.id).map((e) => e.source))].map((e) => n.flow.findNode(e)).filter(Boolean).flatMap((e) => {
			let t = U(e.id, e.data), n = V(e.data.kind).category, r = e.data.ingest && W[e.data.ingest.format].multi ? e.data.ingest.tables : [];
			return [{
				name: t,
				category: n
			}, ...r.map((e) => ({
				name: `${t}.${e.name}`,
				category: n,
				table: !0
			}))];
		})), be = u(() => ye.value.filter((e) => !e.table).length > 1 || !!t.node.data.exportInput), xe = _(ve), Se = T(null);
		function Ce() {
			let e = Se.value.getBoundingClientRect();
			xe({
				x: e.left,
				y: e.bottom + 4
			}, { items: ye.value.map(({ name: e, category: t }) => ({
				label: e,
				badge: { class: `flow-node--${t}` },
				action: () => {
					C.value = e, z();
				}
			})) });
		}
		let De = u(() => t.node.data.exportFormat ?? ""), je = u(() => {
			let e = w.value.trim() || "export";
			return Oe(e, De.value || G(e) || "csv");
		}), Me = (e) => n.updateData(t.node.id, { exportFormat: e.target.value || void 0 }), Ne = u(() => t.node.data.autoRun !== !1), Pe = (e) => n.updateData(t.node.id, { autoRun: e.target.checked ? void 0 : !1 }), Fe = u(() => t.node.data.sqlServerTables ?? []), Ie = u(() => ge(t.node.data)), Le = n.server, Re = u(() => Ie.value && Le.value.state !== "connected"), ze = u(() => !a.value && !I.value && !Re.value && (t.node.data.kind !== "data-ingest" || !!H.value)), Be = u(() => t.node.data.kind === "data-export" ? "Writes whatever's wired into this node on Run. Downloads to your computer immediately; errors show in the Terminal panel." : "Results land in the Data panel; errors show in the Terminal panel.");
		function K(e) {
			let t = e.target.parentElement.closest("[tabindex]");
			t ? t.focus() : e.target.blur();
		}
		let q = k(), J = {
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
		return (t, u) => (S(), p("div", Sn, [
			m("div", Cn, [
				m("label", {
					class: "flow-field-label",
					for: J.id
				}, "ID", 8, wn),
				N(m("input", {
					id: J.id,
					"onUpdate:modelValue": u[0] ||= (e) => o.value = e,
					class: v(["flow-field-input flow-field-input--mono", { "is-invalid": s.value }]),
					"aria-invalid": !!s.value,
					"aria-describedby": J.idNote,
					spellcheck: "false",
					autocomplete: "off",
					onInput: u[1] ||= (e) => s.value = "",
					onBlur: ee,
					onKeydown: P(K, ["enter"])
				}, null, 42, Tn), [[A, o.value]]),
				m("div", { id: J.idNote }, [s.value ? (S(), p("p", Dn, D(s.value), 1)) : f("", !0), m("p", On, " Downstream nodes reference " + D(B.value) + ". Renaming doesn't update that text inside other nodes' queries or code — you'll need to update those yourself. ", 1)], 8, En)
			]),
			m("div", kn, [m("label", {
				class: "flow-field-label",
				for: J.label
			}, "Name", 8, An), N(m("input", {
				id: J.label,
				"onUpdate:modelValue": u[2] ||= (e) => c.value = e,
				class: "flow-field-input",
				placeholder: r.value.label,
				autocomplete: "off",
				onBlur: te,
				onKeydown: P(K, ["enter"])
			}, null, 40, jn), [[A, c.value]])]),
			(S(), d(xn, {
				key: e.node.id,
				node: e.node,
				code: ue.value
			}, null, 8, ["node", "code"])),
			e.node.data.kind === "sql-query" ? (S(), p("div", Mn, [
				m("label", {
					class: "flow-field-label",
					for: J.sql
				}, "SQL", 8, Nn),
				N(m("textarea", {
					id: J.sql,
					"onUpdate:modelValue": u[3] ||= (e) => y.value = e,
					class: "flow-field-input flow-field-input--mono flow-field-code",
					rows: "8",
					spellcheck: "false",
					placeholder: "SELECT * FROM upstream_node_data",
					onBlur: re,
					onKeydown: [P(F(ie, ["ctrl", "prevent"]), ["enter"]), P(F(ie, ["meta", "prevent"]), ["enter"])]
				}, null, 40, Pn), [[A, y.value]]),
				u[12] ||= m("p", { class: "flow-field-hint" }, [
					h(" DuckDB SQL. A node wired in is a table named by its output, like "),
					m("code", null, "sqlnode1_data"),
					h(", and the query runs here. Read any other table and it runs on the server, over its database ("),
					m("code", null, "db"),
					h("; plain names look in its "),
					m("code", null, "public"),
					h(" schema) and the nodes wired in. Ctrl+Enter runs. ")
				], -1)
			])) : f("", !0),
			e.node.data.kind === "python-script" ? (S(), p("div", Fn, [
				m("label", {
					class: "flow-field-label",
					for: J.py
				}, "Python", 8, In),
				N(m("textarea", {
					id: J.py,
					"onUpdate:modelValue": u[4] ||= (e) => x.value = e,
					class: "flow-field-input flow-field-input--mono flow-field-code",
					rows: "8",
					spellcheck: "false",
					placeholder: "upstream_node_data.groupby('region').sum()",
					onBlur: se,
					onKeydown: [P(F(ce, ["ctrl", "prevent"]), ["enter"]), P(F(ce, ["meta", "prevent"]), ["enter"])]
				}, null, 40, Ln), [[A, x.value]]),
				u[13] ||= m("p", { class: "flow-field-hint" }, [
					h(" Each node wired in is a pandas DataFrame named by its output, like "),
					m("code", null, "sqlnode1_data"),
					h(" (several tables: "),
					m("code", null, "dataingest1_data.sheet1"),
					h("). The last line's value is this node's output: a DataFrame as its table, anything else shown as a value. "),
					m("code", null, "print"),
					h(" shows in the Terminal; "),
					m("code", null, "sleep(seconds)"),
					h(" waits. Ctrl+Enter runs. ")
				], -1)
			])) : f("", !0),
			e.node.data.kind === "javascript" ? (S(), p("div", Rn, [
				m("label", {
					class: "flow-field-label",
					for: J.js
				}, "JavaScript", 8, zn),
				N(m("textarea", {
					id: J.js,
					"onUpdate:modelValue": u[5] ||= (e) => b.value = e,
					class: "flow-field-input flow-field-input--mono flow-field-code",
					rows: "8",
					spellcheck: "false",
					placeholder: "return upstream_node_data.filter((row) => row.amount > 10)",
					onBlur: ae,
					onKeydown: [P(F(oe, ["ctrl", "prevent"]), ["enter"]), P(F(oe, ["meta", "prevent"]), ["enter"])]
				}, null, 40, Bn), [[A, b.value]]),
				u[14] ||= m("p", { class: "flow-field-hint" }, [
					h(" Each node wired in is a variable named by its output, like "),
					m("code", null, "sqlnode1_data"),
					h(": an array of rows (objects), or an object of them for several tables ("),
					m("code", null, "dataingest1_data.sheet1"),
					h("). Return an array of rows to output a table. "),
					m("code", null, "console.log"),
					h(" and "),
					m("code", null, "print"),
					h(" show in the Console; "),
					m("code", null, "await sleep(seconds)"),
					h(" waits. Runs in a sandbox in this browser, with no access to this page, and stops after 30 seconds. Ctrl+Enter runs. ")
				], -1)
			])) : f("", !0),
			e.node.data.kind === "data-ingest" ? (S(), p(l, { key: 3 }, [m("div", Vn, [
				u[15] ||= m("span", { class: "flow-field-label" }, "File", -1),
				m("label", { class: v(["flow-file", { "is-busy": I.value }]) }, [m("input", {
					id: J.file,
					type: "file",
					class: "flow-file-input",
					accept: O(Ee),
					disabled: I.value,
					"aria-describedby": J.fileNote,
					onChange: he
				}, null, 40, Hn), h(" " + D(I.value ? "Reading…" : H.value ? "Choose another file…" : "Choose file…"), 1)], 2),
				m("div", { id: J.fileNote }, [M.value ? (S(), p("p", Wn, D(M.value), 1)) : f("", !0), H.value ? (S(), p("p", Gn, D(fe.value), 1)) : (S(), p("p", Kn, " CSV, TSV, JSON, GeoJSON, Parquet, Excel (.xlsx) or SQLite. Its data is read and kept; the file itself isn't. "))], 8, Un),
				pe.value ? (S(), p("button", {
					key: 0,
					type: "button",
					class: "flow-suggestion",
					onClick: u[6] ||= (t) => O(n).setLabel(e.node.id, pe.value)
				}, " Rename to “" + D(pe.value) + "” to match " + D(H.value.fileName) + "? ", 1)) : f("", !0)
			]), m("div", qn, [m("label", {
				class: "flow-field-label",
				for: J.format
			}, "File Type", 8, Jn), m("select", {
				id: J.format,
				class: "flow-field-input flow-field-select",
				value: e.node.data.ingestFormat ?? "",
				disabled: I.value,
				onChange: _e
			}, [m("option", Xn, " From file name" + D(de.value ? ` (${O(W)[de.value].label})` : ""), 1), (S(!0), p(l, null, E(O(we), (e) => (S(), p("option", {
				key: e,
				value: e
			}, D(O(W)[e].label), 9, Zn))), 128))], 40, Yn)])], 64)) : f("", !0),
			e.node.data.kind === "data-export" ? (S(), p(l, { key: 4 }, [
				be.value ? (S(), p("div", Qn, [
					m("label", {
						class: "flow-field-label",
						for: J.input
					}, "Input", 8, $n),
					m("div", {
						ref_key: "inputField",
						ref: Se,
						class: "flow-field-combo"
					}, [N(m("input", {
						id: J.input,
						"onUpdate:modelValue": u[7] ||= (e) => C.value = e,
						class: "flow-field-input flow-field-input--mono",
						placeholder: ye.value[0]?.name ?? "",
						autocomplete: "off",
						spellcheck: "false",
						"aria-describedby": J.inputNote,
						onBlur: z,
						onKeydown: [P(K, ["enter"]), P(F(Ce, ["alt", "prevent"]), ["down"])]
					}, null, 40, er), [[A, C.value]]), m("button", {
						type: "button",
						class: "flow-field-combo-button",
						"aria-label": "Choose from the nodes wired in",
						"aria-haspopup": "menu",
						onClick: Ce
					}, [...u[16] ||= [m("svg", {
						viewBox: "0 0 12 12",
						"aria-hidden": "true"
					}, [m("path", { d: "M3 4.5 6 7.5 9 4.5" })], -1)]])], 512),
					m("p", {
						id: J.inputNote,
						class: "flow-field-hint"
					}, [
						u[17] ||= h(" Several nodes are wired in: name the one to write, by its output (like ", -1),
						m("code", null, D(ye.value[0]?.name), 1),
						u[18] ||= h("), or choose it from the list. Left empty, it only runs with one wired in. ", -1)
					], 8, tr)
				])) : f("", !0),
				m("div", nr, [
					m("label", {
						class: "flow-field-label",
						for: J.filename
					}, "Filename", 8, rr),
					N(m("input", {
						id: J.filename,
						"onUpdate:modelValue": u[8] ||= (e) => w.value = e,
						class: "flow-field-input",
						placeholder: "export",
						autocomplete: "off",
						spellcheck: "false",
						"aria-describedby": J.filenameNote,
						onBlur: le,
						onKeydown: P(K, ["enter"])
					}, null, 40, ir), [[A, w.value]]),
					m("p", {
						id: J.filenameNote,
						class: "flow-field-hint"
					}, "Saves as " + D(je.value), 9, ar)
				]),
				m("div", or, [m("label", {
					class: "flow-field-label",
					for: J.format
				}, "File Type", 8, sr), m("select", {
					id: J.format,
					class: "flow-field-input flow-field-select",
					value: De.value,
					onChange: Me
				}, [u[19] ||= m("option", { value: "" }, "From file name (CSV if none)", -1), (S(!0), p(l, null, E(O(Te), (e) => (S(), p("option", {
					key: e,
					value: e
				}, D(O(W)[e].label), 9, lr))), 128))], 40, cr)])
			], 64)) : f("", !0),
			r.value.outputName ? (S(), p("div", ur, [m("label", {
				class: "flow-field-label",
				for: J.output
			}, "Output Name", 8, dr), m("div", fr, [m("span", pr, D(e.node.id) + "_", 1), N(m("input", {
				id: J.output,
				"onUpdate:modelValue": u[9] ||= (e) => g.value = e,
				class: "flow-field-input flow-field-input--mono",
				placeholder: "data",
				spellcheck: "false",
				autocomplete: "off",
				onBlur: ne,
				onKeydown: P(K, ["enter"])
			}, null, 40, mr), [[A, g.value]])])])) : f("", !0),
			r.value.runs ? (S(), p(l, { key: 6 }, [
				Ie.value ? (S(), p("p", {
					key: 0,
					class: v(["flow-field-note", { "is-warning": Re.value }])
				}, [
					Fe.value.length ? (S(), p(l, { key: 0 }, [h(" Reads " + D(Fe.value.join(", ")) + " from the server, so it runs there: ", 1)], 64)) : (S(), p(l, { key: 1 }, [h("Runs on the server:")], 64)),
					h(" running this node sends its input data to the server" + D(O(Le).state === "connected" && O(Le).address ? ` at ${O(Le).address}` : "") + " to complete. ", 1),
					Re.value ? (S(), p(l, { key: 2 }, [h("The server isn't available, so it can't run now.")], 64)) : f("", !0)
				], 2)) : f("", !0),
				m("label", hr, [u[20] ||= h(" Auto Run ", -1), m("input", {
					type: "checkbox",
					checked: Ne.value,
					onChange: Pe
				}, null, 40, gr)]),
				m("div", _r, [m("div", vr, [m("button", {
					type: "button",
					class: "flow-button flow-button--wide",
					"aria-disabled": !ze.value,
					onClick: u[10] ||= (t) => ze.value && O(n).runNode(e.node.id)
				}, D(a.value ? "Running…" : "Run"), 9, yr), i.value && !a.value ? (S(), p("button", {
					key: 0,
					type: "button",
					class: "flow-button flow-button--quiet",
					title: "Back to not run: clears its status and output",
					onClick: u[11] ||= (t) => O(n).resetNode(e.node.id)
				}, " Reset ")) : f("", !0)]), m("p", br, D(Be.value), 1)])
			], 64)) : r.value.unknown ? (S(), p("p", xr, " This node is a " + D(e.node.data.kind) + " node, which this app doesn't have (it was made in another app, or with a plugin this app doesn't install). It can't run or take new wires here, but it keeps its settings and wires, and saving the graph keeps it as it was. ", 1)) : (S(), p("p", Sr, "No editable properties yet for this node kind."))
		]));
	}
}, wr = {
	key: 1,
	class: "flow-panel-empty"
}, Tr = {
	__name: "ManagePanel",
	setup(e) {
		let t = _(Q);
		return (e, n) => (S(), d(c, {
			class: "manage-panel",
			name: "manage",
			title: "Manage",
			dock: "right",
			hotkey: "M"
		}, {
			default: M(() => [O(t).selectedNode.value ? (S(), d(Cr, {
				key: 0,
				node: O(t).selectedNode.value
			}, null, 8, ["node"])) : (S(), p("p", wr, "Select a node to see its properties."))]),
			_: 1
		}));
	}
}, Er = {
	__name: "ServerStatus",
	setup(e) {
		let t = _(Q), n = t.server, r = u(() => n.value.state === "connected"), i = u(() => r.value && t.flow.nodes.value.some((e) => ge(e.data)));
		return (e, t) => O(n).state === "checking" ? f("", !0) : (S(), p("div", {
			key: 0,
			class: v(["flow-server-status", r.value ? "flow-node--modify" : "flow-node--fetch"]),
			role: "status"
		}, [m("span", {
			class: v(["flow-blink-dot", { "is-steady": !i.value }]),
			"aria-hidden": "true"
		}, null, 2), r.value ? (S(), p(l, { key: 0 }, [h(" LIVE · connected to server" + D(O(n).address ? ` ${O(n).address}` : ""), 1)], 64)) : (S(), p(l, { key: 1 }, [h("backend not available, client execution only")], 64))], 2));
	}
}, Dr = 400;
function Or(e, t) {
	let n = null, r = null;
	function i() {
		n && (clearTimeout(n), n = null, t.save(e.snapshot.value));
	}
	function a() {
		clearTimeout(n), n = setTimeout(i, Dr);
	}
	let o = () => document.visibilityState === "hidden" && i();
	x(async () => {
		e.load(t ? await t.load() : null), t && (r = j(e.snapshot, a), window.addEventListener("pagehide", i), document.addEventListener("visibilitychange", o));
	}), b(() => {
		r?.(), window.removeEventListener("pagehide", i), document.removeEventListener("visibilitychange", o), t && i();
	});
}
//#endregion
//#region lib/themes.js
var kr = [
	"FLOW",
	"FLOWDARK",
	"LUX",
	"LUXDARK"
], Ar = new Map(kr.map((e) => [e, {
	name: e,
	base: null,
	tokens: {}
}])), $ = (e) => String(e).toUpperCase();
function jr({ name: e, base: t = "FLOW", tokens: n = {} }) {
	if (!e) throw Error("A theme needs a name.");
	if (kr.includes($(e))) throw Error(`${$(e)} is a built-in theme; give yours another name.`);
	if (!Ar.has($(t))) throw Error(`Theme ${$(e)} is based on ${$(t)}, which isn't defined.`);
	Ar.set($(e), {
		name: $(e),
		base: $(t),
		tokens: { ...n }
	});
}
var Mr = (e) => Ar.has($(e)), Nr = () => [...Ar.keys()];
function Pr(e) {
	let t = Ar.get($(e)) ?? Ar.get("FLOW");
	if (!t.base) return {
		name: t.name,
		className: `flow-theme-${t.name.toLowerCase()}`,
		tokens: {}
	};
	let n = Pr(t.base);
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
var Fr = { class: "flow-title flow-pan-trigger" }, Ir = { class: "flow-brand-text flow-title-text" }, Lr = {
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
			validator: Mr
		},
		autoHideRails: {
			type: Boolean,
			default: !0
		}
	},
	setup(t) {
		let n = t, r = u(() => Pr(n.theme)), a = u(() => r.value.className), o = u(() => r.value.tokens), c = s({ autoHideRails: () => n.autoHideRails }), l = lt({
			sql: n.sql,
			files: n.storage,
			server: n.server
		});
		C(Q, l), Or(l, n.storage);
		let { commands: f, canvasMenu: p } = Ce(c, l), h = T(null), _ = (e) => !!e.target.closest(".wm-content");
		function b(e) {
			_(e) || l.onKeydown(e);
		}
		function x(e) {
			h.value.open(e.point, {
				items: Se,
				context: e
			});
		}
		return C(ve, (e, t) => h.value.open(e, t)), (n, r) => (S(), d(i, {
			ref_key: "host",
			ref: h,
			class: v(["flow-editor", a.value]),
			layout: O(c),
			commands: O(f),
			role: "application",
			"aria-label": t.title,
			style: y(o.value),
			onKeydown: b
		}, {
			title: M(() => [m("span", Fr, [m("span", Ir, D(t.title), 1)])]),
			panels: M(() => [
				g(Ft),
				g(Bt),
				g(Wt),
				g(un),
				g(Tr),
				g(Er)
			]),
			default: M(() => [N(g(wt, { onConnectionDropped: x }, null, 512), [[O(e), O(p)]])]),
			_: 1
		}, 8, [
			"class",
			"layout",
			"commands",
			"aria-label",
			"style"
		]));
	}
};
//#endregion
export { Q as FLOW_GRAPH, c as FlowPanel, Lr as FlowgraphEditor, ce as NODE_CATEGORIES, z as NODE_KINDS, a as PANEL_LAYOUT, o as PANEL_MENU, i as PanelHost, s as createPanelLayout, jr as defineTheme, r as panelCommands, t as panelsSubmenu, Pr as resolveTheme, Nr as themeNames };
