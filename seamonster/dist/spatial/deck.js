import { a as e, i as t, n, o as r, r as i, s as a } from "../geo-D29OdxI_.js";
import { computed as o, createCommentVNode as s, createElementBlock as c, createElementVNode as l, onBeforeUnmount as u, onMounted as d, openBlock as f, ref as p, toDisplayString as m, watch as h } from "vue";
import { Deck as g, WebMercatorViewport as _ } from "@deck.gl/core";
import { BitmapLayer as v, GeoJsonLayer as y } from "@deck.gl/layers";
import { TileLayer as b } from "@deck.gl/geo-layers";
//#region widgets/spatial/components/DeckMap.vue
var x = {
	key: 0,
	class: "wsp-attribution"
}, S = {
	__name: "DeckMap",
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
			default: () => n
		}
	},
	emits: [
		"error",
		"ready",
		"feature-click"
	],
	setup(n, { expose: S, emit: C }) {
		let w = n, T = C, E = p(null), D = p(null), O = null, k = !1, A = a(() => w.layers, (e, t) => T("error", e, t));
		function j() {
			return new b({
				id: "wsp-basemap",
				data: w.basemap.url,
				minZoom: 0,
				maxZoom: w.basemap.maxZoom ?? 19,
				tileSize: 256,
				renderSubLayers: (e) => {
					let { boundingBox: t } = e.tile;
					return new v(e, {
						data: null,
						image: e.data,
						bounds: [
							t[0][0],
							t[0][1],
							t[1][0],
							t[1][1]
						]
					});
				}
			});
		}
		function M() {
			let t = r(w.selectedStyle);
			return A.value.map(({ layer: n, data: i }) => {
				let a = r(n.style), o = w.selected.filter((e) => e.layer === n.id), s = (e) => o.some((t) => t.feature === null || t.feature === void 0 || t.feature === e.id), c = (e, t) => o.length ? (n) => s(n) ? t : e : e;
				return new y({
					id: `wsp-${n.id}`,
					data: i,
					pickable: !0,
					stroked: !0,
					filled: !0,
					getFillColor: c(e(a.fillColor, a.fillOpacity), e(t.fillColor, t.fillOpacity)),
					getLineColor: c(e(a.color, a.opacity), e(t.color, t.opacity)),
					getLineWidth: c(a.weight, t.weight),
					lineWidthUnits: "pixels",
					getPointRadius: a.radius,
					pointRadiusUnits: "pixels",
					updateTriggers: {
						getFillColor: JSON.stringify(o),
						getLineColor: JSON.stringify(o),
						getLineWidth: JSON.stringify(o)
					},
					onClick: (e) => T("feature-click", {
						layer: n,
						feature: e.object
					})
				});
			});
		}
		let N = o(() => [j(), ...M()]);
		function P() {
			let e = i(A.value.map((e) => t(e.data))), n = E.value?.clientWidth, r = E.value?.clientHeight;
			if (!O || !e || !n || !r) return;
			let { longitude: a, latitude: o, zoom: s } = new _({
				width: n,
				height: r
			}).fitBounds(e, { padding: 24 });
			O.setProps({ initialViewState: {
				longitude: a,
				latitude: o,
				zoom: s
			} }), k = !0;
		}
		return d(() => {
			O = new g({
				canvas: D.value,
				initialViewState: {
					longitude: w.center[0],
					latitude: w.center[1],
					zoom: w.zoom
				},
				controller: !0,
				layers: N.value
			}), w.autoFit && P(), T("ready", O);
		}), h(N, (e) => {
			O?.setProps({ layers: e }), w.autoFit && !k && P();
		}), u(() => {
			O?.finalize(), O = null;
		}), S({
			fit: P,
			getDeck: () => O
		}), (e, t) => (f(), c("div", {
			ref_key: "container",
			ref: E,
			class: "wsp-map"
		}, [l("canvas", {
			ref_key: "canvas",
			ref: D,
			class: "wsp-canvas"
		}, null, 512), n.basemap.attribution ? (f(), c("div", x, m(n.basemap.attribution), 1)) : s("", !0)], 512));
	}
};
//#endregion
export { S as DeckMap };
