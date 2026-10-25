import { r as e } from "./menu-ByXvYfw3.js";
import { a as t, i as n, n as r, o as i, r as a, s as o, t as s } from "./FlowPanel-KJLZgxLn.js";
import { t as c } from "./panels-RLVnMOgs.js";
import { n as l, t as u } from "./flowGraphKey-DXKsZ2fk.js";
import { Fragment as d, computed as f, createBlock as p, createCommentVNode as m, createElementBlock as h, createElementVNode as g, createTextVNode as _, createVNode as v, inject as y, markRaw as b, nextTick as x, normalizeClass as S, normalizeStyle as C, onBeforeUnmount as w, onMounted as T, openBlock as E, provide as D, reactive as O, ref as k, renderList as A, renderSlot as j, resolveDynamicComponent as M, shallowReactive as N, toDisplayString as P, toRaw as F, unref as I, useId as L, vModelDynamic as ee, vModelText as R, watch as z, withCtx as B, withDirectives as V, withKeys as H, withModifiers as te } from "vue";
import { ConnectionMode as U, Handle as ne, Position as W, VueFlow as G, getBezierPath as re, useNodeConnections as ie, useVueFlow as ae } from "@vue-flow/core";
import { Background as oe } from "@vue-flow/background";
//#region components/NodeFace.vue
var se = ["title"], ce = { class: "flow-node-label" }, le = {
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
		return (t, n) => (E(), h("div", { class: S(["flow-node-face", { "is-selected": e.selected }]) }, [g("span", {
			class: "flow-node-status",
			title: e.status || void 0
		}, P(e.status), 9, se), g("span", ce, P(e.label), 1)], 2));
	}
}, K = {
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
}, ue = Object.keys(K).filter((e) => K[e].read), de = Object.keys(K).filter((e) => K[e].write), fe = ue.flatMap((e) => K[e].extensions).map((e) => `.${e}`).join(",");
function pe(e) {
	let t = K[e.format]?.multi;
	return t === "layers" ? e.tables.length > 1 : !!t;
}
var me = (e) => /\.([^./\\]+)$/.exec(e)?.[1].toLowerCase() ?? "";
function he(e) {
	let t = me(e);
	return Object.keys(K).find((e) => K[e].extensions.includes(t)) ?? null;
}
function ge(e, t) {
	let { extensions: n } = K[t];
	return n.includes(me(e)) ? e : `${e}.${n[0]}`;
}
var _e = (e) => e.replace(/\.[^.]*$/, "").replace(/[_\-\s]+/g, " ").trim();
function ve(e) {
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
var ye = {
	format: "pipeline",
	nodes: [],
	edges: []
};
function be(e, t, n, r = null) {
	return {
		format: "pipeline",
		...xe(e, t, n),
		...r && Object.keys(r).length ? { subnets: r } : {}
	};
}
function xe(e, t, n) {
	return {
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
var Se = (e) => Number.isFinite(e?.x) && Number.isFinite(e?.y);
function Ce(e) {
	if (e?.format !== "pipeline") return null;
	let t = we(e);
	if (!t) return null;
	let n = e.subnets && typeof e.subnets == "object" && !Array.isArray(e.subnets) ? e.subnets : {};
	return {
		...t,
		subnets: n
	};
}
function we(e) {
	if (!Array.isArray(e?.nodes) || !Array.isArray(e.edges)) return null;
	let t = e.nodes.filter((e) => typeof e?.id == "string" && typeof e.kind == "string" && e.kind && Se(e.position)).map(({ id: e, position: t, ...n }) => ({
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
		viewport: Se(e.viewport) && Number.isFinite(e.viewport.zoom) ? e.viewport : null
	};
}
//#endregion
//#region lib/sqlText.js
var q = (e) => `"${e.replaceAll("\"", "\"\"")}"`, J = (e) => `'${e.replaceAll("'", "''")}'`, Te = (e) => Uint8Array.from(e.match(/../g) ?? [], (e) => parseInt(e, 16));
async function Ee(e, t, n, r) {
	let i = await e.query(`COPY (${t}) TO ${J(n)} (${r})`);
	return Number(i.rows[0]?.[0] ?? 0);
}
async function De(e) {
	await e.query("INSTALL excel"), await e.query("LOAD excel");
}
//#endregion
//#region lib/crs.js
var Oe = new TextEncoder(), ke = /* @__PURE__ */ new WeakMap();
function Ae(e) {
	return ke.has(e) || ke.set(e, /* @__PURE__ */ new Map()), ke.get(e);
}
function je(e, t) {
	let n = Ae(e);
	if (!n.has(t)) {
		let r = Me(e, t);
		n.set(t, r), r.catch(() => n.delete(t));
	}
	return n.get(t);
}
async function Me(e, t) {
	let n = `flow-crs-${Date.now()}-${Math.random().toString(36).slice(2)}.geojson`, r = {
		type: "FeatureCollection",
		crs: {
			type: "name",
			properties: { name: t }
		},
		features: []
	};
	await e.registerFile(n, Oe.encode(JSON.stringify(r)));
	try {
		let { rows: r } = await e.query(`SELECT unnest(layers).geometry_fields[1].crs FROM ST_Read_Meta(${J(n)})`), i = r[0]?.[0];
		if (!i?.wkt) throw Error(`GDAL doesn't know the CRS ${t.length > 60 ? `${t.slice(0, 60)}…` : t}.`);
		return i;
	} finally {
		await e.dropFile(n);
	}
}
async function Ne(e, t) {
	let n = await je(e, t), r = JSON.parse(n.projjson), i = r.type === "ProjectedCRS" ? r.base_crs : r;
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
async function Pe(e, t, n) {
	let r = await Ne(e, t), i = await Ne(e, n);
	if (!r.datum || !i.datum || r.datum === i.datum || !r.base.id || !i.base.id || r.base.id === i.base.id) return null;
	let [a, o] = Fe(r.bbox, i.bbox), { rows: s } = await e.query(`SELECT ST_X(p), ST_Y(p) FROM (SELECT ST_Transform(ST_Point(${a}, ${o}), ${J(r.base.id)}, ${J(i.base.id)}) AS p)`), [c, l] = s[0];
	return Math.abs(c - a) < 1e-9 && Math.abs(l - o) < 1e-9 ? {
		from: r,
		to: i
	} : null;
}
function Fe(e, t) {
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
var Ie = 101010256, Le = 33639248, Re = 67324752;
async function ze(e) {
	let t = new DataView(e.buffer, e.byteOffset, e.byteLength), n = Be(t), r = t.getUint16(n + 10, !0), i = t.getUint32(n + 16, !0);
	if (i === 4294967295 || r === 65535) throw Error("This zip is a Zip64 file, which can't be read here.");
	let a = [];
	for (let n = 0; n < r; n++) {
		if (t.getUint32(i, !0) !== Le) throw Error("This zip file is damaged.");
		let n = t.getUint16(i + 8, !0), r = t.getUint16(i + 10, !0), o = t.getUint32(i + 20, !0), s = t.getUint16(i + 28, !0), c = t.getUint16(i + 30, !0), l = t.getUint16(i + 32, !0), u = t.getUint32(i + 42, !0), d = new TextDecoder(n & 2048 ? "utf-8" : "latin1").decode(e.subarray(i + 46, i + 46 + s));
		if (i += 46 + s + c + l, d.endsWith("/")) continue;
		if (n & 1) throw Error(`${d} in this zip is encrypted, so it can't be read.`);
		if (t.getUint32(u, !0) !== Re) throw Error("This zip file is damaged.");
		let f = u + 30 + t.getUint16(u + 26, !0) + t.getUint16(u + 28, !0), p = e.subarray(f, f + o);
		if (r === 0) a.push({
			name: d,
			bytes: p.slice()
		});
		else if (r === 8) a.push({
			name: d,
			bytes: await Ve(p)
		});
		else throw Error(`${d} in this zip is compressed in a way that can't be read here (method ${r}).`);
	}
	return a;
}
function Be(e) {
	for (let t = e.byteLength - 22; t >= Math.max(0, e.byteLength - 22 - 65535); t--) if (e.getUint32(t, !0) === Ie) return t;
	throw Error("This isn't a zip file.");
}
async function Ve(e) {
	let t = new Blob([e]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
	return new Uint8Array(await new Response(t).arrayBuffer());
}
async function He(e) {
	let t = new TextEncoder(), n = [], r = [], i = 0;
	for (let a of e) {
		let e = t.encode(a.name), o = qe(a.bytes), s = await We(a.bytes), c = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(30));
		c.setUint32(0, Re, !0), Ue(c, 4, {
			crc: o,
			size: s.length,
			rawSize: a.bytes.length,
			nameLength: e.length
		});
		let l = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(46));
		l.setUint32(0, Le, !0), l.setUint16(4, 20, !0), Ue(l, 6, {
			crc: o,
			size: s.length,
			rawSize: a.bytes.length,
			nameLength: e.length
		}), l.setUint32(42, i, !0), n.push(new Uint8Array(c.buffer), e, s), r.push(new Uint8Array(l.buffer), e), i += 30 + e.length + s.length;
	}
	let a = r.reduce((e, t) => e + t.length, 0), o = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(22));
	return o.setUint32(0, Ie, !0), o.setUint16(8, e.length, !0), o.setUint16(10, e.length, !0), o.setUint32(12, a, !0), o.setUint32(16, i, !0), Ge([
		...n,
		...r,
		new Uint8Array(o.buffer)
	]);
}
function Ue(e, t, { crc: n, size: r, rawSize: i, nameLength: a }) {
	e.setUint16(t, 20, !0), e.setUint16(t + 2, 2048, !0), e.setUint16(t + 4, 8, !0), e.setUint16(t + 6, 0, !0), e.setUint16(t + 8, 33, !0), e.setUint32(t + 10, n, !0), e.setUint32(t + 14, r, !0), e.setUint32(t + 18, i, !0), e.setUint16(t + 22, a, !0);
}
async function We(e) {
	let t = new Blob([e]).stream().pipeThrough(new CompressionStream("deflate-raw"));
	return new Uint8Array(await new Response(t).arrayBuffer());
}
function Ge(e) {
	let t = new Uint8Array(e.reduce((e, t) => e + t.length, 0)), n = 0;
	for (let r of e) t.set(r, n), n += r.length;
	return t;
}
var Ke = null;
function qe(e) {
	if (!Ke) {
		Ke = /* @__PURE__ */ new Uint32Array(256);
		for (let e = 0; e < 256; e++) {
			let t = e;
			for (let e = 0; e < 8; e++) t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
			Ke[e] = t >>> 0;
		}
	}
	let t = 4294967295;
	for (let n of e) t = Ke[(t ^ n) & 255] ^ t >>> 8;
	return (t ^ 4294967295) >>> 0;
}
//#endregion
//#region lib/geoExport.js
var Je = new TextEncoder();
function Y(e) {
	let t = /^GEOMETRY(?:\('(.*)'\))?$/s.exec(String(e));
	if (t) return t[1] === void 0 ? null : t[1].replaceAll("''", "'");
}
async function Ye(e, t) {
	let { rows: n } = await e.query(`DESCRIBE SELECT * FROM ${t}`);
	return n.map(([e, t]) => ({
		name: e,
		type: String(t),
		crs: Y(t)
	}));
}
var Xe = (e) => e.crs !== void 0;
function Ze(e) {
	let t = e.filter(Xe);
	return t.find((e) => e.name.toLowerCase() === "geometry") ?? t[0] ?? null;
}
var Qe = ["EPSG:4326", "OGC:CRS84"];
function $e(e, t) {
	if (e.crs === null) throw Error(`The CRS of ${e.name} isn't known, so it can't be written as ${t} (longitude and latitude).`);
	let n = q(e.name);
	return `ST_AsGeoJSON(${Qe.includes(e.crs) ? n : `ST_Transform(${n}, 'EPSG:4326')`})`;
}
async function et(e, t, n) {
	let r = await Ye(e, t), i = Ze(r), a = r.map((e) => Xe(e) ? `${$e(e, n)} AS ${q(e.name)}` : /^DECIMAL/.test(e.type) ? `CAST(${q(e.name)} AS DOUBLE) AS ${q(e.name)}` : q(e.name)), { rows: o } = await e.query(`SELECT ${a.join(", ")} FROM ${t}`), s = i ? r.indexOf(i) : r.findIndex((e) => e.name.toLowerCase() === "geometry");
	return {
		columns: r.map((e) => e.name),
		rows: o,
		geometry: s
	};
}
var tt = (e) => typeof e == "string" ? JSON.parse(e) : e ?? null;
async function nt(e, t) {
	let { columns: n, rows: r, geometry: i } = await et(e, t, "GeoJSON");
	if (i < 0) throw Error("GeoJSON needs a geometry column, like a geo file read by DataIngest has.");
	let a = {
		type: "FeatureCollection",
		features: r.map((e) => ({
			type: "Feature",
			geometry: tt(e[i]),
			properties: Object.fromEntries(n.flatMap((t, n) => n === i ? [] : [[t, e[n]]]))
		}))
	};
	return Je.encode(JSON.stringify(a));
}
var rt = (e) => String(e).replace(/[<>&"']/g, (e) => `&${{
	"<": "lt",
	">": "gt",
	"&": "amp",
	"\"": "quot",
	"'": "apos"
}[e]};`);
async function it(e, t, n) {
	let r = [];
	for (let n of t) {
		let { columns: i, rows: a, geometry: o } = await et(e, n.table, "KML");
		if (o < 0) throw Error(`KML needs a geometry column, and ${n.label ?? n.name} has none.`);
		let s = (e) => i.findIndex((t, n) => n !== o && t.toLowerCase() === e), c = s("name"), l = s("description"), u = a.map((e) => {
			let t = (t, n) => n >= 0 && e[n] !== null ? `<${t}>${rt(at(e[n]))}</${t}>` : "", n = i.map((t, n) => [
				o,
				c,
				l
			].includes(n) || e[n] === null ? "" : `<Data name="${rt(t)}"><value>${rt(at(e[n]))}</value></Data>`).join("");
			return "<Placemark>" + t("name", c) + t("description", l) + (n ? `<ExtendedData>${n}</ExtendedData>` : "") + st(tt(e[o])) + "</Placemark>";
		});
		r.push(t.length > 1 ? `<Folder><name>${rt(n.label ?? n.name)}</name>${u.join("\n")}</Folder>` : u.join("\n"));
	}
	return Je.encode(`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${rt(n)}</name>\n${r.join("\n")}\n</Document></kml>\n`);
}
var at = (e) => typeof e == "object" ? JSON.stringify(e) : String(e), ot = (e) => `<coordinates>${e.map((e) => e.join(",")).join(" ")}</coordinates>`;
function st(e) {
	if (!e) return "";
	let t = (e) => {
		let t = e.map(st).join("");
		return t ? `<MultiGeometry>${t}</MultiGeometry>` : "";
	};
	switch (e.type) {
		case "Point": return e.coordinates.length ? `<Point>${ot([e.coordinates])}</Point>` : "";
		case "LineString": return e.coordinates.length ? `<LineString>${ot(e.coordinates)}</LineString>` : "";
		case "Polygon": {
			if (!e.coordinates.length) return "";
			let [t, ...n] = e.coordinates, r = (e) => `<LinearRing>${ot(e)}</LinearRing>`;
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
function ct(e, t) {
	return e.filter((e) => e !== t).map((e) => {
		let t = q(e.name), n = e.type.toUpperCase();
		return Xe(e) ? {
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
async function lt(e, t) {
	if (!e.writeSqlite) throw Error("This SQL engine can't write SQLite files, so it can't write GeoPackages.");
	let n = await je(e, "EPSG:4326"), r = /* @__PURE__ */ new Map([
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
		let t = await Ye(e, n.table), o = Ze(t), s = ct(t, o), c = new Set(s.map((e) => e.name.toLowerCase())), l = [
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
			...s.map((e) => ut[e.kind])
		], d = -1;
		if (o?.crs) {
			let t = await je(e, o.crs), n = Number(t.auth_code);
			d = t.auth_name === "EPSG" && Number.isInteger(n) ? n : 1e5 + r.size, r.has(d) || r.set(d, [
				t.name,
				d,
				t.auth_name || "NONE",
				Number.isInteger(n) ? n : d,
				t.wkt,
				""
			]);
		}
		let f = o && q(o.name), p = [...s.map((e) => e.select), ...f ? [
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
			let t = s.map((t, n) => dt(t.kind, e[n]));
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
				ft(Te(n), d, p, !!a),
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
		for (let [e, t] of [["insert", "+"], ["delete", "-"]]) a.push(`CREATE TRIGGER ${q(`trigger_${e}_feature_count_${n.name}`)} AFTER ${e.toUpperCase()} ON ${q(n.name)} BEGIN UPDATE gpkg_ogr_contents SET feature_count = feature_count ${t} 1 WHERE lower(table_name) = lower(${J(n.name)}); END`);
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
		...pt,
		...[...r.values()].map((e) => ["INSERT INTO gpkg_spatial_ref_sys VALUES (?, ?, ?, ?, ?, ?)", e]),
		...a
	] });
}
var ut = {
	integer: "INTEGER",
	real: "DOUBLE",
	boolean: "BOOLEAN",
	date: "DATE",
	text: "TEXT",
	blob: "BLOB"
};
function dt(e, t) {
	return t == null ? null : e === "boolean" ? +!!t : e === "blob" ? Te(t) : t;
}
function ft(e, t, n, r) {
	let i = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8 + (n ? 32 : 0)));
	return i.setUint8(0, 71), i.setUint8(1, 80), i.setUint8(2, 0), i.setUint8(3, 1 | (n ? 2 : 0) | (r ? 16 : 0)), i.setInt32(4, t, !0), n?.forEach((e, t) => i.setFloat64(8 + t * 8, e, !0)), Ge([new Uint8Array(i.buffer), e]);
}
var pt = [
	"CREATE TABLE gpkg_spatial_ref_sys (srs_name TEXT NOT NULL, srs_id INTEGER PRIMARY KEY, organization TEXT NOT NULL,\n    organization_coordsys_id INTEGER NOT NULL, definition TEXT NOT NULL, description TEXT)",
	"CREATE TABLE gpkg_contents (table_name TEXT NOT NULL PRIMARY KEY, data_type TEXT NOT NULL, identifier TEXT UNIQUE,\n    description TEXT DEFAULT '', last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n    min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE, srs_id INTEGER,\n    CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id))",
	"CREATE TABLE gpkg_geometry_columns (table_name TEXT NOT NULL, column_name TEXT NOT NULL, geometry_type_name TEXT NOT NULL,\n    srs_id INTEGER NOT NULL, z TINYINT NOT NULL, m TINYINT NOT NULL,\n    CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name), CONSTRAINT uk_gc_table_name UNIQUE (table_name),\n    CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),\n    CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys (srs_id))",
	"CREATE TABLE gpkg_ogr_contents (table_name TEXT NOT NULL PRIMARY KEY, feature_count INTEGER DEFAULT NULL)"
];
async function mt(e, t, n) {
	let r = [];
	for (let i of t) {
		let a = i.label ?? i.name, o = await Ye(e, i.table), s = o.filter(Xe);
		if (!s.length) throw Error(`A shapefile needs a geometry column, and ${a} has none.`);
		if (s.length > 1) throw Error(`A shapefile holds one geometry column, and ${a} has ${s.length} (${s.map((e) => e.name).join(", ")}). Leave out the others with a SQLQuery node first.`);
		let [c] = s, l = ct(o, c), { rows: u } = await e.query(`SELECT ${[...l.map((e) => e.select), `ST_AsGeoJSON(${q(c.name)})`].join(", ")} FROM ${i.table}`), d = t.length > 1 ? i.name : n, { shp: f, shx: p } = yt(u.map((e) => tt(e[l.length])), a);
		r.push({
			name: `${d}.shp`,
			bytes: f
		}, {
			name: `${d}.shx`,
			bytes: p
		}, {
			name: `${d}.dbf`,
			bytes: Ct(l, u)
		}, {
			name: `${d}.cpg`,
			bytes: Je.encode("UTF-8")
		}), c.crs && r.push({
			name: `${d}.prj`,
			bytes: Je.encode((await je(e, c.crs)).wkt)
		});
	}
	return He(r);
}
var ht = {
	point: [1, 11],
	multipoint: [8, 18],
	line: [3, 13],
	polygon: [5, 15]
}, gt = {
	Point: "point",
	MultiPoint: "multipoint",
	LineString: "line",
	MultiLineString: "line",
	Polygon: "polygon",
	MultiPolygon: "polygon"
};
function _t(e) {
	switch (e.type) {
		case "Point": return e.coordinates.length ? [[e.coordinates]] : [];
		case "MultiPoint": return [e.coordinates];
		case "LineString": return e.coordinates.length ? [e.coordinates] : [];
		case "MultiLineString": return e.coordinates;
		case "Polygon": return e.coordinates.map((e, t) => vt(e, t === 0));
		case "MultiPolygon": return e.coordinates.flatMap((e) => e.map((e, t) => vt(e, t === 0)));
		default: return [];
	}
}
function vt(e, t) {
	let n = 0;
	for (let t = 0; t < e.length - 1; t++) n += e[t][0] * e[t + 1][1] - e[t + 1][0] * e[t][1];
	return n < 0 === t ? e : [...e].reverse();
}
function yt(e, t) {
	let n = /* @__PURE__ */ new Set();
	for (let r of e) {
		if (!r) continue;
		let e = gt[r.type];
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
	let r = [...n][0], i = e.map((e) => e ? _t(e) : []), a = i.some((e) => e.some((e) => e.some((e) => e.length > 2))), o = r ? ht[r][+!!a] : 0, s = i.map((e) => e.length ? St(o, r, e, a) : bt()), c = i.flat(2), [l, u] = xt(c, 0), [d, f] = xt(c, 1), [p, m] = a ? xt(c, 2) : [0, 0], h = 100 + s.reduce((e, t) => e + 8 + t.length, 0), g = 100 + s.length * 8, _ = (e) => {
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
		shp: Ge(v),
		shx: Ge(y)
	};
}
var bt = () => /* @__PURE__ */ new Uint8Array(4);
function xt(e, t) {
	if (!e.length) return [0, 0];
	let n = Infinity, r = -Infinity;
	for (let i of e) {
		let e = i[t] ?? 0;
		e < n && (n = e), e > r && (r = e);
	}
	return [n, r];
}
function St(e, t, n, r) {
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
	let [f, p] = xt(i, 0), [m, h] = xt(i, 1);
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
		xt(i, 2).forEach(d);
		for (let e of i) d(e[2] ?? 0);
	}
	return new Uint8Array(c.buffer);
}
function Ct(e, t) {
	let n = Et(e.map((e) => e.name)), r = e.map((e, r) => {
		let i = t.map((e) => e[r]), a = {
			name: n[r],
			...wt(e.kind, i)
		};
		return a.cells = i.map((e) => a.format(e)), a.width = Math.min(254, a.cells.reduce((e, t) => Math.max(e, t.length), 1)), a;
	}), i = 32 + 32 * r.length + 1, a = 1 + r.reduce((e, t) => e + t.width, 0), o = new Uint8Array(i + a * t.length + 1), s = new DataView(o.buffer), c = /* @__PURE__ */ new Date();
	return o[0] = 3, o[1] = c.getFullYear() - 1900, o[2] = c.getMonth() + 1, o[3] = c.getDate(), s.setUint32(4, t.length, !0), s.setUint16(8, i, !0), s.setUint16(10, a, !0), r.forEach((e, t) => {
		let n = 32 + t * 32;
		o.set(Je.encode(e.name), n), o[n + 11] = e.type.charCodeAt(0), o[n + 16] = e.width, o[n + 17] = e.decimals;
	}), o[i - 1] = 13, o.fill(32, i, o.length - 1), t.forEach((e, t) => {
		let n = i + t * a + 1;
		for (let e of r) {
			let r = e.cells[t].subarray(0, e.width);
			o.set(r, e.right ? n + e.width - r.length : n), n += e.width;
		}
	}), o[o.length - 1] = 26, o;
}
function wt(e, t) {
	let n = (e) => Je.encode(e);
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
			format: (e) => e === null ? /* @__PURE__ */ new Uint8Array() : Tt(Je.encode(String(e)), 254)
		};
	}
}
function Tt(e, t) {
	if (e.length <= t) return e;
	let n = t;
	for (; n > 0 && (e[n] & 192) == 128;) n--;
	return e.subarray(0, n);
}
function Et(e) {
	let t = /* @__PURE__ */ new Set();
	return e.map((e) => {
		let n = e.replace(/[^A-Za-z0-9_]/g, "_").slice(0, 10) || "field", r = n;
		for (let e = 1; t.has(r.toUpperCase()); e++) r = `${n.slice(0, 10 - String(e).length - 1)}_${e}`;
		return t.add(r.toUpperCase()), r;
	});
}
//#endregion
//#region lib/spatialChecks.js
var Dt = {
	st_area: ["ST_Area", "ST_Area_Spheroid (square metres)"],
	st_length: ["ST_Length", "ST_Length_Spheroid (metres)"],
	st_perimeter: ["ST_Perimeter", "ST_Perimeter_Spheroid (metres)"],
	st_distance: ["ST_Distance", "ST_Distance_Spheroid (metres, between points)"],
	st_dwithin: ["ST_DWithin", "ST_DWithin_Spheroid (metres, between points)"],
	st_buffer: ["ST_Buffer", null]
}, Ot = /* @__PURE__ */ new Set([
	"st_area_spheroid",
	"st_length_spheroid",
	"st_perimeter_spheroid",
	"st_distance_spheroid",
	"st_dwithin_spheroid"
]), kt = RegExp(`\\b(${[
	...Object.keys(Dt),
	...Ot,
	"st_transform"
].join("|")})\\s*\\(`, "i");
async function At(e, t) {
	if (!kt.test(t)) return [];
	try {
		let n = JSON.parse((await e.query(`SELECT json_serialize_sql(${J(t)})`)).rows[0][0]);
		if (n.error || n.statements?.length !== 1) return [];
		let r = /* @__PURE__ */ new Set();
		for (let t of Nt(n.statements[0])) try {
			let i = await Pt(e, n.statements[0], t);
			i && r.add(i);
		} catch {}
		return [...r];
	} catch {
		return [];
	}
}
async function jt(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let i of t) try {
		let { rows: t } = await e.query(`DESCRIBE SELECT * FROM ${i.table}`);
		for (let [i, a] of t) {
			let t = Y(a);
			if (!t || t === "EPSG:4326" || t === "OGC:CRS84") continue;
			let o = await Pe(e, t, "EPSG:4326");
			o && r.add(`${n} is longitude and latitude on WGS 84, and ${i} is in ${t} (${o.from.name}). ` + Mt(o));
		}
	} catch {}
	return [...r];
}
var Mt = ({ from: e, to: t }) => `PROJ has only a null transformation between ${e.base.name} and ${t.base.name} here, so coordinates are carried over unchanged and any real offset between the two datums is dropped. That's expected if your data takes one as the other; otherwise transform from the data's own datum.`;
function Nt(e) {
	let t = [], n = (e, r, i) => {
		if (Array.isArray(e)) {
			for (let t of e) n(t, r, i);
			return;
		}
		if (!e || typeof e != "object") return;
		e.cte_map?.map?.length && (i = [...i, ...e.cte_map.map]), e.type === "SELECT_NODE" && (r = e);
		let a = e.class === "FUNCTION" ? String(e.function_name).toLowerCase() : null;
		r && (Dt[a] || Ot.has(a) || a === "st_transform") && t.push({
			name: a,
			node: e,
			select: r,
			ctes: i
		});
		for (let t of Object.values(e)) n(t, r, i);
	};
	return n(e.node, null, []), t;
}
async function Pt(e, t, { name: n, node: r, select: i, ctes: a }) {
	let [o, ...s] = r.children ?? [];
	if (!o) return null;
	let c = async () => Bt(Y(await Ut(e, t, o, i, a)));
	if (Dt[n]) {
		let t = await c();
		if (!t) return null;
		let r = await Ne(e, t);
		if (!r.geographic) return null;
		let [i, a] = Dt[n];
		return `${i} on ${Ht(o)} works in degrees: ${t} (${r.name}) is longitude and latitude. ${a ? `Use ${a}, or` : "Use"} ST_Transform to a projected CRS in metres first.`;
	}
	if (Ot.has(n)) return Ft(e, n, r, async (n) => Bt(Y(await Ut(e, t, n, i, a))));
	if (Lt(s.length >= 2 && !zt(s[1]) ? s[1] : s[0])) {
		let t = s.length >= 2 && !zt(s[1]) ? Vt(s[0]) : await c(), n = t ? await Rt(e, Bt(t)) : null;
		return `ST_Transform's target is a PROJ string with no datum, only an ellipsoid, so PROJ applies no datum shift: the result stays on ${n ? `the source's datum (${n})` : "the source's datum"}. If the projection is meant for another datum, transform to that datum's geographic CRS first, or name the target in WKT or PROJJSON, which carry their datum (a target built per row can be WKT too).`;
	}
	let l = s.map(Vt), [u, d] = l.length >= 2 && l[0] && l[1] ? l : [await c(), l[0]];
	if (!u || !d) return null;
	let f = await Pe(e, Bt(u), Bt(d));
	return f ? `ST_Transform from ${u} (${f.from.name}) to ${d} (${f.to.name}) changes datum: ${Mt(f)}` : null;
}
async function Ft(e, t, n, r) {
	let i = It[t];
	for (let e of n.children ?? []) if (e.class === "FUNCTION" && String(e.function_name).toLowerCase() === "st_flipcoordinates") return `${i} takes longitude first here (x, y order, in both engines), so ST_FlipCoordinates, which puts latitude first, makes it return NaN. Drop ST_FlipCoordinates.`;
	for (let t of n.children ?? []) {
		let n;
		try {
			n = await r(t);
		} catch {
			continue;
		}
		if (!n) continue;
		let a = await Ne(e, n);
		if (!a.geographic) return `${i} measures on the ellipsoid from longitude and latitude, but ${Ht(t)} is in ${n} (${a.name}), which is projected. Use ST_Area or ST_Length on it as it is (in its units), or ST_Transform it to its geographic CRS first.`;
	}
	return null;
}
var It = {
	st_area_spheroid: "ST_Area_Spheroid",
	st_length_spheroid: "ST_Length_Spheroid",
	st_perimeter_spheroid: "ST_Perimeter_Spheroid",
	st_distance_spheroid: "ST_Distance_Spheroid",
	st_dwithin_spheroid: "ST_DWithin_Spheroid"
};
function Lt(e) {
	let t = [], n = (e) => {
		if (Array.isArray(e)) return e.forEach(n);
		if (!e || typeof e != "object") return;
		let r = Vt(e);
		r && t.push(r), Object.values(e).forEach(n);
	};
	return n(e), t.some((e) => /(^|\s)\+proj=/.test(e) && !/\+(datum|towgs84|nadgrids)=/.test(e) && !/\+init=/.test(e));
}
async function Rt(e, t) {
	try {
		let n = await Ne(e, t);
		return n.datum ?? n.base.name;
	} catch {
		return null;
	}
}
var zt = (e) => e?.class === "CONSTANT" && e.value?.type?.id === "BOOLEAN", Bt = (e) => e === "OGC:CRS84" ? "EPSG:4326" : e, Vt = (e) => e?.class === "CONSTANT" && e.value?.type?.id === "VARCHAR" && !e.value.is_null ? e.value.value : null, Ht = (e) => e.class === "COLUMN_REF" ? e.column_names.at(-1) : "a geometry";
async function Ut(e, t, n, r, i) {
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
	}).replaceAll(":18446744073709552000", ":18446744073709551615"), s = (await e.query(`SELECT json_deserialize_sql(${J(o)})`)).rows[0][0];
	return String((await e.query(`DESCRIBE ${s}`)).rows[0][1]);
}
//#endregion
//#region lib/xlsx.js
var Wt = 67324752, Gt = 33639248, Kt = 101010256, qt = "This doesn't look like an .xlsx file.", Jt = (e) => new DataView(e.buffer, e.byteOffset, e.byteLength);
function Yt(e, t) {
	for (let n = e.length - 22; n >= Math.max(0, e.length - 65557); n--) if (t.getUint32(n, !0) === Kt) return n;
	return -1;
}
async function Xt(e) {
	return [...(await $t(e, "xl/workbook.xml")).matchAll(/<sheet\b[^>]*?\bname="([^"]*)"/g)].map((e) => Zt(e[1]));
}
var Zt = (e) => e.replace(/&(lt|gt|quot|apos|amp);/g, (e, t) => ({
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	amp: "&"
})[t]);
function Qt(e) {
	let t = Jt(e);
	if (e.length >= 4 && t.getUint32(0, !0) === Wt) return e;
	let n = Yt(e, t);
	if (n < 0) return e;
	let r = t.getUint32(n + 12, !0), i = t.getUint32(n + 16, !0), a = n - r - i;
	return a > 0 && t.getUint32(a, !0) === Wt ? e.slice(a) : e;
}
async function $t(e, t) {
	let n = Jt(e), r = Yt(e, n);
	if (r < 0) throw Error(qt);
	let i = n.getUint16(r + 10, !0), a = n.getUint32(r + 16, !0);
	for (let r = 0; r < i && n.getUint32(a, !0) === Gt; r++) {
		let r = n.getUint16(a + 10, !0), i = n.getUint32(a + 20, !0), o = n.getUint16(a + 28, !0), s = o + n.getUint16(a + 30, !0) + n.getUint16(a + 32, !0);
		if (new TextDecoder().decode(e.subarray(a + 46, a + 46 + o)) === t) {
			let t = n.getUint32(a + 42, !0), o = t + 30 + n.getUint16(t + 26, !0) + n.getUint16(t + 28, !0), s = e.subarray(o, o + i);
			if (r === 0) return new TextDecoder().decode(s);
			if (r === 8) {
				let e = new Blob([s]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
				return new Response(e).text();
			}
			throw Error(qt);
		}
		a += 46 + s;
	}
	throw Error(qt);
}
//#endregion
//#region lib/subnets.js
var en = "subnet", tn = "subnet-input", nn = "subnet-output", rn = "loop", an = "item", on = "status", sn = (e) => e === "subnet" || e === "loop", cn = (e) => e === "subnet-input" || e === "subnet-output";
function ln(e, t) {
	return e.subnetRef ? t?.[e.subnetRef] ?? null : e.subnet ?? null;
}
var un = (e, t) => e.position.y - t.position.y || e.position.x - t.position.x;
function dn(e) {
	let t = [...e?.nodes ?? []].sort(un);
	return {
		inputs: t.filter((e) => e.kind === tn).map((e) => e.id),
		outputs: t.filter((e) => e.kind === nn).map((e) => e.id)
	};
}
function fn(e) {
	let t = e.outputs[0];
	return {
		subnetPins: e,
		outputSuffix: t && t !== "data" ? t : void 0
	};
}
var pn = (e, t) => JSON.stringify(e ?? null) === JSON.stringify(t ?? null);
function mn(e = "input1") {
	return {
		nodes: [{
			id: e,
			kind: tn,
			position: {
				x: 0,
				y: 0
			}
		}, {
			id: "output1",
			kind: nn,
			position: {
				x: 360,
				y: 0
			}
		}],
		edges: [{
			id: `${e}.source-0-output1.target-0`,
			source: e,
			sourceHandle: "source-0",
			target: "output1",
			targetHandle: "target-0"
		}]
	};
}
function hn(e, t) {
	let n = e;
	for (let r of t) {
		let t = n?.nodes?.find((e) => e.id === r);
		if (!sn(t?.kind)) return null;
		n = ln(t, e.subnets);
	}
	return n ?? null;
}
function gn(e, t) {
	let n = /* @__PURE__ */ new Set(), r = [t];
	for (; r.length;) {
		let t = r.pop();
		for (let i of e?.edges ?? []) i.source === t && !n.has(i.target) && (n.add(i.target), r.push(i.target));
	}
	return [...n];
}
function _n(e) {
	let t = [], n = (r, i, a) => {
		if (!(!r || a > 8)) for (let o of r.nodes ?? []) {
			if (!sn(o.kind)) continue;
			let r = `${i}${o.id}`;
			t.push({
				path: r,
				node: o
			}), n(ln(o, e.subnets), `${r}/`, a + 1);
		}
	};
	return n(e, "", 0), t;
}
function vn(e, t) {
	if (!e) return e;
	let n = !1, r = (e.nodes ?? []).map((e) => {
		if (!sn(e.kind) || !e.subnet) return e;
		let r = vn(e.subnet, t);
		return r === e.subnet ? e : (n = !0, {
			...e,
			subnet: r
		});
	});
	return t(n ? {
		...e,
		nodes: r
	} : e);
}
function yn(e, t, n, r = {}) {
	let i = new Set(n.outputs.slice(1)), a = new Set(n.inputs), o = !1, s = [];
	for (let n of e.edges ?? []) {
		let e = n;
		if (n.target === t && n.targetHandle?.startsWith("target:")) {
			let t = r[n.targetHandle.slice(7)] ?? n.targetHandle.slice(7);
			if (!a.has(t)) {
				o = !0;
				continue;
			}
			`target:${t}` !== n.targetHandle && (e = {
				...e,
				targetHandle: `target:${t}`
			});
		}
		if (n.source === t && n.sourceHandle?.startsWith("source:")) {
			let t = r[n.sourceHandle.slice(7)] ?? n.sourceHandle.slice(7);
			if (!i.has(t)) {
				o = !0;
				continue;
			}
			`source:${t}` !== n.sourceHandle && (e = {
				...e,
				sourceHandle: `source:${t}`
			});
		}
		e !== n && (o = !0, e = {
			...e,
			id: `${e.source}.${e.sourceHandle}-${e.target}.${e.targetHandle}`
		}), s.push(e);
	}
	return o ? {
		...e,
		edges: s
	} : e;
}
var bn = "flow_out", xn = "flow_in", Sn = /* @__PURE__ */ new Set([
	"memory",
	"system",
	"temp"
]), Cn = /* @__PURE__ */ new Set(["information_schema", "pg_catalog"]), wn = (e) => e?.message ?? String(e), Tn = (e) => e.crs !== void 0;
function En(e) {
	if (!e?.startsWith("{")) return !1;
	try {
		return /^Undefined (cartesian|geographic) SRS$/i.test(JSON.parse(e).name);
	} catch {
		return !1;
	}
}
var Dn = 2e3;
function On(e, t) {
	let n = (e, t) => e.toLocaleString("en", { maximumFractionDigits: t });
	return e > 0 ? e >= 1e4 ? `${n(e / 1e4, 2)} ha` : `${n(e, e < 10 ? 2 : 0)} m²` : t > 0 ? t >= 1e3 ? `${n(t / 1e3, 2)} km` : `${n(t, t < 10 ? 2 : 0)} m` : "";
}
var kn = (e) => e === "OGC:CRS84" || e?.id?.authority === "OGC" && String(e.id.code) === "CRS84";
function An(e, { crs: t } = {}) {
	let n = `ST_GeomFromWKB(${e})`;
	return t === null ? n : t === void 0 || kn(t) ? `ST_SetCRS(${n}, 'EPSG:4326')` : `ST_SetCRS(${n}, ${J(typeof t == "string" ? t : JSON.stringify(t))})`;
}
function jn(e, t) {
	Array.isArray(e) ? e.forEach((e) => jn(e, t)) : e && typeof e == "object" && (t(e), Object.values(e).forEach((e) => jn(e, t)));
}
function Mn(e) {
	let t = Promise.resolve(), n = [];
	function r(e) {
		let n = t.then(e);
		return t = n.catch(() => {}), n;
	}
	let i = (e, t, { paged: n = null, getFile: i, server: o = { state: "unavailable" }, readers: s = null, progress: c = null }) => r(async () => (await a(e, t, n, {
		getFile: i,
		server: o,
		readers: s,
		progress: c
	})).results);
	async function a(t, n, r, { getFile: i, server: a, readers: s = null, progress: c = null }) {
		if (!e) throw Error("No SQL engine is connected, so nodes can't run.");
		await e.query(`DROP SCHEMA IF EXISTS ${bn} CASCADE`), await e.query(`CREATE SCHEMA ${bn}`);
		let l = {}, u = /* @__PURE__ */ new Map();
		return await o(t, n, {
			doc: t,
			paged: r,
			results: l,
			outputs: u,
			getFile: i,
			server: a,
			readers: s,
			progress: c,
			prefix: "",
			depth: 0,
			bindings: null
		}), {
			results: l,
			outputs: u
		};
	}
	async function o(e, t, n) {
		let { prefix: r, results: i, paged: a } = n, o = new Map(e.nodes.map((e) => [e.id, e])), c = [], l = /* @__PURE__ */ new Map();
		for (let e of t) {
			let [t, ...n] = e.split("/");
			o.has(t) && (n.length && sn(o.get(t).kind) ? l.set(t, [...l.get(t) ?? [], n.join("/")]) : n.length || c.push(t));
		}
		let { order: u, inputs: f } = Pn(e, [...c, ...l.keys()]), p = new Set(u.flatMap((e) => (f.get(e) ?? []).map((e) => e.source))), m = new Set(u.filter((e) => !l.has(e) || c.includes(e) || p.has(e))), h = /* @__PURE__ */ new Map(), g = {
			...n,
			levelOutputs: h
		};
		for (let e of u) {
			let t = r + e, n = f.get(e) ?? [], c = n.map((e) => e.source).find((e) => i[r + e]?.error);
			if (c) {
				m.has(e) && (i[t] = { error: `Upstream node ${c} failed.` });
				continue;
			}
			let u = o.get(e);
			try {
				let r = v(n, o, h);
				if (!m.has(e)) {
					u.kind === "loop" ? await d(u, r, l.get(e), g, null, !1) : await s(u, r, l.get(e), g, !1);
					continue;
				}
				await M(r), i[t] = await y(u, r, a?.id === t ? a : { page: 0 }, {
					...g,
					inner: l.get(e) ?? null
				});
			} catch (e) {
				i[t] = { error: wn(e) };
			}
		}
		return h;
	}
	async function s(e, t, n, r, i) {
		let a = r.prefix + e.id, s = e.label || e.id;
		if (r.depth >= 8) return { error: "Subnets here are nested more than 8 deep: does one contain itself?" };
		let u = ln(e, r.doc.subnets);
		if (!u) return { error: `This subnet uses "${e.subnetRef}" from the graph's shared subnets, which the graph doesn't have.` };
		let d = dn(u), f = c(d, t, s), p = await o(u, [...i ? d.outputs : [], ...n ?? []], {
			...r,
			prefix: `${a}/`,
			depth: r.depth + 1,
			bindings: f
		});
		if (!i) return null;
		if (d.outputs.some((e) => r.results[`${a}/${e}`]?.error)) return { error: `${s} › ${l(a, u, r.results)}` };
		let m = { slots: {} };
		return d.outputs.forEach((e, t) => {
			let n = p.get(e);
			t === 0 ? Object.assign(m, n.tables ? { tables: n.tables } : { table: n.table }) : m.slots[e] = n.tables ? { tables: n.tables } : n.table;
		}), m;
	}
	function c(e, t, n) {
		let r = /* @__PURE__ */ new Map();
		for (let i of e.inputs) {
			let e = t.find((e) => e.pin === i);
			r.set(i, e ? e.tables ? { tables: e.tables } : { table: e.table } : { error: `Nothing is wired into ${n}'s ${i} input.` });
		}
		return r;
	}
	function l(e, t, n) {
		let r = new Map(t.nodes.map((e) => [e.id, e])), [i, a] = Object.entries(n).find(([t, n]) => t.startsWith(`${e}/`) && !t.slice(e.length + 1).includes("/") && n.error && !/^Upstream node .+ failed\.$/.test(n.error)) ?? [];
		if (!a) return "it failed.";
		let o = r.get(i.slice(e.length + 1));
		return sn(o?.kind) ? a.error : `${o?.label || o?.id}: ${a.error}`;
	}
	function u(e, t, n = 0) {
		let r = {
			server: !1,
			browser: !1
		};
		for (let i of e?.nodes ?? []) {
			let e = Wr(i);
			if (e === "server" && i.kind !== "loop" && (r.server = !0), e === "browser" && (r.browser = !0), sn(i.kind) && n < 8) {
				let e = u(ln(i, t), t, n + 1);
				r.server ||= e.server, r.browser ||= e.browser;
			}
		}
		return r;
	}
	async function d(t, n, r, i, a, s) {
		let d = i.prefix + t.id, h = t.label || t.id;
		if (i.depth >= 8) return { error: "Subnets here are nested more than 8 deep: does one contain itself?" };
		let g = ln(t, i.doc.subnets);
		if (!g) return { error: `This loop uses "${t.subnetRef}" from the graph's shared subnets, which the graph doesn't have.` };
		let _ = dn(g);
		if (!_.inputs.includes("item")) return { error: `A loop needs an Input node called ${an} inside: it puts out each run's row.` };
		if (_.outputs.includes("status")) return { error: `An Output inside is called ${on}, which is the loop's own output saying how each run went. Rename it.` };
		let v = n.find((e) => e.pin === an);
		if (!v) return { error: `Nothing is wired into ${h}'s items input.` };
		if (v.tables) return { error: `What's wired into items has ${v.tables.length} tables: wire in one (a SQLQuery node can pick it).` };
		let y = u(g, i.doc.subnets);
		if (s && y.server) return y.browser ? { error: "Nodes inside this loop run only on the server, and others (JavaScript) only in the browser, so it can't run anywhere." } : m(t, _, n, i, a);
		let b = kr(t), x = Math.max(1, Math.floor(b.loopMax ?? 1e3)), S = (b.loopKey ?? "").trim(), C = b.loopOnError === "stop", w = Number((await e.query(`SELECT count(*) FROM ${v.table}`)).rows[0][0]), T = s ? Math.min(w, x) : Math.min(w, 1), E = null;
		if (S) {
			let t = (await e.query(`DESCRIBE ${v.table}`)).rows.map(([e]) => e);
			if (!t.includes(S)) return { error: `Key column: ${S} isn't a column of what's wired into items (${t.join(", ")}).` };
			E = (await e.query(`SELECT CAST(${q(S)} AS VARCHAR) FROM ${v.table} LIMIT ${T}`)).rows.map(([e]) => e);
		}
		let D = `${d}/`, O = `${bn}.${q(`${d}#${an}`)}`, k = Object.fromEntries(_.outputs.map((e) => [e, []])), A = [], j = 0, M = null;
		for (let t = 0; t < T; t++) {
			let a = E ? E[t] : String(t + 1);
			if (M) {
				A.push({
					key: a,
					i: t,
					status: "skipped",
					error: null,
					ms: null,
					rows: null
				});
				continue;
			}
			let u = performance.now();
			for (let e of Object.keys(i.results)) e.startsWith(D) && delete i.results[e];
			await e.query(`DROP TABLE IF EXISTS ${O}`), await e.query(`CREATE TABLE ${O} AS SELECT * FROM ${v.table} LIMIT 1 OFFSET ${t}`);
			let p = c(_, n, h);
			p.set(an, { table: O });
			let m = {
				...i,
				prefix: D,
				depth: i.depth + 1,
				bindings: p
			}, y = await o(g, s ? _.outputs : r, m);
			if (!s) return null;
			let b = _.outputs.some((e) => i.results[D + e]?.error) ? l(d, g, i.results) : null, x = {}, S = {};
			for (let n of b ? [] : _.outputs) {
				let r = y.get(n);
				if (r.tables) {
					b = `${n}: an Output in a loop takes one table, and this one has ${r.tables.length}.`;
					break;
				}
				S[n] = `${bn}.${q(`${d}#${n}#${t}`)}`, await e.query(`CREATE TABLE ${S[n]} AS SELECT ${J(a)} AS _key, ${t + 1} AS _iteration, COLUMNS(c -> c NOT IN ('_key', '_iteration')) FROM ${r.table}`), x[n] = Number((await e.query(`SELECT count(*) FROM ${S[n]}`)).rows[0][0]);
			}
			if (b) {
				for (let t of Object.values(S)) await e.query(`DROP TABLE ${t}`);
				j++, C && (M = {
					i: t,
					key: a,
					error: b
				});
			} else for (let [e, t] of Object.entries(S)) k[e].push(t);
			A.push({
				key: a,
				i: t,
				status: b ? "failed" : "completed",
				error: b,
				ms: Math.round(performance.now() - u),
				rows: b ? null : x
			}), await f(D), i.progress?.(d, {
				done: t + 1,
				total: T,
				failed: j
			});
		}
		if (!s) return null;
		if (await e.query(`DROP TABLE IF EXISTS ${O}`), M) {
			for (let t of _.outputs) for (let n of k[t]) await e.query(`DROP TABLE ${n}`);
			return { error: `Run ${M.i + 1} (_key ${M.key}) failed, so the loop stopped: ${M.error}` };
		}
		let N = {
			slots: {},
			warnings: []
		};
		for (let [e, t] of _.outputs.entries()) {
			let n = e === 0 ? a.table() : a.slotTable(t);
			await p(k[t], n, t), e === 0 ? N.table = n : N.slots[t] = n;
		}
		_.outputs.length || (N.table = a.table(), await p([], N.table, null));
		let P = a.slotTable(on);
		await e.query(`CREATE TABLE ${P} (_key VARCHAR, _iteration INTEGER, status VARCHAR, error VARCHAR, duration_ms BIGINT, "rows" VARCHAR)`);
		for (let t of A) {
			let n = (e) => e === null ? "NULL" : J(String(e));
			await e.query(`INSERT INTO ${P} VALUES (${n(t.key)}, ${t.i + 1}, ${J(t.status)}, ${n(t.error)}, ${t.ms ?? "NULL"}, ${n(t.rows && JSON.stringify(t.rows))})`);
		}
		return N.slots[on] = P, w > T && N.warnings.push(`items has ${w.toLocaleString()} rows: the loop ran the first ${T.toLocaleString()} (Most runs).`), j && N.warnings.push(`${j} of ${T} runs failed: ${t.id}_${on} says which, and why.`), N;
	}
	async function f(t) {
		let { rows: n } = await e.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${bn}' AND starts_with(table_name, ${J(t)})`);
		for (let [t] of n) await e.query(`DROP TABLE IF EXISTS ${bn}.${q(t)}`);
	}
	async function p(t, n, r) {
		if (!t.length) {
			await e.query(`CREATE TABLE ${n} AS SELECT NULL::VARCHAR AS _key, NULL::INTEGER AS _iteration WHERE false`);
			return;
		}
		try {
			let r = t.map((e) => `SELECT * FROM ${e}`).join(" UNION ALL BY NAME ");
			await e.query(`CREATE TABLE ${n} AS SELECT * FROM (${r}) WHERE false`);
		} catch (e) {
			throw Error(`The runs' ${r} outputs don't fit together: each run's ${r} needs the same columns, with the same types. ${wn(e)}`);
		}
		for (let r of t) await e.query(`INSERT INTO ${n} BY NAME SELECT * FROM ${r}`), await e.query(`DROP TABLE ${r}`);
	}
	async function m(e, t, n, r, i) {
		let a = e.label || e.id;
		if (i.server.state !== "connected" || typeof i.server.runLoop != "function") return { error: `${a} runs on the server, since nodes inside it run only there, and the server isn't available.` };
		let o = r.prefix + e.id, s = [];
		for (let e of t.inputs) {
			let t = n.find((t) => t.pin === e);
			if (t) {
				if (t.tables) return { error: `What's wired into ${e} has ${t.tables.length} tables, and a loop the server runs takes one per input: wire in one.` };
				s.push({
					pin: e,
					bytes: await w(t.table)
				});
			}
		}
		let c = await i.server.runLoop({
			node: i.node,
			path: o,
			subnets: r.doc.subnets ?? {},
			inputs: s,
			progress: (e) => r.progress?.(o, e)
		});
		if (c.error) return { error: c.error };
		let l = {
			slots: {},
			warnings: c.warnings ?? []
		};
		for (let e of c.outputs ?? []) {
			let t = e.slot === null ? i.table() : i.slotTable(e.slot);
			await T(t, e.bytes), e.slot === null ? l.table = t : l.slots[e.slot] = t;
		}
		return l;
	}
	let h = (e, t, { getFile: n, server: i = { state: "unavailable" }, sampleRows: a = 0 }) => r(() => g(e, t, {
		getFile: n,
		server: i,
		sampleRows: a
	}));
	async function g(t, n, { getFile: r, server: i, sampleRows: o }) {
		let s = n.split("/"), c = s.pop(), l = s.map((e) => `${e}/`).join(""), u = hn(t, s) ?? {
			nodes: [],
			edges: []
		}, d = [...new Set(u.edges.filter((e) => e.target === c).map((e) => e.source))];
		if (!d.length) return [];
		if (!e) throw Error("No SQL engine is connected, so the inputs can't be read.");
		let f = new Map(u.nodes.map((e) => [e.id, e])), { results: p, outputs: m } = await a(t, d.map((e) => l + e), null, {
			getFile: r,
			server: i
		}), h = [];
		for (let e of d) {
			let t = f.get(e), n = {
				name: Ur(e, t),
				kind: Lr(t.kind).label,
				label: t.label ?? ""
			}, r = m.get(l + e);
			if (!r) {
				h.push({
					...n,
					error: p[l + e]?.error ?? "It didn't run."
				});
				continue;
			}
			let i = r.table ? [{
				name: null,
				table: r.table
			}] : r.tables;
			h.push({
				...n,
				tables: await Promise.all(i.map(async (e) => ({
					name: e.name,
					...await _(e.table, o)
				})))
			});
		}
		return h;
	}
	async function _(t, n) {
		return {
			columns: (await e.query(`DESCRIBE SELECT * FROM ${t}`)).rows.map(([e, t]) => ({
				name: e,
				type: t
			})),
			rowCount: Number((await e.query(`SELECT count(*) FROM ${t}`)).rows[0][0]),
			sample: (n > 0 ? (await e.query(`SELECT * FROM ${t} LIMIT ${Math.floor(n)}`)).rows : []).map((e) => e.map(Nn))
		};
	}
	function v(e, t, n) {
		let r = /* @__PURE__ */ new Set(), i = [];
		for (let a of e) {
			let e = t.get(a.source), o = a.targetHandle?.startsWith("target:") ? a.targetHandle.slice(7) : null;
			for (let t of Yr(a.sourceHandle, e.id, e)) {
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
	async function y(t, n, r, i) {
		if (!$(t.kind)) return { error: `No ${t.kind} nodes are available here (they come from another app, a plugin this app doesn't install, or a server that isn't connected), so this one can't run. It's kept as it was, and saving the graph keeps it.` };
		let a = Z[t.kind], o = a.run ?? (a.where === "server" ? (e) => b(e, a) : null);
		if (!o) return { error: `${a.label} nodes can't run yet.` };
		let c = [...Pr(t).filter((e) => e.severity === "error").map((e) => `${e.label}: ${e.message}`), ...Zr(t, n.map((e) => e.pin ? `target:${e.pin}` : "target-0"))];
		if (c.length) return { error: c.join(" ") };
		let l = x(kr(t), n, i);
		l.runSubnet = () => s(t, n, i.inner, i, !0), l.runLoop = () => d(t, n, i.inner, i, l, !0);
		let { table: u, tables: f, slots: p, error: m, ...h } = await o(l) ?? {};
		if (m) return {
			error: m,
			...h.output === void 0 ? {} : { output: h.output }
		};
		let g = async (t) => (await e.query(`CREATE TABLE ${t} AS SELECT NULL::VARCHAR AS value WHERE false`), { table: t }), _ = f ? { tables: f } : u ? { table: u } : await g(l.table()), v = qr(t.id, t).slice(1), y = {};
		for (let e of v) {
			let t = p?.[e.name];
			y[e.name] = typeof t == "string" ? { table: t } : t?.tables ? { tables: t.tables } : await g(l.slotTable(e.name));
		}
		let S = {
			..._,
			...v.length ? { slots: y } : {}
		};
		if (i.levelOutputs.set(t.id, S), i.outputs.set(i.prefix + t.id, S), h.export) return h;
		let C = async (e, t) => {
			let n = (e) => (r.slot ?? null) === t && (r.table ?? null) === e ? r.page ?? 0 : 0, a = async (e) => {
				let t = await P(e, i.readers);
				return t ? { extras: t } : {};
			};
			if (e.table) return {
				data: await N(e.table, n(null)),
				...await a(e.table)
			};
			let o = [];
			for (let t of e.tables) o.push({
				name: t.name,
				label: t.label,
				data: await N(t.table, n(t.name)),
				...await a(t.table)
			});
			return { tables: o };
		}, w = {
			...h,
			...f || u ? await C(_, null) : {}
		};
		if (v.length) {
			w.slots = [];
			for (let e of v) w.slots.push({
				name: e.name,
				label: e.label,
				ref: e.ref,
				...await C(y[e.name], e.name)
			});
		}
		return w;
	}
	async function b(e, { kind: t, label: n, fields: r = [] }) {
		if (e.server.state !== "connected" || typeof e.server.runNode != "function") return { error: `${n} nodes run on the server, which isn't available.` };
		let i = [];
		for (let t of e.inputs) {
			let { ref: e, id: n, slot: r, pin: a } = t;
			if (t.table) i.push({
				ref: e,
				id: n,
				slot: r,
				pin: a,
				bytes: await w(t.table)
			});
			else {
				let o = [];
				for (let e of t.tables) o.push({
					name: e.name,
					bytes: await w(e.table)
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
			return await T(i, t), i;
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
	function x(t, n, { getFile: r, server: i, prefix: a, bindings: o }) {
		let s = a + t.id;
		return {
			id: t.id,
			node: t,
			inputs: n,
			sql: e,
			server: i,
			getFile: r,
			boundInput: o?.get(t.id),
			table: (e) => `${bn}.${q(e ? `${s}/${e}` : s)}`,
			slotTable: (e, t) => `${bn}.${q(t ? `${s}#${e}/${t}` : `${s}#${e}`)}`,
			rows: j,
			parquet: () => C(n),
			parquetOf: w,
			loadParquet: T,
			loadRows: A,
			serverTables: (e) => S(e, [...new Set(n.map((e) => e.ref))]),
			spatialWarnings: (t) => At(e, t)
		};
	}
	async function S(t, n) {
		let r = t.trim().replace(/;+\s*$/, "");
		if (!r || !e) return [];
		let i;
		try {
			i = JSON.parse((await e.query(`SELECT json_serialize_sql(${J(r)})`)).rows[0][0]);
		} catch {
			return [];
		}
		if (i.error) return [];
		let a = (e) => (e ?? "").toLowerCase(), o = new Set(n.map(a)), s = [], c = /* @__PURE__ */ new Set();
		jn(i, (e) => {
			for (let { key: t } of e.cte_map?.map ?? []) c.add(a(t));
			e.type === "BASE_TABLE" && s.push(e);
		});
		let l = ({ catalog_name: e, schema_name: t, table_name: n }) => e ? Sn.has(a(e)) : t ? Cn.has(a(t)) || o.has(a(t)) : o.has(a(n)) || c.has(a(n)), u = s.filter((e) => !l(e)).map((e) => [
			e.catalog_name,
			e.schema_name,
			e.table_name
		].filter(Boolean).join("."));
		return [...new Set(u)];
	}
	async function C(e) {
		let t = [], n = /* @__PURE__ */ new Set();
		for (let r of e) if (!n.has(r.ref)) {
			if (n.add(r.ref), r.table) t.push({
				name: r.ref,
				bytes: await w(r.table)
			});
			else for (let e of r.tables) t.push({
				name: `${r.ref}.${e.name}`,
				bytes: await w(e.table)
			});
		}
		return t;
	}
	async function w(t) {
		let n = `flow-send-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`;
		await D(`SELECT * FROM ${t}`, n);
		try {
			return await e.readFile(n);
		} finally {
			await e.dropFile(n);
		}
	}
	async function T(t, n) {
		let r = `flow-received-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`;
		await e.registerFile(r, n);
		try {
			await E(r, t);
		} finally {
			await e.dropFile(r);
		}
	}
	async function E(t, n) {
		let r = J(t), i = await O(t);
		if (!i) {
			await e.query(`CREATE TABLE ${n} AS SELECT * FROM read_parquet(${r})`);
			return;
		}
		try {
			await e.loadSpatial?.();
		} catch {}
		await k(async () => {
			let t = new Set((await e.query(`DESCRIBE SELECT * FROM read_parquet(${r})`)).rows.map(([e]) => e)), a = Object.entries(i.columns ?? {}).filter(([e, n]) => t.has(e) && String(n?.encoding).toUpperCase() === "WKB").map(([e, t]) => `${An(q(e), t)} AS ${q(e)}`), o = a.length ? ` REPLACE (${a.join(", ")})` : "";
			await e.query(`CREATE TABLE ${n} AS SELECT *${o} FROM read_parquet(${r})`);
		});
	}
	async function D(t, n) {
		let r = await Ee(e, t, n, "FORMAT parquet"), i = (await e.query(`DESCRIBE ${t}`)).rows.filter(([, e]) => String(e) === "GEOMETRY").map(([e]) => e);
		if (!i.length) return r;
		let a = await O(n) ?? {
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
		return await e.dropFile(n), await Ee(e, t, n, `FORMAT parquet, KV_METADATA {geo: ${J(JSON.stringify(a))}}`), r;
	}
	async function O(t) {
		let { rows: n } = await k(() => e.query(`SELECT decode(value) FROM parquet_kv_metadata(${J(t)}) WHERE decode(key) = 'geo'`));
		try {
			let e = n.length ? JSON.parse(n[0][0]) : null;
			return e && typeof e == "object" && e.columns && typeof e.columns == "object" ? e : null;
		} catch {
			return null;
		}
	}
	async function k(t) {
		await e.query("SET enable_geoparquet_conversion = false");
		try {
			return await t();
		} finally {
			await e.query("SET enable_geoparquet_conversion = true");
		}
	}
	async function A(t, n) {
		if (!n.length) {
			await e.query(`CREATE TABLE ${t} AS SELECT NULL::VARCHAR AS value WHERE false`);
			return;
		}
		let r = `flow-rows-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
		await e.registerFile(r, new TextEncoder().encode(JSON.stringify(n)));
		try {
			await e.query(`CREATE TABLE ${t} AS SELECT * FROM read_json_auto(${J(r)}, format = 'array')`);
		} finally {
			await e.dropFile(r);
		}
	}
	async function j(t) {
		let n = async (t) => {
			let { columns: n, rows: r } = await e.query(`SELECT * FROM ${t}`);
			return r.map((e) => Object.fromEntries(n.map((t, n) => [t, e[n]])));
		};
		return t.table ? n(t.table) : Object.fromEntries(await Promise.all(t.tables.map(async (e) => [e.name, await n(e.table)])));
	}
	async function M(t) {
		for (let t of [xn, ...n]) await e.query(`DROP SCHEMA IF EXISTS ${q(t)} CASCADE`);
		n = [], await e.query(`CREATE SCHEMA ${xn}`), await e.query(`SET search_path = '${xn},main'`);
		let r = /* @__PURE__ */ new Set();
		for (let i of t) {
			let t = i.ref;
			if (!r.has(t)) {
				if (r.add(t), i.table) {
					await e.query(`CREATE VIEW ${xn}.${q(t)} AS SELECT * FROM ${i.table}`);
					continue;
				}
				await e.query(`CREATE SCHEMA ${q(t)}`), n.push(t);
				for (let n of i.tables) await e.query(`CREATE VIEW ${q(t)}.${q(n.name)} AS SELECT * FROM ${n.table}`);
			}
		}
	}
	async function N(t, n) {
		let r = Number((await e.query(`SELECT count(*) FROM ${t}`)).rows[0][0]), i = (await e.query(`DESCRIBE ${t}`)).rows.map(([e, t]) => ({
			name: e,
			crs: Y(t)
		})), a = {
			rowCount: r,
			page: n,
			pageSize: 100,
			hasMore: (n + 1) * 100 < r
		}, o = `LIMIT 100 OFFSET ${n * 100}`, s = i.map((e) => e.name);
		if (!i.some(Tn)) {
			let { rows: n } = await e.query(`SELECT * FROM ${t} ${o}`);
			return {
				columns: s,
				rows: n,
				...a
			};
		}
		return {
			columns: s,
			...await F(t, i, o),
			...a
		};
	}
	async function P(t, n) {
		if (!n?.size) return null;
		let r = (await e.query(`DESCRIBE ${t}`)).rows.map(([e, t]) => ({
			name: e,
			type: String(t),
			crs: Y(t)
		})), i = {};
		for (let [a, o] of n) try {
			i[a] = await o({
				table: t,
				columns: r,
				query: (t) => e.query(t)
			}) ?? null;
		} catch (e) {
			i[a] = { error: wn(e) };
		}
		return i;
	}
	async function F(t, n, r) {
		for (let i of [
			"measured",
			"typed",
			"text"
		]) try {
			let a = n.flatMap((e) => Tn(e) ? I(e, i) : [q(e.name)]), { rows: o } = await e.query(`SELECT ${a.map((e, t) => `${e} AS c${t}`).join(", ")} FROM ${t} ${r}`), s = [], c = [];
			for (let e of o) {
				let t = [], r = [], i = 0;
				for (let a of n) {
					if (!Tn(a)) {
						t.push(e[i++]), r.push(null);
						continue;
					}
					let [n, o, s, c, l] = e.slice(i, i + 5);
					i += 5;
					let u = n !== null && n.length > Dn ? `${n.slice(0, Dn)}…` : n, d = On(c, l);
					t.push(n === null ? null : o ? s ? `${o} EMPTY` : d ? `${o} · ${d}` : o : u.slice(0, 60)), r.push(u);
				}
				s.push(t), c.push(r);
			}
			return {
				rows: s,
				wkt: c,
				geometry: i === "text" ? n.map(() => null) : await L(t, n)
			};
		} catch (e) {
			if (i === "text") throw e;
		}
	}
	function I(e, t) {
		let n = q(e.name), r = `left(ST_AsText(${n}), 2001)`;
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
	async function L(t, n) {
		let r = n.filter(Tn), i = r.flatMap((e) => {
			let t = q(e.name);
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
			if (!Tn(e)) return null;
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
	let ee = (e, t, n) => r(() => R(e, t, n));
	async function R(t, n, r) {
		if (!e) throw Error("No SQL engine is connected, so files can't be read.");
		let i = `flow-upload-${Date.now()}.${K[r].extensions[0]}`, a = [], o = [];
		await e.registerFile(i, t);
		try {
			let s = await z(r, i, t, n, a, o), c = [], l = [];
			for (let [t, { label: n, select: r }] of s.entries()) {
				let o = Br(Hr(n) || "table", l);
				l.push(o);
				let s = `${i}-${t}.parquet`;
				a.push(s);
				let u = await D(r, s);
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
	async function z(t, n, r, i, a, o) {
		let s = J(n), c = (e) => [{
			label: i.replace(/\.[^.]*$/, ""),
			select: e
		}];
		if (K[t].geo) return B(t, n, r, i, a);
		switch (t) {
			case "csv": return c(`SELECT * FROM read_csv(${s})`);
			case "tsv": return c(`SELECT * FROM read_csv(${s}, delim = '\t')`);
			case "json": return c(`SELECT * FROM read_json_auto(${s})`);
			case "parquet": {
				let e = `main.${q(`flow-upload-${Date.now()}`)}`;
				return o.push(e), await E(n, e), c(`SELECT * FROM ${e}`);
			}
			case "xlsx": return await De(e), (await Xt(r)).map((e) => ({
				label: e,
				select: `SELECT * FROM read_xlsx(${s}, sheet = ${J(e)}, header = true)`
			}));
			case "sqlite": {
				if (!e.readSqlite) throw Error("This SQL engine can't read SQLite files.");
				let t = await e.readSqlite(r), i = [];
				for (let [e, r] of t.entries()) i.push({
					label: r.name,
					select: await H(r, `${n}-rows-${e}.json`, a)
				});
				return i;
			}
			default: throw Error(`Can't read ${K[t]?.label ?? t} files.`);
		}
	}
	async function B(t, n, r, i, a) {
		let o = [n];
		if (t === "shapefile") {
			o = [];
			for (let t of await ze(r)) {
				if (t.name.startsWith("__MACOSX/")) continue;
				let r = `${n}.files/${t.name}`;
				await e.registerFile(r, t.bytes), a.push(r), /\.shp$/i.test(t.name) && o.push(r);
			}
			if (!o.length) throw Error("There's no shapefile (.shp) in this zip.");
		}
		let s = [];
		for (let t of o) {
			let n = await e.query(`SELECT unnest(layers).name FROM ST_Read_Meta(${J(t)})`);
			for (let [e] of n.rows) s.push({
				layer: e,
				read: `ST_Read(${J(t)}, layer := ${J(e)})`
			});
		}
		if (!s.length) throw Error("It has no layers.");
		let c = [];
		try {
			for (let { layer: e, read: t } of s) c.push({
				label: s.length === 1 ? i.replace(/\.[^.]*$/, "") : e,
				...await V(t)
			});
		} catch (e) {
			throw t === "gpkg" && /thread constructor failed/.test(wn(e)) ? Error("This GeoPackage has no feature counts (GDAL's gpkg_ogr_contents table), which reading it here needs. Save it again with QGIS or ogr2ogr, which add them, and choose it again.") : e;
		}
		return c;
	}
	async function V(t) {
		let { rows: n } = await e.query(`DESCRIBE SELECT * FROM ${t}`), r = n.map(([e, t]) => ({
			name: e,
			crs: Y(t)
		})), i = new Set(r.map((e) => e.name.toLowerCase())), a = [];
		for (let n of r) {
			if (n.name === "OGC_FID") continue;
			if (!Tn(n)) {
				a.push(q(n.name));
				continue;
			}
			let r = n.name === "geom" && !i.has("geometry") ? "geometry" : n.name, o = q(n.name), [[s, c]] = (await e.query(`SELECT count(*) FILTER (WHERE ST_HasZ(${o})), count(*) FILTER (WHERE ST_HasZ(${o}) AND (ST_ZMin(${o}) <> 0 OR ST_ZMax(${o}) <> 0)) FROM ${t}`)).rows, l = Number(s) && !Number(c) ? `ST_Force2D(${o})` : o;
			a.push(`${En(n.crs) ? `CAST(${l} AS GEOMETRY)` : l} AS ${q(r)}`);
		}
		return { select: `SELECT ${a.join(", ")} FROM ${t}` };
	}
	async function H({ columns: t, rows: n }, r, i) {
		if (!n.length) return `SELECT ${t.map((e) => `NULL::VARCHAR AS ${q(e)}`).join(", ") || "NULL AS empty"} WHERE false`;
		let a = n.map((e) => Object.fromEntries(t.map((t, n) => [t, e[n]])));
		return await e.registerFile(r, new TextEncoder().encode(JSON.stringify(a))), i.push(r), `SELECT * FROM read_json_auto(${J(r)}, format = 'array')`;
	}
	return {
		run: i,
		readFile: ee,
		serverTables: S,
		describeInputs: h
	};
}
function Nn(e) {
	if (e instanceof Uint8Array) return `(${e.length} bytes)`;
	let t = typeof e == "bigint" ? String(e) : typeof e == "object" && e ? JSON.stringify(e, (e, t) => typeof t == "bigint" ? String(t) : t) : e;
	return typeof t == "string" && t.length > 200 ? `${t.slice(0, 200)}…` : t;
}
function Pn(e, t) {
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
var Fn = 190, In = 90, Ln = {
	x: 0,
	y: .5
}, Rn = {
	x: 1,
	y: .5
}, zn = (e) => e?.message ?? String(e), Bn = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, Vn = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`;
function Hn(e) {
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
			text: `Wrote “${n}” (${r}, ${ve(i)}).`
		});
	} else if (e.tables) {
		let n = e.tables.map((e) => `${e.label} (${Vn(e.data.rowCount)})`).join(", ");
		t.push({
			type: "info",
			text: `Read ${e.tables.length} ${e.tables.length === 1 ? "table" : "tables"}: ${n}.`
		});
	} else e.data ? t.push({
		type: "info",
		text: `Returned ${Vn(e.data.rowCount)}.`
	}) : e.value && e.value.kind !== "none" ? t.push({
		type: "info",
		text: `Returned a ${e.value.type} (see the Data panel).`
	}) : e.output || t.push({
		type: "note",
		text: "(no output)"
	});
	if (!e.error && e.slots?.length) {
		let n = (e) => e.data ? Vn(e.data.rowCount) : `${e.tables.length} tables`;
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
function Un({ sql: e = null, files: t = null, server: n = null } = {}) {
	let r = ae(), i = Mn(e), a = f(() => ({
		state: n?.status?.state ?? "unavailable",
		address: n?.status?.address ?? null,
		local: n?.status?.local === !0,
		disconnected: n?.status?.disconnected === !0,
		assistant: typeof n?.assist == "function" && n?.status?.assistant || null,
		signIn: n?.status?.signIn || null,
		user: n?.status?.user || null
	})), s = [], c = {
		x: 0,
		y: 0
	}, u = O([]), d = O({}), p = f(() => u.map((e) => `${e.id}/`).join("")), m = (e) => p.value + e, h = O({
		started: !1,
		executing: !1
	}), g = O({
		status: {},
		results: {},
		progress: {}
	}), _ = O({}), v = O({ app: [] }), y = {
		get started() {
			return h.started;
		},
		set started(e) {
			h.started = e;
		},
		get executing() {
			return h.executing;
		},
		set executing(e) {
			h.executing = e;
		},
		status: S(() => g.status),
		results: S(() => g.results),
		progress: S(() => g.progress)
	}, x = {
		nodes: S(() => _),
		get app() {
			return v.app;
		}
	};
	function S(e) {
		let t = (e) => typeof e == "string" ? p.value + e : e, n = (e) => e.startsWith(p.value) && !e.slice(p.value.length).includes("/");
		return new Proxy({}, {
			get: (n, r) => typeof r == "string" ? e()[t(r)] : void 0,
			set: (n, r, i) => (e()[t(r)] = i, !0),
			deleteProperty: (n, r) => (delete e()[t(r)], !0),
			has: (n, r) => t(r) in e(),
			ownKeys: () => Object.keys(e()).filter(n).map((e) => e.slice(p.value.length)),
			getOwnPropertyDescriptor: (n, r) => t(r) in e() ? {
				value: e()[t(r)],
				enumerable: !0,
				configurable: !0,
				writable: !0
			} : void 0
		});
	}
	let C = /* @__PURE__ */ new Map(), w = /* @__PURE__ */ new Map(), T = /* @__PURE__ */ new WeakMap(), E = O(/* @__PURE__ */ new Set()), D = 0, k = f(() => r.getSelectedNodes.value[0] ?? null), A = O({
		node: null,
		slot: null,
		table: null,
		row: null
	});
	z(() => k.value?.id ?? null, (e) => {
		A.node !== e && Object.assign(A, {
			node: e,
			slot: null,
			table: null,
			row: null
		});
	});
	function j(e) {
		let t = r.findNode(e);
		t && (r.removeSelectedEdges(r.getSelectedEdges.value), r.removeSelectedNodes(r.getSelectedNodes.value), r.addSelectedNodes([t]));
	}
	let M = () => [...r.nodes.value, ...s.flatMap((e) => e.nodes)].map((e) => e.id);
	function N(e, t) {
		return {
			id: zr(e, M()),
			type: "pipeline",
			position: t,
			data: {
				kind: e,
				...Z[e].create?.() ?? {}
			}
		};
	}
	function P({ source: e, sourceHandle: t, target: n, targetHandle: r }) {
		return {
			id: `${e}.${t}-${n}.${r}`,
			type: "wire",
			source: e,
			sourceHandle: t,
			target: n,
			targetHandle: r
		};
	}
	let I = f(() => xe(r.nodes.value, r.edges.value, r.viewport.value)), L = f(() => {
		let { nodes: e, edges: t, viewport: n } = u.length ? u[0].graph : I.value;
		return {
			...be([], [], n ?? {
				x: 0,
				y: 0,
				zoom: 1
			}, { ...d }),
			nodes: e,
			edges: t
		};
	});
	function ee(e) {
		let { nodes: t, edges: n, viewport: i, subnets: a } = Ce(e) ?? Ce(ye);
		s = [], u.splice(0);
		for (let e of Object.keys(d)) delete d[e];
		Object.assign(d, a), C.clear(), Object.assign(h, {
			started: !1,
			executing: !1
		}), g.status = {}, g.results = {}, g.progress = {};
		for (let e of Object.keys(_)) delete _[e];
		r.setEdges([]), r.setNodes(t), r.setEdges(n.map(P));
		for (let e of t) e.data.kind === "sql-query" && e.data.sqlQuery && oe(e.id);
		if (i) r.setViewport(i);
		else if (t.length) {
			let { off: e } = r.onNodesInitialized(() => {
				r.fitView({ maxZoom: 1 }), e();
			});
		}
	}
	function R(e) {
		c = {
			x: e.clientX,
			y: e.clientY
		};
	}
	function B(e, t = c, n = {
		x: 0,
		y: 0
	}) {
		let i = r.screenToFlowCoordinate(t), a = N(e, {
			x: i.x - n.x * Fn,
			y: i.y - n.y * In
		});
		return r.addNodes(a), a;
	}
	function V(e, t, n) {
		let r = n.handleType === "source", i = B(e, t, r ? Ln : Rn), a = r ? Xr(i.data)[0]?.handle : Jr(i.id, i.data)[0]?.handle;
		if (!a) return;
		let [o, s] = r ? [n, {
			nodeId: i.id,
			handleId: a
		}] : [{
			nodeId: i.id,
			handleId: a
		}, n];
		H({
			source: o.nodeId,
			sourceHandle: o.handleId,
			target: s.nodeId,
			targetHandle: s.handleId
		});
	}
	function H(e) {
		r.addEdges(P(e)), W(e.target);
	}
	function te(e) {
		let t = /* @__PURE__ */ new Set(), n = [e];
		for (; n.length;) {
			let e = n.pop();
			for (let i of r.edges.value) i.source === e && !t.has(i.target) && (t.add(i.target), n.push(i.target));
		}
		return [...t];
	}
	let U = (e, t) => e === t || te(e).includes(t);
	function ne({ id: e, source: t, target: n, targetHandle: i }) {
		if (U(n, t)) return !1;
		let a = r.findNode(n);
		if (a && !$(a.data.kind)) return !0;
		let o = Xr(a?.data ?? {}).find((e) => e.handle === (i ?? "target-0"));
		return o ? o.many || e !== void 0 || !r.edges.value.some((e) => e.target === n && e.targetHandle === o.handle) : !1;
	}
	function W(e, { self: t = !0 } = {}) {
		for (let n of [...t ? [e] : [], ...te(e)]) G(m(n)), r.findNode(n)?.data.kind === "sql-query" && oe(n);
		u.length && re();
	}
	function G(e, { inside: t = !0 } = {}) {
		let n = [e, ...t ? Object.keys(g.status).filter((t) => t.startsWith(`${e}/`)) : []];
		for (let e of n) C.set(e, (C.get(e) ?? 0) + 1), (g.status[e] === "completed" || g.status[e] === "failed") && (g.status[e] = "stale");
	}
	function re() {
		q();
		let e = L.value, t = p.value.slice(0, -1), n = u.at(-1), r = n.graph.nodes.find((e) => e.id === n.id)?.subnetRef, i = r ? _n(e).filter((e) => e.node.subnetRef === r).map((e) => e.path) : [t];
		for (let n of i) ie(e, n, n !== t);
	}
	function ie(e, t, n) {
		let r = t.split("/"), i = r.pop(), a = r.map((e) => `${e}/`).join("");
		G(t, { inside: n });
		for (let t of gn(hn(e, r), i)) G(a + t);
		r.length && ie(e, r.join("/"), !1);
	}
	async function oe(t) {
		let n = r.findNode(t);
		if (!n || !e) return;
		let a = r.edges.value.filter((e) => e.target === t).flatMap((e) => {
			let t = r.findNode(e.source);
			return t ? Yr(e.sourceHandle, t.id, t.data).map((e) => e.ref) : [];
		}), o = await i.serverTables(n.data.sqlQuery ?? "", [...new Set(a)]);
		if (r.findNode(t) !== n) return;
		let s = n.data.sqlServerTables;
		(!s || o.join("\n") !== s.join("\n")) && r.updateNodeData(t, { sqlServerTables: o });
	}
	z(() => Object.keys(Z).length, () => {
		for (let e of r.nodes.value) e.data.kind === "sql-query" && e.data.sqlQuery && oe(e.id);
	});
	function se(e) {
		let t = m(e);
		for (let e of Object.keys(g.status).filter((e) => e === t || e.startsWith(`${t}/`))) delete g.status[e], delete g.results[e], C.set(e, (C.get(e) ?? 0) + 1);
		W(e, { self: !1 });
	}
	function ce(e, t) {
		if (t === e) return;
		let n = r.findNode(e).data.kind;
		u.length && cn(n) && Oe(e, t);
		let i = (n) => {
			let r = (n) => n === e ? t : n;
			return P({
				...n,
				source: r(n.source),
				target: r(n.target)
			});
		};
		r.findNode(e).id = t, r.setEdges(r.edges.value.map(i));
		for (let e of s) e.edges = e.edges.map(i);
		let [a, o] = [m(e), m(t)];
		for (let e of [
			g.status,
			g.results,
			_
		]) for (let t of Object.keys(e).filter((e) => e === a || e.startsWith(`${a}/`))) e[o + t.slice(a.length)] = e[t], delete e[t];
		for (let e of [...C.keys()].filter((e) => e === a || e.startsWith(`${a}/`))) C.set(o + e.slice(a.length), C.get(e));
		A.node === e && (A.node = t), W(t, { self: !1 });
	}
	function le(e, t) {
		return t = t.trim(), t ? t === e ? null : t.includes("/") ? "IDs can't contain /: it separates a subnet's ID from its nodes' (subnet1/sqlnode1)." : M().includes(t) ? "Another node already uses this ID." : (ce(e, t), null) : "ID cannot be empty.";
	}
	function ue(e, t) {
		t = t.trim();
		let n = r.findNode(e);
		if (t === (n.data.label ?? "")) return;
		r.updateNodeData(e, { label: t || void 0 });
		let i = Hr(t);
		i && Vr(n.data.kind, e) && ce(e, Br(i, M().filter((t) => t !== e)));
	}
	function de(e, t) {
		let n = r.findNode(e), i = Hr(t), a = i && i !== "data" ? i : void 0;
		return a === n.data.outputSuffix ? null : a && qr(e, n.data).some((e) => e.name === a) ? `This node already has an output called ${a} (${e}_${a}). Choose another name.` : (r.updateNodeData(e, { outputSuffix: a }), W(e, { self: !1 }), null);
	}
	function fe(e, t) {
		let n = r.findNode(e).data, i = Object.keys(t).filter((e) => JSON.stringify(t[e]) !== JSON.stringify(n[e]));
		i.length && (r.updateNodeData(e, t), i.some((e) => !jr(n.kind, e)) && W(e));
	}
	function pe(e, t, n) {
		let i = r.findNode(e);
		if (!i) return;
		let a = { ...i.data.panels };
		n == null ? delete a[t] : a[t] = n, fe(e, { panels: Object.keys(a).length ? a : void 0 });
	}
	function me(e, t = null) {
		let { nodes: n, edges: i, viewport: a } = we(e) ?? we({
			nodes: [],
			edges: []
		});
		if (t && n.forEach((e) => e.selected = e.id === t), r.setEdges([]), r.setNodes(n), r.setEdges(i.map(P)), a) r.setViewport(a);
		else if (n.length) {
			let { off: e } = r.onNodesInitialized(() => {
				r.fitView({ maxZoom: 1 }), e();
			});
		}
	}
	function ge(e) {
		let t = r.findNode(e);
		if (!sn(t?.data.kind)) return null;
		let n = ln(t.data, d);
		if (!n) return `This subnet uses "${t.data.subnetRef}" from the graph's shared subnets, which the graph doesn't have.`;
		if (u.length >= 8) return "Subnets open here only 8 deep.";
		q();
		let { nodes: i, edges: a, viewport: o } = I.value;
		return u.push({
			id: e,
			graph: {
				nodes: i,
				edges: a,
				viewport: o
			},
			deletions: s
		}), s = [], me(n), null;
	}
	function _e(e = u.length - 1) {
		if (e < 0 || e >= u.length) return;
		q();
		let t = null;
		for (; u.length > e;) t = u.pop(), s = t.deletions;
		me(t.graph, t.id);
	}
	let ve = f(() => [{
		depth: 0,
		label: null,
		shared: null
	}, ...u.map((e, t) => {
		let n = e.graph.nodes.find((t) => t.id === e.id);
		return {
			depth: t + 1,
			label: n?.label || e.id,
			shared: n?.subnetRef ?? null
		};
	})]), Se = null;
	function q() {
		if (!u.length) return;
		let e = I.value;
		e !== Se && (Se = e, J(e));
	}
	z(I, q);
	function J(e) {
		let t = u.at(-1), n = t.graph.nodes.find((e) => e.id === t.id);
		if (!n) return;
		let r = dn(e), i = !pn(n.subnetPins, r);
		n.subnetRef ? (d[n.subnetRef] = e, i && De(Ee((e) => e.subnetRef === n.subnetRef, r))) : (t.graph = {
			...t.graph,
			nodes: t.graph.nodes.map((t) => t === n ? {
				...t,
				subnet: e
			} : t)
		}, i && (t.graph = Ee((e) => e.id === t.id, r)(t.graph))), Te(u.length - 2), i && re();
	}
	function Te(e) {
		for (let t = e; t >= 0; t--) {
			let e = u[t], n = e.graph.nodes.find((t) => t.id === e.id);
			if (n.subnetRef) {
				d[n.subnetRef] = u[t + 1].graph;
				return;
			}
			e.graph = {
				...e.graph,
				nodes: e.graph.nodes.map((e) => e === n ? {
					...e,
					subnet: u[t + 1].graph
				} : e)
			};
		}
	}
	let Ee = (e, t, n = {}) => (r) => {
		let i = r;
		for (let a of r.nodes ?? []) sn(a.kind) && e(a) && (pn(a.subnetPins, t) || (i = {
			...i,
			nodes: i.nodes.map((e) => e.id === a.id ? {
				...e,
				...fn(t)
			} : e)
		}), i = yn(i, a.id, t, n));
		return i;
	};
	function De(e) {
		for (let t of u) t.graph = vn(t.graph, e);
		for (let t of Object.keys(d)) d[t] = vn(d[t], e);
		let t = I.value, n = vn({
			nodes: t.nodes,
			edges: t.edges
		}, e);
		n.edges !== t.edges && r.setEdges(n.edges.map(P)), n.nodes.forEach((e, n) => {
			if (e === t.nodes[n]) return;
			let { id: i, position: a, ...o } = e;
			r.updateNodeData(i, o);
		});
	}
	function Oe(e, t) {
		let n = u.at(-1), r = n.graph.nodes.find((e) => e.id === n.id), i = I.value, a = dn({ nodes: i.nodes.map((n) => n.id === e ? {
			...n,
			id: t
		} : n) }), o = Ee(r.subnetRef ? (e) => e.subnetRef === r.subnetRef : (e) => e.id === n.id, a, { [e]: t });
		r.subnetRef ? De(o) : n.graph = o(n.graph);
	}
	function ke(e, t) {
		let n = r.findNode(e), i = Hr(t ?? "");
		return i ? i in d ? `There's a shared subnet called ${i} already.` : (d[i] = n.data.subnet ?? {
			nodes: [],
			edges: []
		}, fe(e, {
			subnet: void 0,
			subnetRef: i
		}), null) : "Give it a name: letters, digits and _.";
	}
	function Ae(e, t) {
		let n = r.findNode(e), i = t ? d[t] : structuredClone(F(d[n.data.subnetRef]) ?? {
			nodes: [],
			edges: []
		});
		if (!i) return;
		let a = dn(i);
		fe(e, {
			subnet: t ? void 0 : i,
			subnetRef: t ?? void 0,
			...fn(a)
		});
		let o = I.value, s = yn({
			nodes: o.nodes,
			edges: o.edges
		}, e, a);
		s.edges !== o.edges && r.setEdges(s.edges.map(P));
	}
	async function je(e) {
		if (!w.has(e)) {
			let n = await t?.getFile?.(e);
			n && w.set(e, n);
		}
		return w.get(e) ?? null;
	}
	async function Me(e, n) {
		w.set(e, n), await t?.putFile?.(e, n);
	}
	function Ne(e) {
		w.delete(e), t?.deleteFile?.(e);
	}
	async function Pe(e, t) {
		let n = r.findNode(e);
		E.add(e);
		try {
			let r = {
				name: t.name,
				size: t.size,
				bytes: new Uint8Array(await t.arrayBuffer())
			};
			return T.set(n, r), he(t.name) && fe(e, { ingestFormat: void 0 }), await Ie(n, r, n.data.ingestFormat);
		} finally {
			E.delete(e);
		}
	}
	async function Fe(e, t, n) {
		let i = r.findNode(e);
		E.add(e);
		try {
			let e = new Uint8Array(await n.arrayBuffer());
			if (r.findNode(i.id) !== i) return null;
			let a = Bn();
			await Me(a, e);
			let o = i.data[t]?.key;
			return fe(i.id, { [t]: {
				fileName: n.name,
				fileSize: n.size,
				key: a
			} }), o && Ne(o), null;
		} catch (e) {
			return `Couldn't keep "${n.name}". ${zn(e)}`;
		} finally {
			E.delete(e);
		}
	}
	async function Ie(e, { name: t, size: n, bytes: a }, o) {
		let s = o || he(t);
		if (!s || !K[s].read) return `Can't tell what kind of file "${t}" is. Pick its type under File Type.`;
		let c;
		try {
			c = await i.readFile(a, t, s);
		} catch (e) {
			return `Couldn't read "${t}" as ${K[s].label}. ${zn(e)}`;
		}
		if (r.findNode(e.id) !== e) return null;
		let l = [];
		for (let e of c) {
			let t = Bn();
			await Me(t, e.bytes), l.push({
				name: e.name,
				label: e.label,
				rowCount: e.rowCount,
				key: t
			});
		}
		let u = e.data.ingest?.tables ?? [];
		return fe(e.id, { ingest: {
			fileName: t,
			fileSize: n,
			format: s,
			tables: l
		} }), u.forEach((e) => Ne(e.key)), null;
	}
	async function Le(e, t) {
		let n = r.findNode(e);
		fe(e, { ingestFormat: t || void 0 });
		let i = T.get(n);
		if (i) {
			E.add(e);
			try {
				return await Ie(n, i, t);
			} finally {
				E.delete(e);
			}
		}
		let a = n.data.ingest;
		return !a || (t || he(a.fileName)) === a.format ? null : `Choose "${a.fileName}" again to read it as ${K[t]?.label ?? "that type"}.`;
	}
	function Re(e, { type: t, text: n }) {
		let r = e.findIndex((e) => e.type === t && e.text === n);
		if (r < 0) e.push({
			id: ++D,
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
	function ze(e, t, n) {
		_[e]?.state !== t && (_[e] = {
			state: t,
			entries: []
		});
		for (let t of n) Re(_[e].entries, t);
	}
	function Be(e, t = "info", { repeat: n = !1 } = {}) {
		n ? v.app.push({
			id: ++D,
			type: t,
			text: e,
			count: 1
		}) : Re(v.app, {
			type: t,
			text: e
		});
	}
	let Ve = () => v.app.splice(0);
	z(() => a.value.state, (e, t) => {
		if (e === "connected") {
			let { address: e, local: t, signIn: n, user: r } = a.value;
			Be(`Connected to the server${e ? ` at ${e}` : ""}${r?.email ? `, signed in as ${r.email}` : ""}.`), t && Be(`The server is in local development mode (IS_LOCAL): ${n ? "" : "it signs no one in, and "}node kinds that run on it can reach the network. Keep it on your own machine.`, "warning");
		} else e === "unavailable" && a.value.disconnected ? Be("Disconnected from the server in this browser: nothing is sent to it, and nodes that run there can't run.", "note") : e === "unavailable" && Be(t === "connected" ? "Lost the server: nodes that run there can't run until it's back." : n ? "The server isn't available: nodes that run there can't run until it is." : "There's no server: everything runs in this browser, and nodes that need a server can't run.", t === "connected" ? "error" : "note");
	}, { immediate: !0 });
	function He({ filename: e, contentType: t, bytes: n }) {
		let r = URL.createObjectURL(new Blob([n], { type: t }));
		Object.assign(document.createElement("a"), {
			href: r,
			download: e
		}).click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
	}
	let Ue = () => ({
		state: a.value.state,
		query: n?.query,
		runPython: n?.runPython,
		runNode: n?.runNode,
		runLoop: n?.runLoop
	}), We = /* @__PURE__ */ new Map();
	function Ge(e, t) {
		let n = async (e) => {
			let n = await t(e);
			return typeof n == "object" && n ? b(n) : n;
		};
		return We.set(e, n), () => We.get(e) === n && We.delete(e);
	}
	function Ke(e) {
		let t = e.split("/"), n = t.pop();
		return t.map((e) => `${e}/`).join("") === p.value ? !!r.findNode(n) : !!hn(L.value, t)?.nodes.some((e) => e.id === n);
	}
	async function qe(e, t = null, { log: n = !0 } = {}) {
		if (!e.length) return {};
		q(), y.started = !0;
		for (let t of e) g.status[t] = "running";
		let r = new Map(C), a;
		try {
			a = await i.run(L.value, e, {
				paged: t,
				getFile: je,
				server: Ue(),
				readers: We,
				progress: (e, t) => g.progress[e] = t
			});
		} catch (t) {
			a = Object.fromEntries(e.map((e) => [e, { error: zn(t) }]));
		}
		for (let [t, i] of Object.entries(a)) {
			if (!Ke(t)) continue;
			if (i.export) {
				let { bytes: n, ...r } = i.export, a = e.includes(t);
				a && He(i.export), i = {
					...i,
					export: {
						...r,
						downloaded: a
					}
				};
			}
			g.results[t] = i;
			let a = (C.get(t) ?? 0) !== (r.get(t) ?? 0);
			g.status[t] = a ? "stale" : i.error ? "failed" : "completed", n && ze(t, r.get(t) ?? 0, Hn(i));
		}
		for (let t of e) g.status[t] === "running" && delete g.status[t];
		for (let t of Object.keys(g.progress)) (t in a || e.includes(t)) && delete g.progress[t];
		return a;
	}
	let Je = (e, t = 0, n = null, r = null) => qe([m(e)], {
		id: m(e),
		page: t,
		table: n,
		slot: r
	}), Y = (e, t, n = null, r = null) => qe([m(e)], {
		id: m(e),
		page: t,
		table: n,
		slot: r
	}, { log: !1 });
	async function Ye({ id: e, slot: t = null, table: n = null, row: i }) {
		if (!r.findNode(e)) return;
		Object.assign(A, {
			node: e,
			slot: t,
			table: n,
			row: i
		}), k.value?.id !== e && j(e);
		let a = l(y.results[e], t, n)?.data;
		if (!a || y.status[e] === "running") return;
		let o = Math.floor(i / a.pageSize);
		o !== a.page && await Y(e, o, n, t);
	}
	async function Xe() {
		y.executing = !0;
		try {
			let e = L.value.nodes.filter((e) => e.autoRun !== !1).map((e) => e.id);
			if (!e.length) {
				Be("Nothing to execute: every node has Auto Run off.", "note");
				return;
			}
			let t = Object.keys(await qe(e)).filter((e) => g.status[e]), n = (e) => t.filter((t) => g.status[t] === e).length, r = [`${n("completed")} completed`, `${n("failed")} failed`];
			n("stale") && r.push(`${n("stale")} changed while running`), Be(`Executed the graph: ${t.length} ${t.length === 1 ? "node" : "nodes"} ran, ${r.join(", ")}.`, n("failed") ? "error" : "info");
		} finally {
			y.executing = !1;
		}
	}
	async function Ze(e, t, o, s = () => {}) {
		let c = r.findNode(e), l = a.value.assistant;
		if (!c) return { error: "That node is gone." };
		if (a.value.state !== "connected" || !l) return { error: "The assistant works through the server, which isn't available." };
		try {
			q(), s("reading");
			let r = await i.describeInputs(L.value, m(e), {
				getFile: je,
				server: Ue(),
				sampleRows: l.sampleRows ?? 0
			});
			return s("writing"), await n.assist({
				kind: c.data.kind,
				request: t,
				code: o,
				inputs: r
			});
		} catch (e) {
			return { error: zn(e) };
		}
	}
	function Qe({ nodeIds: e = [], edgeIds: t = [] }) {
		let n = r.nodes.value.filter((t) => e.includes(t.id)), i = r.edges.value.filter((n) => t.includes(n.id) || e.includes(n.source) || e.includes(n.target));
		if (n.length || i.length) {
			s.push({
				nodes: n.map(({ id: e, type: t, position: n, data: r }) => ({
					id: e,
					type: t,
					position: { ...n },
					data: r
				})),
				edges: i.map(P)
			}), r.removeEdges(i.map((e) => e.id)), r.removeNodes(n.map((e) => e.id));
			for (let t of i) e.includes(t.target) || W(t.target);
		}
	}
	function $e() {
		let e = s.pop();
		if (e) {
			r.addNodes(e.nodes), r.addEdges(e.edges);
			for (let t of e.edges) W(t.target);
		}
	}
	function et(e) {
		if (o(e)) return;
		let t = e.ctrlKey || e.metaKey;
		if (e.key === "Enter" && !t && !e.altKey && sn(k.value?.data.kind)) {
			e.preventDefault();
			let t = ge(k.value.id);
			t && Be(t, "error");
			return;
		}
		if (e.key === "Escape" && u.length) {
			e.preventDefault(), _e();
			return;
		}
		(e.key === "Delete" || e.key === "Backspace") && !t && !e.altKey ? (e.preventDefault(), Qe({
			nodeIds: r.getSelectedNodes.value.map((e) => e.id),
			edgeIds: r.getSelectedEdges.value.map((e) => e.id)
		})) : t && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z" && (e.preventDefault(), $e());
	}
	return {
		flow: r,
		selectedNode: k,
		snapshot: L,
		run: y,
		logs: x,
		log: Be,
		clearLog: Ve,
		reading: E,
		server: a,
		dataView: A,
		levels: ve,
		library: d,
		openSubnet: ge,
		closeSubnet: _e,
		shareSubnet: ke,
		useSubnet: Ae,
		load: ee,
		setContextPoint: R,
		addNode: B,
		addConnectedNode: V,
		connect: H,
		isValidConnection: ne,
		select: j,
		renameNode: le,
		setLabel: ue,
		setOutputName: de,
		updateData: fe,
		setPanelData: pe,
		chooseFile: Pe,
		setIngestFormat: Le,
		storeFieldFile: Fe,
		runNode: Je,
		turnPage: Y,
		showRow: Ye,
		addOutputReader: Ge,
		executeGraph: Xe,
		resetNode: se,
		askAssistant: Ze,
		remove: Qe,
		undoDelete: $e,
		onKeydown: et
	};
}
//#endregion
//#region components/DataIngestFields.vue
var Wn = { class: "flow-field" }, Gn = [
	"id",
	"accept",
	"disabled",
	"aria-describedby"
], Kn = ["id"], qn = {
	key: 0,
	class: "flow-field-error"
}, Jn = {
	key: 1,
	class: "flow-field-hint"
}, Yn = {
	key: 2,
	class: "flow-field-hint"
}, Xn = { class: "flow-field" }, Zn = ["for"], Qn = [
	"id",
	"value",
	"disabled"
], $n = { value: "" }, er = ["value"], tr = {
	__name: "DataIngestFields",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = y(u), r = k("");
		z(() => t.node, () => r.value = "");
		let i = f(() => t.node.data.ingest), a = f(() => n.reading.has(t.node.id)), o = f(() => i.value && he(i.value.fileName)), s = f(() => {
			let { fileName: e, fileSize: t, format: n, tables: r } = i.value, a = (e) => `${e.toLocaleString()} ${e === 1 ? "row" : "rows"}`, o = pe(i.value) ? `${r.length} ${n === "xlsx" ? "sheets" : K[n].multi === "layers" ? "layers" : "tables"}, ${a(r.reduce((e, t) => e + t.rowCount, 0))}` : a(r[0]?.rowCount ?? 0);
			return `${e} · ${ve(t)} · ${K[n].label}, ${o}`;
		}), c = f(() => i.value && !t.node.data.label && _e(i.value.fileName));
		async function l(e) {
			let n = t.node;
			r.value = "";
			let i = await e();
			t.node === n && (r.value = i ?? "");
		}
		function p(e) {
			let r = e.target.files[0];
			e.target.value = "", r && l(() => n.chooseFile(t.node.id, r));
		}
		let v = (e) => l(() => n.setIngestFormat(t.node.id, e.target.value)), b = L(), x = {
			file: `${b}-file`,
			fileNote: `${b}-file-note`,
			format: `${b}-format`
		};
		return (t, l) => (E(), h(d, null, [g("div", Wn, [
			l[1] ||= g("span", { class: "flow-field-label" }, "File", -1),
			g("label", { class: S(["flow-file", { "is-busy": a.value }]) }, [g("input", {
				id: x.file,
				type: "file",
				class: "flow-file-input",
				accept: I(fe),
				disabled: a.value,
				"aria-describedby": x.fileNote,
				onChange: p
			}, null, 40, Gn), _(" " + P(a.value ? "Reading…" : i.value ? "Choose another file…" : "Choose file…"), 1)], 2),
			g("div", { id: x.fileNote }, [r.value ? (E(), h("p", qn, P(r.value), 1)) : m("", !0), i.value ? (E(), h("p", Jn, P(s.value), 1)) : (E(), h("p", Yn, " CSV, TSV, JSON, Parquet, Excel (.xlsx), SQLite, or geometry: GeoJSON, KML, a zipped shapefile, GeoPackage or FlatGeobuf. Its data is read and kept; the file itself isn't. "))], 8, Kn),
			c.value ? (E(), h("button", {
				key: 0,
				type: "button",
				class: "flow-suggestion",
				onClick: l[0] ||= (t) => I(n).setLabel(e.node.id, c.value)
			}, " Rename to “" + P(c.value) + "” to match " + P(i.value.fileName) + "? ", 1)) : m("", !0)
		]), g("div", Xn, [g("label", {
			class: "flow-field-label",
			for: x.format
		}, "File Type", 8, Zn), g("select", {
			id: x.format,
			class: "flow-field-input flow-field-select",
			value: e.node.data.ingestFormat ?? "",
			disabled: a.value,
			onChange: v
		}, [g("option", $n, " From file name" + P(o.value ? ` (${I(K)[o.value].label})` : ""), 1), (E(!0), h(d, null, A(I(ue), (e) => (E(), h("option", {
			key: e,
			value: e
		}, P(I(K)[e].label), 9, er))), 128))], 40, Qn)])], 64));
	}
}, nr = Symbol("flow-open-menu"), rr = [
	{
		label: "Open subnet",
		command: "node.open",
		shortcut: "Enter"
	},
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
], ir = [{
	label: "Delete wire",
	command: "wire.delete",
	shortcut: "Del"
}], ar = (e, t = null) => () => [...t?.levels.value.length > 1 ? [{
	id: "boundary",
	label: "Subnet"
}] : [], ..._r].map((t) => ({
	type: "submenu",
	label: t.label,
	badge: { class: `flow-node--${t.id}` },
	items: Ir(t.id).map((t) => ({
		label: Z[t].label,
		command: e,
		args: { kind: t }
	}))
})).filter((e) => e.items.length);
function or(e, t) {
	return {
		commands: {
			"node.open": {
				hidden: (e) => !["subnet", "loop"].includes(t.flow.findNode(e)?.data.kind),
				run: (e) => {
					let n = t.openSubnet(e);
					n && t.log(n, "error");
				}
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
			items: ar("node.add", t)
		}, n(e)],
		connectionMenu: ar("node.addConnected", t)
	};
}
//#endregion
//#region components/fieldFocus.js
function X(e) {
	let t = e.target.parentElement.closest("[tabindex]");
	t ? t.focus() : e.target.blur();
}
//#endregion
//#region components/ExportInputField.vue
var sr = {
	key: 0,
	class: "flow-field"
}, cr = ["for"], lr = [
	"id",
	"placeholder",
	"aria-describedby",
	"onKeydown"
], ur = ["id"], dr = {
	__name: "ExportInputField",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = y(u), r = k(""), i = null;
		z(() => [t.node, t.node.data.exportInput], () => {
			i = t.node, r.value = t.node.data.exportInput ?? "";
		}, { immediate: !0 });
		function a() {
			n.flow.findNode(i.id) === i && n.updateData(i.id, { exportInput: r.value.trim() || void 0 });
		}
		let o = f(() => [...new Set(n.flow.edges.value.filter((e) => e.target === t.node.id).map((e) => e.source))].map((e) => n.flow.findNode(e)).filter(Boolean).flatMap((e) => {
			let t = Ur(e.id, e.data), n = Lr(e.data.kind).category, r = e.data.ingest && pe(e.data.ingest) ? e.data.ingest.tables : [];
			return [{
				name: t,
				category: n
			}, ...r.map((e) => ({
				name: `${t}.${e.name}`,
				category: n,
				table: !0
			}))];
		})), s = f(() => o.value.filter((e) => !e.table).length > 1 || !!t.node.data.exportInput), c = y(nr), l = k(null);
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
		let p = L(), v = {
			input: `${p}-input`,
			note: `${p}-input-note`
		};
		return (e, t) => s.value ? (E(), h("div", sr, [
			g("label", {
				class: "flow-field-label",
				for: v.input
			}, "Input", 8, cr),
			g("div", {
				ref_key: "combo",
				ref: l,
				class: "flow-field-combo"
			}, [V(g("input", {
				id: v.input,
				"onUpdate:modelValue": t[0] ||= (e) => r.value = e,
				class: "flow-field-input flow-field-input--mono",
				placeholder: o.value[0]?.name ?? "",
				autocomplete: "off",
				spellcheck: "false",
				"aria-describedby": v.note,
				onBlur: a,
				onKeydown: [t[1] ||= H((...e) => I(X) && I(X)(...e), ["enter"]), H(te(d, ["alt", "prevent"]), ["down"])]
			}, null, 40, lr), [[R, r.value]]), g("button", {
				type: "button",
				class: "flow-field-combo-button",
				"aria-label": "Choose from the nodes wired in",
				"aria-haspopup": "menu",
				onClick: d
			}, [...t[2] ||= [g("svg", {
				viewBox: "0 0 12 12",
				"aria-hidden": "true"
			}, [g("path", { d: "M3 4.5 6 7.5 9 4.5" })], -1)]])], 512),
			g("p", {
				id: v.note,
				class: "flow-field-hint"
			}, [
				t[3] ||= _(" Several nodes are wired in: name the one to write, by its output (like ", -1),
				g("code", null, P(o.value[0]?.name), 1),
				t[4] ||= _("), or choose it from the list. Left empty, it only runs with one wired in. ", -1)
			], 8, ur)
		])) : m("", !0);
	}
}, fr = 30;
function pr() {
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
function mr(e) {
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
var hr = `<script>(${mr})(${JSON.stringify(`(${pr})()`)})<\/script>`;
function gr(e, t, { timeoutSeconds: n = fr } = {}) {
	return new Promise((r, i) => {
		let a = document.createElement("iframe");
		a.sandbox = "allow-scripts", a.hidden = !0, a.srcdoc = hr;
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
var _r = N([
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
]), Z = N({}), vr = /* @__PURE__ */ new Set(["boundary", "unknown"]), yr = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)?$/, br = /^[a-z][a-z0-9-]*$/, xr = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i, Sr = null;
function Cr({ id: e, label: t, colors: n }) {
	if (!br.test(e ?? "")) throw Error(`A category's id is lowercase letters, digits and hyphens: "${e}" isn't.`);
	if (!t) throw Error(`Category ${e} needs a label.`);
	if (vr.has(e) || _r.some((t) => t.id === e)) throw Error(`There's already a category called ${e}.`);
	let { from: r, to: i, label: a = "#fff" } = n ?? {};
	if (![
		r,
		i,
		a
	].every((e) => xr.test(e ?? ""))) throw Error(`Category ${e} needs colors: { from, to } (and optionally label), each a #hex colour.`);
	typeof document < "u" && (Sr ??= document.head.appendChild(document.createElement("style")), Sr.textContent += `.flow-node--${e} { --node-color-from: ${r}; --node-color-to: ${i}; --node-label-color: ${a}; }\n`), _r.push({
		id: e,
		label: t
	});
}
var wr = [
	"text",
	"number",
	"select",
	"checkbox",
	"code",
	"file",
	"readonly",
	"custom"
], Tr = [
	"required",
	"min",
	"max",
	"pattern",
	"when"
], Er = /^[a-z_][a-z0-9_]*$/;
function Dr(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let { name: i, hint: a, required: o } of n) {
		if (!Er.test(i ?? "")) throw Error(`Node kind ${e} has a ${t} named "${i}": use lowercase letters, digits and _.`);
		if (t === "input pin" && (a !== void 0 && typeof a != "string" || o !== void 0 && typeof o != "boolean")) throw Error(`Node kind ${e}'s input pin ${i} needs its hint to be text and required true or false.`);
		if (t === "slot" && i === "data") throw Error(`Node kind ${e} has a slot named data: that's the first slot's name.`);
		if (r.has(i)) throw Error(`Node kind ${e} has two ${t}s named ${i}.`);
		r.add(i);
	}
}
function Or(e, t) {
	if (!Array.isArray(t)) throw Error(`Node kind ${e}'s fields must be a list.`);
	let n = /* @__PURE__ */ new Set();
	for (let r of t) {
		let t = `Node kind ${e}'s field ${r?.key ?? "(no key)"}`;
		if (!wr.includes(r?.type)) throw Error(`${t} has type "${r?.type}": use one of ${wr.join(", ")}.`);
		if (r.type === "custom") {
			if (!r.component) throw Error(`${t} is custom, so it needs a component.`);
			continue;
		}
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(r.key ?? "")) throw Error(`${t} needs a key that's an identifier.`);
		if (n.has(r.key)) throw Error(`${t} is there twice.`);
		n.add(r.key);
		for (let e of r.validate ?? []) {
			if (!e?.message) throw Error(`${t} has a rule with no message.`);
			if (Tr.filter((t) => e[t] !== void 0).length !== 1) throw Error(`${t} has a rule that needs exactly one of ${Tr.join(", ")}.`);
			if (e.severity && !["error", "warn"].includes(e.severity)) throw Error(`${t} has a rule whose severity is "${e.severity}": use 'error' or 'warn'.`);
		}
	}
}
function Q(e) {
	let { kind: t, label: n, category: r } = e;
	if (!yr.test(t ?? "")) throw Error(`A node kind's name is lowercase letters, digits and hyphens, with one dot at most: "${t}" isn't.`);
	if ($(t)) throw Error(`There's already a node kind called ${t}.`);
	if (!n) throw Error(`Node kind ${t} needs a label.`);
	if (r !== "boundary" && !_r.some((e) => e.id === r)) throw Error(`Node kind ${t} is in category "${r}", which isn't defined.`);
	if (e.description !== void 0 && typeof e.description != "string") throw Error(`Node kind ${t}'s description needs to be text.`);
	if (e.run !== void 0 && typeof e.run != "function") throw Error(`Node kind ${t}'s run must be a function.`);
	if (e.fields !== void 0 && Or(t, e.fields), Array.isArray(e.slots)) Dr(t, "slot", e.slots);
	else if (e.slots !== void 0 && typeof e.slots != "function") throw Error(`Node kind ${t}'s slots must be a list, or a function of the node's data.`);
	if (![
		void 0,
		"many",
		"one",
		!1
	].includes(e.mainInput)) throw Error(`Node kind ${t}'s mainInput must be 'many', 'one' or false.`);
	if (Array.isArray(e.inputPins)) Dr(t, "input pin", e.inputPins);
	else if (e.inputPins !== void 0 && typeof e.inputPins != "function") throw Error(`Node kind ${t}'s inputPins must be a list, or a function of the node's data.`);
	let i = e.idPrefix ?? Hr(n).replaceAll("_", "");
	if (!/^[a-z][a-z0-9]*$/.test(i)) throw Error(`Node kind ${t} needs an idPrefix of lowercase letters and digits (its label doesn't make one).`);
	Z[t] = Object.freeze(b({
		runs: typeof e.run == "function" || e.where === "server",
		...e,
		fields: (e.fields ?? []).map((e) => Object.freeze(b({ ...e }))),
		idPrefix: i
	}));
}
function kr(e) {
	let t = {};
	for (let n of Lr(e.kind).fields ?? []) n.key && n.default !== void 0 && (t[n.key] = n.default);
	return {
		...t,
		...e
	};
}
var Ar = /* @__PURE__ */ new Set([
	"label",
	"autoRun",
	"sqlServerTables",
	"panels"
]), jr = (e, t) => Ar.has(t) || Lr(e).fields?.some((e) => e.key === t && e.affectsOutput === !1) || !1;
function Mr(e, t, n) {
	return e.when ? !!e.when(t, n) : e.required ? t == null || t === "" : e.min === void 0 ? e.max === void 0 ? e.pattern !== void 0 && typeof t == "string" && t !== "" && !new RegExp(e.pattern).test(t) : typeof t == "number" && t > e.max : typeof t == "number" && t < e.min;
}
function Nr(e, t, n) {
	let r = [], i = {
		key: e.key,
		label: e.label ?? e.key
	};
	for (let a of e.validate ?? []) {
		let e;
		try {
			e = Mr(a, t, n);
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
function Pr(e) {
	let t = kr(e);
	return (Lr(e.kind).fields ?? []).filter((e) => e.key && (!e.visible || e.visible(t))).flatMap((e) => Nr(e, t[e.key], t)).sort((e, t) => e.severity === t.severity ? 0 : e.severity === "error" ? -1 : 1);
}
var Fr = "application/x-flow-node-kind", Ir = (e) => Object.keys(Z).filter((t) => Z[t].category === e), $ = (e) => typeof e == "string" && e in Z && Object.hasOwn(Z, e), Lr = (e) => $(e) ? Z[e] : {
	label: String(e),
	category: "unknown",
	unknown: !0
};
function Rr(e, t) {
	let n = 1;
	for (; t.has(`${e}${n}`);) n++;
	return `${e}${n}`;
}
var zr = (e, t) => Rr(Z[e].idPrefix, new Set(t));
function Br(e, t) {
	let n = new Set(t);
	return n.has(e) ? Rr(e, n) : e;
}
var Vr = (e, t) => $(e) && RegExp(`^${Z[e].idPrefix}\\d+$`).test(t);
function Hr(e) {
	let t = e.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
	return /^\d/.test(t) ? `_${t}` : t;
}
var Ur = (e, t) => `${e}_${t.outputSuffix || "data"}`;
function Wr(e) {
	if (!$(e.kind)) return null;
	let { where: t } = Z[e.kind];
	return (typeof t == "function" ? t(e) : t) ?? null;
}
var Gr = (e) => Wr(e) === "server", Kr = (e, t) => typeof e == "function" ? e(t) ?? [] : e ?? [];
function qr(e, t) {
	let n = {
		name: null,
		label: t.outputSuffix || "data",
		ref: Ur(e, t),
		pin: !1
	}, r = new Set(t.slotPins ?? []);
	return [n, ...($(t.kind) ? Kr(Z[t.kind].slots, kr(t)) : []).filter((e) => e.name !== n.label).map((t) => ({
		name: t.name,
		label: t.label ?? t.name,
		ref: `${e}_${t.name}`,
		pin: !!t.pin || r.has(t.name)
	}))];
}
function Jr(e, t) {
	let n = qr(e, t);
	return [...$(t.kind) && Z[t.kind].mainOutput === !1 ? [] : [{
		handle: "source-0",
		slots: n
	}], ...n.filter((e) => e.pin).map((e) => ({
		handle: `source:${e.name}`,
		slots: [e]
	}))];
}
function Yr(e, t, n) {
	let r = qr(t, n);
	if (!e?.startsWith("source:")) return r;
	let i = e.slice(7);
	return r.filter((e) => e.name === i);
}
function Xr(e) {
	let t = $(e.kind), n = t ? Kr(Z[e.kind].inputPins, kr(e)) : [], r = t ? Z[e.kind].mainInput ?? "many" : "many";
	return [...r ? [{
		handle: "target-0",
		name: null,
		label: null,
		many: r === "many",
		hint: null,
		required: !1
	}] : [], ...n.map((e) => ({
		handle: `target:${e.name}`,
		name: e.name,
		label: e.label ?? e.name,
		many: !!e.many,
		hint: e.hint ?? null,
		required: !!e.required
	}))];
}
function Zr(e, t) {
	let n = new Set(t);
	return Xr(e).filter((e) => e.required && !n.has(e.handle)).map((e) => `${e.label}: wire a node into this input first.`);
}
var Qr = (e) => Array.from({ length: e }, (t, n) => `${(n + 1) / (e + 1) * 100}%`), $r = { class: "flow-field" }, ei = {
	key: 0,
	class: "flow-field-error"
}, ti = { class: "flow-field" }, ni = { class: "flow-field-hint" }, ri = { class: "flow-field-hint" }, ii = { class: "flow-field-hint" }, ai = { class: "flow-field" }, oi = ["for"], si = [
	"id",
	"value",
	"aria-describedby"
], ci = { value: "" }, li = ["value"], ui = ["id"], di = ["id"], fi = { class: "flow-field-row" }, pi = ["id", "onKeydown"], mi = ["aria-disabled"], hi = {
	__name: "SubnetFields",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = y(u), r = k(""), i = k("");
		z(() => t.node, () => {
			r.value = "", i.value = "";
		});
		let a = f(() => t.node.data.subnetPins ?? {
			inputs: [],
			outputs: []
		}), o = f(() => t.node.data.kind === rn), s = f(() => a.value.inputs.map((e) => o.value && e === "item" ? `items (${an})` : e)), c = f(() => [...a.value.outputs.map((e, n) => n === 0 ? Ur(t.node.id, t.node.data) : `${t.node.id}_${e}`), ...o.value ? [`${t.node.id}_${on}`] : []]), l = f(() => t.node.data.subnetRef ?? ""), p = f(() => Object.keys(n.library)), v = f(() => {
			if (!l.value) return 0;
			let e = (t) => (t?.nodes ?? []).reduce((t, n) => t + +(n.subnetRef === l.value) + e(n.subnet), 0);
			return e(n.snapshot.value) + Object.values(n.library).reduce((t, n) => t + e(n), 0);
		});
		function b() {
			r.value = n.openSubnet(t.node.id) ?? "";
		}
		function x() {
			r.value = n.shareSubnet(t.node.id, i.value) ?? "", r.value || (i.value = "");
		}
		let S = (e) => n.useSubnet(t.node.id, e.target.value || null), C = L(), w = {
			graph: `${C}-graph`,
			share: `${C}-share`,
			note: `${C}-note`
		};
		return (e, t) => (E(), h(d, null, [
			g("div", $r, [
				g("button", {
					type: "button",
					class: "flow-button flow-button--wide",
					onClick: b
				}, "Open " + P(o.value ? "loop" : "subnet"), 1),
				t[2] ||= g("p", { class: "flow-field-hint" }, "Or double-click it, or press Enter. Escape goes back up.", -1),
				r.value ? (E(), h("p", ei, P(r.value), 1)) : m("", !0)
			]),
			g("div", ti, [
				t[4] ||= g("span", { class: "flow-field-label" }, "Pins", -1),
				g("p", ni, " In: " + P(s.value.length ? s.value.join(", ") : "none (add an Input node inside)"), 1),
				g("p", ri, " Out: " + P(c.value.length ? c.value.join(", ") : "none (add an Output node inside)"), 1),
				g("p", ii, [t[3] ||= _(" Each Input and Output node inside is a pin, named by its ID, top to bottom. The topmost Output is the first output; others get pins of their own.", -1), o.value ? (E(), h(d, { key: 0 }, [_(" The Input called " + P(I(an)) + " puts out each run's row; other Inputs, the same table every run. Each output gathers every run's, with its _key and _iteration first.", 1)], 64)) : m("", !0)])
			]),
			g("div", ai, [
				g("label", {
					class: "flow-field-label",
					for: w.graph
				}, "Graph", 8, oi),
				g("select", {
					id: w.graph,
					class: "flow-field-input flow-field-select",
					value: l.value,
					"aria-describedby": w.note,
					onChange: S
				}, [g("option", ci, "Its own" + P(l.value ? " (a copy of the shared one)" : ""), 1), (E(!0), h(d, null, A(p.value, (e) => (E(), h("option", {
					key: e,
					value: e
				}, "Shared: " + P(e), 9, li))), 128))], 40, si),
				l.value ? (E(), h("p", {
					key: 0,
					id: w.note,
					class: "flow-field-hint"
				}, " Shared as " + P(l.value) + ", used " + P(v.value === 1 ? "once" : `${v.value} times`) + " in this graph: editing it inside changes every use, and each one goes stale. ", 9, ui)) : (E(), h(d, { key: 1 }, [g("p", {
					id: w.note,
					class: "flow-field-hint"
				}, "Share it to use the same graph in other Subnet and Loop nodes.", 8, di), g("div", fi, [V(g("input", {
					id: w.share,
					"onUpdate:modelValue": t[0] ||= (e) => i.value = e,
					class: "flow-field-input",
					placeholder: "Name to share it as",
					"aria-label": "Name to share it as",
					onKeydown: H(te(x, ["prevent"]), ["enter"])
				}, null, 40, pi), [[R, i.value]]), g("button", {
					type: "button",
					class: "flow-button",
					"aria-disabled": !i.value.trim(),
					onClick: t[1] ||= (e) => i.value.trim() && x()
				}, " Share ", 8, mi)])], 64))
			])
		], 64));
	}
}, gi = (e) => e?.message ?? String(e), _i = (e, t) => e.state === "connected" && typeof e[t] == "function";
Q({
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
		else if (_i(e.server, "query")) await e.loadParquet(n, await e.server.query({
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
}), Q({
	kind: "3d-asset",
	label: "3D Asset",
	category: "fetch",
	idPrefix: "asset"
}), Q({
	kind: "http-request",
	label: "HTTP Request",
	category: "fetch",
	idPrefix: "httprequest"
}), Q({
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
		if (!_i(e.server, "runPython")) return { error: "PythonScript nodes run on the server, which isn't available. Every other kind runs here in the browser." };
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
}), Q({
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
			({value: r, logs: i} = await gr(t, n));
		} catch (e) {
			return {
				error: gi(e),
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
}), Q({
	kind: "geometry-script",
	label: "GeometryScript",
	category: "modify",
	idPrefix: "geoscript"
}), Q({
	kind: "hlsl",
	label: "HLSL",
	category: "modify",
	idPrefix: "hlsl"
}), Q({
	kind: "network-fuse",
	label: "Network Fuse",
	category: "modify",
	idPrefix: "networkfuse",
	runs: !0
}), Q({
	kind: "debug",
	label: "Debug",
	category: "debug",
	idPrefix: "debug"
}), Q({
	kind: "data-ingest",
	label: "DataIngest",
	description: "Reads a file (CSV, Excel, Parquet, JSON, SQLite, or a geo file) into tables, once when it's chosen.",
	category: "import",
	idPrefix: "dataingest",
	outputName: !0,
	fields: [{
		type: "custom",
		component: tr
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
		return pe(t) ? { tables: n } : { table: n[0].table };
	}
}), Q({
	kind: "dxf-import",
	label: "DXF Import",
	category: "import",
	idPrefix: "dxfimport",
	runs: !0
}), Q({
	kind: "data-export",
	label: "DataExport",
	description: "Writes what's wired in to a file, which downloads when it runs, and passes it on unchanged.",
	category: "export",
	idPrefix: "dataexport",
	fields: [
		{
			type: "custom",
			component: dr
		},
		{
			key: "exportFilename",
			label: "Filename",
			type: "text",
			placeholder: "export",
			hint: (e, t) => {
				let n = t || "export";
				return `Saves as ${ge(n, e.exportFormat || he(n) || "csv")}`;
			}
		},
		{
			key: "exportFormat",
			label: "File Type",
			type: "select",
			options: [{
				value: "",
				label: "From file name (CSV if none)"
			}, ...de.map((e) => ({
				value: e,
				label: K[e].label
			}))]
		}
	],
	runHint: "Writes whatever's wired into this node on Run. Downloads to your computer immediately; errors show in the Terminal panel.",
	async run(e) {
		let t = vi(e.node, e.inputs);
		if (t.error) return t;
		let { input: n, tables: r } = t, i = (e.node.exportFilename ?? "").trim() || "export", a = e.node.exportFormat || he(i) || "csv", o = ge(i, a), s = K[a], c = r ?? [{
			name: Hr(n.id) || "data",
			table: t.table
		}];
		if (c.length > 1 && !s.writeTables) return { error: `${s.label} holds one table, and ${n.id} has ${c.length}. Put a SQLQuery node in between to pick one.` };
		let l = a === "parquet" ? await e.parquetOf(c[0].table) : await yi(e.sql, a, c, o), u = a === "geojson" || a === "kml" ? await jt(e.sql, c, s.label) : [];
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
function vi(e, t) {
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
async function yi(e, t, n, r) {
	let i = r.replace(/\.[^.]*$/, "") || "export";
	if (t === "geojson") return nt(e, n[0].table);
	if (t === "kml") return it(e, n, i);
	if (t === "gpkg") return lt(e, n);
	if (t === "shapefile") return mt(e, n, i);
	if (t === "sqlite") {
		if (!e.writeSqlite) throw Error("This SQL engine can't write SQLite files.");
		let t = [];
		for (let r of n) t.push(await bi(e, r));
		return e.writeSqlite(t);
	}
	let a = {
		csv: "FORMAT csv, HEADER",
		tsv: "FORMAT csv, DELIMITER '	', HEADER",
		json: "FORMAT json, ARRAY true",
		parquet: "FORMAT parquet",
		xlsx: "FORMAT xlsx, HEADER true"
	}[t];
	t === "xlsx" && await De(e);
	let o = `flow-export-${Date.now()}-${r}`;
	await Ee(e, `SELECT * FROM ${n[0].table}`, o, a);
	try {
		let n = await e.readFile(o);
		return t === "xlsx" ? Qt(n) : n;
	} finally {
		await e.dropFile(o);
	}
}
async function bi(e, { name: t, table: n }) {
	let r = (await e.query(`DESCRIBE SELECT * FROM ${n}`)).rows.map(([e, t]) => ({
		column: e,
		geometry: Y(t) !== void 0,
		blob: String(t) === "BLOB"
	})), i = r.map(({ column: e, geometry: t, blob: n }) => {
		let r = q(e);
		return t ? `ST_AsText(${r}) AS ${r}` : n ? `hex(${r}) AS ${r}` : r;
	}), { columns: a, rows: o } = await e.query(`SELECT ${i.join(", ")} FROM ${n}`);
	return {
		name: t,
		columns: a,
		rows: o.map((e) => e.map((e, t) => r[t].blob && e !== null ? Te(e) : e))
	};
}
Q({
	kind: en,
	label: "Subnet",
	description: "A graph of its own, run as one node: what's wired into it comes out of its Input nodes, and its Output nodes are its outputs. Double-click it to open it.",
	category: "custom",
	idPrefix: "subnet",
	mainInput: !1,
	inputPins: (e) => (e.subnetPins?.inputs ?? []).map((e) => ({
		name: e,
		label: e
	})),
	slots: (e) => (e.subnetPins?.outputs ?? []).slice(1).map((e) => ({
		name: e,
		pin: !0
	})),
	fields: [{
		type: "custom",
		component: hi
	}],
	create: () => {
		let e = mn();
		return {
			subnet: e,
			...fn(dn(e))
		};
	},
	run: (e) => e.runSubnet()
}), Q({
	kind: rn,
	label: "Loop",
	description: "Runs a graph of its own once per row of what's wired into items, and gathers each output across the runs, with a status output saying how each run went. Double-click it to open it.",
	category: "custom",
	idPrefix: "loop",
	mainInput: !1,
	where: (e) => xi(e.subnet) ? "server" : null,
	inputPins: (e) => (e.subnetPins?.inputs ?? []).map((e) => e === "item" ? {
		name: e,
		label: "items",
		hint: "A run per row: inside, the Input node item puts out that row.",
		required: !0
	} : {
		name: e,
		label: e,
		hint: "The same table every run."
	}),
	slots: (e) => [...(e.subnetPins?.outputs ?? []).slice(1).map((e) => ({
		name: e,
		pin: !0
	})), {
		name: on,
		pin: !0
	}],
	fields: [
		{
			type: "custom",
			component: hi
		},
		{
			key: "loopKey",
			label: "Key column",
			type: "text",
			mono: !0,
			placeholder: "row number",
			hint: "Each run's _key in the outputs: this column of its row, or its row number."
		},
		{
			key: "loopOnError",
			label: "When a run fails",
			type: "select",
			default: "continue",
			options: [{
				value: "continue",
				label: "Carry on with the rest"
			}, {
				value: "stop",
				label: "Stop the loop"
			}]
		},
		{
			key: "loopMax",
			label: "Most runs",
			type: "number",
			min: 1,
			step: 1,
			default: 1e3,
			hint: "Rows past this many aren't run (a warning says so).",
			validate: [{
				min: 1,
				message: "At least 1."
			}]
		},
		{
			key: "loopConcurrency",
			label: "Runs at once",
			type: "number",
			min: 1,
			step: 1,
			default: 1,
			hint: "On the server only: in the browser it runs one at a time. Python inside runs one at a time whatever this says.",
			validate: [{
				min: 1,
				message: "At least 1."
			}]
		}
	],
	create: () => {
		let e = mn(an);
		return {
			subnet: e,
			...fn(dn(e))
		};
	},
	run: (e) => e.runLoop()
});
function xi(e) {
	return (e?.nodes ?? []).some((e) => Wr(e) === "server" || xi(e.subnet));
}
Q({
	kind: tn,
	label: "Input",
	description: "One of its subnet's inputs: the subnet node has an input pin named by this node's ID, and what's wired into that pin comes out here.",
	category: "boundary",
	idPrefix: "input",
	mainInput: !1,
	run: (e) => e.boundInput ?? { error: "Input nodes work only inside a subnet: open a subnet (double-click it) and add them there." }
}), Q({
	kind: nn,
	label: "Output",
	description: "One of its subnet's outputs, named by this node's ID: what's wired into it comes out of the subnet. The topmost Output is the subnet's first output; others get pins of their own.",
	category: "boundary",
	idPrefix: "output",
	mainInput: "one",
	mainOutput: !1,
	run: (e) => {
		let t = e.inputs[0];
		return t ? t.tables ? { tables: t.tables } : { table: t.table } : { error: "Wire a node into this Output." };
	}
});
//#endregion
//#region components/FlowNode.vue
var Si = {
	key: 0,
	class: "flow-node-kind"
}, Ci = ["aria-label", "title"], wi = {
	key: 2,
	class: "flow-blink-dot flow-node-server-dot",
	role: "img",
	"aria-label": "Executes on server",
	title: "Executes on server"
}, Ti = {
	key: 4,
	class: "flow-node-ref-hint"
}, Ei = {
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
		}, r = t, i = y(u), a = f(() => Lr(r.data.kind)), o = f(() => Gr(r.data)), s = f(() => i.server.value.state), c = f(() => Pr(r.data)), l = f(() => c.value.find((e) => e.severity === "error")), g = f(() => i.run.status[r.id] === "completed" ? i.run.results[r.id]?.warnings ?? [] : []), _ = f(() => [...c.value.filter((e) => e.severity === "warn"), ...g.value.map((e) => ({
			label: "Last run",
			message: e
		}))]), b = ie(), x = f(() => new Set(b.value.map((e) => e.source === r.id ? e.sourceHandle : e.targetHandle))), w = f(() => Zr(r.data, x.value)), T = f(() => o.value && s.value === "unavailable" ? "Backend not available." : i.run.progress[r.id] ? D(i.run.progress[r.id]) : n[i.run.status[r.id]] ?? (a.value.unknown ? "Not available here." : l.value ? `${l.value.label}: ${l.value.message}` : w.value[0] ?? ""));
		function D({ done: e, total: t, failed: n }) {
			return `Running… ${e.toLocaleString()} / ${t.toLocaleString()}${n ? ` · ${n} failed` : ""}`;
		}
		let O = (e) => f(() => {
			let t;
			if (a.value.unknown) {
				let n = b.value.filter((t) => (e === "source" ? t.source : t.target) === r.id).map((t) => e === "source" ? t.sourceHandle : t.targetHandle);
				t = [.../* @__PURE__ */ new Set([`${e}-0`, ...n])].sort((e, t) => e.localeCompare(t, void 0, { numeric: !0 })).map((e) => ({
					id: e,
					label: null,
					refs: []
				}));
			} else t = e === "target" ? Xr(r.data).map((e) => ({
				id: e.handle,
				label: e.label,
				hint: e.hint,
				required: e.required,
				refs: []
			})) : Jr(r.id, r.data).map((e) => ({
				id: e.handle,
				label: e.handle === "source-0" ? null : e.slots[0].label,
				refs: e.slots.map((e) => e.ref)
			}));
			let n = Qr(t.length);
			return t.map((e, t) => ({
				...e,
				top: n[t]
			}));
		}), j = O("target"), M = O("source"), N = (e) => e.label ? `${e.label}${e.hint ? `: ${e.hint}` : ""}${e.required ? " (required)" : ""}` : void 0, F = k(!1), L = k(null);
		return (n, r) => V((E(), h("div", {
			class: S(["flow-node", [`flow-node--${a.value.category}`, { "is-hovered": F.value }]]),
			onPointerenter: r[1] ||= (e) => F.value = !0,
			onPointerleave: r[2] ||= (e) => F.value = !1
		}, [
			t.data.label ? (E(), h("span", Si, P(a.value.label), 1)) : m("", !0),
			v(le, {
				label: t.data.label || a.value.label,
				status: T.value,
				selected: t.selected
			}, null, 8, [
				"label",
				"status",
				"selected"
			]),
			_.value.length ? (E(), h("span", {
				key: 1,
				class: S(["flow-node-warning", { "is-beside-dot": o.value && s.value === "connected" }]),
				role: "img",
				"aria-label": _.value.map((e) => `${e.label}: ${e.message}`).join(" "),
				title: _.value.map((e) => `${e.label}: ${e.message}`).join("\n")
			}, "!", 10, Ci)) : m("", !0),
			o.value && s.value === "connected" ? (E(), h("span", wi)) : m("", !0),
			(E(!0), h(d, null, A(I(j), (e) => (E(), p(I(ne), {
				id: e.id,
				key: e.id,
				type: "target",
				position: I(W).Left,
				connectable: !a.value.unknown,
				class: S(["flow-handle flow-handle--in", {
					"is-connected": x.value.has(e.id),
					"is-required": e.required && !x.value.has(e.id)
				}]),
				style: C({ top: e.top }),
				title: N(e)
			}, null, 8, [
				"id",
				"position",
				"connectable",
				"class",
				"style",
				"title"
			]))), 128)),
			(E(!0), h(d, null, A(I(M), (e) => (E(), p(I(ne), {
				id: e.id,
				key: e.id,
				type: "source",
				position: I(W).Right,
				connectable: !a.value.unknown,
				class: S(["flow-handle flow-handle--out", { "is-connected": x.value.has(e.id) }]),
				style: C({ top: e.top }),
				onPointerenter: (t) => L.value = e,
				onPointerleave: r[0] ||= (e) => L.value = null
			}, null, 8, [
				"id",
				"position",
				"connectable",
				"class",
				"style",
				"onPointerenter"
			]))), 128)),
			F.value ? (E(), h(d, { key: 3 }, [(E(!0), h(d, null, A(I(j).filter((e) => e.label), (e) => (E(), h("span", {
				key: e.id,
				class: "flow-pin-label flow-pin-label--in",
				style: C({ top: e.top })
			}, P(e.label), 5))), 128)), (E(!0), h(d, null, A(I(M).filter((e) => e.label), (e) => (E(), h("span", {
				key: e.id,
				class: "flow-pin-label flow-pin-label--out",
				style: C({ top: e.top })
			}, P(e.label), 5))), 128))], 64)) : m("", !0),
			L.value?.refs.length ? (E(), h("span", Ti, [(E(!0), h(d, null, A(L.value.refs, (e) => (E(), h("span", {
				key: e,
				class: "flow-node-ref-hint-line"
			}, P(e), 1))), 128))])) : m("", !0)
		], 34)), [[I(e), {
			items: I(rr),
			context: t.id
		}]]);
	}
}, Di = ["d"], Oi = [
	"id",
	"x1",
	"y1",
	"x2",
	"y2"
], ki = ["d", "stroke"], Ai = ["d", "stroke"], ji = ["d"], Mi = ["d"], Ni = {
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
		let n = t, r = y(u), i = f(() => re(n)[0]), a = (e) => r.run.status[e] === "completed", o = f(() => a(n.source) ? a(n.target) ? "flowed" : "flowing" : r.run.started ? "dormant" : "pristine"), s = (e) => {
			let t = r.flow.findNode(e);
			return t ? `flow-node--${Lr(t.data.kind).category}` : "";
		}, c = L().replace(/[^\w-]/g, ""), l = `flow-wire-flowed-${c}`, p = `flow-wire-flowing-${c}`;
		return (n, r) => V((E(), h("g", null, [
			o.value === "pristine" || o.value === "dormant" ? (E(), h("path", {
				key: 0,
				class: S(["flow-wire", o.value === "pristine" ? "flow-wire--idle" : "flow-wire--waiting"]),
				d: i.value
			}, null, 10, Di)) : (E(), h(d, { key: 1 }, [
				g("defs", null, [(E(!0), h(d, null, A([l, p], (e) => (E(), h("linearGradient", {
					id: e,
					key: e,
					gradientUnits: "userSpaceOnUse",
					x1: t.sourceX,
					y1: t.sourceY,
					x2: t.targetX,
					y2: t.targetY
				}, [g("stop", {
					offset: "0",
					class: S(["flow-wire-stop-source", s(t.source)])
				}, null, 2), g("stop", {
					offset: "1",
					class: S(e === l ? ["flow-wire-stop-target", s(t.target)] : "flow-wire-stop-dormant")
				}, null, 2)], 8, Oi))), 128))]),
				g("path", {
					class: "flow-wire",
					d: i.value,
					stroke: `url(#${l})`
				}, null, 8, ki),
				g("path", {
					class: S(["flow-wire flow-wire--grow", { "is-complete": o.value === "flowed" }]),
					d: i.value,
					pathLength: "1",
					stroke: `url(#${p})`
				}, null, 10, Ai)
			], 64)),
			t.selected ? (E(), h("path", {
				key: 2,
				class: "flow-wire-gaps",
				d: i.value
			}, null, 8, ji)) : m("", !0),
			g("path", {
				class: "flow-wire-hit",
				d: i.value
			}, null, 8, Mi)
		])), [[I(e), {
			items: I(ir),
			context: t.id
		}]]);
	}
}, Pi = [
	"x1",
	"y1",
	"x2",
	"y2"
], Fi = ["d", "stroke"], Ii = {
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
		let t = e, n = y(u), r = f(() => re(t)[0]), i = f(() => {
			let e = {
				x: t.sourceX,
				y: t.sourceY
			}, n = {
				x: t.targetX,
				y: t.targetY
			};
			return t.fromInput ? [n, e] : [e, n];
		}), a = (e) => `flow-node--${Lr(e.data.kind).category}`, o = f(() => {
			let [e, r] = t.fromInput ? [t.targetNode, t.sourceNode] : [t.sourceNode, t.targetNode];
			return !e || n.run.status[e.id] !== "completed" ? ["flow-connection-line-from", "flow-connection-line-to"] : [["flow-wire-stop-source", a(e)], r ? ["flow-wire-stop-target", a(r)] : "flow-wire-stop-dormant"];
		}), s = `flow-connection-line-${L().replace(/[^\w-]/g, "")}`;
		return (e, t) => (E(), h(d, null, [g("defs", null, [g("linearGradient", {
			id: s,
			gradientUnits: "userSpaceOnUse",
			x1: i.value[0].x,
			y1: i.value[0].y,
			x2: i.value[1].x,
			y2: i.value[1].y
		}, [g("stop", {
			offset: "0",
			class: S(o.value[0])
		}, null, 2), g("stop", {
			offset: "1",
			class: S(o.value[1])
		}, null, 2)], 8, Pi)]), g("path", {
			class: "flow-wire flow-connection-line",
			d: r.value,
			stroke: `url(#${s})`
		}, null, 8, Fi)], 64));
	}
}, Li = {
	__name: "FlowCanvas",
	emits: ["connection-dropped"],
	setup(e, { emit: t }) {
		let n = t, r = y(u), { onConnect: i, onConnectStart: a, onConnectEnd: o, onNodeDoubleClick: s } = r.flow;
		s(({ node: e }) => {
			let t = r.openSubnet(e.id);
			t && r.log(t, "error");
		});
		let c = null, l = !1;
		a(({ nodeId: e, handleId: t, handleType: n }) => {
			c = {
				nodeId: e,
				handleId: t,
				handleType: n
			}, l = !1;
		}), i((e) => {
			l = !0, r.connect(e);
		}), o((e) => {
			if (l || !c || !e?.target?.classList?.contains("vue-flow__pane")) return;
			let { clientX: t, clientY: r } = e.changedTouches?.[0] ?? e;
			n("connection-dropped", {
				point: {
					x: t,
					y: r
				},
				from: c
			}), c = null;
		});
		let d = (e) => e.dataTransfer.types.includes(Fr);
		function f(e) {
			d(e) && (e.preventDefault(), e.dataTransfer.dropEffect = "copy");
		}
		function p(e) {
			if (!d(e)) return;
			e.preventDefault();
			let t;
			try {
				t = JSON.parse(e.dataTransfer.getData(Fr));
			} catch {
				return;
			}
			$(t?.kind) && r.addNode(t.kind, {
				x: e.clientX,
				y: e.clientY
			}, t.grab ?? void 0);
		}
		return (e, t) => (E(), h("div", {
			class: "flow-canvas-layer",
			onContextmenu: t[0] ||= (...e) => I(r).setContextPoint && I(r).setContextPoint(...e),
			onDragover: f,
			onDrop: p
		}, [v(I(G), {
			"min-zoom": .25,
			"max-zoom": 2,
			"connection-mode": I(U).Strict,
			"is-valid-connection": I(r).isValidConnection,
			"delete-key-code": null,
			"nodes-focusable": !1,
			"edges-focusable": !1,
			"selection-key-code": null,
			"multi-selection-key-code": null
		}, {
			"node-pipeline": B(({ id: e, data: t, selected: n }) => [v(Ei, {
				id: e,
				data: t,
				selected: n
			}, null, 8, [
				"id",
				"data",
				"selected"
			])]),
			"edge-wire": B((e) => [v(Ni, {
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
			"connection-line": B((e) => [v(Ii, {
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
			default: B(() => [v(I(oe), {
				class: "flow-canvas-dots",
				gap: 24,
				size: 1
			})]),
			_: 1
		}, 8, ["connection-mode", "is-valid-connection"])], 32));
	}
}, Ri = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$/, zi = Symbol("flow-terminal-commands"), Bi = "••••";
function Vi() {
	let e = O([]), t = O([]), n = (e) => e.toLowerCase();
	return {
		commands: e,
		define(t) {
			for (let r of [t].flat()) {
				if (!Ri.test(r?.name ?? "")) throw Error(`A command's name is dotted words, its namespace first (f.Theme): "${r?.name}" isn't.`);
				if (!["action", "setting"].includes(r.kind)) throw Error(`Command ${r.name} needs kind 'action' or 'setting'.`);
				if (r.kind === "action" && typeof r.run != "function") throw Error(`Command ${r.name} needs run.`);
				if (r.kind === "setting" && typeof r.get != "function") throw Error(`Command ${r.name} needs get.`);
				let t = e.findIndex((e) => n(e.name) === n(r.name));
				t >= 0 ? e.splice(t, 1, r) : e.push(r);
			}
		},
		remove(t) {
			for (let r = e.length - 1; r >= 0; r--) n(e[r].name).startsWith(n(t)) && e.splice(r, 1);
		},
		unavailable(e, r) {
			let i = t.findIndex((t) => n(t.prefix) === n(e));
			i >= 0 && t.splice(i, 1), r && t.push({
				prefix: e,
				message: r
			});
		},
		find: (t) => e.find((e) => n(e.name) === n(t)) ?? null,
		missingMessage: (e) => t.find((t) => n(e).startsWith(n(t.prefix)))?.message ?? null
	};
}
function Hi(e) {
	let t = /^\s*([^=\s]+)\s*(?:=\s*(.*?))?\s*$/s.exec(e);
	if (!t) return { error: "Type a command, like f.Help." };
	let [, n, r] = t;
	if (r === void 0) return { name: n.replace(/\.$/, "") };
	let i = Ui(r);
	return i.error ? {
		name: n,
		error: i.error
	} : {
		name: n,
		value: i.value
	};
}
function Ui(e) {
	if (e === "") return { error: "Give it a value after =: quoted text, a number, or true or false." };
	if (/^(true|false)$/i.test(e)) return { value: e.toLowerCase() === "true" };
	if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(e)) return { value: Number(e) };
	let t = e[0];
	if ((t === "\"" || t === "'") && e.length >= 2 && e.at(-1) === t) {
		let n = "";
		for (let r = 1; r < e.length - 1; r++) {
			let i = e[r];
			if (i === "\\" && r < e.length - 2) n += e[++r];
			else if (i === t) return { error: `There's a ${t} inside the text: put \\ before it.` };
			else n += i;
		}
		return { value: n };
	}
	return { error: `Values are quoted text ("${e}"), numbers, or true or false.` };
}
var Wi = (e) => typeof e == "string" ? JSON.stringify(e) : String(e);
function Gi(e, t) {
	let n = Hi(t), r = n.name && e.find(n.name);
	return !r?.secret || n.value === void 0 ? {
		echo: t.trim(),
		history: t.trim()
	} : {
		echo: `${r.name} = ${Bi}`,
		history: `${r.name} = `
	};
}
async function Ki(e, t, n) {
	let { echo: r, history: i } = Gi(e, t), a = (e, t) => ({
		echo: r,
		history: i,
		entries: [{
			type: e,
			text: t
		}]
	}), o = Hi(t);
	if (o.error && !o.name) return a("error", o.error);
	let s = e.find(o.name);
	if (!s) {
		let t = e.commands.filter((e) => e.name.toLowerCase().startsWith(`${o.name.toLowerCase()}.`));
		return t.length && o.value === void 0 ? a("output", Yi(e, t)) : a("error", e.missingMessage(o.name) ?? `There's no command called ${o.name}. f.Help lists them.`);
	}
	if (o.error) return a("error", o.error);
	try {
		if (s.kind === "action") return o.value === void 0 ? a("result", await s.run(n) || "Done.") : a("error", `${s.name} is an action: it takes no value.`);
		if (o.value === void 0) return a("result", `${s.name} = ${qi(s)}`);
		let e = Ji(s, o.value);
		return a("result", await s.set(e, n) || `${s.name} = ${s.secret ? "••••" : Wi(e)}`);
	} catch (e) {
		return a("error", e?.message ?? String(e));
	}
}
function qi(e) {
	let t = e.get();
	return e.secret ? t ? `${Bi} (set)` : "(not set)" : t == null || t === "" ? "(not set)" : Wi(t);
}
function Ji(e, t) {
	let n = e.type ?? "string";
	if (n !== typeof t) {
		let t = {
			string: "quoted text",
			number: "a number",
			boolean: "true or false"
		}[n];
		throw Error(`${e.name} takes ${t}.`);
	}
	let r = e.values?.();
	if (r?.length && n === "string") {
		let n = r.find((e) => e.toLowerCase() === t.toLowerCase());
		if (!n) throw Error(`${e.name} takes one of ${r.map(Wi).join(", ")}.`);
		return n;
	}
	return t;
}
function Yi(e, t = e.commands) {
	return [...t].sort((e, t) => e.name.localeCompare(t.name)).map((e) => `${e.kind === "setting" ? `${e.name} = …` : e.name}${e.description ? `\n  ${e.description}` : ""}`).join("\n");
}
function Xi(e, t) {
	let n = t.indexOf("=");
	if (n >= 0) return Zi(e, t, n);
	let r = t.trimStart(), i = r.lastIndexOf("."), a = i >= 0 ? r.slice(0, i + 1) : "", o = r.slice(i + 1).toLowerCase(), s = /* @__PURE__ */ new Map();
	for (let t of e.commands) {
		if (!t.name.toLowerCase().startsWith(a.toLowerCase())) continue;
		let e = t.name.slice(a.length), n = e.split(".")[0];
		if (!n.toLowerCase().startsWith(o) || s.has(n.toLowerCase())) continue;
		let r = e.length > n.length, i = t.name.slice(0, a.length) + n;
		s.set(n.toLowerCase(), r ? {
			label: n,
			insert: `${i}.`,
			kind: "namespace",
			detail: "›",
			description: ""
		} : {
			label: n,
			insert: i,
			kind: t.kind,
			description: t.description ?? "",
			detail: t.kind === "setting" ? qi(t) : ""
		});
	}
	let c = [...s.values()].sort((e, t) => e.label.localeCompare(t.label)), l = c.length === 1 ? c[0] : null;
	return {
		items: c,
		ghost: l && o.length && l.insert.length > r.length ? l.insert.slice(r.length) : ""
	};
}
function Zi(e, t, n) {
	let r = e.find(t.slice(0, n).trim()), i = r?.kind === "setting" ? r.values?.() ?? [] : [], a = t.slice(n + 1).trimStart().replace(/^["']/, "").toLowerCase(), o = i.filter((e) => e.toLowerCase().startsWith(a)).map((e) => ({
		label: e,
		insert: `${r.name} = ${Wi(e)}`,
		kind: "value",
		detail: "",
		description: ""
	})), s = o.length === 1 ? o[0] : null;
	return {
		items: o,
		ghost: s && a.length && s.insert.length > t.length && s.insert.toLowerCase().startsWith(t.toLowerCase()) ? s.insert.slice(t.length) : ""
	};
}
//#endregion
//#region components/CommandField.vue
var Qi = { class: "flow-command" }, $i = [
	"id",
	"aria-selected",
	"title",
	"onClick"
], ea = { class: "flow-command-option-label" }, ta = {
	key: 0,
	class: "flow-command-option-detail"
}, na = { class: "flow-command-box" }, ra = {
	class: "flow-command-ghost",
	"aria-hidden": "true"
}, ia = { class: "flow-command-typed" }, aa = [
	"aria-expanded",
	"aria-activedescendant",
	"aria-busy"
], oa = {
	__name: "CommandField",
	props: { registry: {
		type: Object,
		required: !0
	} },
	emits: ["focus", "blur"],
	setup(e, { expose: t, emit: n }) {
		let r = e, i = n, a = y(u), o = k(null), s = k(""), c = k(!1), l = k(!0), p = k(-1), v = k(!1), b = [], S = null, C = "", w = f(() => Xi(r.registry, s.value)), T = f(() => w.value.items), D = f(() => c.value && l.value && T.value.length > 1 && (s.value.trim().length >= 3 || s.value.includes("="))), O = f(() => c.value && S === null ? w.value.ghost : ""), j = L(), M = `${j}-list`, N = (e) => `${j}-option-${e}`;
		function F() {
			x(() => {
				let e = o.value;
				e && e.setSelectionRange(e.value.length, e.value.length);
			});
		}
		function I(e) {
			s.value = e, p.value = -1, l.value = !0, F();
		}
		function ee() {
			l.value = !0, p.value = -1, S = null;
		}
		function z(e) {
			if (b.length) {
				if (S === null) {
					if (e > 0) return;
					C = s.value, S = b.length;
				}
				S = Math.min(b.length, Math.max(0, S + e)), s.value = S === b.length ? C : b[S], S === b.length && (S = null), F();
			}
		}
		async function B() {
			let e = s.value.trim();
			if (e && !v.value) {
				v.value = !0;
				try {
					let { echo: t, history: n, entries: i } = await Ki(r.registry, e, {
						graph: a,
						registry: r.registry
					});
					a.log(t, "command", { repeat: !0 });
					for (let e of i) a.log(e.text, e.type, { repeat: !0 });
					b.at(-1) !== n && b.push(n), s.value = "";
				} finally {
					v.value = !1, S = null;
				}
			}
		}
		function H() {
			o.value?.closest(".flow-panel-host")?.focus({ preventScroll: !0 });
		}
		function U(e) {
			let t = D.value;
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				let n = e.key === "ArrowDown" ? 1 : -1, r = T.value.length;
				t ? p.value = p.value < 0 ? n > 0 ? 0 : r - 1 : (p.value + n + r) % r : z(n);
				return;
			}
			let n = t && p.value >= 0 ? T.value[p.value] : null;
			e.key === "ArrowRight" && n?.kind === "namespace" ? (e.preventDefault(), I(n.insert)) : e.key === "ArrowLeft" && n ? (e.preventDefault(), I(s.value.replace(/[^.]*$/, "").replace(/[^.]*\.$/, ""))) : e.key === "Tab" && (n || O.value) ? (e.preventDefault(), I(n ? n.insert : s.value + O.value)) : e.key === "Enter" ? (e.preventDefault(), n ? I(n.insert) : O.value ? I(s.value + O.value) : B()) : e.key === "Escape" && (e.preventDefault(), t ? l.value = !1 : H());
		}
		function ne() {
			c.value = !0, i("focus");
		}
		function W() {
			c.value = !1, i("blur");
		}
		return t({ focus: () => o.value?.focus() }), (e, t) => (E(), h("div", Qi, [D.value ? (E(), h("ul", {
			key: 0,
			id: M,
			class: "flow-command-list",
			role: "listbox",
			"aria-label": "Commands"
		}, [(E(!0), h(d, null, A(T.value, (e, n) => (E(), h("li", {
			id: N(n),
			key: e.insert,
			role: "option",
			class: "flow-command-option",
			"aria-selected": n === p.value,
			title: e.description || void 0,
			onMousedown: t[0] ||= te(() => {}, ["prevent"]),
			onClick: (t) => I(e.insert)
		}, [g("span", ea, P(e.label), 1), e.detail ? (E(), h("span", ta, P(e.detail), 1)) : m("", !0)], 40, $i))), 128))])) : m("", !0), g("div", na, [g("div", ra, [g("span", ia, P(s.value), 1), _(P(O.value), 1)]), V(g("input", {
			ref_key: "input",
			ref: o,
			"onUpdate:modelValue": t[1] ||= (e) => s.value = e,
			class: "flow-command-input",
			role: "combobox",
			"aria-label": "Command",
			"aria-autocomplete": "both",
			"aria-expanded": D.value,
			"aria-controls": M,
			"aria-activedescendant": D.value && p.value >= 0 ? N(p.value) : void 0,
			"aria-busy": v.value,
			spellcheck: "false",
			autocomplete: "off",
			placeholder: "Type a command (~ focuses here; f.Help lists them)",
			onInput: ee,
			onKeydown: U,
			onFocus: ne,
			onBlur: W
		}, null, 40, aa), [[R, s.value]])])]));
	}
}, sa = {
	key: 0,
	class: "flow-panel-empty"
}, ca = ["title"], la = {
	key: 1,
	class: "flow-terminal-line flow-terminal-note"
}, ua = {
	__name: "TerminalPanel",
	setup(e) {
		let t = y(u), n = y(zi, null), r = k(!1), i = f(() => r.value ? null : t.selectedNode.value), a = f(() => i.value ? t.logs.nodes[i.value.id]?.entries ?? [] : t.logs.app), o = f(() => i.value && t.run.status[i.value.id] === "stale"), c = {
			output: "flow-terminal-output",
			error: "flow-terminal-error",
			warning: "flow-terminal-line flow-terminal-warning",
			info: "flow-terminal-line",
			note: "flow-terminal-line flow-terminal-note",
			command: "flow-terminal-command",
			result: "flow-terminal-line flow-terminal-result"
		}, l = k(null), v = () => {
			let e = l.value;
			return !e || e.scrollHeight - e.scrollTop - e.clientHeight < 24;
		};
		return z(() => [
			i.value?.id,
			a.value.at(-1)?.id,
			a.value.at(-1)?.count,
			o.value
		], async ([e], [t] = []) => {
			(e !== t || v()) && (await x(), l.value && (l.value.scrollTop = l.value.scrollHeight));
		}, { flush: "pre" }), (e, t) => (E(), p(s, {
			class: "terminal-panel",
			name: "terminal",
			title: "Terminal",
			dock: "left",
			hotkey: "T",
			"default-size": 280,
			collapsed: ""
		}, {
			default: B(() => [g("div", { class: S({ "flow-terminal-panel": I(n) }) }, [g("div", {
				ref_key: "scroller",
				ref: l,
				class: "flow-terminal"
			}, [
				a.value.length ? m("", !0) : (E(), h("p", sa, " Nothing to show yet — run a node to see its output or errors here. ")),
				(E(!0), h(d, null, A(a.value, (e) => (E(), p(M(e.type === "output" || e.type === "error" ? "pre" : "p"), {
					key: e.id,
					class: S(c[e.type])
				}, {
					default: B(() => [_(P(e.text), 1), e.count > 1 ? (E(), h("span", {
						key: 0,
						class: "flow-terminal-count",
						title: i.value ? `${e.count} times since this node last changed` : `${e.count} times`
					}, " ×" + P(e.count), 9, ca)) : m("", !0)]),
					_: 2
				}, 1032, ["class"]))), 128)),
				o.value && a.value.length ? (E(), h("p", la, " This node has changed since it ran (or something upstream has). Its next run starts a new log. ")) : m("", !0)
			], 512), I(n) ? (E(), p(oa, {
				key: 0,
				registry: I(n),
				onFocus: t[0] ||= (e) => r.value = !0,
				onBlur: t[1] ||= (e) => r.value = !1
			}, null, 8, ["registry"])) : m("", !0)], 2)]),
			_: 1
		}));
	}
}, da = { class: "flow-library" }, fa = { class: "flow-library-heading" }, pa = { class: "flow-library-cards" }, ma = ["title", "onDragstart"], ha = {
	__name: "LibraryPanel",
	setup(e) {
		let t = y(u), n = f(() => [...t.levels.value.length > 1 ? [{
			id: "boundary",
			label: "Subnet"
		}] : [], ..._r].map((e) => ({
			...e,
			kinds: Ir(e.id)
		})).filter((e) => e.kinds.length));
		function r(e, t) {
			let n = t.currentTarget.getBoundingClientRect(), r = {
				x: (t.clientX - n.left) / n.width,
				y: (t.clientY - n.top) / n.height
			};
			t.dataTransfer.setData(Fr, JSON.stringify({
				kind: e,
				grab: r
			})), t.dataTransfer.effectAllowed = "copy";
		}
		return (e, t) => (E(), p(s, {
			class: "library-panel",
			name: "library",
			title: "Library",
			dock: "left",
			hotkey: "L",
			"default-size": 238,
			collapsed: ""
		}, {
			default: B(() => [g("div", da, [(E(!0), h(d, null, A(n.value, (e) => (E(), h("section", {
				key: e.id,
				class: "flow-library-section"
			}, [g("h3", fa, [g("span", {
				class: S(["flow-library-dot", `flow-node--${e.id}`]),
				"aria-hidden": "true"
			}, null, 2), _(" " + P(e.label), 1)]), g("div", pa, [(E(!0), h(d, null, A(e.kinds, (t) => (E(), h("div", {
				key: t,
				class: S(["flow-library-card", `flow-node--${e.id}`]),
				draggable: "true",
				title: I(Z)[t].description ? `${I(Z)[t].description}\n\nDrag onto the canvas to add one.` : `Drag onto the canvas to add ${I(Z)[t].label}`,
				onDragstart: (e) => r(t, e)
			}, [v(le, { label: I(Z)[t].label }, null, 8, ["label"])], 42, ma))), 128))])]))), 128))])]),
			_: 1
		}));
	}
}, ga = { class: "flow-props" }, _a = { class: "flow-field" }, va = ["aria-disabled"], ya = {
	__name: "FlowgraphsPanel",
	setup(e) {
		let t = y(u);
		return (e, n) => (E(), p(s, {
			class: "flowgraphs-panel",
			name: "flowgraphs",
			title: "Flowgraphs",
			dock: "left",
			hotkey: "G",
			"default-size": 278,
			"above-bottom": "",
			collapsed: ""
		}, {
			default: B(() => [g("div", ga, [g("div", _a, [g("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": I(t).run.executing,
				onClick: n[0] ||= (e) => I(t).run.executing || I(t).executeGraph()
			}, P(I(t).run.executing ? "Executing…" : "Execute Graph"), 9, va), n[1] ||= g("p", { class: "flow-field-hint" }, " Runs every node with Auto Run on, and the nodes they depend on. ", -1)])])]),
			_: 1
		}));
	}
}, ba = { class: "flow-data" }, xa = { class: "flow-table-wrap" }, Sa = { class: "flow-table" }, Ca = { class: "flow-table-geometry" }, wa = {
	key: 0,
	class: "flow-table-geometry flow-table-geometry-problem",
	title: "Invalid: self-intersecting rings and the like (ST_IsValid). Empty: no coordinates (ST_IsEmpty)."
}, Ta = ["aria-selected", "onClick"], Ea = ["title"], Da = { class: "flow-pager" }, Oa = ["aria-disabled"], ka = ["aria-disabled"], Aa = {
	__name: "DataTable",
	props: {
		data: {
			type: Object,
			required: !0
		},
		busy: Boolean,
		picked: {
			type: Number,
			default: -1
		}
	},
	emits: ["turn", "pick"],
	setup(e, { emit: t }) {
		let n = e, r = t, i = (e) => !n.busy && (e < 0 ? n.data.page > 0 : n.data.hasMore), a = (e) => i(e) && r("turn", e), o = (e) => e == null ? "" : typeof e == "object" ? JSON.stringify(e) : String(e);
		function s(e) {
			let t = e.types?.length ? e.types.join(", ") + (e.z ? " Z" : "") : "GEOMETRY", n = [e.invalid && `${e.invalid} invalid`, e.empty && `${e.empty} empty`].filter(Boolean);
			return {
				label: `${t} · ${e.crs ?? "CRS unknown"}`,
				problems: n.join(" · ")
			};
		}
		let c = f(() => (n.data.geometry ?? []).map((e) => e ? s(e) : null)), l = k(null);
		return z(() => [n.picked, n.data], async () => {
			n.picked < 0 || (await x(), l.value?.children[n.picked]?.scrollIntoView({ block: "nearest" }));
		}, { immediate: !0 }), (t, n) => (E(), h("div", ba, [g("div", xa, [g("table", Sa, [g("thead", null, [g("tr", null, [(E(!0), h(d, null, A(e.data.columns, (e, t) => (E(), h("th", { key: t }, [_(P(e) + " ", 1), c.value[t] ? (E(), h(d, { key: 0 }, [g("span", Ca, P(c.value[t].label), 1), c.value[t].problems ? (E(), h("span", wa, P(c.value[t].problems), 1)) : m("", !0)], 64)) : m("", !0)]))), 128))])]), g("tbody", {
			ref_key: "body",
			ref: l
		}, [(E(!0), h(d, null, A(e.data.rows, (t, n) => (E(), h("tr", {
			key: n,
			class: S({ "is-picked": n === e.picked }),
			"aria-selected": n === e.picked,
			onClick: (e) => r("pick", n)
		}, [(E(!0), h(d, null, A(t, (t, r) => (E(), h("td", {
			key: r,
			title: e.data.wkt?.[n]?.[r] ?? void 0
		}, P(o(t)), 9, Ea))), 128))], 10, Ta))), 128))], 512)])]), g("div", Da, [
			g("span", null, "Page " + P(e.data.page + 1), 1),
			g("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(-1),
				onClick: n[0] ||= (e) => a(-1)
			}, " Prev ", 8, Oa),
			g("button", {
				type: "button",
				class: "flow-button flow-button--quiet",
				"aria-disabled": !i(1),
				onClick: n[1] ||= (e) => a(1)
			}, " Next ", 8, ka)
		])]));
	}
}, ja = {
	key: 0,
	class: "flow-panel-empty"
}, Ma = {
	key: 1,
	class: "flow-panel-empty"
}, Na = {
	key: 2,
	class: "flow-panel-empty"
}, Pa = {
	key: 3,
	class: "flow-data-tabs"
}, Fa = {
	key: 0,
	class: "flow-tabs",
	role: "tablist",
	"aria-label": "Outputs"
}, Ia = ["aria-selected", "onClick"], La = {
	key: 1,
	class: "flow-value"
}, Ra = { class: "flow-value-type" }, za = { class: "flow-value-text" }, Ba = {
	key: 2,
	class: "flow-panel-empty"
}, Va = {
	key: 3,
	class: "flow-tabs",
	role: "tablist"
}, Ha = [
	"aria-selected",
	"title",
	"onClick"
], Ua = {
	key: 0,
	class: "flow-panel-empty"
}, Wa = {
	__name: "DataPanel",
	setup(e) {
		let t = y(u), n = t.selectedNode, r = f(() => n.value && t.run.results[n.value.id]), i = f(() => n.value && t.run.status[n.value.id] === "running"), a = t.dataView, o = (e) => Object.assign(a, {
			slot: e,
			table: null,
			row: null
		}), c = (e) => Object.assign(a, {
			table: e,
			row: null
		}), l = f(() => r.value?.slots?.length ? [{
			name: null,
			ref: Ur(n.value.id, n.value.data)
		}, ...r.value.slots] : []), _ = f(() => a.slot === null ? r.value : r.value?.slots?.find((e) => e.name === a.slot) ?? r.value), v = f(() => {
			let e = _.value?.tables;
			return e && (e.find((e) => e.name === a.table) ?? e[0]);
		}), b = f(() => _.value?.data ?? v.value?.data), x = (e) => t.turnPage(n.value.id, b.value.page + e, v.value?.name ?? null, a.slot), S = f(() => b.value ? b.value.page * b.value.pageSize : 0), C = f(() => a.row === null ? -1 : a.row - S.value), w = (e) => a.row = a.row === S.value + e ? null : S.value + e;
		return (e, t) => (E(), p(s, {
			class: "data-panel",
			name: "data",
			title: "Data",
			dock: "bottom",
			hotkey: "D",
			"default-size": 240,
			collapsed: ""
		}, {
			default: B(() => [!r.value || r.value.error ? (E(), h("p", ja, "Run a node to see its output here.")) : r.value.export && r.value.export.downloaded ? (E(), h("p", Ma, " “" + P(r.value.export.filename) + "” was downloaded to your computer. ", 1)) : r.value.export ? (E(), h("p", Na, " “" + P(r.value.export.filename) + "” was written as this node ran upstream of another, not downloaded. Run this node to download it. ", 1)) : (E(), h("div", Pa, [
				l.value.length ? (E(), h("div", Fa, [(E(!0), h(d, null, A(l.value, (e) => (E(), h("button", {
					key: e.ref,
					type: "button",
					role: "tab",
					class: "flow-tab flow-tab--mono",
					"aria-selected": e.name === I(a).slot,
					onClick: (t) => o(e.name)
				}, P(e.ref), 9, Ia))), 128))])) : m("", !0),
				_.value.value && _.value.value.kind !== "none" ? (E(), h("div", La, [g("p", Ra, P(_.value.value.type), 1), g("pre", za, P(_.value.value.kind === "json" ? JSON.stringify(_.value.value.value, null, 2) : _.value.value.text), 1)])) : b.value ? m("", !0) : (E(), h("p", Ba, " This node's output isn't tabular — see the Terminal panel. ")),
				_.value.tables ? (E(), h("div", Va, [(E(!0), h(d, null, A(_.value.tables, (e) => (E(), h("button", {
					key: e.name,
					type: "button",
					role: "tab",
					class: "flow-tab",
					"aria-selected": e === v.value,
					title: e.label === e.name ? void 0 : `${e.label} (${e.name} in SQL)`,
					onClick: (t) => c(e.name)
				}, P(e.label), 9, Ha))), 128))])) : m("", !0),
				b.value ? (E(), h(d, { key: 4 }, [b.value.rowCount ? (E(), p(Aa, {
					key: 1,
					data: b.value,
					busy: i.value,
					picked: C.value,
					onTurn: x,
					onPick: w
				}, null, 8, [
					"data",
					"busy",
					"picked"
				])) : (E(), h("p", Ua, "No rows."))], 64)) : m("", !0)
			]))]),
			_: 1
		}));
	}
}, Ga = {
	key: 0,
	class: "flow-field"
}, Ka = ["for"], qa = { class: "flow-assist" }, Ja = [
	"id",
	"placeholder",
	"aria-describedby"
], Ya = ["aria-disabled"], Xa = ["id"], Za = {
	key: 0,
	class: "flow-field-hint"
}, Qa = {
	key: 1,
	class: "flow-field-error"
}, $a = {
	key: 2,
	class: "flow-field-note"
}, eo = { class: "flow-field-hint" }, to = {
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
		let t = e, n = y(u), r = f(() => n.server.value.assistant), i = k(""), a = k(null), o = k(""), s = k(""), c = k(null), l = f(() => a.value !== null), d = f(() => !l.value && !!i.value.trim()), p = f(() => !!c.value && t.code === c.value.written);
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
		function b() {
			n.updateData(t.node.id, { [t.field]: c.value.previous }), c.value = null, o.value = "";
		}
		function x(e) {
			e.key !== "Enter" || e.shiftKey || e.isComposing || (e.preventDefault(), v());
		}
		let S = f(() => {
			let e = r.value.sampleRows, n = e > 0 ? `its inputs' columns and first ${e} ${e === 1 ? "row" : "rows"}` : "its inputs' columns", i = t.node.data.kind === "sql-query" ? ", and the server database's tables and columns," : "";
			return `Sends your request, this node's ${t.language}, ${n}${i} to ${r.value.model} through the server.`;
		}), C = L(), w = {
			request: `${C}-request`,
			note: `${C}-note`
		};
		return (t, n) => r.value ? (E(), h("div", Ga, [
			g("label", {
				class: "flow-field-label",
				for: w.request
			}, "Assistant", 8, Ka),
			g("div", qa, [V(g("textarea", {
				id: w.request,
				"onUpdate:modelValue": n[0] ||= (e) => i.value = e,
				class: "flow-field-input flow-assist-input",
				rows: "2",
				placeholder: `Say what the ${e.language} should do`,
				"aria-describedby": w.note,
				onKeydown: x
			}, null, 40, Ja), [[R, i.value]]), g("button", {
				type: "button",
				class: "flow-button",
				"aria-disabled": !d.value,
				onClick: v
			}, P(l.value ? "Writing…" : "Write"), 9, Ya)]),
			g("div", {
				id: w.note,
				class: "flow-assist-status",
				"aria-live": "polite"
			}, [l.value ? (E(), h("p", Za, P(a.value === "reading" ? "Reading its inputs…" : `Writing with ${r.value.model}…`), 1)) : s.value ? (E(), h("p", Qa, P(s.value), 1)) : o.value ? (E(), h("p", $a, [_(P(o.value) + " ", 1), p.value ? (E(), h("button", {
				key: 0,
				type: "button",
				class: "flow-suggestion",
				onClick: b
			}, "Undo")) : m("", !0)])) : m("", !0), g("p", eo, P(S.value) + " Check what it writes before you run it.", 1)], 8, Xa)
		])) : m("", !0);
	}
}, no = { key: 0 }, ro = {
	__name: "FieldText",
	props: { text: {
		type: String,
		default: ""
	} },
	setup(e) {
		let t = e, n = f(() => t.text.split("`").map((e, t) => ({
			part: e,
			code: t % 2 == 1
		})));
		return (e, t) => (E(!0), h(d, null, A(n.value, ({ part: e, code: t }, n) => (E(), h(d, { key: n }, [t ? (E(), h("code", no, P(e), 1)) : (E(), h(d, { key: 1 }, [_(P(e), 1)], 64))], 64))), 128));
	}
}, io = {
	key: 1,
	class: "flow-field-check"
}, ao = ["checked"], oo = { class: "flow-field" }, so = {
	key: 1,
	class: "flow-field-label"
}, co = [
	"type",
	"min",
	"max",
	"step",
	"placeholder",
	"aria-invalid"
], lo = [
	"rows",
	"placeholder",
	"aria-invalid",
	"onKeydown"
], uo = ["value"], fo = ["value"], po = ["accept", "disabled"], mo = {
	key: 0,
	class: "flow-field-error"
}, ho = {
	key: 1,
	class: "flow-field-error"
}, go = {
	key: 2,
	class: "flow-field-hint"
}, _o = {
	key: 3,
	class: "flow-field-hint"
}, vo = {
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
		}, r = y(u), i = f(() => [
			"text",
			"number",
			"code"
		].includes(t.field.type)), a = f(() => t.node.data[t.field.key]), o = f(() => a.value ?? t.field.default), s = k(""), c = k(""), l = k(""), b = null, x = (e) => e == null ? "" : String(e);
		z(() => [t.node, a.value], ([e], [n] = []) => {
			b = t.node, s.value = x(o.value), c.value = "", e !== n && (l.value = "");
		}, { immediate: !0 });
		let C = () => r.flow.findNode(b.id) === b ? b : null;
		function w() {
			let { type: e } = t.field;
			if (e === "code") return s.value;
			let n = String(s.value ?? "").trim();
			return e === "number" ? n === "" ? void 0 : Number.isFinite(Number(n)) ? Number(n) : null : n === "" ? void 0 : n;
		}
		function T() {
			if (!C()) return;
			let e = w();
			if (e === null) {
				c.value = "Enter a number.";
				return;
			}
			c.value = "", r.updateData(b.id, { [t.field.key]: e });
		}
		function D() {
			T(), C() && !c.value && r.runNode(b.id);
		}
		function O(e) {
			r.updateData(t.node.id, { [t.field.key]: e });
		}
		async function j(e) {
			let n = e.target.files[0];
			if (e.target.value = "", !n) return;
			let i = t.node, a = await r.storeFieldFile(i.id, t.field.key, n);
			t.node === i && (l.value = a ?? "");
		}
		let N = f(() => {
			if (!i.value) return o.value;
			let e = w();
			return e === null ? s.value : e;
		}), F = f(() => kr(t.node.data)), B = f(() => t.field.key ? Nr(t.field, N.value, F.value) : []), U = f(() => !!c.value || B.value.some((e) => e.severity === "error")), ne = f(() => {
			let { hint: e } = t.field;
			return typeof e == "function" ? e(F.value, N.value) : e ?? "";
		}), W = f(() => {
			let { options: e } = t.field;
			return (typeof e == "function" ? e(F.value) : e) ?? [];
		}), G = f(() => r.reading.has(t.node.id)), re = L(), ie = `${re}-input`, ae = `${re}-note`;
		return (t, r) => e.field.type === "custom" ? (E(), p(M(e.field.component), {
			key: 0,
			node: e.node
		}, null, 8, ["node"])) : e.field.type === "checkbox" ? (E(), h("label", io, [_(P(e.field.label) + " ", 1), g("input", {
			type: "checkbox",
			checked: !!o.value,
			onChange: r[0] ||= (e) => O(e.target.checked)
		}, null, 40, ao)])) : (E(), h(d, { key: 2 }, [e.field.type === "code" && e.field.assistant ? (E(), p(to, {
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
		])) : m("", !0), g("div", oo, [
			e.field.type === "file" ? (E(), h("span", so, P(e.field.label), 1)) : (E(), h("label", {
				key: 0,
				class: "flow-field-label",
				for: ie
			}, P(e.field.label), 1)),
			e.field.type === "text" || e.field.type === "number" ? V((E(), h("input", {
				key: 2,
				id: ie,
				"onUpdate:modelValue": r[1] ||= (e) => s.value = e,
				class: S(["flow-field-input", {
					"flow-field-input--mono": e.field.mono,
					"is-invalid": U.value
				}]),
				type: e.field.type === "number" ? "number" : "text",
				min: e.field.min,
				max: e.field.max,
				step: e.field.step,
				placeholder: e.field.placeholder,
				"aria-invalid": U.value,
				"aria-describedby": ae,
				autocomplete: "off",
				spellcheck: "false",
				onInput: r[2] ||= (e) => c.value = "",
				onBlur: T,
				onKeydown: r[3] ||= H((...e) => I(X) && I(X)(...e), ["enter"])
			}, null, 42, co)), [[ee, s.value]]) : e.field.type === "code" ? V((E(), h("textarea", {
				key: 3,
				id: ie,
				"onUpdate:modelValue": r[4] ||= (e) => s.value = e,
				class: S(["flow-field-input flow-field-input--mono flow-field-code", { "is-invalid": U.value }]),
				rows: e.field.rows ?? 8,
				spellcheck: "false",
				placeholder: e.field.placeholder,
				"aria-invalid": U.value,
				"aria-describedby": ae,
				onBlur: T,
				onKeydown: [H(te(D, ["ctrl", "prevent"]), ["enter"]), H(te(D, ["meta", "prevent"]), ["enter"])]
			}, null, 42, lo)), [[R, s.value]]) : e.field.type === "select" ? (E(), h("select", {
				key: 4,
				id: ie,
				class: S(["flow-field-input flow-field-select", { "is-invalid": U.value }]),
				value: o.value ?? "",
				"aria-describedby": ae,
				onChange: r[5] ||= (e) => O(e.target.value === "" ? void 0 : e.target.value)
			}, [(E(!0), h(d, null, A(W.value, (e) => (E(), h("option", {
				key: e.value,
				value: e.value
			}, P(e.label), 9, fo))), 128))], 42, uo)) : e.field.type === "file" ? (E(), h("label", {
				key: 5,
				class: S(["flow-file", { "is-busy": G.value }])
			}, [g("input", {
				id: ie,
				type: "file",
				class: "flow-file-input",
				accept: e.field.accept,
				disabled: G.value,
				"aria-describedby": ae,
				onChange: j
			}, null, 40, po), _(" " + P(G.value ? "Reading…" : o.value ? "Choose another file…" : "Choose file…"), 1)], 2)) : e.field.type === "readonly" ? (E(), h("p", {
				key: 6,
				id: ie,
				class: "flow-field-readonly"
			}, P(e.field.value?.(F.value) ?? ""), 1)) : m("", !0),
			g("div", { id: ae }, [
				c.value ? (E(), h("p", mo, P(c.value), 1)) : m("", !0),
				l.value ? (E(), h("p", ho, P(l.value), 1)) : m("", !0),
				(E(!0), h(d, null, A(B.value, (e) => (E(), h("p", {
					key: e.message,
					class: S(e.severity === "warn" ? "flow-field-warning" : "flow-field-error")
				}, P(e.message), 3))), 128)),
				e.field.type === "file" && o.value ? (E(), h("p", go, P(o.value.fileName) + " · " + P(I(ve)(o.value.fileSize)), 1)) : m("", !0),
				ne.value ? (E(), h("p", _o, [v(ro, { text: ne.value }, null, 8, ["text"])])) : m("", !0)
			])
		])], 64));
	}
}, yo = { class: "flow-props" }, bo = {
	key: 0,
	class: "flow-props-description"
}, xo = { class: "flow-field" }, So = ["for"], Co = [
	"id",
	"aria-invalid",
	"aria-describedby"
], wo = ["id"], To = {
	key: 0,
	class: "flow-field-error"
}, Eo = { class: "flow-field-hint" }, Do = { class: "flow-field" }, Oo = ["for"], ko = ["id", "placeholder"], Ao = {
	key: 1,
	class: "flow-field"
}, jo = ["for"], Mo = { class: "flow-field-prefixed" }, No = {
	class: "flow-field-prefix",
	"aria-hidden": "true"
}, Po = [
	"id",
	"aria-invalid",
	"aria-describedby"
], Fo = ["id"], Io = { class: "flow-field-check" }, Lo = ["checked"], Ro = { class: "flow-field" }, zo = { class: "flow-actions" }, Bo = ["aria-disabled"], Vo = { class: "flow-field-hint" }, Ho = {
	key: 3,
	class: "flow-field-note is-warning"
}, Uo = {
	key: 4,
	class: "flow-field-hint"
}, Wo = {
	__name: "NodeProperties",
	props: { node: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = y(u), r = f(() => Lr(t.node.data.kind)), i = f(() => n.run.status[t.node.id]), a = f(() => i.value === "running"), o = f(() => {
			let e = kr(t.node.data);
			return (r.value.fields ?? []).filter((t) => !t.visible || t.visible(e));
		}), s = k(""), c = k(""), l = k(""), v = k(""), b = k(""), x = null;
		z(() => {
			let { id: e, data: n } = t.node;
			return [
				t.node,
				e,
				n.label,
				n.outputSuffix
			];
		}, () => {
			x = t.node, s.value = t.node.id, c.value = "", l.value = t.node.data.label ?? "", v.value = t.node.data.outputSuffix ?? "", b.value = "";
		}, { immediate: !0 });
		let C = () => n.flow.findNode(x.id) === x ? x : null;
		function w() {
			C() && (c.value = n.renameNode(x.id, s.value) ?? "", c.value || (s.value = x.id));
		}
		function T() {
			C() && n.setLabel(x.id, l.value);
		}
		function D() {
			C() && (b.value = n.setOutputName(x.id, v.value) ?? "", b.value || (v.value = x.data.outputSuffix ?? ""));
		}
		let O = f(() => {
			let e = Ur(t.node.id, t.node.data), n = t.node.data.ingest;
			if (!n || !pe(n)) return `this node's data as “${e}”`;
			let r = n.tables.map((t) => `“${e}.${t.name}”`);
			return `this node's tables as ${r.slice(0, 3).join(", ")}${r.length > 3 ? ", …" : ""}`;
		}), j = f(() => t.node.data.autoRun !== !1), M = (e) => n.updateData(t.node.id, { autoRun: e.target.checked ? void 0 : !1 }), N = f(() => t.node.data.sqlServerTables ?? []), F = f(() => Gr(t.node.data)), ee = n.server, B = f(() => F.value && ee.value.state !== "connected"), te = f(() => {
			if (r.value.canRun) {
				let e = r.value.canRun(kr(t.node.data));
				if (e) return e;
			}
			let e = Pr(t.node.data).find((e) => e.severity === "error");
			if (e) return `${e.label}: ${e.message}`;
			let i = n.flow.edges.value.filter((e) => e.target === t.node.id).map((e) => e.targetHandle ?? "target-0");
			return Zr(t.node.data, i)[0] ?? null;
		}), U = f(() => !a.value && !n.reading.has(t.node.id) && !B.value && !te.value), ne = f(() => r.value.runHint ?? "Results land in the Data panel; errors show in the Terminal panel."), W = L(), G = {
			id: `${W}-id`,
			idNote: `${W}-id-note`,
			label: `${W}-label`,
			output: `${W}-output`,
			outputNote: `${W}-output-note`
		};
		return (t, u) => (E(), h("div", yo, [
			r.value.description ? (E(), h("p", bo, P(r.value.description), 1)) : m("", !0),
			g("div", xo, [
				g("label", {
					class: "flow-field-label",
					for: G.id
				}, "ID", 8, So),
				V(g("input", {
					id: G.id,
					"onUpdate:modelValue": u[0] ||= (e) => s.value = e,
					class: S(["flow-field-input flow-field-input--mono", { "is-invalid": c.value }]),
					"aria-invalid": !!c.value,
					"aria-describedby": G.idNote,
					spellcheck: "false",
					autocomplete: "off",
					onInput: u[1] ||= (e) => c.value = "",
					onBlur: w,
					onKeydown: u[2] ||= H((...e) => I(X) && I(X)(...e), ["enter"])
				}, null, 42, Co), [[R, s.value]]),
				g("div", { id: G.idNote }, [c.value ? (E(), h("p", To, P(c.value), 1)) : m("", !0), g("p", Eo, " Downstream nodes reference " + P(O.value) + ". Renaming doesn't update that text inside other nodes' queries or code — you'll need to update those yourself. ", 1)], 8, wo)
			]),
			g("div", Do, [g("label", {
				class: "flow-field-label",
				for: G.label
			}, "Name", 8, Oo), V(g("input", {
				id: G.label,
				"onUpdate:modelValue": u[3] ||= (e) => l.value = e,
				class: "flow-field-input",
				placeholder: r.value.label,
				autocomplete: "off",
				onBlur: T,
				onKeydown: u[4] ||= H((...e) => I(X) && I(X)(...e), ["enter"])
			}, null, 40, ko), [[R, l.value]])]),
			(E(!0), h(d, null, A(o.value, (t, n) => (E(), p(vo, {
				key: t.key ?? `custom-${n}`,
				node: e.node,
				field: t
			}, null, 8, ["node", "field"]))), 128)),
			r.value.outputName ? (E(), h("div", Ao, [
				g("label", {
					class: "flow-field-label",
					for: G.output
				}, "Output Name", 8, jo),
				g("div", Mo, [g("span", No, P(e.node.id) + "_", 1), V(g("input", {
					id: G.output,
					"onUpdate:modelValue": u[5] ||= (e) => v.value = e,
					class: S(["flow-field-input flow-field-input--mono", { "is-invalid": b.value }]),
					placeholder: "data",
					spellcheck: "false",
					autocomplete: "off",
					"aria-invalid": !!b.value,
					"aria-describedby": G.outputNote,
					onInput: u[6] ||= (e) => b.value = "",
					onBlur: D,
					onKeydown: u[7] ||= H((...e) => I(X) && I(X)(...e), ["enter"])
				}, null, 42, Po), [[R, v.value]])]),
				b.value ? (E(), h("p", {
					key: 0,
					id: G.outputNote,
					class: "flow-field-error"
				}, P(b.value), 9, Fo)) : m("", !0)
			])) : m("", !0),
			r.value.runs ? (E(), h(d, { key: 2 }, [
				F.value ? (E(), h("p", {
					key: 0,
					class: S(["flow-field-note", { "is-warning": B.value }])
				}, [
					N.value.length ? (E(), h(d, { key: 0 }, [_(" Reads " + P(N.value.join(", ")) + " from the server, so it runs there: ", 1)], 64)) : (E(), h(d, { key: 1 }, [_("Runs on the server:")], 64)),
					_(" running this node sends its input data to the server" + P(I(ee).state === "connected" && I(ee).address ? ` at ${I(ee).address}` : "") + " to complete. ", 1),
					B.value ? (E(), h(d, { key: 2 }, [_("The server isn't available, so it can't run now.")], 64)) : m("", !0)
				], 2)) : m("", !0),
				g("label", Io, [u[10] ||= _(" Auto Run ", -1), g("input", {
					type: "checkbox",
					checked: j.value,
					onChange: M
				}, null, 40, Lo)]),
				g("div", Ro, [g("div", zo, [g("button", {
					type: "button",
					class: "flow-button flow-button--wide",
					"aria-disabled": !U.value,
					onClick: u[8] ||= (t) => U.value && I(n).runNode(e.node.id)
				}, P(a.value ? "Running…" : "Run"), 9, Bo), i.value && !a.value ? (E(), h("button", {
					key: 0,
					type: "button",
					class: "flow-button flow-button--quiet",
					title: "Back to not run: clears its status and output",
					onClick: u[9] ||= (t) => I(n).resetNode(e.node.id)
				}, " Reset ")) : m("", !0)]), g("p", Vo, P(te.value ?? ne.value), 1)])
			], 64)) : r.value.unknown ? (E(), h("p", Ho, " This node is a " + P(e.node.data.kind) + " node, which isn't available here: it was made in another app, or with a plugin this app doesn't install, or its kind comes from a server that isn't connected. It can't run or take new wires here, but it keeps its settings and wires, and saving the graph keeps it as it was. ", 1)) : (E(), h("p", Uo, "No editable properties yet for this node kind."))
		]));
	}
}, Go = {
	key: 1,
	class: "flow-panel-empty"
}, Ko = {
	__name: "ManagePanel",
	setup(e) {
		let t = y(u);
		return (e, n) => (E(), p(s, {
			class: "manage-panel",
			name: "manage",
			title: "Manage",
			dock: "right",
			hotkey: "M"
		}, {
			default: B(() => [I(t).selectedNode.value ? (E(), p(Wo, {
				key: 0,
				node: I(t).selectedNode.value
			}, null, 8, ["node"])) : (E(), h("p", Go, "Select a node to see its properties."))]),
			_: 1
		}));
	}
}, qo = {
	__name: "EditorPanels",
	setup(e) {
		return (e, t) => (E(), h(d, null, [
			v(ua),
			v(ha),
			v(ya),
			v(Wa),
			v(Ko)
		], 64));
	}
}, Jo = {
	__name: "ServerStatus",
	setup(e) {
		let t = y(u), n = t.server, r = f(() => n.value.state === "connected"), i = f(() => r.value && t.flow.nodes.value.some((e) => Gr(e.data)));
		return (e, t) => I(n).state === "checking" ? m("", !0) : (E(), h("div", {
			key: 0,
			class: S(["flow-server-status", r.value ? "flow-node--modify" : "flow-node--fetch"]),
			role: "status"
		}, [g("span", {
			class: S(["flow-blink-dot", { "is-steady": !i.value }]),
			"aria-hidden": "true"
		}, null, 2), r.value ? (E(), h(d, { key: 0 }, [_(" LIVE · connected to server" + P(I(n).address ? ` ${I(n).address}` : "") + P(I(n).local ? " · LOCAL" : "") + P(I(n).user?.email ? ` · ${I(n).user.email}` : ""), 1)], 64)) : (E(), h(d, { key: 1 }, [_("backend not available, client execution only")], 64))], 2));
	}
}, Yo = 400;
function Xo(e, t) {
	let n = null, r = null;
	function i() {
		n && (clearTimeout(n), n = null, t.save(e.snapshot.value));
	}
	function a() {
		clearTimeout(n), n = setTimeout(i, Yo);
	}
	let o = () => document.visibilityState === "hidden" && i();
	T(async () => {
		e.load(t ? await t.load() : null), t && (r = z(e.snapshot, a), window.addEventListener("pagehide", i), document.addEventListener("visibilitychange", o));
	}), w(() => {
		r?.(), window.removeEventListener("pagehide", i), document.removeEventListener("visibilitychange", o), t && i();
	});
}
//#endregion
//#region lib/themes.js
var Zo = [
	"FLOW",
	"FLOWDARK",
	"LUX",
	"LUXDARK"
], Qo = new Map(Zo.map((e) => [e, {
	name: e,
	base: null,
	tokens: {}
}])), $o = (e) => String(e).toUpperCase();
function es({ name: e, base: t = "FLOW", tokens: n = {} }) {
	if (!e) throw Error("A theme needs a name.");
	if (Zo.includes($o(e))) throw Error(`${$o(e)} is a built-in theme; give yours another name.`);
	if (!Qo.has($o(t))) throw Error(`Theme ${$o(e)} is based on ${$o(t)}, which isn't defined.`);
	Qo.set($o(e), {
		name: $o(e),
		base: $o(t),
		tokens: { ...n }
	});
}
var ts = (e) => Qo.has($o(e)), ns = () => [...Qo.keys()];
function rs(e) {
	let t = Qo.get($o(e)) ?? Qo.get("FLOW");
	if (!t.base) return {
		name: t.name,
		className: `flow-theme-${t.name.toLowerCase()}`,
		tokens: {}
	};
	let n = rs(t.base);
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
var is = { class: "flow-title flow-pan-trigger" }, as = { class: "flow-brand-text flow-title-text" }, os = {
	key: 0,
	class: "flow-breadcrumb",
	"aria-label": "Subnets open"
}, ss = {
	key: 0,
	"aria-hidden": "true"
}, cs = [
	"aria-current",
	"title",
	"onClick"
], ls = {
	key: 0,
	class: "flow-breadcrumb-shared"
}, us = {
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
			validator: ts
		},
		autoHideRails: {
			type: Boolean,
			default: !0
		},
		terminalCommands: {
			type: Object,
			default: null
		}
	},
	setup(t) {
		let n = t, r = f(() => rs(n.theme)), a = f(() => r.value.className), s = f(() => r.value.tokens), l = i({ autoHideRails: () => n.autoHideRails }), y = Un({
			sql: n.sql,
			files: n.storage,
			server: n.server
		});
		D(u, y), D(zi, n.terminalCommands), Xo(y, n.storage);
		async function b() {
			l.find("terminal")?.collapsed && l.setCollapsed("terminal", !1), await x(), M.value?.el?.querySelector(".flow-command-input")?.focus();
		}
		let { commands: w, canvasMenu: T, connectionMenu: O } = or(l, y), M = k(null), N = (e) => !!e.target.closest(".wm-content");
		function F(e) {
			if (!N(e)) {
				if ((e.key === "`" || e.key === "~") && n.terminalCommands && !o(e) && !e.ctrlKey && !e.metaKey && !e.altKey) {
					e.preventDefault(), b();
					return;
				}
				y.onKeydown(e);
			}
		}
		function L(e) {
			M.value.open(e.point, {
				items: O,
				context: e
			});
		}
		return D(nr, (e, t) => M.value.open(e, t)), (n, r) => (E(), p(c, {
			ref_key: "host",
			ref: M,
			class: S(["flow-editor", a.value]),
			layout: I(l),
			commands: I(w),
			role: "application",
			"aria-label": t.title,
			style: C(s.value),
			onKeydown: F
		}, {
			title: B(() => [g("span", is, [g("span", as, P(t.title), 1)]), I(y).levels.value.length > 1 ? (E(), h("nav", os, [(E(!0), h(d, null, A(I(y).levels.value, (e) => (E(), h(d, { key: e.depth }, [e.depth ? (E(), h("span", ss, "›")) : m("", !0), g("button", {
				type: "button",
				class: "flow-breadcrumb-level",
				"aria-current": e.depth === I(y).levels.value.length - 1 ? "page" : void 0,
				title: e.depth === I(y).levels.value.length - 1 ? void 0 : "Back up to here (Escape: one level up)",
				onClick: (t) => I(y).closeSubnet(e.depth)
			}, [_(P(e.label ?? "Graph"), 1), e.shared ? (E(), h("span", ls, " (" + P(e.shared) + ")", 1)) : m("", !0)], 8, cs)], 64))), 128))])) : m("", !0)]),
			panels: B(() => [j(n.$slots, "panels", {}, () => [v(qo)]), v(Jo)]),
			default: B(() => [V(v(Li, { onConnectionDropped: L }, null, 512), [[I(e), I(T)]])]),
			_: 3
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
export { Wa as DataPanel, qo as EditorPanels, u as FLOW_GRAPH, s as FlowPanel, us as FlowgraphEditor, ya as FlowgraphsPanel, ha as LibraryPanel, Bi as MASK, Ko as ManagePanel, _r as NODE_CATEGORIES, Z as NODE_KINDS, t as PANEL_LAYOUT, r as PANEL_MENU, c as PanelHost, ua as TerminalPanel, Vi as createCommandRegistry, i as createPanelLayout, Cr as defineNodeCategory, Q as defineNodeKind, es as defineTheme, ts as hasTheme, Yi as listing, a as panelCommands, n as panelsSubmenu, Hi as parseCommand, rs as resolveTheme, ns as themeNames };
