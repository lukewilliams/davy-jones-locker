import { r as e, t } from "./menu-ByXvYfw3.js";
import { a as n, n as r, o as i, r as a } from "./FlowPanel-KJLZgxLn.js";
import { Fragment as o, computed as s, createBlock as c, createCommentVNode as l, createElementBlock as u, createElementVNode as d, createVNode as f, inject as p, normalizeClass as m, normalizeStyle as h, onBeforeUnmount as g, onMounted as _, openBlock as v, provide as y, ref as b, renderList as x, renderSlot as S, toDisplayString as C, unref as w, watch as T, withCtx as E, withDirectives as D } from "vue";
//#region components/FlowPanelRails.vue
var O = [
	"aria-label",
	"aria-expanded",
	"onClick"
], k = { class: "flow-panel-rail-text" }, A = {
	__name: "FlowPanelRails",
	setup(t) {
		let i = p(n), a = s(() => {
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
		return (t, n) => (v(!0), u(o, null, x(a.value, (t) => (v(), u(o, { key: t.key }, [t.panels.length ? (v(), u("div", {
			key: 0,
			class: m([
				"flow-rail-group",
				`flow-rail-group--${t.dock}`,
				{ "flow-rail-group--start": t.start }
			]),
			style: h(t.style)
		}, [(v(!0), u(o, null, x(t.panels, (n) => D((v(), u("button", {
			key: n.name,
			type: "button",
			class: m([
				"flow-panel-rail",
				`flow-panel-rail--${t.dock}`,
				{ "is-open": !n.collapsed }
			]),
			"aria-label": `${n.title} panel`,
			"aria-expanded": !n.collapsed,
			onClick: (e) => w(i).toggle(n.name)
		}, [d("span", k, C(n.title), 1)], 10, O)), [[w(e), {
			items: w(r),
			context: n.name
		}]])), 128))], 6)) : l("", !0)], 64))), 128));
	}
}, j = { class: "flow-panel-host-content" }, M = {
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
	setup(e, { expose: r }) {
		let o = e, p = o.layout ?? i({
			storageKey: o.storageKey,
			autoHideRails: () => o.autoHideRails
		});
		y(n, p);
		let m = a(p), h = s(() => ({
			...m,
			...o.commands
		})), x = b(null), C = s(() => x.value?.el), D = b(null);
		function O(e, t) {
			let n = document.createElement("div");
			n.style.cssText = `position:absolute;visibility:hidden;width:var(${t})`, e.appendChild(n);
			let r = n.offsetWidth;
			return n.remove(), r;
		}
		function k() {
			let e = C.value;
			if (!e) return;
			let t = D.value, n = O(e, "--flow-panel-radius");
			p.setFrame({
				width: e.clientWidth,
				height: e.clientHeight,
				gap: n,
				leftTop: t ? t.offsetTop + t.offsetHeight + n : n
			});
		}
		let M = new ResizeObserver(k);
		_(() => M.observe(C.value)), T(D, (e, t) => {
			t && M.unobserve(t), e && M.observe(e), k();
		}), g(() => M.disconnect());
		let N = (e) => !!e.target.closest?.(".wm-content");
		function P(e) {
			let t = C.value;
			t.contains(document.activeElement) || t.focus({ preventScroll: !0 }), !(e.target.closest(".flow-panel, .flow-panel-rail") || N(e)) && (o.ignore && e.target.closest(o.ignore) || p.deactivate());
		}
		function F(e) {
			N(e) || p.onKeydown(e, { hotkeys: o.hotkeys });
		}
		return r({
			layout: p,
			el: C,
			open: (e, t) => x.value.open(e, t)
		}), (e, n) => (v(), c(w(t), {
			ref_key: "host",
			ref: x,
			class: "flow-surface flow-panel-host",
			commands: h.value,
			tabindex: "-1",
			onPointerdownCapture: P,
			onKeydown: F
		}, {
			default: E(() => [
				d("div", j, [S(e.$slots, "default")]),
				e.$slots.title ? (v(), u("div", {
					key: 0,
					ref_key: "titleEl",
					ref: D,
					class: "flow-title-bar"
				}, [S(e.$slots, "title")], 512)) : l("", !0),
				S(e.$slots, "panels"),
				f(A)
			]),
			_: 3
		}, 8, ["commands"]));
	}
};
//#endregion
export { M as t };
