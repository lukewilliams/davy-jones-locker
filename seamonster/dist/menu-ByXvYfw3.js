import { Fragment as e, computed as t, createBlock as n, createCommentVNode as r, createElementBlock as i, createElementVNode as a, createTextVNode as o, createVNode as s, inject as c, mergeProps as l, normalizeClass as u, normalizeStyle as d, openBlock as f, provide as p, ref as m, renderList as h, renderSlot as g, resolveDynamicComponent as _, shallowRef as v, toDisplayString as y, unref as b, withCtx as x } from "vue";
import { ContextMenuCheckboxItem as S, ContextMenuContent as C, ContextMenuItem as w, ContextMenuItemIndicator as T, ContextMenuLabel as E, ContextMenuPortal as D, ContextMenuRadioGroup as O, ContextMenuRadioItem as ee, ContextMenuRoot as te, ContextMenuSeparator as ne, ContextMenuSub as re, ContextMenuSubContent as ie, ContextMenuSubTrigger as ae, ContextMenuTrigger as k } from "reka-ui";
//#region widgets/menu/registry.js
var A = /* @__PURE__ */ new Map();
function j(e, t) {
	A.set(e, t);
}
function M(e) {
	let t = A.get(e);
	if (!t) throw Error(`Unknown menu item type "${e}"`);
	return t;
}
//#endregion
//#region widgets/menu/components/MenuItemContent.vue
var N = {
	key: 0,
	class: "wm-indicator"
}, P = { class: "wm-item-label" }, F = {
	key: 2,
	class: "wm-shortcut"
}, I = {
	key: 3,
	class: "wm-sub-indicator",
	"aria-hidden": "true"
}, L = {
	__name: "MenuItemContent",
	props: {
		item: {
			type: Object,
			required: !0
		},
		inset: {
			type: Boolean,
			default: !1
		},
		submenu: {
			type: Boolean,
			default: !1
		}
	},
	setup(t) {
		return (n, o) => (f(), i(e, null, [
			t.inset || n.$slots.indicator ? (f(), i("span", N, [g(n.$slots, "indicator")])) : r("", !0),
			t.item.badge ? (f(), i("span", {
				key: 1,
				class: u(["wm-badge", t.item.badge.class]),
				style: d(t.item.badge.color ? { "--wm-badge-color": t.item.badge.color } : null),
				"aria-hidden": "true"
			}, null, 6)) : r("", !0),
			a("span", P, y(t.item.label), 1),
			t.item.shortcut ? (f(), i("span", F, y(t.item.shortcut), 1)) : r("", !0),
			t.submenu ? (f(), i("span", I, "›")) : r("", !0)
		], 64));
	}
};
//#endregion
//#region widgets/menu/tone.js
function R(e) {
	return e ? typeof e == "string" ? { color: e } : e : null;
}
function z(e) {
	return e ? {
		class: ["wm-toned", e.class],
		style: e.color ? { "--wm-tone-color": e.color } : void 0
	} : {};
}
//#endregion
//#region widgets/menu/components/MenuCheckboxItem.vue
var B = {
	__name: "MenuCheckboxItem",
	props: {
		item: {
			type: Object,
			required: !0
		},
		inset: {
			type: Boolean,
			default: !1
		}
	},
	setup(e) {
		return (t, r) => (f(), n(b(S), l({ class: "wm-item" }, b(z)(e.item.tone), {
			"model-value": !!e.item.checked,
			disabled: e.item.disabled,
			onSelect: r[0] ||= (t) => e.item.run()
		}), {
			default: x(() => [s(L, { item: e.item }, {
				indicator: x(() => [s(b(T), null, {
					default: x(() => [...r[1] ||= [o("✓", -1)]]),
					_: 1
				})]),
				_: 1
			}, 8, ["item"])]),
			_: 1
		}, 16, ["model-value", "disabled"]));
	}
}, V = {
	__name: "MenuItem",
	props: {
		item: {
			type: Object,
			required: !0
		},
		inset: {
			type: Boolean,
			default: !1
		}
	},
	setup(e) {
		return (t, r) => (f(), n(b(w), l({ class: "wm-item" }, b(z)(e.item.tone), {
			disabled: e.item.disabled,
			onSelect: r[0] ||= (t) => e.item.run()
		}), {
			default: x(() => [s(L, {
				item: e.item,
				inset: e.inset
			}, null, 8, ["item", "inset"])]),
			_: 1
		}, 16, ["disabled"]));
	}
}, H = {
	__name: "MenuLabel",
	props: {
		item: {
			type: Object,
			required: !0
		},
		inset: {
			type: Boolean,
			default: !1
		}
	},
	setup(e) {
		return (t, r) => (f(), n(b(E), { class: "wm-label" }, {
			default: x(() => [s(L, {
				item: e.item,
				inset: e.inset
			}, null, 8, ["item", "inset"])]),
			_: 1
		}));
	}
}, U = {
	__name: "MenuRadioGroup",
	props: {
		item: {
			type: Object,
			required: !0
		},
		inset: {
			type: Boolean,
			default: !1
		}
	},
	setup(t) {
		let r = t;
		function a(e) {
			let t = R(e.badge);
			return {
				...e,
				badge: t,
				tone: t ?? r.item.tone
			};
		}
		return (r, c) => (f(), n(b(O), {
			"model-value": t.item.value,
			"onUpdate:modelValue": c[0] ||= (e) => t.item.run(e)
		}, {
			default: x(() => [(f(!0), i(e, null, h(t.item.options.map(a), (e) => (f(), n(b(ee), l({
				key: e.value,
				class: "wm-item"
			}, { ref_for: !0 }, b(z)(e.tone), {
				value: e.value,
				disabled: t.item.disabled || !!e.disabled
			}), {
				default: x(() => [s(L, { item: e }, {
					indicator: x(() => [s(b(T), null, {
						default: x(() => [...c[1] ||= [o("●", -1)]]),
						_: 1
					})]),
					_: 1
				}, 8, ["item"])]),
				_: 2
			}, 1040, ["value", "disabled"]))), 128))]),
			_: 1
		}, 8, ["model-value"]));
	}
}, W = {
	__name: "MenuSeparator",
	setup(e) {
		return (e, t) => (f(), n(b(ne), { class: "wm-separator" }));
	}
}, G = {
	__name: "MenuItems",
	props: { items: {
		type: Array,
		required: !0
	} },
	setup(r) {
		let a = r, o = t(() => a.items.some((e) => e.type === "checkbox" || e.type === "radio"));
		return (t, a) => (f(!0), i(e, null, h(r.items, (e, t) => (f(), n(_(b(M)(e.type)), {
			key: e.id ?? t,
			item: e,
			inset: o.value
		}, null, 8, ["item", "inset"]))), 128));
	}
}, K = Symbol("seamonster-menu-host"), q = {
	__name: "MenuSubmenu",
	props: {
		item: {
			type: Object,
			required: !0
		},
		inset: {
			type: Boolean,
			default: !1
		}
	},
	setup(e) {
		let t = c(K);
		return (r, i) => (f(), n(b(re), null, {
			default: x(() => [s(b(ae), l({ class: "wm-item wm-sub-trigger" }, b(z)(e.item.tone), { disabled: e.item.disabled }), {
				default: x(() => [s(L, {
					item: e.item,
					inset: e.inset,
					submenu: ""
				}, null, 8, ["item", "inset"])]),
				_: 1
			}, 16, ["disabled"]), s(b(D), { to: b(t).el.value }, {
				default: x(() => [s(b(ie), {
					class: "wm-content wm-sub-content",
					"collision-padding": 8
				}, {
					default: x(() => [s(G, { items: e.item.items }, null, 8, ["items"])]),
					_: 1
				})]),
				_: 1
			}, 8, ["to"])]),
			_: 1
		}));
	}
};
j("item", V), j("checkbox", B), j("radio", U), j("submenu", q), j("separator", W), j("label", H);
//#endregion
//#region widgets/menu/regions.js
var J = /* @__PURE__ */ new WeakMap(), Y = Symbol("other-host");
function X(e) {
	return Array.isArray(e) || typeof e == "function" ? { items: e } : e ?? null;
}
var oe = {
	mounted(e, { value: t }) {
		J.set(e, X(t));
	},
	updated(e, { value: t }) {
		J.set(e, X(t));
	},
	unmounted(e) {
		J.delete(e);
	}
};
function se(e, t) {
	for (let n = e; n && n !== t; n = n.parentElement) {
		if (n.hasAttribute("data-wm-host")) return Y;
		if (J.has(n)) return J.get(n);
	}
	return null;
}
//#endregion
//#region widgets/menu/resolveItems.js
var Z = (e, t) => typeof e == "function" ? e(t) : e;
function ce(e, t) {
	let n = e?.[t];
	return n ? typeof n == "function" ? { run: n } : n : null;
}
function le(e) {
	return e.filter((t, n) => t.type !== "separator" || n > 0 && n < e.length - 1 && e[n + 1].type !== "separator");
}
function Q(e, t, n, r = null) {
	let i = [];
	for (let a of Z(e, t) ?? []) {
		let e = a.type ?? "item", o = a.command ? ce(n, a.command) : null, s = !!a.command && !o;
		if (s && console.error(`[seamonster/menu] Unknown command "${a.command}"`), Z(a.hidden ?? o?.hidden, t)) continue;
		let c = R(Z(a.badge, t)), l = {
			...a,
			type: e,
			label: Z(a.label ?? o?.label, t),
			badge: c,
			tone: a.tone === !1 ? null : R(Z(a.tone, t)) ?? c ?? r,
			disabled: s || !!Z(a.disabled ?? o?.disabled, t),
			checked: Z(a.checked ?? o?.checked, t),
			value: Z(a.value ?? o?.value, t),
			run: (e) => (a.action ?? o?.run)?.(t, e ?? a.args)
		};
		e === "submenu" && (l.items = Q(a.items, t, n, l.tone), !l.items.length) || i.push(l);
	}
	return le(i);
}
//#endregion
//#region widgets/menu/components/MenuHost.vue
var $ = /*@__PURE__*/ Object.assign({ inheritAttrs: !1 }, {
	__name: "MenuHost",
	props: {
		as: {
			type: String,
			default: "div"
		},
		commands: {
			type: Object,
			default: () => ({})
		},
		modal: {
			type: Boolean,
			default: !0
		}
	},
	setup(e, { expose: i }) {
		let a = e, o = m(null), c = v(null), u = null, d = t(() => c.value ? Q(c.value.items, c.value.context, a.commands) : []);
		p(K, { el: o });
		function h(e) {
			let t = u ?? se(e.target, o.value);
			u = null, t !== Y && (c.value = t, d.value.length || e.preventDefault());
		}
		function y({ x: e, y: t }, n) {
			u = X(n), o.value.querySelector(":scope > .wm-trigger").dispatchEvent(new MouseEvent("contextmenu", {
				bubbles: !0,
				cancelable: !0,
				clientX: e,
				clientY: t
			}));
		}
		return i({
			el: o,
			open: y
		}), (t, i) => (f(), n(_(e.as), l({
			ref_key: "el",
			ref: o
		}, t.$attrs, {
			"data-wm-host": "",
			onContextmenuCapture: h
		}), {
			default: x(() => [s(b(te), { modal: e.modal }, {
				default: x(() => [s(b(k), {
					as: "div",
					class: "wm-trigger"
				}, {
					default: x(() => [g(t.$slots, "default")]),
					_: 3
				}), o.value ? (f(), n(b(D), {
					key: 0,
					to: o.value
				}, {
					default: x(() => [s(b(C), {
						class: "wm-content",
						"collision-padding": 8
					}, {
						default: x(() => [s(G, { items: d.value }, null, 8, ["items"])]),
						_: 1
					})]),
					_: 1
				}, 8, ["to"])) : r("", !0)]),
				_: 3
			}, 8, ["modal"])]),
			_: 3
		}, 16));
	}
});
//#endregion
export { M as a, j as i, Q as n, oe as r, $ as t };
