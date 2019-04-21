import deepEqual from "deep-equal";

/**
 * Returns true if two arrays contain the same contents regardless of order.
 * @param {any[]} a
 * @param {any[]} b
 * @returns {boolean}
 */
export function equivalent<T>(a: T[], b: T[]): boolean {
	a = dedupe(a);
	b = dedupe(b);

	const x = new Set();
	if (a.length !== b.length) {
		return false;
	}
	for (const n of a) {
		for (let j = 0; j < b.length; ++j) {
			if (x.has(j)) {
				continue;
			}
			if (deepEqual(n, b[j])) {
				x.add(j);
			}
		}
	}
	return x.size === a.length;
}

/**
 * Removes duplicate entries in an array.
 * @param {any[]} arr
 * @returns {any[]}
 */
export function dedupe<T>(arr: T[]): T[] {
	let output: T[] = [];
	for (let i = 0; i < arr.length; ++i) {
		let j;
		for (j = i + 1; j < arr.length; ++j) {
			if (deepEqual(arr[i], arr[j])) {
				break;
			}
		}
		if (j === arr.length) {
			output = output.concat(arr[i]);
		}
	}
	return output;
}

/**
 * Returns the intersection of two or more arrays.
 * @param  {...any[]} arg
 * @returns {any[]}
 */
export function intersection<T>(...arg: T[][]): T[] {
	if (arg.length === 0) {
		return [];
	}
	let q = dedupe(arg[0]);
	for (let i = 1; i < arg.length; ++i) {
		q = q.filter(e => {
			let found = false;
			for (const f of arg[i]) {
				if (deepEqual(e, f)) {
					found = true;
					break;
				}
			}
			return found;
		});
	}
	return q;
}

/**
 * Returns the union of two or more arrays.
 * @param  {...any[]} arg
 * @returns {any[]}
 */

export function union<T>(...arg: T[][]): T[] {
	return arg.reduce((a, k) => a.concat(dedupe(k)), []);
}

/**
 * Returns the difference of two arrays.
 * @param {any[]} a
 * @param {any[]} b
 * @returns {object} {a: any[], b: any[]}
 */
export function diff<T>(a: T[], b: T[]): {a: T[], b: T[]} {
	a = dedupe(a);
	b = dedupe(b);
	const aret = a.filter(elem => {
		for (const c of b) {
			if (deepEqual(elem, c)) {
				return false;
			}
		}
		return true;
	});
	const bret = b.filter(elem => {
		for (const c of a) {
			if (deepEqual(elem, c)) {
				return false;
			}
		}
		return true;
	});

	return {a: aret, b: bret};
}
