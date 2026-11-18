import { Fragment as e, computed as t, createBlock as n, createCommentVNode as r, createElementBlock as i, createElementVNode as a, createTextVNode as o, createVNode as s, inject as c, mergeProps as l, nextTick as u, normalizeClass as d, normalizeStyle as f, openBlock as p, provide as m, ref as ee, renderList as h, renderSlot as g, resolveDynamicComponent as _, shallowRef as te, toDisplayString as v, unref as y, withCtx as b } from "vue";
import { ContextMenuCheckboxItem as x, ContextMenuContent as S, ContextMenuItem as C, ContextMenuItemIndicator as w, ContextMenuLabel as ne, ContextMenuPortal as T, ContextMenuRadioGroup as E, ContextMenuRadioItem as D, ContextMenuRoot as O, ContextMenuSeparator as k, ContextMenuSub as A, ContextMenuSubContent as re, ContextMenuSubTrigger as ie, ContextMenuTrigger as ae } from "reka-ui";
//#region widgets/menu/registry.js
var j = /* @__PURE__ */ new Map();
function M(e, t) {
	j.set(e, t);
}
function N(e) {
	let t = j.get(e);
	if (!t) throw Error(`Unknown menu item type "${e}"`);
	return t;
}
//#endregion
//#region widgets/menu/components/MenuItemContent.vue
var P = {
	key: 0,
	class: "wm-indicator"
}, F = { class: "wm-item-label" }, I = {
	key: 2,
	class: "wm-shortcut"
}, L = {
	key: 3,
	class: "wm-sub-indicator",
	"aria-hidden": "true"
}, R = {
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
		return (n, o) => (p(), i(e, null, [
			t.inset || n.$slots.indicator ? (p(), i("span", P, [g(n.$slots, "indicator")])) : r("", !0),
			t.item.badge ? (p(), i("span", {
				key: 1,
				class: d(["wm-badge", t.item.badge.class]),
				style: f(t.item.badge.color ? { "--wm-badge-color": t.item.badge.color } : null),
				"aria-hidden": "true"
			}, null, 6)) : r("", !0),
			a("span", F, v(t.item.label), 1),
			t.item.shortcut ? (p(), i("span", I, v(t.item.shortcut), 1)) : r("", !0),
			t.submenu ? (p(), i("span", L, "›")) : r("", !0)
		], 64));
	}
};
//#endregion
//#region widgets/menu/tone.js
function z(e) {
	return e ? typeof e == "string" ? { color: e } : e : null;
}
function B(e) {
	return e ? {
		class: ["wm-toned", e.class],
		style: e.color ? { "--wm-tone-color": e.color } : void 0
	} : {};
}
//#endregion
//#region widgets/menu/components/MenuCheckboxItem.vue
var V = {
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
		return (t, r) => (p(), n(y(x), l({ class: "wm-item" }, y(B)(e.item.tone), {
			"model-value": !!e.item.checked,
			disabled: e.item.disabled,
			onSelect: r[0] ||= (t) => e.item.run()
		}), {
			default: b(() => [s(R, { item: e.item }, {
				indicator: b(() => [s(y(w), null, {
					default: b(() => [...r[1] ||= [o("✓", -1)]]),
					_: 1
				})]),
				_: 1
			}, 8, ["item"])]),
			_: 1
		}, 16, ["model-value", "disabled"]));
	}
}, H = {
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
		return (t, r) => (p(), n(y(C), l({ class: "wm-item" }, y(B)(e.item.tone), {
			disabled: e.item.disabled,
			onSelect: r[0] ||= (t) => e.item.run()
		}), {
			default: b(() => [s(R, {
				item: e.item,
				inset: e.inset
			}, null, 8, ["item", "inset"])]),
			_: 1
		}, 16, ["disabled"]));
	}
}, U = {
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
		return (t, r) => (p(), n(y(ne), { class: "wm-label" }, {
			default: b(() => [s(R, {
				item: e.item,
				inset: e.inset
			}, null, 8, ["item", "inset"])]),
			_: 1
		}));
	}
}, W = {
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
			let t = z(e.badge);
			return {
				...e,
				badge: t,
				tone: t ?? r.item.tone
			};
		}
		return (r, c) => (p(), n(y(E), {
			"model-value": t.item.value,
			"onUpdate:modelValue": c[0] ||= (e) => t.item.run(e)
		}, {
			default: b(() => [(p(!0), i(e, null, h(t.item.options.map(a), (e) => (p(), n(y(D), l({
				key: e.value,
				class: "wm-item"
			}, { ref_for: !0 }, y(B)(e.tone), {
				value: e.value,
				disabled: t.item.disabled || !!e.disabled
			}), {
				default: b(() => [s(R, { item: e }, {
					indicator: b(() => [s(y(w), null, {
						default: b(() => [...c[1] ||= [o("●", -1)]]),
						_: 1
					})]),
					_: 1
				}, 8, ["item"])]),
				_: 2
			}, 1040, ["value", "disabled"]))), 128))]),
			_: 1
		}, 8, ["model-value"]));
	}
}, G = {
	__name: "MenuSeparator",
	setup(e) {
		return (e, t) => (p(), n(y(k), { class: "wm-separator" }));
	}
}, K = {
	__name: "MenuItems",
	props: { items: {
		type: Array,
		required: !0
	} },
	setup(r) {
		let a = r, o = t(() => a.items.some((e) => e.type === "checkbox" || e.type === "radio"));
		return (t, a) => (p(!0), i(e, null, h(r.items, (e, t) => (p(), n(_(y(N)(e.type)), {
			key: e.id ?? t,
			item: e,
			inset: o.value
		}, null, 8, ["item", "inset"]))), 128));
	}
}, q = Symbol("seamonster-menu-host"), oe = {
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
		let t = c(q);
		return (r, i) => (p(), n(y(A), null, {
			default: b(() => [s(y(ie), l({ class: "wm-item wm-sub-trigger" }, y(B)(e.item.tone), { disabled: e.item.disabled }), {
				default: b(() => [s(R, {
					item: e.item,
					inset: e.inset,
					submenu: ""
				}, null, 8, ["item", "inset"])]),
				_: 1
			}, 16, ["disabled"]), s(y(T), { to: y(t).el.value }, {
				default: b(() => [s(y(re), {
					class: "wm-content wm-sub-content",
					"collision-padding": 8
				}, {
					default: b(() => [s(K, { items: e.item.items }, null, 8, ["items"])]),
					_: 1
				})]),
				_: 1
			}, 8, ["to"])]),
			_: 1
		}));
	}
};
M("item", H), M("checkbox", V), M("radio", W), M("submenu", oe), M("separator", G), M("label", U);
//#endregion
//#region widgets/menu/regions.js
var J = /* @__PURE__ */ new WeakMap(), Y = Symbol("other-host");
function X(e) {
	return Array.isArray(e) || typeof e == "function" ? { items: e } : e ?? null;
}
var se = {
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
function Z(e, t) {
	for (let n = e; n && n !== t; n = n.parentElement) {
		if (n.hasAttribute("data-wm-host")) return Y;
		if (J.has(n)) return J.get(n);
	}
	return null;
}
//#endregion
//#region widgets/menu/resolveItems.js
var Q = (e, t) => typeof e == "function" ? e(t) : e;
function ce(e, t) {
	let n = e?.[t];
	return n ? typeof n == "function" ? { run: n } : n : null;
}
function le(e) {
	return e.filter((t, n) => t.type !== "separator" || n > 0 && n < e.length - 1 && e[n + 1].type !== "separator");
}
function $(e, t, n, r = null) {
	let i = [];
	for (let a of Q(e, t) ?? []) {
		let e = a.type ?? "item", o = a.command ? ce(n, a.command) : null, s = !!a.command && !o;
		if (s && console.error(`[seamonster/menu] Unknown command "${a.command}"`), Q(a.hidden ?? o?.hidden, t)) continue;
		let c = z(Q(a.badge, t)), l = {
			...a,
			type: e,
			label: Q(a.label ?? o?.label, t),
			badge: c,
			tone: a.tone === !1 ? null : z(Q(a.tone, t)) ?? c ?? r,
			disabled: s || !!Q(a.disabled ?? o?.disabled, t),
			checked: Q(a.checked ?? o?.checked, t),
			value: Q(a.value ?? o?.value, t),
			run: (e) => (a.action ?? o?.run)?.(t, e ?? a.args)
		};
		e === "submenu" && (l.items = $(a.items, t, n, l.tone), !l.items.length) || i.push(l);
	}
	return le(i);
}
//#endregion
//#region widgets/menu/components/MenuHost.vue
var ue = /*@__PURE__*/ Object.assign({ inheritAttrs: !1 }, {
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
		let a = e, o = ee(null), c = te(null), d = null, f = t(() => c.value ? $(c.value.items, c.value.context, a.commands) : []);
		m(q, { el: o });
		function h(e) {
			let t = d ?? Z(e.target, o.value);
			d = null, t !== Y && (c.value = t, f.value.length || e.preventDefault());
		}
		function v(e) {
			if (e.pointerType === "mouse" || !x()?.contains(e.target)) return;
			let t = Z(e.target, o.value);
			c.value = t === Y ? null : t;
		}
		let x = () => o.value?.querySelector(":scope > .wm-trigger");
		function C({ x: e, y: t }, n) {
			let r = X(n);
			c.value = r, u(() => {
				d = r, x()?.dispatchEvent(new MouseEvent("contextmenu", {
					bubbles: !0,
					cancelable: !0,
					clientX: e,
					clientY: t
				}));
			});
		}
		return i({
			el: o,
			open: C
		}), (t, i) => (p(), n(_(e.as), l({
			ref_key: "el",
			ref: o
		}, t.$attrs, {
			"data-wm-host": "",
			onContextmenuCapture: h,
			onPointerdownCapture: v
		}), {
			default: b(() => [s(y(O), { modal: e.modal }, {
				default: b(() => [s(y(ae), {
					as: "div",
					class: "wm-trigger",
					disabled: !f.value.length
				}, {
					default: b(() => [g(t.$slots, "default")]),
					_: 3
				}, 8, ["disabled"]), o.value ? (p(), n(y(T), {
					key: 0,
					to: o.value
				}, {
					default: b(() => [s(y(S), {
						class: "wm-content",
						"collision-padding": 8
					}, {
						default: b(() => [s(K, { items: f.value }, null, 8, ["items"])]),
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
export { N as a, M as i, $ as n, se as r, ue as t };
