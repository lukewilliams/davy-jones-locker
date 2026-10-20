import { r as e } from "./menu-ByXvYfw3.js";
import { a as t, c as n, i as r, n as i, o as a, r as o, s, t as c } from "./panels-dfiW9ww3.js";
import { Fragment as l, computed as u, createBlock as d, createCommentVNode as f, createElementBlock as p, createElementVNode as m, createTextVNode as h, createVNode as g, inject as _, markRaw as v, nextTick as y, normalizeClass as b, normalizeStyle as x, onBeforeUnmount as S, onMounted as C, openBlock as w, provide as T, reactive as E, ref as D, renderList as O, resolveDynamicComponent as ee, shallowReactive as k, toDisplayString as A, unref as j, useId as M, vModelDynamic as te, vModelText as N, watch as P, withCtx as F, withDirectives as I, withKeys as L, withModifiers as ne } from "vue";
import { ConnectionMode as R, Handle as z, Position as re, VueFlow as B, getBezierPath as ie, useNodeConnections as ae, useVueFlow as V } from "@vue-flow/core";
import { Background as oe } from "@vue-flow/background";
//#region components/NodeFace.vue
var H = ["title"], U = { class: "flow-node-label" }, se = {
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
		}, A(e.status), 9, H), m("span", U, A(e.label), 1)], 2));
	}
}, W = {
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
		write: !0,
		geo: !0,
		multi: "layers"
	},
	kml: {
		label: "KML",
		extensions: ["kml"],
		contentType: "application/vnd.google-earth.kml+xml",
		read: !0,
		write: !0,
		writeTables: !0,
		geo: !0,
		multi: "layers"
	},
	shapefile: {
		label: "Shapefile (.zip)",
		extensions: ["zip"],
		contentType: "application/zip",
		read: !0,
		write: !0,
		writeTables: !0,
		geo: !0,
		multi: "layers"
	},
	gpkg: {
		label: "GeoPackage",
		extensions: ["gpkg"],
		contentType: "application/geopackage+sqlite3",
		read: !0,
		write: !0,
		writeTables: !0,
		geo: !0,
		multi: "layers"
	},
	fgb: {
		label: "FlatGeobuf",
		extensions: ["fgb"],
		contentType: "application/flatgeobuf",
		read: !0,
		write: !1,
		geo: !0,
		multi: "layers"
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
		writeTables: !0,
		multi: "read-write"
	}
}, ce = Object.keys(W).filter((e) => W[e].read), le = Object.keys(W).filter((e) => W[e].write), ue = ce.flatMap((e) => W[e].extensions).map((e) => `.${e}`).join(",");
function de(e) {
	let t = W[e.format]?.multi;
	return t === "layers" ? e.tables.length > 1 : !!t;
}
var fe = (e) => /\.([^./\\]+)$/.exec(e)?.[1].toLowerCase() ?? "";
function pe(e) {
	let t = fe(e);
	return Object.keys(W).find((e) => W[e].extensions.includes(t)) ?? null;
}
function me(e, t) {
	let { extensions: n } = W[t];
	return n.includes(fe(e)) ? e : `${e}.${n[0]}`;
}
var he = (e) => e.replace(/\.[^.]*$/, "").replace(/[_\-\s]+/g, " ").trim();
function ge(e) {
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
var _e = {
	format: "pipeline",
	nodes: [],
	edges: []
};
function ve(e, t, n) {
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
var ye = (e) => Number.isFinite(e?.x) && Number.isFinite(e?.y);
function be(e) {
	if (e?.format !== "pipeline" || !Array.isArray(e.nodes) || !Array.isArray(e.edges)) return null;
	let t = e.nodes.filter((e) => typeof e?.id == "string" && typeof e.kind == "string" && e.kind && ye(e.position)).map(({ id: e, position: t, ...n }) => ({
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
		viewport: ye(e.viewport) && Number.isFinite(e.viewport.zoom) ? e.viewport : null
	};
}
//#endregion
//#region lib/sqlText.js
var G = (e) => `"${e.replaceAll("\"", "\"\"")}"`, K = (e) => `'${e.replaceAll("'", "''")}'`, xe = (e) => Uint8Array.from(e.match(/../g) ?? [], (e) => parseInt(e, 16));
async function Se(e, t, n, r) {
	let i = await e.query(`COPY (${t}) TO ${K(n)} (${r})`);
	return Number(i.rows[0]?.[0] ?? 0);
}
async function Ce(e) {
	await e.query("INSTALL excel"), await e.query("LOAD excel");
}
//#endregion
//#region lib/crs.js
var we = new TextEncoder(), Te = /* @__PURE__ */ new WeakMap();
function Ee(e) {
	return Te.has(e) || Te.set(e, /* @__PURE__ */ new Map()), Te.get(e);
}
function De(e, t) {
	let n = Ee(e);
	if (!n.has(t)) {
		let r = Oe(e, t);
		n.set(t, r), r.catch(() => n.delete(t));
	}
	return n.get(t);
}
async function Oe(e, t) {
	let n = `flow-crs-${Date.now()}-${Math.random().toString(36).slice(2)}.geojson`, r = {
		type: "FeatureCollection",
		crs: {
			type: "name",
			properties: { name: t }
		},
		features: []
	};
	await e.registerFile(n, we.encode(JSON.stringify(r)));
	try {
		let { rows: r } = await e.query(`SELECT unnest(layers).geometry_fields[1].crs FROM ST_Read_Meta(${K(n)})`), i = r[0]?.[0];
		if (!i?.wkt) throw Error(`GDAL doesn't know the CRS ${t.length > 60 ? `${t.slice(0, 60)}…` : t}.`);
		return i;
	} finally {
		await e.dropFile(n);
	}
}
async function ke(e, t) {
	let n = await De(e, t), r = JSON.parse(n.projjson), i = r.type === "ProjectedCRS" ? r.base_crs : r;
	return {
		name: n.name ?? r.name,
		geographic: r.type === "GeographicCRS" || r.type === "GeodeticCRS" && r.coordinate_system?.subtype === "ellipsoidal",
		datum: i?.datum?.name ?? i?.datum_ensemble?.name ?? null,
		base: {
			name: i?.name ?? null,
			id: i?.id ? `${i.id.authority}:${i.id.code}` : null
		},
		bbox: r.bbox ?? null
	};
}
async function Ae(e, t, n) {
	let r = await ke(e, t), i = await ke(e, n);
	if (!r.datum || !i.datum || r.datum === i.datum || !r.base.id || !i.base.id || r.base.id === i.base.id) return null;
	let [a, o] = je(r.bbox, i.bbox), { rows: s } = await e.query(`SELECT ST_X(p), ST_Y(p) FROM (SELECT ST_Transform(ST_Point(${a}, ${o}), ${K(r.base.id)}, ${K(i.base.id)}) AS p)`), [c, l] = s[0];
	return Math.abs(c - a) < 1e-9 && Math.abs(l - o) < 1e-9 ? {
		from: r,
		to: i
	} : null;
}
function je(e, t) {
	if (!e) return [0, 0];
	let n = (e) => {
		let t = e.east_longitude < e.west_longitude ? e.east_longitude + 360 : e.east_longitude;
		return {
			west: e.west_longitude,
			east: t,
			south: e.south_latitude,
			north: e.north_latitude
		};
	}, r = n(e), i = t ? n(t) : r, a = {
		west: Math.max(r.west, i.west),
		east: Math.min(r.east, i.east),
		south: Math.max(r.south, i.south),
		north: Math.min(r.north, i.north)
	}, o = a.west < a.east && a.south < a.north ? a : r, s = (o.west + o.east) / 2;
	return s > 180 && (s -= 360), [s, (o.south + o.north) / 2];
}
//#endregion
//#region lib/zip.js
var Me = 101010256, Ne = 33639248, Pe = 67324752;
async function Fe(e) {
	let t = new DataView(e.buffer, e.byteOffset, e.byteLength), n = Ie(t), r = t.getUint16(n + 10, !0), i = t.getUint32(n + 16, !0);
	if (i === 4294967295 || r === 65535) throw Error("This zip is a Zip64 file, which can't be read here.");
	let a = [];
	for (let n = 0; n < r; n++) {
		if (t.getUint32(i, !0) !== Ne) throw Error("This zip file is damaged.");
		let n = t.getUint16(i + 8, !0), r = t.getUint16(i + 10, !0), o = t.getUint32(i + 20, !0), s = t.getUint16(i + 28, !0), c = t.getUint16(i + 30, !0), l = t.getUint16(i + 32, !0), u = t.getUint32(i + 42, !0), d = new TextDecoder(n & 2048 ? "utf-8" : "latin1").decode(e.subarray(i + 46, i + 46 + s));
		if (i += 46 + s + c + l, d.endsWith("/")) continue;
		if (n & 1) throw Error(`${d} in this zip is encrypted, so it can't be read.`);
		if (t.getUint32(u, !0) !== Pe) throw Error("This zip file is damaged.");
		let f = u + 30 + t.getUint16(u + 26, !0) + t.getUint16(u + 28, !0), p = e.subarray(f, f + o);
		if (r === 0) a.push({
			name: d,
			bytes: p.slice()
		});
		else if (r === 8) a.push({
			name: d,
			bytes: await Le(p)
		});
		else throw Error(`${d} in this zip is compressed in a way that can't be read here (method ${r}).`);
	}
	return a;
}
function Ie(e) {
	for (let t = e.byteLength - 22; t >= Math.max(0, e.byteLength - 22 - 65535); t--) if (e.getUint32(t, !0) === Me) return t;
	throw Error("This isn't a zip file.");
}
async function Le(e) {
	let t = new Blob([e]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
	return new Uint8Array(await new Response(t).arrayBuffer());
}
async function Re(e) {
	let t = new TextEncoder(), n = [], r = [], i = 0;
	for (let a of e) {
		let e = t.encode(a.name), o = Ue(a.bytes), s = await Be(a.bytes), c = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(30));
		c.setUint32(0, Pe, !0), ze(c, 4, {
			crc: o,
			size: s.length,
			rawSize: a.bytes.length,
			nameLength: e.length
		});
		let l = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(46));
		l.setUint32(0, Ne, !0), l.setUint16(4, 20, !0), ze(l, 6, {
			crc: o,
			size: s.length,
			rawSize: a.bytes.length,
			nameLength: e.length
		}), l.setUint32(42, i, !0), n.push(new Uint8Array(c.buffer), e, s), r.push(new Uint8Array(l.buffer), e), i += 30 + e.length + s.length;
	}
	let a = r.reduce((e, t) => e + t.length, 0), o = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(22));
	return o.setUint32(0, Me, !0), o.setUint16(8, e.length, !0), o.setUint16(10, e.length, !0), o.setUint32(12, a, !0), o.setUint32(16, i, !0), Ve([
		...n,
		...r,
		new Uint8Array(o.buffer)
	]);
}
function ze(e, t, { crc: n, size: r, rawSize: i, nameLength: a }) {
	e.setUint16(t, 20, !0), e.setUint16(t + 2, 2048, !0), e.setUint16(t + 4, 8, !0), e.setUint16(t + 6, 0, !0), e.setUint16(t + 8, 33, !0), e.setUint32(t + 10, n, !0), e.setUint32(t + 14, r, !0), e.setUint32(t + 18, i, !0), e.setUint16(t + 22, a, !0);
}
async function Be(e) {
	let t = new Blob([e]).stream().pipeThrough(new CompressionStream("deflate-raw"));
	return new Uint8Array(await new Response(t).arrayBuffer());
}
function Ve(e) {
	let t = new Uint8Array(e.reduce((e, t) => e + t.length, 0)), n = 0;
	for (let r of e) t.set(r, n), n += r.length;
	return t;
}
var He = null;
function Ue(e) {
	if (!He) {
		He = /* @__PURE__ */ new Uint32Array(256);
		for (let e = 0; e < 256; e++) {
			let t = e;
			for (let e = 0; e < 8; e++) t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
			He[e] = t >>> 0;
		}
	}
	let t = 4294967295;
	for (let n of e) t = He[(t ^ n) & 255] ^ t >>> 8;
	return (t ^ 4294967295) >>> 0;
}
//#endregion
//#region lib/geoExport.js
var We = new TextEncoder();
function Ge(e) {
	let t = /^GEOMETRY(?:\('(.*)'\))?$/s.exec(String(e));
	if (t) return t[1] === void 0 ? null : t[1].replaceAll("''", "'");
}
async function Ke(e, t) {
	let { rows: n } = await e.query(`DESCRIBE SELECT * FROM ${t}`);
	return n.map(([e, t]) => ({
		name: e,
		type: String(t),
		crs: Ge(t)
	}));
}
var qe = (e) => e.crs !== void 0;
function Je(e) {
	let t = e.filter(qe);
	return t.find((e) => e.name.toLowerCase() === "geometry") ?? t[0] ?? null;
}
var Ye = ["EPSG:4326", "OGC:CRS84"];
function Xe(e, t) {
	if (e.crs === null) throw Error(`The CRS of ${e.name} isn't known, so it can't be written as ${t} (longitude and latitude).`);
	let n = G(e.name);
	return `ST_AsGeoJSON(${Ye.includes(e.crs) ? n : `ST_Transform(${n}, 'EPSG:4326')`})`;
}
async function Ze(e, t, n) {
	let r = await Ke(e, t), i = Je(r), a = r.map((e) => qe(e) ? `${Xe(e, n)} AS ${G(e.name)}` : /^DECIMAL/.test(e.type) ? `CAST(${G(e.name)} AS DOUBLE) AS ${G(e.name)}` : G(e.name)), { rows: o } = await e.query(`SELECT ${a.join(", ")} FROM ${t}`), s = i ? r.indexOf(i) : r.findIndex((e) => e.name.toLowerCase() === "geometry");
	return {
		columns: r.map((e) => e.name),
		rows: o,
		geometry: s
	};
}
var Qe = (e) => typeof e == "string" ? JSON.parse(e) : e ?? null;
async function $e(e, t) {
	let { columns: n, rows: r, geometry: i } = await Ze(e, t, "GeoJSON");
	if (i < 0) throw Error("GeoJSON needs a geometry column, like a geo file read by DataIngest has.");
	let a = {
		type: "FeatureCollection",
		features: r.map((e) => ({
			type: "Feature",
			geometry: Qe(e[i]),
			properties: Object.fromEntries(n.flatMap((t, n) => n === i ? [] : [[t, e[n]]]))
		}))
	};
	return We.encode(JSON.stringify(a));
}
var et = (e) => String(e).replace(/[<>&"']/g, (e) => `&${{
	"<": "lt",
	">": "gt",
	"&": "amp",
	"\"": "quot",
	"'": "apos"
}[e]};`);
async function tt(e, t, n) {
	let r = [];
	for (let n of t) {
		let { columns: i, rows: a, geometry: o } = await Ze(e, n.table, "KML");
		if (o < 0) throw Error(`KML needs a geometry column, and ${n.label ?? n.name} has none.`);
		let s = (e) => i.findIndex((t, n) => n !== o && t.toLowerCase() === e), c = s("name"), l = s("description"), u = a.map((e) => {
			let t = (t, n) => n >= 0 && e[n] !== null ? `<${t}>${et(nt(e[n]))}</${t}>` : "", n = i.map((t, n) => [
				o,
				c,
				l
			].includes(n) || e[n] === null ? "" : `<Data name="${et(t)}"><value>${et(nt(e[n]))}</value></Data>`).join("");
			return "<Placemark>" + t("name", c) + t("description", l) + (n ? `<ExtendedData>${n}</ExtendedData>` : "") + it(Qe(e[o])) + "</Placemark>";
		});
		r.push(t.length > 1 ? `<Folder><name>${et(n.label ?? n.name)}</name>${u.join("\n")}</Folder>` : u.join("\n"));
	}
	return We.encode(`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${et(n)}</name>\n${r.join("\n")}\n</Document></kml>\n`);
}
var nt = (e) => typeof e == "object" ? JSON.stringify(e) : String(e), rt = (e) => `<coordinates>${e.map((e) => e.join(",")).join(" ")}</coordinates>`;
function it(e) {
	if (!e) return "";
	let t = (e) => {
		let t = e.map(it).join("");
		return t ? `<MultiGeometry>${t}</MultiGeometry>` : "";
	};
	switch (e.type) {
		case "Point": return e.coordinates.length ? `<Point>${rt([e.coordinates])}</Point>` : "";
		case "LineString": return e.coordinates.length ? `<LineString>${rt(e.coordinates)}</LineString>` : "";
		case "Polygon": {
			if (!e.coordinates.length) return "";
			let [t, ...n] = e.coordinates, r = (e) => `<LinearRing>${rt(e)}</LinearRing>`;
			return `<Polygon><outerBoundaryIs>${r(t)}</outerBoundaryIs>` + n.map((e) => `<innerBoundaryIs>${r(e)}</innerBoundaryIs>`).join("") + "</Polygon>";
		}
		case "MultiPoint": return t(e.coordinates.map((e) => ({
			type: "Point",
			coordinates: e
		})));
		case "MultiLineString": return t(e.coordinates.map((e) => ({
			type: "LineString",
			coordinates: e
		})));
		case "MultiPolygon": return t(e.coordinates.map((e) => ({
			type: "Polygon",
			coordinates: e
		})));
		case "GeometryCollection": return t(e.geometries);
		default: return "";
	}
}
function at(e, t) {
	return e.filter((e) => e !== t).map((e) => {
		let t = G(e.name), n = e.type.toUpperCase();
		return qe(e) ? {
			name: e.name,
			kind: "text",
			select: `ST_AsText(${t})`
		} : n === "BOOLEAN" ? {
			name: e.name,
			kind: "boolean",
			select: t
		} : /^(U?(TINY|SMALL|BIG|HUGE)?INT(EGER)?)$/.test(n) ? {
			name: e.name,
			kind: "integer",
			select: t
		} : /^(FLOAT|REAL|DOUBLE|DECIMAL)/.test(n) ? {
			name: e.name,
			kind: "real",
			select: `CAST(${t} AS DOUBLE)`
		} : n === "DATE" ? {
			name: e.name,
			kind: "date",
			select: `strftime(${t}, '%Y-%m-%d')`
		} : n === "BLOB" ? {
			name: e.name,
			kind: "blob",
			select: `hex(${t})`
		} : {
			name: e.name,
			kind: "text",
			select: `CAST(${t} AS VARCHAR)`
		};
	});
}
async function ot(e, t) {
	if (!e.writeSqlite) throw Error("This SQL engine can't write SQLite files, so it can't write GeoPackages.");
	let n = await De(e, "EPSG:4326"), r = /* @__PURE__ */ new Map([
		[-1, [
			"Undefined cartesian SRS",
			-1,
			"NONE",
			-1,
			"undefined",
			"undefined cartesian coordinate reference system"
		]],
		[0, [
			"Undefined geographic SRS",
			0,
			"NONE",
			0,
			"undefined",
			"undefined geographic coordinate reference system"
		]],
		[4326, [
			"WGS 84 geodetic",
			4326,
			"EPSG",
			4326,
			n.wkt,
			"longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid"
		]]
	]), i = [], a = [];
	for (let n of t) {
		let t = await Ke(e, n.table), o = Je(t), s = at(t, o), c = new Set(s.map((e) => e.name.toLowerCase())), l = [
			[
				"fid",
				"ogc_fid",
				"gpkg_fid"
			].find((e) => !c.has(e)),
			...o ? [o.name] : [],
			...s.map((e) => e.name)
		], u = [
			"INTEGER PRIMARY KEY AUTOINCREMENT",
			...o ? ["GEOMETRY"] : [],
			...s.map((e) => st[e.kind])
		], d = -1;
		if (o?.crs) {
			let t = await De(e, o.crs), n = Number(t.auth_code);
			d = t.auth_name === "EPSG" && Number.isInteger(n) ? n : 1e5 + r.size, r.has(d) || r.set(d, [
				t.name,
				d,
				t.auth_name || "NONE",
				Number.isInteger(n) ? n : d,
				t.wkt,
				""
			]);
		}
		let f = o && G(o.name), p = [...s.map((e) => e.select), ...f ? [
			`ST_AsHEXWKB(${f})`,
			`ST_GeometryType(${f})::VARCHAR`,
			`ST_HasZ(${f})`,
			`ST_IsEmpty(${f})`,
			`ST_XMin(${f})`,
			`ST_XMax(${f})`,
			`ST_YMin(${f})`,
			`ST_YMax(${f})`
		] : []], { rows: m } = await e.query(`SELECT ${p.join(", ") || "1"} FROM ${n.table}`), h = /* @__PURE__ */ new Set(), g = /* @__PURE__ */ new Set(), _ = [
			Infinity,
			Infinity,
			-Infinity,
			-Infinity
		], v = m.map((e) => {
			let t = s.map((t, n) => ct(t.kind, e[n]));
			if (!f) return [null, ...t];
			let [n, r, i, a, o, c, l, u] = e.slice(s.length);
			if (n === null) return [
				null,
				null,
				...t
			];
			h.add(r), g.add(!!i);
			let p = a || r === "POINT" ? null : [
				o,
				c,
				l,
				u
			];
			return a || (_[0] = Math.min(_[0], o), _[1] = Math.min(_[1], l), _[2] = Math.max(_[2], c), _[3] = Math.max(_[3], u)), [
				null,
				lt(xe(n), d, p, !!a),
				...t
			];
		});
		i.push({
			name: n.name,
			columns: l,
			types: u,
			rows: v
		});
		let y = Number.isFinite(_[0]) ? _ : [
			null,
			null,
			null,
			null
		];
		a.push(["INSERT INTO gpkg_contents (table_name, data_type, identifier, min_x, min_y, max_x, max_y, srs_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
			n.name,
			f ? "features" : "attributes",
			n.name,
			...y,
			f ? d : null
		]]), a.push(["INSERT INTO gpkg_ogr_contents VALUES (?, ?)", [n.name, v.length]]);
		for (let [e, t] of [["insert", "+"], ["delete", "-"]]) a.push(`CREATE TRIGGER ${G(`trigger_${e}_feature_count_${n.name}`)} AFTER ${e.toUpperCase()} ON ${G(n.name)} BEGIN UPDATE gpkg_ogr_contents SET feature_count = feature_count ${t} 1 WHERE lower(table_name) = lower(${K(n.name)}); END`);
		f && a.push(["INSERT INTO gpkg_geometry_columns VALUES (?, ?, ?, ?, ?, 0)", [
			n.name,
			o.name,
			h.size === 1 ? [...h][0] : "GEOMETRY",
			d,
			g.size === 2 ? 2 : +!!g.has(!0)
		]]);
	}
	return e.writeSqlite(i, { statements: [
		"PRAGMA application_id = 1196444487",
		"PRAGMA user_version = 10400",
		...ut,
		...[...r.values()].map((e) => ["INSERT INTO gpkg_spatial_ref_sys VALUES (?, ?, ?, ?, ?, ?)", e]),
		...a
	] });
}
var st = {
	integer: "INTEGER",
	real: "DOUBLE",
	boolean: "BOOLEAN",
	date: "DATE",
	text: "TEXT",
	blob: "BLOB"
};
function ct(e, t) {
	return t == null ? null : e === "boolean" ? +!!t : e === "blob" ? xe(t) : t;
}
function lt(e, t, n, r) {
	let i = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8 + (n ? 32 : 0)));
	return i.setUint8(0, 71), i.setUint8(1, 80), i.setUint8(2, 0), i.setUint8(3, 1 | (n ? 2 : 0) | (r ? 16 : 0)), i.setInt32(4, t, !0), n?.forEach((e, t) => i.setFloat64(8 + t * 8, e, !0)), Ve([new Uint8Array(i.buffer), e]);
}
var ut = [
	"CREATE TABLE gpkg_spatial_ref_sys (srs_name TEXT NOT NULL, srs_id INTEGER PRIMARY KEY, organization TEXT NOT NULL,\n    organization_coordsys_id INTEGER NOT NULL, definition TEXT NOT NULL, description TEXT)",
	"CREATE TABLE gpkg_contents (table_name TEXT NOT NULL PRIMARY KEY, data_type TEXT NOT NULL, identifier TEXT UNIQUE,\n    description TEXT DEFAULT '', last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n    min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE, srs_id INTEGER,\n    CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id))",
	"CREATE TABLE gpkg_geometry_columns (table_name TEXT NOT NULL, column_name TEXT NOT NULL, geometry_type_name TEXT NOT NULL,\n    srs_id INTEGER NOT NULL, z TINYINT NOT NULL, m TINYINT NOT NULL,\n    CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name), CONSTRAINT uk_gc_table_name UNIQUE (table_name),\n    CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),\n    CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys (srs_id))",
	"CREATE TABLE gpkg_ogr_contents (table_name TEXT NOT NULL PRIMARY KEY, feature_count INTEGER DEFAULT NULL)"
];
async function dt(e, t, n) {
	let r = [];
	for (let i of t) {
		let a = i.label ?? i.name, o = await Ke(e, i.table), s = o.filter(qe);
		if (!s.length) throw Error(`A shapefile needs a geometry column, and ${a} has none.`);
		if (s.length > 1) throw Error(`A shapefile holds one geometry column, and ${a} has ${s.length} (${s.map((e) => e.name).join(", ")}). Leave out the others with a SQLQuery node first.`);
		let [c] = s, l = at(o, c), { rows: u } = await e.query(`SELECT ${[...l.map((e) => e.select), `ST_AsGeoJSON(${G(c.name)})`].join(", ")} FROM ${i.table}`), d = t.length > 1 ? i.name : n, { shp: f, shx: p } = gt(u.map((e) => Qe(e[l.length])), a);
		r.push({
			name: `${d}.shp`,
			bytes: f
		}, {
			name: `${d}.shx`,
			bytes: p
		}, {
			name: `${d}.dbf`,
			bytes: bt(l, u)
		}, {
			name: `${d}.cpg`,
			bytes: We.encode("UTF-8")
		}), c.crs && r.push({
			name: `${d}.prj`,
			bytes: We.encode((await De(e, c.crs)).wkt)
		});
	}
	return Re(r);
}
var ft = {
	point: [1, 11],
	multipoint: [8, 18],
	line: [3, 13],
	polygon: [5, 15]
}, pt = {
	Point: "point",
	MultiPoint: "multipoint",
	LineString: "line",
	MultiLineString: "line",
	Polygon: "polygon",
	MultiPolygon: "polygon"
};
function mt(e) {
	switch (e.type) {
		case "Point": return e.coordinates.length ? [[e.coordinates]] : [];
		case "MultiPoint": return [e.coordinates];
		case "LineString": return e.coordinates.length ? [e.coordinates] : [];
		case "MultiLineString": return e.coordinates;
		case "Polygon": return e.coordinates.map((e, t) => ht(e, t === 0));
		case "MultiPolygon": return e.coordinates.flatMap((e) => e.map((e, t) => ht(e, t === 0)));
		default: return [];
	}
}
function ht(e, t) {
	let n = 0;
	for (let t = 0; t < e.length - 1; t++) n += e[t][0] * e[t + 1][1] - e[t + 1][0] * e[t][1];
	return n < 0 === t ? e : [...e].reverse();
}
function gt(e, t) {
	let n = /* @__PURE__ */ new Set();
	for (let r of e) {
		if (!r) continue;
		let e = pt[r.type];
		if (!e) throw Error(`A shapefile can't hold a ${r.type}, and ${t} has one.`);
		n.add(e);
	}
	if (n.has("multipoint") && n.delete("point"), n.size > 1) {
		let e = {
			point: "points",
			multipoint: "points",
			line: "lines",
			polygon: "polygons"
		};
		throw Error(`A shapefile holds one kind of geometry, and ${t} has ${[...n].map((t) => e[t]).join(" and ")}. Split them with SQLQuery nodes first.`);
	}
	let r = [...n][0], i = e.map((e) => e ? mt(e) : []), a = i.some((e) => e.some((e) => e.some((e) => e.length > 2))), o = r ? ft[r][+!!a] : 0, s = i.map((e) => e.length ? yt(o, r, e, a) : _t()), c = i.flat(2), [l, u] = vt(c, 0), [d, f] = vt(c, 1), [p, m] = a ? vt(c, 2) : [0, 0], h = 100 + s.reduce((e, t) => e + 8 + t.length, 0), g = 100 + s.length * 8, _ = (e) => {
		let t = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(100));
		return t.setInt32(0, 9994), t.setInt32(24, e / 2), t.setInt32(28, 1e3, !0), t.setInt32(32, o, !0), [
			l,
			d,
			u,
			f,
			p,
			m,
			0,
			0
		].forEach((e, n) => t.setFloat64(36 + n * 8, e, !0)), new Uint8Array(t.buffer);
	}, v = [_(h)], y = [_(g)], b = 100;
	return s.forEach((e, t) => {
		let n = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
		n.setInt32(0, t + 1), n.setInt32(4, e.length / 2), v.push(new Uint8Array(n.buffer), e);
		let r = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
		r.setInt32(0, b / 2), r.setInt32(4, e.length / 2), y.push(new Uint8Array(r.buffer)), b += 8 + e.length;
	}), {
		shp: Ve(v),
		shx: Ve(y)
	};
}
var _t = () => /* @__PURE__ */ new Uint8Array(4);
function vt(e, t) {
	if (!e.length) return [0, 0];
	let n = Infinity, r = -Infinity;
	for (let i of e) {
		let e = i[t] ?? 0;
		e < n && (n = e), e > r && (r = e);
	}
	return [n, r];
}
function yt(e, t, n, r) {
	let i = n.flat();
	if (t === "point") {
		let [t, n, a = 0] = i[0], o = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(r ? 36 : 20));
		return o.setInt32(0, e, !0), o.setFloat64(4, t, !0), o.setFloat64(12, n, !0), r && (o.setFloat64(20, a, !0), o.setFloat64(28, 0, !0)), new Uint8Array(o.buffer);
	}
	let a = t !== "multipoint", o = i.length, s = 40 + (a ? 4 + 4 * n.length : 0) + 16 * o + (r ? 16 + 8 * o : 0), c = new DataView(new ArrayBuffer(s)), l = 0, u = (e) => {
		c.setInt32(l, e, !0), l += 4;
	}, d = (e) => {
		c.setFloat64(l, e, !0), l += 8;
	};
	u(e);
	let [f, p] = vt(i, 0), [m, h] = vt(i, 1);
	if ([
		f,
		m,
		p,
		h
	].forEach(d), a && u(n.length), u(o), a) {
		let e = 0;
		for (let t of n) u(e), e += t.length;
	}
	for (let [e, t] of i) d(e), d(t);
	if (r) {
		vt(i, 2).forEach(d);
		for (let e of i) d(e[2] ?? 0);
	}
	return new Uint8Array(c.buffer);
}
function bt(e, t) {
	let n = Ct(e.map((e) => e.name)), r = e.map((e, r) => {
		let i = t.map((e) => e[r]), a = {
			name: n[r],
			...xt(e.kind, i)
		};
		return a.cells = i.map((e) => a.format(e)), a.width = Math.min(254, a.cells.reduce((e, t) => Math.max(e, t.length), 1)), a;
	}), i = 32 + 32 * r.length + 1, a = 1 + r.reduce((e, t) => e + t.width, 0), o = new Uint8Array(i + a * t.length + 1), s = new DataView(o.buffer), c = /* @__PURE__ */ new Date();
	return o[0] = 3, o[1] = c.getFullYear() - 1900, o[2] = c.getMonth() + 1, o[3] = c.getDate(), s.setUint32(4, t.length, !0), s.setUint16(8, i, !0), s.setUint16(10, a, !0), r.forEach((e, t) => {
		let n = 32 + t * 32;
		o.set(We.encode(e.name), n), o[n + 11] = e.type.charCodeAt(0), o[n + 16] = e.width, o[n + 17] = e.decimals;
	}), o[i - 1] = 13, o.fill(32, i, o.length - 1), t.forEach((e, t) => {
		let n = i + t * a + 1;
		for (let e of r) {
			let r = e.cells[t].subarray(0, e.width);
			o.set(r, e.right ? n + e.width - r.length : n), n += e.width;
		}
	}), o[o.length - 1] = 26, o;
}
function xt(e, t) {
	let n = (e) => We.encode(e);
	switch (e) {
		case "integer": return {
			type: "N",
			decimals: 0,
			right: !0,
			format: (e) => n(e === null ? "" : String(e))
		};
		case "real": return {
			type: "N",
			decimals: 15,
			right: !0,
			format: (e) => n(e === null || !Number.isFinite(e) ? "" : e.toFixed(15))
		};
		case "boolean": return {
			type: "L",
			decimals: 0,
			format: (e) => n(e === null ? "?" : e ? "T" : "F")
		};
		case "date": return {
			type: "D",
			decimals: 0,
			format: (e) => n(e === null ? "00000000" : e.replaceAll("-", ""))
		};
		default: return {
			type: "C",
			decimals: 0,
			format: (e) => e === null ? /* @__PURE__ */ new Uint8Array() : St(We.encode(String(e)), 254)
		};
	}
}
function St(e, t) {
	if (e.length <= t) return e;
	let n = t;
	for (; n > 0 && (e[n] & 192) == 128;) n--;
	return e.subarray(0, n);
}
function Ct(e) {
	let t = /* @__PURE__ */ new Set();
	return e.map((e) => {
		let n = e.replace(/[^A-Za-z0-9_]/g, "_").slice(0, 10) || "field", r = n;
		for (let e = 1; t.has(r.toUpperCase()); e++) r = `${n.slice(0, 10 - String(e).length - 1)}_${e}`;
		return t.add(r.toUpperCase()), r;
	});
}
//#endregion
//#region lib/spatialChecks.js
var wt = {
	st_area: ["ST_Area", "ST_Area_Spheroid (square metres)"],
	st_length: ["ST_Length", "ST_Length_Spheroid (metres)"],
	st_perimeter: ["ST_Perimeter", "ST_Perimeter_Spheroid (metres)"],
	st_distance: ["ST_Distance", "ST_Distance_Spheroid (metres, between points)"],
	st_dwithin: ["ST_DWithin", "ST_DWithin_Spheroid (metres, between points)"],
	st_buffer: ["ST_Buffer", null]
}, Tt = /* @__PURE__ */ new Set([
	"st_area_spheroid",
	"st_length_spheroid",
	"st_perimeter_spheroid",
	"st_distance_spheroid",
	"st_dwithin_spheroid"
]), Et = RegExp(`\\b(${[
	...Object.keys(wt),
	...Tt,
	"st_transform"
].join("|")})\\s*\\(`, "i");
async function Dt(e, t) {
	if (!Et.test(t)) return [];
	try {
		let n = JSON.parse((await e.query(`SELECT json_serialize_sql(${K(t)})`)).rows[0][0]);
		if (n.error || n.statements?.length !== 1) return [];
		let r = /* @__PURE__ */ new Set();
		for (let t of At(n.statements[0])) try {
			let i = await jt(e, n.statements[0], t);
			i && r.add(i);
		} catch {}
		return [...r];
	} catch {
		return [];
	}
}
async function Ot(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let i of t) try {
		let { rows: t } = await e.query(`DESCRIBE SELECT * FROM ${i.table}`);
		for (let [i, a] of t) {
			let t = Ge(a);
			if (!t || t === "EPSG:4326" || t === "OGC:CRS84") continue;
			let o = await Ae(e, t, "EPSG:4326");
			o && r.add(`${n} is longitude and latitude on WGS 84, and ${i} is in ${t} (${o.from.name}). ` + kt(o));
		}
	} catch {}
	return [...r];
}
var kt = ({ from: e, to: t }) => `PROJ has only a null transformation between ${e.base.name} and ${t.base.name} here, so coordinates are carried over unchanged and any real offset between the two datums is dropped. That's expected if your data takes one as the other; otherwise transform from the data's own datum.`;
function At(e) {
	let t = [], n = (e, r, i) => {
		if (Array.isArray(e)) {
			for (let t of e) n(t, r, i);
			return;
		}
		if (!e || typeof e != "object") return;
		e.cte_map?.map?.length && (i = [...i, ...e.cte_map.map]), e.type === "SELECT_NODE" && (r = e);
		let a = e.class === "FUNCTION" ? String(e.function_name).toLowerCase() : null;
		r && (wt[a] || Tt.has(a) || a === "st_transform") && t.push({
			name: a,
			node: e,
			select: r,
			ctes: i
		});
		for (let t of Object.values(e)) n(t, r, i);
	};
	return n(e.node, null, []), t;
}
async function jt(e, t, { name: n, node: r, select: i, ctes: a }) {
	let [o, ...s] = r.children ?? [];
	if (!o) return null;
	let c = async () => Lt(Ge(await Bt(e, t, o, i, a)));
	if (wt[n]) {
		let t = await c();
		if (!t) return null;
		let r = await ke(e, t);
		if (!r.geographic) return null;
		let [i, a] = wt[n];
		return `${i} on ${zt(o)} works in degrees: ${t} (${r.name}) is longitude and latitude. ${a ? `Use ${a}, or` : "Use"} ST_Transform to a projected CRS in metres first.`;
	}
	if (Tt.has(n)) return Mt(e, n, r, async (n) => Lt(Ge(await Bt(e, t, n, i, a))));
	if (Pt(s.length >= 2 && !It(s[1]) ? s[1] : s[0])) {
		let t = s.length >= 2 && !It(s[1]) ? Rt(s[0]) : await c(), n = t ? await Ft(e, Lt(t)) : null;
		return `ST_Transform's target is a PROJ string with no datum, only an ellipsoid, so PROJ applies no datum shift: the result stays on ${n ? `the source's datum (${n})` : "the source's datum"}. If the projection is meant for another datum, transform to that datum's geographic CRS first, or name the target in WKT or PROJJSON, which carry their datum (a target built per row can be WKT too).`;
	}
	let l = s.map(Rt), [u, d] = l.length >= 2 && l[0] && l[1] ? l : [await c(), l[0]];
	if (!u || !d) return null;
	let f = await Ae(e, Lt(u), Lt(d));
	return f ? `ST_Transform from ${u} (${f.from.name}) to ${d} (${f.to.name}) changes datum: ${kt(f)}` : null;
}
async function Mt(e, t, n, r) {
	let i = Nt[t];
	for (let e of n.children ?? []) if (e.class === "FUNCTION" && String(e.function_name).toLowerCase() === "st_flipcoordinates") return `${i} takes longitude first here (x, y order, in both engines), so ST_FlipCoordinates, which puts latitude first, makes it return NaN. Drop ST_FlipCoordinates.`;
	for (let t of n.children ?? []) {
		let n;
		try {
			n = await r(t);
		} catch {
			continue;
		}
		if (!n) continue;
		let a = await ke(e, n);
		if (!a.geographic) return `${i} measures on the ellipsoid from longitude and latitude, but ${zt(t)} is in ${n} (${a.name}), which is projected. Use ST_Area or ST_Length on it as it is (in its units), or ST_Transform it to its geographic CRS first.`;
	}
	return null;
}
var Nt = {
	st_area_spheroid: "ST_Area_Spheroid",
	st_length_spheroid: "ST_Length_Spheroid",
	st_perimeter_spheroid: "ST_Perimeter_Spheroid",
	st_distance_spheroid: "ST_Distance_Spheroid",
	st_dwithin_spheroid: "ST_DWithin_Spheroid"
};
function Pt(e) {
	let t = [], n = (e) => {
		if (Array.isArray(e)) return e.forEach(n);
		if (!e || typeof e != "object") return;
		let r = Rt(e);
		r && t.push(r), Object.values(e).forEach(n);
	};
	return n(e), t.some((e) => /(^|\s)\+proj=/.test(e) && !/\+(datum|towgs84|nadgrids)=/.test(e) && !/\+init=/.test(e));
}
async function Ft(e, t) {
	try {
		let n = await ke(e, t);
		return n.datum ?? n.base.name;
	} catch {
		return null;
	}
}
var It = (e) => e?.class === "CONSTANT" && e.value?.type?.id === "BOOLEAN", Lt = (e) => e === "OGC:CRS84" ? "EPSG:4326" : e, Rt = (e) => e?.class === "CONSTANT" && e.value?.type?.id === "VARCHAR" && !e.value.is_null ? e.value.value : null, zt = (e) => e.class === "COLUMN_REF" ? e.column_names.at(-1) : "a geometry";
async function Bt(e, t, n, r, i) {
	let a = {
		...r,
		select_list: [n],
		cte_map: { map: i },
		where_clause: null,
		group_expressions: [],
		group_sets: [],
		having: null,
		qualify: null,
		modifiers: [],
		aggregate_handling: "STANDARD_HANDLING"
	}, o = JSON.stringify({
		error: !1,
		statements: [{
			...t,
			node: a
		}]
	}).replaceAll(":18446744073709552000", ":18446744073709551615"), s = (await e.query(`SELECT json_deserialize_sql(${K(o)})`)).rows[0][0];
	return String((await e.query(`DESCRIBE ${s}`)).rows[0][1]);
}
//#endregion
//#region lib/xlsx.js
var Vt = 67324752, Ht = 33639248, Ut = 101010256, Wt = "This doesn't look like an .xlsx file.", Gt = (e) => new DataView(e.buffer, e.byteOffset, e.byteLength);
function Kt(e, t) {
	for (let n = e.length - 22; n >= Math.max(0, e.length - 65557); n--) if (t.getUint32(n, !0) === Ut) return n;
	return -1;
}
async function qt(e) {
	return [...(await Xt(e, "xl/workbook.xml")).matchAll(/<sheet\b[^>]*?\bname="([^"]*)"/g)].map((e) => Jt(e[1]));
}
var Jt = (e) => e.replace(/&(lt|gt|quot|apos|amp);/g, (e, t) => ({
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	amp: "&"
})[t]);
function Yt(e) {
	let t = Gt(e);
	if (e.length >= 4 && t.getUint32(0, !0) === Vt) return e;
	let n = Kt(e, t);
	if (n < 0) return e;
	let r = t.getUint32(n + 12, !0), i = t.getUint32(n + 16, !0), a = n - r - i;
	return a > 0 && t.getUint32(a, !0) === Vt ? e.slice(a) : e;
}
async function Xt(e, t) {
	let n = Gt(e), r = Kt(e, n);
	if (r < 0) throw Error(Wt);
	let i = n.getUint16(r + 10, !0), a = n.getUint32(r + 16, !0);
	for (let r = 0; r < i && n.getUint32(a, !0) === Ht; r++) {
		let r = n.getUint16(a + 10, !0), i = n.getUint32(a + 20, !0), o = n.getUint16(a + 28, !0), s = o + n.getUint16(a + 30, !0) + n.getUint16(a + 32, !0);
		if (new TextDecoder().decode(e.subarray(a + 46, a + 46 + o)) === t) {
			let t = n.getUint32(a + 42, !0), o = t + 30 + n.getUint16(t + 26, !0) + n.getUint16(t + 28, !0), s = e.subarray(o, o + i);
			if (r === 0) return new TextDecoder().decode(s);
			if (r === 8) {
				let e = new Blob([s]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
				return new Response(e).text();
			}
			throw Error(Wt);
		}
		a += 46 + s;
	}
	throw Error(Wt);
}
var Zt = "flow_out", Qt = "flow_in", $t = /* @__PURE__ */ new Set([
	"memory",
	"system",
	"temp"
]), en = /* @__PURE__ */ new Set(["information_schema", "pg_catalog"]), tn = (e) => e?.message ?? String(e), nn = (e) => e.crs !== void 0;
function rn(e) {
	if (!e?.startsWith("{")) return !1;
	try {
		return /^Undefined (cartesian|geographic) SRS$/i.test(JSON.parse(e).name);
	} catch {
		return !1;
	}
}
var an = 2e3;
function on(e, t) {
	let n = (e, t) => e.toLocaleString("en", { maximumFractionDigits: t });
	return e > 0 ? e >= 1e4 ? `${n(e / 1e4, 2)} ha` : `${n(e, e < 10 ? 2 : 0)} m²` : t > 0 ? t >= 1e3 ? `${n(t / 1e3, 2)} km` : `${n(t, t < 10 ? 2 : 0)} m` : "";
}
var sn = (e) => e === "OGC:CRS84" || e?.id?.authority === "OGC" && String(e.id.code) === "CRS84";
function cn(e, { crs: t } = {}) {
	let n = `ST_GeomFromWKB(${e})`;
	return t === null ? n : t === void 0 || sn(t) ? `ST_SetCRS(${n}, 'EPSG:4326')` : `ST_SetCRS(${n}, ${K(typeof t == "string" ? t : JSON.stringify(t))})`;
}
function ln(e, t) {
	Array.isArray(e) ? e.forEach((e) => ln(e, t)) : e && typeof e == "object" && (t(e), Object.values(e).forEach((e) => ln(e, t)));
}
function un(e) {
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
		let o = new Map(t.nodes.map((e) => [e.id, e])), { order: s, inputs: c } = fn(t, n);
		await e.query(`DROP SCHEMA IF EXISTS ${Zt} CASCADE`), await e.query(`CREATE SCHEMA ${Zt}`);
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
				await C(n), p[e] = await u(i, n, a, f);
			} catch (t) {
				p[e] = { error: tn(t) };
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
				name: xr(e, t),
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
			sample: (n > 0 ? (await e.query(`SELECT * FROM ${t} LIMIT ${Math.floor(n)}`)).rows : []).map((e) => e.map(dn))
		};
	}
	function l(e, t, n) {
		let r = /* @__PURE__ */ new Set(), i = [];
		for (let a of e) {
			let e = t.get(a.source), o = a.targetHandle?.startsWith("target:") ? a.targetHandle.slice(7) : null;
			for (let t of Dr(a.sourceHandle, e.id, e)) {
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
		if (!Z(t.kind)) return { error: `No ${t.kind} nodes are available here (they come from another app, a plugin this app doesn't install, or a server that isn't connected), so this one can't run. It's kept as it was, and saving the graph keeps it.` };
		let a = Y[t.kind], o = a.run ?? (a.where === "server" ? (e) => d(e, a) : null);
		if (!o) return { error: `${a.label} nodes can't run yet.` };
		let s = [...pr(t).filter((e) => e.severity === "error").map((e) => `${e.label}: ${e.message}`), ...kr(t, n.map((e) => e.pin ? `target:${e.pin}` : "target-0"))];
		if (s.length) return { error: s.join(" ") };
		let c = f(cr(t), n, i), { table: l, tables: u, slots: p, error: m, ...h } = await o(c) ?? {};
		if (m) return {
			error: m,
			...h.output === void 0 ? {} : { output: h.output }
		};
		let g = async (t) => (await e.query(`CREATE TABLE ${t} AS SELECT NULL::VARCHAR AS value WHERE false`), { table: t }), _ = u ? { tables: u } : l ? { table: l } : await g(c.table()), v = Tr(t.id, t).slice(1), y = {};
		for (let e of v) {
			let t = p?.[e.name];
			y[e.name] = typeof t == "string" ? { table: t } : t?.tables ? { tables: t.tables } : await g(c.slotTable(e.name));
		}
		if (i.outputs.set(t.id, {
			..._,
			...v.length ? { slots: y } : {}
		}), h.export) return h;
		let b = async (e, t) => {
			let n = (e) => (r.slot ?? null) === t && (r.table ?? null) === e ? r.page ?? 0 : 0;
			if (e.table) return { data: await w(e.table, n(null)) };
			let i = [];
			for (let t of e.tables) i.push({
				name: t.name,
				label: t.label,
				data: await w(t.table, n(t.name))
			});
			return { tables: i };
		}, x = {
			...h,
			...u || l ? await b(_, null) : {}
		};
		if (v.length) {
			x.slots = [];
			for (let e of v) x.slots.push({
				name: e.name,
				label: e.label,
				ref: e.ref,
				...await b(y[e.name], e.name)
			});
		}
		return x;
	}
	async function d(e, { kind: t, label: n, fields: r = [] }) {
		if (e.server.state !== "connected" || typeof e.server.runNode != "function") return { error: `${n} nodes run on the server, which isn't available.` };
		let i = [];
		for (let t of e.inputs) {
			let { ref: e, id: n, slot: r, pin: a } = t;
			if (t.table) i.push({
				ref: e,
				id: n,
				slot: r,
				pin: a,
				bytes: await h(t.table)
			});
			else {
				let o = [];
				for (let e of t.tables) o.push({
					name: e.name,
					bytes: await h(e.table)
				});
				i.push({
					ref: e,
					id: n,
					slot: r,
					pin: a,
					tables: o
				});
			}
		}
		let a = [];
		for (let t of r) {
			let n = t.type === "file" ? e.node[t.key] : null;
			if (!n?.key) continue;
			let r = await e.getFile(n.key);
			if (!r) return { error: `${t.label}: "${n.fileName}" isn't kept any more. Choose it again.` };
			a.push({
				key: n.key,
				bytes: r
			});
		}
		let o = await e.server.runNode({
			kind: t,
			node: e.node,
			inputs: i,
			files: a
		}), s = o.output ?? "";
		if (o.error) return {
			error: o.error,
			output: s
		};
		let c = {
			output: s,
			slots: {}
		}, l = async (t, n, r) => {
			let i = n === null ? e.table(r) : e.slotTable(n, r);
			return await g(i, t), i;
		};
		for (let e of o.outputs ?? []) {
			let t;
			if (e.tables) {
				t = { tables: [] };
				for (let n of e.tables) t.tables.push({
					name: n.name,
					label: n.name,
					table: await l(n.bytes, e.slot, n.name)
				});
			} else t = await l(e.bytes, e.slot);
			e.slot === null ? e.tables ? c.tables = t.tables : c.table = t : c.slots[e.slot] = t;
		}
		if (o.value !== void 0 && !c.table && !c.tables) {
			let e = o.value;
			c.value = {
				kind: "json",
				type: Array.isArray(e) ? "array" : e === null ? "null" : typeof e,
				value: e
			};
		}
		return c;
	}
	function f(t, n, { getFile: r, server: i }) {
		return {
			id: t.id,
			node: t,
			inputs: n,
			sql: e,
			server: i,
			getFile: r,
			table: (e) => `${Zt}.${G(e ? `${t.id}/${e}` : t.id)}`,
			slotTable: (e, n) => `${Zt}.${G(n ? `${t.id}#${e}/${n}` : `${t.id}#${e}`)}`,
			rows: S,
			parquet: () => m(n),
			parquetOf: h,
			loadParquet: g,
			loadRows: x,
			serverTables: (e) => p(e, [...new Set(n.map((e) => e.ref))]),
			spatialWarnings: (t) => Dt(e, t)
		};
	}
	async function p(t, n) {
		let r = t.trim().replace(/;+\s*$/, "");
		if (!r || !e) return [];
		let i;
		try {
			i = JSON.parse((await e.query(`SELECT json_serialize_sql(${K(r)})`)).rows[0][0]);
		} catch {
			return [];
		}
		if (i.error) return [];
		let a = (e) => (e ?? "").toLowerCase(), o = new Set(n.map(a)), s = [], c = /* @__PURE__ */ new Set();
		ln(i, (e) => {
			for (let { key: t } of e.cte_map?.map ?? []) c.add(a(t));
			e.type === "BASE_TABLE" && s.push(e);
		});
		let l = ({ catalog_name: e, schema_name: t, table_name: n }) => e ? $t.has(a(e)) : t ? en.has(a(t)) || o.has(a(t)) : o.has(a(n)) || c.has(a(n)), u = s.filter((e) => !l(e)).map((e) => [
			e.catalog_name,
			e.schema_name,
			e.table_name
		].filter(Boolean).join("."));
		return [...new Set(u)];
	}
	async function m(e) {
		let t = [], n = /* @__PURE__ */ new Set();
		for (let r of e) if (!n.has(r.ref)) {
			if (n.add(r.ref), r.table) t.push({
				name: r.ref,
				bytes: await h(r.table)
			});
			else for (let e of r.tables) t.push({
				name: `${r.ref}.${e.name}`,
				bytes: await h(e.table)
			});
		}
		return t;
	}
	async function h(t) {
		let n = `flow-send-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`;
		await v(`SELECT * FROM ${t}`, n);
		try {
			return await e.readFile(n);
		} finally {
			await e.dropFile(n);
		}
	}
	async function g(t, n) {
		let r = `flow-received-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`;
		await e.registerFile(r, n);
		try {
			await _(r, t);
		} finally {
			await e.dropFile(r);
		}
	}
	async function _(t, n) {
		let r = K(t), i = await y(t);
		if (!i) {
			await e.query(`CREATE TABLE ${n} AS SELECT * FROM read_parquet(${r})`);
			return;
		}
		try {
			await e.loadSpatial?.();
		} catch {}
		await b(async () => {
			let t = new Set((await e.query(`DESCRIBE SELECT * FROM read_parquet(${r})`)).rows.map(([e]) => e)), a = Object.entries(i.columns ?? {}).filter(([e, n]) => t.has(e) && String(n?.encoding).toUpperCase() === "WKB").map(([e, t]) => `${cn(G(e), t)} AS ${G(e)}`), o = a.length ? ` REPLACE (${a.join(", ")})` : "";
			await e.query(`CREATE TABLE ${n} AS SELECT *${o} FROM read_parquet(${r})`);
		});
	}
	async function v(t, n) {
		let r = await Se(e, t, n, "FORMAT parquet"), i = (await e.query(`DESCRIBE ${t}`)).rows.filter(([, e]) => String(e) === "GEOMETRY").map(([e]) => e);
		if (!i.length) return r;
		let a = await y(n) ?? {
			version: "1.0.0",
			primary_column: i[0],
			columns: {}
		};
		for (let e of i) a.columns[e] = {
			encoding: "WKB",
			geometry_types: [],
			...a.columns[e],
			crs: null
		};
		return await e.dropFile(n), await Se(e, t, n, `FORMAT parquet, KV_METADATA {geo: ${K(JSON.stringify(a))}}`), r;
	}
	async function y(t) {
		let { rows: n } = await b(() => e.query(`SELECT decode(value) FROM parquet_kv_metadata(${K(t)}) WHERE decode(key) = 'geo'`));
		try {
			let e = n.length ? JSON.parse(n[0][0]) : null;
			return e && typeof e == "object" && e.columns && typeof e.columns == "object" ? e : null;
		} catch {
			return null;
		}
	}
	async function b(t) {
		await e.query("SET enable_geoparquet_conversion = false");
		try {
			return await t();
		} finally {
			await e.query("SET enable_geoparquet_conversion = true");
		}
	}
	async function x(t, n) {
		if (!n.length) {
			await e.query(`CREATE TABLE ${t} AS SELECT NULL::VARCHAR AS value WHERE false`);
			return;
		}
		let r = `flow-rows-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
		await e.registerFile(r, new TextEncoder().encode(JSON.stringify(n)));
		try {
			await e.query(`CREATE TABLE ${t} AS SELECT * FROM read_json_auto(${K(r)}, format = 'array')`);
		} finally {
			await e.dropFile(r);
		}
	}
	async function S(t) {
		let n = async (t) => {
			let { columns: n, rows: r } = await e.query(`SELECT * FROM ${t}`);
			return r.map((e) => Object.fromEntries(n.map((t, n) => [t, e[n]])));
		};
		return t.table ? n(t.table) : Object.fromEntries(await Promise.all(t.tables.map(async (e) => [e.name, await n(e.table)])));
	}
	async function C(t) {
		for (let t of [Qt, ...n]) await e.query(`DROP SCHEMA IF EXISTS ${G(t)} CASCADE`);
		n = [], await e.query(`CREATE SCHEMA ${Qt}`), await e.query(`SET search_path = '${Qt},main'`);
		let r = /* @__PURE__ */ new Set();
		for (let i of t) {
			let t = i.ref;
			if (!r.has(t)) {
				if (r.add(t), i.table) {
					await e.query(`CREATE VIEW ${Qt}.${G(t)} AS SELECT * FROM ${i.table}`);
					continue;
				}
				await e.query(`CREATE SCHEMA ${G(t)}`), n.push(t);
				for (let n of i.tables) await e.query(`CREATE VIEW ${G(t)}.${G(n.name)} AS SELECT * FROM ${n.table}`);
			}
		}
	}
	async function w(t, n) {
		let r = Number((await e.query(`SELECT count(*) FROM ${t}`)).rows[0][0]), i = (await e.query(`DESCRIBE ${t}`)).rows.map(([e, t]) => ({
			name: e,
			crs: Ge(t)
		})), a = {
			rowCount: r,
			page: n,
			pageSize: 100,
			hasMore: (n + 1) * 100 < r
		}, o = `LIMIT 100 OFFSET ${n * 100}`, s = i.map((e) => e.name);
		if (!i.some(nn)) {
			let { rows: n } = await e.query(`SELECT * FROM ${t} ${o}`);
			return {
				columns: s,
				rows: n,
				...a
			};
		}
		return {
			columns: s,
			...await T(t, i, o),
			...a
		};
	}
	async function T(t, n, r) {
		for (let i of [
			"measured",
			"typed",
			"text"
		]) try {
			let a = n.flatMap((e) => nn(e) ? E(e, i) : [G(e.name)]), { rows: o } = await e.query(`SELECT ${a.map((e, t) => `${e} AS c${t}`).join(", ")} FROM ${t} ${r}`), s = [], c = [];
			for (let e of o) {
				let t = [], r = [], i = 0;
				for (let a of n) {
					if (!nn(a)) {
						t.push(e[i++]), r.push(null);
						continue;
					}
					let [n, o, s, c, l] = e.slice(i, i + 5);
					i += 5;
					let u = n !== null && n.length > an ? `${n.slice(0, an)}…` : n, d = on(c, l);
					t.push(n === null ? null : o ? s ? `${o} EMPTY` : d ? `${o} · ${d}` : o : u.slice(0, 60)), r.push(u);
				}
				s.push(t), c.push(r);
			}
			return {
				rows: s,
				wkt: c,
				geometry: i === "text" ? n.map(() => null) : await D(t, n)
			};
		} catch (e) {
			if (i === "text") throw e;
		}
	}
	function E(e, t) {
		let n = G(e.name), r = `left(ST_AsText(${n}), 2001)`;
		if (t === "text") return [
			r,
			"NULL",
			"NULL",
			"NULL",
			"NULL"
		];
		let i = [
			r,
			`ST_GeometryType(${n})::VARCHAR`,
			`ST_IsEmpty(${n})`
		];
		if (t === "typed" || e.crs === null) return [
			...i,
			"NULL",
			"NULL"
		];
		let a = ["EPSG:4326", "OGC:CRS84"].includes(e.crs) ? n : `ST_Transform(${n}, 'EPSG:4326')`;
		return [
			...i,
			`CASE WHEN ST_Dimension(${n}) = 2 THEN ST_Area_Spheroid(${a}) END`,
			`CASE WHEN ST_Dimension(${n}) = 1 THEN ST_Length_Spheroid(${a}) END`
		];
	}
	async function D(t, n) {
		let r = n.filter(nn), i = r.flatMap((e) => {
			let t = G(e.name);
			return [
				`list(DISTINCT ST_GeometryType(${t})::VARCHAR ORDER BY ST_GeometryType(${t})::VARCHAR) FILTER (WHERE ${t} IS NOT NULL)`,
				`coalesce(bool_or(ST_HasZ(${t})), false)`,
				`count(*) FILTER (WHERE ST_IsEmpty(${t}))`,
				`count(*) FILTER (WHERE NOT ST_IsEmpty(${t}) AND NOT ST_IsValid(${t}))`
			];
		}), a = null;
		try {
			a = (await e.query(`SELECT ${i.join(", ")} FROM ${t}`)).rows[0];
		} catch {}
		return n.map((e) => {
			if (!nn(e)) return null;
			let t = r.indexOf(e) * 4;
			return a ? {
				crs: e.crs,
				types: a[t] ?? [],
				z: !!a[t + 1],
				empty: Number(a[t + 2]),
				invalid: Number(a[t + 3])
			} : { crs: e.crs };
		});
	}
	let O = (e, t, n) => r(() => ee(e, t, n));
	async function ee(t, n, r) {
		if (!e) throw Error("No SQL engine is connected, so files can't be read.");
		let i = `flow-upload-${Date.now()}.${W[r].extensions[0]}`, a = [], o = [];
		await e.registerFile(i, t);
		try {
			let s = await k(r, i, t, n, a, o), c = [], l = [];
			for (let [t, { label: n, select: r }] of s.entries()) {
				let o = vr(br(n) || "table", l);
				l.push(o);
				let s = `${i}-${t}.parquet`;
				a.push(s);
				let u = await v(r, s);
				c.push({
					name: o,
					label: n,
					rowCount: u,
					bytes: await e.readFile(s)
				});
			}
			return c;
		} finally {
			for (let t of [i, ...a]) await e.dropFile(t);
			for (let t of o) await e.query(`DROP TABLE IF EXISTS ${t}`);
		}
	}
	async function k(t, n, r, i, a, o) {
		let s = K(n), c = (e) => [{
			label: i.replace(/\.[^.]*$/, ""),
			select: e
		}];
		if (W[t].geo) return A(t, n, r, i, a);
		switch (t) {
			case "csv": return c(`SELECT * FROM read_csv(${s})`);
			case "tsv": return c(`SELECT * FROM read_csv(${s}, delim = '\t')`);
			case "json": return c(`SELECT * FROM read_json_auto(${s})`);
			case "parquet": {
				let e = `main.${G(`flow-upload-${Date.now()}`)}`;
				return o.push(e), await _(n, e), c(`SELECT * FROM ${e}`);
			}
			case "xlsx": return await Ce(e), (await qt(r)).map((e) => ({
				label: e,
				select: `SELECT * FROM read_xlsx(${s}, sheet = ${K(e)}, header = true)`
			}));
			case "sqlite": {
				if (!e.readSqlite) throw Error("This SQL engine can't read SQLite files.");
				let t = await e.readSqlite(r), i = [];
				for (let [e, r] of t.entries()) i.push({
					label: r.name,
					select: await M(r, `${n}-rows-${e}.json`, a)
				});
				return i;
			}
			default: throw Error(`Can't read ${W[t]?.label ?? t} files.`);
		}
	}
	async function A(t, n, r, i, a) {
		let o = [n];
		if (t === "shapefile") {
			o = [];
			for (let t of await Fe(r)) {
				if (t.name.startsWith("__MACOSX/")) continue;
				let r = `${n}.files/${t.name}`;
				await e.registerFile(r, t.bytes), a.push(r), /\.shp$/i.test(t.name) && o.push(r);
			}
			if (!o.length) throw Error("There's no shapefile (.shp) in this zip.");
		}
		let s = [];
		for (let t of o) {
			let n = await e.query(`SELECT unnest(layers).name FROM ST_Read_Meta(${K(t)})`);
			for (let [e] of n.rows) s.push({
				layer: e,
				read: `ST_Read(${K(t)}, layer := ${K(e)})`
			});
		}
		if (!s.length) throw Error("It has no layers.");
		let c = [];
		try {
			for (let { layer: e, read: t } of s) c.push({
				label: s.length === 1 ? i.replace(/\.[^.]*$/, "") : e,
				...await j(t)
			});
		} catch (e) {
			throw t === "gpkg" && /thread constructor failed/.test(tn(e)) ? Error("This GeoPackage has no feature counts (GDAL's gpkg_ogr_contents table), which reading it here needs. Save it again with QGIS or ogr2ogr, which add them, and choose it again.") : e;
		}
		return c;
	}
	async function j(t) {
		let { rows: n } = await e.query(`DESCRIBE SELECT * FROM ${t}`), r = n.map(([e, t]) => ({
			name: e,
			crs: Ge(t)
		})), i = new Set(r.map((e) => e.name.toLowerCase())), a = [];
		for (let n of r) {
			if (n.name === "OGC_FID") continue;
			if (!nn(n)) {
				a.push(G(n.name));
				continue;
			}
			let r = n.name === "geom" && !i.has("geometry") ? "geometry" : n.name, o = G(n.name), [[s, c]] = (await e.query(`SELECT count(*) FILTER (WHERE ST_HasZ(${o})), count(*) FILTER (WHERE ST_HasZ(${o}) AND (ST_ZMin(${o}) <> 0 OR ST_ZMax(${o}) <> 0)) FROM ${t}`)).rows, l = Number(s) && !Number(c) ? `ST_Force2D(${o})` : o;
			a.push(`${rn(n.crs) ? `CAST(${l} AS GEOMETRY)` : l} AS ${G(r)}`);
		}
		return { select: `SELECT ${a.join(", ")} FROM ${t}` };
	}
	async function M({ columns: t, rows: n }, r, i) {
		if (!n.length) return `SELECT ${t.map((e) => `NULL::VARCHAR AS ${G(e)}`).join(", ") || "NULL AS empty"} WHERE false`;
		let a = n.map((e) => Object.fromEntries(t.map((t, n) => [t, e[n]])));
		return await e.registerFile(r, new TextEncoder().encode(JSON.stringify(a))), i.push(r), `SELECT * FROM read_json_auto(${K(r)}, format = 'array')`;
	}
	return {
		run: i,
		readFile: O,
		serverTables: p,
		describeInputs: o
	};
}
function dn(e) {
	if (e instanceof Uint8Array) return `(${e.length} bytes)`;
	let t = typeof e == "bigint" ? String(e) : typeof e == "object" && e ? JSON.stringify(e, (e, t) => typeof t == "bigint" ? String(t) : t) : e;
	return typeof t == "string" && t.length > 200 ? `${t.slice(0, 200)}…` : t;
}
function fn(e, t) {
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
var q = Symbol("flow-graph"), pn = 190, mn = 90, hn = {
	x: 0,
	y: .5
}, gn = {
	x: 1,
	y: .5
}, _n = (e) => e?.message ?? String(e), vn = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, yn = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`;
function bn(e) {
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
			text: `Wrote “${n}” (${r}, ${ge(i)}).`
		});
	} else if (e.tables) {
		let n = e.tables.map((e) => `${e.label} (${yn(e.data.rowCount)})`).join(", ");
		t.push({
			type: "info",
			text: `Read ${e.tables.length} ${e.tables.length === 1 ? "table" : "tables"}: ${n}.`
		});
	} else e.data ? t.push({
		type: "info",
		text: `Returned ${yn(e.data.rowCount)}.`
	}) : e.value && e.value.kind !== "none" ? t.push({
		type: "info",
		text: `Returned a ${e.value.type} (see the Data panel).`
	}) : e.output || t.push({
		type: "note",
		text: "(no output)"
	});
	if (!e.error && e.slots?.length) {
		let n = (e) => e.data ? yn(e.data.rowCount) : `${e.tables.length} tables`;
		t.push({
			type: "info",
			text: `Also: ${e.slots.map((e) => `${e.ref} (${n(e)})`).join(", ")}.`
		});
	}
	if (!e.error) for (let n of e.warnings ?? []) t.push({
		type: "warning",
		text: n
	});
	return t;
}
function xn({ sql: e = null, files: t = null, server: r = null } = {}) {
	let i = V(), a = un(e), o = u(() => ({
		state: r?.status?.state ?? "unavailable",
		address: r?.status?.address ?? null,
		local: r?.status?.local === !0,
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
			id: _r(e, v()),
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
	let x = u(() => ve(i.nodes.value, i.edges.value, i.viewport.value));
	function S(e) {
		let { nodes: t, edges: n, viewport: r } = be(e) ?? be(_e);
		s.length = 0, d.clear(), Object.assign(l, {
			started: !1,
			executing: !1,
			status: {},
			results: {}
		}), m.nodes = {}, i.setNodes(t), i.setEdges(n.map(b));
		for (let e of t) e.data.kind === "sql-query" && e.data.sqlQuery && j(e.id);
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
			x: r.x - n.x * pn,
			y: r.y - n.y * mn
		});
		return i.addNodes(a), a;
	}
	function T(e, t, n) {
		let r = n.handleType === "source", i = w(e, t, r ? hn : gn), [a, o] = r ? [n, {
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
		i.addEdges(b(e)), A(e.target);
	}
	function O(e) {
		let t = /* @__PURE__ */ new Set(), n = [e];
		for (; n.length;) {
			let e = n.pop();
			for (let r of i.edges.value) r.source === e && !t.has(r.target) && (t.add(r.target), n.push(r.target));
		}
		return [...t];
	}
	let ee = (e, t) => e === t || O(e).includes(t);
	function k({ source: e, target: t, targetHandle: n }) {
		if (ee(t, e)) return !1;
		let r = i.findNode(t);
		if (r && !Z(r.data.kind)) return !0;
		let a = Or(r?.data ?? {}).find((e) => e.handle === (n ?? "target-0"));
		return a ? a.many || !i.edges.value.some((e) => e.target === t && e.targetHandle === a.handle) : !1;
	}
	function A(e, { self: t = !0 } = {}) {
		for (let n of [...t ? [e] : [], ...O(e)]) d.set(n, (d.get(n) ?? 0) + 1), (l.status[n] === "completed" || l.status[n] === "failed") && (l.status[n] = "stale"), i.findNode(n)?.data.kind === "sql-query" && j(n);
	}
	async function j(t) {
		let n = i.findNode(t);
		if (!n || !e) return;
		let r = i.edges.value.filter((e) => e.target === t).flatMap((e) => {
			let t = i.findNode(e.source);
			return t ? Dr(e.sourceHandle, t.id, t.data).map((e) => e.ref) : [];
		}), o = await a.serverTables(n.data.sqlQuery ?? "", [...new Set(r)]);
		if (i.findNode(t) !== n) return;
		let s = n.data.sqlServerTables;
		(!s || o.join("\n") !== s.join("\n")) && i.updateNodeData(t, { sqlServerTables: o });
	}
	P(() => Object.keys(Y).length, () => {
		for (let e of i.nodes.value) e.data.kind === "sql-query" && e.data.sqlQuery && j(e.id);
	});
	function M(e) {
		delete l.status[e], delete l.results[e], d.set(e, (d.get(e) ?? 0) + 1), A(e, { self: !1 });
	}
	function te(e, t) {
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
		d.has(e) && d.set(t, d.get(e)), A(t, { self: !1 });
	}
	function N(e, t) {
		return t = t.trim(), t ? t === e ? null : v().includes(t) ? "Another node already uses this ID." : (te(e, t), null) : "ID cannot be empty.";
	}
	function F(e, t) {
		t = t.trim();
		let n = i.findNode(e);
		if (t === (n.data.label ?? "")) return;
		i.updateNodeData(e, { label: t || void 0 });
		let r = br(t);
		r && yr(n.data.kind, e) && te(e, vr(r, v().filter((t) => t !== e)));
	}
	function I(e, t) {
		let n = i.findNode(e), r = br(t), a = r && r !== "data" ? r : void 0;
		return a === n.data.outputSuffix ? null : a && Tr(e, n.data).some((e) => e.name === a) ? `This node already has an output called ${a} (${e}_${a}). Choose another name.` : (i.updateNodeData(e, { outputSuffix: a }), A(e, { self: !1 }), null);
	}
	function L(e, t) {
		let n = i.findNode(e).data, r = Object.keys(t).filter((e) => JSON.stringify(t[e]) !== JSON.stringify(n[e]));
		r.length && (i.updateNodeData(e, t), r.some((e) => !ur(n.kind, e)) && A(e));
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
			return p.set(n, r), pe(t.name) && L(e, { ingestFormat: void 0 }), await ie(n, r, n.data.ingestFormat);
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
			let a = vn();
			await R(a, e);
			let o = r.data[t]?.key;
			return L(r.id, { [t]: {
				fileName: n.name,
				fileSize: n.size,
				key: a
			} }), o && z(o), null;
		} catch (e) {
			return `Couldn't keep "${n.name}". ${_n(e)}`;
		} finally {
			h.delete(e);
		}
	}
	async function ie(e, { name: t, size: n, bytes: r }, o) {
		let s = o || pe(t);
		if (!s || !W[s].read) return `Can't tell what kind of file "${t}" is. Pick its type under File Type.`;
		let c;
		try {
			c = await a.readFile(r, t, s);
		} catch (e) {
			return `Couldn't read "${t}" as ${W[s].label}. ${_n(e)}`;
		}
		if (i.findNode(e.id) !== e) return null;
		let l = [];
		for (let e of c) {
			let t = vn();
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
	async function ae(e, t) {
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
		return !a || (t || pe(a.fileName)) === a.format ? null : `Choose "${a.fileName}" again to read it as ${W[t]?.label ?? "that type"}.`;
	}
	function oe(e, { type: t, text: n }) {
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
	function H(e, t, n) {
		m.nodes[e]?.state !== t && (m.nodes[e] = {
			state: t,
			entries: []
		});
		for (let t of n) oe(m.nodes[e].entries, t);
	}
	let U = (e, t = "info") => oe(m.app, {
		type: t,
		text: e
	});
	P(() => o.value.state, (e, t) => {
		if (e === "connected") {
			let { address: e, local: t } = o.value;
			U(`Connected to the server${e ? ` at ${e}` : ""}.`), t && U("The server is in local development mode (IS_LOCAL): it signs no one in, and node kinds that run on it can reach the network. Keep it on your own machine.", "warning");
		} else e === "unavailable" && U(t === "connected" ? "Lost the server: nodes that run there can't run until it's back." : r ? "The server isn't available: nodes that run there can't run until it is." : "There's no server: everything runs in this browser, and nodes that need a server can't run.", t === "connected" ? "error" : "note");
	}, { immediate: !0 });
	function se({ filename: e, contentType: t, bytes: n }) {
		let r = URL.createObjectURL(new Blob([n], { type: t }));
		Object.assign(document.createElement("a"), {
			href: r,
			download: e
		}).click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
	}
	let ce = () => ({
		state: o.value.state,
		query: r?.query,
		runPython: r?.runPython,
		runNode: r?.runNode
	});
	async function le(e, t = null, { log: n = !0 } = {}) {
		if (!e.length) return {};
		l.started = !0;
		for (let t of e) l.status[t] = "running";
		let r = new Map(d), o;
		try {
			o = await a.run(x.value, e, {
				paged: t,
				getFile: ne,
				server: ce()
			});
		} catch (t) {
			o = Object.fromEntries(e.map((e) => [e, { error: _n(t) }]));
		}
		for (let [t, a] of Object.entries(o)) {
			if (!i.findNode(t)) continue;
			if (a.export) {
				let { bytes: n, ...r } = a.export, i = e.includes(t);
				i && se(a.export), a = {
					...a,
					export: {
						...r,
						downloaded: i
					}
				};
			}
			l.results[t] = a;
			let o = (d.get(t) ?? 0) !== (r.get(t) ?? 0);
			l.status[t] = o ? "stale" : a.error ? "failed" : "completed", n && H(t, r.get(t) ?? 0, bn(a));
		}
		return o;
	}
	let ue = (e, t = 0, n = null, r = null) => le([e], {
		id: e,
		page: t,
		table: n,
		slot: r
	}), de = (e, t, n = null, r = null) => le([e], {
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
				U("Nothing to execute: every node has Auto Run off.", "note");
				return;
			}
			let t = Object.keys(await le(e)).filter((e) => l.status[e]), n = (e) => t.filter((t) => l.status[t] === e).length, r = [`${n("completed")} completed`, `${n("failed")} failed`];
			n("stale") && r.push(`${n("stale")} changed while running`), U(`Executed the graph: ${t.length} ${t.length === 1 ? "node" : "nodes"} ran, ${r.join(", ")}.`, n("failed") ? "error" : "info");
		} finally {
			l.executing = !1;
		}
	}
	async function me(e, t, n, s = () => {}) {
		let c = i.findNode(e), l = o.value.assistant;
		if (!c) return { error: "That node is gone." };
		if (o.value.state !== "connected" || !l) return { error: "The assistant works through the server, which isn't available." };
		try {
			s("reading");
			let i = await a.describeInputs(x.value, e, {
				getFile: ne,
				server: ce(),
				sampleRows: l.sampleRows ?? 0
			});
			return s("writing"), await r.assist({
				kind: c.data.kind,
				request: t,
				code: n,
				inputs: i
			});
		} catch (e) {
			return { error: _n(e) };
		}
	}
	function he({ nodeIds: e = [], edgeIds: t = [] }) {
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
			for (let t of r) e.includes(t.target) || A(t.target);
		}
	}
	function ge() {
		let e = s.pop();
		if (e) {
			i.addNodes(e.nodes), i.addEdges(e.edges);
			for (let t of e.edges) A(t.target);
		}
	}
	function ye(e) {
		if (n(e)) return;
		let t = e.ctrlKey || e.metaKey;
		(e.key === "Delete" || e.key === "Backspace") && !t && !e.altKey ? (e.preventDefault(), he({
			nodeIds: i.getSelectedNodes.value.map((e) => e.id),
			edgeIds: i.getSelectedEdges.value.map((e) => e.id)
		})) : t && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z" && (e.preventDefault(), ge());
	}
	return {
		flow: i,
		selectedNode: _,
		snapshot: x,
		run: l,
		logs: m,
		log: U,
		reading: h,
		server: o,
		load: S,
		setContextPoint: C,
		addNode: w,
		addConnectedNode: T,
		connect: D,
		isValidConnection: k,
		renameNode: N,
		setLabel: F,
		setOutputName: I,
		updateData: L,
		chooseFile: re,
		setIngestFormat: ae,
		storeFieldFile: B,
		runNode: ue,
		turnPage: de,
		executeGraph: fe,
		resetNode: M,
		askAssistant: me,
		remove: he,
		undoDelete: ge,
		onKeydown: ye
	};
}
//#endregion
//#region components/DataIngestFields.vue
var Sn = { class: "flow-field" }, Cn = [
	"id",
	"accept",
	"disabled",
	"aria-describedby"
], wn = ["id"], Tn = {
	key: 0,
	class: "flow-field-error"
}, En = {
	key: 1,
	class: "flow-field-hint"
}, Dn = {
	key: 2,
	class: "flow-field-hint"
}, On = { class: "flow-field" }, kn = ["for"], An = [
	"id",
	"value",
	"disabled"
], jn = { value: "" }, Mn = ["value"], Nn = {
	__name: "DataIngestFields",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = _(q), r = D("");
		P(() => t.node, () => r.value = "");
		let i = u(() => t.node.data.ingest), a = u(() => n.reading.has(t.node.id)), o = u(() => i.value && pe(i.value.fileName)), s = u(() => {
			let { fileName: e, fileSize: t, format: n, tables: r } = i.value, a = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`, o = de(i.value) ? `${r.length} ${n === "xlsx" ? "sheets" : W[n].multi === "layers" ? "layers" : "tables"}, ${a(r.reduce((e, t) => e + t.rowCount, 0))}` : a(r[0]?.rowCount ?? 0);
			return `${e} · ${ge(t)} · ${W[n].label}, ${o}`;
		}), c = u(() => i.value && !t.node.data.label && he(i.value.fileName));
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
		let v = (e) => d(() => n.setIngestFormat(t.node.id, e.target.value)), y = M(), x = {
			file: `${y}-file`,
			fileNote: `${y}-file-note`,
			format: `${y}-format`
		};
		return (t, u) => (w(), p(l, null, [m("div", Sn, [
			u[1] ||= m("span", { class: "flow-field-label" }, "File", -1),
			m("label", { class: b(["flow-file", { "is-busy": a.value }]) }, [m("input", {
				id: x.file,
				type: "file",
				class: "flow-file-input",
				accept: j(ue),
				disabled: a.value,
				"aria-describedby": x.fileNote,
				onChange: g
			}, null, 40, Cn), h(" " + A(a.value ? "Reading…" : i.value ? "Choose another file…" : "Choose file…"), 1)], 2),
			m("div", { id: x.fileNote }, [r.value ? (w(), p("p", Tn, A(r.value), 1)) : f("", !0), i.value ? (w(), p("p", En, A(s.value), 1)) : (w(), p("p", Dn, " CSV, TSV, JSON, Parquet, Excel (.xlsx), SQLite, or geometry: GeoJSON, KML, a zipped shapefile, GeoPackage or FlatGeobuf. Its data is read and kept; the file itself isn't. "))], 8, wn),
			c.value ? (w(), p("button", {
				key: 0,
				type: "button",
				class: "flow-suggestion",
				onClick: u[0] ||= (t) => j(n).setLabel(e.node.id, c.value)
			}, " Rename to “" + A(c.value) + "” to match " + A(i.value.fileName) + "? ", 1)) : f("", !0)
		]), m("div", On, [m("label", {
			class: "flow-field-label",
			for: x.format
		}, "File Type", 8, kn), m("select", {
			id: x.format,
			class: "flow-field-input flow-field-select",
			value: e.node.data.ingestFormat ?? "",
			disabled: a.value,
			onChange: v
		}, [m("option", jn, " From file name" + A(o.value ? ` (${j(W)[o.value].label})` : ""), 1), (w(!0), p(l, null, O(j(ce), (e) => (w(), p("option", {
			key: e,
			value: e
		}, A(j(W)[e].label), 9, Mn))), 128))], 40, An)])], 64));
	}
}, Pn = Symbol("flow-open-menu"), Fn = [
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
], In = [{
	label: "Delete wire",
	command: "wire.delete",
	shortcut: "Del"
}], Ln = (e) => () => Xn.map((t) => ({
	type: "submenu",
	label: t.label,
	badge: { class: `flow-node--${t.id}` },
	items: hr(t.id).map((t) => ({
		label: Y[t].label,
		command: e,
		args: { kind: t }
	}))
})).filter((e) => e.items.length), Rn = Ln("node.addConnected");
function zn(e, n) {
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
			items: Ln("node.add")
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
var Bn = {
	key: 0,
	class: "flow-field"
}, Vn = ["for"], Hn = [
	"id",
	"placeholder",
	"aria-describedby",
	"onKeydown"
], Un = ["id"], Wn = {
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
			let t = xr(e.id, e.data), n = Q(e.data.kind).category, r = e.data.ingest && de(e.data.ingest) ? e.data.ingest.tables : [];
			return [{
				name: t,
				category: n
			}, ...r.map((e) => ({
				name: `${t}.${e.name}`,
				category: n,
				table: !0
			}))];
		})), s = u(() => o.value.filter((e) => !e.table).length > 1 || !!t.node.data.exportInput), c = _(Pn), l = D(null);
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
		let g = M(), v = {
			input: `${g}-input`,
			note: `${g}-input-note`
		};
		return (e, t) => s.value ? (w(), p("div", Bn, [
			m("label", {
				class: "flow-field-label",
				for: v.input
			}, "Input", 8, Vn),
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
				onKeydown: [t[1] ||= L((...e) => j(J) && j(J)(...e), ["enter"]), L(ne(d, ["alt", "prevent"]), ["down"])]
			}, null, 40, Hn), [[N, r.value]]), m("button", {
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
				m("code", null, A(o.value[0]?.name), 1),
				t[4] ||= h("), or choose it from the list. Left empty, it only runs with one wired in. ", -1)
			], 8, Un)
		])) : f("", !0);
	}
}, Gn = 30;
function Kn() {
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
function qn(e) {
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
var Jn = `<script>(${qn})(${JSON.stringify(`(${Kn})()`)})<\/script>`;
function Yn(e, t, { timeoutSeconds: n = Gn } = {}) {
	return new Promise((r, i) => {
		let a = document.createElement("iframe");
		a.sandbox = "allow-scripts", a.hidden = !0, a.srcdoc = Jn;
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
var Xn = k([
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
]), Y = k({}), Zn = /* @__PURE__ */ new Set(["boundary", "unknown"]), Qn = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)?$/, $n = /^[a-z][a-z0-9-]*$/, er = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i, tr = null;
function nr({ id: e, label: t, colors: n }) {
	if (!$n.test(e ?? "")) throw Error(`A category's id is lowercase letters, digits and hyphens: "${e}" isn't.`);
	if (!t) throw Error(`Category ${e} needs a label.`);
	if (Zn.has(e) || Xn.some((t) => t.id === e)) throw Error(`There's already a category called ${e}.`);
	let { from: r, to: i, label: a = "#fff" } = n ?? {};
	if (![
		r,
		i,
		a
	].every((e) => er.test(e ?? ""))) throw Error(`Category ${e} needs colors: { from, to } (and optionally label), each a #hex colour.`);
	typeof document < "u" && (tr ??= document.head.appendChild(document.createElement("style")), tr.textContent += `.flow-node--${e} { --node-color-from: ${r}; --node-color-to: ${i}; --node-label-color: ${a}; }\n`), Xn.push({
		id: e,
		label: t
	});
}
var rr = [
	"text",
	"number",
	"select",
	"checkbox",
	"code",
	"file",
	"readonly",
	"custom"
], ir = [
	"required",
	"min",
	"max",
	"pattern",
	"when"
], ar = /^[a-z_][a-z0-9_]*$/;
function or(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let { name: i, hint: a, required: o } of n) {
		if (!ar.test(i ?? "")) throw Error(`Node kind ${e} has a ${t} named "${i}": use lowercase letters, digits and _.`);
		if (t === "input pin" && (a !== void 0 && typeof a != "string" || o !== void 0 && typeof o != "boolean")) throw Error(`Node kind ${e}'s input pin ${i} needs its hint to be text and required true or false.`);
		if (t === "slot" && i === "data") throw Error(`Node kind ${e} has a slot named data: that's the first slot's name.`);
		if (r.has(i)) throw Error(`Node kind ${e} has two ${t}s named ${i}.`);
		r.add(i);
	}
}
function sr(e, t) {
	if (!Array.isArray(t)) throw Error(`Node kind ${e}'s fields must be a list.`);
	let n = /* @__PURE__ */ new Set();
	for (let r of t) {
		let t = `Node kind ${e}'s field ${r?.key ?? "(no key)"}`;
		if (!rr.includes(r?.type)) throw Error(`${t} has type "${r?.type}": use one of ${rr.join(", ")}.`);
		if (r.type === "custom") {
			if (!r.component) throw Error(`${t} is custom, so it needs a component.`);
			continue;
		}
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(r.key ?? "")) throw Error(`${t} needs a key that's an identifier.`);
		if (n.has(r.key)) throw Error(`${t} is there twice.`);
		n.add(r.key);
		for (let e of r.validate ?? []) {
			if (!e?.message) throw Error(`${t} has a rule with no message.`);
			if (ir.filter((t) => e[t] !== void 0).length !== 1) throw Error(`${t} has a rule that needs exactly one of ${ir.join(", ")}.`);
			if (e.severity && !["error", "warn"].includes(e.severity)) throw Error(`${t} has a rule whose severity is "${e.severity}": use 'error' or 'warn'.`);
		}
	}
}
function X(e) {
	let { kind: t, label: n, category: r } = e;
	if (!Qn.test(t ?? "")) throw Error(`A node kind's name is lowercase letters, digits and hyphens, with one dot at most: "${t}" isn't.`);
	if (Z(t)) throw Error(`There's already a node kind called ${t}.`);
	if (!n) throw Error(`Node kind ${t} needs a label.`);
	if (!Xn.some((e) => e.id === r)) throw Error(`Node kind ${t} is in category "${r}", which isn't defined.`);
	if (e.description !== void 0 && typeof e.description != "string") throw Error(`Node kind ${t}'s description needs to be text.`);
	if (e.run !== void 0 && typeof e.run != "function") throw Error(`Node kind ${t}'s run must be a function.`);
	if (e.fields !== void 0 && sr(t, e.fields), Array.isArray(e.slots)) or(t, "slot", e.slots);
	else if (e.slots !== void 0 && typeof e.slots != "function") throw Error(`Node kind ${t}'s slots must be a list, or a function of the node's data.`);
	if (Array.isArray(e.inputPins)) or(t, "input pin", e.inputPins);
	else if (e.inputPins !== void 0 && typeof e.inputPins != "function") throw Error(`Node kind ${t}'s inputPins must be a list, or a function of the node's data.`);
	let i = e.idPrefix ?? br(n).replaceAll("_", "");
	if (!/^[a-z][a-z0-9]*$/.test(i)) throw Error(`Node kind ${t} needs an idPrefix of lowercase letters and digits (its label doesn't make one).`);
	Y[t] = Object.freeze(v({
		runs: typeof e.run == "function" || e.where === "server",
		...e,
		fields: (e.fields ?? []).map((e) => Object.freeze(v({ ...e }))),
		idPrefix: i
	}));
}
function cr(e) {
	let t = {};
	for (let n of Q(e.kind).fields ?? []) n.key && n.default !== void 0 && (t[n.key] = n.default);
	return {
		...t,
		...e
	};
}
var lr = /* @__PURE__ */ new Set([
	"label",
	"autoRun",
	"sqlServerTables"
]), ur = (e, t) => lr.has(t) || Q(e).fields?.some((e) => e.key === t && e.affectsOutput === !1) || !1;
function dr(e, t, n) {
	return e.when ? !!e.when(t, n) : e.required ? t == null || t === "" : e.min === void 0 ? e.max === void 0 ? e.pattern !== void 0 && typeof t == "string" && t !== "" && !new RegExp(e.pattern).test(t) : typeof t == "number" && t > e.max : typeof t == "number" && t < e.min;
}
function fr(e, t, n) {
	let r = [], i = {
		key: e.key,
		label: e.label ?? e.key
	};
	for (let a of e.validate ?? []) {
		let e;
		try {
			e = dr(a, t, n);
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
function pr(e) {
	let t = cr(e);
	return (Q(e.kind).fields ?? []).filter((e) => e.key && (!e.visible || e.visible(t))).flatMap((e) => fr(e, t[e.key], t)).sort((e, t) => e.severity === t.severity ? 0 : e.severity === "error" ? -1 : 1);
}
var mr = "application/x-flow-node-kind", hr = (e) => Object.keys(Y).filter((t) => Y[t].category === e), Z = (e) => typeof e == "string" && e in Y && Object.hasOwn(Y, e), Q = (e) => Z(e) ? Y[e] : {
	label: String(e),
	category: "unknown",
	unknown: !0
};
function gr(e, t) {
	let n = 1;
	for (; t.has(`${e}${n}`);) n++;
	return `${e}${n}`;
}
var _r = (e, t) => gr(Y[e].idPrefix, new Set(t));
function vr(e, t) {
	let n = new Set(t);
	return n.has(e) ? gr(e, n) : e;
}
var yr = (e, t) => Z(e) && RegExp(`^${Y[e].idPrefix}\\d+$`).test(t);
function br(e) {
	let t = e.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
	return /^\d/.test(t) ? `_${t}` : t;
}
var xr = (e, t) => `${e}_${t.outputSuffix || "data"}`;
function Sr(e) {
	if (!Z(e.kind)) return null;
	let { where: t } = Y[e.kind];
	return (typeof t == "function" ? t(e) : t) ?? null;
}
var Cr = (e) => Sr(e) === "server", wr = (e, t) => typeof e == "function" ? e(t) ?? [] : e ?? [];
function Tr(e, t) {
	let n = {
		name: null,
		label: t.outputSuffix || "data",
		ref: xr(e, t),
		pin: !1
	}, r = new Set(t.slotPins ?? []);
	return [n, ...(Z(t.kind) ? wr(Y[t.kind].slots, cr(t)) : []).filter((e) => e.name !== n.label).map((t) => ({
		name: t.name,
		label: t.label ?? t.name,
		ref: `${e}_${t.name}`,
		pin: !!t.pin || r.has(t.name)
	}))];
}
function Er(e, t) {
	let n = Tr(e, t);
	return [{
		handle: "source-0",
		slots: n
	}, ...n.filter((e) => e.pin).map((e) => ({
		handle: `source:${e.name}`,
		slots: [e]
	}))];
}
function Dr(e, t, n) {
	let r = Tr(t, n);
	if (!e?.startsWith("source:")) return r;
	let i = e.slice(7);
	return r.filter((e) => e.name === i);
}
function Or(e) {
	return [{
		handle: "target-0",
		name: null,
		label: null,
		many: !0,
		hint: null,
		required: !1
	}, ...(Z(e.kind) ? wr(Y[e.kind].inputPins, cr(e)) : []).map((e) => ({
		handle: `target:${e.name}`,
		name: e.name,
		label: e.label ?? e.name,
		many: !!e.many,
		hint: e.hint ?? null,
		required: !!e.required
	}))];
}
function kr(e, t) {
	let n = new Set(t);
	return Or(e).filter((e) => e.required && !n.has(e.handle)).map((e) => `${e.label}: wire a node into this input first.`);
}
var Ar = (e) => Array.from({ length: e }, (t, n) => `${(n + 1) / (e + 1) * 100}%`), jr = (e) => e?.message ?? String(e), Mr = (e, t) => e.state === "connected" && typeof e[t] == "function";
X({
	kind: "sql-query",
	label: "SQLQuery",
	description: "Queries the nodes wired in with DuckDB SQL, here in the browser, or on the server when it reads the server's own tables.",
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
		else if (Mr(e.server, "query")) await e.loadParquet(n, await e.server.query({
			sql: t,
			inputs: await e.parquet()
		}));
		else return { error: `This query reads ${r.length === 1 ? `${r[0]}, which isn't` : `${r.join(", ")}, which aren't`} wired in, so it runs on the server, which isn't available.` };
		let i = await e.spatialWarnings(t);
		return {
			table: n,
			...i.length ? { warnings: i } : {}
		};
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
	description: "Runs Python on the server, in its sandbox, with each node wired in as a pandas DataFrame. Its last expression is its output.",
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
		if (!Mr(e.server, "runPython")) return { error: "PythonScript nodes run on the server, which isn't available. Every other kind runs here in the browser." };
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
	description: "Runs JavaScript here in the browser, in a sandbox, with each node wired in as an array of rows. What it returns is its output.",
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
			({value: r, logs: i} = await Yn(t, n));
		} catch (e) {
			return {
				error: jr(e),
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
	description: "Reads a file (CSV, Excel, Parquet, JSON, SQLite, or a geo file) into tables, once when it's chosen.",
	category: "import",
	idPrefix: "dataingest",
	outputName: !0,
	fields: [{
		type: "custom",
		component: Nn
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
		return de(t) ? { tables: n } : { table: n[0].table };
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
	description: "Writes what's wired in to a file, which downloads when it runs, and passes it on unchanged.",
	category: "export",
	idPrefix: "dataexport",
	fields: [
		{
			type: "custom",
			component: Wn
		},
		{
			key: "exportFilename",
			label: "Filename",
			type: "text",
			placeholder: "export",
			hint: (e, t) => {
				let n = t || "export";
				return `Saves as ${me(n, e.exportFormat || pe(n) || "csv")}`;
			}
		},
		{
			key: "exportFormat",
			label: "File Type",
			type: "select",
			options: [{
				value: "",
				label: "From file name (CSV if none)"
			}, ...le.map((e) => ({
				value: e,
				label: W[e].label
			}))]
		}
	],
	runHint: "Writes whatever's wired into this node on Run. Downloads to your computer immediately; errors show in the Terminal panel.",
	async run(e) {
		let t = Nr(e.node, e.inputs);
		if (t.error) return t;
		let { input: n, tables: r } = t, i = (e.node.exportFilename ?? "").trim() || "export", a = e.node.exportFormat || pe(i) || "csv", o = me(i, a), s = W[a], c = r ?? [{
			name: br(n.id) || "data",
			table: t.table
		}];
		if (c.length > 1 && !s.writeTables) return { error: `${s.label} holds one table, and ${n.id} has ${c.length}. Put a SQLQuery node in between to pick one.` };
		let l = a === "parquet" ? await e.parquetOf(c[0].table) : await Pr(e.sql, a, c, o), u = a === "geojson" || a === "kml" ? await Ot(e.sql, c, s.label) : [];
		return {
			...r ? { tables: r } : { table: t.table },
			export: {
				filename: o,
				contentType: s.contentType,
				size: l.length,
				bytes: l
			},
			...u.length ? { warnings: u } : {}
		};
	}
});
function Nr(e, t) {
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
async function Pr(e, t, n, r) {
	let i = r.replace(/\.[^.]*$/, "") || "export";
	if (t === "geojson") return $e(e, n[0].table);
	if (t === "kml") return tt(e, n, i);
	if (t === "gpkg") return ot(e, n);
	if (t === "shapefile") return dt(e, n, i);
	if (t === "sqlite") {
		if (!e.writeSqlite) throw Error("This SQL engine can't write SQLite files.");
		let t = [];
		for (let r of n) t.push(await Fr(e, r));
		return e.writeSqlite(t);
	}
	let a = {
		csv: "FORMAT csv, HEADER",
		tsv: "FORMAT csv, DELIMITER '	', HEADER",
		json: "FORMAT json, ARRAY true",
		parquet: "FORMAT parquet",
		xlsx: "FORMAT xlsx, HEADER true"
	}[t];
	t === "xlsx" && await Ce(e);
	let o = `flow-export-${Date.now()}-${r}`;
	await Se(e, `SELECT * FROM ${n[0].table}`, o, a);
	try {
		let n = await e.readFile(o);
		return t === "xlsx" ? Yt(n) : n;
	} finally {
		await e.dropFile(o);
	}
}
async function Fr(e, { name: t, table: n }) {
	let r = (await e.query(`DESCRIBE SELECT * FROM ${n}`)).rows.map(([e, t]) => ({
		column: e,
		geometry: Ge(t) !== void 0,
		blob: String(t) === "BLOB"
	})), i = r.map(({ column: e, geometry: t, blob: n }) => {
		let r = G(e);
		return t ? `ST_AsText(${r}) AS ${r}` : n ? `hex(${r}) AS ${r}` : r;
	}), { columns: a, rows: o } = await e.query(`SELECT ${i.join(", ")} FROM ${n}`);
	return {
		name: t,
		columns: a,
		rows: o.map((e) => e.map((e, t) => r[t].blob && e !== null ? xe(e) : e))
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
var Ir = {
	key: 0,
	class: "flow-node-kind"
}, Lr = ["aria-label", "title"], Rr = {
	key: 2,
	class: "flow-blink-dot flow-node-server-dot",
	role: "img",
	"aria-label": "Executes on server",
	title: "Executes on server"
}, zr = {
	key: 4,
	class: "flow-node-ref-hint"
}, Br = {
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
		}, r = t, i = _(q), a = u(() => Q(r.data.kind)), o = u(() => Cr(r.data)), s = u(() => i.server.value.state), c = u(() => pr(r.data)), m = u(() => c.value.find((e) => e.severity === "error")), h = u(() => i.run.status[r.id] === "completed" ? i.run.results[r.id]?.warnings ?? [] : []), v = u(() => [...c.value.filter((e) => e.severity === "warn"), ...h.value.map((e) => ({
			label: "Last run",
			message: e
		}))]), y = ae(), S = u(() => new Set(y.value.map((e) => e.source === r.id ? e.sourceHandle : e.targetHandle))), C = u(() => kr(r.data, S.value)), T = u(() => o.value && s.value === "unavailable" ? "Backend not available." : n[i.run.status[r.id]] ?? (a.value.unknown ? "Not available here." : m.value ? `${m.value.label}: ${m.value.message}` : C.value[0] ?? "")), E = (e) => u(() => {
			let t;
			if (a.value.unknown) {
				let n = y.value.filter((t) => (e === "source" ? t.source : t.target) === r.id).map((t) => e === "source" ? t.sourceHandle : t.targetHandle);
				t = [.../* @__PURE__ */ new Set([`${e}-0`, ...n])].sort((e, t) => e.localeCompare(t, void 0, { numeric: !0 })).map((e) => ({
					id: e,
					label: null,
					refs: []
				}));
			} else t = e === "target" ? Or(r.data).map((e) => ({
				id: e.handle,
				label: e.label,
				hint: e.hint,
				required: e.required,
				refs: []
			})) : Er(r.id, r.data).map((e) => ({
				id: e.handle,
				label: e.handle === "source-0" ? null : e.slots[0].label,
				refs: e.slots.map((e) => e.ref)
			}));
			let n = Ar(t.length);
			return t.map((e, t) => ({
				...e,
				top: n[t]
			}));
		}), ee = E("target"), k = E("source"), M = (e) => e.label ? `${e.label}${e.hint ? `: ${e.hint}` : ""}${e.required ? " (required)" : ""}` : void 0, te = D(!1), N = D(null);
		return (n, r) => I((w(), p("div", {
			class: b(["flow-node", [`flow-node--${a.value.category}`, { "is-hovered": te.value }]]),
			onPointerenter: r[1] ||= (e) => te.value = !0,
			onPointerleave: r[2] ||= (e) => te.value = !1
		}, [
			t.data.label ? (w(), p("span", Ir, A(a.value.label), 1)) : f("", !0),
			g(se, {
				label: t.data.label || a.value.label,
				status: T.value,
				selected: t.selected
			}, null, 8, [
				"label",
				"status",
				"selected"
			]),
			v.value.length ? (w(), p("span", {
				key: 1,
				class: b(["flow-node-warning", { "is-beside-dot": o.value && s.value === "connected" }]),
				role: "img",
				"aria-label": v.value.map((e) => `${e.label}: ${e.message}`).join(" "),
				title: v.value.map((e) => `${e.label}: ${e.message}`).join("\n")
			}, "!", 10, Lr)) : f("", !0),
			o.value && s.value === "connected" ? (w(), p("span", Rr)) : f("", !0),
			(w(!0), p(l, null, O(j(ee), (e) => (w(), d(j(z), {
				id: e.id,
				key: e.id,
				type: "target",
				position: j(re).Left,
				connectable: !a.value.unknown,
				class: b(["flow-handle flow-handle--in", {
					"is-connected": S.value.has(e.id),
					"is-required": e.required && !S.value.has(e.id)
				}]),
				style: x({ top: e.top }),
				title: M(e)
			}, null, 8, [
				"id",
				"position",
				"connectable",
				"class",
				"style",
				"title"
			]))), 128)),
			(w(!0), p(l, null, O(j(k), (e) => (w(), d(j(z), {
				id: e.id,
				key: e.id,
				type: "source",
				position: j(re).Right,
				connectable: !a.value.unknown,
				class: b(["flow-handle flow-handle--out", { "is-connected": S.value.has(e.id) }]),
				style: x({ top: e.top }),
				onPointerenter: (t) => N.value = e,
				onPointerleave: r[0] ||= (e) => N.value = null
			}, null, 8, [
				"id",
				"position",
				"connectable",
				"class",
				"style",
				"onPointerenter"
			]))), 128)),
			te.value ? (w(), p(l, { key: 3 }, [(w(!0), p(l, null, O(j(ee).filter((e) => e.label), (e) => (w(), p("span", {
				key: e.id,
				class: "flow-pin-label flow-pin-label--in",
				style: x({ top: e.top })
			}, A(e.label), 5))), 128)), (w(!0), p(l, null, O(j(k).filter((e) => e.label), (e) => (w(), p("span", {
				key: e.id,
				class: "flow-pin-label flow-pin-label--out",
				style: x({ top: e.top })
			}, A(e.label), 5))), 128))], 64)) : f("", !0),
			N.value?.refs.length ? (w(), p("span", zr, [(w(!0), p(l, null, O(N.value.refs, (e) => (w(), p("span", {
				key: e,
				class: "flow-node-ref-hint-line"
			}, A(e), 1))), 128))])) : f("", !0)
		], 34)), [[j(e), {
			items: j(Fn),
			context: t.id
		}]]);
	}
}, Vr = ["d"], Hr = [
	"id",
	"x1",
	"y1",
	"x2",
	"y2"
], Ur = ["d", "stroke"], Wr = ["d", "stroke"], Gr = ["d"], Kr = ["d"], qr = {
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
		}, c = M().replace(/[^\w-]/g, ""), d = `flow-wire-flowed-${c}`, h = `flow-wire-flowing-${c}`;
		return (n, r) => I((w(), p("g", null, [
			o.value === "pristine" || o.value === "dormant" ? (w(), p("path", {
				key: 0,
				class: b(["flow-wire", o.value === "pristine" ? "flow-wire--idle" : "flow-wire--waiting"]),
				d: i.value
			}, null, 10, Vr)) : (w(), p(l, { key: 1 }, [
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
				}, null, 2)], 8, Hr))), 128))]),
				m("path", {
					class: "flow-wire",
					d: i.value,
					stroke: `url(#${d})`
				}, null, 8, Ur),
				m("path", {
					class: b(["flow-wire flow-wire--grow", { "is-complete": o.value === "flowed" }]),
					d: i.value,
					pathLength: "1",
					stroke: `url(#${h})`
				}, null, 10, Wr)
			], 64)),
			t.selected ? (w(), p("path", {
				key: 2,
				class: "flow-wire-gaps",
				d: i.value
			}, null, 8, Gr)) : f("", !0),
			m("path", {
				class: "flow-wire-hit",
				d: i.value
			}, null, 8, Kr)
		])), [[j(e), {
			items: j(In),
			context: t.id
		}]]);
	}
}, Jr = [
	"x1",
	"y1",
	"x2",
	"y2"
], Yr = ["d", "stroke"], Xr = {
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
		}), s = `flow-connection-line-${M().replace(/[^\w-]/g, "")}`;
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
		}, null, 2)], 8, Jr)]), m("path", {
			class: "flow-wire flow-connection-line",
			d: r.value,
			stroke: `url(#${s})`
		}, null, 8, Yr)], 64));
	}
}, Zr = {
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
		let l = (e) => e.dataTransfer.types.includes(mr);
		function u(e) {
			l(e) && (e.preventDefault(), e.dataTransfer.dropEffect = "copy");
		}
		function d(e) {
			if (!l(e)) return;
			e.preventDefault();
			let t;
			try {
				t = JSON.parse(e.dataTransfer.getData(mr));
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
			onContextmenu: t[0] ||= (...e) => j(r).setContextPoint && j(r).setContextPoint(...e),
			onDragover: u,
			onDrop: d
		}, [g(j(B), {
			"min-zoom": .25,
			"max-zoom": 2,
			"connection-mode": j(R).Strict,
			"is-valid-connection": j(r).isValidConnection,
			"delete-key-code": null,
			"nodes-focusable": !1,
			"edges-focusable": !1,
			"selection-key-code": null,
			"multi-selection-key-code": null
		}, {
			"node-pipeline": F(({ id: e, data: t, selected: n }) => [g(Br, {
				id: e,
				data: t,
				selected: n
			}, null, 8, [
				"id",
				"data",
				"selected"
			])]),
			"edge-wire": F((e) => [g(qr, {
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
			"connection-line": F((e) => [g(Xr, {
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
			default: F(() => [g(j(oe), {
				class: "flow-canvas-dots",
				gap: 24,
				size: 1
			})]),
			_: 1
		}, 8, ["connection-mode", "is-valid-connection"])], 32));
	}
}, Qr = {
	key: 0,
	class: "flow-panel-empty"
}, $r = ["title"], ei = {
	key: 1,
	class: "flow-terminal-line flow-terminal-note"
}, ti = {
	__name: "TerminalPanel",
	setup(e) {
		let t = _(q), n = t.selectedNode, r = u(() => n.value ? t.logs.nodes[n.value.id]?.entries ?? [] : t.logs.app), i = u(() => n.value && t.run.status[n.value.id] === "stale"), a = {
			output: "flow-terminal-output",
			error: "flow-terminal-error",
			warning: "flow-terminal-line flow-terminal-warning",
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
				r.value.length ? f("", !0) : (w(), p("p", Qr, " Nothing to show yet — run a node to see its output or errors here. ")),
				(w(!0), p(l, null, O(r.value, (e) => (w(), d(ee(e.type === "output" || e.type === "error" ? "pre" : "p"), {
					key: e.id,
					class: b(a[e.type])
				}, {
					default: F(() => [h(A(e.text), 1), e.count > 1 ? (w(), p("span", {
						key: 0,
						class: "flow-terminal-count",
						title: j(n) ? `${e.count} times since this node last changed` : `${e.count} times`
					}, " ×" + A(e.count), 9, $r)) : f("", !0)]),
					_: 2
				}, 1032, ["class"]))), 128)),
				i.value && r.value.length ? (w(), p("p", ei, " This node has changed since it ran (or something upstream has). Its next run starts a new log. ")) : f("", !0)
			], 512)]),
			_: 1
		}));
	}
}, ni = { class: "flow-library" }, ri = { class: "flow-library-heading" }, ii = { class: "flow-library-cards" }, ai = ["title", "onDragstart"], oi = {
	__name: "LibraryPanel",
	setup(e) {
		let t = u(() => Xn.map((e) => ({
			...e,
			kinds: hr(e.id)
		})).filter((e) => e.kinds.length));
		function n(e, t) {
			let n = t.currentTarget.getBoundingClientRect(), r = {
				x: (t.clientX - n.left) / n.width,
				y: (t.clientY - n.top) / n.height
			};
			t.dataTransfer.setData(mr, JSON.stringify({
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
			default: F(() => [m("div", ni, [(w(!0), p(l, null, O(t.value, (e) => (w(), p("section", {
				key: e.id,
				class: "flow-library-section"
			}, [m("h3", ri, [m("span", {
				class: b(["flow-library-dot", `flow-node--${e.id}`]),
				"aria-hidden": "true"
			}, null, 2), h(" " + A(e.label), 1)]), m("div", ii, [(w(!0), p(l, null, O(e.kinds, (t) => (w(), p("div", {
				key: t,
				class: b(["flow-library-card", `flow-node--${e.id}`]),
				draggable: "true",
				title: j(Y)[t].description ? `${j(Y)[t].description}\n\nDrag onto the canvas to add one.` : `Drag onto the canvas to add ${j(Y)[t].label}`,
				onDragstart: (e) => n(t, e)
			}, [g(se, { label: j(Y)[t].label }, null, 8, ["label"])], 42, ai))), 128))])]))), 128))])]),
			_: 1
		}));
	}
}, si = { class: "flow-props" }, ci = { class: "flow-field" }, li = ["aria-disabled"], ui = {
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
			default: F(() => [m("div", si, [m("div", ci, [m("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": j(t).run.executing,
				onClick: n[0] ||= (e) => j(t).run.executing || j(t).executeGraph()
			}, A(j(t).run.executing ? "Executing…" : "Execute Graph"), 9, li), n[1] ||= m("p", { class: "flow-field-hint" }, " Runs every node with Auto Run on, and the nodes they depend on. ", -1)])])]),
			_: 1
		}));
	}
}, di = { class: "flow-data" }, fi = { class: "flow-table-wrap" }, pi = { class: "flow-table" }, mi = { class: "flow-table-geometry" }, hi = {
	key: 0,
	class: "flow-table-geometry flow-table-geometry-problem",
	title: "Invalid: self-intersecting rings and the like (ST_IsValid). Empty: no coordinates (ST_IsEmpty)."
}, gi = ["title"], _i = { class: "flow-pager" }, vi = ["aria-disabled"], yi = ["aria-disabled"], bi = {
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
		function s(e) {
			let t = e.types?.length ? e.types.join(", ") + (e.z ? " Z" : "") : "GEOMETRY", n = [e.invalid && `${e.invalid} invalid`, e.empty && `${e.empty} empty`].filter(Boolean);
			return {
				label: `${t} · ${e.crs ?? "CRS unknown"}`,
				problems: n.join(" · ")
			};
		}
		let c = u(() => (n.data.geometry ?? []).map((e) => e ? s(e) : null));
		return (t, n) => (w(), p("div", di, [m("div", fi, [m("table", pi, [m("thead", null, [m("tr", null, [(w(!0), p(l, null, O(e.data.columns, (e, t) => (w(), p("th", { key: t }, [h(A(e) + " ", 1), c.value[t] ? (w(), p(l, { key: 0 }, [m("span", mi, A(c.value[t].label), 1), c.value[t].problems ? (w(), p("span", hi, A(c.value[t].problems), 1)) : f("", !0)], 64)) : f("", !0)]))), 128))])]), m("tbody", null, [(w(!0), p(l, null, O(e.data.rows, (t, n) => (w(), p("tr", { key: n }, [(w(!0), p(l, null, O(t, (t, r) => (w(), p("td", {
			key: r,
			title: e.data.wkt?.[n]?.[r] ?? void 0
		}, A(o(t)), 9, gi))), 128))]))), 128))])])]), m("div", _i, [
			m("span", null, "Page " + A(e.data.page + 1), 1),
			m("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(-1),
				onClick: n[0] ||= (e) => a(-1)
			}, " Prev ", 8, vi),
			m("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(1),
				onClick: n[1] ||= (e) => a(1)
			}, " Next ", 8, yi)
		])]));
	}
}, xi = {
	key: 0,
	class: "flow-panel-empty"
}, Si = {
	key: 1,
	class: "flow-panel-empty"
}, Ci = {
	key: 2,
	class: "flow-panel-empty"
}, wi = {
	key: 3,
	class: "flow-data-tabs"
}, Ti = {
	key: 0,
	class: "flow-tabs",
	role: "tablist",
	"aria-label": "Outputs"
}, Ei = ["aria-selected", "onClick"], Di = {
	key: 1,
	class: "flow-value"
}, Oi = { class: "flow-value-type" }, ki = { class: "flow-value-text" }, Ai = {
	key: 2,
	class: "flow-panel-empty"
}, ji = {
	key: 3,
	class: "flow-tabs",
	role: "tablist"
}, Mi = [
	"aria-selected",
	"title",
	"onClick"
], Ni = {
	key: 0,
	class: "flow-panel-empty"
}, Pi = {
	__name: "DataPanel",
	setup(e) {
		let t = _(q), n = t.selectedNode, r = u(() => n.value && t.run.results[n.value.id]), i = u(() => n.value && t.run.status[n.value.id] === "running"), a = D(null), o = D(null);
		P(n, () => {
			a.value = null, o.value = null;
		}), P(a, () => o.value = null);
		let s = u(() => r.value?.slots?.length ? [{
			name: null,
			ref: xr(n.value.id, n.value.data)
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
			default: F(() => [!r.value || r.value.error ? (w(), p("p", xi, "Run a node to see its output here.")) : r.value.export && r.value.export.downloaded ? (w(), p("p", Si, " “" + A(r.value.export.filename) + "” was downloaded to your computer. ", 1)) : r.value.export ? (w(), p("p", Ci, " “" + A(r.value.export.filename) + "” was written as this node ran upstream of another, not downloaded. Run this node to download it. ", 1)) : (w(), p("div", wi, [
				s.value.length ? (w(), p("div", Ti, [(w(!0), p(l, null, O(s.value, (e) => (w(), p("button", {
					key: e.ref,
					type: "button",
					role: "tab",
					class: "flow-tab flow-tab--mono",
					"aria-selected": e.name === a.value,
					onClick: (t) => a.value = e.name
				}, A(e.ref), 9, Ei))), 128))])) : f("", !0),
				h.value.value && h.value.value.kind !== "none" ? (w(), p("div", Di, [m("p", Oi, A(h.value.value.type), 1), m("pre", ki, A(h.value.value.kind === "json" ? JSON.stringify(h.value.value.value, null, 2) : h.value.value.text), 1)])) : v.value ? f("", !0) : (w(), p("p", Ai, " This node's output isn't tabular — see the Terminal panel. ")),
				h.value.tables ? (w(), p("div", ji, [(w(!0), p(l, null, O(h.value.tables, (e) => (w(), p("button", {
					key: e.name,
					type: "button",
					role: "tab",
					class: "flow-tab",
					"aria-selected": e === g.value,
					title: e.label === e.name ? void 0 : `${e.label} (${e.name} in SQL)`,
					onClick: (t) => o.value = e.name
				}, A(e.label), 9, Mi))), 128))])) : f("", !0),
				v.value ? (w(), p(l, { key: 4 }, [v.value.rowCount ? (w(), d(bi, {
					key: 1,
					data: v.value,
					busy: i.value,
					onTurn: y
				}, null, 8, ["data", "busy"])) : (w(), p("p", Ni, "No rows."))], 64)) : f("", !0)
			]))]),
			_: 1
		}));
	}
}, Fi = {
	key: 0,
	class: "flow-field"
}, Ii = ["for"], Li = { class: "flow-assist" }, Ri = [
	"id",
	"placeholder",
	"aria-describedby"
], zi = ["aria-disabled"], Bi = ["id"], Vi = {
	key: 0,
	class: "flow-field-hint"
}, Hi = {
	key: 1,
	class: "flow-field-error"
}, Ui = {
	key: 2,
	class: "flow-field-note"
}, Wi = { class: "flow-field-hint" }, Gi = {
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
		}), S = M(), C = {
			request: `${S}-request`,
			note: `${S}-note`
		};
		return (t, n) => r.value ? (w(), p("div", Fi, [
			m("label", {
				class: "flow-field-label",
				for: C.request
			}, "Assistant", 8, Ii),
			m("div", Li, [I(m("textarea", {
				id: C.request,
				"onUpdate:modelValue": n[0] ||= (e) => i.value = e,
				class: "flow-field-input flow-assist-input",
				rows: "2",
				placeholder: `Say what the ${e.language} should do`,
				"aria-describedby": C.note,
				onKeydown: b
			}, null, 40, Ri), [[N, i.value]]), m("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": !d.value,
				onClick: v
			}, A(l.value ? "Writing…" : "Write"), 9, zi)]),
			m("div", {
				id: C.note,
				class: "flow-assist-status",
				"aria-live": "polite"
			}, [l.value ? (w(), p("p", Vi, A(a.value === "reading" ? "Reading its inputs…" : `Writing with ${r.value.model}…`), 1)) : s.value ? (w(), p("p", Hi, A(s.value), 1)) : o.value ? (w(), p("p", Ui, [h(A(o.value) + " ", 1), g.value ? (w(), p("button", {
				key: 0,
				type: "button",
				class: "flow-suggestion",
				onClick: y
			}, "Undo")) : f("", !0)])) : f("", !0), m("p", Wi, A(x.value) + " Check what it writes before you run it.", 1)], 8, Bi)
		])) : f("", !0);
	}
}, Ki = { key: 0 }, qi = {
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
		return (e, t) => (w(!0), p(l, null, O(n.value, ({ part: e, code: t }, n) => (w(), p(l, { key: n }, [t ? (w(), p("code", Ki, A(e), 1)) : (w(), p(l, { key: 1 }, [h(A(e), 1)], 64))], 64))), 128));
	}
}, Ji = {
	key: 1,
	class: "flow-field-check"
}, Yi = ["checked"], Xi = { class: "flow-field" }, Zi = {
	key: 1,
	class: "flow-field-label"
}, Qi = [
	"type",
	"min",
	"max",
	"step",
	"placeholder",
	"aria-invalid"
], $i = [
	"rows",
	"placeholder",
	"aria-invalid",
	"onKeydown"
], ea = ["value"], ta = ["value"], na = ["accept", "disabled"], ra = {
	key: 0,
	class: "flow-field-error"
}, ia = {
	key: 1,
	class: "flow-field-error"
}, aa = {
	key: 2,
	class: "flow-field-hint"
}, oa = {
	key: 3,
	class: "flow-field-hint"
}, sa = {
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
		function k(e) {
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
		}), z = u(() => cr(t.node.data)), re = u(() => t.field.key ? fr(t.field, R.value, z.value) : []), B = u(() => !!c.value || re.value.some((e) => e.severity === "error")), ie = u(() => {
			let { hint: e } = t.field;
			return typeof e == "function" ? e(z.value, R.value) : e ?? "";
		}), ae = u(() => {
			let { options: e } = t.field;
			return (typeof e == "function" ? e(z.value) : e) ?? [];
		}), V = u(() => r.reading.has(t.node.id)), oe = M(), H = `${oe}-input`, U = `${oe}-note`;
		return (t, r) => e.field.type === "custom" ? (w(), d(ee(e.field.component), {
			key: 0,
			node: e.node
		}, null, 8, ["node"])) : e.field.type === "checkbox" ? (w(), p("label", Ji, [h(A(e.field.label) + " ", 1), m("input", {
			type: "checkbox",
			checked: !!o.value,
			onChange: r[0] ||= (e) => k(e.target.checked)
		}, null, 40, Yi)])) : (w(), p(l, { key: 2 }, [e.field.type === "code" && e.field.assistant ? (w(), d(Gi, {
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
		])) : f("", !0), m("div", Xi, [
			e.field.type === "file" ? (w(), p("span", Zi, A(e.field.label), 1)) : (w(), p("label", {
				key: 0,
				class: "flow-field-label",
				for: H
			}, A(e.field.label), 1)),
			e.field.type === "text" || e.field.type === "number" ? I((w(), p("input", {
				key: 2,
				id: H,
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
				"aria-describedby": U,
				autocomplete: "off",
				spellcheck: "false",
				onInput: r[2] ||= (e) => c.value = "",
				onBlur: T,
				onKeydown: r[3] ||= L((...e) => j(J) && j(J)(...e), ["enter"])
			}, null, 42, Qi)), [[te, s.value]]) : e.field.type === "code" ? I((w(), p("textarea", {
				key: 3,
				id: H,
				"onUpdate:modelValue": r[4] ||= (e) => s.value = e,
				class: b(["flow-field-input flow-field-input--mono flow-field-code", { "is-invalid": B.value }]),
				rows: e.field.rows ?? 8,
				spellcheck: "false",
				placeholder: e.field.placeholder,
				"aria-invalid": B.value,
				"aria-describedby": U,
				onBlur: T,
				onKeydown: [L(ne(E, ["ctrl", "prevent"]), ["enter"]), L(ne(E, ["meta", "prevent"]), ["enter"])]
			}, null, 42, $i)), [[N, s.value]]) : e.field.type === "select" ? (w(), p("select", {
				key: 4,
				id: H,
				class: b(["flow-field-input flow-field-select", { "is-invalid": B.value }]),
				value: o.value ?? "",
				"aria-describedby": U,
				onChange: r[5] ||= (e) => k(e.target.value === "" ? void 0 : e.target.value)
			}, [(w(!0), p(l, null, O(ae.value, (e) => (w(), p("option", {
				key: e.value,
				value: e.value
			}, A(e.label), 9, ta))), 128))], 42, ea)) : e.field.type === "file" ? (w(), p("label", {
				key: 5,
				class: b(["flow-file", { "is-busy": V.value }])
			}, [m("input", {
				id: H,
				type: "file",
				class: "flow-file-input",
				accept: e.field.accept,
				disabled: V.value,
				"aria-describedby": U,
				onChange: F
			}, null, 40, na), h(" " + A(V.value ? "Reading…" : o.value ? "Choose another file…" : "Choose file…"), 1)], 2)) : e.field.type === "readonly" ? (w(), p("p", {
				key: 6,
				id: H,
				class: "flow-field-readonly"
			}, A(e.field.value?.(z.value) ?? ""), 1)) : f("", !0),
			m("div", { id: U }, [
				c.value ? (w(), p("p", ra, A(c.value), 1)) : f("", !0),
				v.value ? (w(), p("p", ia, A(v.value), 1)) : f("", !0),
				(w(!0), p(l, null, O(re.value, (e) => (w(), p("p", {
					key: e.message,
					class: b(e.severity === "warn" ? "flow-field-warning" : "flow-field-error")
				}, A(e.message), 3))), 128)),
				e.field.type === "file" && o.value ? (w(), p("p", aa, A(o.value.fileName) + " · " + A(j(ge)(o.value.fileSize)), 1)) : f("", !0),
				ie.value ? (w(), p("p", oa, [g(qi, { text: ie.value }, null, 8, ["text"])])) : f("", !0)
			])
		])], 64));
	}
}, ca = { class: "flow-props" }, la = {
	key: 0,
	class: "flow-props-description"
}, ua = { class: "flow-field" }, da = ["for"], fa = [
	"id",
	"aria-invalid",
	"aria-describedby"
], pa = ["id"], ma = {
	key: 0,
	class: "flow-field-error"
}, ha = { class: "flow-field-hint" }, ga = { class: "flow-field" }, _a = ["for"], va = ["id", "placeholder"], ya = {
	key: 1,
	class: "flow-field"
}, ba = ["for"], xa = { class: "flow-field-prefixed" }, Sa = {
	class: "flow-field-prefix",
	"aria-hidden": "true"
}, Ca = [
	"id",
	"aria-invalid",
	"aria-describedby"
], wa = ["id"], Ta = { class: "flow-field-check" }, Ea = ["checked"], Da = { class: "flow-field" }, Oa = { class: "flow-actions" }, ka = ["aria-disabled"], Aa = { class: "flow-field-hint" }, ja = {
	key: 3,
	class: "flow-field-note is-warning"
}, Ma = {
	key: 4,
	class: "flow-field-hint"
}, Na = {
	__name: "NodeProperties",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = _(q), r = u(() => Q(t.node.data.kind)), i = u(() => n.run.status[t.node.id]), a = u(() => i.value === "running"), o = u(() => {
			let e = cr(t.node.data);
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
		let ee = u(() => {
			let e = xr(t.node.id, t.node.data), n = t.node.data.ingest;
			if (!n || !de(n)) return `this node's data as “${e}”`;
			let r = n.tables.map((t) => `“${e}.${t.name}”`);
			return `this node's tables as ${r.slice(0, 3).join(", ")}${r.length > 3 ? ", …" : ""}`;
		}), k = u(() => t.node.data.autoRun !== !1), te = (e) => n.updateData(t.node.id, { autoRun: e.target.checked ? void 0 : !1 }), F = u(() => t.node.data.sqlServerTables ?? []), ne = u(() => Cr(t.node.data)), R = n.server, z = u(() => ne.value && R.value.state !== "connected"), re = u(() => {
			if (r.value.canRun) {
				let e = r.value.canRun(cr(t.node.data));
				if (e) return e;
			}
			let e = pr(t.node.data).find((e) => e.severity === "error");
			if (e) return `${e.label}: ${e.message}`;
			let i = n.flow.edges.value.filter((e) => e.target === t.node.id).map((e) => e.targetHandle ?? "target-0");
			return kr(t.node.data, i)[0] ?? null;
		}), B = u(() => !a.value && !n.reading.has(t.node.id) && !z.value && !re.value), ie = u(() => r.value.runHint ?? "Results land in the Data panel; errors show in the Terminal panel."), ae = M(), V = {
			id: `${ae}-id`,
			idNote: `${ae}-id-note`,
			label: `${ae}-label`,
			output: `${ae}-output`,
			outputNote: `${ae}-output-note`
		};
		return (t, u) => (w(), p("div", ca, [
			r.value.description ? (w(), p("p", la, A(r.value.description), 1)) : f("", !0),
			m("div", ua, [
				m("label", {
					class: "flow-field-label",
					for: V.id
				}, "ID", 8, da),
				I(m("input", {
					id: V.id,
					"onUpdate:modelValue": u[0] ||= (e) => s.value = e,
					class: b(["flow-field-input flow-field-input--mono", { "is-invalid": c.value }]),
					"aria-invalid": !!c.value,
					"aria-describedby": V.idNote,
					spellcheck: "false",
					autocomplete: "off",
					onInput: u[1] ||= (e) => c.value = "",
					onBlur: C,
					onKeydown: u[2] ||= L((...e) => j(J) && j(J)(...e), ["enter"])
				}, null, 42, fa), [[N, s.value]]),
				m("div", { id: V.idNote }, [c.value ? (w(), p("p", ma, A(c.value), 1)) : f("", !0), m("p", ha, " Downstream nodes reference " + A(ee.value) + ". Renaming doesn't update that text inside other nodes' queries or code — you'll need to update those yourself. ", 1)], 8, pa)
			]),
			m("div", ga, [m("label", {
				class: "flow-field-label",
				for: V.label
			}, "Name", 8, _a), I(m("input", {
				id: V.label,
				"onUpdate:modelValue": u[3] ||= (e) => g.value = e,
				class: "flow-field-input",
				placeholder: r.value.label,
				autocomplete: "off",
				onBlur: T,
				onKeydown: u[4] ||= L((...e) => j(J) && j(J)(...e), ["enter"])
			}, null, 40, va), [[N, g.value]])]),
			(w(!0), p(l, null, O(o.value, (t, n) => (w(), d(sa, {
				key: t.key ?? `custom-${n}`,
				node: e.node,
				field: t
			}, null, 8, ["node", "field"]))), 128)),
			r.value.outputName ? (w(), p("div", ya, [
				m("label", {
					class: "flow-field-label",
					for: V.output
				}, "Output Name", 8, ba),
				m("div", xa, [m("span", Sa, A(e.node.id) + "_", 1), I(m("input", {
					id: V.output,
					"onUpdate:modelValue": u[5] ||= (e) => v.value = e,
					class: b(["flow-field-input flow-field-input--mono", { "is-invalid": y.value }]),
					placeholder: "data",
					spellcheck: "false",
					autocomplete: "off",
					"aria-invalid": !!y.value,
					"aria-describedby": V.outputNote,
					onInput: u[6] ||= (e) => y.value = "",
					onBlur: E,
					onKeydown: u[7] ||= L((...e) => j(J) && j(J)(...e), ["enter"])
				}, null, 42, Ca), [[N, v.value]])]),
				y.value ? (w(), p("p", {
					key: 0,
					id: V.outputNote,
					class: "flow-field-error"
				}, A(y.value), 9, wa)) : f("", !0)
			])) : f("", !0),
			r.value.runs ? (w(), p(l, { key: 2 }, [
				ne.value ? (w(), p("p", {
					key: 0,
					class: b(["flow-field-note", { "is-warning": z.value }])
				}, [
					F.value.length ? (w(), p(l, { key: 0 }, [h(" Reads " + A(F.value.join(", ")) + " from the server, so it runs there: ", 1)], 64)) : (w(), p(l, { key: 1 }, [h("Runs on the server:")], 64)),
					h(" running this node sends its input data to the server" + A(j(R).state === "connected" && j(R).address ? ` at ${j(R).address}` : "") + " to complete. ", 1),
					z.value ? (w(), p(l, { key: 2 }, [h("The server isn't available, so it can't run now.")], 64)) : f("", !0)
				], 2)) : f("", !0),
				m("label", Ta, [u[10] ||= h(" Auto Run ", -1), m("input", {
					type: "checkbox",
					checked: k.value,
					onChange: te
				}, null, 40, Ea)]),
				m("div", Da, [m("div", Oa, [m("button", {
					type: "button",
					class: "flow-button flow-button--wide",
					"aria-disabled": !B.value,
					onClick: u[8] ||= (t) => B.value && j(n).runNode(e.node.id)
				}, A(a.value ? "Running…" : "Run"), 9, ka), i.value && !a.value ? (w(), p("button", {
					key: 0,
					type: "button",
					class: "flow-button flow-button--quiet",
					title: "Back to not run: clears its status and output",
					onClick: u[9] ||= (t) => j(n).resetNode(e.node.id)
				}, " Reset ")) : f("", !0)]), m("p", Aa, A(re.value ?? ie.value), 1)])
			], 64)) : r.value.unknown ? (w(), p("p", ja, " This node is a " + A(e.node.data.kind) + " node, which isn't available here: it was made in another app, or with a plugin this app doesn't install, or its kind comes from a server that isn't connected. It can't run or take new wires here, but it keeps its settings and wires, and saving the graph keeps it as it was. ", 1)) : (w(), p("p", Ma, "No editable properties yet for this node kind."))
		]));
	}
}, Pa = {
	key: 1,
	class: "flow-panel-empty"
}, Fa = {
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
			default: F(() => [j(t).selectedNode.value ? (w(), d(Na, {
				key: 0,
				node: j(t).selectedNode.value
			}, null, 8, ["node"])) : (w(), p("p", Pa, "Select a node to see its properties."))]),
			_: 1
		}));
	}
}, Ia = {
	__name: "ServerStatus",
	setup(e) {
		let t = _(q), n = t.server, r = u(() => n.value.state === "connected"), i = u(() => r.value && t.flow.nodes.value.some((e) => Cr(e.data)));
		return (e, t) => j(n).state === "checking" ? f("", !0) : (w(), p("div", {
			key: 0,
			class: b(["flow-server-status", r.value ? "flow-node--modify" : "flow-node--fetch"]),
			role: "status"
		}, [m("span", {
			class: b(["flow-blink-dot", { "is-steady": !i.value }]),
			"aria-hidden": "true"
		}, null, 2), r.value ? (w(), p(l, { key: 0 }, [h(" LIVE · connected to server" + A(j(n).address ? ` ${j(n).address}` : "") + A(j(n).local ? " · LOCAL" : ""), 1)], 64)) : (w(), p(l, { key: 1 }, [h("backend not available, client execution only")], 64))], 2));
	}
}, La = 400;
function Ra(e, t) {
	let n = null, r = null;
	function i() {
		n && (clearTimeout(n), n = null, t.save(e.snapshot.value));
	}
	function a() {
		clearTimeout(n), n = setTimeout(i, La);
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
var za = [
	"FLOW",
	"FLOWDARK",
	"LUX",
	"LUXDARK"
], Ba = new Map(za.map((e) => [e, {
	name: e,
	base: null,
	tokens: {}
}])), $ = (e) => String(e).toUpperCase();
function Va({ name: e, base: t = "FLOW", tokens: n = {} }) {
	if (!e) throw Error("A theme needs a name.");
	if (za.includes($(e))) throw Error(`${$(e)} is a built-in theme; give yours another name.`);
	if (!Ba.has($(t))) throw Error(`Theme ${$(e)} is based on ${$(t)}, which isn't defined.`);
	Ba.set($(e), {
		name: $(e),
		base: $(t),
		tokens: { ...n }
	});
}
var Ha = (e) => Ba.has($(e)), Ua = () => [...Ba.keys()];
function Wa(e) {
	let t = Ba.get($(e)) ?? Ba.get("FLOW");
	if (!t.base) return {
		name: t.name,
		className: `flow-theme-${t.name.toLowerCase()}`,
		tokens: {}
	};
	let n = Wa(t.base);
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
var Ga = { class: "flow-title flow-pan-trigger" }, Ka = { class: "flow-brand-text flow-title-text" }, qa = {
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
			validator: Ha
		},
		autoHideRails: {
			type: Boolean,
			default: !0
		}
	},
	setup(t) {
		let n = t, r = u(() => Wa(n.theme)), a = u(() => r.value.className), o = u(() => r.value.tokens), c = s({ autoHideRails: () => n.autoHideRails }), l = xn({
			sql: n.sql,
			files: n.storage,
			server: n.server
		});
		T(q, l), Ra(l, n.storage);
		let { commands: f, canvasMenu: p } = zn(c, l), h = D(null), _ = (e) => !!e.target.closest(".wm-content");
		function v(e) {
			_(e) || l.onKeydown(e);
		}
		function y(e) {
			h.value.open(e.point, {
				items: Rn,
				context: e
			});
		}
		return T(Pn, (e, t) => h.value.open(e, t)), (n, r) => (w(), d(i, {
			ref_key: "host",
			ref: h,
			class: b(["flow-editor", a.value]),
			layout: j(c),
			commands: j(f),
			role: "application",
			"aria-label": t.title,
			style: x(o.value),
			onKeydown: v
		}, {
			title: F(() => [m("span", Ga, [m("span", Ka, A(t.title), 1)])]),
			panels: F(() => [
				g(ti),
				g(oi),
				g(ui),
				g(Pi),
				g(Fa),
				g(Ia)
			]),
			default: F(() => [I(g(Zr, { onConnectionDropped: y }, null, 512), [[j(e), j(p)]])]),
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
export { q as FLOW_GRAPH, c as FlowPanel, qa as FlowgraphEditor, Xn as NODE_CATEGORIES, Y as NODE_KINDS, a as PANEL_LAYOUT, o as PANEL_MENU, i as PanelHost, s as createPanelLayout, nr as defineNodeCategory, X as defineNodeKind, Va as defineTheme, r as panelCommands, t as panelsSubmenu, Wa as resolveTheme, Ua as themeNames };
