import { createBlock as e, openBlock as t, reactive as n, unref as r, watch as i } from "vue";
import { FlowgraphEditor as a, NODE_CATEGORIES as o, NODE_KINDS as s, defineNodeCategory as c, defineNodeKind as l } from "seamonster";
//#region engineClient.js
var u = 5e3, d = 15e3, f = 3e3, p = "application/vnd.apache.parquet";
function m(e, t) {
	let n = new FormData();
	for (let [t, r] of Object.entries(e)) n.append(t, r);
	for (let { name: e, bytes: r } of t) n.append("input", new Blob([r], { type: p }), e);
	return n;
}
function h({ url: e, name: t = "The engine" }) {
	let r = e.replace(/\/+$/, "");
	async function i(e) {
		try {
			let { error: t } = await e.json();
			if (t) return Error(t);
		} catch {}
		return /* @__PURE__ */ Error(`${t} answered ${e.status} ${e.statusText}.`);
	}
	async function a(e, n) {
		let a;
		try {
			a = await fetch(`${r}${e}`, {
				method: "POST",
				...n
			});
		} catch {
			throw Error(`${t} couldn't be reached.`);
		}
		if (!a.ok) throw await i(a);
		return a;
	}
	let o = (e, t, n) => a(e, { body: m(t, n) }), s = {
		status: n({
			state: "checking",
			address: null,
			local: !1,
			assistant: null,
			nodes: []
		}),
		async query({ sql: e, inputs: t = [] }) {
			let n = await o("/query", { sql: e }, t);
			return new Uint8Array(await n.arrayBuffer());
		},
		async runPython({ code: e, inputs: t = [] }) {
			let n = await (await o("/run/python", { code: e }, t)).formData(), r = JSON.parse(n.get("result")), i = n.get("table");
			return i ? {
				...r,
				table: new Uint8Array(await i.arrayBuffer())
			} : r;
		},
		async runNode({ kind: e, node: t, inputs: n = [], files: r = [] }) {
			let i = new FormData();
			i.append("kind", e), i.append("node", JSON.stringify(t));
			let o = n.map((e, t) => {
				let { ref: n, id: r, slot: a, pin: o } = e;
				return e.tables ? {
					ref: n,
					id: r,
					slot: a,
					pin: o,
					tables: e.tables.map((e, n) => (i.append("input", new Blob([e.bytes], { type: p }), `i${t}-${n}`), {
						name: e.name,
						part: `i${t}-${n}`
					}))
				} : (i.append("input", new Blob([e.bytes], { type: p }), `i${t}`), {
					ref: n,
					id: r,
					slot: a,
					pin: o,
					part: `i${t}`
				});
			});
			i.append("inputs", JSON.stringify(o));
			for (let { key: e, bytes: t } of r) i.append("file", new Blob([t]), e);
			let s = await (await a("/run/node", { body: i })).formData(), c = JSON.parse(s.get("result")), l = /* @__PURE__ */ new Map();
			for (let e of s.getAll("table")) l.set(e.name, new Uint8Array(await e.arrayBuffer()));
			let u = (c.outputs ?? []).map((e) => e.tables ? {
				slot: e.slot,
				tables: e.tables.map((e) => ({
					name: e.name,
					bytes: l.get(e.part)
				}))
			} : {
				slot: e.slot,
				bytes: l.get(e.part)
			});
			return {
				...c,
				outputs: u
			};
		},
		async nodes() {
			let e = await fetch(`${r}/nodes`, { cache: "no-store" });
			if (!e.ok) throw await i(e);
			return e.json();
		},
		async assist(e) {
			return (await a("/assist", {
				headers: { "content-type": "application/json" },
				body: JSON.stringify(e)
			})).json();
		}
	}, c = null;
	async function l() {
		let { status: e } = s;
		clearTimeout(c);
		try {
			let t = await fetch(`${r}/health`, {
				cache: "no-store",
				signal: AbortSignal.timeout(f)
			}), n = t.ok && t.headers.get("content-type")?.includes("json") ? await t.json() : null;
			if (n?.status !== "ok") throw Error("not the engine");
			e.state = "connected", e.address = n.host && n.port ? `${n.host}:${n.port}` : location.host, e.local = n.local === !0, JSON.stringify(n.assistant ?? null) !== JSON.stringify(e.assistant) && (e.assistant = n.assistant ?? null), JSON.stringify(n.nodes ?? []) !== JSON.stringify(e.nodes) && (e.nodes = n.nodes ?? []);
		} catch {
			e.state = "unavailable", e.address = null, e.assistant = null;
		}
		document.visibilityState === "visible" && (c = setTimeout(l, e.state === "connected" ? u : d));
	}
	return l(), document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && l()), window.addEventListener("online", l), window.addEventListener("offline", l), s;
}
//#endregion
//#region serverKinds.js
function g(e, { log: t = (e) => console.warn(e) } = {}) {
	let n = null;
	return i(() => e.status.nodes, async (r) => {
		if (!r?.length || r.every((e) => e in s)) return;
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
		for (let e of a.categories ?? []) if (!o.some((t) => t.id === e.id)) try {
			c(e);
		} catch (n) {
			t(`The server's node category ${e.id} can't be used here: ${n.message}`, "error");
		}
		for (let e of a.kinds ?? []) if (!(e.kind in s)) try {
			l({
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
var _ = "1.33.1-dev64.0", v = "duckdb-extensions", y = `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${_}/+esm`, b = "https://cdn.jsdelivr.net/npm/sql.js@1.13.0";
function x(e) {
	let t = null;
	return () => (t ??= e(), t.catch(() => t = null), t);
}
async function S() {
	let e = await import(
		/* @vite-ignore */
		y
), t = await e.selectBundle(e.getJsDelivrBundles()), n = URL.createObjectURL(new Blob([`importScripts("${t.mainWorker}");`], { type: "text/javascript" })), r = new e.AsyncDuckDB(new e.VoidLogger(), new Worker(n));
	return await r.instantiate(t.mainModule, t.pthreadWorker), URL.revokeObjectURL(n), {
		db: r,
		conn: await r.connect()
	};
}
var C = /it exists in the spatial extension/, w = (e) => new URL(e.replace(/\/?$/, "/"), document.baseURI).href.replace(/\/$/, "");
async function T(e, t) {
	try {
		await e.query(`INSTALL spatial FROM ${N(t)}`), await e.query("LOAD spatial");
	} catch (e) {
		let n = String(e?.message ?? e).split("\n")[0], r = "The app serves it (davy-jones-locker-extensions): see \"DuckDB's extensions\" in the davy-jones-locker README.", i = /Extension "(https?:[^"]+\.wasm)"/.exec(n)?.[1];
		throw i && !await E(i) ? Error(`This query needs DuckDB's spatial extension, which isn't at ${i}. ${r}`) : Error(`This query needs DuckDB's spatial extension, which couldn't be loaded from ${t} (${n}). ${r}`);
	}
	await e.query("SET geometry_always_xy = true");
}
async function E(e) {
	try {
		let t = await fetch(e, { method: "HEAD" });
		return t.ok && !String(t.headers.get("content-type")).includes("text/html");
	} catch {
		return !1;
	}
}
var D = x(async () => {
	let e = await import(
		/* @vite-ignore */
		`${b}/+esm`
);
	return (e.default ?? e)({ locateFile: (e) => `${b}/dist/${e}` });
});
function O(e, t) {
	if (e == null) return null;
	let n = String(t);
	return n.startsWith("Decimal") ? k(String(e), t.scale) : n.startsWith("Date") ? new Date(e).toISOString().slice(0, 10) : n.startsWith("Timestamp") ? new Date(e).toISOString().replace("T", " ").replace(/\.000Z|Z/, "") : A(e);
}
function k(e, t) {
	if (!t) return e;
	let n = e.startsWith("-"), r = (n ? e.slice(1) : e).padStart(t + 1, "0");
	return `${n ? "-" : ""}${r.slice(0, -t)}.${r.slice(-t)}`;
}
function A(e) {
	return typeof e == "bigint" ? Number.isSafeInteger(Number(e)) ? Number(e) : String(e) : typeof e != "object" || !e ? e : typeof e.toJSON == "function" ? A(e.toJSON()) : Array.isArray(e) || ArrayBuffer.isView(e) ? Array.from(e, A) : Object.fromEntries(Object.entries(e).map(([e, t]) => [e, A(t)]));
}
var j = (e) => `\\x${Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("")}`, M = (e) => `"${e.replaceAll("\"", "\"\"")}"`, N = (e) => `'${e.replaceAll("'", "''")}'`;
function P({ extensionRepository: e = v } = {}) {
	let t = x(S), n = x(async () => T((await t()).conn, w(e))), r = async (e) => (await t()).conn.query(e);
	return {
		async query(e) {
			let t;
			try {
				t = await r(e);
			} catch (i) {
				if (!C.test(String(i?.message))) throw i;
				await n(), t = await r(e);
			}
			return I(t);
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
		readSqlite: L,
		writeSqlite: R
	};
}
var F = P();
function I(e) {
	let t = e.schema.fields, n = t.map((t, n) => ({
		vector: e.getChildAt(n),
		type: t.type
	})), r = [];
	for (let t = 0; t < e.numRows; t++) r.push(n.map((e) => O(e.vector.get(t), e.type)));
	return {
		columns: t.map((e) => e.name),
		rows: r
	};
}
async function L(e) {
	let t = new (await (D())).Database(e);
	try {
		return (t.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")[0]?.values ?? []).map(([e]) => ({
			name: e,
			columns: (t.exec(`PRAGMA table_info(${M(e)})`)[0]?.values ?? []).map((e) => e[1]),
			rows: (t.exec(`SELECT * FROM ${M(e)}`)[0]?.values ?? []).map((e) => e.map((e) => e instanceof Uint8Array ? j(e) : e))
		}));
	} finally {
		t.close();
	}
}
async function R(e, { statements: t = [] } = {}) {
	let n = new (await (D())).Database(), r = (e) => typeof e == "boolean" ? Number(e) : e instanceof Uint8Array || typeof e != "object" || !e ? e : JSON.stringify(e);
	try {
		for (let { name: t, columns: i, rows: a, types: o } of e) {
			let e = i.map((e, t) => o?.[t] ? `${M(e)} ${o[t]}` : M(e));
			n.run(`CREATE TABLE ${M(t)} (${e.join(", ")})`);
			let s = n.prepare(`INSERT INTO ${M(t)} VALUES (${i.map(() => "?").join(", ")})`);
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
var z = "files";
function B(e = "davy-jones-locker") {
	let t = `${e}:open-graph`, n = null, r = () => n ??= new Promise((t, n) => {
		let r = indexedDB.open(e, 1);
		r.onupgradeneeded = () => r.result.createObjectStore(z), r.onsuccess = () => t(r.result), r.onerror = () => n(r.error);
	});
	async function i(e, t) {
		let n = await r();
		return new Promise((r, i) => {
			let a = t(n.transaction(z, e).objectStore(z));
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
var V = {
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
		}
	},
	setup(n) {
		let i = n, o = i.engineUrl ? h({
			url: i.engineUrl,
			name: i.engineName
		}) : null;
		o && g(o);
		let s = B(i.storageName), c = P({ extensionRepository: i.extensionRepository });
		return (n, i) => (t(), e(r(a), {
			storage: r(s),
			sql: r(c),
			server: r(o)
		}, null, 8, [
			"storage",
			"sql",
			"server"
		]));
	}
};
//#endregion
export { V as DavyJonesLocker, P as createDuckdbSql, h as createEngineClient, B as createLocalGraphStorage, g as defineServerKinds, F as duckdbSql };
