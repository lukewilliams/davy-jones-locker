import { Fragment as e, computed as t, createBlock as n, createElementBlock as r, createElementVNode as i, createTextVNode as a, createVNode as o, normalizeClass as s, openBlock as c, reactive as l, renderList as u, resolveDynamicComponent as d, toDisplayString as f, unref as p, withCtx as m } from "vue";
import { CheckboxIndicator as h, CheckboxRoot as g, Label as _, SelectContent as v, SelectItem as y, SelectItemIndicator as b, SelectItemText as x, SelectPortal as S, SelectRoot as C, SelectTrigger as w, SelectValue as T, SelectViewport as E } from "reka-ui";
//#region widgets/controls/components/CheckboxGroupControl.vue
var D = ["disabled"], O = { class: "wc-label" }, k = {
	__name: "CheckboxGroupControl",
	props: {
		control: {
			type: Object,
			required: !0
		},
		modelValue: {
			type: Array,
			default: () => []
		},
		disabled: {
			type: Boolean,
			default: !1
		},
		disabledOptions: {
			type: Array,
			default: () => []
		}
	},
	emits: ["update:modelValue"],
	setup(t, { emit: n }) {
		let l = t, d = n;
		function v(e) {
			return l.modelValue.includes(e);
		}
		function y(e, t) {
			let n = t ? [...l.modelValue, e] : l.modelValue.filter((t) => t !== e);
			d("update:modelValue", l.control.options.map((e) => e.value).filter((e) => n.includes(e)));
		}
		return (n, l) => (c(), r("fieldset", {
			class: "wc-checkbox-group",
			disabled: t.disabled
		}, [i("legend", O, f(t.control.label), 1), (c(!0), r(e, null, u(t.control.options, (e) => (c(), r("div", {
			key: e.value,
			class: s(["wc-checkbox-row", { "wc-option-disabled": t.disabledOptions.includes(e.value) }])
		}, [o(p(g), {
			id: `${t.control.id}-${e.value}`,
			class: "wc-checkbox",
			disabled: t.disabledOptions.includes(e.value),
			"model-value": v(e.value),
			"onUpdate:modelValue": (t) => y(e.value, t)
		}, {
			default: m(() => [o(p(h), null, {
				default: m(() => [...l[0] ||= [a("✓", -1)]]),
				_: 1
			})]),
			_: 1
		}, 8, [
			"id",
			"disabled",
			"model-value",
			"onUpdate:modelValue"
		]), o(p(_), { for: `${t.control.id}-${e.value}` }, {
			default: m(() => [a(f(e.label), 1)]),
			_: 2
		}, 1032, ["for"])], 2))), 128))], 8, D));
	}
}, A = {
	__name: "SelectControl",
	props: {
		control: {
			type: Object,
			required: !0
		},
		modelValue: {
			type: null,
			default: void 0
		},
		disabled: {
			type: Boolean,
			default: !1
		},
		disabledOptions: {
			type: Array,
			default: () => []
		}
	},
	emits: ["update:modelValue"],
	setup(t) {
		let i = t;
		function s(e) {
			return i.control.options.find((t) => t.value === e)?.label ?? "";
		}
		return (i, l) => (c(), r(e, null, [o(p(_), {
			for: t.control.id,
			class: "wc-label"
		}, {
			default: m(() => [a(f(t.control.label), 1)]),
			_: 1
		}, 8, ["for"]), o(p(C), {
			"model-value": t.modelValue,
			disabled: t.disabled,
			"onUpdate:modelValue": l[0] ||= (e) => i.$emit("update:modelValue", e)
		}, {
			default: m(() => [o(p(w), {
				id: t.control.id,
				class: "wc-select-trigger"
			}, {
				default: m(() => [o(p(T), null, {
					default: m(() => [a(f(s(t.modelValue)), 1)]),
					_: 1
				})]),
				_: 1
			}, 8, ["id"]), o(p(S), null, {
				default: m(() => [o(p(v), {
					class: "wc-select-content",
					position: "popper",
					"side-offset": 4
				}, {
					default: m(() => [o(p(E), null, {
						default: m(() => [(c(!0), r(e, null, u(t.control.options, (e) => (c(), n(p(y), {
							key: e.value,
							value: e.value,
							disabled: t.disabledOptions.includes(e.value),
							class: "wc-select-item"
						}, {
							default: m(() => [o(p(b), null, {
								default: m(() => [...l[1] ||= [a("✓", -1)]]),
								_: 1
							}), o(p(x), null, {
								default: m(() => [a(f(e.label), 1)]),
								_: 2
							}, 1024)]),
							_: 2
						}, 1032, ["value", "disabled"]))), 128))]),
						_: 1
					})]),
					_: 1
				})]),
				_: 1
			})]),
			_: 1
		}, 8, ["model-value", "disabled"])], 64));
	}
}, j = /* @__PURE__ */ new Map();
function M(e, t) {
	j.set(e, t);
}
function N(e) {
	let t = j.get(e);
	if (!t) throw Error(`Unknown control type "${e}"`);
	return t;
}
M("select", {
	component: A,
	createValue: (e) => (e.options.find((e) => e.isDefault) ?? e.options[0]).value
}), M("checkbox_group", {
	component: k,
	createValue: (e) => e.options.filter((e) => e.isDefault).map((e) => e.value),
	toSqlParam: (e) => e.join(",")
});
//#endregion
//#region widgets/controls/createControlPanel.js
function P(e) {
	let n = e, r = /* @__PURE__ */ new Map(), i = {};
	for (let e of n) {
		if (r.has(e.variable)) throw Error(`Duplicate control variable "${e.variable}"`);
		r.set(e.variable, e), i[e.variable] = N(e.type).createValue(e);
	}
	let a = l(i);
	function o(e) {
		let t = r.get(e);
		if (!t) throw Error(`Unknown control variable "${e}"`);
		return t;
	}
	function s(e, t) {
		o(e), a[e] = t;
	}
	function c(e, t) {
		return t.disabledWhen ?? e.disabledWhen ?? null;
	}
	function u(e) {
		return Array.isArray(e.value) ? e.value : [e.value];
	}
	function d(e) {
		let t = a[e.variable];
		return u(e).some((e) => Array.isArray(t) ? t.includes(e) : t === e);
	}
	function f(e, t) {
		let n = c(e, t);
		return !!n && d(n);
	}
	function p(e) {
		return e.options.filter((t) => f(e, t)).map((e) => e.value);
	}
	function m(e) {
		return e.options.length > 0 && e.options.every((t) => f(e, t));
	}
	for (let e of n) for (let t of e.options) {
		let n = c(e, t);
		if (!n) continue;
		let i = r.get(n.variable);
		if (!i) throw Error(`Control "${e.id}" is disabled by unknown variable "${n.variable}"`);
		let a = u(n);
		if (a.length === 0) throw Error(`Control "${e.id}" has a disable rule with no value`);
		for (let t of a) if (!i.options.some((e) => e.value === t)) throw Error(`Control "${e.id}" is disabled by "${t}", which is not an option of "${n.variable}"`);
	}
	function h(...e) {
		return t(() => {
			let t = {};
			for (let n of e) {
				o(n);
				let e = a[n];
				t[n] = Array.isArray(e) ? [...e] : e;
			}
			return t;
		});
	}
	function g(...e) {
		return t(() => {
			let t = {};
			for (let n of e) {
				let { toSqlParam: e } = N(o(n).type), r = a[n];
				t[n] = e ? e(r) : r;
			}
			return t;
		});
	}
	return {
		controls: n,
		values: a,
		setValue: s,
		isDisabled: m,
		isOptionDisabled: f,
		disabledOptions: p,
		pick: h,
		sqlParams: g
	};
}
//#endregion
//#region widgets/controls/adapters/fromRows.js
var F = {
	id: "control_id",
	type: "control_type",
	label: "label",
	variable: "variable",
	optionValue: "option_value",
	optionLabel: "option_label",
	isDefault: "is_default",
	disabledWhenVariable: "disabled_when_variable",
	disabledWhenValue: "disabled_when_value"
};
function I(e) {
	return String(e ?? "").split(",").map((e) => e.trim()).filter(Boolean);
}
function L(e, t = {}) {
	let n = {
		...F,
		...t
	}, r = /* @__PURE__ */ new Map();
	for (let t of e) r.has(t[n.id]) || r.set(t[n.id], {
		id: t[n.id],
		type: t[n.type],
		label: t[n.label],
		variable: t[n.variable],
		options: []
	}), r.get(t[n.id]).options.push({
		value: t[n.optionValue],
		label: t[n.optionLabel],
		isDefault: t[n.isDefault],
		disabledWhen: t[n.disabledWhenVariable] ? {
			variable: t[n.disabledWhenVariable],
			value: I(t[n.disabledWhenValue])
		} : null
	});
	return [...r.values()];
}
//#endregion
//#region widgets/controls/components/ControlPanel.vue
var R = {
	__name: "ControlPanel",
	props: { panel: {
		type: Object,
		required: !0
	} },
	setup(t) {
		return (i, a) => (c(!0), r(e, null, u(t.panel.controls, (e) => (c(), r("div", {
			key: e.id,
			class: "wc-control"
		}, [(c(), n(d(p(N)(e.type).component), {
			control: e,
			"model-value": t.panel.values[e.variable],
			disabled: t.panel.isDisabled(e),
			"disabled-options": t.panel.disabledOptions(e),
			"onUpdate:modelValue": (n) => t.panel.setValue(e.variable, n)
		}, null, 8, [
			"control",
			"model-value",
			"disabled",
			"disabled-options",
			"onUpdate:modelValue"
		]))]))), 128));
	}
};
//#endregion
export { R as ControlPanel, P as createControlPanel, M as defineControlType, L as fromRows, N as getControlType };
