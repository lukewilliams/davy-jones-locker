import { t as e } from "../FlowPanel-KJLZgxLn.js";
import { n as t, r as n, t as r } from "../flowGraphKey-DXKsZ2fk.js";
import { t as i } from "../fromRows-BC0Yx6k4.js";
import { i as a, n as o, o as s, r as c, s as l } from "../geo-D29OdxI_.js";
import { Fragment as u, computed as d, createBlock as f, createCommentVNode as p, createElementBlock as m, createElementVNode as h, createTextVNode as g, createVNode as _, inject as v, normalizeStyle as y, onBeforeUnmount as b, onMounted as x, openBlock as S, ref as C, renderList as w, toDisplayString as T, unref as E, useAttrs as D, watch as O, withCtx as k } from "vue";
import A from "leaflet";
//#region widgets/spatial/components/LeafletMap.vue
var j = {
	__name: "LeafletMap",
	props: {
		layers: {
			type: Array,
			default: () => []
		},
		center: {
			type: Array,
			default: () => [0, 0]
		},
		zoom: {
			type: Number,
			default: 2
		},
		basemap: {
			type: Object,
			default: () => ({
				url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
				attribution: "© OpenStreetMap contributors",
				maxZoom: 19
			})
		},
		autoFit: {
			type: Boolean,
			default: !0
		},
		selected: {
			type: Array,
			default: () => []
		},
		selectedStyle: {
			type: Object,
			default: () => o
		}
	},
	emits: [
		"error",
		"ready",
		"feature-click"
	],
	setup(e, { expose: t, emit: n }) {
		let r = e, i = n, o = C(null), u = null, d = null, f = /* @__PURE__ */ new Map(), p = !1, h = l(() => r.layers, (e, t) => i("error", e, t));
		function g(e) {
			let t = s(e);
			return {
				color: t.color,
				weight: t.weight,
				opacity: t.opacity,
				fillColor: t.fillColor,
				fillOpacity: t.fillOpacity
			};
		}
		function _({ layer: e, data: t }) {
			let n = g(e.style);
			return A.geoJSON(t, {
				style: n,
				pointToLayer: (t, r) => A.circleMarker(r, {
					...n,
					radius: s(e.style).radius
				}),
				onEachFeature: (t, n) => {
					n.on("click", () => i("feature-click", {
						layer: e,
						feature: t
					}));
				}
			});
		}
		function v() {
			if (!u) return;
			let e = new Map(h.value.map((e) => [e.layer.id, e]));
			for (let [t, n] of f) e.has(t) || (n.remove(), f.delete(t));
			for (let [t, n] of e) {
				f.get(t)?.remove();
				let e = _(n);
				e.addTo(u), f.set(t, e);
			}
			w(), r.autoFit && !p && T();
		}
		let y = [];
		function w({ pan: e = !1 } = {}) {
			for (let { overlay: e, featureLayer: t } of y) e.resetStyle(t);
			y = [];
			let t = g(r.selectedStyle);
			for (let { layer: e, feature: n } of r.selected) {
				let r = f.get(e);
				r?.eachLayer((e) => {
					(n == null || e.feature?.id === n) && (e.setStyle(t), e.bringToFront(), y.push({
						overlay: r,
						featureLayer: e
					}));
				});
			}
			if (!e || !u || !y.length) return;
			let n = A.latLngBounds([]);
			for (let { featureLayer: e } of y) n.extend(e.getBounds?.() ?? e.getLatLng());
			n.isValid() && !u.getBounds().intersects(n) && u.panTo(n.getCenter());
		}
		function T() {
			let e = c(h.value.map((e) => a(e.data)));
			if (!u || !e) return;
			let [[t, n], [r, i]] = e;
			u.fitBounds([[n, t], [i, r]], { padding: [24, 24] }), p = !0;
		}
		return x(() => {
			u = A.map(o.value, { preferCanvas: !0 }).setView([r.center[1], r.center[0]], r.zoom), A.tileLayer(r.basemap.url, {
				attribution: r.basemap.attribution,
				maxZoom: r.basemap.maxZoom ?? 19
			}).addTo(u), v(), d = new ResizeObserver(() => u?.invalidateSize()), d.observe(o.value), i("ready", u);
		}), O(h, v), O(() => r.selected, () => w({ pan: !0 })), b(() => {
			d?.disconnect(), u?.remove(), u = null, f.clear();
		}), t({
			fit: T,
			getMap: () => u
		}), (e, t) => (S(), m("div", {
			ref_key: "container",
			ref: o,
			class: "wsp-map"
		}, null, 512));
	}
}, M = /* @__PURE__ */ new Set(["EPSG:4326", "OGC:CRS84"]), N = (e) => `"${String(e).replace(/"/g, "\"\"")}"`, P = (e) => typeof e == "bigint" ? Number(e) : e, F = (e) => e.has("layer_id") && (e.has("data") || e.has("url"));
async function I({ table: e, columns: t, query: n }, { limit: r }) {
	if (F(new Set(t.map((e) => e.name)))) {
		let { columns: t, rows: r } = await n(`SELECT * FROM ${e} LIMIT 201`);
		return {
			rows: r.slice(0, 200).map((e) => Object.fromEntries(t.map((t, n) => [t, P(e[n])]))),
			more: r.length > 200
		};
	}
	let i = t.filter((e) => e.crs !== void 0);
	if (!i.length) return null;
	let a = Number((await n(`SELECT count(*) FROM ${e}`)).rows[0][0]), o = [];
	for (let t of i) o.push({
		name: t.name,
		crs: t.crs,
		rows: a,
		...await L(t, e, n, r)
	});
	return { columns: o };
}
async function L(e, t, n, r) {
	if (e.crs === null) return { error: `${e.name} has no CRS (CRS unknown), so it can't be placed on the map. Give it one in SQL with ST_SetCRS.` };
	let i = N(e.name), a = M.has(e.crs) ? i : `ST_Transform(${i}, 'EPSG:4326')`, o;
	try {
		o = (await n(`SELECT ST_AsGeoJSON(${a}) FROM ${t} LIMIT ${r}`)).rows;
	} catch (t) {
		return { error: `${e.name} couldn't be put in longitude and latitude for the map. ${t?.message ?? t}` };
	}
	let s = [];
	return o.forEach(([e], t) => {
		e != null && s.push({
			type: "Feature",
			id: t,
			geometry: typeof e == "string" ? JSON.parse(e) : e,
			properties: {}
		});
	}), {
		collection: {
			type: "FeatureCollection",
			features: s
		},
		drawn: s.length
	};
}
//#endregion
//#region widgets/spatial/components/MapPanel.vue
var R = { class: "flow-map" }, z = { class: "flow-map-bar" }, B = [
	"aria-disabled",
	"aria-pressed",
	"title"
], ee = ["title", "onClick"], te = ["aria-label", "onClick"], V = ["aria-disabled"], H = {
	key: 0,
	class: "flow-map-notes"
}, U = { class: "flow-map-view" }, W = "#2563eb", G = {
	__name: "MapPanel",
	props: {
		basemap: {
			type: Object,
			default: void 0
		},
		featureLimit: {
			type: Number,
			default: 1e4
		}
	},
	setup(a) {
		let o = a, s = D().name ?? "map", c = v(r), l = c.addOutputReader(s, (e) => I(e, { limit: o.featureLimit }));
		b(l);
		let x = [
			"#f97316",
			"#a855f7",
			"#16a34a",
			"#db2777",
			"#0891b2",
			"#b45309"
		], O = (e) => [e.id, e.data.outputSuffix ?? null], A = ([e, t]) => ({
			id: e,
			suffix: t
		}), M = d(() => JSON.stringify(c.flow.nodes.value.filter((e) => e.data.panels?.[s]?.pinned).map(O))), N = d(() => JSON.stringify(c.selectedNode.value ? O(c.selectedNode.value) : null)), P = d(() => JSON.parse(M.value).map(A)), F = d(() => {
			let e = JSON.parse(N.value);
			return e && A(e);
		}), L = d(() => !!F.value && P.value.some((e) => e.id === F.value.id)), G = (e) => x[e % x.length];
		function K(e, t) {
			c.setPanelData(e, s, t ? { pinned: !0 } : null);
		}
		function q(e, t, n) {
			let r = `${e.id}_${t ?? (e.suffix || "data")}`;
			return n === null ? r : `${r}.${n}`;
		}
		function J(e, t) {
			let r = {
				layers: [],
				sources: /* @__PURE__ */ new Map(),
				notes: []
			}, a = e.id, l = c.run.results[a];
			if (!l) return r.notes.push(`Run ${a} to draw it here.`), r;
			if (l.error) return r.notes.push(`${a} failed, so there's nothing to draw: see the Terminal.`), r;
			let u = n(l);
			if (!u.length) return r.notes.push(`${a}'s output isn't a table, so there's nothing to draw.`), r;
			let d = !1, f = !1;
			for (let n of u) {
				if (!n.extras || !(s in n.extras)) {
					d = !0;
					continue;
				}
				let c = n.extras[s];
				if (!c) continue;
				f = !0;
				let l = q(e, n.slot, n.table), u = JSON.stringify([
					a,
					n.slot,
					n.table
				]);
				c.error && r.notes.push(`${l}: ${c.error}`), c.rows && (i(c.rows, { style: { color: t } }).forEach((e, t) => {
					let i = `${u}|row ${t}`;
					r.layers.push({
						...e,
						id: i
					}), r.sources.set(i, {
						id: a,
						slot: n.slot,
						table: n.table,
						row: t
					});
				}), c.more && r.notes.push(`${l} has more layers than the map draws: it draws the first ${c.rows.length}.`));
				for (let e of c.columns ?? []) {
					if (e.error) {
						r.notes.push(`${l}: ${e.error}`);
						continue;
					}
					let i = `${u}|${e.name}`;
					r.layers.push({
						id: i,
						label: `${l}.${e.name}`,
						format: "geojson",
						data: e.collection,
						style: { color: t }
					}), r.sources.set(i, {
						id: a,
						slot: n.slot,
						table: n.table,
						row: null
					}), e.rows > o.featureLimit && r.notes.push(`${l}.${e.name}: drawing its first ${o.featureLimit.toLocaleString()} of ${e.rows.toLocaleString()} rows.`);
				}
			}
			return d ? r.notes.push(`Run ${a} again to draw it here: it ran before the map was there.`) : f || r.notes.push(`${a}'s output has no geometry to draw.`), r;
		}
		let Y = d(() => {
			let e = P.value.map((e, t) => ({
				node: e,
				...J(e, G(t))
			}));
			return F.value && !L.value && e.push({
				node: F.value,
				...J(F.value, W)
			}), {
				layers: e.flatMap((e) => e.layers),
				sources: new Map(e.flatMap((e) => [...e.sources])),
				notes: e.flatMap((e) => e.notes)
			};
		}), X = d(() => !F.value && !P.value.length ? ["Select a node whose output has geometry, or pin one, to draw it here."] : Y.value.notes), Z = d(() => {
			let { node: e, slot: n, row: r } = c.dataView;
			if (e === null || r === null) return [];
			let i = t(c.run.results[e], n, c.dataView.table)?.table ?? null, a = [];
			for (let [t, o] of Y.value.sources) o.id === e && o.slot === n && o.table === i && (o.row === null ? a.push({
				layer: t,
				feature: r
			}) : o.row === r && a.push({
				layer: t,
				feature: null
			}));
			return a;
		});
		function ne({ layer: e, feature: t }) {
			let n = Y.value.sources.get(e.id);
			n && c.showRow({
				id: n.id,
				slot: n.slot,
				table: n.table,
				row: n.row ?? t.id
			});
		}
		let Q = C(null), $ = C(null);
		function re(e) {
			e.on("moveend", () => {
				if (!Y.value.layers.length && !$.value) return;
				let t = e.getCenter();
				$.value = {
					center: [t.lng, t.lat],
					zoom: e.getZoom()
				};
			});
		}
		return (t, n) => (S(), f(e, {
			class: "flow-map-panel",
			name: "map",
			title: "Map",
			dock: "right",
			hotkey: "P",
			defaultSize: 360,
			minWidth: 240,
			collapsed: ""
		}, {
			default: k(() => [h("div", R, [
				h("div", z, [
					h("button", {
						type: "button",
						class: "flow-button flow-button--quiet",
						"aria-disabled": !F.value,
						"aria-pressed": L.value,
						title: F.value ? `Keep ${F.value.id} on the map while other nodes are selected` : "Select a node to pin it",
						onClick: n[0] ||= (e) => F.value && K(F.value.id, !L.value)
					}, T(L.value ? "Unpin" : "Pin"), 9, B),
					(S(!0), m(u, null, w(P.value, (e, t) => (S(), m("span", {
						key: e.id,
						class: "flow-map-pin"
					}, [h("button", {
						type: "button",
						class: "flow-map-pin-name",
						title: `Select ${e.id}`,
						onClick: (t) => E(c).select(e.id)
					}, [h("span", {
						class: "flow-map-swatch",
						style: y({ background: G(t) })
					}, null, 4), g(T(e.id), 1)], 8, ee), h("button", {
						type: "button",
						class: "flow-map-pin-remove",
						"aria-label": `Unpin ${e.id}`,
						onClick: (t) => K(e.id, !1)
					}, "×", 8, te)]))), 128)),
					h("button", {
						type: "button",
						class: "flow-button flow-button--quiet flow-map-fit",
						"aria-disabled": !Y.value.layers.length,
						title: "Fit the map to what's drawn",
						onClick: n[1] ||= (e) => Y.value.layers.length && Q.value?.fit()
					}, " Fit ", 8, V)
				]),
				X.value.length ? (S(), m("ul", H, [(S(!0), m(u, null, w(X.value, (e) => (S(), m("li", { key: e }, T(e), 1))), 128))])) : p("", !0),
				h("div", U, [_(j, {
					ref_key: "map",
					ref: Q,
					layers: Y.value.layers,
					selected: Z.value,
					basemap: a.basemap,
					center: $.value?.center ?? [0, 0],
					zoom: $.value?.zoom ?? 2,
					"auto-fit": !$.value,
					onReady: re,
					onFeatureClick: ne
				}, null, 8, [
					"layers",
					"selected",
					"basemap",
					"center",
					"zoom",
					"auto-fit"
				])])
			])]),
			_: 1
		}));
	}
};
//#endregion
export { j as LeafletMap, G as MapPanel };
