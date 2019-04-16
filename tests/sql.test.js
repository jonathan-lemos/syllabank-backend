import {equivalent} from "../sets";
import SQLServer from "../sql";

describe("sql tests", () => {
	const login = {
		username: "root",
		password: "root",
	};

	const sampleFiles = [
		{filename: "ferrari.pdf"},
		{filename: "foo.pdf"},
		{filename: "yeet.pdf"},
		{filename: "a.pdf"},
		{filename: "b.pdf"},
		{filename: "c.pdf"},
	];

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
		{filename: "yeet.pdf", course: "COT3100", first_name: "Egg", last_name: "Man", time_begin: "14:30:00", time_end: "15:45:00", days: "TR", term: "Fall", year: 2018},
		{filename: "foo.pdf", course: "COP9999", first_name: "Egg", last_name: "Man", time_begin: "16:00:00", time_end: "17:30:00", days: "TR", term: "Fall", year: 2018},
		{filename: "ferrari.pdf", course: "COT3100", first_name: "Red", last_name: "Ferrari", time_begin: "12:30:00", time_end: "13:45:00", days: "TR", term: "Fall", year: 2018},
		{filename: "a.pdf", course: "COP3503", first_name: "Red", last_name: "Ferrari", time_begin: "06:00:00", time_end: "09:00:00", days: "MWF", term: "Spring", year: 2017},
		{filename: "b.pdf", course: "COP3503", first_name: "Pain", last_name: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Spring", year: 2017},
		{filename: "c.pdf", course: "COP9999", first_name: "Pain", last_name: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Fall", year: 2017 },
	];

	beforeEach(() => {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
	});

	it("inserts entries properly", async () => {
		let con;
		con = await SQLServer.create(login);

		await con.nuke();
		con = await SQLServer.create(login);

		await con.insertFiles(sampleFiles);
		await con.insertCourses(sampleCourses);
		await con.insertProfessors(sampleProfessors);
		await con.insertSyllaviews(sampleSyllaviews);

		const resf = await con.selectFiles({});
		expect(resf.length).toEqual(6);

		const exp1 = [
			{ course: "COT3100", first_name: "Egg", last_name: "Man", time_begin: "14:30:00", time_end: "15:45:00", days: "TR", term: "Fall", year: 2018 },
			{ course: "COP9999", first_name: "Egg", last_name: "Man", time_begin: "16:00:00", time_end: "17:30:00", days: "TR", term: "Fall", year: 2018 },
			{ course: "COT3100", first_name: "Red", last_name: "Ferrari", time_begin: "12:30:00", time_end: "13:45:00", days: "TR", term: "Fall", year: 2018 },
			{ course: "COP3503", first_name: "Red", last_name: "Ferrari", time_begin: "06:00:00", time_end: "09:00:00", days: "MWF", term: "Spring", year: 2017 },
			{ course: "COP3503", first_name: "Pain", last_name: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Spring", year: 2017 },
			{ course: "COP9999", first_name: "Pain", last_name: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Fall", year: 2017 },
		];
		const res1 = await con.selectSyllaviews({});
		res1.forEach(s => delete s.file_id);
		expect(equivalent(res1, exp1)).toEqual(true);

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
			{ course: "COP9999", name: "Finding Jesus with Fortran", description: null },
		];
		const res4 = await con.selectCourses({});
		expect(equivalent(res4, exp4)).toEqual(true);

		await con.nuke();
	});

	it("selects single attribute properly", async () => {
		let con = await SQLServer.create(login);
		await con.nuke();
		con = await SQLServer.create(login);

		await con.insertFiles(sampleFiles);
		await con.insertCourses(sampleCourses);
		await con.insertProfessors(sampleProfessors);
		await con.insertSyllaviews(sampleSyllaviews);

		const exp1 = [
			{course: "COT3100", first_name: "Egg", last_name: "Man", time_begin: "14:30:00", time_end: "15:45:00", days: "TR", term: "Fall", year: 2018},
			{course: "COT3100", first_name: "Red", last_name: "Ferrari", time_begin: "12:30:00", time_end: "13:45:00", days: "TR", term: "Fall", year: 2018},
		];
		const res1 = await con.selectSyllaviews({ course: "COT3100" });
		res1.forEach(s => delete s.file_id);
		expect(equivalent(exp1, res1)).toEqual(true);

		await con.nuke();
	});

	it("selects multiple attributes properly", async () => {
		let con = await SQLServer.create(login);
		await con.nuke();
		con = await SQLServer.create(login);

		await con.insertFiles(sampleFiles);
		await con.insertCourses(sampleCourses);
		await con.insertProfessors(sampleProfessors);
		await con.insertSyllaviews(sampleSyllaviews);

		const exp1 = [
			{course: "COP9999", first_name: "Egg", last_name: "Man", time_begin: "16:00:00", time_end: "17:30:00", days: "TR", term: "Fall", year: 2018},
			{course: "COP9999", first_name: "Pain", last_name: "Man", time_begin: "06:00:00", time_end: "09:00:00", days: "MW", term: "Fall", year: 2017 },
		];
		const res1 = await con.selectSyllaviews({ course: "COP9999", last_name: "Man" });
		res1.forEach(s => delete s.file_id);
		expect(equivalent(exp1, res1)).toEqual(true);

		await con.nuke();
	});

	it("selects professors properly", async () => {
		let con = await SQLServer.create(login);
		await con.nuke();
		con = await SQLServer.create(login);

		await con.insertFiles(sampleFiles);
		await con.insertCourses(sampleCourses);
		await con.insertProfessors(sampleProfessors);
		await con.insertSyllaviews(sampleSyllaviews);

		const exp1 = [
			{first_name: "Egg", last_name: "Man", n_number: "N00000001"},
			{first_name: "Pain", last_name: "Man", n_number: "N99999999"},
		];
		const res1 = await con.selectProfessors({ last_name: "Man" });
		expect(equivalent(exp1, res1)).toEqual(true);

		await con.nuke();
	});

	it("selects courses properly", async () => {
		let con = await SQLServer.create(login);
		await con.nuke();
		con = await SQLServer.create(login);

		await con.insertFiles(sampleFiles);
		await con.insertCourses(sampleCourses);
		await con.insertProfessors(sampleProfessors);
		await con.insertSyllaviews(sampleSyllaviews);

		const exp1 = [
			{course: "COP3503", name: "CS2", description: "welcome to java hell"},
		];
		const res1 = await con.selectCourses({ name: "CS2" });
		expect(equivalent(exp1, res1)).toEqual(true);

		await con.nuke();
	});

	it("selects files properly", async () => {
		let con = await SQLServer.create(login);
		await con.nuke();
		con = await SQLServer.create(login);

		await con.insertFiles(sampleFiles);
		await con.insertCourses(sampleCourses);
		await con.insertProfessors(sampleProfessors);
		await con.insertSyllaviews(sampleSyllaviews);

		const res1 = await con.selectFiles({ filename: "ferrari.pdf" });
		expect(res1.length).toEqual(1);

		await con.nuke();
	});

	it("matches the file_id to the filename", async () => {
		let con = await SQLServer.create(login);
		await con.nuke();
		con = await SQLServer.create(login);

		await con.insertFiles(sampleFiles);
		await con.insertCourses(sampleCourses);
		await con.insertProfessors(sampleProfessors);
		await con.insertSyllaviews(sampleSyllaviews);

		const exp1 = [
			{course: "COT3100", first_name: "Egg", last_name: "Man", time_begin: "14:30:00", time_end: "15:45:00", days: "TR", term: "Fall", year: 2018},
		];
		const res1 = await con.selectSyllaviews({ course: "COT3100", first_name: "Egg" });
		expect(res1.length).toEqual(1);

		const res2 = await con.selectFiles({filename: "yeet.pdf"});
		expect(res2.length).toEqual(1);

		exp1[0]["file_id"] = res2[0]["file_id"];

		expect(equivalent(exp1, res1)).toEqual(true);

		await con.nuke();
	});
});

