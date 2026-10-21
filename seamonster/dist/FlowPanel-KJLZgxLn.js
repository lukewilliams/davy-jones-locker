import { r as e } from "./menu-ByXvYfw3.js";
import { Fragment as t, computed as n, createCommentVNode as r, createElementBlock as i, createElementVNode as a, createTextVNode as o, inject as s, normalizeClass as c, normalizeStyle as l, onBeforeUnmount as u, openBlock as d, reactive as f, ref as p, renderList as m, renderSlot as h, toDisplayString as g, toValue as _, unref as v, watch as y, withDirectives as b } from "vue";
//#region lib/keyboard.js
var x = (e) => !!e.target.closest?.("input, textarea, select, [contenteditable=\"true\"]"), S = Symbol("flow-panel-layout"), C = "seamonster:unlinked-panel-rects", w = [
	"left",
	"right",
	"bottom"
], T = 5, E = (e, t, n) => Math.max(t, Math.min(n, e));
function D(e) {
	try {
		let t = JSON.parse(localStorage.getItem(e));
		return t && typeof t == "object" ? t : {};
	} catch {
		return {};
	}
}
function O(e, t) {
	try {
		localStorage.setItem(e, JSON.stringify(t));
	} catch {}
}
function k(e) {
	return e && [
		"x",
		"y",
		"w",
		"h"
	].every((t) => Number.isFinite(e[t])) ? e : null;
}
function A({ storageKey: e = C, autoHideRails: t = !0 } = {}) {
	let r = f({
		width: 0,
		height: 0,
		gap: 0,
		leftTop: 0
	}), i = f([]), a = p([]), o = p(null), s = D(e), c = p(null), l = () => ({
		w: r.width - 2 * r.gap,
		h: r.height - 2 * r.gap
	}), u = (e) => i.find((t) => t.name === e), d = (e) => e.sizing === "content", m = (e, t) => e.name === t || e.linked && !e.collapsed, h = (e, t = null) => i.filter((n) => n.dock === e && !d(n) && m(n, t));
	function g({ name: e, title: t, dock: n, sizing: r = "fill", defaultSize: o, minWidth: c, minHeight: l, collapsed: d, hotkey: f, aboveBottom: p }) {
		u(e) && console.warn(`There are two panels called "${e}": give each panel a name of its own.`);
		let m = f && i.find((e) => e.hotkey?.toLowerCase() === f.toLowerCase());
		m && (console.warn(`The ${t} panel's hotkey ${f} is the ${m.title} panel's already, which keeps it.`), f = null), i.push({
			name: e,
			title: t,
			dock: n,
			sizing: r,
			defaultSize: o,
			minWidth: c,
			minHeight: l,
			collapsed: d,
			hotkey: f,
			aboveBottom: p,
			linked: !0,
			linkedFrac: null,
			contentSize: null,
			unlinkedRect: k(s[e])
		}), a.value.push(e);
	}
	function v(e) {
		i.splice(i.indexOf(u(e)), 1), a.value = a.value.filter((t) => t !== e), o.value === e && (o.value = null);
	}
	function b(e) {
		Object.assign(r, e);
	}
	function S(e, t) {
		let n = u(e), r = n?.contentSize;
		!n || r && Math.abs(r.width - t.width) < .5 && Math.abs(r.height - t.height) < .5 || (n.contentSize = t);
	}
	function A(e) {
		let { w: t, h: n } = l();
		return e.dock === "bottom" ? E(e.linkedFrac === null ? e.defaultSize : e.linkedFrac * n, e.minHeight, n) : E(e.linkedFrac === null ? e.defaultSize : e.linkedFrac * t, e.minWidth, t);
	}
	function j(e, t = null) {
		let n = h(e, t), r = n.length;
		if (h("bottom", t).length) for (; r > 0 && n[r - 1].aboveBottom;) r--;
		return {
			full: n.slice(0, r),
			above: n.slice(r)
		};
	}
	let M = (e = null) => [...j("left", e).above, ...j("right", e).above], N = (e) => e.dock === "left" ? r.leftTop : r.gap;
	function P(e) {
		if (!e.length) return l().h;
		let t = Math.min(...e.map((e) => r.height - 2 * r.gap - N(e) - e.minHeight));
		return Math.max(0, t);
	}
	let F = (e, t) => E(A(e), e.minHeight, Math.max(e.minHeight, P(t)));
	function I(e) {
		let { w: t, h: n } = l(), i = r.gap;
		return {
			x: (e.left - i) / t,
			y: (e.top - i) / n,
			w: e.width / t,
			h: e.height / n
		};
	}
	function L(e) {
		let { w: t, h: n } = l(), i = r.gap, a = e.unlinkedRect, o = E(a.w * t, e.minWidth, t), s = E(a.h * n, e.minHeight, n);
		return {
			left: E(i + a.x * t, i, i + t - o),
			top: E(i + a.y * n, i, i + n - s),
			width: o,
			height: s
		};
	}
	function R(e) {
		let { width: t, height: n, gap: i, leftTop: a } = r, { w: o, h: s } = l(), c = e.contentSize ?? {
			width: e.minWidth,
			height: e.minHeight
		};
		if (e.dock === "bottom") {
			let t = E(c.width, Math.min(e.minWidth, o), o), r = E(c.height, 0, s);
			return {
				left: i,
				top: n - i - r,
				width: t,
				height: r
			};
		}
		let u = A(e);
		return e.dock === "left" ? {
			left: i,
			top: a,
			width: u,
			height: E(c.height, 0, Math.max(0, n - i - a))
		} : {
			left: t - i - u,
			top: i,
			width: u,
			height: E(c.height, 0, s)
		};
	}
	function z(e = null) {
		let t = {};
		if (!r.width) return t;
		let { width: n, height: a, gap: o, leftTop: s } = r, c = j("left", e), l = j("right", e), u = [...c.above, ...l.above], f = h("bottom", e), p = a - o - Math.max(0, ...f.map((e) => F(e, u))), g = o;
		for (let e of c.full) {
			let n = A(e);
			t[e.name] = {
				left: g,
				top: s,
				width: n,
				height: a - o - s
			}, g += n + o;
		}
		let _ = g;
		for (let e of c.above) {
			let n = A(e);
			t[e.name] = {
				left: g,
				top: s,
				width: n,
				height: Math.max(0, p - o - s)
			}, g += n + o;
		}
		let v = n - o;
		for (let e of l.full) {
			let n = A(e);
			v -= n, t[e.name] = {
				left: v,
				top: o,
				width: n,
				height: a - 2 * o
			}, v -= o;
		}
		let y = v;
		for (let e of l.above) {
			let n = A(e);
			v -= n, t[e.name] = {
				left: v,
				top: o,
				width: n,
				height: Math.max(0, p - 2 * o)
			}, v -= o;
		}
		for (let e of f) {
			let n = F(e, u);
			t[e.name] = {
				left: _,
				top: a - o - n,
				width: Math.max(0, y - _),
				height: n
			};
		}
		for (let n of i) d(n) && m(n, e) && (t[n.name] = R(n));
		for (let n of i) !m(n, e) && !n.linked && !n.collapsed && n.unlinkedRect && (t[n.name] = L(n));
		return t;
	}
	let B = n(() => z());
	function V(e) {
		let t = [...j("left").full, ...j("right").full].filter((t) => t !== e), n = M(), i = n.filter((t) => t !== e), a = h("bottom"), o = (e) => e.reduce((e, t) => e + A(t), 0), s = o(i) + r.gap * Math.max(0, i.length - 1), c = a.length ? Math.max(...a.map((e) => e.minWidth)) : 0, l = n.includes(e) ? s : Math.max(s, c), u = t.length + +(l > 0);
		return {
			width: o(t) + l + r.gap * Math.max(0, u - 1),
			items: u
		};
	}
	function H(e, t) {
		let n = B.value;
		for (let r of e) !t && r.linked && n[r.name] && (r.unlinkedRect ??= I(n[r.name])), r.linked = t;
	}
	function U(e) {
		let t = u(e);
		H([t], !t.linked);
	}
	y(() => [
		r.width,
		r.height,
		...i.map((e) => `${e.collapsed}:${e.linked}`)
	], () => {
		!r.width || V(null).width <= l().w || H(w.flatMap((e) => h(e)), !1);
	});
	function W(e, t, n, i, a) {
		let o = u(e), { w: s, h: c } = l(), f = r.gap;
		if (o.linked) {
			if (d(o)) {
				if (o.dock === "bottom") return;
				let e = o.dock === "right" ? -i : i;
				o.linkedFrac = E(n.width + e, o.minWidth, s) / s;
				return;
			}
			if (o.dock === "bottom") {
				let e = Math.max(o.minHeight, P(M()));
				o.linkedFrac = E(n.height - a, o.minHeight, e) / c;
			} else {
				let { width: e, items: t } = V(o), r = s - e - (t ? f : 0), a = o.dock === "right" ? -i : i;
				o.linkedFrac = E(n.width + a, o.minWidth, r) / s;
			}
			return;
		}
		let { left: p, top: m, width: h, height: g } = n, _ = p + h, v = m + g;
		t.includes("w") && (p = E(p + i, f, _ - o.minWidth), h = _ - p), t.includes("e") && (h = E(h + i, o.minWidth, f + s - p)), t.includes("n") && (m = E(m + a, f, v - o.minHeight), g = v - m), t.includes("s") && (g = E(g + a, o.minHeight, f + c - m)), o.unlinkedRect = I({
			left: p,
			top: m,
			width: h,
			height: g
		});
	}
	function G(e, t, n, i) {
		let a = u(e);
		if (a.linked) return;
		let { w: o, h: s } = l(), c = r.gap;
		a.unlinkedRect = I({
			...t,
			left: E(t.left + n, c, c + o - t.width),
			top: E(t.top + i, c, c + s - t.height)
		});
	}
	function K(t) {
		s[t.name] = t.unlinkedRect, O(e, s);
	}
	function q(e) {
		let t = u(e);
		t.linked || K(t);
	}
	function J(e) {
		let t = z(e)[e];
		if (!t) return;
		let n = u(e);
		n.unlinkedRect = I(t), K(n);
	}
	let Y = (e, t) => e.left < t.left + t.width && t.left < e.left + e.width && e.top < t.top + t.height && t.top < e.top + e.height;
	function X(e) {
		let t = B.value;
		return t[e] ? a.value.slice(a.value.indexOf(e) + 1).some((n) => t[n] && Y(t[e], t[n])) : !1;
	}
	let Z = (e) => T + a.value.indexOf(e);
	function Q(e) {
		a.value = [...a.value.filter((t) => t !== e), e], o.value = e;
	}
	function ee() {
		o.value = null;
	}
	function $(e, t) {
		u(e).collapsed = t, t && o.value === e && (o.value = null), t || Q(e);
	}
	function te(e) {
		let t = B.value;
		return !!t[e] && Object.keys(t).some((n) => n !== e && Y(t[e], t[n]));
	}
	let ne = n(() => Object.fromEntries(w.map((e) => {
		let n = i.filter((t) => t.dock === e), r = !_(t) || n.length > 1 && n.some((e) => !e.linked);
		return [e, n.filter((e) => e.collapsed || r || d(e) && te(e.name))];
	})));
	function re(e) {
		u(e).collapsed ? $(e, !1) : X(e) ? Q(e) : $(e, !0);
	}
	let ie = n(() => i.some((e) => !e.collapsed) ? "collapse" : c.value ? "restore" : null);
	function ae() {
		let e = i.filter((e) => !e.collapsed);
		e.length ? (c.value = e.map((e) => e.name), e.forEach((e) => e.collapsed = !0), o.value = null) : c.value &&= (c.value.forEach((e) => u(e) && (u(e).collapsed = !1)), null);
	}
	function oe(e, { hotkeys: t = !0 } = {}) {
		if (e.ctrlKey && e.code === "Space") {
			if (e.preventDefault(), e.repeat) return;
			o.value ? U(o.value) : ae();
			return;
		}
		if (!t || e.ctrlKey || e.metaKey || e.altKey || x(e)) return;
		let n = i.find((t) => t.hotkey?.toLowerCase() === e.key.toLowerCase());
		n && (e.preventDefault(), e.repeat || re(n.name));
	}
	return {
		frame: r,
		panels: i,
		rects: B,
		rails: ne,
		active: o,
		maximiseAction: ie,
		find: u,
		register: g,
		unregister: v,
		setFrame: b,
		setContentSize: S,
		resize: W,
		move: G,
		commitRect: q,
		resetUnlinkedRect: J,
		toggleLinked: U,
		isCovered: X,
		zIndex: Z,
		activate: Q,
		deactivate: ee,
		setCollapsed: $,
		toggle: re,
		toggleMaximise: ae,
		onKeydown: oe
	};
}
//#endregion
//#region components/panelMenus.js
var j = [
	{ command: "panel.toggleCollapsed" },
	{
		type: "checkbox",
		label: "Linked",
		command: "panel.toggleLinked",
		shortcut: "Ctrl+Space"
	},
	{ type: "separator" },
	{
		label: "Set unlinked size to current",
		command: "panel.resetUnlinked"
	}
];
function M(e) {
	return {
		"panel.toggleCollapsed": {
			label: (t) => e.find(t).collapsed ? "Expand" : "Collapse",
			run: (t) => e.setCollapsed(t, !e.find(t).collapsed)
		},
		"panel.toggleLinked": {
			checked: (t) => e.find(t).linked,
			run: (t) => e.toggleLinked(t)
		},
		"panel.resetUnlinked": (t) => e.resetUnlinkedRect(t),
		"panels.toggleMaximise": {
			label: () => e.maximiseAction.value === "restore" ? "Restore panels" : "Collapse all panels",
			disabled: () => !e.maximiseAction.value,
			run: () => e.toggleMaximise()
		}
	};
}
function N(e) {
	return {
		type: "submenu",
		label: "Panels",
		items: () => [
			...e.panels.map((t) => ({
				type: "checkbox",
				label: t.title,
				shortcut: t.hotkey,
				checked: !t.collapsed,
				action: () => e.setCollapsed(t.name, !t.collapsed)
			})),
			{ type: "separator" },
			{
				command: "panels.toggleMaximise",
				shortcut: "Ctrl+Space"
			}
		]
	};
}
//#endregion
//#region components/FlowPanel.vue
var P = ["aria-label"], F = ["onPointerdown"], I = [
	"aria-pressed",
	"aria-label",
	"title"
], L = 4, R = {
	__name: "FlowPanel",
	props: {
		name: {
			type: String,
			required: !0
		},
		title: {
			type: String,
			required: !0
		},
		dock: {
			type: String,
			required: !0,
			validator: (e) => [
				"left",
				"right",
				"bottom"
			].includes(e)
		},
		sizing: {
			type: String,
			default: "fill",
			validator: (e) => ["fill", "content"].includes(e)
		},
		defaultSize: {
			type: Number,
			default: 320
		},
		minWidth: {
			type: Number,
			default: 200
		},
		minHeight: {
			type: Number,
			default: 140
		},
		collapsed: {
			type: Boolean,
			default: !1
		},
		hotkey: {
			type: String,
			default: null
		},
		aboveBottom: {
			type: Boolean,
			default: !1
		}
	},
	setup(f) {
		let _ = f, x = s(S);
		x.register({ ..._ }), u(() => x.unregister(_.name));
		let C = n(() => x.find(_.name)), w = n(() => x.rects.value[_.name]);
		y(() => _.title, (e) => C.value.title = e);
		let T = {
			left: ["e"],
			right: ["w"],
			bottom: ["n"]
		}, E = [
			"n",
			"s",
			"e",
			"w",
			"ne",
			"nw",
			"se",
			"sw"
		], D = _.sizing === "content", O = n(() => C.value.linked ? D && _.dock === "bottom" ? [] : T[_.dock] : E), k = p(null), A = p(null), M = p(null);
		function N() {
			let [e, t, n] = [
				k.value,
				A.value,
				M.value
			];
			e && t && n && x.setContentSize(_.name, {
				width: n.offsetWidth + e.offsetWidth - t.clientWidth,
				height: n.offsetHeight + e.offsetHeight - t.clientHeight
			});
		}
		D && y([M, A], ([e, t], n, r) => {
			if (!e || !t) return;
			let i = new ResizeObserver(N);
			i.observe(e), i.observe(t), r(() => i.disconnect());
		}, { flush: "post" });
		let R = n(() => ({
			left: `${w.value.left}px`,
			top: `${w.value.top}px`,
			width: `${w.value.width}px`,
			height: `${w.value.height}px`,
			zIndex: x.zIndex(_.name)
		})), z = n(() => `${C.value.linked ? "Unlink" : "Link"} ${_.title} panel`), B = !1;
		function V() {
			B = x.isCovered(_.name), x.activate(_.name);
		}
		let H = null, U = !1;
		function W(e) {
			e.button === 0 && (U = !1, H = {
				x: e.clientX,
				y: e.clientY,
				start: { ...w.value },
				moved: !1
			}, e.currentTarget.setPointerCapture(e.pointerId));
		}
		function G(e) {
			if (!H || C.value.linked) return;
			let t = e.clientX - H.x, n = e.clientY - H.y;
			!H.moved && Math.hypot(t, n) < L || (H.moved = !0, x.move(_.name, H.start, t, n));
		}
		function K() {
			H &&= (H.moved && (U = !0, x.commitRect(_.name)), null);
		}
		function q() {
			!U && !B && x.setCollapsed(_.name, !0), U = !1, B = !1;
		}
		let J = null;
		function Y(e, t) {
			t.preventDefault(), J = {
				edge: e,
				x: t.clientX,
				y: t.clientY,
				start: { ...w.value }
			}, t.currentTarget.setPointerCapture(t.pointerId);
		}
		function X(e) {
			J && x.resize(_.name, J.edge, J.start, e.clientX - J.x, e.clientY - J.y);
		}
		function Z() {
			J && (J = null, x.commitRect(_.name));
		}
		return (n, s) => !C.value.collapsed && w.value ? (d(), i("section", {
			key: 0,
			ref_key: "panelEl",
			ref: k,
			class: c([
				"flow-panel",
				`flow-panel--dock-${f.dock}`,
				`flow-panel--${f.sizing}`,
				{
					"is-active": v(x).active.value === f.name,
					"is-unlinked": !C.value.linked
				}
			]),
			style: l(R.value),
			onPointerdown: V
		}, [
			b((d(), i("button", {
				type: "button",
				class: "flow-panel-title",
				"aria-label": `Hide ${f.title} panel`,
				onPointerdown: W,
				onPointermove: G,
				onPointerup: K,
				onPointercancel: K,
				onClick: q
			}, [o(g(f.title), 1)], 40, P)), [[v(e), {
				items: v(j),
				context: f.name
			}]]),
			a("div", {
				ref_key: "bodyEl",
				ref: A,
				class: "flow-panel-body"
			}, [D ? (d(), i("div", {
				key: 0,
				ref_key: "contentEl",
				ref: M,
				class: "flow-panel-content"
			}, [h(n.$slots, "default")], 512)) : h(n.$slots, "default", {}, void 0, void 0, 1)], 512),
			(d(!0), i(t, null, m(O.value, (e) => (d(), i("div", {
				key: e,
				class: c(["flow-panel-resize", `flow-panel-resize--${e}`]),
				onPointerdown: (t) => Y(e, t),
				onPointermove: X,
				onPointerup: Z,
				onPointercancel: Z
			}, null, 42, F))), 128)),
			a("button", {
				type: "button",
				class: "flow-panel-link-btn",
				"aria-pressed": C.value.linked,
				"aria-label": z.value,
				title: `${z.value} (Ctrl+Space)`,
				onClick: s[0] ||= (e) => v(x).toggleLinked(f.name)
			}, [a("span", {
				class: c(["flow-panel-link-icon", C.value.linked ? "is-linked" : "is-unlinked"]),
				"aria-hidden": "true"
			}, null, 2)], 8, I)
		], 38)) : r("", !0);
	}
};
//#endregion
export { S as a, N as i, j as n, A as o, M as r, x as s, R as t };
