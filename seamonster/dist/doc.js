import { Fragment as e, computed as t, createElementBlock as n, normalizeClass as r, openBlock as i, renderList as a } from "vue";
import { marked as o } from "marked";
//#region widgets/doc/adapters/fromRows.js
var s = {
	id: "doc_id",
	tag: "tag",
	body: "body"
};
function c(e, t = {}) {
	let n = {
		...s,
		...t
	};
	return e.map((e) => ({
		id: e[n.id],
		tag: e[n.tag] ?? "",
		body: e[n.body] ?? ""
	}));
}
//#endregion
//#region widgets/doc/components/DocView.vue
var l = ["innerHTML"], u = {
	__name: "DocView",
	props: {
		documents: {
			type: Array,
			required: !0
		},
		prefix: {
			type: String,
			default: "md-doc"
		}
	},
	setup(s) {
		let c = s, u = t(() => c.documents.map((e, t) => ({
			key: e.id ?? t,
			classes: e.tag ? [c.prefix, `${c.prefix}-${e.tag}`] : [c.prefix],
			html: o.parse(e.body ?? "", {
				gfm: !0,
				async: !1
			})
		})));
		return (t, o) => (i(!0), n(e, null, a(u.value, (e) => (i(), n("article", {
			key: e.key,
			class: r(e.classes),
			innerHTML: e.html
		}, null, 10, l))), 128));
	}
};
//#endregion
export { u as DocView, c as fromRows };
