import { shallowRef as e, watch as t } from "vue";
//#region widgets/spatial/formats.js
var n = /* @__PURE__ */ new Map();
function r(e, t) {
	n.set(e, t);
}
function i(e) {
	let t = n.get(e);
	if (!t) throw Error(`Unknown spatial format "${e}" (known: ${[...n.keys()].join(", ")})`);
	return t;
}
async function a(e) {
	let t = await fetch(e);
	if (!t.ok) throw Error(`Failed to fetch ${e}: ${t.status}`);
	return t;
}
function o(e) {
	if (Array.isArray(e)) return {
		type: "FeatureCollection",
		features: e.flatMap((e) => o(e).features)
	};
	if (e?.type === "FeatureCollection") return e;
	if (e?.type === "Feature") return {
		type: "FeatureCollection",
		features: [e]
	};
	if (e?.type) return {
		type: "FeatureCollection",
		features: [{
			type: "Feature",
			geometry: e,
			properties: {}
		}]
	};
	throw Error("Not usable as GeoJSON");
}
r("geojson", {
	parse: (e) => o(typeof e == "string" ? JSON.parse(e) : e),
	load: async (e) => o(await (await a(e)).json())
}), r("shapefile", { load: async (e) => {
	let t = (await import("shpjs")).default;
	return o(await t(await (await a(e)).arrayBuffer()));
} });
async function s(e) {
	let t = e.format ?? "geojson", n = i(t);
	if (e.data != null && e.data !== "") {
		if (!n.parse) throw Error(`Format "${t}" cannot take inline data; use a url`);
		return n.parse(e.data);
	}
	if (!e.url) throw Error(`Layer "${e.id}" has neither \`data\` nor \`url\``);
	if (!n.load) throw Error(`Format "${t}" cannot load from a url; use inline data`);
	return n.load(e.url);
}
//#endregion
//#region widgets/spatial/useSpatialData.js
var c = (e) => e.url ? `${e.format ?? "geojson"}|${e.url}` : null;
function l(n, r) {
	let i = e([]), a = /* @__PURE__ */ new Map(), o = 0;
	return t(n, async (e) => {
		let t = ++o, n = (e ?? []).filter((e) => e.visible !== !1), l = await Promise.all(n.map(async (e) => {
			let t = c(e), n = t ? a.get(t) : null;
			n || (n = s(e), t && a.set(t, n));
			try {
				return {
					layer: e,
					data: await n
				};
			} catch (n) {
				return t && a.delete(t), r?.(n, e), null;
			}
		}));
		t === o && (i.value = l.filter(Boolean));
	}, {
		immediate: !0,
		deep: !1
	}), i;
}
//#endregion
//#region widgets/spatial/geo.js
function u(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity, a = (e) => {
		if (Array.isArray(e)) {
			if (typeof e[0] == "number") {
				let [a, o] = e;
				if (!Number.isFinite(a) || !Number.isFinite(o)) return;
				a < t && (t = a), o < n && (n = o), a > r && (r = a), o > i && (i = o);
				return;
			}
			for (let t of e) a(t);
		}
	}, o = (e) => {
		e && (e.type === "FeatureCollection" ? e.features?.forEach(o) : e.type === "Feature" ? o(e.geometry) : e.type === "GeometryCollection" ? e.geometries?.forEach(o) : e.coordinates && a(e.coordinates));
	};
	return o(e), t === Infinity ? null : [[t, n], [r, i]];
}
function d(e) {
	let t = e.filter(Boolean);
	return t.length === 0 ? null : [[Math.min(...t.map((e) => e[0][0])), Math.min(...t.map((e) => e[0][1]))], [Math.max(...t.map((e) => e[1][0])), Math.max(...t.map((e) => e[1][1]))]];
}
function f(e, t = 1) {
	let n = Math.round(Math.min(Math.max(t, 0), 1) * 255), r = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(e ?? "").trim());
	if (!r) return [
		128,
		128,
		128,
		n
	];
	let i = r[1];
	return i.length === 3 && (i = [...i].map((e) => e + e).join("")), [
		parseInt(i.slice(0, 2), 16),
		parseInt(i.slice(2, 4), 16),
		parseInt(i.slice(4, 6), 16),
		n
	];
}
var p = {
	color: "#3388ff",
	fillColor: null,
	weight: 2,
	opacity: 1,
	fillOpacity: .2,
	radius: 5
};
function m(e) {
	let t = {
		...p,
		...e ?? {}
	};
	return {
		...t,
		fillColor: t.fillColor ?? t.color
	};
}
//#endregion
export { m as a, i as c, f as i, s as l, d as n, l as o, u as r, r as s, p as t };
