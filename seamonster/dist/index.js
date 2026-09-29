import { r as e } from "./menu-ByXvYfw3.js";
import { a as t, c as n, i as r, n as i, o as a, r as o, s, t as c } from "./panels-dfiW9ww3.js";
import { Fragment as l, computed as u, createBlock as d, createCommentVNode as f, createElementBlock as p, createElementVNode as m, createTextVNode as h, createVNode as g, inject as _, markRaw as v, nextTick as y, normalizeClass as b, normalizeStyle as x, onBeforeUnmount as S, onMounted as C, openBlock as w, provide as T, reactive as E, ref as D, renderList as O, resolveDynamicComponent as k, shallowReactive as A, toDisplayString as j, unref as M, useId as N, vModelDynamic as ee, vModelText as te, watch as P, withCtx as F, withDirectives as I, withKeys as L, withModifiers as ne } from "vue";
import { ConnectionMode as R, Handle as z, Position as re, VueFlow as B, getBezierPath as ie, useNodeConnections as V, useVueFlow as H } from "@vue-flow/core";
import { Background as ae } from "@vue-flow/background";
//#region components/NodeFace.vue
var U = ["title"], W = { class: "flow-node-label" }, oe = {
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
		return (t, n) => (w(), p("div", { class: b(["flow-node-face", { "is-selected": e.selected }]) }, [m("span", {
			class: "flow-node-status",
			title: e.status || void 0
		}, j(e.status), 9, U), m("span", W, j(e.label), 1)], 2));
	}
}, G = {
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
}, se = Object.keys(G).filter((e) => G[e].read), ce = Object.keys(G).filter((e) => G[e].write), le = se.flatMap((e) => G[e].extensions).map((e) => `.${e}`).join(","), ue = (e) => /\.([^./\\]+)$/.exec(e)?.[1].toLowerCase() ?? "";
function de(e) {
	let t = ue(e);
	return Object.keys(G).find((e) => G[e].extensions.includes(t)) ?? null;
}
function fe(e, t) {
	let { extensions: n } = G[t];
	return n.includes(ue(e)) ? e : `${e}.${n[0]}`;
}
var pe = (e) => e.replace(/\.[^.]*$/, "").replace(/[_\-\s]+/g, " ").trim();
function me(e) {
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
var he = {
	format: "pipeline",
	nodes: [],
	edges: []
};
function ge(e, t, n) {
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
var _e = (e) => Number.isFinite(e?.x) && Number.isFinite(e?.y);
function ve(e) {
	if (e?.format !== "pipeline" || !Array.isArray(e.nodes) || !Array.isArray(e.edges)) return null;
	let t = e.nodes.filter((e) => typeof e?.id == "string" && typeof e.kind == "string" && e.kind && _e(e.position)).map(({ id: e, position: t, ...n }) => ({
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
		viewport: _e(e.viewport) && Number.isFinite(e.viewport.zoom) ? e.viewport : null
	};
}
//#endregion
//#region lib/sqlText.js
var K = (e) => `"${e.replaceAll("\"", "\"\"")}"`, ye = (e) => `'${e.replaceAll("'", "''")}'`;
async function be(e, t, n, r) {
	let i = await e.query(`COPY (${t}) TO ${ye(n)} (${r})`);
	return Number(i.rows[0]?.[0] ?? 0);
}
async function xe(e) {
	await e.query("INSTALL excel"), await e.query("LOAD excel");
}
//#endregion
//#region lib/xlsx.js
var Se = 67324752, Ce = 33639248, we = 101010256, Te = "This doesn't look like an .xlsx file.", Ee = (e) => new DataView(e.buffer, e.byteOffset, e.byteLength);
function De(e, t) {
	for (let n = e.length - 22; n >= Math.max(0, e.length - 65557); n--) if (t.getUint32(n, !0) === we) return n;
	return -1;
}
async function Oe(e) {
	return [...(await je(e, "xl/workbook.xml")).matchAll(/<sheet\b[^>]*?\bname="([^"]*)"/g)].map((e) => ke(e[1]));
}
var ke = (e) => e.replace(/&(lt|gt|quot|apos|amp);/g, (e, t) => ({
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	amp: "&"
})[t]);
function Ae(e) {
	let t = Ee(e);
	if (e.length >= 4 && t.getUint32(0, !0) === Se) return e;
	let n = De(e, t);
	if (n < 0) return e;
	let r = t.getUint32(n + 12, !0), i = t.getUint32(n + 16, !0), a = n - r - i;
	return a > 0 && t.getUint32(a, !0) === Se ? e.slice(a) : e;
}
async function je(e, t) {
	let n = Ee(e), r = De(e, n);
	if (r < 0) throw Error(Te);
	let i = n.getUint16(r + 10, !0), a = n.getUint32(r + 16, !0);
	for (let r = 0; r < i && n.getUint32(a, !0) === Ce; r++) {
		let r = n.getUint16(a + 10, !0), i = n.getUint32(a + 20, !0), o = n.getUint16(a + 28, !0), s = o + n.getUint16(a + 30, !0) + n.getUint16(a + 32, !0);
		if (new TextDecoder().decode(e.subarray(a + 46, a + 46 + o)) === t) {
			let t = n.getUint32(a + 42, !0), o = t + 30 + n.getUint16(t + 26, !0) + n.getUint16(t + 28, !0), s = e.subarray(o, o + i);
			if (r === 0) return new TextDecoder().decode(s);
			if (r === 8) {
				let e = new Blob([s]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
				return new Response(e).text();
			}
			throw Error(Te);
		}
		a += 46 + s;
	}
	throw Error(Te);
}
var Me = "flow_out", Ne = "flow_in", Pe = /* @__PURE__ */ new Set([
	"memory",
	"system",
	"temp"
]), Fe = /* @__PURE__ */ new Set(["information_schema", "pg_catalog"]), Ie = (e) => e?.message ?? String(e);
function Le(e, t) {
	Array.isArray(e) ? e.forEach((e) => Le(e, t)) : e && typeof e == "object" && (t(e), Object.values(e).forEach((e) => Le(e, t)));
}
function Re(e) {
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
		let o = new Map(t.nodes.map((e) => [e.id, e])), { order: s, inputs: c } = Be(t, n);
		await e.query(`DROP SCHEMA IF EXISTS ${Me} CASCADE`), await e.query(`CREATE SCHEMA ${Me}`);
		let d = /* @__PURE__ */ new Map(), f = {
			outputs: d,
			getFile: i,
			server: a
		}, p = {};
		for (let e of s) {
			let t = c.get(e) ?? [], n = t.map((e) => e.source).find((e) => p[e].error);
			if (n) {
				p[e] = { error: `Upstream node ${n} failed.` };
				continue;
			}
			let i = o.get(e), a = r?.id === e ? r : { page: 0 };
			try {
				let n = l(t, o, d);
				await v(n), p[e] = await u(i, n, a, f);
			} catch (t) {
				p[e] = { error: Ie(t) };
			}
		}
		return {
			results: p,
			outputs: d
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
				name: Yt(e, t),
				kind: Q(t.kind).label,
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
			sample: (n > 0 ? (await e.query(`SELECT * FROM ${t} LIMIT ${Math.floor(n)}`)).rows : []).map((e) => e.map(ze))
		};
	}
	function l(e, t, n) {
		let r = /* @__PURE__ */ new Set(), i = [];
		for (let a of e) {
			let e = t.get(a.source), o = a.targetHandle?.startsWith("target:") ? a.targetHandle.slice(7) : null;
			for (let t of tn(a.sourceHandle, e.id, e)) {
				let a = JSON.stringify([
					e.id,
					t.name,
					o
				]);
				if (r.has(a)) continue;
				r.add(a);
				let s = t.name === null ? n.get(e.id) : n.get(e.id)?.slots?.[t.name];
				if (!s) continue;
				let { table: c, tables: l } = s;
				i.push({
					id: e.id,
					kind: e.kind,
					slot: t.name,
					ref: t.ref,
					pin: o,
					...l ? { tables: l } : { table: c }
				});
			}
		}
		return i;
	}
	async function u(t, n, r, i) {
		if (!Z(t.kind)) return { error: `This app doesn't have ${t.kind} nodes, so this one can't run here. It's kept as it was, and saving the graph keeps it.` };
		let { run: a, label: o } = Y[t.kind];
		if (!a) return { error: `${o} nodes can't run yet.` };
		let s = Vt(t).filter((e) => e.severity === "error");
		if (s.length) return { error: s.map((e) => `${e.label}: ${e.message}`).join(" ") };
		let c = d(It(t), n, i), { table: l, tables: u, slots: f, error: p, ...m } = await a(c) ?? {};
		if (p) return {
			error: p,
			...m.output === void 0 ? {} : { output: m.output }
		};
		let h = async (t) => (await e.query(`CREATE TABLE ${t} AS SELECT NULL::VARCHAR AS value WHERE false`), { table: t }), g = u ? { tables: u } : l ? { table: l } : await h(c.table()), _ = $t(t.id, t).slice(1), v = {};
		for (let e of _) {
			let t = f?.[e.name];
			v[e.name] = typeof t == "string" ? { table: t } : t?.tables ? { tables: t.tables } : await h(c.slotTable(e.name));
		}
		if (i.outputs.set(t.id, {
			...g,
			..._.length ? { slots: v } : {}
		}), m.export) return m;
		let b = async (e, t) => {
			let n = (e) => (r.slot ?? null) === t && (r.table ?? null) === e ? r.page ?? 0 : 0;
			if (e.table) return { data: await y(e.table, n(null)) };
			let i = [];
			for (let t of e.tables) i.push({
				name: t.name,
				label: t.label,
				data: await y(t.table, n(t.name))
			});
			return { tables: i };
		}, x = {
			...m,
			...u || l ? await b(g, null) : {}
		};
		if (_.length) {
			x.slots = [];
			for (let e of _) x.slots.push({
				name: e.name,
				label: e.label,
				ref: e.ref,
				...await b(v[e.name], e.name)
			});
		}
		return x;
	}
	function d(t, n, { getFile: r, server: i }) {
		return {
			id: t.id,
			node: t,
			inputs: n,
			sql: e,
			server: i,
			getFile: r,
			table: (e) => `${Me}.${K(e ? `${t.id}/${e}` : t.id)}`,
			slotTable: (e, n) => `${Me}.${K(n ? `${t.id}#${e}/${n}` : `${t.id}#${e}`)}`,
			rows: _,
			parquet: () => p(n),
			loadParquet: h,
			loadRows: g,
			serverTables: (e) => f(e, [...new Set(n.map((e) => e.ref))])
		};
	}
	async function f(t, n) {
		let r = t.trim().replace(/;+\s*$/, "");
		if (!r || !e) return [];
		let i;
		try {
			i = JSON.parse((await e.query(`SELECT json_serialize_sql(${ye(r)})`)).rows[0][0]);
		} catch {
			return [];
		}
		if (i.error) return [];
		let a = (e) => (e ?? "").toLowerCase(), o = new Set(n.map(a)), s = [], c = /* @__PURE__ */ new Set();
		Le(i, (e) => {
			for (let { key: t } of e.cte_map?.map ?? []) c.add(a(t));
			e.type === "BASE_TABLE" && s.push(e);
		});
		let l = ({ catalog_name: e, schema_name: t, table_name: n }) => e ? Pe.has(a(e)) : t ? Fe.has(a(t)) || o.has(a(t)) : o.has(a(n)) || c.has(a(n)), u = s.filter((e) => !l(e)).map((e) => [
			e.catalog_name,
			e.schema_name,
			e.table_name
		].filter(Boolean).join("."));
		return [...new Set(u)];
	}
	async function p(e) {
		let t = [], n = /* @__PURE__ */ new Set();
		for (let r of e) if (!n.has(r.ref)) {
			if (n.add(r.ref), r.table) t.push({
				name: r.ref,
				bytes: await m(r.table)
			});
			else for (let e of r.tables) t.push({
				name: `${r.ref}.${e.name}`,
				bytes: await m(e.table)
			});
		}
		return t;
	}
	async function m(t) {
		let n = `flow-send-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`;
		await be(e, `SELECT * FROM ${t}`, n, "FORMAT parquet");
		try {
			return await e.readFile(n);
		} finally {
			await e.dropFile(n);
		}
	}
	async function h(t, n) {
		let r = `flow-received-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`;
		await e.registerFile(r, n);
		try {
			await e.query(`CREATE TABLE ${t} AS SELECT * FROM read_parquet(${ye(r)})`);
		} finally {
			await e.dropFile(r);
		}
	}
	async function g(t, n) {
		if (!n.length) {
			await e.query(`CREATE TABLE ${t} AS SELECT NULL::VARCHAR AS value WHERE false`);
			return;
		}
		let r = `flow-rows-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
		await e.registerFile(r, new TextEncoder().encode(JSON.stringify(n)));
		try {
			await e.query(`CREATE TABLE ${t} AS SELECT * FROM read_json_auto(${ye(r)}, format = 'array')`);
		} finally {
			await e.dropFile(r);
		}
	}
	async function _(t) {
		let n = async (t) => {
			let { columns: n, rows: r } = await e.query(`SELECT * FROM ${t}`);
			return r.map((e) => Object.fromEntries(n.map((t, n) => [t, e[n]])));
		};
		return t.table ? n(t.table) : Object.fromEntries(await Promise.all(t.tables.map(async (e) => [e.name, await n(e.table)])));
	}
	async function v(t) {
		for (let t of [Ne, ...n]) await e.query(`DROP SCHEMA IF EXISTS ${K(t)} CASCADE`);
		n = [], await e.query(`CREATE SCHEMA ${Ne}`), await e.query(`SET search_path = '${Ne},main'`);
		let r = /* @__PURE__ */ new Set();
		for (let i of t) {
			let t = i.ref;
			if (!r.has(t)) {
				if (r.add(t), i.table) {
					await e.query(`CREATE VIEW ${Ne}.${K(t)} AS SELECT * FROM ${i.table}`);
					continue;
				}
				await e.query(`CREATE SCHEMA ${K(t)}`), n.push(t);
				for (let n of i.tables) await e.query(`CREATE VIEW ${K(t)}.${K(n.name)} AS SELECT * FROM ${n.table}`);
			}
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
	let b = (e, t, n) => r(() => x(e, t, n));
	async function x(t, n, r) {
		if (!e) throw Error("No SQL engine is connected, so files can't be read.");
		let i = `flow-upload-${Date.now()}.${G[r].extensions[0]}`, a = [];
		await e.registerFile(i, t);
		try {
			let o = await S(r, i, t, n, a), s = [], c = [];
			for (let [t, { label: n, select: r }] of o.entries()) {
				let o = Kt(Jt(n) || "table", c);
				c.push(o);
				let l = `${i}-${t}.parquet`;
				a.push(l);
				let u = await be(e, r, l, "FORMAT parquet");
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
	async function S(t, n, r, i, a) {
		let o = ye(n), s = (e) => [{
			label: i.replace(/\.[^.]*$/, ""),
			select: e
		}];
		switch (t) {
			case "csv": return s(`SELECT * FROM read_csv(${o})`);
			case "tsv": return s(`SELECT * FROM read_csv(${o}, delim = '\t')`);
			case "json": return s(`SELECT * FROM read_json_auto(${o})`);
			case "parquet": return s(`SELECT * FROM read_parquet(${o})`);
			case "geojson": return s(`SELECT unnest(f.properties), to_json(f.geometry)::VARCHAR AS geometry FROM (SELECT unnest(features) AS f FROM read_json_auto(${o}))`);
			case "xlsx": return await xe(e), (await Oe(r)).map((e) => ({
				label: e,
				select: `SELECT * FROM read_xlsx(${o}, sheet = ${ye(e)}, header = true)`
			}));
			case "sqlite": {
				if (!e.readSqlite) throw Error("This SQL engine can't read SQLite files.");
				let t = await e.readSqlite(r), i = [];
				for (let [e, r] of t.entries()) i.push({
					label: r.name,
					select: await C(r, `${n}-rows-${e}.json`, a)
				});
				return i;
			}
			default: throw Error(`Can't read ${G[t]?.label ?? t} files.`);
		}
	}
	async function C({ columns: t, rows: n }, r, i) {
		if (!n.length) return `SELECT ${t.map((e) => `NULL::VARCHAR AS ${K(e)}`).join(", ") || "NULL AS empty"} WHERE false`;
		let a = n.map((e) => Object.fromEntries(t.map((t, n) => [t, e[n]])));
		return await e.registerFile(r, new TextEncoder().encode(JSON.stringify(a))), i.push(r), `SELECT * FROM read_json_auto(${ye(r)}, format = 'array')`;
	}
	return {
		run: i,
		readFile: b,
		serverTables: f,
		describeInputs: o
	};
}
function ze(e) {
	if (e instanceof Uint8Array) return `(${e.length} bytes)`;
	let t = typeof e == "bigint" ? String(e) : typeof e == "object" && e ? JSON.stringify(e, (e, t) => typeof t == "bigint" ? String(t) : t) : e;
	return typeof t == "string" && t.length > 200 ? `${t.slice(0, 200)}…` : t;
}
function Be(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e.edges) n.has(t.target) || n.set(t.target, []), n.get(t.target).push({
		source: t.source,
		sourceHandle: t.sourceHandle,
		targetHandle: t.targetHandle
	});
	let r = [], i = /* @__PURE__ */ new Set(), a = (e) => {
		if (!i.has(e)) {
			i.add(e);
			for (let { source: t } of n.get(e) ?? []) a(t);
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
var q = Symbol("flow-graph"), Ve = 190, He = 90, Ue = {
	x: 0,
	y: .5
}, We = {
	x: 1,
	y: .5
}, Ge = (e) => e?.message ?? String(e), Ke = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, qe = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`;
function Je(e) {
	let t = e.output ? [{
		type: "output",
		text: e.output
	}] : [];
	if (e.error) t.push({
		type: "error",
		text: e.error
	});
	else if (e.export) {
		let { filename: n, contentType: r, size: i } = e.export;
		t.push({
			type: "info",
			text: `Wrote “${n}” (${r}, ${me(i)}).`
		});
	} else if (e.tables) {
		let n = e.tables.map((e) => `${e.label} (${qe(e.data.rowCount)})`).join(", ");
		t.push({
			type: "info",
			text: `Read ${e.tables.length} ${e.tables.length === 1 ? "table" : "tables"}: ${n}.`
		});
	} else e.data ? t.push({
		type: "info",
		text: `Returned ${qe(e.data.rowCount)}.`
	}) : e.value && e.value.kind !== "none" ? t.push({
		type: "info",
		text: `Returned a ${e.value.type} (see the Data panel).`
	}) : e.output || t.push({
		type: "note",
		text: "(no output)"
	});
	if (!e.error && e.slots?.length) {
		let n = (e) => e.data ? qe(e.data.rowCount) : `${e.tables.length} tables`;
		t.push({
			type: "info",
			text: `Also: ${e.slots.map((e) => `${e.ref} (${n(e)})`).join(", ")}.`
		});
	}
	return t;
}
function Ye({ sql: e = null, files: t = null, server: r = null } = {}) {
	let i = H(), a = Re(e), o = u(() => ({
		state: r?.status?.state ?? "unavailable",
		address: r?.status?.address ?? null,
		assistant: typeof r?.assist == "function" && r?.status?.assistant || null
	})), s = [], c = {
		x: 0,
		y: 0
	}, l = E({
		started: !1,
		executing: !1,
		status: {},
		results: {}
	}), d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new WeakMap(), m = E({
		nodes: {},
		app: []
	}), h = E(/* @__PURE__ */ new Set()), g = 0, _ = u(() => i.getSelectedNodes.value[0] ?? null), v = () => [...i.nodes.value, ...s.flatMap((e) => e.nodes)].map((e) => e.id);
	function y(e, t) {
		return {
			id: Gt(e, v()),
			type: "pipeline",
			position: t,
			data: { kind: e }
		};
	}
	function b({ source: e, sourceHandle: t, target: n, targetHandle: r }) {
		return {
			id: `${e}.${t}-${n}.${r}`,
			type: "wire",
			source: e,
			sourceHandle: t,
			target: n,
			targetHandle: r
		};
	}
	let x = u(() => ge(i.nodes.value, i.edges.value, i.viewport.value));
	function S(e) {
		let { nodes: t, edges: n, viewport: r } = ve(e) ?? ve(he);
		s.length = 0, d.clear(), Object.assign(l, {
			started: !1,
			executing: !1,
			status: {},
			results: {}
		}), m.nodes = {}, i.setNodes(t), i.setEdges(n.map(b));
		for (let e of t) e.data.kind === "sql-query" && e.data.sqlQuery && !e.data.sqlServerTables && M(e.id);
		if (r) i.setViewport(r);
		else if (t.length) {
			let { off: e } = i.onNodesInitialized(() => {
				i.fitView({ maxZoom: 1 }), e();
			});
		}
	}
	function C(e) {
		c = {
			x: e.clientX,
			y: e.clientY
		};
	}
	function w(e, t = c, n = {
		x: 0,
		y: 0
	}) {
		let r = i.screenToFlowCoordinate(t), a = y(e, {
			x: r.x - n.x * Ve,
			y: r.y - n.y * He
		});
		return i.addNodes(a), a;
	}
	function T(e, t, n) {
		let r = n.handleType === "source", i = w(e, t, r ? Ue : We), [a, o] = r ? [n, {
			nodeId: i.id,
			handleId: "target-0"
		}] : [{
			nodeId: i.id,
			handleId: "source-0"
		}, n];
		D({
			source: a.nodeId,
			sourceHandle: a.handleId,
			target: o.nodeId,
			targetHandle: o.handleId
		});
	}
	function D(e) {
		i.addEdges(b(e)), j(e.target);
	}
	function O(e) {
		let t = /* @__PURE__ */ new Set(), n = [e];
		for (; n.length;) {
			let e = n.pop();
			for (let r of i.edges.value) r.source === e && !t.has(r.target) && (t.add(r.target), n.push(r.target));
		}
		return [...t];
	}
	let k = (e, t) => e === t || O(e).includes(t);
	function A({ source: e, target: t, targetHandle: n }) {
		if (k(t, e)) return !1;
		let r = nn(i.findNode(t)?.data ?? {}).find((e) => e.handle === (n ?? "target-0"));
		return r ? r.many || !i.edges.value.some((e) => e.target === t && e.targetHandle === r.handle) : !1;
	}
	function j(e, { self: t = !0 } = {}) {
		for (let n of [...t ? [e] : [], ...O(e)]) d.set(n, (d.get(n) ?? 0) + 1), (l.status[n] === "completed" || l.status[n] === "failed") && (l.status[n] = "stale"), i.findNode(n)?.data.kind === "sql-query" && M(n);
	}
	async function M(t) {
		let n = i.findNode(t);
		if (!n || !e) return;
		let r = i.edges.value.filter((e) => e.target === t).flatMap((e) => {
			let t = i.findNode(e.source);
			return t ? tn(e.sourceHandle, t.id, t.data).map((e) => e.ref) : [];
		}), o = await a.serverTables(n.data.sqlQuery ?? "", [...new Set(r)]);
		if (i.findNode(t) !== n) return;
		let s = n.data.sqlServerTables;
		(!s || o.join("\n") !== s.join("\n")) && i.updateNodeData(t, { sqlServerTables: o });
	}
	function N(e) {
		delete l.status[e], delete l.results[e], d.set(e, (d.get(e) ?? 0) + 1), j(e, { self: !1 });
	}
	function ee(e, t) {
		if (t === e) return;
		let n = (n) => {
			let r = (n) => n === e ? t : n;
			return b({
				...n,
				source: r(n.source),
				target: r(n.target)
			});
		};
		i.findNode(e).id = t, i.setEdges(i.edges.value.map(n));
		for (let e of s) e.edges = e.edges.map(n);
		for (let n of [
			l.status,
			l.results,
			m.nodes
		]) e in n && (n[t] = n[e], delete n[e]);
		d.has(e) && d.set(t, d.get(e)), j(t, { self: !1 });
	}
	function te(e, t) {
		return t = t.trim(), t ? t === e ? null : v().includes(t) ? "Another node already uses this ID." : (ee(e, t), null) : "ID cannot be empty.";
	}
	function F(e, t) {
		t = t.trim();
		let n = i.findNode(e);
		if (t === (n.data.label ?? "")) return;
		i.updateNodeData(e, { label: t || void 0 });
		let r = Jt(t);
		r && qt(n.data.kind, e) && ee(e, Kt(r, v().filter((t) => t !== e)));
	}
	function I(e, t) {
		let n = i.findNode(e), r = Jt(t), a = r && r !== "data" ? r : void 0;
		return a === n.data.outputSuffix ? null : a && $t(e, n.data).some((e) => e.name === a) ? `This node already has an output called ${a} (${e}_${a}). Choose another name.` : (i.updateNodeData(e, { outputSuffix: a }), j(e, { self: !1 }), null);
	}
	function L(e, t) {
		let n = i.findNode(e).data, r = Object.keys(t).filter((e) => JSON.stringify(t[e]) !== JSON.stringify(n[e]));
		r.length && (i.updateNodeData(e, t), r.some((e) => !Rt(n.kind, e)) && j(e));
	}
	async function ne(e) {
		if (!f.has(e)) {
			let n = await t?.getFile?.(e);
			n && f.set(e, n);
		}
		return f.get(e) ?? null;
	}
	async function R(e, n) {
		f.set(e, n), await t?.putFile?.(e, n);
	}
	function z(e) {
		f.delete(e), t?.deleteFile?.(e);
	}
	async function re(e, t) {
		let n = i.findNode(e);
		h.add(e);
		try {
			let r = {
				name: t.name,
				size: t.size,
				bytes: new Uint8Array(await t.arrayBuffer())
			};
			return p.set(n, r), de(t.name) && L(e, { ingestFormat: void 0 }), await ie(n, r, n.data.ingestFormat);
		} finally {
			h.delete(e);
		}
	}
	async function B(e, t, n) {
		let r = i.findNode(e);
		h.add(e);
		try {
			let e = new Uint8Array(await n.arrayBuffer());
			if (i.findNode(r.id) !== r) return null;
			let a = Ke();
			await R(a, e);
			let o = r.data[t]?.key;
			return L(r.id, { [t]: {
				fileName: n.name,
				fileSize: n.size,
				key: a
			} }), o && z(o), null;
		} catch (e) {
			return `Couldn't keep "${n.name}". ${Ge(e)}`;
		} finally {
			h.delete(e);
		}
	}
	async function ie(e, { name: t, size: n, bytes: r }, o) {
		let s = o || de(t);
		if (!s || !G[s].read) return `Can't tell what kind of file "${t}" is. Pick its type under File Type.`;
		let c;
		try {
			c = await a.readFile(r, t, s);
		} catch (e) {
			return `Couldn't read "${t}" as ${G[s].label}. ${Ge(e)}`;
		}
		if (i.findNode(e.id) !== e) return null;
		let l = [];
		for (let e of c) {
			let t = Ke();
			await R(t, e.bytes), l.push({
				name: e.name,
				label: e.label,
				rowCount: e.rowCount,
				key: t
			});
		}
		let u = e.data.ingest?.tables ?? [];
		return L(e.id, { ingest: {
			fileName: t,
			fileSize: n,
			format: s,
			tables: l
		} }), u.forEach((e) => z(e.key)), null;
	}
	async function V(e, t) {
		let n = i.findNode(e);
		L(e, { ingestFormat: t || void 0 });
		let r = p.get(n);
		if (r) {
			h.add(e);
			try {
				return await ie(n, r, t);
			} finally {
				h.delete(e);
			}
		}
		let a = n.data.ingest;
		return !a || (t || de(a.fileName)) === a.format ? null : `Choose "${a.fileName}" again to read it as ${G[t]?.label ?? "that type"}.`;
	}
	function ae(e, { type: t, text: n }) {
		let r = e.findIndex((e) => e.type === t && e.text === n);
		if (r < 0) e.push({
			id: ++g,
			type: t,
			text: n,
			count: 1
		});
		else {
			let [t] = e.splice(r, 1);
			e.push({
				...t,
				count: t.count + 1
			});
		}
	}
	function U(e, t, n) {
		m.nodes[e]?.state !== t && (m.nodes[e] = {
			state: t,
			entries: []
		});
		for (let t of n) ae(m.nodes[e].entries, t);
	}
	let W = (e, t = "info") => ae(m.app, {
		type: t,
		text: e
	});
	P(() => o.value.state, (e, t) => {
		if (e === "connected") {
			let { address: e } = o.value;
			W(`Connected to the server${e ? ` at ${e}` : ""}.`);
		} else e === "unavailable" && W(t === "connected" ? "Lost the server: nodes that run there can't run until it's back." : r ? "The server isn't available: nodes that run there can't run until it is." : "There's no server: everything runs in this browser, and nodes that need a server can't run.", t === "connected" ? "error" : "note");
	}, { immediate: !0 });
	function oe({ filename: e, contentType: t, bytes: n }) {
		let r = URL.createObjectURL(new Blob([n], { type: t }));
		Object.assign(document.createElement("a"), {
			href: r,
			download: e
		}).click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
	}
	let se = () => ({
		state: o.value.state,
		query: r?.query,
		runPython: r?.runPython
	});
	async function ce(e, t = null, { log: n = !0 } = {}) {
		if (!e.length) return {};
		l.started = !0;
		for (let t of e) l.status[t] = "running";
		let r = new Map(d), o;
		try {
			o = await a.run(x.value, e, {
				paged: t,
				getFile: ne,
				server: se()
			});
		} catch (t) {
			o = Object.fromEntries(e.map((e) => [e, { error: Ge(t) }]));
		}
		for (let [t, a] of Object.entries(o)) {
			if (!i.findNode(t)) continue;
			if (a.export) {
				let { bytes: n, ...r } = a.export, i = e.includes(t);
				i && oe(a.export), a = { export: {
					...r,
					downloaded: i
				} };
			}
			l.results[t] = a;
			let o = (d.get(t) ?? 0) !== (r.get(t) ?? 0);
			l.status[t] = o ? "stale" : a.error ? "failed" : "completed", n && U(t, r.get(t) ?? 0, Je(a));
		}
		return o;
	}
	let le = (e, t = 0, n = null, r = null) => ce([e], {
		id: e,
		page: t,
		table: n,
		slot: r
	}), ue = (e, t, n = null, r = null) => ce([e], {
		id: e,
		page: t,
		table: n,
		slot: r
	}, { log: !1 });
	async function fe() {
		l.executing = !0;
		try {
			let e = i.nodes.value.filter((e) => e.data.autoRun !== !1).map((e) => e.id);
			if (!e.length) {
				W("Nothing to execute: every node has Auto Run off.", "note");
				return;
			}
			let t = Object.keys(await ce(e)).filter((e) => l.status[e]), n = (e) => t.filter((t) => l.status[t] === e).length, r = [`${n("completed")} completed`, `${n("failed")} failed`];
			n("stale") && r.push(`${n("stale")} changed while running`), W(`Executed the graph: ${t.length} ${t.length === 1 ? "node" : "nodes"} ran, ${r.join(", ")}.`, n("failed") ? "error" : "info");
		} finally {
			l.executing = !1;
		}
	}
	async function pe(e, t, n, s = () => {}) {
		let c = i.findNode(e), l = o.value.assistant;
		if (!c) return { error: "That node is gone." };
		if (o.value.state !== "connected" || !l) return { error: "The assistant works through the server, which isn't available." };
		try {
			s("reading");
			let i = await a.describeInputs(x.value, e, {
				getFile: ne,
				server: se(),
				sampleRows: l.sampleRows ?? 0
			});
			return s("writing"), await r.assist({
				kind: c.data.kind,
				request: t,
				code: n,
				inputs: i
			});
		} catch (e) {
			return { error: Ge(e) };
		}
	}
	function me({ nodeIds: e = [], edgeIds: t = [] }) {
		let n = i.nodes.value.filter((t) => e.includes(t.id)), r = i.edges.value.filter((n) => t.includes(n.id) || e.includes(n.source) || e.includes(n.target));
		if (n.length || r.length) {
			s.push({
				nodes: n.map(({ id: e, type: t, position: n, data: r }) => ({
					id: e,
					type: t,
					position: { ...n },
					data: r
				})),
				edges: r.map(b)
			}), i.removeEdges(r.map((e) => e.id)), i.removeNodes(n.map((e) => e.id));
			for (let t of r) e.includes(t.target) || j(t.target);
		}
	}
	function _e() {
		let e = s.pop();
		if (e) {
			i.addNodes(e.nodes), i.addEdges(e.edges);
			for (let t of e.edges) j(t.target);
		}
	}
	function K(e) {
		if (n(e)) return;
		let t = e.ctrlKey || e.metaKey;
		(e.key === "Delete" || e.key === "Backspace") && !t && !e.altKey ? (e.preventDefault(), me({
			nodeIds: i.getSelectedNodes.value.map((e) => e.id),
			edgeIds: i.getSelectedEdges.value.map((e) => e.id)
		})) : t && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z" && (e.preventDefault(), _e());
	}
	return {
		flow: i,
		selectedNode: _,
		snapshot: x,
		run: l,
		logs: m,
		log: W,
		reading: h,
		server: o,
		load: S,
		setContextPoint: C,
		addNode: w,
		addConnectedNode: T,
		connect: D,
		isValidConnection: A,
		renameNode: te,
		setLabel: F,
		setOutputName: I,
		updateData: L,
		chooseFile: re,
		setIngestFormat: V,
		storeFieldFile: B,
		runNode: le,
		turnPage: ue,
		executeGraph: fe,
		resetNode: N,
		askAssistant: pe,
		remove: me,
		undoDelete: _e,
		onKeydown: K
	};
}
//#endregion
//#region components/DataIngestFields.vue
var Xe = { class: "flow-field" }, Ze = [
	"id",
	"accept",
	"disabled",
	"aria-describedby"
], Qe = ["id"], $e = {
	key: 0,
	class: "flow-field-error"
}, et = {
	key: 1,
	class: "flow-field-hint"
}, tt = {
	key: 2,
	class: "flow-field-hint"
}, nt = { class: "flow-field" }, rt = ["for"], it = [
	"id",
	"value",
	"disabled"
], at = { value: "" }, ot = ["value"], st = {
	__name: "DataIngestFields",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = _(q), r = D("");
		P(() => t.node, () => r.value = "");
		let i = u(() => t.node.data.ingest), a = u(() => n.reading.has(t.node.id)), o = u(() => i.value && de(i.value.fileName)), s = u(() => {
			let { fileName: e, fileSize: t, format: n, tables: r } = i.value, a = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`, o = G[n].multi ? `${r.length} ${n === "xlsx" ? "sheets" : "tables"}, ${a(r.reduce((e, t) => e + t.rowCount, 0))}` : a(r[0]?.rowCount ?? 0);
			return `${e} · ${me(t)} · ${G[n].label}, ${o}`;
		}), c = u(() => i.value && !t.node.data.label && pe(i.value.fileName));
		async function d(e) {
			let n = t.node;
			r.value = "";
			let i = await e();
			t.node === n && (r.value = i ?? "");
		}
		function g(e) {
			let r = e.target.files[0];
			e.target.value = "", r && d(() => n.chooseFile(t.node.id, r));
		}
		let v = (e) => d(() => n.setIngestFormat(t.node.id, e.target.value)), y = N(), x = {
			file: `${y}-file`,
			fileNote: `${y}-file-note`,
			format: `${y}-format`
		};
		return (t, u) => (w(), p(l, null, [m("div", Xe, [
			u[1] ||= m("span", { class: "flow-field-label" }, "File", -1),
			m("label", { class: b(["flow-file", { "is-busy": a.value }]) }, [m("input", {
				id: x.file,
				type: "file",
				class: "flow-file-input",
				accept: M(le),
				disabled: a.value,
				"aria-describedby": x.fileNote,
				onChange: g
			}, null, 40, Ze), h(" " + j(a.value ? "Reading…" : i.value ? "Choose another file…" : "Choose file…"), 1)], 2),
			m("div", { id: x.fileNote }, [r.value ? (w(), p("p", $e, j(r.value), 1)) : f("", !0), i.value ? (w(), p("p", et, j(s.value), 1)) : (w(), p("p", tt, " CSV, TSV, JSON, GeoJSON, Parquet, Excel (.xlsx) or SQLite. Its data is read and kept; the file itself isn't. "))], 8, Qe),
			c.value ? (w(), p("button", {
				key: 0,
				type: "button",
				class: "flow-suggestion",
				onClick: u[0] ||= (t) => M(n).setLabel(e.node.id, c.value)
			}, " Rename to “" + j(c.value) + "” to match " + j(i.value.fileName) + "? ", 1)) : f("", !0)
		]), m("div", nt, [m("label", {
			class: "flow-field-label",
			for: x.format
		}, "File Type", 8, rt), m("select", {
			id: x.format,
			class: "flow-field-input flow-field-select",
			value: e.node.data.ingestFormat ?? "",
			disabled: a.value,
			onChange: v
		}, [m("option", at, " From file name" + j(o.value ? ` (${M(G)[o.value].label})` : ""), 1), (w(!0), p(l, null, O(M(se), (e) => (w(), p("option", {
			key: e,
			value: e
		}, j(M(G)[e].label), 9, ot))), 128))], 40, it)])], 64));
	}
}, ct = Symbol("flow-open-menu"), lt = [
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
], ut = [{
	label: "Delete wire",
	command: "wire.delete",
	shortcut: "Del"
}], dt = (e) => () => wt.map((t) => ({
	type: "submenu",
	label: t.label,
	badge: { class: `flow-node--${t.id}` },
	items: Ut(t.id).map((t) => ({
		label: Y[t].label,
		command: e,
		args: { kind: t }
	}))
})).filter((e) => e.items.length), ft = dt("node.addConnected");
function pt(e, n) {
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
			items: dt("node.add")
		}, t(e)]
	};
}
//#endregion
//#region components/fieldFocus.js
function J(e) {
	let t = e.target.parentElement.closest("[tabindex]");
	t ? t.focus() : e.target.blur();
}
//#endregion
//#region components/ExportInputField.vue
var mt = {
	key: 0,
	class: "flow-field"
}, ht = ["for"], gt = [
	"id",
	"placeholder",
	"aria-describedby",
	"onKeydown"
], _t = ["id"], vt = {
	__name: "ExportInputField",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = _(q), r = D(""), i = null;
		P(() => [t.node, t.node.data.exportInput], () => {
			i = t.node, r.value = t.node.data.exportInput ?? "";
		}, { immediate: !0 });
		function a() {
			n.flow.findNode(i.id) === i && n.updateData(i.id, { exportInput: r.value.trim() || void 0 });
		}
		let o = u(() => [...new Set(n.flow.edges.value.filter((e) => e.target === t.node.id).map((e) => e.source))].map((e) => n.flow.findNode(e)).filter(Boolean).flatMap((e) => {
			let t = Yt(e.id, e.data), n = Q(e.data.kind).category, r = e.data.ingest && G[e.data.ingest.format].multi ? e.data.ingest.tables : [];
			return [{
				name: t,
				category: n
			}, ...r.map((e) => ({
				name: `${t}.${e.name}`,
				category: n,
				table: !0
			}))];
		})), s = u(() => o.value.filter((e) => !e.table).length > 1 || !!t.node.data.exportInput), c = _(ct), l = D(null);
		function d() {
			let e = l.value.getBoundingClientRect();
			c({
				x: e.left,
				y: e.bottom + 4
			}, { items: o.value.map(({ name: e, category: t }) => ({
				label: e,
				badge: { class: `flow-node--${t}` },
				action: () => {
					r.value = e, a();
				}
			})) });
		}
		let g = N(), v = {
			input: `${g}-input`,
			note: `${g}-input-note`
		};
		return (e, t) => s.value ? (w(), p("div", mt, [
			m("label", {
				class: "flow-field-label",
				for: v.input
			}, "Input", 8, ht),
			m("div", {
				ref_key: "combo",
				ref: l,
				class: "flow-field-combo"
			}, [I(m("input", {
				id: v.input,
				"onUpdate:modelValue": t[0] ||= (e) => r.value = e,
				class: "flow-field-input flow-field-input--mono",
				placeholder: o.value[0]?.name ?? "",
				autocomplete: "off",
				spellcheck: "false",
				"aria-describedby": v.note,
				onBlur: a,
				onKeydown: [t[1] ||= L((...e) => M(J) && M(J)(...e), ["enter"]), L(ne(d, ["alt", "prevent"]), ["down"])]
			}, null, 40, gt), [[te, r.value]]), m("button", {
				type: "button",
				class: "flow-field-combo-button",
				"aria-label": "Choose from the nodes wired in",
				"aria-haspopup": "menu",
				onClick: d
			}, [...t[2] ||= [m("svg", {
				viewBox: "0 0 12 12",
				"aria-hidden": "true"
			}, [m("path", { d: "M3 4.5 6 7.5 9 4.5" })], -1)]])], 512),
			m("p", {
				id: v.note,
				class: "flow-field-hint"
			}, [
				t[3] ||= h(" Several nodes are wired in: name the one to write, by its output (like ", -1),
				m("code", null, j(o.value[0]?.name), 1),
				t[4] ||= h("), or choose it from the list. Left empty, it only runs with one wired in. ", -1)
			], 8, _t)
		])) : f("", !0);
	}
}, yt = 30;
function bt() {
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
function xt(e) {
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
var St = `<script>(${xt})(${JSON.stringify(`(${bt})()`)})<\/script>`;
function Ct(e, t, { timeoutSeconds: n = yt } = {}) {
	return new Promise((r, i) => {
		let a = document.createElement("iframe");
		a.sandbox = "allow-scripts", a.hidden = !0, a.srcdoc = St;
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
//#region lib/kindRegistry.js
var wt = A([
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
]), Y = A({}), Tt = /* @__PURE__ */ new Set(["boundary", "unknown"]), Et = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)?$/, Dt = /^[a-z][a-z0-9-]*$/, Ot = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i, kt = null;
function At({ id: e, label: t, colors: n }) {
	if (!Dt.test(e ?? "")) throw Error(`A category's id is lowercase letters, digits and hyphens: "${e}" isn't.`);
	if (!t) throw Error(`Category ${e} needs a label.`);
	if (Tt.has(e) || wt.some((t) => t.id === e)) throw Error(`There's already a category called ${e}.`);
	let { from: r, to: i, label: a = "#fff" } = n ?? {};
	if (![
		r,
		i,
		a
	].every((e) => Ot.test(e ?? ""))) throw Error(`Category ${e} needs colors: { from, to } (and optionally label), each a #hex colour.`);
	typeof document < "u" && (kt ??= document.head.appendChild(document.createElement("style")), kt.textContent += `.flow-node--${e} { --node-color-from: ${r}; --node-color-to: ${i}; --node-label-color: ${a}; }\n`), wt.push({
		id: e,
		label: t
	});
}
var jt = [
	"text",
	"number",
	"select",
	"checkbox",
	"code",
	"file",
	"readonly",
	"custom"
], Mt = [
	"required",
	"min",
	"max",
	"pattern",
	"when"
], Nt = /^[a-z_][a-z0-9_]*$/;
function Pt(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let { name: i } of n) {
		if (!Nt.test(i ?? "")) throw Error(`Node kind ${e} has a ${t} named "${i}": use lowercase letters, digits and _.`);
		if (t === "slot" && i === "data") throw Error(`Node kind ${e} has a slot named data: that's the first slot's name.`);
		if (r.has(i)) throw Error(`Node kind ${e} has two ${t}s named ${i}.`);
		r.add(i);
	}
}
function Ft(e, t) {
	if (!Array.isArray(t)) throw Error(`Node kind ${e}'s fields must be a list.`);
	let n = /* @__PURE__ */ new Set();
	for (let r of t) {
		let t = `Node kind ${e}'s field ${r?.key ?? "(no key)"}`;
		if (!jt.includes(r?.type)) throw Error(`${t} has type "${r?.type}": use one of ${jt.join(", ")}.`);
		if (r.type === "custom") {
			if (!r.component) throw Error(`${t} is custom, so it needs a component.`);
			continue;
		}
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(r.key ?? "")) throw Error(`${t} needs a key that's an identifier.`);
		if (n.has(r.key)) throw Error(`${t} is there twice.`);
		n.add(r.key);
		for (let e of r.validate ?? []) {
			if (!e?.message) throw Error(`${t} has a rule with no message.`);
			if (Mt.filter((t) => e[t] !== void 0).length !== 1) throw Error(`${t} has a rule that needs exactly one of ${Mt.join(", ")}.`);
			if (e.severity && !["error", "warn"].includes(e.severity)) throw Error(`${t} has a rule whose severity is "${e.severity}": use 'error' or 'warn'.`);
		}
	}
}
function X(e) {
	let { kind: t, label: n, category: r } = e;
	if (!Et.test(t ?? "")) throw Error(`A node kind's name is lowercase letters, digits and hyphens, with one dot at most: "${t}" isn't.`);
	if (Z(t)) throw Error(`There's already a node kind called ${t}.`);
	if (!n) throw Error(`Node kind ${t} needs a label.`);
	if (!wt.some((e) => e.id === r)) throw Error(`Node kind ${t} is in category "${r}", which isn't defined.`);
	if (e.run !== void 0 && typeof e.run != "function") throw Error(`Node kind ${t}'s run must be a function.`);
	if (e.fields !== void 0 && Ft(t, e.fields), Array.isArray(e.slots)) Pt(t, "slot", e.slots);
	else if (e.slots !== void 0 && typeof e.slots != "function") throw Error(`Node kind ${t}'s slots must be a list, or a function of the node's data.`);
	if (Array.isArray(e.inputPins)) Pt(t, "input pin", e.inputPins);
	else if (e.inputPins !== void 0 && typeof e.inputPins != "function") throw Error(`Node kind ${t}'s inputPins must be a list, or a function of the node's data.`);
	let i = e.idPrefix ?? Jt(n).replaceAll("_", "");
	if (!/^[a-z][a-z0-9]*$/.test(i)) throw Error(`Node kind ${t} needs an idPrefix of lowercase letters and digits (its label doesn't make one).`);
	Y[t] = Object.freeze(v({
		runs: typeof e.run == "function",
		...e,
		fields: (e.fields ?? []).map((e) => Object.freeze(v({ ...e }))),
		idPrefix: i
	}));
}
function It(e) {
	let t = {};
	for (let n of Q(e.kind).fields ?? []) n.key && n.default !== void 0 && (t[n.key] = n.default);
	return {
		...t,
		...e
	};
}
var Lt = /* @__PURE__ */ new Set([
	"label",
	"autoRun",
	"sqlServerTables"
]), Rt = (e, t) => Lt.has(t) || Q(e).fields?.some((e) => e.key === t && e.affectsOutput === !1) || !1;
function zt(e, t, n) {
	return e.when ? !!e.when(t, n) : e.required ? t == null || t === "" : e.min === void 0 ? e.max === void 0 ? e.pattern !== void 0 && typeof t == "string" && t !== "" && !new RegExp(e.pattern).test(t) : typeof t == "number" && t > e.max : typeof t == "number" && t < e.min;
}
function Bt(e, t, n) {
	let r = [], i = {
		key: e.key,
		label: e.label ?? e.key
	};
	for (let a of e.validate ?? []) {
		let e;
		try {
			e = zt(a, t, n);
		} catch (e) {
			r.push({
				...i,
				severity: "error",
				message: `Its check failed: ${e?.message ?? e}`
			});
			continue;
		}
		e && r.push({
			...i,
			severity: a.severity ?? "error",
			message: a.message
		});
	}
	return r;
}
function Vt(e) {
	let t = It(e);
	return (Q(e.kind).fields ?? []).filter((e) => e.key && (!e.visible || e.visible(t))).flatMap((e) => Bt(e, t[e.key], t)).sort((e, t) => e.severity === t.severity ? 0 : e.severity === "error" ? -1 : 1);
}
var Ht = "application/x-flow-node-kind", Ut = (e) => Object.keys(Y).filter((t) => Y[t].category === e), Z = (e) => typeof e == "string" && Object.hasOwn(Y, e), Q = (e) => Z(e) ? Y[e] : {
	label: String(e),
	category: "unknown",
	unknown: !0
};
function Wt(e, t) {
	let n = 1;
	for (; t.has(`${e}${n}`);) n++;
	return `${e}${n}`;
}
var Gt = (e, t) => Wt(Y[e].idPrefix, new Set(t));
function Kt(e, t) {
	let n = new Set(t);
	return n.has(e) ? Wt(e, n) : e;
}
var qt = (e, t) => Z(e) && RegExp(`^${Y[e].idPrefix}\\d+$`).test(t);
function Jt(e) {
	let t = e.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
	return /^\d/.test(t) ? `_${t}` : t;
}
var Yt = (e, t) => `${e}_${t.outputSuffix || "data"}`;
function Xt(e) {
	if (!Z(e.kind)) return null;
	let { where: t } = Y[e.kind];
	return (typeof t == "function" ? t(e) : t) ?? null;
}
var Zt = (e) => Xt(e) === "server", Qt = (e, t) => typeof e == "function" ? e(t) ?? [] : e ?? [];
function $t(e, t) {
	let n = {
		name: null,
		label: t.outputSuffix || "data",
		ref: Yt(e, t),
		pin: !1
	}, r = new Set(t.slotPins ?? []);
	return [n, ...(Z(t.kind) ? Qt(Y[t.kind].slots, It(t)) : []).filter((e) => e.name !== n.label).map((t) => ({
		name: t.name,
		label: t.label ?? t.name,
		ref: `${e}_${t.name}`,
		pin: !!t.pin || r.has(t.name)
	}))];
}
function en(e, t) {
	let n = $t(e, t);
	return [{
		handle: "source-0",
		slots: n
	}, ...n.filter((e) => e.pin).map((e) => ({
		handle: `source:${e.name}`,
		slots: [e]
	}))];
}
function tn(e, t, n) {
	let r = $t(t, n);
	if (!e?.startsWith("source:")) return r;
	let i = e.slice(7);
	return r.filter((e) => e.name === i);
}
function nn(e) {
	return [{
		handle: "target-0",
		name: null,
		label: null,
		many: !0
	}, ...(Z(e.kind) ? Qt(Y[e.kind].inputPins, It(e)) : []).map((e) => ({
		handle: `target:${e.name}`,
		name: e.name,
		label: e.label ?? e.name,
		many: !!e.many
	}))];
}
var rn = (e) => Array.from({ length: e }, (t, n) => `${(n + 1) / (e + 1) * 100}%`), an = (e) => e?.message ?? String(e), on = (e, t) => e.state === "connected" && typeof e[t] == "function";
X({
	kind: "sql-query",
	label: "SQLQuery",
	category: "fetch",
	idPrefix: "sqlnode",
	outputName: !0,
	where: (e) => e.sqlServerTables?.length ? "server" : null,
	fields: [{
		key: "sqlQuery",
		label: "SQL",
		type: "code",
		language: "sql",
		assistant: !0,
		placeholder: "SELECT * FROM upstream_node_data",
		hint: "DuckDB SQL. A node wired in is a table named by its output, like `sqlnode1_data`, and the query runs here. Read any other table and it runs on the server, over its database (`db`; plain names look in its `public` schema) and the nodes wired in. Ctrl+Enter runs."
	}],
	async run(e) {
		let t = (e.node.sqlQuery ?? "").trim().replace(/;+\s*$/, "");
		if (!t) return { error: "Write a query first." };
		let n = e.table(), r = await e.serverTables(t);
		if (!r.length) await e.sql.query(`CREATE TABLE ${n} AS ${t}`);
		else if (on(e.server, "query")) await e.loadParquet(n, await e.server.query({
			sql: t,
			inputs: await e.parquet()
		}));
		else return { error: `This query reads ${r.length === 1 ? `${r[0]}, which isn't` : `${r.join(", ")}, which aren't`} wired in, so it runs on the server, which isn't available.` };
		return { table: n };
	}
}), X({
	kind: "3d-asset",
	label: "3D Asset",
	category: "fetch",
	idPrefix: "asset"
}), X({
	kind: "http-request",
	label: "HTTP Request",
	category: "fetch",
	idPrefix: "httprequest"
}), X({
	kind: "python-script",
	label: "PythonScript",
	category: "modify",
	idPrefix: "pythonscript",
	outputName: !0,
	where: "server",
	fields: [{
		key: "pythonCode",
		label: "Python",
		type: "code",
		language: "python",
		assistant: !0,
		placeholder: "upstream_node_data.groupby('region').sum()",
		hint: "Each node wired in is a pandas DataFrame named by its output, like `sqlnode1_data` (several tables: `dataingest1_data.sheet1`). The last line's value is this node's output: a DataFrame as its table, anything else shown as a value. `print` shows in the Terminal; `sleep(seconds)` waits. Ctrl+Enter runs."
	}],
	async run(e) {
		if (!on(e.server, "runPython")) return { error: "PythonScript nodes run on the server, which isn't available. Every other kind runs here in the browser." };
		let t = e.node.pythonCode ?? "";
		if (!t.trim()) return { error: "Write some code first." };
		let n = await e.server.runPython({
			code: t,
			inputs: await e.parquet()
		}), r = n.output ?? "";
		if (n.error) return {
			error: n.error,
			output: r
		};
		let i = {
			output: r,
			variables: n.variables ?? []
		};
		if (!n.table) return {
			value: n.value ?? { kind: "none" },
			...i
		};
		let a = e.table();
		return await e.loadParquet(a, n.table), {
			table: a,
			...i
		};
	}
}), X({
	kind: "javascript",
	label: "JavaScript",
	category: "modify",
	idPrefix: "javascript",
	outputName: !0,
	where: "browser",
	fields: [{
		key: "jsCode",
		label: "JavaScript",
		type: "code",
		language: "javascript",
		assistant: !0,
		placeholder: "return upstream_node_data.filter((row) => row.amount > 10)",
		hint: "Each node wired in is a variable named by its output, like `sqlnode1_data`: an array of rows (objects), or an object of them for several tables (`dataingest1_data.sheet1`). Return an array of rows to output a table. `console.log` and `print` show in the Terminal; `await sleep(seconds)` waits. Runs in a sandbox in this browser, with no access to this page, and stops after 30 seconds. Ctrl+Enter runs."
	}],
	async run(e) {
		let t = e.node.jsCode ?? "";
		if (!t.trim()) return { error: "Write some code first." };
		let n = {};
		for (let t of e.inputs) n[t.ref] = await e.rows(t);
		let r, i;
		try {
			({value: r, logs: i} = await Ct(t, n));
		} catch (e) {
			return {
				error: an(e),
				output: (e.logs ?? []).join("\n")
			};
		}
		let a = i.join("\n");
		if (r === void 0) return { output: a };
		if (!Array.isArray(r)) return {
			error: "Return an array of rows (objects, one per row) to output a table, or return nothing.",
			output: a
		};
		let o = e.table();
		return await e.loadRows(o, r.map((e) => typeof e == "object" && e && !Array.isArray(e) ? e : { value: e })), {
			table: o,
			output: a
		};
	}
}), X({
	kind: "geometry-script",
	label: "GeometryScript",
	category: "modify",
	idPrefix: "geoscript"
}), X({
	kind: "hlsl",
	label: "HLSL",
	category: "modify",
	idPrefix: "hlsl"
}), X({
	kind: "network-fuse",
	label: "Network Fuse",
	category: "modify",
	idPrefix: "networkfuse",
	runs: !0
}), X({
	kind: "debug",
	label: "Debug",
	category: "debug",
	idPrefix: "debug"
}), X({
	kind: "data-ingest",
	label: "DataIngest",
	category: "import",
	idPrefix: "dataingest",
	outputName: !0,
	fields: [{
		type: "custom",
		component: st
	}],
	canRun: (e) => e.ingest ? null : "Choose a file first.",
	async run(e) {
		let t = e.node.ingest;
		if (!t) return { error: "Choose a file first." };
		let n = [];
		for (let r of t.tables) {
			let i = await e.getFile(r.key);
			if (!i) return { error: `The data read from "${t.fileName}" isn't stored any more. Choose the file again.` };
			let a = e.table(r.name);
			await e.loadParquet(a, i), n.push({
				name: r.name,
				label: r.label,
				table: a
			});
		}
		return G[t.format].multi ? { tables: n } : { table: n[0].table };
	}
}), X({
	kind: "dxf-import",
	label: "DXF Import",
	category: "import",
	idPrefix: "dxfimport",
	runs: !0
}), X({
	kind: "data-export",
	label: "DataExport",
	category: "export",
	idPrefix: "dataexport",
	fields: [
		{
			type: "custom",
			component: vt
		},
		{
			key: "exportFilename",
			label: "Filename",
			type: "text",
			placeholder: "export",
			hint: (e, t) => {
				let n = t || "export";
				return `Saves as ${fe(n, e.exportFormat || de(n) || "csv")}`;
			}
		},
		{
			key: "exportFormat",
			label: "File Type",
			type: "select",
			options: [{
				value: "",
				label: "From file name (CSV if none)"
			}, ...ce.map((e) => ({
				value: e,
				label: G[e].label
			}))]
		}
	],
	runHint: "Writes whatever's wired into this node on Run. Downloads to your computer immediately; errors show in the Terminal panel.",
	async run(e) {
		let t = sn(e.node, e.inputs);
		if (t.error) return t;
		let { input: n, tables: r } = t, i = (e.node.exportFilename ?? "").trim() || "export", a = e.node.exportFormat || de(i) || "csv", o = fe(i, a), s = G[a], c = r ?? [{
			name: Jt(n.id) || "data",
			table: t.table
		}];
		if (c.length > 1 && s.multi !== "read-write") return { error: `${s.label} holds one table, and ${n.id} has ${c.length}. Put a SQLQuery node in between to pick one.` };
		let l = await cn(e.sql, a, c, o);
		return {
			...r ? { tables: r } : { table: t.table },
			export: {
				filename: o,
				contentType: s.contentType,
				size: l.length,
				bytes: l
			}
		};
	}
});
function sn(e, t) {
	if (!t.length) return { error: "Wire a node into this one to export its data." };
	let n = t.map((e) => e.ref), r = (e.exportInput ?? "").trim(), i = (e) => e.tables ? {
		input: e,
		tables: e.tables
	} : {
		input: e,
		table: e.table
	};
	if (!r) return t.length > 1 ? { error: `${t.length} inputs are wired in (${n.join(", ")}). Name the one to write under Input.` } : i(t[0]);
	let a = (e) => t.find((t) => t.ref === e || t.id === e), o = a(r), s = null;
	if (!o && r.includes(".") && (o = a(r.slice(0, r.lastIndexOf("."))), s = r.slice(r.lastIndexOf(".") + 1)), !o) return { error: `No input called "${r}" is wired in. Wired in: ${n.join(", ")}.` };
	if (!s) return i(o);
	let c = o.tables?.find((e) => e.name === s);
	if (!c) {
		let e = o.tables ? `its tables are ${o.tables.map((e) => e.name).join(", ")}` : "it has one table";
		return { error: `${o.id} has no table called "${s}": ${e}.` };
	}
	return {
		input: o,
		table: c.table
	};
}
async function cn(e, t, n, r) {
	let i = async (t) => e.query(`SELECT * FROM ${t}`);
	if (t === "geojson") return new TextEncoder().encode(JSON.stringify(ln(await i(n[0].table))));
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
	t === "xlsx" && await xe(e);
	let o = `flow-export-${Date.now()}-${r}`;
	await be(e, `SELECT * FROM ${n[0].table}`, o, a);
	try {
		let n = await e.readFile(o);
		return t === "xlsx" ? Ae(n) : n;
	} finally {
		await e.dropFile(o);
	}
}
function ln({ columns: e, rows: t }) {
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
X({
	kind: "subnet",
	label: "Subnet",
	category: "custom",
	idPrefix: "subnet",
	runs: !0
});
//#endregion
//#region components/FlowNode.vue
var un = {
	key: 0,
	class: "flow-node-kind"
}, dn = ["aria-label", "title"], fn = {
	key: 2,
	class: "flow-blink-dot flow-node-server-dot",
	role: "img",
	"aria-label": "Executes on server",
	title: "Executes on server"
}, pn = {
	key: 4,
	class: "flow-node-ref-hint"
}, mn = {
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
		}, r = t, i = _(q), a = u(() => Q(r.data.kind)), o = u(() => Zt(r.data)), s = u(() => i.server.value.state), c = u(() => Vt(r.data)), m = u(() => c.value.find((e) => e.severity === "error")), h = u(() => c.value.filter((e) => e.severity === "warn")), v = u(() => o.value && s.value === "unavailable" ? "Backend not available." : n[i.run.status[r.id]] ?? (a.value.unknown ? "Not available here." : m.value ? `${m.value.label}: ${m.value.message}` : "")), y = V(), S = u(() => new Set(y.value.map((e) => e.source === r.id ? e.sourceHandle : e.targetHandle))), C = (e) => u(() => {
			let t;
			if (a.value.unknown) {
				let n = y.value.filter((t) => (e === "source" ? t.source : t.target) === r.id).map((t) => e === "source" ? t.sourceHandle : t.targetHandle);
				t = [.../* @__PURE__ */ new Set([`${e}-0`, ...n])].sort((e, t) => e.localeCompare(t, void 0, { numeric: !0 })).map((e) => ({
					id: e,
					label: null,
					refs: []
				}));
			} else t = e === "target" ? nn(r.data).map((e) => ({
				id: e.handle,
				label: e.label,
				refs: []
			})) : en(r.id, r.data).map((e) => ({
				id: e.handle,
				label: e.handle === "source-0" ? null : e.slots[0].label,
				refs: e.slots.map((e) => e.ref)
			}));
			let n = rn(t.length);
			return t.map((e, t) => ({
				...e,
				top: n[t]
			}));
		}), T = C("target"), E = C("source"), k = D(!1), A = D(null);
		return (n, r) => I((w(), p("div", {
			class: b(["flow-node", [`flow-node--${a.value.category}`, { "is-hovered": k.value }]]),
			onPointerenter: r[1] ||= (e) => k.value = !0,
			onPointerleave: r[2] ||= (e) => k.value = !1
		}, [
			t.data.label ? (w(), p("span", un, j(a.value.label), 1)) : f("", !0),
			g(oe, {
				label: t.data.label || a.value.label,
				status: v.value,
				selected: t.selected
			}, null, 8, [
				"label",
				"status",
				"selected"
			]),
			h.value.length ? (w(), p("span", {
				key: 1,
				class: b(["flow-node-warning", { "is-beside-dot": o.value && s.value === "connected" }]),
				role: "img",
				"aria-label": h.value.map((e) => `${e.label}: ${e.message}`).join(" "),
				title: h.value.map((e) => `${e.label}: ${e.message}`).join("\n")
			}, "!", 10, dn)) : f("", !0),
			o.value && s.value === "connected" ? (w(), p("span", fn)) : f("", !0),
			(w(!0), p(l, null, O(M(T), (e) => (w(), d(M(z), {
				id: e.id,
				key: e.id,
				type: "target",
				position: M(re).Left,
				connectable: !a.value.unknown,
				class: b(["flow-handle flow-handle--in", { "is-connected": S.value.has(e.id) }]),
				style: x({ top: e.top }),
				title: e.label ?? void 0
			}, null, 8, [
				"id",
				"position",
				"connectable",
				"class",
				"style",
				"title"
			]))), 128)),
			(w(!0), p(l, null, O(M(E), (e) => (w(), d(M(z), {
				id: e.id,
				key: e.id,
				type: "source",
				position: M(re).Right,
				connectable: !a.value.unknown,
				class: b(["flow-handle flow-handle--out", { "is-connected": S.value.has(e.id) }]),
				style: x({ top: e.top }),
				onPointerenter: (t) => A.value = e,
				onPointerleave: r[0] ||= (e) => A.value = null
			}, null, 8, [
				"id",
				"position",
				"connectable",
				"class",
				"style",
				"onPointerenter"
			]))), 128)),
			k.value ? (w(), p(l, { key: 3 }, [(w(!0), p(l, null, O(M(T).filter((e) => e.label), (e) => (w(), p("span", {
				key: e.id,
				class: "flow-pin-label flow-pin-label--in",
				style: x({ top: e.top })
			}, j(e.label), 5))), 128)), (w(!0), p(l, null, O(M(E).filter((e) => e.label), (e) => (w(), p("span", {
				key: e.id,
				class: "flow-pin-label flow-pin-label--out",
				style: x({ top: e.top })
			}, j(e.label), 5))), 128))], 64)) : f("", !0),
			A.value?.refs.length ? (w(), p("span", pn, [(w(!0), p(l, null, O(A.value.refs, (e) => (w(), p("span", {
				key: e,
				class: "flow-node-ref-hint-line"
			}, j(e), 1))), 128))])) : f("", !0)
		], 34)), [[M(e), {
			items: M(lt),
			context: t.id
		}]]);
	}
}, hn = ["d"], gn = [
	"id",
	"x1",
	"y1",
	"x2",
	"y2"
], _n = ["d", "stroke"], vn = ["d", "stroke"], yn = ["d"], bn = ["d"], xn = {
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
		let n = t, r = _(q), i = u(() => ie(n)[0]), a = (e) => r.run.status[e] === "completed", o = u(() => a(n.source) ? a(n.target) ? "flowed" : "flowing" : r.run.started ? "dormant" : "pristine"), s = (e) => {
			let t = r.flow.findNode(e);
			return t ? `flow-node--${Q(t.data.kind).category}` : "";
		}, c = N().replace(/[^\w-]/g, ""), d = `flow-wire-flowed-${c}`, h = `flow-wire-flowing-${c}`;
		return (n, r) => I((w(), p("g", null, [
			o.value === "pristine" || o.value === "dormant" ? (w(), p("path", {
				key: 0,
				class: b(["flow-wire", o.value === "pristine" ? "flow-wire--idle" : "flow-wire--waiting"]),
				d: i.value
			}, null, 10, hn)) : (w(), p(l, { key: 1 }, [
				m("defs", null, [(w(!0), p(l, null, O([d, h], (e) => (w(), p("linearGradient", {
					id: e,
					key: e,
					gradientUnits: "userSpaceOnUse",
					x1: t.sourceX,
					y1: t.sourceY,
					x2: t.targetX,
					y2: t.targetY
				}, [m("stop", {
					offset: "0",
					class: b(["flow-wire-stop-source", s(t.source)])
				}, null, 2), m("stop", {
					offset: "1",
					class: b(e === d ? ["flow-wire-stop-target", s(t.target)] : "flow-wire-stop-dormant")
				}, null, 2)], 8, gn))), 128))]),
				m("path", {
					class: "flow-wire",
					d: i.value,
					stroke: `url(#${d})`
				}, null, 8, _n),
				m("path", {
					class: b(["flow-wire flow-wire--grow", { "is-complete": o.value === "flowed" }]),
					d: i.value,
					pathLength: "1",
					stroke: `url(#${h})`
				}, null, 10, vn)
			], 64)),
			t.selected ? (w(), p("path", {
				key: 2,
				class: "flow-wire-gaps",
				d: i.value
			}, null, 8, yn)) : f("", !0),
			m("path", {
				class: "flow-wire-hit",
				d: i.value
			}, null, 8, bn)
		])), [[M(e), {
			items: M(ut),
			context: t.id
		}]]);
	}
}, Sn = [
	"x1",
	"y1",
	"x2",
	"y2"
], Cn = ["d", "stroke"], wn = {
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
		let t = e, n = _(q), r = u(() => ie(t)[0]), i = u(() => {
			let e = {
				x: t.sourceX,
				y: t.sourceY
			}, n = {
				x: t.targetX,
				y: t.targetY
			};
			return t.fromInput ? [n, e] : [e, n];
		}), a = (e) => `flow-node--${Q(e.data.kind).category}`, o = u(() => {
			let [e, r] = t.fromInput ? [t.targetNode, t.sourceNode] : [t.sourceNode, t.targetNode];
			return !e || n.run.status[e.id] !== "completed" ? ["flow-connection-line-from", "flow-connection-line-to"] : [["flow-wire-stop-source", a(e)], r ? ["flow-wire-stop-target", a(r)] : "flow-wire-stop-dormant"];
		}), s = `flow-connection-line-${N().replace(/[^\w-]/g, "")}`;
		return (e, t) => (w(), p(l, null, [m("defs", null, [m("linearGradient", {
			id: s,
			gradientUnits: "userSpaceOnUse",
			x1: i.value[0].x,
			y1: i.value[0].y,
			x2: i.value[1].x,
			y2: i.value[1].y
		}, [m("stop", {
			offset: "0",
			class: b(o.value[0])
		}, null, 2), m("stop", {
			offset: "1",
			class: b(o.value[1])
		}, null, 2)], 8, Sn)]), m("path", {
			class: "flow-wire flow-connection-line",
			d: r.value,
			stroke: `url(#${s})`
		}, null, 8, Cn)], 64));
	}
}, Tn = {
	__name: "FlowCanvas",
	emits: ["connection-dropped"],
	setup(e, { emit: t }) {
		let n = t, r = _(q), { onConnect: i, onConnectStart: a, onConnectEnd: o } = r.flow, s = null, c = !1;
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
		let l = (e) => e.dataTransfer.types.includes(Ht);
		function u(e) {
			l(e) && (e.preventDefault(), e.dataTransfer.dropEffect = "copy");
		}
		function d(e) {
			if (!l(e)) return;
			e.preventDefault();
			let t;
			try {
				t = JSON.parse(e.dataTransfer.getData(Ht));
			} catch {
				return;
			}
			Z(t?.kind) && r.addNode(t.kind, {
				x: e.clientX,
				y: e.clientY
			}, t.grab ?? void 0);
		}
		return (e, t) => (w(), p("div", {
			class: "flow-canvas-layer",
			onContextmenu: t[0] ||= (...e) => M(r).setContextPoint && M(r).setContextPoint(...e),
			onDragover: u,
			onDrop: d
		}, [g(M(B), {
			"min-zoom": .25,
			"max-zoom": 2,
			"connection-mode": M(R).Strict,
			"is-valid-connection": M(r).isValidConnection,
			"delete-key-code": null,
			"nodes-focusable": !1,
			"edges-focusable": !1,
			"selection-key-code": null,
			"multi-selection-key-code": null
		}, {
			"node-pipeline": F(({ id: e, data: t, selected: n }) => [g(mn, {
				id: e,
				data: t,
				selected: n
			}, null, 8, [
				"id",
				"data",
				"selected"
			])]),
			"edge-wire": F((e) => [g(xn, {
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
			"connection-line": F((e) => [g(wn, {
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
			default: F(() => [g(M(ae), {
				class: "flow-canvas-dots",
				gap: 24,
				size: 1
			})]),
			_: 1
		}, 8, ["connection-mode", "is-valid-connection"])], 32));
	}
}, En = {
	key: 0,
	class: "flow-panel-empty"
}, Dn = ["title"], On = {
	key: 1,
	class: "flow-terminal-line flow-terminal-note"
}, kn = {
	__name: "TerminalPanel",
	setup(e) {
		let t = _(q), n = t.selectedNode, r = u(() => n.value ? t.logs.nodes[n.value.id]?.entries ?? [] : t.logs.app), i = u(() => n.value && t.run.status[n.value.id] === "stale"), a = {
			output: "flow-terminal-output",
			error: "flow-terminal-error",
			info: "flow-terminal-line",
			note: "flow-terminal-line flow-terminal-note"
		}, o = D(null), s = () => {
			let e = o.value;
			return !e || e.scrollHeight - e.scrollTop - e.clientHeight < 24;
		};
		return P(() => [
			n.value?.id,
			r.value.at(-1)?.id,
			r.value.at(-1)?.count,
			i.value
		], async ([e], [t] = []) => {
			(e !== t || s()) && (await y(), o.value && (o.value.scrollTop = o.value.scrollHeight));
		}, { flush: "pre" }), (e, t) => (w(), d(c, {
			class: "terminal-panel",
			name: "terminal",
			title: "Terminal",
			dock: "left",
			hotkey: "T",
			"default-size": 280,
			collapsed: ""
		}, {
			default: F(() => [m("div", {
				ref_key: "scroller",
				ref: o,
				class: "flow-terminal"
			}, [
				r.value.length ? f("", !0) : (w(), p("p", En, " Nothing to show yet — run a node to see its output or errors here. ")),
				(w(!0), p(l, null, O(r.value, (e) => (w(), d(k(e.type === "output" || e.type === "error" ? "pre" : "p"), {
					key: e.id,
					class: b(a[e.type])
				}, {
					default: F(() => [h(j(e.text), 1), e.count > 1 ? (w(), p("span", {
						key: 0,
						class: "flow-terminal-count",
						title: M(n) ? `${e.count} times since this node last changed` : `${e.count} times`
					}, " ×" + j(e.count), 9, Dn)) : f("", !0)]),
					_: 2
				}, 1032, ["class"]))), 128)),
				i.value && r.value.length ? (w(), p("p", On, " This node has changed since it ran (or something upstream has). Its next run starts a new log. ")) : f("", !0)
			], 512)]),
			_: 1
		}));
	}
}, An = { class: "flow-library" }, jn = { class: "flow-library-heading" }, Mn = { class: "flow-library-cards" }, Nn = ["title", "onDragstart"], Pn = {
	__name: "LibraryPanel",
	setup(e) {
		let t = u(() => wt.map((e) => ({
			...e,
			kinds: Ut(e.id)
		})).filter((e) => e.kinds.length));
		function n(e, t) {
			let n = t.currentTarget.getBoundingClientRect(), r = {
				x: (t.clientX - n.left) / n.width,
				y: (t.clientY - n.top) / n.height
			};
			t.dataTransfer.setData(Ht, JSON.stringify({
				kind: e,
				grab: r
			})), t.dataTransfer.effectAllowed = "copy";
		}
		return (e, r) => (w(), d(c, {
			class: "library-panel",
			name: "library",
			title: "Library",
			dock: "left",
			hotkey: "L",
			"default-size": 238,
			collapsed: ""
		}, {
			default: F(() => [m("div", An, [(w(!0), p(l, null, O(t.value, (e) => (w(), p("section", {
				key: e.id,
				class: "flow-library-section"
			}, [m("h3", jn, [m("span", {
				class: b(["flow-library-dot", `flow-node--${e.id}`]),
				"aria-hidden": "true"
			}, null, 2), h(" " + j(e.label), 1)]), m("div", Mn, [(w(!0), p(l, null, O(e.kinds, (t) => (w(), p("div", {
				key: t,
				class: b(["flow-library-card", `flow-node--${e.id}`]),
				draggable: "true",
				title: `Drag onto the canvas to add ${M(Y)[t].label}`,
				onDragstart: (e) => n(t, e)
			}, [g(oe, { label: M(Y)[t].label }, null, 8, ["label"])], 42, Nn))), 128))])]))), 128))])]),
			_: 1
		}));
	}
}, Fn = { class: "flow-props" }, In = { class: "flow-field" }, Ln = ["aria-disabled"], Rn = {
	__name: "FlowgraphsPanel",
	setup(e) {
		let t = _(q);
		return (e, n) => (w(), d(c, {
			class: "flowgraphs-panel",
			name: "flowgraphs",
			title: "Flowgraphs",
			dock: "left",
			hotkey: "G",
			"default-size": 278,
			"above-bottom": "",
			collapsed: ""
		}, {
			default: F(() => [m("div", Fn, [m("div", In, [m("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": M(t).run.executing,
				onClick: n[0] ||= (e) => M(t).run.executing || M(t).executeGraph()
			}, j(M(t).run.executing ? "Executing…" : "Execute Graph"), 9, Ln), n[1] ||= m("p", { class: "flow-field-hint" }, " Runs every node with Auto Run on, and the nodes they depend on. ", -1)])])]),
			_: 1
		}));
	}
}, zn = { class: "flow-data" }, Bn = { class: "flow-table-wrap" }, Vn = { class: "flow-table" }, Hn = { class: "flow-pager" }, Un = ["aria-disabled"], Wn = ["aria-disabled"], Gn = {
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
		return (t, n) => (w(), p("div", zn, [m("div", Bn, [m("table", Vn, [m("thead", null, [m("tr", null, [(w(!0), p(l, null, O(e.data.columns, (e, t) => (w(), p("th", { key: t }, j(e), 1))), 128))])]), m("tbody", null, [(w(!0), p(l, null, O(e.data.rows, (e, t) => (w(), p("tr", { key: t }, [(w(!0), p(l, null, O(e, (e, t) => (w(), p("td", { key: t }, j(o(e)), 1))), 128))]))), 128))])])]), m("div", Hn, [
			m("span", null, "Page " + j(e.data.page + 1), 1),
			m("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(-1),
				onClick: n[0] ||= (e) => a(-1)
			}, " Prev ", 8, Un),
			m("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(1),
				onClick: n[1] ||= (e) => a(1)
			}, " Next ", 8, Wn)
		])]));
	}
}, Kn = {
	key: 0,
	class: "flow-panel-empty"
}, qn = {
	key: 1,
	class: "flow-panel-empty"
}, Jn = {
	key: 2,
	class: "flow-panel-empty"
}, Yn = {
	key: 3,
	class: "flow-data-tabs"
}, Xn = {
	key: 0,
	class: "flow-tabs",
	role: "tablist",
	"aria-label": "Outputs"
}, Zn = ["aria-selected", "onClick"], Qn = {
	key: 1,
	class: "flow-value"
}, $n = { class: "flow-value-type" }, er = { class: "flow-value-text" }, tr = {
	key: 2,
	class: "flow-panel-empty"
}, nr = {
	key: 3,
	class: "flow-tabs",
	role: "tablist"
}, rr = [
	"aria-selected",
	"title",
	"onClick"
], ir = {
	key: 0,
	class: "flow-panel-empty"
}, ar = {
	__name: "DataPanel",
	setup(e) {
		let t = _(q), n = t.selectedNode, r = u(() => n.value && t.run.results[n.value.id]), i = u(() => n.value && t.run.status[n.value.id] === "running"), a = D(null), o = D(null);
		P(n, () => {
			a.value = null, o.value = null;
		}), P(a, () => o.value = null);
		let s = u(() => r.value?.slots?.length ? [{
			name: null,
			ref: Yt(n.value.id, n.value.data)
		}, ...r.value.slots] : []), h = u(() => a.value === null ? r.value : r.value?.slots?.find((e) => e.name === a.value) ?? r.value), g = u(() => {
			let e = h.value?.tables;
			return e && (e.find((e) => e.name === o.value) ?? e[0]);
		}), v = u(() => h.value?.data ?? g.value?.data), y = (e) => t.turnPage(n.value.id, v.value.page + e, g.value?.name ?? null, a.value);
		return (e, t) => (w(), d(c, {
			class: "data-panel",
			name: "data",
			title: "Data",
			dock: "bottom",
			hotkey: "D",
			"default-size": 240,
			collapsed: ""
		}, {
			default: F(() => [!r.value || r.value.error ? (w(), p("p", Kn, "Run a node to see its output here.")) : r.value.export && r.value.export.downloaded ? (w(), p("p", qn, " “" + j(r.value.export.filename) + "” was downloaded to your computer. ", 1)) : r.value.export ? (w(), p("p", Jn, " “" + j(r.value.export.filename) + "” was written as this node ran upstream of another, not downloaded. Run this node to download it. ", 1)) : (w(), p("div", Yn, [
				s.value.length ? (w(), p("div", Xn, [(w(!0), p(l, null, O(s.value, (e) => (w(), p("button", {
					key: e.ref,
					type: "button",
					role: "tab",
					class: "flow-tab flow-tab--mono",
					"aria-selected": e.name === a.value,
					onClick: (t) => a.value = e.name
				}, j(e.ref), 9, Zn))), 128))])) : f("", !0),
				h.value.value && h.value.value.kind !== "none" ? (w(), p("div", Qn, [m("p", $n, j(h.value.value.type), 1), m("pre", er, j(h.value.value.kind === "json" ? JSON.stringify(h.value.value.value, null, 2) : h.value.value.text), 1)])) : v.value ? f("", !0) : (w(), p("p", tr, " This node's output isn't tabular — see the Terminal panel. ")),
				h.value.tables ? (w(), p("div", nr, [(w(!0), p(l, null, O(h.value.tables, (e) => (w(), p("button", {
					key: e.name,
					type: "button",
					role: "tab",
					class: "flow-tab",
					"aria-selected": e === g.value,
					title: e.label === e.name ? void 0 : `${e.label} (${e.name} in SQL)`,
					onClick: (t) => o.value = e.name
				}, j(e.label), 9, rr))), 128))])) : f("", !0),
				v.value ? (w(), p(l, { key: 4 }, [v.value.rowCount ? (w(), d(Gn, {
					key: 1,
					data: v.value,
					busy: i.value,
					onTurn: y
				}, null, 8, ["data", "busy"])) : (w(), p("p", ir, "No rows."))], 64)) : f("", !0)
			]))]),
			_: 1
		}));
	}
}, or = {
	key: 0,
	class: "flow-field"
}, sr = ["for"], cr = { class: "flow-assist" }, lr = [
	"id",
	"placeholder",
	"aria-describedby"
], ur = ["aria-disabled"], dr = ["id"], fr = {
	key: 0,
	class: "flow-field-hint"
}, pr = {
	key: 1,
	class: "flow-field-error"
}, mr = {
	key: 2,
	class: "flow-field-note"
}, hr = { class: "flow-field-hint" }, gr = {
	__name: "AssistantField",
	props: {
		node: {
			type: Object,
			required: !0
		},
		code: {
			type: String,
			default: ""
		},
		field: {
			type: String,
			required: !0
		},
		language: {
			type: String,
			required: !0
		}
	},
	setup(e) {
		let t = e, n = _(q), r = u(() => n.server.value.assistant), i = D(""), a = D(null), o = D(""), s = D(""), c = D(null), l = u(() => a.value !== null), d = u(() => !l.value && !!i.value.trim()), g = u(() => !!c.value && t.code === c.value.written);
		async function v() {
			if (!d.value) return;
			let e = t.node, r = t.code;
			s.value = "", o.value = "";
			let l;
			try {
				l = await n.askAssistant(e.id, i.value.trim(), r, (e) => a.value = e);
			} finally {
				a.value = null;
			}
			if (l.error) {
				s.value = l.error;
				return;
			}
			n.flow.findNode(e.id) === e && (n.updateData(e.id, { [t.field]: l.code }), o.value = l.note || "Done.", c.value = {
				previous: r,
				written: l.code
			}, i.value = "");
		}
		function y() {
			n.updateData(t.node.id, { [t.field]: c.value.previous }), c.value = null, o.value = "";
		}
		function b(e) {
			e.key !== "Enter" || e.shiftKey || e.isComposing || (e.preventDefault(), v());
		}
		let x = u(() => {
			let e = r.value.sampleRows, n = e > 0 ? `its inputs' columns and first ${e} ${e === 1 ? "row" : "rows"}` : "its inputs' columns", i = t.node.data.kind === "sql-query" ? ", and the server database's tables and columns," : "";
			return `Sends your request, this node's ${t.language}, ${n}${i} to ${r.value.model} through the server.`;
		}), S = N(), C = {
			request: `${S}-request`,
			note: `${S}-note`
		};
		return (t, n) => r.value ? (w(), p("div", or, [
			m("label", {
				class: "flow-field-label",
				for: C.request
			}, "Assistant", 8, sr),
			m("div", cr, [I(m("textarea", {
				id: C.request,
				"onUpdate:modelValue": n[0] ||= (e) => i.value = e,
				class: "flow-field-input flow-assist-input",
				rows: "2",
				placeholder: `Say what the ${e.language} should do`,
				"aria-describedby": C.note,
				onKeydown: b
			}, null, 40, lr), [[te, i.value]]), m("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": !d.value,
				onClick: v
			}, j(l.value ? "Writing…" : "Write"), 9, ur)]),
			m("div", {
				id: C.note,
				class: "flow-assist-status",
				"aria-live": "polite"
			}, [l.value ? (w(), p("p", fr, j(a.value === "reading" ? "Reading its inputs…" : `Writing with ${r.value.model}…`), 1)) : s.value ? (w(), p("p", pr, j(s.value), 1)) : o.value ? (w(), p("p", mr, [h(j(o.value) + " ", 1), g.value ? (w(), p("button", {
				key: 0,
				type: "button",
				class: "flow-suggestion",
				onClick: y
			}, "Undo")) : f("", !0)])) : f("", !0), m("p", hr, j(x.value) + " Check what it writes before you run it.", 1)], 8, dr)
		])) : f("", !0);
	}
}, _r = { key: 0 }, vr = {
	__name: "FieldText",
	props: { text: {
		type: String,
		default: ""
	} },
	setup(e) {
		let t = e, n = u(() => t.text.split("`").map((e, t) => ({
			part: e,
			code: t % 2 == 1
		})));
		return (e, t) => (w(!0), p(l, null, O(n.value, ({ part: e, code: t }, n) => (w(), p(l, { key: n }, [t ? (w(), p("code", _r, j(e), 1)) : (w(), p(l, { key: 1 }, [h(j(e), 1)], 64))], 64))), 128));
	}
}, yr = {
	key: 1,
	class: "flow-field-check"
}, br = ["checked"], xr = { class: "flow-field" }, Sr = {
	key: 1,
	class: "flow-field-label"
}, Cr = [
	"type",
	"min",
	"max",
	"step",
	"placeholder",
	"aria-invalid"
], wr = [
	"rows",
	"placeholder",
	"aria-invalid",
	"onKeydown"
], Tr = ["value"], Er = ["value"], Dr = ["accept", "disabled"], Or = {
	key: 0,
	class: "flow-field-error"
}, kr = {
	key: 1,
	class: "flow-field-error"
}, Ar = {
	key: 2,
	class: "flow-field-hint"
}, jr = {
	key: 3,
	class: "flow-field-hint"
}, Mr = {
	__name: "NodeField",
	props: {
		node: {
			type: Object,
			required: !0
		},
		field: {
			type: Object,
			required: !0
		}
	},
	setup(e) {
		let t = e, n = {
			sql: "SQL",
			python: "Python",
			javascript: "JavaScript",
			text: "Text"
		}, r = _(q), i = u(() => [
			"text",
			"number",
			"code"
		].includes(t.field.type)), a = u(() => t.node.data[t.field.key]), o = u(() => a.value ?? t.field.default), s = D(""), c = D(""), v = D(""), y = null, x = (e) => e == null ? "" : String(e);
		P(() => [t.node, a.value], ([e], [n] = []) => {
			y = t.node, s.value = x(o.value), c.value = "", e !== n && (v.value = "");
		}, { immediate: !0 });
		let S = () => r.flow.findNode(y.id) === y ? y : null;
		function C() {
			let { type: e } = t.field;
			if (e === "code") return s.value;
			let n = String(s.value ?? "").trim();
			return e === "number" ? n === "" ? void 0 : Number.isFinite(Number(n)) ? Number(n) : null : n === "" ? void 0 : n;
		}
		function T() {
			if (!S()) return;
			let e = C();
			if (e === null) {
				c.value = "Enter a number.";
				return;
			}
			c.value = "", r.updateData(y.id, { [t.field.key]: e });
		}
		function E() {
			T(), S() && !c.value && r.runNode(y.id);
		}
		function A(e) {
			r.updateData(t.node.id, { [t.field.key]: e });
		}
		async function F(e) {
			let n = e.target.files[0];
			if (e.target.value = "", !n) return;
			let i = t.node, a = await r.storeFieldFile(i.id, t.field.key, n);
			t.node === i && (v.value = a ?? "");
		}
		let R = u(() => {
			if (!i.value) return o.value;
			let e = C();
			return e === null ? s.value : e;
		}), z = u(() => It(t.node.data)), re = u(() => t.field.key ? Bt(t.field, R.value, z.value) : []), B = u(() => !!c.value || re.value.some((e) => e.severity === "error")), ie = u(() => {
			let { hint: e } = t.field;
			return typeof e == "function" ? e(z.value, R.value) : e ?? "";
		}), V = u(() => {
			let { options: e } = t.field;
			return (typeof e == "function" ? e(z.value) : e) ?? [];
		}), H = u(() => r.reading.has(t.node.id)), ae = N(), U = `${ae}-input`, W = `${ae}-note`;
		return (t, r) => e.field.type === "custom" ? (w(), d(k(e.field.component), {
			key: 0,
			node: e.node
		}, null, 8, ["node"])) : e.field.type === "checkbox" ? (w(), p("label", yr, [h(j(e.field.label) + " ", 1), m("input", {
			type: "checkbox",
			checked: !!o.value,
			onChange: r[0] ||= (e) => A(e.target.checked)
		}, null, 40, br)])) : (w(), p(l, { key: 2 }, [e.field.type === "code" && e.field.assistant ? (w(), d(gr, {
			key: e.node.id,
			node: e.node,
			code: s.value,
			field: e.field.key,
			language: n[e.field.language] ?? "code"
		}, null, 8, [
			"node",
			"code",
			"field",
			"language"
		])) : f("", !0), m("div", xr, [
			e.field.type === "file" ? (w(), p("span", Sr, j(e.field.label), 1)) : (w(), p("label", {
				key: 0,
				class: "flow-field-label",
				for: U
			}, j(e.field.label), 1)),
			e.field.type === "text" || e.field.type === "number" ? I((w(), p("input", {
				key: 2,
				id: U,
				"onUpdate:modelValue": r[1] ||= (e) => s.value = e,
				class: b(["flow-field-input", {
					"flow-field-input--mono": e.field.mono,
					"is-invalid": B.value
				}]),
				type: e.field.type === "number" ? "number" : "text",
				min: e.field.min,
				max: e.field.max,
				step: e.field.step,
				placeholder: e.field.placeholder,
				"aria-invalid": B.value,
				"aria-describedby": W,
				autocomplete: "off",
				spellcheck: "false",
				onInput: r[2] ||= (e) => c.value = "",
				onBlur: T,
				onKeydown: r[3] ||= L((...e) => M(J) && M(J)(...e), ["enter"])
			}, null, 42, Cr)), [[ee, s.value]]) : e.field.type === "code" ? I((w(), p("textarea", {
				key: 3,
				id: U,
				"onUpdate:modelValue": r[4] ||= (e) => s.value = e,
				class: b(["flow-field-input flow-field-input--mono flow-field-code", { "is-invalid": B.value }]),
				rows: e.field.rows ?? 8,
				spellcheck: "false",
				placeholder: e.field.placeholder,
				"aria-invalid": B.value,
				"aria-describedby": W,
				onBlur: T,
				onKeydown: [L(ne(E, ["ctrl", "prevent"]), ["enter"]), L(ne(E, ["meta", "prevent"]), ["enter"])]
			}, null, 42, wr)), [[te, s.value]]) : e.field.type === "select" ? (w(), p("select", {
				key: 4,
				id: U,
				class: b(["flow-field-input flow-field-select", { "is-invalid": B.value }]),
				value: o.value ?? "",
				"aria-describedby": W,
				onChange: r[5] ||= (e) => A(e.target.value === "" ? void 0 : e.target.value)
			}, [(w(!0), p(l, null, O(V.value, (e) => (w(), p("option", {
				key: e.value,
				value: e.value
			}, j(e.label), 9, Er))), 128))], 42, Tr)) : e.field.type === "file" ? (w(), p("label", {
				key: 5,
				class: b(["flow-file", { "is-busy": H.value }])
			}, [m("input", {
				id: U,
				type: "file",
				class: "flow-file-input",
				accept: e.field.accept,
				disabled: H.value,
				"aria-describedby": W,
				onChange: F
			}, null, 40, Dr), h(" " + j(H.value ? "Reading…" : o.value ? "Choose another file…" : "Choose file…"), 1)], 2)) : e.field.type === "readonly" ? (w(), p("p", {
				key: 6,
				id: U,
				class: "flow-field-readonly"
			}, j(e.field.value?.(z.value) ?? ""), 1)) : f("", !0),
			m("div", { id: W }, [
				c.value ? (w(), p("p", Or, j(c.value), 1)) : f("", !0),
				v.value ? (w(), p("p", kr, j(v.value), 1)) : f("", !0),
				(w(!0), p(l, null, O(re.value, (e) => (w(), p("p", {
					key: e.message,
					class: b(e.severity === "warn" ? "flow-field-warning" : "flow-field-error")
				}, j(e.message), 3))), 128)),
				e.field.type === "file" && o.value ? (w(), p("p", Ar, j(o.value.fileName) + " · " + j(M(me)(o.value.fileSize)), 1)) : f("", !0),
				ie.value ? (w(), p("p", jr, [g(vr, { text: ie.value }, null, 8, ["text"])])) : f("", !0)
			])
		])], 64));
	}
}, Nr = { class: "flow-props" }, Pr = { class: "flow-field" }, Fr = ["for"], Ir = [
	"id",
	"aria-invalid",
	"aria-describedby"
], Lr = ["id"], Rr = {
	key: 0,
	class: "flow-field-error"
}, zr = { class: "flow-field-hint" }, Br = { class: "flow-field" }, Vr = ["for"], Hr = ["id", "placeholder"], Ur = {
	key: 0,
	class: "flow-field"
}, Wr = ["for"], Gr = { class: "flow-field-prefixed" }, Kr = {
	class: "flow-field-prefix",
	"aria-hidden": "true"
}, qr = [
	"id",
	"aria-invalid",
	"aria-describedby"
], Jr = ["id"], Yr = { class: "flow-field-check" }, Xr = ["checked"], Zr = { class: "flow-field" }, Qr = { class: "flow-actions" }, $r = ["aria-disabled"], ei = { class: "flow-field-hint" }, ti = {
	key: 2,
	class: "flow-field-note is-warning"
}, ni = {
	key: 3,
	class: "flow-field-hint"
}, ri = {
	__name: "NodeProperties",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = _(q), r = u(() => Q(t.node.data.kind)), i = u(() => n.run.status[t.node.id]), a = u(() => i.value === "running"), o = u(() => {
			let e = It(t.node.data);
			return (r.value.fields ?? []).filter((t) => !t.visible || t.visible(e));
		}), s = D(""), c = D(""), g = D(""), v = D(""), y = D(""), x = null;
		P(() => {
			let { id: e, data: n } = t.node;
			return [
				t.node,
				e,
				n.label,
				n.outputSuffix
			];
		}, () => {
			x = t.node, s.value = t.node.id, c.value = "", g.value = t.node.data.label ?? "", v.value = t.node.data.outputSuffix ?? "", y.value = "";
		}, { immediate: !0 });
		let S = () => n.flow.findNode(x.id) === x ? x : null;
		function C() {
			S() && (c.value = n.renameNode(x.id, s.value) ?? "", c.value || (s.value = x.id));
		}
		function T() {
			S() && n.setLabel(x.id, g.value);
		}
		function E() {
			S() && (y.value = n.setOutputName(x.id, v.value) ?? "", y.value || (v.value = x.data.outputSuffix ?? ""));
		}
		let k = u(() => {
			let e = Yt(t.node.id, t.node.data), n = t.node.data.ingest;
			if (!n || !G[n.format].multi) return `this node's data as “${e}”`;
			let r = n.tables.map((t) => `“${e}.${t.name}”`);
			return `this node's tables as ${r.slice(0, 3).join(", ")}${r.length > 3 ? ", …" : ""}`;
		}), A = u(() => t.node.data.autoRun !== !1), ee = (e) => n.updateData(t.node.id, { autoRun: e.target.checked ? void 0 : !1 }), F = u(() => t.node.data.sqlServerTables ?? []), ne = u(() => Zt(t.node.data)), R = n.server, z = u(() => ne.value && R.value.state !== "connected"), re = u(() => {
			if (r.value.canRun) {
				let e = r.value.canRun(It(t.node.data));
				if (e) return e;
			}
			let e = Vt(t.node.data).find((e) => e.severity === "error");
			return e ? `${e.label}: ${e.message}` : null;
		}), B = u(() => !a.value && !n.reading.has(t.node.id) && !z.value && !re.value), ie = u(() => r.value.runHint ?? "Results land in the Data panel; errors show in the Terminal panel."), V = N(), H = {
			id: `${V}-id`,
			idNote: `${V}-id-note`,
			label: `${V}-label`,
			output: `${V}-output`,
			outputNote: `${V}-output-note`
		};
		return (t, u) => (w(), p("div", Nr, [
			m("div", Pr, [
				m("label", {
					class: "flow-field-label",
					for: H.id
				}, "ID", 8, Fr),
				I(m("input", {
					id: H.id,
					"onUpdate:modelValue": u[0] ||= (e) => s.value = e,
					class: b(["flow-field-input flow-field-input--mono", { "is-invalid": c.value }]),
					"aria-invalid": !!c.value,
					"aria-describedby": H.idNote,
					spellcheck: "false",
					autocomplete: "off",
					onInput: u[1] ||= (e) => c.value = "",
					onBlur: C,
					onKeydown: u[2] ||= L((...e) => M(J) && M(J)(...e), ["enter"])
				}, null, 42, Ir), [[te, s.value]]),
				m("div", { id: H.idNote }, [c.value ? (w(), p("p", Rr, j(c.value), 1)) : f("", !0), m("p", zr, " Downstream nodes reference " + j(k.value) + ". Renaming doesn't update that text inside other nodes' queries or code — you'll need to update those yourself. ", 1)], 8, Lr)
			]),
			m("div", Br, [m("label", {
				class: "flow-field-label",
				for: H.label
			}, "Name", 8, Vr), I(m("input", {
				id: H.label,
				"onUpdate:modelValue": u[3] ||= (e) => g.value = e,
				class: "flow-field-input",
				placeholder: r.value.label,
				autocomplete: "off",
				onBlur: T,
				onKeydown: u[4] ||= L((...e) => M(J) && M(J)(...e), ["enter"])
			}, null, 40, Hr), [[te, g.value]])]),
			(w(!0), p(l, null, O(o.value, (t, n) => (w(), d(Mr, {
				key: t.key ?? `custom-${n}`,
				node: e.node,
				field: t
			}, null, 8, ["node", "field"]))), 128)),
			r.value.outputName ? (w(), p("div", Ur, [
				m("label", {
					class: "flow-field-label",
					for: H.output
				}, "Output Name", 8, Wr),
				m("div", Gr, [m("span", Kr, j(e.node.id) + "_", 1), I(m("input", {
					id: H.output,
					"onUpdate:modelValue": u[5] ||= (e) => v.value = e,
					class: b(["flow-field-input flow-field-input--mono", { "is-invalid": y.value }]),
					placeholder: "data",
					spellcheck: "false",
					autocomplete: "off",
					"aria-invalid": !!y.value,
					"aria-describedby": H.outputNote,
					onInput: u[6] ||= (e) => y.value = "",
					onBlur: E,
					onKeydown: u[7] ||= L((...e) => M(J) && M(J)(...e), ["enter"])
				}, null, 42, qr), [[te, v.value]])]),
				y.value ? (w(), p("p", {
					key: 0,
					id: H.outputNote,
					class: "flow-field-error"
				}, j(y.value), 9, Jr)) : f("", !0)
			])) : f("", !0),
			r.value.runs ? (w(), p(l, { key: 1 }, [
				ne.value ? (w(), p("p", {
					key: 0,
					class: b(["flow-field-note", { "is-warning": z.value }])
				}, [
					F.value.length ? (w(), p(l, { key: 0 }, [h(" Reads " + j(F.value.join(", ")) + " from the server, so it runs there: ", 1)], 64)) : (w(), p(l, { key: 1 }, [h("Runs on the server:")], 64)),
					h(" running this node sends its input data to the server" + j(M(R).state === "connected" && M(R).address ? ` at ${M(R).address}` : "") + " to complete. ", 1),
					z.value ? (w(), p(l, { key: 2 }, [h("The server isn't available, so it can't run now.")], 64)) : f("", !0)
				], 2)) : f("", !0),
				m("label", Yr, [u[10] ||= h(" Auto Run ", -1), m("input", {
					type: "checkbox",
					checked: A.value,
					onChange: ee
				}, null, 40, Xr)]),
				m("div", Zr, [m("div", Qr, [m("button", {
					type: "button",
					class: "flow-button flow-button--wide",
					"aria-disabled": !B.value,
					onClick: u[8] ||= (t) => B.value && M(n).runNode(e.node.id)
				}, j(a.value ? "Running…" : "Run"), 9, $r), i.value && !a.value ? (w(), p("button", {
					key: 0,
					type: "button",
					class: "flow-button flow-button--quiet",
					title: "Back to not run: clears its status and output",
					onClick: u[9] ||= (t) => M(n).resetNode(e.node.id)
				}, " Reset ")) : f("", !0)]), m("p", ei, j(re.value ?? ie.value), 1)])
			], 64)) : r.value.unknown ? (w(), p("p", ti, " This node is a " + j(e.node.data.kind) + " node, which this app doesn't have (it was made in another app, or with a plugin this app doesn't install). It can't run or take new wires here, but it keeps its settings and wires, and saving the graph keeps it as it was. ", 1)) : (w(), p("p", ni, "No editable properties yet for this node kind."))
		]));
	}
}, ii = {
	key: 1,
	class: "flow-panel-empty"
}, ai = {
	__name: "ManagePanel",
	setup(e) {
		let t = _(q);
		return (e, n) => (w(), d(c, {
			class: "manage-panel",
			name: "manage",
			title: "Manage",
			dock: "right",
			hotkey: "M"
		}, {
			default: F(() => [M(t).selectedNode.value ? (w(), d(ri, {
				key: 0,
				node: M(t).selectedNode.value
			}, null, 8, ["node"])) : (w(), p("p", ii, "Select a node to see its properties."))]),
			_: 1
		}));
	}
}, oi = {
	__name: "ServerStatus",
	setup(e) {
		let t = _(q), n = t.server, r = u(() => n.value.state === "connected"), i = u(() => r.value && t.flow.nodes.value.some((e) => Zt(e.data)));
		return (e, t) => M(n).state === "checking" ? f("", !0) : (w(), p("div", {
			key: 0,
			class: b(["flow-server-status", r.value ? "flow-node--modify" : "flow-node--fetch"]),
			role: "status"
		}, [m("span", {
			class: b(["flow-blink-dot", { "is-steady": !i.value }]),
			"aria-hidden": "true"
		}, null, 2), r.value ? (w(), p(l, { key: 0 }, [h(" LIVE · connected to server" + j(M(n).address ? ` ${M(n).address}` : ""), 1)], 64)) : (w(), p(l, { key: 1 }, [h("backend not available, client execution only")], 64))], 2));
	}
}, si = 400;
function ci(e, t) {
	let n = null, r = null;
	function i() {
		n && (clearTimeout(n), n = null, t.save(e.snapshot.value));
	}
	function a() {
		clearTimeout(n), n = setTimeout(i, si);
	}
	let o = () => document.visibilityState === "hidden" && i();
	C(async () => {
		e.load(t ? await t.load() : null), t && (r = P(e.snapshot, a), window.addEventListener("pagehide", i), document.addEventListener("visibilitychange", o));
	}), S(() => {
		r?.(), window.removeEventListener("pagehide", i), document.removeEventListener("visibilitychange", o), t && i();
	});
}
//#endregion
//#region lib/themes.js
var li = [
	"FLOW",
	"FLOWDARK",
	"LUX",
	"LUXDARK"
], ui = new Map(li.map((e) => [e, {
	name: e,
	base: null,
	tokens: {}
}])), $ = (e) => String(e).toUpperCase();
function di({ name: e, base: t = "FLOW", tokens: n = {} }) {
	if (!e) throw Error("A theme needs a name.");
	if (li.includes($(e))) throw Error(`${$(e)} is a built-in theme; give yours another name.`);
	if (!ui.has($(t))) throw Error(`Theme ${$(e)} is based on ${$(t)}, which isn't defined.`);
	ui.set($(e), {
		name: $(e),
		base: $(t),
		tokens: { ...n }
	});
}
var fi = (e) => ui.has($(e)), pi = () => [...ui.keys()];
function mi(e) {
	let t = ui.get($(e)) ?? ui.get("FLOW");
	if (!t.base) return {
		name: t.name,
		className: `flow-theme-${t.name.toLowerCase()}`,
		tokens: {}
	};
	let n = mi(t.base);
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
var hi = { class: "flow-title flow-pan-trigger" }, gi = { class: "flow-brand-text flow-title-text" }, _i = {
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
			validator: fi
		},
		autoHideRails: {
			type: Boolean,
			default: !0
		}
	},
	setup(t) {
		let n = t, r = u(() => mi(n.theme)), a = u(() => r.value.className), o = u(() => r.value.tokens), c = s({ autoHideRails: () => n.autoHideRails }), l = Ye({
			sql: n.sql,
			files: n.storage,
			server: n.server
		});
		T(q, l), ci(l, n.storage);
		let { commands: f, canvasMenu: p } = pt(c, l), h = D(null), _ = (e) => !!e.target.closest(".wm-content");
		function v(e) {
			_(e) || l.onKeydown(e);
		}
		function y(e) {
			h.value.open(e.point, {
				items: ft,
				context: e
			});
		}
		return T(ct, (e, t) => h.value.open(e, t)), (n, r) => (w(), d(i, {
			ref_key: "host",
			ref: h,
			class: b(["flow-editor", a.value]),
			layout: M(c),
			commands: M(f),
			role: "application",
			"aria-label": t.title,
			style: x(o.value),
			onKeydown: v
		}, {
			title: F(() => [m("span", hi, [m("span", gi, j(t.title), 1)])]),
			panels: F(() => [
				g(kn),
				g(Pn),
				g(Rn),
				g(ar),
				g(ai),
				g(oi)
			]),
			default: F(() => [I(g(Tn, { onConnectionDropped: y }, null, 512), [[M(e), M(p)]])]),
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
export { q as FLOW_GRAPH, c as FlowPanel, _i as FlowgraphEditor, wt as NODE_CATEGORIES, Y as NODE_KINDS, a as PANEL_LAYOUT, o as PANEL_MENU, i as PanelHost, s as createPanelLayout, At as defineNodeCategory, X as defineNodeKind, di as defineTheme, r as panelCommands, t as panelsSubmenu, mi as resolveTheme, pi as themeNames };
