//#region widgets/spatial/adapters/fromRows.js
var e = {
	id: "layer_id",
	label: "label",
	format: "format",
	url: "url",
	data: "data",
	style: "style",
	visible: "visible"
};
function t(t, r = {}) {
	let { baseUrl: i = "", style: a = null, ...o } = r, s = {
		...e,
		...o
	};
	return t.map((e) => {
		let t = e[s.url], r = e[s.data];
		return {
			id: e[s.id],
			label: e[s.label] ?? e[s.id],
			format: e[s.format] || "geojson",
			url: t ? /^[a-z]+:\/\//i.test(t) ? t : i + t : null,
			data: r === "" ? null : r ?? null,
			style: n(a, e[s.style]),
			visible: e[s.visible] !== !1
		};
	});
}
function n(e, t) {
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
export { t };
