import { r as e, t } from "./menu-ByXvYfw3.js";
import { Fragment as n, computed as r, createBlock as i, createCommentVNode as a, createElementBlock as o, createElementVNode as s, createTextVNode as c, createVNode as l, inject as u, normalizeClass as d, normalizeStyle as f, onBeforeUnmount as p, onMounted as m, openBlock as h, provide as g, reactive as _, ref as v, renderList as y, renderSlot as b, toDisplayString as x, toValue as S, unref as C, watch as w, withCtx as T, withDirectives as E } from "vue";
//#region lib/keyboard.js
var D = (e) => !!e.target.closest?.("input, textarea, select, [contenteditable=\"true\"]"), O = Symbol("flow-panel-layout"), k = "seamonster:unlinked-panel-rects", A = [
	"left",
	"right",
	"bottom"
], j = 5, M = (e, t, n) => Math.max(t, Math.min(n, e));
function N(e) {
	try {
		let t = JSON.parse(localStorage.getItem(e));
		return t && typeof t == "object" ? t : {};
	} catch {
		return {};
	}
}
function P(e, t) {
	try {
		localStorage.setItem(e, JSON.stringify(t));
	} catch {}
}
function F(e) {
	return e && [
		"x",
		"y",
		"w",
		"h"
	].every((t) => Number.isFinite(e[t])) ? e : null;
}
function I({ storageKey: e = k, autoHideRails: t = !0 } = {}) {
	let n = _({
		width: 0,
		height: 0,
		gap: 0,
		leftTop: 0
	}), i = _([]), a = v([]), o = v(null), s = N(e), c = v(null), l = () => ({
		w: n.width - 2 * n.gap,
		h: n.height - 2 * n.gap
	}), u = (e) => i.find((t) => t.name === e), d = (e) => e.sizing === "content", f = (e, t) => e.name === t || e.linked && !e.collapsed, p = (e, t = null) => i.filter((n) => n.dock === e && !d(n) && f(n, t));
	function m({ name: e, title: t, dock: n, sizing: r = "fill", defaultSize: o, minWidth: c, minHeight: l, collapsed: u, hotkey: d, aboveBottom: f }) {
		i.push({
			name: e,
			title: t,
			dock: n,
			sizing: r,
			defaultSize: o,
			minWidth: c,
			minHeight: l,
			collapsed: u,
			hotkey: d,
			aboveBottom: f,
			linked: !0,
			linkedFrac: null,
			contentSize: null,
			unlinkedRect: F(s[e])
		}), a.value.push(e);
	}
	function h(e) {
		i.splice(i.indexOf(u(e)), 1), a.value = a.value.filter((t) => t !== e), o.value === e && (o.value = null);
	}
	function g(e) {
		Object.assign(n, e);
	}
	function y(e, t) {
		let n = u(e), r = n?.contentSize;
		!n || r && Math.abs(r.width - t.width) < .5 && Math.abs(r.height - t.height) < .5 || (n.contentSize = t);
	}
	function b(e) {
		let { w: t, h: n } = l();
		return e.dock === "bottom" ? M(e.linkedFrac === null ? e.defaultSize : e.linkedFrac * n, e.minHeight, n) : M(e.linkedFrac === null ? e.defaultSize : e.linkedFrac * t, e.minWidth, t);
	}
	function x(e = null) {
		let t = p("left", e), n = t.length;
		if (p("bottom", e).length) for (; n > 0 && t[n - 1].aboveBottom;) n--;
		return {
			full: t.slice(0, n),
			above: t.slice(n)
		};
	}
	function C(e) {
		if (!e.length) return l().h;
		let t = n.height - 2 * n.gap - n.leftTop - Math.max(...e.map((e) => e.minHeight));
		return Math.max(0, t);
	}
	let T = (e, t) => M(b(e), e.minHeight, Math.max(e.minHeight, C(t)));
	function E(e) {
		let { w: t, h: r } = l(), i = n.gap;
		return {
			x: (e.left - i) / t,
			y: (e.top - i) / r,
			w: e.width / t,
			h: e.height / r
		};
	}
	function O(e) {
		let { w: t, h: r } = l(), i = n.gap, a = e.unlinkedRect, o = M(a.w * t, e.minWidth, t), s = M(a.h * r, e.minHeight, r);
		return {
			left: M(i + a.x * t, i, i + t - o),
			top: M(i + a.y * r, i, i + r - s),
			width: o,
			height: s
		};
	}
	function I(e) {
		let { width: t, height: r, gap: i, leftTop: a } = n, { w: o, h: s } = l(), c = e.contentSize ?? {
			width: e.minWidth,
			height: e.minHeight
		};
		if (e.dock === "bottom") {
			let t = M(c.width, Math.min(e.minWidth, o), o), n = M(c.height, 0, s);
			return {
				left: i,
				top: r - i - n,
				width: t,
				height: n
			};
		}
		let u = b(e);
		return e.dock === "left" ? {
			left: i,
			top: a,
			width: u,
			height: M(c.height, 0, Math.max(0, r - i - a))
		} : {
			left: t - i - u,
			top: i,
			width: u,
			height: M(c.height, 0, s)
		};
	}
	function L(e = null) {
		let t = {};
		if (!n.width) return t;
		let { width: r, height: a, gap: o, leftTop: s } = n, { full: c, above: l } = x(e), u = p("bottom", e), m = a - o - Math.max(0, ...u.map((e) => T(e, l))), h = o;
		for (let e of c) {
			let n = b(e);
			t[e.name] = {
				left: h,
				top: s,
				width: n,
				height: a - o - s
			}, h += n + o;
		}
		let g = h;
		for (let e of l) {
			let n = b(e);
			t[e.name] = {
				left: h,
				top: s,
				width: n,
				height: Math.max(0, m - o - s)
			}, h += n + o;
		}
		let _ = r - o;
		for (let n of p("right", e)) {
			let e = b(n);
			_ -= e, t[n.name] = {
				left: _,
				top: o,
				width: e,
				height: a - 2 * o
			}, _ -= o;
		}
		for (let e of u) {
			let n = T(e, l);
			t[e.name] = {
				left: g,
				top: a - o - n,
				width: Math.max(0, _ - g),
				height: n
			};
		}
		for (let n of i) d(n) && f(n, e) && (t[n.name] = I(n));
		for (let n of i) !f(n, e) && !n.linked && !n.collapsed && n.unlinkedRect && (t[n.name] = O(n));
		return t;
	}
	let R = r(() => L());
	function z(e) {
		let { full: t, above: r } = x(), i = [...t, ...p("right")].filter((t) => t !== e), a = r.filter((t) => t !== e), o = p("bottom"), s = (e) => e.reduce((e, t) => e + b(t), 0), c = s(a) + n.gap * Math.max(0, a.length - 1), l = o.length ? Math.max(...o.map((e) => e.minWidth)) : 0, u = r.includes(e) ? c : Math.max(c, l), d = i.length + +(u > 0);
		return {
			width: s(i) + u + n.gap * Math.max(0, d - 1),
			items: d
		};
	}
	function B(e, t) {
		let n = R.value;
		for (let r of e) !t && r.linked && n[r.name] && (r.unlinkedRect ??= E(n[r.name])), r.linked = t;
	}
	function V(e) {
		let t = u(e);
		B([t], !t.linked);
	}
	w(() => [
		n.width,
		n.height,
		...i.map((e) => `${e.collapsed}:${e.linked}`)
	], () => {
		!n.width || z(null).width <= l().w || B(A.flatMap((e) => p(e)), !1);
	});
	function H(e, t, r, i, a) {
		let o = u(e), { w: s, h: c } = l(), f = n.gap;
		if (o.linked) {
			if (d(o)) {
				if (o.dock === "bottom") return;
				let e = o.dock === "right" ? -i : i;
				o.linkedFrac = M(r.width + e, o.minWidth, s) / s;
				return;
			}
			if (o.dock === "bottom") {
				let e = Math.max(o.minHeight, C(x().above));
				o.linkedFrac = M(r.height - a, o.minHeight, e) / c;
			} else {
				let { width: e, items: t } = z(o), n = s - e - (t ? f : 0), a = o.dock === "right" ? -i : i;
				o.linkedFrac = M(r.width + a, o.minWidth, n) / s;
			}
			return;
		}
		let { left: p, top: m, width: h, height: g } = r, _ = p + h, v = m + g;
		t.includes("w") && (p = M(p + i, f, _ - o.minWidth), h = _ - p), t.includes("e") && (h = M(h + i, o.minWidth, f + s - p)), t.includes("n") && (m = M(m + a, f, v - o.minHeight), g = v - m), t.includes("s") && (g = M(g + a, o.minHeight, f + c - m)), o.unlinkedRect = E({
			left: p,
			top: m,
			width: h,
			height: g
		});
	}
	function U(e, t, r, i) {
		let a = u(e);
		if (a.linked) return;
		let { w: o, h: s } = l(), c = n.gap;
		a.unlinkedRect = E({
			...t,
			left: M(t.left + r, c, c + o - t.width),
			top: M(t.top + i, c, c + s - t.height)
		});
	}
	function W(t) {
		s[t.name] = t.unlinkedRect, P(e, s);
	}
	function G(e) {
		let t = u(e);
		t.linked || W(t);
	}
	function K(e) {
		let t = L(e)[e];
		if (!t) return;
		let n = u(e);
		n.unlinkedRect = E(t), W(n);
	}
	let q = (e, t) => e.left < t.left + t.width && t.left < e.left + e.width && e.top < t.top + t.height && t.top < e.top + e.height;
	function J(e) {
		let t = R.value;
		return t[e] ? a.value.slice(a.value.indexOf(e) + 1).some((n) => t[n] && q(t[e], t[n])) : !1;
	}
	let Y = (e) => j + a.value.indexOf(e);
	function X(e) {
		a.value = [...a.value.filter((t) => t !== e), e], o.value = e;
	}
	function Z() {
		o.value = null;
	}
	function Q(e, t) {
		u(e).collapsed = t, t && o.value === e && (o.value = null), t || X(e);
	}
	function ee(e) {
		let t = R.value;
		return !!t[e] && Object.keys(t).some((n) => n !== e && q(t[e], t[n]));
	}
	let te = r(() => Object.fromEntries(A.map((e) => {
		let n = i.filter((t) => t.dock === e), r = !S(t) || n.length > 1 && n.some((e) => !e.linked);
		return [e, n.filter((e) => e.collapsed || r || d(e) && ee(e.name))];
	})));
	function $(e) {
		u(e).collapsed ? Q(e, !1) : J(e) ? X(e) : Q(e, !0);
	}
	let ne = r(() => i.some((e) => !e.collapsed) ? "collapse" : c.value ? "restore" : null);
	function re() {
		let e = i.filter((e) => !e.collapsed);
		e.length ? (c.value = e.map((e) => e.name), e.forEach((e) => e.collapsed = !0), o.value = null) : c.value &&= (c.value.forEach((e) => u(e) && (u(e).collapsed = !1)), null);
	}
	function ie(e, { hotkeys: t = !0 } = {}) {
		if (e.ctrlKey && e.code === "Space") {
			if (e.preventDefault(), e.repeat) return;
			o.value ? V(o.value) : re();
			return;
		}
		if (!t || e.ctrlKey || e.metaKey || e.altKey || D(e)) return;
		let n = i.find((t) => t.hotkey?.toLowerCase() === e.key.toLowerCase());
		n && (e.preventDefault(), e.repeat || $(n.name));
	}
	return {
		frame: n,
		panels: i,
		rects: R,
		rails: te,
		active: o,
		maximiseAction: ne,
		find: u,
		register: m,
		unregister: h,
		setFrame: g,
		setContentSize: y,
		resize: H,
		move: U,
		commitRect: G,
		resetUnlinkedRect: K,
		toggleLinked: V,
		isCovered: J,
		zIndex: Y,
		activate: X,
		deactivate: Z,
		setCollapsed: Q,
		toggle: $,
		toggleMaximise: re,
		onKeydown: ie
	};
}
//#endregion
//#region components/panelMenus.js
var L = [
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
function R(e) {
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
function z(e) {
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
//#region components/FlowPanelRails.vue
var B = [
	"aria-label",
	"aria-expanded",
	"onClick"
], V = { class: "flow-panel-rail-text" }, H = {
	__name: "FlowPanelRails",
	setup(t) {
		let i = u(O), c = r(() => {
			let { gap: e, leftTop: t } = i.frame, n = {
				left: { top: `${t}px` },
				right: { top: `${e}px` },
				bottom: { left: `${e}px` }
			};
			return Object.entries(i.rails.value).flatMap(([e, t]) => [{
				key: e,
				dock: e,
				panels: t.filter((e) => e.sizing !== "content")
			}, {
				key: `${e}-start`,
				dock: e,
				start: !0,
				style: n[e],
				panels: t.filter((e) => e.sizing === "content")
			}]);
		});
		return (t, r) => (h(!0), o(n, null, y(c.value, (t) => (h(), o(n, { key: t.key }, [t.panels.length ? (h(), o("div", {
			key: 0,
			class: d([
				"flow-rail-group",
				`flow-rail-group--${t.dock}`,
				{ "flow-rail-group--start": t.start }
			]),
			style: f(t.style)
		}, [(h(!0), o(n, null, y(t.panels, (n) => E((h(), o("button", {
			key: n.name,
			type: "button",
			class: d([
				"flow-panel-rail",
				`flow-panel-rail--${t.dock}`,
				{ "is-open": !n.collapsed }
			]),
			"aria-label": `${n.title} panel`,
			"aria-expanded": !n.collapsed,
			onClick: (e) => C(i).toggle(n.name)
		}, [s("span", V, x(n.title), 1)], 10, B)), [[C(e), {
			items: C(L),
			context: n.name
		}]])), 128))], 6)) : a("", !0)], 64))), 128));
	}
}, U = { class: "flow-panel-host-content" }, W = {
	__name: "PanelHost",
	props: {
		layout: {
			type: Object,
			default: null
		},
		storageKey: {
			type: String,
			default: void 0
		},
		autoHideRails: {
			type: Boolean,
			default: !0
		},
		hotkeys: {
			type: Boolean,
			default: !0
		},
		commands: {
			type: Object,
			default: () => ({})
		},
		ignore: {
			type: String,
			default: "[data-reka-popper-content-wrapper]"
		}
	},
	setup(e, { expose: n }) {
		let c = e, u = c.layout ?? I({
			storageKey: c.storageKey,
			autoHideRails: () => c.autoHideRails
		});
		g(O, u);
		let d = R(u), f = r(() => ({
			...d,
			...c.commands
		})), _ = v(null), y = r(() => _.value?.el), x = v(null);
		function S(e, t) {
			let n = document.createElement("div");
			n.style.cssText = `position:absolute;visibility:hidden;width:var(${t})`, e.appendChild(n);
			let r = n.offsetWidth;
			return n.remove(), r;
		}
		function E() {
			let e = y.value;
			if (!e) return;
			let t = x.value, n = S(e, "--flow-panel-radius");
			u.setFrame({
				width: e.clientWidth,
				height: e.clientHeight,
				gap: n,
				leftTop: t ? t.offsetTop + t.offsetHeight + n : n
			});
		}
		let D = new ResizeObserver(E);
		m(() => D.observe(y.value)), w(x, (e, t) => {
			t && D.unobserve(t), e && D.observe(e), E();
		}), p(() => D.disconnect());
		let k = (e) => !!e.target.closest?.(".wm-content");
		function A(e) {
			let t = y.value;
			t.contains(document.activeElement) || t.focus({ preventScroll: !0 }), !(e.target.closest(".flow-panel, .flow-panel-rail") || k(e)) && (c.ignore && e.target.closest(c.ignore) || u.deactivate());
		}
		function j(e) {
			k(e) || u.onKeydown(e, { hotkeys: c.hotkeys });
		}
		return n({
			layout: u,
			el: y,
			open: (e, t) => _.value.open(e, t)
		}), (e, n) => (h(), i(C(t), {
			ref_key: "host",
			ref: _,
			class: "flow-surface flow-panel-host",
			commands: f.value,
			tabindex: "-1",
			onPointerdownCapture: A,
			onKeydown: j
		}, {
			default: T(() => [
				s("div", U, [b(e.$slots, "default")]),
				e.$slots.title ? (h(), o("div", {
					key: 0,
					ref_key: "titleEl",
					ref: x,
					class: "flow-title-bar"
				}, [b(e.$slots, "title")], 512)) : a("", !0),
				b(e.$slots, "panels"),
				l(H)
			]),
			_: 3
		}, 8, ["commands"]));
	}
}, G = ["aria-label"], K = ["onPointerdown"], q = [
	"aria-pressed",
	"aria-label",
	"title"
], J = 4, Y = {
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
	setup(t) {
		let i = t, l = u(O);
		l.register({ ...i }), p(() => l.unregister(i.name));
		let m = r(() => l.find(i.name)), g = r(() => l.rects.value[i.name]);
		w(() => i.title, (e) => m.value.title = e);
		let _ = {
			left: ["e"],
			right: ["w"],
			bottom: ["n"]
		}, S = [
			"n",
			"s",
			"e",
			"w",
			"ne",
			"nw",
			"se",
			"sw"
		], T = i.sizing === "content", D = r(() => m.value.linked ? T && i.dock === "bottom" ? [] : _[i.dock] : S), k = v(null), A = v(null), j = v(null);
		function M() {
			let [e, t, n] = [
				k.value,
				A.value,
				j.value
			];
			e && t && n && l.setContentSize(i.name, {
				width: n.offsetWidth + e.offsetWidth - t.clientWidth,
				height: n.offsetHeight + e.offsetHeight - t.clientHeight
			});
		}
		T && w([j, A], ([e, t], n, r) => {
			if (!e || !t) return;
			let i = new ResizeObserver(M);
			i.observe(e), i.observe(t), r(() => i.disconnect());
		}, { flush: "post" });
		let N = r(() => ({
			left: `${g.value.left}px`,
			top: `${g.value.top}px`,
			width: `${g.value.width}px`,
			height: `${g.value.height}px`,
			zIndex: l.zIndex(i.name)
		})), P = r(() => `${m.value.linked ? "Unlink" : "Link"} ${i.title} panel`), F = !1;
		function I() {
			F = l.isCovered(i.name), l.activate(i.name);
		}
		let R = null, z = !1;
		function B(e) {
			e.button === 0 && (z = !1, R = {
				x: e.clientX,
				y: e.clientY,
				start: { ...g.value },
				moved: !1
			}, e.currentTarget.setPointerCapture(e.pointerId));
		}
		function V(e) {
			if (!R || m.value.linked) return;
			let t = e.clientX - R.x, n = e.clientY - R.y;
			!R.moved && Math.hypot(t, n) < J || (R.moved = !0, l.move(i.name, R.start, t, n));
		}
		function H() {
			R &&= (R.moved && (z = !0, l.commitRect(i.name)), null);
		}
		function U() {
			!z && !F && l.setCollapsed(i.name, !0), z = !1, F = !1;
		}
		let W = null;
		function Y(e, t) {
			t.preventDefault(), W = {
				edge: e,
				x: t.clientX,
				y: t.clientY,
				start: { ...g.value }
			}, t.currentTarget.setPointerCapture(t.pointerId);
		}
		function X(e) {
			W && l.resize(i.name, W.edge, W.start, e.clientX - W.x, e.clientY - W.y);
		}
		function Z() {
			W && (W = null, l.commitRect(i.name));
		}
		return (r, i) => !m.value.collapsed && g.value ? (h(), o("section", {
			key: 0,
			ref_key: "panelEl",
			ref: k,
			class: d([
				"flow-panel",
				`flow-panel--dock-${t.dock}`,
				`flow-panel--${t.sizing}`,
				{
					"is-active": C(l).active.value === t.name,
					"is-unlinked": !m.value.linked
				}
			]),
			style: f(N.value),
			onPointerdown: I
		}, [
			E((h(), o("button", {
				type: "button",
				class: "flow-panel-title",
				"aria-label": `Hide ${t.title} panel`,
				onPointerdown: B,
				onPointermove: V,
				onPointerup: H,
				onPointercancel: H,
				onClick: U
			}, [c(x(t.title), 1)], 40, G)), [[C(e), {
				items: C(L),
				context: t.name
			}]]),
			s("div", {
				ref_key: "bodyEl",
				ref: A,
				class: "flow-panel-body"
			}, [T ? (h(), o("div", {
				key: 0,
				ref_key: "contentEl",
				ref: j,
				class: "flow-panel-content"
			}, [b(r.$slots, "default")], 512)) : b(r.$slots, "default", {}, void 0, void 0, 1)], 512),
			(h(!0), o(n, null, y(D.value, (e) => (h(), o("div", {
				key: e,
				class: d(["flow-panel-resize", `flow-panel-resize--${e}`]),
				onPointerdown: (t) => Y(e, t),
				onPointermove: X,
				onPointerup: Z,
				onPointercancel: Z
			}, null, 42, K))), 128)),
			s("button", {
				type: "button",
				class: "flow-panel-link-btn",
				"aria-pressed": m.value.linked,
				"aria-label": P.value,
				title: `${P.value} (Ctrl+Space)`,
				onClick: i[0] ||= (e) => C(l).toggleLinked(t.name)
			}, [s("span", {
				class: d(["flow-panel-link-icon", m.value.linked ? "is-linked" : "is-unlinked"]),
				"aria-hidden": "true"
			}, null, 2)], 8, q)
		], 38)) : a("", !0);
	}
};
//#endregion
export { z as a, D as c, R as i, W as n, O as o, L as r, I as s, Y as t };
