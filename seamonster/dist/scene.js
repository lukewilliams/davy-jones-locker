import { Fragment as e, computed as t, createBlock as n, createCommentVNode as r, createElementBlock as i, createElementVNode as a, createVNode as o, onBeforeUnmount as s, onMounted as c, openBlock as l, ref as u, renderList as d, renderSlot as f, resolveComponent as p, shallowRef as m, toRef as h, unref as g, watch as _, withCtx as v } from "vue";
import { TresCanvas as y, useTresContext as b } from "@tresjs/core";
import { OrbitControls as x, useGLTF as S } from "@tresjs/cientos";
import { Box3 as C, Sphere as w, Vector3 as T } from "three";
//#region widgets/scene/adapters/fromRows.js
var E = {
	id: "model_id",
	url: "url",
	position: "position",
	scale: "scale"
};
function D(e, t = {}) {
	let { baseUrl: n = "", ...r } = t, i = {
		...E,
		...r
	};
	return e.map((e) => {
		let t = {
			id: e[i.id],
			url: n + e[i.url]
		};
		return e[i.position] != null && (t.position = e[i.position]), e[i.scale] != null && (t.scale = e[i.scale]), t;
	});
}
var O = {
	position: "position",
	target: "target"
};
function k(e, t = {}) {
	if (!e) return null;
	let n = {
		...O,
		...t
	}, r = A(e[n.position]), i = A(e[n.target]);
	return r && i ? {
		position: r,
		target: i
	} : null;
}
function A(e) {
	let t = String(e ?? "").split(",").map((e) => Number(e.trim()));
	return t.length === 3 && t.every(Number.isFinite) ? t : null;
}
//#endregion
//#region widgets/scene/applyMaterial.js
function j(e) {
	let t = e?.getAttribute?.("color");
	if (!t) return !1;
	let { array: n, itemSize: r, count: i } = t;
	for (let e = 0; e < i; e++) {
		let t = e * r;
		if (n[t] !== 0 || n[t + 1] !== 0 || n[t + 2] !== 0) return !1;
	}
	return !0;
}
function M(e, t = {}, n = !0) {
	let { color: r, ...i } = t;
	e.traverse((e) => {
		if (!e.isMesh || !e.material) return;
		let t = e.material.clone();
		Object.assign(t, i), r != null && t.color && t.color.set(r), n && t.vertexColors && j(e.geometry) && (t.vertexColors = !1), t.needsUpdate = !0, e.material = t;
	});
}
//#endregion
//#region widgets/scene/components/GltfModel.vue
var N = ["position", "scale"], P = {
	__name: "GltfModel",
	props: {
		url: {
			type: String,
			required: !0
		},
		position: {
			type: Array,
			default: () => [
				0,
				0,
				0
			]
		},
		scale: {
			type: Number,
			default: 1
		},
		material: {
			type: Object,
			default: null
		},
		dropBlackVertexColors: {
			type: Boolean,
			default: !0
		}
	},
	setup(e, { expose: a }) {
		let o = e, { state: s, isLoading: c } = S(h(o, "url")), u = t(() => s.value?.scene);
		return _([
			u,
			() => o.material,
			() => o.dropBlackVertexColors
		], ([e]) => {
			e && M(e, o.material ?? {}, o.dropBlackVertexColors);
		}, { immediate: !0 }), a({ isLoading: c }), (t, a) => {
			let o = p("primitive");
			return l(), i("TresGroup", {
				position: e.position,
				scale: e.scale
			}, [u.value ? (l(), n(o, {
				key: 0,
				object: u.value
			}, null, 8, ["object"])) : r("", !0)], 8, N);
		};
	}
};
//#endregion
//#region widgets/scene/fitToObject.js
function F(e, t, { padding: n = 1.1, pivot: r = null } = {}) {
	if (!e || !t) return null;
	let i = new C().setFromObject(t);
	if (i.isEmpty()) return null;
	let { center: a, radius: o } = i.getBoundingSphere(new w());
	if (o === 0) return null;
	let s = e.fov * Math.PI / 180, c = 2 * Math.atan(Math.tan(s / 2) * e.aspect), l = n * Math.max(o / Math.sin(s / 2), o / Math.sin(c / 2)), u = r ? e.position.clone().sub(r) : e.getWorldDirection(new T()).negate();
	return u.lengthSq() === 0 && u.set(0, 0, 1), u.normalize(), e.position.copy(a).addScaledVector(u, l), e.near = Math.max((l - o) / 10, .01), e.far = (l + o) * 2, e.updateProjectionMatrix(), a;
}
//#endregion
//#region widgets/scene/components/SceneCamera.vue
var I = "input, textarea, select, [contenteditable=\"true\"], [role=\"combobox\"], [role=\"listbox\"]", L = {
	__name: "SceneCamera",
	props: {
		homePosition: {
			type: Array,
			required: !0
		},
		homeTarget: {
			type: Array,
			required: !0
		},
		framing: {
			type: Object,
			default: null
		},
		fitPadding: {
			type: Number,
			default: 1.1
		},
		homeKey: {
			type: String,
			default: "h"
		},
		frameKey: {
			type: String,
			default: "f"
		},
		log: {
			type: Boolean,
			default: !1
		}
	},
	setup(e, { expose: t }) {
		let n = e, { camera: r, controls: i } = b(), a = (e) => [
			o(e.x),
			o(e.y),
			o(e.z)
		], o = (e) => Math.round(e * 1e3) / 1e3;
		function l(e) {
			let t = r.activeCamera.value;
			if (!t) return;
			let n = a(t.position), o = i.value ? a(i.value.target) : null;
			console.log(`[seamonster/scene] ${e}\n  "position": "${n.join(",")}"\n  "target":   "${o ? o.join(",") : "(no controls)"}"`, {
				position: n,
				target: o,
				rotation: a(t.rotation)
			});
		}
		function u() {
			let e = r.activeCamera.value;
			e && (e.position.set(...n.homePosition), p(e, new T(...n.homeTarget)));
		}
		function d() {
			let e = r.activeCamera.value;
			if (!e || !n.framing) return;
			let t = F(e, n.framing, {
				padding: n.fitPadding,
				pivot: i.value?.target ?? null
			});
			t && p(e, t);
		}
		function p(e, t) {
			i.value ? (i.value.target.copy(t), i.value.update()) : e.lookAt(t);
		}
		function m(e) {
			if (e.altKey || e.ctrlKey || e.metaKey || e.target?.closest?.(I)) return;
			let t = e.key.toLowerCase();
			n.homeKey && t === n.homeKey.toLowerCase() ? (e.preventDefault(), u()) : n.frameKey && t === n.frameKey.toLowerCase() && (e.preventDefault(), d());
		}
		let h = null;
		_([i, () => n.log], ([e, t]) => {
			h &&= (h.removeEventListener("end", g), null), e && t && (e.addEventListener("end", g), h = e);
		}, { immediate: !0 });
		function g() {
			l("view changed");
		}
		return c(() => {
			window.addEventListener("keydown", m), n.log && l("initial view");
		}), s(() => {
			window.removeEventListener("keydown", m), h?.removeEventListener("end", g);
		}), t({
			home: u,
			frame: d,
			logView: l
		}), (e, t) => f(e.$slots, "default");
	}
}, R = { class: "wsc-scene" }, z = {
	__name: "SceneView",
	props: {
		models: {
			type: Array,
			required: !0
		},
		cameraPosition: {
			type: Array,
			default: () => [
				4,
				3,
				6
			]
		},
		target: {
			type: Array,
			default: () => [
				0,
				1,
				0
			]
		},
		clearColor: {
			type: String,
			default: "#ffffff"
		},
		material: {
			type: Object,
			default: () => ({
				roughness: .45,
				metalness: .1
			})
		},
		dropBlackVertexColors: {
			type: Boolean,
			default: !0
		},
		homeKey: {
			type: String,
			default: "h"
		},
		frameKey: {
			type: String,
			default: "f"
		},
		logCamera: {
			type: Boolean,
			default: !1
		}
	},
	setup(t, { expose: r }) {
		let s = t, c = [...s.cameraPosition], f = [...s.target], p = m(null), h = u(null);
		return r({
			home: () => h.value?.home(),
			frame: () => h.value?.frame(),
			logView: () => h.value?.logView("requested")
		}), (r, s) => (l(), i("div", R, [o(g(y), { "clear-color": t.clearColor }, {
			default: v(() => [
				a("TresPerspectiveCamera", {
					position: c,
					"look-at": f
				}),
				o(g(x), {
					target: f,
					"enable-damping": "",
					"make-default": ""
				}),
				s[0] ||= a("TresAmbientLight", { intensity: .7 }, null, -1),
				s[1] ||= a("TresDirectionalLight", {
					position: [
						5,
						8,
						5
					],
					intensity: 2.2
				}, null, -1),
				s[2] ||= a("TresDirectionalLight", {
					position: [
						-6,
						3,
						-4
					],
					intensity: .9
				}, null, -1),
				a("TresGroup", {
					ref_key: "modelsGroup",
					ref: p
				}, [(l(!0), i(e, null, d(t.models, (e) => (l(), n(P, {
					key: e.id,
					url: e.url,
					position: e.position ?? [
						0,
						0,
						0
					],
					scale: e.scale ?? 1,
					material: e.material ?? t.material,
					"drop-black-vertex-colors": t.dropBlackVertexColors
				}, null, 8, [
					"url",
					"position",
					"scale",
					"material",
					"drop-black-vertex-colors"
				]))), 128))], 512),
				o(L, {
					ref_key: "sceneCamera",
					ref: h,
					"home-position": t.cameraPosition,
					"home-target": t.target,
					framing: p.value,
					"home-key": t.homeKey,
					"frame-key": t.frameKey,
					log: t.logCamera
				}, null, 8, [
					"home-position",
					"home-target",
					"framing",
					"home-key",
					"frame-key",
					"log"
				])
			]),
			_: 1
		}, 8, ["clear-color"])]));
	}
};
//#endregion
export { P as GltfModel, z as SceneView, M as applyMaterial, F as fitToObject, D as fromRows, k as fromViewRow };
