import { createBlock as e, openBlock as t, reactive as n, unref as r } from "vue";
import { FlowgraphEditor as i } from "seamonster";
//#region engineClient.js
var a = 5e3, o = 15e3, s = 3e3, c = "application/vnd.apache.parquet";
function l(e, t) {
	let n = new FormData();
	for (let [t, r] of Object.entries(e)) n.append(t, r);
	for (let { name: e, bytes: r } of t) n.append("input", new Blob([r], { type: c }), e);
	return n;
}
function u({ url: e, name: t = "The engine" }) {
	let r = e.replace(/\/+$/, "");
	async function i(e) {
		try {
			let { error: t } = await e.json();
			if (t) return Error(t);
		} catch {}
		return /* @__PURE__ */ Error(`${t} answered ${e.status} ${e.statusText}.`);
	}
	async function c(e, n) {
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
	let u = (e, t, n) => c(e, { body: l(t, n) }), d = {
		status: n({
			state: "checking",
			address: null,
			assistant: null
		}),
		async query({ sql: e, inputs: t = [] }) {
			let n = await u("/query", { sql: e }, t);
			return new Uint8Array(await n.arrayBuffer());
		},
		async runPython({ code: e, inputs: t = [] }) {
			let n = await (await u("/run/python", { code: e }, t)).formData(), r = JSON.parse(n.get("result")), i = n.get("table");
			return i ? {
				...r,
				table: new Uint8Array(await i.arrayBuffer())
			} : r;
		},
		async assist(e) {
			return (await c("/assist", {
				headers: { "content-type": "application/json" },
				body: JSON.stringify(e)
			})).json();
		}
	}, f = null;
	async function p() {
		let { status: e } = d;
		clearTimeout(f);
		try {
			let t = await fetch(`${r}/health`, {
				cache: "no-store",
				signal: AbortSignal.timeout(s)
			}), n = t.ok && t.headers.get("content-type")?.includes("json") ? await t.json() : null;
			if (n?.status !== "ok") throw Error("not the engine");
			e.state = "connected", e.address = n.host && n.port ? `${n.host}:${n.port}` : location.host, JSON.stringify(n.assistant ?? null) !== JSON.stringify(e.assistant) && (e.assistant = n.assistant ?? null);
		} catch {
			e.state = "unavailable", e.address = null, e.assistant = null;
		}
		document.visibilityState === "visible" && (f = setTimeout(p, e.state === "connected" ? a : o));
	}
	return p(), document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && p()), window.addEventListener("online", p), window.addEventListener("offline", p), d;
}
//#endregion
//#region duckdbSql.js
var d = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.32.0/+esm", f = "https://cdn.jsdelivr.net/npm/sql.js@1.13.0";
function p(e) {
	let t = null;
	return () => (t ??= e(), t.catch(() => t = null), t);
}
var m = p(async () => {
	let e = await import(
		/* @vite-ignore */
		d
), t = await e.selectBundle(e.getJsDelivrBundles()), n = URL.createObjectURL(new Blob([`importScripts("${t.mainWorker}");`], { type: "text/javascript" })), r = new e.AsyncDuckDB(new e.VoidLogger(), new Worker(n));
	return await r.instantiate(t.mainModule, t.pthreadWorker), URL.revokeObjectURL(n), {
		db: r,
		conn: await r.connect()
	};
}), h = p(async () => {
	let e = await import(
		/* @vite-ignore */
		`${f}/+esm`
);
	return (e.default ?? e)({ locateFile: (e) => `${f}/dist/${e}` });
});
function g(e, t) {
	if (e == null) return null;
	let n = String(t);
	return n.startsWith("Decimal") ? _(String(e), t.scale) : n.startsWith("Date") ? new Date(e).toISOString().slice(0, 10) : n.startsWith("Timestamp") ? new Date(e).toISOString().replace("T", " ").replace(/\.000Z|Z/, "") : v(e);
}
function _(e, t) {
	if (!t) return e;
	let n = e.startsWith("-"), r = (n ? e.slice(1) : e).padStart(t + 1, "0");
	return `${n ? "-" : ""}${r.slice(0, -t)}.${r.slice(-t)}`;
}
function v(e) {
	return typeof e == "bigint" ? Number.isSafeInteger(Number(e)) ? Number(e) : String(e) : typeof e != "object" || !e ? e : typeof e.toJSON == "function" ? v(e.toJSON()) : Array.isArray(e) || ArrayBuffer.isView(e) ? Array.from(e, v) : Object.fromEntries(Object.entries(e).map(([e, t]) => [e, v(t)]));
}
var y = (e) => `\\x${Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("")}`, b = (e) => `"${e.replaceAll("\"", "\"\"")}"`, x = {
	async query(e) {
		let { conn: t } = await m(), n = await t.query(e), r = n.schema.fields, i = r.map((e, t) => ({
			vector: n.getChildAt(t),
			type: e.type
		})), a = [];
		for (let e = 0; e < n.numRows; e++) a.push(i.map((t) => g(t.vector.get(e), t.type)));
		return {
			columns: r.map((e) => e.name),
			rows: a
		};
	},
	async registerFile(e, t) {
		let { db: n } = await m();
		await n.registerFileBuffer(e, t.slice());
	},
	async readFile(e) {
		let { db: t } = await m();
		return t.copyFileToBuffer(e);
	},
	async dropFile(e) {
		let { db: t } = await m();
		await t.dropFile(e);
	},
	async readSqlite(e) {
		let t = new (await (h())).Database(e);
		try {
			return (t.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")[0]?.values ?? []).map(([e]) => ({
				name: e,
				columns: (t.exec(`PRAGMA table_info(${b(e)})`)[0]?.values ?? []).map((e) => e[1]),
				rows: (t.exec(`SELECT * FROM ${b(e)}`)[0]?.values ?? []).map((e) => e.map((e) => e instanceof Uint8Array ? y(e) : e))
			}));
		} finally {
			t.close();
		}
	},
	async writeSqlite(e) {
		let t = new (await (h())).Database();
		try {
			for (let { name: n, columns: r, rows: i } of e) {
				t.run(`CREATE TABLE ${b(n)} (${r.map(b).join(", ")})`);
				let e = t.prepare(`INSERT INTO ${b(n)} VALUES (${r.map(() => "?").join(", ")})`);
				for (let t of i) e.run(t.map((e) => typeof e == "boolean" ? Number(e) : typeof e == "object" && e ? JSON.stringify(e) : e));
				e.free();
			}
			return t.export();
		} finally {
			t.close();
		}
	}
}, S = "files";
function C(e = "davy-jones-locker") {
	let t = `${e}:open-graph`, n = null, r = () => n ??= new Promise((t, n) => {
		let r = indexedDB.open(e, 1);
		r.onupgradeneeded = () => r.result.createObjectStore(S), r.onsuccess = () => t(r.result), r.onerror = () => n(r.error);
	});
	async function i(e, t) {
		let n = await r();
		return new Promise((r, i) => {
			let a = t(n.transaction(S, e).objectStore(S));
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
var w = {
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
		let a = n, o = a.engineUrl ? u({
			url: a.engineUrl,
			name: a.engineName
		}) : null, s = C(a.storageName);
		return (n, a) => (t(), e(r(i), {
			storage: r(s),
			sql: r(x),
			server: r(o)
		}, null, 8, [
			"storage",
			"sql",
			"server"
		]));
	}
};
//#endregion
export { w as DavyJonesLocker, u as createEngineClient, C as createLocalGraphStorage, x as duckdbSql };
