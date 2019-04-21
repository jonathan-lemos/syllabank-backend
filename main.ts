import SQLServer from "./sql";
import WebServer from "./web";
import dotenv from "dotenv";
import parseCsv from "./csv";
import { CourseEntry, FileEntry, Syllaview, ProfessorEntry, Syllinsert } from "./sql";

dotenv.config();
const vars = {
	COURSE_CSV: process.env.COURSE_CSV || null,
	PROFESSOR_CSV: process.env.PROFESSOR_CSV || null,
	FILENAME_CSV: process.env.FILENAME_CSV || null,
	SYLLABI_CSV: process.env.SYLLABI_CSV || null,
	DB_HOST: process.env.DB_HOST || "localhost",
	DB_NAME: process.env.DB_NAME || "syllabank",
	DB_PORT: parseInt(process.env.DB_PORT || "3306", 10),
	DB_USER: process.env.DB_USER || "root",
	DB_PASSWORD: process.env.DB_PASSWORD || "root",
	WEB_PORT: parseInt(process.env.WEB_PORT || "80", 10),
	WEB_PDF_DIR: process.env.WEB_PDF_DIR || "pdfs",
};

const insertCsvs = async (con) => {
	if (vars.COURSE_CSV !== null) {
		const courses = (await parseCsv(vars.COURSE_CSV) as CourseEntry[]);
		await con.insertCourses(courses);
	}

	if (vars.PROFESSOR_CSV !== null) {
		const profs = (await parseCsv(vars.PROFESSOR_CSV) as ProfessorEntry[]);
		await con.insertProfessors(profs);
	}

	if (vars.FILENAME_CSV !== null) {
		const filenames = (await parseCsv(vars.FILENAME_CSV) as FileEntry[]);
		await con.insertFiles(filenames);
	}

	if (vars.SYLLABI_CSV !== null) {
		const syllabi = (await parseCsv(vars.SYLLABI_CSV) as Syllinsert[]);
		await con.insertSyllaviews(syllabi);
	}
};

const main = async () => {
	const con = await SQLServer.create({database: vars.DB_NAME, user: vars.DB_USER, password: vars.DB_PASSWORD, port: vars.DB_PORT, host: vars.DB_HOST});
	await insertCsvs(con);

	const web = new WebServer(con, {port: vars.WEB_PORT, basePdfDir: vars.WEB_PDF_DIR});
	await web.listen().then(() => console.log(`Express listening on port ${vars.WEB_PORT}`));
};

main().catch(s => console.log(s));
