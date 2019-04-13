import SQLServer from "./sql";

const main = async () => {
	try {
		const con = await SQLServer.create({user: "root", password: "root"});
		con.insert({course: "COT3210", professor_first: "Egg", professor_last: "Man", time_begin: "13:00:00", time_end: "14:30:00", days: "TR", term: "Fall", year: 2018});
		con.select({course: "COT3210"});
	}
	catch (e) {
		console.log(e);
		return;
	}
};

main();