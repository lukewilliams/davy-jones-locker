import { a as e, n as t, o as n, r } from "../geo-C3UIA9ug.js";
import { createElementBlock as i, onBeforeUnmount as a, onMounted as o, openBlock as s, ref as c, watch as l } from "vue";
import u from "leaflet";
//#region widgets/spatial/components/LeafletMap.vue
var d = {
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
		}
	},
	emits: [
		"error",
		"ready",
		"feature-click"
	],
	setup(d, { expose: f, emit: p }) {
		let m = d, h = p, g = c(null), _ = null, v = /* @__PURE__ */ new Map(), y = !1, b = n(() => m.layers, (e, t) => h("error", e, t));
		function x(t) {
			let n = e(t);
			return {
				color: n.color,
				weight: n.weight,
				opacity: n.opacity,
				fillColor: n.fillColor,
				fillOpacity: n.fillOpacity
			};
		}
		function S({ layer: t, data: n }) {
			let r = x(t.style);
			return u.geoJSON(n, {
				style: r,
				pointToLayer: (n, i) => u.circleMarker(i, {
					...r,
					radius: e(t.style).radius
				}),
				onEachFeature: (e, n) => {
					n.on("click", () => h("feature-click", {
						layer: t,
						feature: e
					}));
				}
			});
		}
		function C() {
			if (!_) return;
			let e = new Map(b.value.map((e) => [e.layer.id, e]));
			for (let [t, n] of v) e.has(t) || (n.remove(), v.delete(t));
			for (let [t, n] of e) {
				v.get(t)?.remove();
				let e = S(n);
				e.addTo(_), v.set(t, e);
			}
			m.autoFit && !y && w();
		}
		function w() {
			let e = t(b.value.map((e) => r(e.data)));
			if (!_ || !e) return;
			let [[n, i], [a, o]] = e;
			_.fitBounds([[i, n], [o, a]], { padding: [24, 24] }), y = !0;
		}
		return o(() => {
			_ = u.map(g.value, { preferCanvas: !0 }).setView([m.center[1], m.center[0]], m.zoom), u.tileLayer(m.basemap.url, {
				attribution: m.basemap.attribution,
				maxZoom: m.basemap.maxZoom ?? 19
			}).addTo(_), C(), h("ready", _);
		}), l(b, C), a(() => {
			_?.remove(), _ = null, v.clear();
		}), f({
			fit: w,
			getMap: () => _
		}), (e, t) => (s(), i("div", {
			ref_key: "container",
			ref: g,
			class: "wsp-map"
		}, null, 512));
	}
};
//#endregion
export { d as LeafletMap };
