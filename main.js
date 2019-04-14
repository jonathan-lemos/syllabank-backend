import SQLServer from "./sql";

const main = async () => {
	const con = await SQLServer.create({ user: "root", password: "root" });
	try {
		await con.insert({ course: "COT3210", professor_first: "Egg", professor_last: "Man", time_begin: "13:00:00", time_end: "14:30:00", days: "TR", term: "Fall", year: 2018 });
		await con.insert({ course: "COT3210", professor_first: "Red", professor_last: "Ferrari", time_begin: "14:00:00", time_end: "15:30:00", days: "TR", term: "Fall", year: 2018 });
		let res = await con.select({ course: "COT3210" });
		console.log(JSON.stringify(res) + "\n");
		res = await con.select({ professor_first: "Red", professor_last: "Ferrari" });
		console.log(JSON.stringify(res) + "\n");
		await con.delete({course: "COT3210"});

		await con.insert({ course: "COT3210", professor_first: "Egg", professor_last: "Man", time_begin: "13:00:00", time_end: "14:30:00", days: "TR", term: "Fall", year: 2018 });
		await con.insert({ course: "COT3210", professor_first: "Red", professor_last: "Ferrari", time_begin: "14:00:00", time_end: "15:30:00", days: "TR", term: "Fall", year: 2018 });
		res = await con.select({ course: "COT3210" });
		console.log(JSON.stringify(res) + "\n");

		await con.end();
	}
	catch (e) {
		await con.end();
		throw e;
	}
};

main()
	.catch(s => 
		console.log(s)
	);