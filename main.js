import SQLServer from "./sql";
import WebServer from "./web";
import dotenv from "dotenv";
import fs from "fs";
import papa from "papaparse";

/**
 * Converts all "null" values in an object to null
 * @param obj {object} The object
 * @returns {object}
 */
const convertNulls = obj => {
	if (typeof obj !== "object") {
		throw new Error("obj must be an object");
	}
	Object.keys(obj).forEach(k => {
		if (typeof obj[k] == "object") {
			obj[k] = convertNulls(obj[k]);
		}
		if (obj[k] === "null") {
			obj[k] = null;
		}
	});
	return obj;
};

/**
 * Converts a csv (file) into an array of json objects.
 * @param {string} filename The file
 * @returns {Promise<object[]>}
 */
const parseCsv = filename => new Promise((resolve, reject) => {
	const stream = fs.createReadStream(filename, "utf8");
	papa.parse(stream, {
		dynamicTyping: true,
		header: true,
		worker: true,
		complete: results => {
			if (results.error) {
				reject(results.error.map(s => s.message).join(","));
				return;
			}
			resolve(results.data);
		},
	});
});

dotenv.config();
const vars = {
	COURSE_CSV: process.env.COURSE_CSV || null,
	PROFESSOR_CSV: process.env.PROFESSOR_CSV || null,
	FILENAME_CSV: process.env.FILENAME_CSV || null,
	SYLLABI_CSV: process.env.SYLLABI_CSV || null,
	DB_HOST: process.env.DB_HOST || "localhost",
	DB_NAME: process.env.DB_NAME || "syllabank",
	DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
	DB_USER: process.env.DB_USER || "root",
	DB_PASSWORD: process.env.DB_PASSWORD || "root",
	WEB_PORT: parseInt(process.env.WEB_PORT, 10) || 80,
	WEB_PDF_DIR: process.env.WEB_PDF_DIR || "pdfs",
};

const insertCsvs = async (con) => {
	if (vars.COURSE_CSV !== null) {
		const courses = (await parseCsv(vars.COURSE_CSV)).map(convertNulls);
		await con.insertCourses(courses);
	}

	if (vars.PROFESSOR_CSV !== null) {
		const profs = (await parseCsv(vars.PROFESSOR_CSV)).map(convertNulls);
		await con.insertProfessors(profs);
	}

	if (vars.FILENAME_CSV !== null) {
		const filenames = (await parseCsv(vars.FILENAME_CSV)).map(convertNulls);
		await con.insertFiles(filenames);
	}

	if (vars.SYLLABI_CSV !== null) {
		const syllabi = (await parseCsv(vars.SYLLABI_CSV)).map(convertNulls);
		console.log(syllabi);
		syllabi.forEach(s => s.filename = "the.pdf");
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
