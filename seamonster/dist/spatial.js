import { a as e, c as t, i as n, l as r, n as i, o as a, r as o, s, t as c } from "./geo-C3UIA9ug.js";
//#region widgets/spatial/adapters/fromRows.js
var l = {
	id: "layer_id",
	label: "label",
	format: "format",
	url: "url",
	data: "data",
	style: "style",
	visible: "visible"
};
function u(e, t = {}) {
	let { baseUrl: n = "", style: r = null, ...i } = t, a = {
		...l,
		...i
	};
	return e.map((e) => {
		let t = e[a.url], i = e[a.data];
		return {
			id: e[a.id],
			label: e[a.label] ?? e[a.id],
			format: e[a.format] || "geojson",
			url: t ? /^[a-z]+:\/\//i.test(t) ? t : n + t : null,
			data: i === "" ? null : i ?? null,
			style: d(r, e[a.style]),
			visible: e[a.visible] !== !1
		};
	});
}
function d(e, t) {
	let n = t;
	if (typeof n == "string") {
		if (n.trim() === "") n = null;
		else try {
			n = JSON.parse(n);
		} catch {
			n = null;
		}
	}
	return !e && !n ? null : {
		...e ?? {},
		...n ?? {}
	};
}
//#endregion
export { c as DEFAULT_STYLE, i as combineBounds, s as defineSpatialFormat, o as featureBounds, u as fromRows, t as getSpatialFormat, n as hexToRgba, r as loadLayerData, e as resolveStyle, a as useSpatialData };
