import { computed as e, createBlock as t, createSlots as n, openBlock as r, reactive as i, ref as a, renderSlot as o, unref as s, watch as c, withCtx as l } from "vue";
import { FlowgraphEditor as u, NODE_CATEGORIES as d, NODE_KINDS as f, createCommandRegistry as p, defineNodeCategory as m, defineNodeKind as h, hasTheme as g, listing as _, themeNames as v } from "seamonster";
//#region commands.js
function y(e) {
	let t = (t) => `${e}:${t}`;
	return {
		get(e) {
			try {
				return JSON.parse(localStorage.getItem(t(e)));
			} catch {
				return null;
			}
		},
		set(e, n) {
			try {
				n == null ? localStorage.removeItem(t(e)) : localStorage.setItem(t(e), JSON.stringify(n));
			} catch {}
		}
	};
}
function b({ client: e, engineName: t, kept: n, chosenTheme: r, appCommands: i = [] }) {
	let a = p(), o = () => {
		if (!e) throw Error("This app has no engine.");
	};
	return a.define([
		{
			name: "f.Help",
			kind: "action",
			description: "Lists the commands, with what each does.",
			run: () => _(a)
		},
		{
			name: "f.Terminal.Clear",
			kind: "action",
			description: "Empties the app's log (not the nodes').",
			run: ({ graph: e }) => (e.clearLog(), "Cleared.")
		},
		{
			name: "f.Theme",
			kind: "setting",
			description: "The look: a built-in theme or one the app defines. Kept in this browser.",
			values: () => v(),
			get: () => r.effective(),
			set: (e) => (r.value = e, n.set("theme", e), `f.Theme = "${e}", kept in this browser.`)
		},
		{
			name: "f.Security.DisconnectBackend",
			kind: "action",
			description: "Stops talking to the engine: nothing is sent to it, and nodes that need it can't run. Kept across reloads.",
			run: () => (o(), e.disconnect(), n.set("disconnected", !0), `Disconnected from ${t}: nothing goes to it until f.Security.EnableBackend, even after a reload.`)
		},
		{
			name: "f.Security.EnableBackend",
			kind: "action",
			description: "Talks to the engine again.",
			run: () => (o(), n.set("disconnected", null), e.connect(), `Connecting to ${t} again.`)
		},
		{
			name: "f.Assistant.Disable",
			kind: "action",
			description: "Hides the AI assistant in this browser.",
			run: () => (n.set("assistant-hidden", !0), e?.hideAssistant(!0), "The assistant is hidden in this browser (f.Assistant.Enable shows it).")
		},
		{
			name: "f.Assistant.Enable",
			kind: "action",
			description: "Shows the AI assistant again, when the engine has it.",
			run: () => (n.set("assistant-hidden", null), e?.hideAssistant(!1), e?.status.assistant ? "The assistant is back." : "The assistant is shown again when the engine has it set up.")
		}
	]), a.define(i), e ? x(a, e, t, n) : a.unavailable("b.", "b. commands run on the engine, and this app has none."), a;
}
function x(e, t, n, r) {
	let i = [], a = () => r.get("engine-settings") ?? {};
	function o() {
		let e = a();
		for (let t of Object.keys(e)) i.find((e) => e.name === t)?.set || delete e[t];
		r.set("engine-settings", Object.keys(e).length ? e : null);
	}
	async function s() {
		i = await t.commands();
	}
	function l() {
		e.remove("b."), e.define(i.map((e) => ({
			name: e.name,
			kind: e.kind,
			description: e.description,
			type: e.type,
			secret: e.secret,
			values: e.values ? () => e.values : void 0,
			get: () => i.find((t) => t.name === e.name)?.value,
			set: async (n) => {
				let i = await t.runCommand(e.name, n);
				return r.set("engine-settings", {
					...a(),
					[e.name]: n
				}), await s(), o(), i;
			},
			run: async () => {
				let n = await t.runCommand(e.name);
				return await s(), o(), n;
			}
		})));
	}
	async function u() {
		try {
			await s();
			let n = Object.entries(a()).filter(([e]) => i.find((t) => t.name === e)?.set === !1);
			for (let [e, r] of n) await t.runCommand(e, r).catch(() => {});
			n.length && await s(), e.unavailable("b.", null), l();
		} catch {}
	}
	c(() => t.status.state, (r) => {
		if (r === "connected") return u();
		e.remove("b."), e.unavailable("b.", t.status.disconnected ? `b. commands run on ${n}, which is disconnected in this browser (f.Security.EnableBackend).` : `b. commands run on ${n}, which isn't available.`);
	}, { immediate: !0 });
}
var S = (e) => typeof e == "string" && g(e) ? e : null, C = 1e3, w = 5e3, T = 15e3, E = 3e3, D = "application/vnd.apache.parquet";
function O(e, t) {
	let n = new FormData();
	for (let [t, r] of Object.entries(e)) n.append(t, r);
	for (let { name: e, bytes: r } of t) n.append("input", new Blob([r], { type: D }), e);
	return n;
}
function k({ url: e, name: t = "The engine", disconnected: n = !1, assistantHidden: r = !1 }) {
	let a = e.replace(/\/+$/, ""), o = n, s = r, c = null, l = () => {
		throw Error(`${t} is disconnected in this browser (f.Security.DisconnectBackend): f.Security.EnableBackend connects it again.`);
	};
	async function u(e) {
		try {
			let { error: t } = await e.json();
			if (t) return Error(t);
		} catch {}
		return /* @__PURE__ */ Error(`${t} answered ${e.status} ${e.statusText}.`);
	}
	async function d(e, n) {
		o && l();
		let r;
		try {
			r = await fetch(`${a}${e}`, {
				method: "POST",
				...n
			});
		} catch {
			throw Error(`${t} couldn't be reached.`);
		}
		if (!r.ok) throw await u(r);
		return r;
	}
	let f = (e, t, n) => d(e, { body: O(t, n) });
	async function p(e) {
		o && l();
		let n;
		try {
			n = await fetch(`${a}${e}`, { cache: "no-store" });
		} catch {
			throw Error(`${t} couldn't be reached.`);
		}
		if (!n.ok) throw await u(n);
		return n;
	}
	let m = (e) => new Promise((t) => setTimeout(t, e)), h = {
		status: i({
			state: o ? "unavailable" : "checking",
			address: null,
			local: !1,
			assistant: null,
			nodes: [],
			disconnected: o
		}),
		async query({ sql: e, inputs: t = [] }) {
			let n = await f("/query", { sql: e }, t);
			return new Uint8Array(await n.arrayBuffer());
		},
		async runPython({ code: e, inputs: t = [] }) {
			let n = await (await f("/run/python", { code: e }, t)).formData(), r = JSON.parse(n.get("result")), i = n.get("table");
			return i ? {
				...r,
				table: new Uint8Array(await i.arrayBuffer())
			} : r;
		},
		async runNode({ kind: e, node: t, inputs: n = [], files: r = [] }) {
			let i = new FormData();
			i.append("kind", e), i.append("node", JSON.stringify(t));
			let a = n.map((e, t) => {
				let { ref: n, id: r, slot: a, pin: o } = e;
				return e.tables ? {
					ref: n,
					id: r,
					slot: a,
					pin: o,
					tables: e.tables.map((e, n) => (i.append("input", new Blob([e.bytes], { type: D }), `i${t}-${n}`), {
						name: e.name,
						part: `i${t}-${n}`
					}))
				} : (i.append("input", new Blob([e.bytes], { type: D }), `i${t}`), {
					ref: n,
					id: r,
					slot: a,
					pin: o,
					part: `i${t}`
				});
			});
			i.append("inputs", JSON.stringify(a));
			for (let { key: e, bytes: t } of r) i.append("file", new Blob([t]), e);
			let o = await (await d("/run/node", { body: i })).formData(), s = JSON.parse(o.get("result")), c = /* @__PURE__ */ new Map();
			for (let e of o.getAll("table")) c.set(e.name, new Uint8Array(await e.arrayBuffer()));
			let l = (s.outputs ?? []).map((e) => e.tables ? {
				slot: e.slot,
				tables: e.tables.map((e) => ({
					name: e.name,
					bytes: c.get(e.part)
				}))
			} : {
				slot: e.slot,
				bytes: c.get(e.part)
			});
			return {
				...s,
				outputs: l
			};
		},
		async runLoop({ node: e, path: t, subnets: n = {}, inputs: r = [], progress: i = () => {} }) {
			let a = new FormData();
			a.append("job", JSON.stringify({
				node: e,
				path: t,
				subnets: n
			}));
			for (let { pin: e, bytes: t } of r) a.append("input", new Blob([t], { type: D }), e);
			let o = await (await d("/jobs", { body: a })).json();
			for (; o.status === "running";) await m(C), o = await (await p(`/jobs/${o.id}`)).json(), o.progress?.total && i(o.progress);
			if (o.status === "failed") return { error: o.error };
			let s = await (await p(`/jobs/${o.id}/result`)).formData(), c = JSON.parse(s.get("result")), l = /* @__PURE__ */ new Map();
			for (let e of s.getAll("table")) l.set(e.name, new Uint8Array(await e.arrayBuffer()));
			let u = (c.outputs ?? []).map((e) => ({
				slot: e.slot,
				bytes: l.get(e.part)
			}));
			return {
				warnings: c.warnings ?? [],
				outputs: u
			};
		},
		async commands() {
			return (await (await p("/commands")).json()).commands ?? [];
		},
		async runCommand(e, ...t) {
			let n = t.length ? {
				name: e,
				value: t[0]
			} : { name: e };
			return (await (await d("/commands", {
				headers: { "content-type": "application/json" },
				body: JSON.stringify(n)
			})).json()).message;
		},
		disconnect() {
			o = !0, clearTimeout(g), Object.assign(h.status, {
				state: "unavailable",
				address: null,
				assistant: null,
				disconnected: !0
			});
		},
		connect() {
			o && (o = !1, Object.assign(h.status, {
				state: "checking",
				disconnected: !1
			}), _());
		},
		hideAssistant(e) {
			s = e, h.status.assistant = e ? null : c;
		},
		async nodes() {
			let e = await fetch(`${a}/nodes`, { cache: "no-store" });
			if (!e.ok) throw await u(e);
			return e.json();
		},
		async assist(e) {
			return (await d("/assist", {
				headers: { "content-type": "application/json" },
				body: JSON.stringify(e)
			})).json();
		}
	}, g = null;
	async function _() {
		let { status: e } = h;
		if (clearTimeout(g), !o) {
			try {
				let t = await fetch(`${a}/health`, {
					cache: "no-store",
					signal: AbortSignal.timeout(E)
				}), n = t.ok && t.headers.get("content-type")?.includes("json") ? await t.json() : null;
				if (n?.status !== "ok") throw Error("not the engine");
				if (o) return;
				e.state = "connected", e.address = n.host && n.port ? `${n.host}:${n.port}` : location.host, e.local = n.local === !0, c = n.assistant ?? null;
				let r = s ? null : c;
				JSON.stringify(r) !== JSON.stringify(e.assistant) && (e.assistant = r), JSON.stringify(n.nodes ?? []) !== JSON.stringify(e.nodes) && (e.nodes = n.nodes ?? []);
			} catch {
				if (o) return;
				e.state = "unavailable", e.address = null, e.assistant = null;
			}
			document.visibilityState === "visible" && (g = setTimeout(_, e.state === "connected" ? w : T));
		}
	}
	return _(), document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && _()), window.addEventListener("online", _), window.addEventListener("offline", _), h;
}
//#endregion
//#region serverKinds.js
function A(e, { log: t = (e) => console.warn(e) } = {}) {
	let n = null;
	return c(() => e.status.nodes, async (r) => {
		if (!r?.length || r.every((e) => e in f)) return;
		let i = r.join("\n");
		if (n === i) return;
		n = i;
		let a;
		try {
			a = await e.nodes();
		} catch (e) {
			n = null, t(`Couldn't read the server's node kinds: ${e.message}`, "error");
			return;
		}
		for (let e of a.categories ?? []) if (!d.some((t) => t.id === e.id)) try {
			m(e);
		} catch (n) {
			t(`The server's node category ${e.id} can't be used here: ${n.message}`, "error");
		}
		for (let e of a.kinds ?? []) if (!(e.kind in f)) try {
			h({
				...e,
				where: "server"
			});
		} catch (n) {
			t(`The server's ${e.kind} nodes can't be used here: ${n.message}`, "error");
		}
	}, { immediate: !0 });
}
//#endregion
//#region duckdbVersions.js
var ee = "1.33.1-dev64.0", j = "duckdb-extensions", M = `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${ee}/+esm`, N = "https://cdn.jsdelivr.net/npm/sql.js@1.13.0";
function P(e) {
	let t = null;
	return () => (t ??= e(), t.catch(() => t = null), t);
}
async function F() {
	let e = await import(
		/* @vite-ignore */
		M
), t = await e.selectBundle(e.getJsDelivrBundles()), n = URL.createObjectURL(new Blob([`importScripts("${t.mainWorker}");`], { type: "text/javascript" })), r = new e.AsyncDuckDB(new e.VoidLogger(), new Worker(n));
	return await r.instantiate(t.mainModule, t.pthreadWorker), URL.revokeObjectURL(n), {
		db: r,
		conn: await r.connect()
	};
}
var I = /it exists in the spatial extension/, L = (e) => new URL(e.replace(/\/?$/, "/"), document.baseURI).href.replace(/\/$/, "");
async function R(e, t) {
	try {
		await e.query(`INSTALL spatial FROM ${K(t)}`), await e.query("LOAD spatial");
	} catch (e) {
		let n = String(e?.message ?? e).split("\n")[0], r = "The app serves it (davy-jones-locker-extensions): see \"DuckDB's extensions\" in the davy-jones-locker README.", i = /Extension "(https?:[^"]+\.wasm)"/.exec(n)?.[1];
		throw i && !await z(i) ? Error(`This query needs DuckDB's spatial extension, which isn't at ${i}. ${r}`) : Error(`This query needs DuckDB's spatial extension, which couldn't be loaded from ${t} (${n}). ${r}`);
	}
	await e.query("SET geometry_always_xy = true");
}
async function z(e) {
	try {
		let t = await fetch(e, { method: "HEAD" });
		return t.ok && !String(t.headers.get("content-type")).includes("text/html");
	} catch {
		return !1;
	}
}
var B = P(async () => {
	let e = await import(
		/* @vite-ignore */
		`${N}/+esm`
);
	return (e.default ?? e)({ locateFile: (e) => `${N}/dist/${e}` });
});
function V(e, t) {
	if (e == null) return null;
	let n = String(t);
	return n.startsWith("Decimal") ? H(String(e), t.scale) : n.startsWith("Date") ? new Date(e).toISOString().slice(0, 10) : n.startsWith("Timestamp") ? new Date(e).toISOString().replace("T", " ").replace(/\.000Z|Z/, "") : U(e);
}
function H(e, t) {
	if (!t) return e;
	let n = e.startsWith("-"), r = (n ? e.slice(1) : e).padStart(t + 1, "0");
	return `${n ? "-" : ""}${r.slice(0, -t)}.${r.slice(-t)}`;
}
function U(e) {
	return typeof e == "bigint" ? Number.isSafeInteger(Number(e)) ? Number(e) : String(e) : typeof e != "object" || !e ? e : typeof e.toJSON == "function" ? U(e.toJSON()) : Array.isArray(e) || ArrayBuffer.isView(e) ? Array.from(e, U) : Object.fromEntries(Object.entries(e).map(([e, t]) => [e, U(t)]));
}
var W = (e) => `\\x${Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("")}`, G = (e) => `"${e.replaceAll("\"", "\"\"")}"`, K = (e) => `'${e.replaceAll("'", "''")}'`;
function q({ extensionRepository: e = j } = {}) {
	let t = P(F), n = P(async () => R((await t()).conn, L(e))), r = async (e) => (await t()).conn.query(e);
	return {
		async query(e) {
			let t;
			try {
				t = await r(e);
			} catch (i) {
				if (!I.test(String(i?.message))) throw i;
				await n(), t = await r(e);
			}
			return Y(t);
		},
		loadSpatial: () => n(),
		async registerFile(e, n) {
			let { db: r } = await t();
			await r.registerFileBuffer(e, n.slice());
		},
		async readFile(e) {
			let { db: n } = await t();
			return n.copyFileToBuffer(e);
		},
		async dropFile(e) {
			let { db: n } = await t();
			await n.dropFile(e);
		},
		readSqlite: X,
		writeSqlite: Z
	};
}
var J = q();
function Y(e) {
	let t = e.schema.fields, n = t.map((t, n) => ({
		vector: e.getChildAt(n),
		type: t.type
	})), r = [];
	for (let t = 0; t < e.numRows; t++) r.push(n.map((e) => V(e.vector.get(t), e.type)));
	return {
		columns: t.map((e) => e.name),
		rows: r
	};
}
async function X(e) {
	let t = new (await (B())).Database(e);
	try {
		return (t.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")[0]?.values ?? []).map(([e]) => ({
			name: e,
			columns: (t.exec(`PRAGMA table_info(${G(e)})`)[0]?.values ?? []).map((e) => e[1]),
			rows: (t.exec(`SELECT * FROM ${G(e)}`)[0]?.values ?? []).map((e) => e.map((e) => e instanceof Uint8Array ? W(e) : e))
		}));
	} finally {
		t.close();
	}
}
async function Z(e, { statements: t = [] } = {}) {
	let n = new (await (B())).Database(), r = (e) => typeof e == "boolean" ? Number(e) : e instanceof Uint8Array || typeof e != "object" || !e ? e : JSON.stringify(e);
	try {
		for (let { name: t, columns: i, rows: a, types: o } of e) {
			let e = i.map((e, t) => o?.[t] ? `${G(e)} ${o[t]}` : G(e));
			n.run(`CREATE TABLE ${G(t)} (${e.join(", ")})`);
			let s = n.prepare(`INSERT INTO ${G(t)} VALUES (${i.map(() => "?").join(", ")})`);
			for (let e of a) s.run(e.map(r));
			s.free();
		}
		for (let e of t) typeof e == "string" ? n.run(e) : n.run(e[0], e[1].map(r));
		return n.export();
	} finally {
		n.close();
	}
}
//#endregion
//#region localGraphStorage.js
var Q = "files";
function $(e = "davy-jones-locker") {
	let t = `${e}:open-graph`, n = null, r = () => n ??= new Promise((t, n) => {
		let r = indexedDB.open(e, 1);
		r.onupgradeneeded = () => r.result.createObjectStore(Q), r.onsuccess = () => t(r.result), r.onerror = () => n(r.error);
	});
	async function i(e, t) {
		let n = await r();
		return new Promise((r, i) => {
			let a = t(n.transaction(Q, e).objectStore(Q));
			a.onsuccess = () => r(a.result), a.onerror = () => i(a.error);
		});
	}
	return {
		load() {
			try {
				return JSON.parse(localStorage.getItem(t));
			} catch {
				return null;
			}
		},
		save(e) {
			try {
				localStorage.setItem(t, JSON.stringify(e));
			} catch {}
		},
		async putFile(e, t) {
			try {
				await i("readwrite", (n) => n.put(t, e));
			} catch {}
		},
		async getFile(e) {
			try {
				return await i("readonly", (t) => t.get(e)) ?? null;
			} catch {
				return null;
			}
		},
		async deleteFile(e) {
			try {
				await i("readwrite", (t) => t.delete(e));
			} catch {}
		}
	};
}
//#endregion
//#region DavyJonesLocker.vue
var te = {
	__name: "DavyJonesLocker",
	props: {
		engineUrl: {
			type: String,
			default: null
		},
		engineName: {
			type: String,
			default: "The engine"
		},
		storageName: {
			type: String,
			default: "davy-jones-locker"
		},
		extensionRepository: {
			type: String,
			default: "duckdb-extensions"
		},
		theme: {
			type: String,
			default: "FLOW"
		},
		commands: {
			type: Array,
			default: () => []
		}
	},
	setup(i) {
		let c = i, d = y(c.storageName), f = c.engineUrl ? k({
			url: c.engineUrl,
			name: c.engineName,
			disconnected: !!d.get("disconnected"),
			assistantHidden: !!d.get("assistant-hidden")
		}) : null;
		f && A(f);
		let p = $(c.storageName), m = q({ extensionRepository: c.extensionRepository }), h = a(S(d.get("theme"))), g = e(() => h.value ?? c.theme), _ = b({
			client: f,
			engineName: c.engineName,
			kept: d,
			chosenTheme: {
				get value() {
					return h.value;
				},
				set value(e) {
					h.value = e;
				},
				effective: () => g.value
			},
			appCommands: c.commands
		});
		return (e, i) => (r(), t(s(u), {
			storage: s(p),
			sql: s(m),
			server: s(f),
			theme: g.value,
			"terminal-commands": s(_)
		}, n({ _: 2 }, [e.$slots.panels ? {
			name: "panels",
			fn: l(() => [o(e.$slots, "panels")]),
			key: "0"
		} : void 0]), 1032, [
			"storage",
			"sql",
			"server",
			"theme",
			"terminal-commands"
		]));
	}
};
//#endregion
export { te as DavyJonesLocker, b as createAppCommands, q as createDuckdbSql, k as createEngineClient, $ as createLocalGraphStorage, A as defineServerKinds, J as duckdbSql, y as localSettings };
