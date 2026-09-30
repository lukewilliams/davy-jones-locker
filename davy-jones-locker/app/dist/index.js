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
			e.state = "connected", e.address = n.host && n.port ? `${n.host}:${n.port}` : location.host, JSON.stringify(n.assistant ?? null) !== JSON.stringify(e.assistant) && (e.assistant = n.assistant ?? null), JSON.stringify(n.nodes ?? []) !== JSON.stringify(e.nodes) && (e.nodes = n.nodes ?? []);
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
//#region duckdbSql.js
var _ = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.32.0/+esm", v = "https://cdn.jsdelivr.net/npm/sql.js@1.13.0";
function y(e) {
	let t = null;
	return () => (t ??= e(), t.catch(() => t = null), t);
}
var b = y(async () => {
	let e = await import(
		/* @vite-ignore */
		_
), t = await e.selectBundle(e.getJsDelivrBundles()), n = URL.createObjectURL(new Blob([`importScripts("${t.mainWorker}");`], { type: "text/javascript" })), r = new e.AsyncDuckDB(new e.VoidLogger(), new Worker(n));
	return await r.instantiate(t.mainModule, t.pthreadWorker), URL.revokeObjectURL(n), {
		db: r,
		conn: await r.connect()
	};
}), x = y(async () => {
	let e = await import(
		/* @vite-ignore */
		`${v}/+esm`
);
	return (e.default ?? e)({ locateFile: (e) => `${v}/dist/${e}` });
});
function S(e, t) {
	if (e == null) return null;
	let n = String(t);
	return n.startsWith("Decimal") ? C(String(e), t.scale) : n.startsWith("Date") ? new Date(e).toISOString().slice(0, 10) : n.startsWith("Timestamp") ? new Date(e).toISOString().replace("T", " ").replace(/\.000Z|Z/, "") : w(e);
}
function C(e, t) {
	if (!t) return e;
	let n = e.startsWith("-"), r = (n ? e.slice(1) : e).padStart(t + 1, "0");
	return `${n ? "-" : ""}${r.slice(0, -t)}.${r.slice(-t)}`;
}
function w(e) {
	return typeof e == "bigint" ? Number.isSafeInteger(Number(e)) ? Number(e) : String(e) : typeof e != "object" || !e ? e : typeof e.toJSON == "function" ? w(e.toJSON()) : Array.isArray(e) || ArrayBuffer.isView(e) ? Array.from(e, w) : Object.fromEntries(Object.entries(e).map(([e, t]) => [e, w(t)]));
}
var T = (e) => `\\x${Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("")}`, E = (e) => `"${e.replaceAll("\"", "\"\"")}"`, D = {
	async query(e) {
		let { conn: t } = await b(), n = await t.query(e), r = n.schema.fields, i = r.map((e, t) => ({
			vector: n.getChildAt(t),
			type: e.type
		})), a = [];
		for (let e = 0; e < n.numRows; e++) a.push(i.map((t) => S(t.vector.get(e), t.type)));
		return {
			columns: r.map((e) => e.name),
			rows: a
		};
	},
	async registerFile(e, t) {
		let { db: n } = await b();
		await n.registerFileBuffer(e, t.slice());
	},
	async readFile(e) {
		let { db: t } = await b();
		return t.copyFileToBuffer(e);
	},
	async dropFile(e) {
		let { db: t } = await b();
		await t.dropFile(e);
	},
	async readSqlite(e) {
		let t = new (await (x())).Database(e);
		try {
			return (t.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")[0]?.values ?? []).map(([e]) => ({
				name: e,
				columns: (t.exec(`PRAGMA table_info(${E(e)})`)[0]?.values ?? []).map((e) => e[1]),
				rows: (t.exec(`SELECT * FROM ${E(e)}`)[0]?.values ?? []).map((e) => e.map((e) => e instanceof Uint8Array ? T(e) : e))
			}));
		} finally {
			t.close();
		}
	},
	async writeSqlite(e) {
		let t = new (await (x())).Database();
		try {
			for (let { name: n, columns: r, rows: i } of e) {
				t.run(`CREATE TABLE ${E(n)} (${r.map(E).join(", ")})`);
				let e = t.prepare(`INSERT INTO ${E(n)} VALUES (${r.map(() => "?").join(", ")})`);
				for (let t of i) e.run(t.map((e) => typeof e == "boolean" ? Number(e) : typeof e == "object" && e ? JSON.stringify(e) : e));
				e.free();
			}
			return t.export();
		} finally {
			t.close();
		}
	}
}, O = "files";
function k(e = "davy-jones-locker") {
	let t = `${e}:open-graph`, n = null, r = () => n ??= new Promise((t, n) => {
		let r = indexedDB.open(e, 1);
		r.onupgradeneeded = () => r.result.createObjectStore(O), r.onsuccess = () => t(r.result), r.onerror = () => n(r.error);
	});
	async function i(e, t) {
		let n = await r();
		return new Promise((r, i) => {
			let a = t(n.transaction(O, e).objectStore(O));
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
var A = {
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
		}
	},
	setup(n) {
		let i = n, o = i.engineUrl ? h({
			url: i.engineUrl,
			name: i.engineName
		}) : null;
		o && g(o);
		let s = k(i.storageName);
		return (n, i) => (t(), e(r(a), {
			storage: r(s),
			sql: r(D),
			server: r(o)
		}, null, 8, [
			"storage",
			"sql",
			"server"
		]));
	}
};
//#endregion
export { A as DavyJonesLocker, h as createEngineClient, k as createLocalGraphStorage, g as defineServerKinds, D as duckdbSql };
