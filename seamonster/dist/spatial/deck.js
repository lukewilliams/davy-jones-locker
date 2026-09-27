import { a as e, i as t, n, o as r, r as i } from "../geo-C3UIA9ug.js";
import { computed as a, createCommentVNode as o, createElementBlock as s, createElementVNode as c, onBeforeUnmount as l, onMounted as u, openBlock as d, ref as f, toDisplayString as p, watch as m } from "vue";
import { Deck as h, WebMercatorViewport as g } from "@deck.gl/core";
import { BitmapLayer as _, GeoJsonLayer as v } from "@deck.gl/layers";
import { TileLayer as y } from "@deck.gl/geo-layers";
//#region widgets/spatial/components/DeckMap.vue
var b = {
	key: 0,
	class: "wsp-attribution"
}, x = {
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
		}
	},
	emits: [
		"error",
		"ready",
		"feature-click"
	],
	setup(x, { expose: S, emit: C }) {
		let w = x, T = C, E = f(null), D = f(null), O = null, k = !1, A = r(() => w.layers, (e, t) => T("error", e, t));
		function j() {
			return new y({
				id: "wsp-basemap",
				data: w.basemap.url,
				minZoom: 0,
				maxZoom: w.basemap.maxZoom ?? 19,
				tileSize: 256,
				renderSubLayers: (e) => {
					let { boundingBox: t } = e.tile;
					return new _(e, {
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
			return A.value.map(({ layer: n, data: r }) => {
				let i = e(n.style);
				return new v({
					id: `wsp-${n.id}`,
					data: r,
					pickable: !0,
					stroked: !0,
					filled: !0,
					getFillColor: t(i.fillColor, i.fillOpacity),
					getLineColor: t(i.color, i.opacity),
					getLineWidth: i.weight,
					lineWidthUnits: "pixels",
					getPointRadius: i.radius,
					pointRadiusUnits: "pixels",
					onClick: (e) => T("feature-click", {
						layer: n,
						feature: e.object
					})
				});
			});
		}
		let N = a(() => [j(), ...M()]);
		function P() {
			let e = n(A.value.map((e) => i(e.data))), t = E.value?.clientWidth, r = E.value?.clientHeight;
			if (!O || !e || !t || !r) return;
			let { longitude: a, latitude: o, zoom: s } = new g({
				width: t,
				height: r
			}).fitBounds(e, { padding: 24 });
			O.setProps({ initialViewState: {
				longitude: a,
				latitude: o,
				zoom: s
			} }), k = !0;
		}
		return u(() => {
			O = new h({
				canvas: D.value,
				initialViewState: {
					longitude: w.center[0],
					latitude: w.center[1],
					zoom: w.zoom
				},
				controller: !0,
				layers: N.value
			}), w.autoFit && P(), T("ready", O);
		}), m(N, (e) => {
			O?.setProps({ layers: e }), w.autoFit && !k && P();
		}), l(() => {
			O?.finalize(), O = null;
		}), S({
			fit: P,
			getDeck: () => O
		}), (e, t) => (d(), s("div", {
			ref_key: "container",
			ref: E,
			class: "wsp-map"
		}, [c("canvas", {
			ref_key: "canvas",
			ref: D,
			class: "wsp-canvas"
		}, null, 512), x.basemap.attribution ? (d(), s("div", b, p(x.basemap.attribution), 1)) : o("", !0)], 512));
	}
};
//#endregion
export { x as DeckMap };
