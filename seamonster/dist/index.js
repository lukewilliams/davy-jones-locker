import { r as e } from "./menu-ByXvYfw3.js";
import { a as t, c as n, i as r, n as i, o as a, r as o, s, t as c } from "./panels-dfiW9ww3.js";
import { Fragment as l, computed as u, createBlock as d, createCommentVNode as f, createElementBlock as p, createElementVNode as m, createTextVNode as h, createVNode as g, inject as _, normalizeClass as v, normalizeStyle as y, onBeforeUnmount as b, onMounted as x, openBlock as S, provide as C, reactive as w, ref as T, renderList as E, toDisplayString as D, unref as O, useId as k, vModelText as A, watch as ee, withCtx as j, withDirectives as M, withKeys as N, withModifiers as P } from "vue";
import { ConnectionMode as F, Handle as I, Position as L, VueFlow as te, getBezierPath as ne, useNodeConnections as re, useVueFlow as ie } from "@vue-flow/core";
import { Background as ae } from "@vue-flow/background";
//#region components/NodeFace.vue
var oe = { class: "flow-node-status" }, se = { class: "flow-node-label" }, ce = {
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
		return (t, n) => (S(), p("div", { class: v(["flow-node-face", { "is-selected": e.selected }]) }, [m("span", oe, D(e.status), 1), m("span", se, D(e.label), 1)], 2));
	}
}, R = [
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
}, B = "application/x-flow-node-kind", le = (e) => Object.keys(z).filter((t) => z[t].category === e);
function ue(e) {
	let t = z[e];
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
var V = (e, t) => de(z[e].idPrefix, new Set(t));
function fe(e, t) {
	let n = new Set(t);
	return n.has(e) ? de(e, n) : e;
}
var pe = (e, t) => RegExp(`^${z[e].idPrefix}\\d+$`).test(t);
function H(e) {
	let t = e.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
	return /^\d/.test(t) ? `_${t}` : t;
}
var U = (e, t) => `${e}_${t.outputSuffix || "data"}`, me = (e) => z[e.kind]?.where === "server" || !!e.sqlServerTables?.length, he = (e) => Array.from({ length: e }, (t, n) => `${(n + 1) / (e + 1) * 100}%`), ge = Symbol("flow-open-menu"), _e = [
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
], ve = [{
	label: "Delete wire",
	command: "wire.delete",
	shortcut: "Del"
}], W = (e) => R.map((t) => ({
	type: "submenu",
	label: t.label,
	badge: { class: `flow-node--${t.id}` },
	items: le(t.id).map((t) => ({
		label: z[t].label,
		command: e,
		args: { kind: t }
	}))
})), ye = W("node.addConnected");
function be(e, n) {
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
			items: W("node.add")
		}, t(e)]
	};
}
//#endregion
//#region lib/fileFormats.js
var G = {
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
}, xe = Object.keys(G).filter((e) => G[e].read), Se = Object.keys(G).filter((e) => G[e].write), Ce = xe.flatMap((e) => G[e].extensions).map((e) => `.${e}`).join(","), we = (e) => /\.([^./\\]+)$/.exec(e)?.[1].toLowerCase() ?? "";
function K(e) {
	let t = we(e);
	return Object.keys(G).find((e) => G[e].extensions.includes(t)) ?? null;
}
function Te(e, t) {
	let { extensions: n } = G[t];
	return n.includes(we(e)) ? e : `${e}.${n[0]}`;
}
var Ee = (e) => e.replace(/\.[^.]*$/, "").replace(/[_\-\s]+/g, " ").trim();
function De(e) {
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
var Oe = {
	format: "pipeline",
	nodes: [],
	edges: []
};
function ke(e, t, n) {
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
var Ae = (e) => Number.isFinite(e?.x) && Number.isFinite(e?.y);
function je(e) {
	if (e?.format !== "pipeline" || !Array.isArray(e.nodes) || !Array.isArray(e.edges)) return null;
	let t = e.nodes.filter((e) => typeof e?.id == "string" && z[e.kind] && Ae(e.position)).map(({ id: e, position: t, ...n }) => ({
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
		viewport: Ae(e.viewport) && Number.isFinite(e.viewport.zoom) ? e.viewport : null
	};
}
//#endregion
//#region lib/jsSandbox.js
var Me = 30;
function Ne() {
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
function Pe(e) {
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
var Fe = `<script>(${Pe})(${JSON.stringify(`(${Ne})()`)})<\/script>`;
function Ie(e, t, { timeoutSeconds: n = Me } = {}) {
	return new Promise((r, i) => {
		let a = document.createElement("iframe");
		a.sandbox = "allow-scripts", a.hidden = !0, a.srcdoc = Fe;
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
var Le = 67324752, Re = 33639248, ze = 101010256, q = "This doesn't look like an .xlsx file.", J = (e) => new DataView(e.buffer, e.byteOffset, e.byteLength);
function Y(e, t) {
	for (let n = e.length - 22; n >= Math.max(0, e.length - 65557); n--) if (t.getUint32(n, !0) === ze) return n;
	return -1;
}
async function Be(e) {
	return [...(await Ue(e, "xl/workbook.xml")).matchAll(/<sheet\b[^>]*?\bname="([^"]*)"/g)].map((e) => Ve(e[1]));
}
var Ve = (e) => e.replace(/&(lt|gt|quot|apos|amp);/g, (e, t) => ({
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	amp: "&"
})[t]);
function He(e) {
	let t = J(e);
	if (e.length >= 4 && t.getUint32(0, !0) === Le) return e;
	let n = Y(e, t);
	if (n < 0) return e;
	let r = t.getUint32(n + 12, !0), i = t.getUint32(n + 16, !0), a = n - r - i;
	return a > 0 && t.getUint32(a, !0) === Le ? e.slice(a) : e;
}
async function Ue(e, t) {
	let n = J(e), r = Y(e, n);
	if (r < 0) throw Error(q);
	let i = n.getUint16(r + 10, !0), a = n.getUint32(r + 16, !0);
	for (let r = 0; r < i && n.getUint32(a, !0) === Re; r++) {
		let r = n.getUint16(a + 10, !0), i = n.getUint32(a + 20, !0), o = n.getUint16(a + 28, !0), s = o + n.getUint16(a + 30, !0) + n.getUint16(a + 32, !0);
		if (new TextDecoder().decode(e.subarray(a + 46, a + 46 + o)) === t) {
			let t = n.getUint32(a + 42, !0), o = t + 30 + n.getUint16(t + 26, !0) + n.getUint16(t + 28, !0), s = e.subarray(o, o + i);
			if (r === 0) return new TextDecoder().decode(s);
			if (r === 8) {
				let e = new Blob([s]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
				return new Response(e).text();
			}
			throw Error(q);
		}
		a += 46 + s;
	}
	throw Error(q);
}
var We = "flow_out", Ge = "flow_in", Ke = /* @__PURE__ */ new Set([
	"memory",
	"system",
	"temp"
]), qe = /* @__PURE__ */ new Set(["information_schema", "pg_catalog"]), X = (e) => `"${e.replaceAll("\"", "\"\"")}"`, Z = (e) => `'${e.replaceAll("'", "''")}'`, Je = (e) => e?.message ?? String(e);
function Ye(e, t) {
	Array.isArray(e) ? e.forEach((e) => Ye(e, t)) : e && typeof e == "object" && (t(e), Object.values(e).forEach((e) => Ye(e, t)));
}
function Xe(e) {
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
		let o = new Map(t.nodes.map((e) => [e.id, e])), { order: s, inputs: c } = $e(t, n);
		await e.query(`DROP SCHEMA IF EXISTS ${We} CASCADE`), await e.query(`CREATE SCHEMA ${We}`);
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
				f[e] = { error: Je(t) };
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
				kind: z[t.kind]?.label ?? t.kind,
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
			sample: (n > 0 ? (await e.query(`SELECT * FROM ${t} LIMIT ${Math.floor(n)}`)).rows : []).map((e) => e.map(Ze))
		};
	}
	function l(e, t, n, r) {
		switch (e.kind) {
			case "sql-query": return b(e, t, n, r);
			case "data-ingest": return S(e, n, r);
			case "data-export": return C(e, t, r);
			case "javascript": return _(e, t, n, r);
			case "python-script": return h(e, t, n, r);
			default: return { error: `${z[e.kind].label} nodes can't run yet.` };
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
		Ye(i, (e) => {
			for (let { key: t } of e.cte_map?.map ?? []) l.add(a(t));
			e.type === "BASE_TABLE" && c.push(e);
		});
		let u = ({ catalog_name: e, schema_name: t, table_name: n }) => e ? Ke.has(a(e)) : t ? qe.has(a(t)) || !!s.get(a(t))?.has(a(n)) : o.has(a(n)) || l.has(a(n)), d = c.filter((e) => !u(e)).map((e) => [
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
		let l = `${We}.${X(t.id)}`;
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
			({value: s, logs: c} = await Ie(a, o));
		} catch (e) {
			return {
				error: Je(e),
				output: (e.logs ?? []).join("\n")
			};
		}
		let l = c.join("\n");
		if (s !== void 0 && !Array.isArray(s)) return {
			error: "Return an array of rows (objects, one per row) to output a table, or return nothing.",
			output: l
		};
		let u = `${We}.${X(t.id)}`, d = (s ?? []).map((e) => typeof e == "object" && e && !Array.isArray(e) ? e : { value: e });
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
		for (let t of [Ge, ...n]) await e.query(`DROP SCHEMA IF EXISTS ${X(t)} CASCADE`);
		n = [], await e.query(`CREATE SCHEMA ${Ge}`), await e.query(`SET search_path = '${Ge},main'`);
		for (let i of t) {
			let t = U(i.id, i), a = r.get(i.id);
			if (a.table) {
				await e.query(`CREATE VIEW ${Ge}.${X(t)} AS SELECT * FROM ${a.table}`);
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
		let s = `${We}.${X(t.id)}`, c = await u(o, n.map((e) => x(e, i.get(e.id))));
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
			let c = `${We}.${X(`${t.id}/${n.name}`)}`;
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
		if (!G[a.format].multi) return r.set(t.id, { table: o[0].table }), { data: await y(o[0].table, n.page) };
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
		let { source: i, input: a } = r, o = (e.exportFilename ?? "").trim() || "export", s = e.exportFormat || K(o) || "csv", c = Te(o, s), l = G[s], u = a.table ? [{
			name: H(i.id) || "data",
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
		if (t === "geojson") return new TextEncoder().encode(JSON.stringify(Qe(await i(n[0].table))));
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
			return t === "xlsx" ? He(n) : n;
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
		let i = `flow-upload-${Date.now()}.${G[r].extensions[0]}`, a = [];
		await e.registerFile(i, t);
		try {
			let o = await A(r, i, t, n, a), s = [], c = [];
			for (let [t, { label: n, select: r }] of o.entries()) {
				let o = fe(H(n) || "table", c);
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
			case "xlsx": return await D(), (await Be(r)).map((e) => ({
				label: e,
				select: `SELECT * FROM read_xlsx(${o}, sheet = ${Z(e)}, header = true)`
			}));
			case "sqlite": {
				if (!e.readSqlite) throw Error("This SQL engine can't read SQLite files.");
				let t = await e.readSqlite(r), i = [];
				for (let [e, r] of t.entries()) i.push({
					label: r.name,
					select: await ee(r, `${n}-rows-${e}.json`, a)
				});
				return i;
			}
			default: throw Error(`Can't read ${G[t]?.label ?? t} files.`);
		}
	}
	async function ee({ columns: t, rows: n }, r, i) {
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
function Ze(e) {
	if (e instanceof Uint8Array) return `(${e.length} bytes)`;
	let t = typeof e == "bigint" ? String(e) : typeof e == "object" && e ? JSON.stringify(e, (e, t) => typeof t == "bigint" ? String(t) : t) : e;
	return typeof t == "string" && t.length > 200 ? `${t.slice(0, 200)}…` : t;
}
function Qe({ columns: e, rows: t }) {
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
function $e(e, t) {
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
var Q = Symbol("flow-graph"), et = 190, tt = 90, nt = {
	x: 0,
	y: .5
}, rt = {
	x: 1,
	y: .5
}, it = /* @__PURE__ */ new Set([
	"label",
	"autoRun",
	"sqlServerTables"
]), at = (e) => e?.message ?? String(e), ot = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
function st({ sql: e = null, files: t = null, server: r = null } = {}) {
	let i = ie(), a = Xe(e), o = u(() => ({
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
			id: V(e, h()),
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
	let v = u(() => ke(i.nodes.value, i.edges.value, i.viewport.value));
	function y(e) {
		let { nodes: t, edges: n, viewport: r } = je(e) ?? je(Oe);
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
			x: r.x - n.x * et,
			y: r.y - n.y * tt
		});
		return i.addNodes(a), a;
	}
	function S(e, t, n) {
		let r = n.handleType === "source", i = x(e, t, r ? nt : rt), [a, o] = r ? [n, {
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
			tables: e.data.ingest && G[e.data.ingest.format].multi ? e.data.ingest.tables.map((e) => e.name) : null
		})), o = await a.serverTables(n.data.sqlQuery ?? "", r);
		if (i.findNode(t) !== n) return;
		let s = n.data.sqlServerTables;
		(!s || o.join("\n") !== s.join("\n")) && i.updateNodeData(t, { sqlServerTables: o });
	}
	function A(e) {
		delete l.status[e], delete l.results[e], d.set(e, (d.get(e) ?? 0) + 1), O(e, { self: !1 });
	}
	function ee(e, t) {
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
	function j(e, t) {
		return t = t.trim(), t ? t === e ? null : h().includes(t) ? "Another node already uses this ID." : (ee(e, t), null) : "ID cannot be empty.";
	}
	function M(e, t) {
		t = t.trim();
		let n = i.findNode(e);
		if (t === (n.data.label ?? "")) return;
		i.updateNodeData(e, { label: t || void 0 });
		let r = H(t);
		r && pe(n.data.kind, e) && ee(e, fe(r, h().filter((t) => t !== e)));
	}
	function N(e, t) {
		let n = H(t), r = n && n !== "data" ? n : void 0;
		r !== i.findNode(e).data.outputSuffix && (i.updateNodeData(e, { outputSuffix: r }), O(e, { self: !1 }));
	}
	function P(e, t) {
		let n = i.findNode(e).data, r = Object.keys(t).filter((e) => JSON.stringify(t[e]) !== JSON.stringify(n[e]));
		r.length && (i.updateNodeData(e, t), r.some((e) => !it.has(e)) && O(e));
	}
	async function F(e) {
		if (!f.has(e)) {
			let n = await t?.getFile?.(e);
			n && f.set(e, n);
		}
		return f.get(e) ?? null;
	}
	async function I(e, n) {
		f.set(e, n), await t?.putFile?.(e, n);
	}
	function L(e) {
		f.delete(e), t?.deleteFile?.(e);
	}
	async function te(e, t) {
		let n = i.findNode(e), r = {
			name: t.name,
			size: t.size,
			bytes: new Uint8Array(await t.arrayBuffer())
		};
		return p.set(n, r), K(t.name) && P(e, { ingestFormat: void 0 }), ne(n, r, n.data.ingestFormat);
	}
	async function ne(e, { name: t, size: n, bytes: r }, o) {
		let s = o || K(t);
		if (!s || !G[s].read) return `Can't tell what kind of file "${t}" is. Pick its type under File Type.`;
		let c;
		try {
			c = await a.readFile(r, t, s);
		} catch (e) {
			return `Couldn't read "${t}" as ${G[s].label}. ${at(e)}`;
		}
		if (i.findNode(e.id) !== e) return null;
		let l = [];
		for (let e of c) {
			let t = ot();
			await I(t, e.bytes), l.push({
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
		} }), u.forEach((e) => L(e.key)), null;
	}
	async function re(e, t) {
		let n = i.findNode(e);
		P(e, { ingestFormat: t || void 0 });
		let r = p.get(n);
		if (r) return ne(n, r, t);
		let a = n.data.ingest;
		return !a || (t || K(a.fileName)) === a.format ? null : `Choose "${a.fileName}" again to read it as ${G[t]?.label ?? "that type"}.`;
	}
	function ae({ filename: e, contentType: t, bytes: n }) {
		let r = URL.createObjectURL(new Blob([n], { type: t }));
		Object.assign(document.createElement("a"), {
			href: r,
			download: e
		}).click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
	}
	let oe = () => ({
		state: o.value.state,
		query: r?.query,
		runPython: r?.runPython
	});
	async function se(e, t = null) {
		if (!e.length) return;
		l.started = !0;
		for (let t of e) l.status[t] = "running";
		let n = new Map(d), r;
		try {
			r = await a.run(v.value, e, {
				paged: t,
				getFile: F,
				server: oe()
			});
		} catch (t) {
			r = Object.fromEntries(e.map((e) => [e, { error: at(t) }]));
		}
		for (let [t, a] of Object.entries(r)) {
			if (!i.findNode(t)) continue;
			if (a.export) {
				let { bytes: n, ...r } = a.export, i = e.includes(t);
				i && ae(a.export), a = { export: {
					...r,
					downloaded: i
				} };
			}
			l.results[t] = a;
			let r = (d.get(t) ?? 0) !== (n.get(t) ?? 0);
			l.status[t] = r ? "stale" : a.error ? "failed" : "completed";
		}
	}
	let ce = (e, t = 0, n = null) => se([e], {
		id: e,
		page: t,
		table: n
	});
	async function R() {
		l.executing = !0;
		try {
			await se(i.nodes.value.filter((e) => e.data.autoRun !== !1).map((e) => e.id));
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
				getFile: F,
				server: oe(),
				sampleRows: l.sampleRows ?? 0
			});
			return s("writing"), await r.assist({
				kind: c.data.kind,
				request: t,
				code: n,
				inputs: i
			});
		} catch (e) {
			return { error: at(e) };
		}
	}
	function B({ nodeIds: e = [], edgeIds: t = [] }) {
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
	function le() {
		let e = s.pop();
		if (e) {
			i.addNodes(e.nodes), i.addEdges(e.edges);
			for (let t of e.edges) O(t.target);
		}
	}
	function ue(e) {
		if (n(e)) return;
		let t = e.ctrlKey || e.metaKey;
		(e.key === "Delete" || e.key === "Backspace") && !t && !e.altKey ? (e.preventDefault(), B({
			nodeIds: i.getSelectedNodes.value.map((e) => e.id),
			edgeIds: i.getSelectedEdges.value.map((e) => e.id)
		})) : t && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z" && (e.preventDefault(), le());
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
		renameNode: j,
		setLabel: M,
		setOutputName: N,
		updateData: P,
		chooseFile: te,
		setIngestFormat: re,
		runNode: ce,
		executeGraph: R,
		resetNode: A,
		askAssistant: z,
		remove: B,
		undoDelete: le,
		onKeydown: ue
	};
}
//#endregion
//#region components/FlowNode.vue
var ct = {
	key: 0,
	class: "flow-node-kind"
}, lt = {
	key: 1,
	class: "flow-blink-dot flow-node-server-dot",
	role: "img",
	"aria-label": "Executes on server",
	title: "Executes on server"
}, ut = {
	key: 2,
	class: "flow-node-ref-hint"
}, dt = {
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
		}, r = t, i = _(Q), a = u(() => z[r.data.kind]), o = u(() => me(r.data)), s = u(() => i.server.value.state), c = u(() => o.value && s.value === "unavailable" ? "Backend not available." : n[i.run.status[r.id]] ?? ""), m = (e) => u(() => {
			let { inputs: t, outputs: n } = ue(r.data.kind);
			return he(e === "target" ? t : n).map((t, n) => ({
				id: `${e}-${n}`,
				top: t
			}));
		}), h = m("target"), b = m("source"), x = re(), C = u(() => new Set(x.value.map((e) => e.source === r.id ? e.sourceHandle : e.targetHandle))), w = T(!1), k = T(!1);
		return (n, r) => M((S(), p("div", {
			class: v(["flow-node", [`flow-node--${a.value.category}`, { "is-hovered": w.value }]]),
			onPointerenter: r[2] ||= (e) => w.value = !0,
			onPointerleave: r[3] ||= (e) => w.value = !1
		}, [
			t.data.label ? (S(), p("span", ct, D(a.value.label), 1)) : f("", !0),
			g(ce, {
				label: t.data.label || a.value.label,
				status: c.value,
				selected: t.selected
			}, null, 8, [
				"label",
				"status",
				"selected"
			]),
			o.value && s.value === "connected" ? (S(), p("span", lt)) : f("", !0),
			(S(!0), p(l, null, E(O(h), (e) => (S(), d(O(I), {
				id: e.id,
				key: e.id,
				type: "target",
				position: O(L).Left,
				class: v(["flow-handle flow-handle--in", { "is-connected": C.value.has(e.id) }]),
				style: y({ top: e.top })
			}, null, 8, [
				"id",
				"position",
				"class",
				"style"
			]))), 128)),
			(S(!0), p(l, null, E(O(b), (e) => (S(), d(O(I), {
				id: e.id,
				key: e.id,
				type: "source",
				position: O(L).Right,
				class: v(["flow-handle flow-handle--out", { "is-connected": C.value.has(e.id) }]),
				style: y({ top: e.top }),
				onPointerenter: r[0] ||= (e) => k.value = !0,
				onPointerleave: r[1] ||= (e) => k.value = !1
			}, null, 8, [
				"id",
				"position",
				"class",
				"style"
			]))), 128)),
			k.value ? (S(), p("span", ut, D(O(U)(t.id, t.data)), 1)) : f("", !0)
		], 34)), [[O(e), {
			items: O(_e),
			context: t.id
		}]]);
	}
}, ft = ["d"], pt = [
	"id",
	"x1",
	"y1",
	"x2",
	"y2"
], mt = ["d", "stroke"], ht = ["d", "stroke"], gt = ["d"], _t = ["d"], vt = {
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
		let n = t, r = _(Q), i = u(() => ne(n)[0]), a = (e) => r.run.status[e] === "completed", o = u(() => a(n.source) ? a(n.target) ? "flowed" : "flowing" : r.run.started ? "dormant" : "pristine"), s = (e) => `flow-node--${z[r.flow.findNode(e)?.data.kind]?.category}`, c = k().replace(/[^\w-]/g, ""), d = `flow-wire-flowed-${c}`, h = `flow-wire-flowing-${c}`;
		return (n, r) => M((S(), p("g", null, [
			o.value === "pristine" || o.value === "dormant" ? (S(), p("path", {
				key: 0,
				class: v(["flow-wire", o.value === "pristine" ? "flow-wire--idle" : "flow-wire--waiting"]),
				d: i.value
			}, null, 10, ft)) : (S(), p(l, { key: 1 }, [
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
				}, null, 2)], 8, pt))), 128))]),
				m("path", {
					class: "flow-wire",
					d: i.value,
					stroke: `url(#${d})`
				}, null, 8, mt),
				m("path", {
					class: v(["flow-wire flow-wire--grow", { "is-complete": o.value === "flowed" }]),
					d: i.value,
					pathLength: "1",
					stroke: `url(#${h})`
				}, null, 10, ht)
			], 64)),
			t.selected ? (S(), p("path", {
				key: 2,
				class: "flow-wire-gaps",
				d: i.value
			}, null, 8, gt)) : f("", !0),
			m("path", {
				class: "flow-wire-hit",
				d: i.value
			}, null, 8, _t)
		])), [[O(e), {
			items: O(ve),
			context: t.id
		}]]);
	}
}, yt = [
	"x1",
	"y1",
	"x2",
	"y2"
], bt = ["d", "stroke"], xt = {
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
		let t = e, n = _(Q), r = u(() => ne(t)[0]), i = u(() => {
			let e = {
				x: t.sourceX,
				y: t.sourceY
			}, n = {
				x: t.targetX,
				y: t.targetY
			};
			return t.fromInput ? [n, e] : [e, n];
		}), a = (e) => `flow-node--${z[e.data.kind].category}`, o = u(() => {
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
		}, null, 2)], 8, yt)]), m("path", {
			class: "flow-wire flow-connection-line",
			d: r.value,
			stroke: `url(#${s})`
		}, null, 8, bt)], 64));
	}
}, St = {
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
		let l = (e) => e.dataTransfer.types.includes(B);
		function u(e) {
			l(e) && (e.preventDefault(), e.dataTransfer.dropEffect = "copy");
		}
		function d(e) {
			if (!l(e)) return;
			e.preventDefault();
			let t;
			try {
				t = JSON.parse(e.dataTransfer.getData(B));
			} catch {
				return;
			}
			z[t?.kind] && r.addNode(t.kind, {
				x: e.clientX,
				y: e.clientY
			}, t.grab ?? void 0);
		}
		return (e, t) => (S(), p("div", {
			class: "flow-canvas-layer",
			onContextmenu: t[0] ||= (...e) => O(r).setContextPoint && O(r).setContextPoint(...e),
			onDragover: u,
			onDrop: d
		}, [g(O(te), {
			"min-zoom": .25,
			"max-zoom": 2,
			"connection-mode": O(F).Strict,
			"is-valid-connection": O(r).isValidConnection,
			"delete-key-code": null,
			"nodes-focusable": !1,
			"edges-focusable": !1,
			"selection-key-code": null,
			"multi-selection-key-code": null
		}, {
			"node-pipeline": j(({ id: e, data: t, selected: n }) => [g(dt, {
				id: e,
				data: t,
				selected: n
			}, null, 8, [
				"id",
				"data",
				"selected"
			])]),
			"edge-wire": j((e) => [g(vt, {
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
			"connection-line": j((e) => [g(xt, {
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
			default: j(() => [g(O(ae), {
				class: "flow-canvas-dots",
				gap: 24,
				size: 1
			})]),
			_: 1
		}, 8, ["connection-mode", "is-valid-connection"])], 32));
	}
}, Ct = { class: "flow-terminal" }, wt = {
	key: 0,
	class: "flow-panel-empty"
}, Tt = {
	key: 0,
	class: "flow-terminal-line flow-terminal-note"
}, Et = {
	key: 1,
	class: "flow-terminal-output"
}, Dt = {
	key: 2,
	class: "flow-terminal-error"
}, Ot = {
	key: 3,
	class: "flow-terminal-line"
}, kt = {
	key: 4,
	class: "flow-terminal-line"
}, At = {
	key: 5,
	class: "flow-terminal-line"
}, jt = {
	key: 6,
	class: "flow-terminal-line"
}, Mt = {
	key: 7,
	class: "flow-terminal-line flow-terminal-note"
}, Nt = {
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
			default: j(() => [m("div", Ct, [r.value ? (S(), p(l, { key: 1 }, [
				i.value ? (S(), p("p", Tt, " This node has changed since it ran (or something upstream has). Run it again to update this. ")) : f("", !0),
				r.value.output ? (S(), p("pre", Et, D(r.value.output), 1)) : f("", !0),
				r.value.error ? (S(), p("pre", Dt, D(r.value.error), 1)) : r.value.export ? (S(), p("p", Ot, " Wrote “" + D(r.value.export.filename) + "” (" + D(r.value.export.contentType) + ", " + D(O(De)(r.value.export.size)) + "). ", 1)) : r.value.tables ? (S(), p("p", kt, " Read " + D(r.value.tables.length) + " " + D(r.value.tables.length === 1 ? "table" : "tables") + ": " + D(o(r.value.tables)) + ". ", 1)) : r.value.data ? (S(), p("p", At, "Returned " + D(a(r.value.data.rowCount)) + ".", 1)) : r.value.value && r.value.value.kind !== "none" ? (S(), p("p", jt, " Returned a " + D(r.value.value.type) + " (see the Data panel). ", 1)) : r.value.output ? f("", !0) : (S(), p("p", Mt, "(no output)"))
			], 64)) : (S(), p("p", wt, " Nothing to show yet — run a node to see its output or errors here. "))])]),
			_: 1
		}));
	}
}, Pt = { class: "flow-library" }, Ft = { class: "flow-library-heading" }, It = { class: "flow-library-cards" }, Lt = ["title", "onDragstart"], Rt = {
	__name: "LibraryPanel",
	setup(e) {
		let t = R.map((e) => ({
			...e,
			kinds: le(e.id)
		}));
		function n(e, t) {
			let n = t.currentTarget.getBoundingClientRect(), r = {
				x: (t.clientX - n.left) / n.width,
				y: (t.clientY - n.top) / n.height
			};
			t.dataTransfer.setData(B, JSON.stringify({
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
			default: j(() => [m("div", Pt, [(S(!0), p(l, null, E(O(t), (e) => (S(), p("section", {
				key: e.id,
				class: "flow-library-section"
			}, [m("h3", Ft, [m("span", {
				class: v(["flow-library-dot", `flow-node--${e.id}`]),
				"aria-hidden": "true"
			}, null, 2), h(" " + D(e.label), 1)]), m("div", It, [(S(!0), p(l, null, E(e.kinds, (t) => (S(), p("div", {
				key: t,
				class: v(["flow-library-card", `flow-node--${e.id}`]),
				draggable: "true",
				title: `Drag onto the canvas to add ${O(z)[t].label}`,
				onDragstart: (e) => n(t, e)
			}, [g(ce, { label: O(z)[t].label }, null, 8, ["label"])], 42, Lt))), 128))])]))), 128))])]),
			_: 1
		}));
	}
}, zt = { class: "flow-props" }, Bt = { class: "flow-field" }, Vt = ["aria-disabled"], Ht = {
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
			default: j(() => [m("div", zt, [m("div", Bt, [m("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": O(t).run.executing,
				onClick: n[0] ||= (e) => O(t).run.executing || O(t).executeGraph()
			}, D(O(t).run.executing ? "Executing…" : "Execute Graph"), 9, Vt), n[1] ||= m("p", { class: "flow-field-hint" }, " Runs every node with Auto Run on, and the nodes they depend on. ", -1)])])]),
			_: 1
		}));
	}
}, Ut = { class: "flow-data" }, Wt = { class: "flow-table-wrap" }, Gt = { class: "flow-table" }, Kt = { class: "flow-pager" }, qt = ["aria-disabled"], Jt = ["aria-disabled"], Yt = {
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
		return (t, n) => (S(), p("div", Ut, [m("div", Wt, [m("table", Gt, [m("thead", null, [m("tr", null, [(S(!0), p(l, null, E(e.data.columns, (e, t) => (S(), p("th", { key: t }, D(e), 1))), 128))])]), m("tbody", null, [(S(!0), p(l, null, E(e.data.rows, (e, t) => (S(), p("tr", { key: t }, [(S(!0), p(l, null, E(e, (e, t) => (S(), p("td", { key: t }, D(o(e)), 1))), 128))]))), 128))])])]), m("div", Kt, [
			m("span", null, "Page " + D(e.data.page + 1), 1),
			m("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(-1),
				onClick: n[0] ||= (e) => a(-1)
			}, " Prev ", 8, qt),
			m("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(1),
				onClick: n[1] ||= (e) => a(1)
			}, " Next ", 8, Jt)
		])]));
	}
}, Xt = {
	key: 0,
	class: "flow-panel-empty"
}, Zt = {
	key: 1,
	class: "flow-panel-empty"
}, Qt = {
	key: 2,
	class: "flow-panel-empty"
}, $t = {
	key: 3,
	class: "flow-value"
}, en = { class: "flow-value-type" }, tn = { class: "flow-value-text" }, nn = {
	key: 4,
	class: "flow-panel-empty"
}, rn = {
	key: 5,
	class: "flow-data-tabs"
}, an = {
	key: 0,
	class: "flow-tabs",
	role: "tablist"
}, on = [
	"aria-selected",
	"title",
	"onClick"
], sn = {
	key: 1,
	class: "flow-panel-empty"
}, cn = {
	__name: "DataPanel",
	setup(e) {
		let t = _(Q), n = t.selectedNode, r = u(() => n.value && t.run.results[n.value.id]), i = u(() => n.value && t.run.status[n.value.id] === "running"), a = T(null);
		ee(n, () => a.value = null);
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
			default: j(() => [!r.value || r.value.error ? (S(), p("p", Xt, "Run a node to see its output here.")) : r.value.export && r.value.export.downloaded ? (S(), p("p", Zt, " “" + D(r.value.export.filename) + "” was downloaded to your computer. ", 1)) : r.value.export ? (S(), p("p", Qt, " “" + D(r.value.export.filename) + "” was written as this node ran upstream of another, not downloaded. Run this node to download it. ", 1)) : r.value.value && r.value.value.kind !== "none" ? (S(), p("div", $t, [m("p", en, D(r.value.value.type), 1), m("pre", tn, D(r.value.value.kind === "json" ? JSON.stringify(r.value.value.value, null, 2) : r.value.value.text), 1)])) : !r.value.data && !r.value.tables ? (S(), p("p", nn, " This node's output isn't tabular — see the Terminal panel. ")) : (S(), p("div", rn, [r.value.tables ? (S(), p("div", an, [(S(!0), p(l, null, E(r.value.tables, (e) => (S(), p("button", {
				key: e.name,
				type: "button",
				role: "tab",
				class: "flow-tab",
				"aria-selected": e === o.value,
				title: e.label === e.name ? void 0 : `${e.label} (${e.name} in SQL)`,
				onClick: (t) => a.value = e.name
			}, D(e.label), 9, on))), 128))])) : f("", !0), s.value.rowCount ? (S(), d(Yt, {
				key: 2,
				data: s.value,
				busy: i.value,
				onTurn: h
			}, null, 8, ["data", "busy"])) : (S(), p("p", sn, "No rows."))]))]),
			_: 1
		}));
	}
}, ln = {
	key: 0,
	class: "flow-field"
}, un = ["for"], dn = { class: "flow-assist" }, fn = [
	"id",
	"placeholder",
	"aria-describedby"
], pn = ["aria-disabled"], mn = ["id"], hn = {
	key: 0,
	class: "flow-field-hint"
}, gn = {
	key: 1,
	class: "flow-field-error"
}, _n = {
	key: 2,
	class: "flow-field-note"
}, vn = { class: "flow-field-hint" }, yn = {
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
		return (e, t) => i.value && a.value ? (S(), p("div", ln, [
			m("label", {
				class: "flow-field-label",
				for: O.request
			}, "Assistant", 8, un),
			m("div", dn, [M(m("textarea", {
				id: O.request,
				"onUpdate:modelValue": t[0] ||= (e) => o.value = e,
				class: "flow-field-input flow-assist-input",
				rows: "2",
				placeholder: `Say what the ${a.value.language} should do`,
				"aria-describedby": O.note,
				onKeydown: C
			}, null, 40, fn), [[A, o.value]]), m("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": !v.value,
				onClick: b
			}, D(g.value ? "Writing…" : "Write"), 9, pn)]),
			m("div", {
				id: O.note,
				class: "flow-assist-status",
				"aria-live": "polite"
			}, [g.value ? (S(), p("p", hn, D(s.value === "reading" ? "Reading its inputs…" : `Writing with ${i.value.model}…`), 1)) : l.value ? (S(), p("p", gn, D(l.value), 1)) : c.value ? (S(), p("p", _n, [h(D(c.value) + " ", 1), y.value ? (S(), p("button", {
				key: 0,
				type: "button",
				class: "flow-suggestion",
				onClick: x
			}, "Undo")) : f("", !0)])) : f("", !0), m("p", vn, D(w.value) + " Check what it writes before you run it.", 1)], 8, mn)
		])) : f("", !0);
	}
}, bn = { class: "flow-props" }, xn = { class: "flow-field" }, Sn = ["for"], Cn = [
	"id",
	"aria-invalid",
	"aria-describedby"
], wn = ["id"], Tn = {
	key: 0,
	class: "flow-field-error"
}, En = { class: "flow-field-hint" }, Dn = { class: "flow-field" }, On = ["for"], kn = ["id", "placeholder"], An = {
	key: 0,
	class: "flow-field"
}, jn = ["for"], Mn = ["id", "onKeydown"], Nn = {
	key: 1,
	class: "flow-field"
}, Pn = ["for"], Fn = ["id", "onKeydown"], In = {
	key: 2,
	class: "flow-field"
}, Ln = ["for"], Rn = ["id", "onKeydown"], zn = { class: "flow-field" }, Bn = [
	"id",
	"accept",
	"disabled",
	"aria-describedby"
], Vn = ["id"], Hn = {
	key: 0,
	class: "flow-field-error"
}, Un = {
	key: 1,
	class: "flow-field-hint"
}, Wn = {
	key: 2,
	class: "flow-field-hint"
}, Gn = { class: "flow-field" }, Kn = ["for"], qn = [
	"id",
	"value",
	"disabled"
], Jn = { value: "" }, Yn = ["value"], Xn = {
	key: 0,
	class: "flow-field"
}, Zn = ["for"], Qn = [
	"id",
	"placeholder",
	"aria-describedby",
	"onKeydown"
], $n = ["id"], er = { class: "flow-field" }, tr = ["for"], nr = ["id", "aria-describedby"], rr = ["id"], ir = { class: "flow-field" }, ar = ["for"], or = ["id", "value"], sr = ["value"], cr = {
	key: 5,
	class: "flow-field"
}, lr = ["for"], ur = { class: "flow-field-prefixed" }, dr = {
	class: "flow-field-prefix",
	"aria-hidden": "true"
}, fr = ["id"], pr = { class: "flow-field-check" }, mr = ["checked"], hr = { class: "flow-field" }, gr = { class: "flow-actions" }, _r = ["aria-disabled"], vr = { class: "flow-field-hint" }, yr = {
	key: 7,
	class: "flow-field-hint"
}, br = {
	__name: "NodeProperties",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = _(Q), r = u(() => z[t.node.data.kind]), i = u(() => n.run.status[t.node.id]), a = u(() => i.value === "running"), o = T(""), s = T(""), c = T(""), g = T(""), y = T(""), b = T(""), x = T(""), C = T(""), w = T(""), j = T(""), F = T(!1), I = null;
		ee(() => {
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
			I = t.node, o.value = t.node.id, s.value = "", c.value = t.node.data.label ?? "", g.value = t.node.data.outputSuffix ?? "", y.value = t.node.data.sqlQuery ?? "", b.value = t.node.data.jsCode ?? "", x.value = t.node.data.pythonCode ?? "", C.value = t.node.data.exportInput ?? "", w.value = t.node.data.exportFilename ?? "", e !== n && (j.value = "");
		}, { immediate: !0 });
		let L = () => n.flow.findNode(I.id) === I ? I : null;
		function te() {
			L() && (s.value = n.renameNode(I.id, o.value) ?? "", s.value || (o.value = I.id));
		}
		function ne() {
			L() && n.setLabel(I.id, c.value);
		}
		function re() {
			L() && (n.setOutputName(I.id, g.value), g.value = I.data.outputSuffix ?? "");
		}
		function ie() {
			L() && n.updateData(I.id, { sqlQuery: y.value });
		}
		function ae() {
			ie(), L() && n.runNode(I.id);
		}
		function oe() {
			L() && n.updateData(I.id, { jsCode: b.value });
		}
		function se() {
			oe(), L() && n.runNode(I.id);
		}
		function ce() {
			L() && n.updateData(I.id, { pythonCode: x.value });
		}
		function R() {
			ce(), L() && n.runNode(I.id);
		}
		function B() {
			L() && n.updateData(I.id, { exportInput: C.value.trim() || void 0 });
		}
		function le() {
			L() && n.updateData(I.id, { exportFilename: w.value.trim() || void 0 });
		}
		let ue = u(() => ({
			"sql-query": y,
			"python-script": x,
			javascript: b
		})[t.node.data.kind]?.value ?? ""), de = u(() => {
			let e = U(t.node.id, t.node.data), n = t.node.data.ingest;
			if (!n || !G[n.format].multi) return `this node's data as “${e}”`;
			let r = n.tables.map((t) => `“${e}.${t.name}”`);
			return `this node's tables as ${r.slice(0, 3).join(", ")}${r.length > 3 ? ", …" : ""}`;
		}), V = u(() => t.node.data.ingest), fe = u(() => V.value && K(V.value.fileName)), pe = u(() => {
			let { fileName: e, fileSize: t, format: n, tables: r } = V.value, i = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`, a = G[n].multi ? `${r.length} ${n === "xlsx" ? "sheets" : "tables"}, ${i(r.reduce((e, t) => e + t.rowCount, 0))}` : i(r[0]?.rowCount ?? 0);
			return `${e} · ${De(t)} · ${G[n].label}, ${a}`;
		}), H = u(() => V.value && !t.node.data.label && Ee(V.value.fileName));
		async function he(e) {
			let n = t.node;
			F.value = !0, j.value = "";
			try {
				let r = await e();
				t.node === n && (j.value = r ?? "");
			} finally {
				F.value = !1;
			}
		}
		function _e(e) {
			let r = e.target.files[0];
			e.target.value = "", r && he(() => n.chooseFile(t.node.id, r));
		}
		let ve = (e) => he(() => n.setIngestFormat(t.node.id, e.target.value)), W = u(() => [...new Set(n.flow.edges.value.filter((e) => e.target === t.node.id).map((e) => e.source))].map((e) => n.flow.findNode(e)).filter(Boolean).flatMap((e) => {
			let t = U(e.id, e.data), n = z[e.data.kind].category, r = e.data.ingest && G[e.data.ingest.format].multi ? e.data.ingest.tables : [];
			return [{
				name: t,
				category: n
			}, ...r.map((e) => ({
				name: `${t}.${e.name}`,
				category: n,
				table: !0
			}))];
		})), ye = u(() => W.value.filter((e) => !e.table).length > 1 || !!t.node.data.exportInput), be = _(ge), we = T(null);
		function Oe() {
			let e = we.value.getBoundingClientRect();
			be({
				x: e.left,
				y: e.bottom + 4
			}, { items: W.value.map(({ name: e, category: t }) => ({
				label: e,
				badge: { class: `flow-node--${t}` },
				action: () => {
					C.value = e, B();
				}
			})) });
		}
		let ke = u(() => t.node.data.exportFormat ?? ""), Ae = u(() => {
			let e = w.value.trim() || "export";
			return Te(e, ke.value || K(e) || "csv");
		}), je = (e) => n.updateData(t.node.id, { exportFormat: e.target.value || void 0 }), Me = u(() => t.node.data.autoRun !== !1), Ne = (e) => n.updateData(t.node.id, { autoRun: e.target.checked ? void 0 : !1 }), Pe = u(() => t.node.data.sqlServerTables ?? []), Fe = u(() => me(t.node.data)), Ie = n.server, Le = u(() => Fe.value && Ie.value.state !== "connected"), Re = u(() => !a.value && !F.value && !Le.value && (t.node.data.kind !== "data-ingest" || !!V.value)), ze = u(() => t.node.data.kind === "data-export" ? "Writes whatever's wired into this node on Run. Downloads to your computer immediately; errors show in the Terminal panel." : "Results land in the Data panel; errors show in the Terminal panel.");
		function q(e) {
			let t = e.target.parentElement.closest("[tabindex]");
			t ? t.focus() : e.target.blur();
		}
		let J = k(), Y = {
			id: `${J}-id`,
			idNote: `${J}-id-note`,
			label: `${J}-label`,
			sql: `${J}-sql`,
			output: `${J}-output`,
			file: `${J}-file`,
			fileNote: `${J}-file-note`,
			format: `${J}-format`,
			filename: `${J}-filename`,
			filenameNote: `${J}-filename-note`,
			js: `${J}-js`,
			py: `${J}-py`,
			input: `${J}-input`,
			inputNote: `${J}-input-note`
		};
		return (t, u) => (S(), p("div", bn, [
			m("div", xn, [
				m("label", {
					class: "flow-field-label",
					for: Y.id
				}, "ID", 8, Sn),
				M(m("input", {
					id: Y.id,
					"onUpdate:modelValue": u[0] ||= (e) => o.value = e,
					class: v(["flow-field-input flow-field-input--mono", { "is-invalid": s.value }]),
					"aria-invalid": !!s.value,
					"aria-describedby": Y.idNote,
					spellcheck: "false",
					autocomplete: "off",
					onInput: u[1] ||= (e) => s.value = "",
					onBlur: te,
					onKeydown: N(q, ["enter"])
				}, null, 42, Cn), [[A, o.value]]),
				m("div", { id: Y.idNote }, [s.value ? (S(), p("p", Tn, D(s.value), 1)) : f("", !0), m("p", En, " Downstream nodes reference " + D(de.value) + ". Renaming doesn't update that text inside other nodes' queries or code — you'll need to update those yourself. ", 1)], 8, wn)
			]),
			m("div", Dn, [m("label", {
				class: "flow-field-label",
				for: Y.label
			}, "Name", 8, On), M(m("input", {
				id: Y.label,
				"onUpdate:modelValue": u[2] ||= (e) => c.value = e,
				class: "flow-field-input",
				placeholder: r.value.label,
				autocomplete: "off",
				onBlur: ne,
				onKeydown: N(q, ["enter"])
			}, null, 40, kn), [[A, c.value]])]),
			(S(), d(yn, {
				key: e.node.id,
				node: e.node,
				code: ue.value
			}, null, 8, ["node", "code"])),
			e.node.data.kind === "sql-query" ? (S(), p("div", An, [
				m("label", {
					class: "flow-field-label",
					for: Y.sql
				}, "SQL", 8, jn),
				M(m("textarea", {
					id: Y.sql,
					"onUpdate:modelValue": u[3] ||= (e) => y.value = e,
					class: "flow-field-input flow-field-input--mono flow-field-code",
					rows: "8",
					spellcheck: "false",
					placeholder: "SELECT * FROM upstream_node_data",
					onBlur: ie,
					onKeydown: [N(P(ae, ["ctrl", "prevent"]), ["enter"]), N(P(ae, ["meta", "prevent"]), ["enter"])]
				}, null, 40, Mn), [[A, y.value]]),
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
			e.node.data.kind === "python-script" ? (S(), p("div", Nn, [
				m("label", {
					class: "flow-field-label",
					for: Y.py
				}, "Python", 8, Pn),
				M(m("textarea", {
					id: Y.py,
					"onUpdate:modelValue": u[4] ||= (e) => x.value = e,
					class: "flow-field-input flow-field-input--mono flow-field-code",
					rows: "8",
					spellcheck: "false",
					placeholder: "upstream_node_data.groupby('region').sum()",
					onBlur: ce,
					onKeydown: [N(P(R, ["ctrl", "prevent"]), ["enter"]), N(P(R, ["meta", "prevent"]), ["enter"])]
				}, null, 40, Fn), [[A, x.value]]),
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
			e.node.data.kind === "javascript" ? (S(), p("div", In, [
				m("label", {
					class: "flow-field-label",
					for: Y.js
				}, "JavaScript", 8, Ln),
				M(m("textarea", {
					id: Y.js,
					"onUpdate:modelValue": u[5] ||= (e) => b.value = e,
					class: "flow-field-input flow-field-input--mono flow-field-code",
					rows: "8",
					spellcheck: "false",
					placeholder: "return upstream_node_data.filter((row) => row.amount > 10)",
					onBlur: oe,
					onKeydown: [N(P(se, ["ctrl", "prevent"]), ["enter"]), N(P(se, ["meta", "prevent"]), ["enter"])]
				}, null, 40, Rn), [[A, b.value]]),
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
			e.node.data.kind === "data-ingest" ? (S(), p(l, { key: 3 }, [m("div", zn, [
				u[15] ||= m("span", { class: "flow-field-label" }, "File", -1),
				m("label", { class: v(["flow-file", { "is-busy": F.value }]) }, [m("input", {
					id: Y.file,
					type: "file",
					class: "flow-file-input",
					accept: O(Ce),
					disabled: F.value,
					"aria-describedby": Y.fileNote,
					onChange: _e
				}, null, 40, Bn), h(" " + D(F.value ? "Reading…" : V.value ? "Choose another file…" : "Choose file…"), 1)], 2),
				m("div", { id: Y.fileNote }, [j.value ? (S(), p("p", Hn, D(j.value), 1)) : f("", !0), V.value ? (S(), p("p", Un, D(pe.value), 1)) : (S(), p("p", Wn, " CSV, TSV, JSON, GeoJSON, Parquet, Excel (.xlsx) or SQLite. Its data is read and kept; the file itself isn't. "))], 8, Vn),
				H.value ? (S(), p("button", {
					key: 0,
					type: "button",
					class: "flow-suggestion",
					onClick: u[6] ||= (t) => O(n).setLabel(e.node.id, H.value)
				}, " Rename to “" + D(H.value) + "” to match " + D(V.value.fileName) + "? ", 1)) : f("", !0)
			]), m("div", Gn, [m("label", {
				class: "flow-field-label",
				for: Y.format
			}, "File Type", 8, Kn), m("select", {
				id: Y.format,
				class: "flow-field-input flow-field-select",
				value: e.node.data.ingestFormat ?? "",
				disabled: F.value,
				onChange: ve
			}, [m("option", Jn, " From file name" + D(fe.value ? ` (${O(G)[fe.value].label})` : ""), 1), (S(!0), p(l, null, E(O(xe), (e) => (S(), p("option", {
				key: e,
				value: e
			}, D(O(G)[e].label), 9, Yn))), 128))], 40, qn)])], 64)) : f("", !0),
			e.node.data.kind === "data-export" ? (S(), p(l, { key: 4 }, [
				ye.value ? (S(), p("div", Xn, [
					m("label", {
						class: "flow-field-label",
						for: Y.input
					}, "Input", 8, Zn),
					m("div", {
						ref_key: "inputField",
						ref: we,
						class: "flow-field-combo"
					}, [M(m("input", {
						id: Y.input,
						"onUpdate:modelValue": u[7] ||= (e) => C.value = e,
						class: "flow-field-input flow-field-input--mono",
						placeholder: W.value[0]?.name ?? "",
						autocomplete: "off",
						spellcheck: "false",
						"aria-describedby": Y.inputNote,
						onBlur: B,
						onKeydown: [N(q, ["enter"]), N(P(Oe, ["alt", "prevent"]), ["down"])]
					}, null, 40, Qn), [[A, C.value]]), m("button", {
						type: "button",
						class: "flow-field-combo-button",
						"aria-label": "Choose from the nodes wired in",
						"aria-haspopup": "menu",
						onClick: Oe
					}, [...u[16] ||= [m("svg", {
						viewBox: "0 0 12 12",
						"aria-hidden": "true"
					}, [m("path", { d: "M3 4.5 6 7.5 9 4.5" })], -1)]])], 512),
					m("p", {
						id: Y.inputNote,
						class: "flow-field-hint"
					}, [
						u[17] ||= h(" Several nodes are wired in: name the one to write, by its output (like ", -1),
						m("code", null, D(W.value[0]?.name), 1),
						u[18] ||= h("), or choose it from the list. Left empty, it only runs with one wired in. ", -1)
					], 8, $n)
				])) : f("", !0),
				m("div", er, [
					m("label", {
						class: "flow-field-label",
						for: Y.filename
					}, "Filename", 8, tr),
					M(m("input", {
						id: Y.filename,
						"onUpdate:modelValue": u[8] ||= (e) => w.value = e,
						class: "flow-field-input",
						placeholder: "export",
						autocomplete: "off",
						spellcheck: "false",
						"aria-describedby": Y.filenameNote,
						onBlur: le,
						onKeydown: N(q, ["enter"])
					}, null, 40, nr), [[A, w.value]]),
					m("p", {
						id: Y.filenameNote,
						class: "flow-field-hint"
					}, "Saves as " + D(Ae.value), 9, rr)
				]),
				m("div", ir, [m("label", {
					class: "flow-field-label",
					for: Y.format
				}, "File Type", 8, ar), m("select", {
					id: Y.format,
					class: "flow-field-input flow-field-select",
					value: ke.value,
					onChange: je
				}, [u[19] ||= m("option", { value: "" }, "From file name (CSV if none)", -1), (S(!0), p(l, null, E(O(Se), (e) => (S(), p("option", {
					key: e,
					value: e
				}, D(O(G)[e].label), 9, sr))), 128))], 40, or)])
			], 64)) : f("", !0),
			r.value.outputName ? (S(), p("div", cr, [m("label", {
				class: "flow-field-label",
				for: Y.output
			}, "Output Name", 8, lr), m("div", ur, [m("span", dr, D(e.node.id) + "_", 1), M(m("input", {
				id: Y.output,
				"onUpdate:modelValue": u[9] ||= (e) => g.value = e,
				class: "flow-field-input flow-field-input--mono",
				placeholder: "data",
				spellcheck: "false",
				autocomplete: "off",
				onBlur: re,
				onKeydown: N(q, ["enter"])
			}, null, 40, fr), [[A, g.value]])])])) : f("", !0),
			r.value.runs ? (S(), p(l, { key: 6 }, [
				Fe.value ? (S(), p("p", {
					key: 0,
					class: v(["flow-field-note", { "is-warning": Le.value }])
				}, [
					Pe.value.length ? (S(), p(l, { key: 0 }, [h(" Reads " + D(Pe.value.join(", ")) + " from the server, so it runs there: ", 1)], 64)) : (S(), p(l, { key: 1 }, [h("Runs on the server:")], 64)),
					h(" running this node sends its input data to the server" + D(O(Ie).state === "connected" && O(Ie).address ? ` at ${O(Ie).address}` : "") + " to complete. ", 1),
					Le.value ? (S(), p(l, { key: 2 }, [h("The server isn't available, so it can't run now.")], 64)) : f("", !0)
				], 2)) : f("", !0),
				m("label", pr, [u[20] ||= h(" Auto Run ", -1), m("input", {
					type: "checkbox",
					checked: Me.value,
					onChange: Ne
				}, null, 40, mr)]),
				m("div", hr, [m("div", gr, [m("button", {
					type: "button",
					class: "flow-button flow-button--wide",
					"aria-disabled": !Re.value,
					onClick: u[10] ||= (t) => Re.value && O(n).runNode(e.node.id)
				}, D(a.value ? "Running…" : "Run"), 9, _r), i.value && !a.value ? (S(), p("button", {
					key: 0,
					type: "button",
					class: "flow-button flow-button--quiet",
					title: "Back to not run: clears its status and output",
					onClick: u[11] ||= (t) => O(n).resetNode(e.node.id)
				}, " Reset ")) : f("", !0)]), m("p", vr, D(ze.value), 1)])
			], 64)) : (S(), p("p", yr, "No editable properties yet for this node kind."))
		]));
	}
}, xr = {
	key: 1,
	class: "flow-panel-empty"
}, Sr = {
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
			default: j(() => [O(t).selectedNode.value ? (S(), d(br, {
				key: 0,
				node: O(t).selectedNode.value
			}, null, 8, ["node"])) : (S(), p("p", xr, "Select a node to see its properties."))]),
			_: 1
		}));
	}
}, Cr = {
	__name: "ServerStatus",
	setup(e) {
		let t = _(Q), n = t.server, r = u(() => n.value.state === "connected"), i = u(() => r.value && t.flow.nodes.value.some((e) => me(e.data)));
		return (e, t) => O(n).state === "checking" ? f("", !0) : (S(), p("div", {
			key: 0,
			class: v(["flow-server-status", r.value ? "flow-node--modify" : "flow-node--fetch"]),
			role: "status"
		}, [m("span", {
			class: v(["flow-blink-dot", { "is-steady": !i.value }]),
			"aria-hidden": "true"
		}, null, 2), r.value ? (S(), p(l, { key: 0 }, [h(" LIVE · connected to server" + D(O(n).address ? ` ${O(n).address}` : ""), 1)], 64)) : (S(), p(l, { key: 1 }, [h("backend not available, client execution only")], 64))], 2));
	}
}, wr = 400;
function Tr(e, t) {
	let n = null, r = null;
	function i() {
		n && (clearTimeout(n), n = null, t.save(e.snapshot.value));
	}
	function a() {
		clearTimeout(n), n = setTimeout(i, wr);
	}
	let o = () => document.visibilityState === "hidden" && i();
	x(async () => {
		e.load(t ? await t.load() : null), t && (r = ee(e.snapshot, a), window.addEventListener("pagehide", i), document.addEventListener("visibilitychange", o));
	}), b(() => {
		r?.(), window.removeEventListener("pagehide", i), document.removeEventListener("visibilitychange", o), t && i();
	});
}
//#endregion
//#region lib/themes.js
var Er = [
	"FLOW",
	"FLOWDARK",
	"LUX",
	"LUXDARK"
], Dr = new Map(Er.map((e) => [e, {
	name: e,
	base: null,
	tokens: {}
}])), $ = (e) => String(e).toUpperCase();
function Or({ name: e, base: t = "FLOW", tokens: n = {} }) {
	if (!e) throw Error("A theme needs a name.");
	if (Er.includes($(e))) throw Error(`${$(e)} is a built-in theme; give yours another name.`);
	if (!Dr.has($(t))) throw Error(`Theme ${$(e)} is based on ${$(t)}, which isn't defined.`);
	Dr.set($(e), {
		name: $(e),
		base: $(t),
		tokens: { ...n }
	});
}
var kr = (e) => Dr.has($(e)), Ar = () => [...Dr.keys()];
function jr(e) {
	let t = Dr.get($(e)) ?? Dr.get("FLOW");
	if (!t.base) return {
		name: t.name,
		className: `flow-theme-${t.name.toLowerCase()}`,
		tokens: {}
	};
	let n = jr(t.base);
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
var Mr = { class: "flow-title flow-pan-trigger" }, Nr = { class: "flow-brand-text flow-title-text" }, Pr = {
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
			validator: kr
		},
		autoHideRails: {
			type: Boolean,
			default: !0
		}
	},
	setup(t) {
		let n = t, r = u(() => jr(n.theme)), a = u(() => r.value.className), o = u(() => r.value.tokens), c = s({ autoHideRails: () => n.autoHideRails }), l = st({
			sql: n.sql,
			files: n.storage,
			server: n.server
		});
		C(Q, l), Tr(l, n.storage);
		let { commands: f, canvasMenu: p } = be(c, l), h = T(null), _ = (e) => !!e.target.closest(".wm-content");
		function b(e) {
			_(e) || l.onKeydown(e);
		}
		function x(e) {
			h.value.open(e.point, {
				items: ye,
				context: e
			});
		}
		return C(ge, (e, t) => h.value.open(e, t)), (n, r) => (S(), d(i, {
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
			title: j(() => [m("span", Mr, [m("span", Nr, D(t.title), 1)])]),
			panels: j(() => [
				g(Nt),
				g(Rt),
				g(Ht),
				g(cn),
				g(Sr),
				g(Cr)
			]),
			default: j(() => [M(g(St, { onConnectionDropped: x }, null, 512), [[O(e), O(p)]])]),
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
export { Q as FLOW_GRAPH, c as FlowPanel, Pr as FlowgraphEditor, R as NODE_CATEGORIES, z as NODE_KINDS, a as PANEL_LAYOUT, o as PANEL_MENU, i as PanelHost, s as createPanelLayout, Or as defineTheme, r as panelCommands, t as panelsSubmenu, jr as resolveTheme, Ar as themeNames };
