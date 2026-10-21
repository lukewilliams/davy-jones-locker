//#region lib/results.js
function e(e, t = null, n = null) {
	let r = t === null ? e : e?.slots?.find((e) => e.name === t) ?? null;
	if (!r) return null;
	if (r.data) return {
		table: null,
		data: r.data,
		extras: r.extras
	};
	let i = r.tables?.find((e) => e.name === n) ?? r.tables?.[0];
	return i ? {
		table: i.name,
		data: i.data,
		extras: i.extras
	} : null;
}
function t(e) {
	let t = [], n = (e, n) => {
		n?.data && t.push({
			slot: e,
			table: null,
			label: n.ref ?? null,
			data: n.data,
			extras: n.extras
		});
		for (let r of n?.tables ?? []) t.push({
			slot: e,
			table: r.name,
			label: r.label,
			data: r.data,
			extras: r.extras
		});
	};
	n(null, e);
	for (let t of e?.slots ?? []) n(t.name, t);
	return t;
}
//#endregion
//#region lib/flowGraphKey.js
var n = Symbol("flow-graph");
//#endregion
export { e as n, t as r, n as t };
