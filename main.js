import SQLServer from "./sql";
import WebServer from "./web";

const main = async () => {
	const con = await SQLServer.create({user: "root", password: "root"});
	const web = new WebServer(con, 3000);
	await web.listen().then(() => console.log("Express listening on port 80"));
};

main()
	.catch(s => 
		console.log(s)
	);