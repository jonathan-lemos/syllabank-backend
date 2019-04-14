import {equivalent} from "../sets";
import SQLServer from "../sql";

describe("sql tests", () => {
	const login = {
		username: "root",
		password: "root",
	};

	const sampleData = [
		{filename: "yeet.pdf", course: "COT3210", professor_first: "Egg", professor_last: "Man", time_begin: "14:30:00", time_end: "15:45:00", days: "TR", term: "Fall", year: 2018},
		{course: "COT3210", professor_first: "Red", professor_last: "Ferrari", time_begin: "12:30:00", time_end: "13:45:00", days: "TR", term: "Fall", year: 2018},
		{course: "COP3503", professor_first: "Er", professor_last: "En", time_begin: "12:30:00", time_end: "13:45:00", days: "MWF", term: "Fall", year: 2018},
	];

	const sampleRes = sampleData.map(s => Object.assign({filename: null}, s));

	it("inserts entries properly", async () => {
		let con = await SQLServer.create(login);
		con.nuke();
		con = await SQLServer.create(login);

		await con.insert(sampleData);

		const res = await con.select({});
		expect(equivalent(res, sampleRes)).toEqual(true);

		await con.nuke();
	});

	it("selects entries properly", async () => {
		let con = await SQLServer.create(login);
		con.nuke();
		con = await SQLServer.create(login);

		await con.insert(sampleData);

		const res = await con.select({course: "COT3210"});
		expect(equivalent(res, sampleRes.slice(0, 2))).toEqual(true);

		const res2 = await con.select({time_begin: "12:30:00", time_end: "13:45:00"});
		expect(equivalent(res2, sampleRes.slice(1))).toEqual(true);

		await con.nuke();
	});

	it("deletes entries properly", async () => {
		let con = await SQLServer.create(login);
		con.nuke();
		con = await SQLServer.create(login);

		await con.insert(sampleData);

		await con.delete({course: "COT3210"});
		const res = await con.select({course: "COT3210"});
		expect(equivalent(res, [])).toEqual(true);

		const res2 = await con.select({time_begin: "12:30:00", time_end: "13:45:00"});
		expect(equivalent(res2, sampleRes.slice(2))).toEqual(true);

		await con.delete({});
		const res3 = await con.select({time_begin: "12:30:00", time_end: "13:45:00"});
		expect(equivalent(res3, [])).toEqual(true);

		await con.insert(sampleData);

		await con.delete({course: "COT3210", professor_first: "Egg"});
		const res4 = await con.select({course: "COT3210"});
		expect(equivalent(res4, sampleRes.slice(1, 2))).toEqual(true);

		await con.nuke();
	});

});
