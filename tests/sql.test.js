import {equivalent} from "../sets";
import SQLServer from "../sql";
import { exportAllDeclaration } from "@babel/types";

describe("sql tests", () => {
	const login = {
		username: "root",
		password: "root",
	};

	const sampleCourses = [
		{course: "COT3100", name: "Comp Structures", description: "common sense stuff"},
		{course: "COP3503", name: "CS2", description: "welcome to java hell"},
		{course: "COP9999", name: "Finding Jesus with Fortran"},
	];

	const sampleProfessors = [
		{first_name: "Egg", last_name: "Man", n_number: "N00000001"},
		{first_name: "Red", last_name: "Ferrari", n_number: "N01234567"},
		{first_name: "Pain", last_name: "Man", n_number: "N99999999"},
	];

	const sampleSyllaviews = [
		{filename: "yeet.pdf", course: "COT3100", professor_first: "Egg", professor_last: "Man", time_begin: "14:30:00", time_end: "15:45:00", days: "TR", term: "Fall", year: 2018},
		{filename: "foo.pdf", course: "COP9999", professor_first: "Egg", professor_last: "Man", time_begin: "16:00:00", time_end: "17:30:00", days: "TR", term: "Fall", year: 2018},
		{filename: "ferrari.pdf", course: "COT3100", professor_first: "Red", professor_last: "Ferrari", time_begin: "12:30:00", time_end: "13:45:00", days: "TR", term: "Fall", year: 2018},
		{course: "COP3503", professor_first: "Red", professor_last: "Ferrari", time_begin: "06:00:00", time_end: "09:00:00", days: "MWF", term: "Spring", year: 2017},
		{course: "COP3503", professor_first: "Pain", professor_last: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Spring", year: 2017},
		{course: "COP9999", professor_first: "Pain", professor_last: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Fall", year: 2017 },
	];

	test("inserts entries properly", async () => {
		try {
			let con = await SQLServer.create(login);

			con.nuke();
			con = await SQLServer.create(login);

			await con.insert(sampleCourses);
			await con.insert(sampleProfessors);
			await con.insert(sampleSyllaviews);

			const exp1 = [
				{ filename: "yeet.pdf", course: "COT3100", professor_first: "Egg", professor_last: "Man", time_begin: "14:30:00", time_end: "15:45:00", days: "TR", term: "Fall", year: 2018 },
				{ filename: "foo.pdf", course: "COP9999", professor_first: "Egg", professor_last: "Man", time_begin: "16:00:00", time_end: "17:30:00", days: "TR", term: "Fall", year: 2018 },
				{ filename: "ferrari.pdf", course: "COT3100", professor_first: "Red", professor_last: "Ferrari", time_begin: "12:30:00", time_end: "13:45:00", days: "TR", term: "Fall", year: 2018 },
				{ filename: null, course: "COP3503", professor_first: "Red", professor_last: "Ferrari", time_begin: "06:00:00", time_end: "09:00:00", days: "MWF", term: "Spring", year: 2017 },
				{ filename: null, course: "COP3503", professor_first: "Pain", professor_last: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Spring", year: 2017 },
				{ filename: null, course: "COP9999", professor_first: "Pain", professor_last: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Fall", year: 2017 },
			];
			const res1 = await con.select({});
			expect(equivalent(res1, exp1)).toEqual(true);

			const exp2 = [
				{ filename: "yeet.pdf", course: "COT3100", professor_first: "Egg", professor_last: "Man", time_begin: "14:30:00", time_end: "15:45:00", days: "TR", term: "Fall", year: 2018 },
				{ filename: "foo.pdf", course: "COP9999", professor_first: "Egg", professor_last: "Man", time_begin: "16:00:00", time_end: "17:30:00", days: "TR", term: "Fall", year: 2018 },
				{ filename: "ferrari.pdf", course: "COT3100", professor_first: "Red", professor_last: "Ferrari", time_begin: "12:30:00", time_end: "13:45:00", days: "TR", term: "Fall", year: 2018 },
				{ filename: null, course: "COP3503", professor_first: "Red", professor_last: "Ferrari", time_begin: "06:00:00", time_end: "09:00:00", days: "MWF", term: "Spring", year: 2017 },
				{ filename: null, course: "COP3503", professor_first: "Pain", professor_last: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Spring", year: 2017 },
				{ filename: null, course: "COP9999", professor_first: "Pain", professor_last: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Fall", year: 2017 },
			];
			const res2 = await con.selectSyllaviews({});
			expect(equivalent(res2, exp2)).toEqual(true);

			const exp3 = [
				{ first_name: "Egg", last_name: "Man", n_number: "N00000001" },
				{ first_name: "Red", last_name: "Ferrari", n_number: "N01234567" },
				{ first_name: "Pain", last_name: "Man", n_number: "N99999999" },
			];
			const res3 = await con.selectProfessors({});
			expect(equivalent(res3, exp3)).toEqual(true);

			const exp4 = [
				{ course: "COT3100", name: "Comp Structures", description: "common sense stuff" },
				{ course: "COP3503", name: "CS2", description: "welcome to java hell" },
				{ course: "COP9999", name: "Finding Jesus with Fortran" },
			];
			const res4 = await con.selectCourses({});
			expect(equivalent(res4, exp4)).toEqual(true);

			await con.nuke();
		}
		catch (e) {
			throw new Error(e);
		}
	});

	/*
	it("selects entries properly", async () => {
		let con = await SQLServer.create(login);
		con.nuke();
		con = await SQLServer.create(login);

		await con.insert(sampleCourses);
		await con.insert(sampleProfessors);
		await con.insert(sampleSyllaviews);

		const res = await con.select({ course: "COT3210" });
		expect(equivalent(res, sampleRes.slice(0, 2))).toEqual(true);

		const res2 = await con.select({ time_begin: "12:30:00", time_end: "13:45:00" });
		expect(equivalent(res2, sampleRes.slice(1))).toEqual(true);

		await con.nuke();
	});
	*/

});
