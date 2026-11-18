import { Fragment as e, createCommentVNode as t, createElementBlock as n, createElementVNode as r, createTextVNode as i, normalizeClass as a, openBlock as o, renderList as s, renderSlot as c, toDisplayString as l } from "vue";
//#region widgets/sheet/adapters/fromLongRows.js
var u = {
	rowKey: "row_index",
	columnKey: "col_index",
	columnLabel: "col_label",
	value: "value"
}, d = (e) => typeof e == "number" || typeof e == "bigint";
function f(e, t) {
	return d(e) && d(t) ? e < t ? -1 : +(e > t) : String(e).localeCompare(String(t));
}
function p(e, t = {}) {
	let { meta: n = [], ...r } = t, i = {
		...u,
		...r
	}, a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = t[i.columnKey], r = t[i.rowKey];
		if (a.set(e, t[i.columnLabel]), o.has(r) || o.set(r, {}), o.get(r)[e] = t[i.value], n.length === 0) continue;
		let c = {};
		for (let e of n) {
			let n = t[e];
			n != null && n !== "" && (c[e] = n);
		}
		Object.keys(c).length !== 0 && (s.has(r) || s.set(r, {}), s.get(r)[e] = c);
	}
	return {
		columns: [...a].sort((e, t) => f(e[0], t[0])).map(([e, t]) => ({
			key: e,
			label: t
		})),
		rows: [...o].sort((e, t) => f(e[0], t[0])).map(([e, t]) => ({
			key: e,
			cells: t,
			meta: s.get(e) ?? {}
		}))
	};
}
//#endregion
//#region widgets/sheet/components/SheetTable.vue
var m = { class: "ws-scroll" }, h = { class: "ws-sheet" }, g = {
	key: 0,
	class: "ws-corner"
}, _ = {
	key: 0,
	class: "ws-row-header"
}, v = ["title"], y = {
	__name: "SheetTable",
	props: {
		columns: {
			type: Array,
			required: !0
		},
		rows: {
			type: Array,
			required: !0
		},
		rowHeaders: {
			type: Boolean,
			default: !0
		}
	},
	setup(u) {
		let d = (e, t) => e.meta?.[t.key] ?? {}, f = (e) => e ? `ws-tone-${e}` : null;
		return (p, y) => (o(), n("div", m, [r("table", h, [r("thead", null, [r("tr", null, [u.rowHeaders ? (o(), n("th", g)) : t("", !0), (o(!0), n(e, null, s(u.columns, (e) => (o(), n("th", { key: e.key }, l(e.label), 1))), 128))])]), r("tbody", null, [(o(!0), n(e, null, s(u.rows, (r) => (o(), n("tr", { key: r.key }, [u.rowHeaders ? (o(), n("th", _, l(r.header ?? r.key), 1)) : t("", !0), (o(!0), n(e, null, s(u.columns, (e) => (o(), n("td", {
			key: e.key,
			title: d(r, e).tooltip,
			class: a(f(d(r, e).tone))
		}, [c(p.$slots, "cell", {
			row: r,
			column: e,
			value: r.cells[e.key],
			meta: d(r, e)
		}, () => [i(l(r.cells[e.key]), 1)])], 10, v))), 128))]))), 128))])])]));
	}
};
//#endregion
export { y as SheetTable, p as fromLongRows };
