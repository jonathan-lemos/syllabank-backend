import SQLServer from "./sql";
import WebServer from "./web";
import dotenv from "dotenv";

dotenv.config();
const vars = {
	DB_HOST: process.env.DB_HOST || "localhost",
	DB_NAME: process.env.DB_NAME || "syllabank",
	DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
	DB_USER: process.env.DB_USER || "root",
	DB_PASSWORD: process.env.DB_PASSWORD || "root",
	WEB_PORT: parseInt(process.env.WEB_PORT, 10) || 80,
};

const main = async () => {
	const con = await SQLServer.create({database: vars.DB_NAME, user: vars.DB_USER, password: vars.DB_PASSWORD, port: vars.DB_PORT, host: vars.DB_HOST});
	const web = new WebServer(con, vars.WEB_PORT);
	await web.listen().then(() => console.log("Express listening on port 80"));
};

main().catch(s => console.log(s));