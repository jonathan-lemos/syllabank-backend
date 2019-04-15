import mysql from "mysql";

const DB_NAME = "syllabank";
const SYLLAVIEW = "syllaview";
const SYLLABUS_TABLE = "syllabi";
const PROFESSOR_TABLE = "professors";
const COURSES_TABLE = "courses";

/**
 * Converts an error to a string.
 * A given SQL error returns the bad query along with the error message.
 * A given string is just returned.
 * A given unknown object is turned into JSON.
 * A given Error returns its message.
 * null/undefined return the string "Null error"
 * @param {any} e 
 * @returns {string} The converted error.
 */
const errToString = e => {
	if (e == null) {
		return "Null error";
	}
	if (typeof e === "string") {
		return e;
	}
	if (e.sql !== undefined && e.sqlMessage !== undefined) {
		return `Bad query ${e.sql}\n${e.sqlMessage}`;
	}
	if (e.message !== undefined) {
		return e.message;
	}
	return JSON.stringify(e);
};

/**
 * Returns true if a given object is a full SyllaView, meaning
 * {
 *     filename?: string
 *     course: string
 *     first_name?: string
 *     last_name?: string
 *     time_begin: string
 *     time_end: string
 *     days: string
 *     term: string
 *     year: number
 * }
 * first_name and/or last_name must be specified.
 * @param {any} se 
 * @returns {boolean}
 */
const isSyllaview = se => {
	if (typeof se !== "object") {
		return false;
	}

	return (se["filename"] == undefined || typeof se["filename"] === "string") &&
	typeof se["course"] === "string" &&
	(typeof se["first_name"] === "string" || typeof se["last_name"] === "string") &&
	(typeof se["first_name"] === "string" || se["first_name"] === undefined) &&
	(typeof se["last_name"] === "string" || se["last_name"] === undefined) &&
	typeof se["time_begin"] === "string" &&
	typeof se["time_end"] === "string" &&
	typeof se["days"] === "string" &&
	typeof se["term"] === "string" &&
	typeof se["year"] === "number";
};

/**
 * Returns true if an object is a subset of the above
 * @param {any} se 
 * @returns {boolean}
 */
const isPartialSyllaview = se => {
	if (typeof se !== "object") {
		return false;
	}

	return isSyllaview(Object.assign({
		filename: null,
		course: "",
		first_name: "",
		last_name: "",
		time_begin: "",
		time_end: "",
		days: "",
		term: "",
		year: 0
	}, Object.assign({}, se)));
};

/**
 * Returns true if a given object is a full ProfessorEntry, meaning
 * {
 *     first: string
 *     last: string
 *     n_number: string
 * }
 * @param {any} pe 
 * @returns {boolean}
 */
const isProfessorEntry = pe => {
	if (typeof pe !== "object") {
		return false;
	}

	return typeof pe["first"] === "string" &&
	typeof pe["last"] === "string" &&
	typeof pe["n_number"] === "string";
};

/**
 * Returns true if an object is a subset of the above
 * @param {any} se 
 * @returns {boolean}
 */
const isPartialProfessorEntry = se => {
	if (typeof se !== "object") {
		return false;
	}

	return isProfessorEntry(Object.assign({
		first: "",
		last: "",
		n_number: "",
	}, Object.assign({}, se)));
};

/**
 * Returns true if a given object is a full ProfessorEntry, meaning
 * {
 *     course: string
 *     name: string
 *     description?: string
 * }
 * @param {any} ce 
 * @returns {boolean}
 */
const isCourseEntry = pe => {
	if (typeof pe !== "object") {
		return false;
	}

	return typeof pe["first"] === "string" &&
	typeof pe["name"] === "string" &&
	(pe["description"] === undefined || typeof pe["description"] === "string");
};

/**
 * Returns true if an object is a subset of the above
 * @param {any} se 
 * @returns {boolean}
 */
const isPartialCourseEntry = se => {
	if (typeof se !== "object") {
		return false;
	}

	return isCourseEntry(Object.assign({
		first: "",
		name: "",
		description: "",
	}, Object.assign({}, se)));
};

/**
 * Generates a WHERE clause ANDing all the fields in an object
 * @param {Object} se 
 * @returns {string}
 */
const partialWhere = se => {
	let ret = "";
	let first = true;

	const addAnd = () => {
		if (first) {
			ret += "WHERE ";
			first = false;
		}
		else {
			ret += " AND ";
		}
	};

	for (const key in se) {
		addAnd();
		ret += key + " = " + mysql.escape(se[key]);
	}

	return ret;
};

/**
 * Class for interfacing with the backend MySQL server.
 *
 * Schema:
 * -------------------------------------------------------------------------------------------------------------------------------
 * |                                                 ${SYLLABUS_TABLE}                                                      |
 * |-----------------------------------------------------------------------------------------------------------------------------|
 * |     name        |              type                 |          flags             |               description                |
 * |-----------------|-----------------------------------|----------------------------|------------------------------------------|
 * | id              | INT                               | AUTO_INCREMENT PRIMARY KEY | Integer primary key for fast indexing.   |
 * | filename        | VARCHAR(65535)                    | NULL                       | Filename.                                |
 * | course          | CHAR(7)                           | NOT NULL                   | Course code of professor.                |
 * | professor       | INT                               | FOREIGN KEY                | Professor. References professor table id |
 * | time_begin      | TIME                              | NOT NULL                   | Start time of class.                     |
 * | time_end        | TIME                              | NOT NULL                   | End time of class.                       |
 * | days            | ENUM('MWF', 'TR', 'MW', 'Online') | NOT NULL                   | The days the class takes place on.       |
 * | term            | ENUM('Spring', 'Summer', 'Fall')  | NOT NULL                   | The time of year a class takes place in. |
 * | year            | INT                               | NOT NULL                   | The year a class takes place in.         |
 * -------------------------------------------------------------------------------------------------------------------------------
 * 
 * -----------------------------------------------------------------------------------------------------
 * |                                    ${PROFESSOR_TABLE}                                        |
 * |---------------------------------------------------------------------------------------------------|
 * |    name    |    type      |          flags             |               description                |
 * |------------|--------------|----------------------------|------------------------------------------|
 * | id         | INT          | AUTO_INCREMENT PRIMARY KEY | Integer primary key for fast indexing.   |
 * | first_name | VARCHAR(255) | NOT NULL                   | First name of professor.                 |
 * | last_name  | VARCHAR(255) | NOT NULL                   | Last name of professor.                  |
 * | n_number   | CHAR(9)      | NOT NULL                   | Professor N-Number.                      |
 * ---------------------------------------------------------------------------------------------------
 */
export default class SQLServer {

	/**
	 * Queries the database.
	 * Do not use this directly.
	 * If successful, it returns a JSON array describing the query.
	 * On failure, it returns a string detailing the error.
	 * @param {string} query          The query to execute
	 * @param {Array}  preparedParams Any prepared parameters to put in.
	 */
	async _query(query, preparedParams) {
		return new Promise((resolve, reject) => {
			const cb = (err, results) => {
				if (err) {
					reject(errToString(err));
					return;
				}
				resolve(results);
			};

			if (preparedParams !== undefined) {
				this.con.query(query, preparedParams, cb);
			}
			else {
				this.con.query(query, cb);
			}
		});
	}

	/**
	 * Creates an SqlServer instance.
	 * This is the only way to initialize an SqlServer, as constructors cannot be used for asynchronous code.
	 *
	 * @param {string} host     The host to connect to. By default this is "localhost"
	 * @param {string} password The password of the user account to connect to.
	 * @param {number} port     The port to connect to. By default this is 3306.
	 * @param {string} user     The user to log into. By default this is "root".
	 *
	 * @returns {Promise<SQLServer>} A Promise that will contain a new SqlServer or an error (string) detailing what happened.
	 */
	static async create({ host = "localhost", password, port = 3306, user = "root" }) {
		return new Promise(async (resolve, reject) => {
			// connection without database (in case the db does not exist yet)
			const con1 = mysql.createConnection({
				host,
				password,
				port,
				user,
			});

			// connection with database
			const con2 = mysql.createConnection({
				database: DB_NAME,
				host,
				password,
				port,
				user,
			});

			const connect = con => new Promise((res, rej) => {
				con.connect(err => {
					if (err) {
						rej(errToString(err));
						return;
					}
					res();
					return;
				});
			});

			const execute = (con, query) => new Promise((res, rej) => {
				con.query(query, err => {
					if (err) {
						rej(errToString(err));
						return;
					}
					res();
					return;
				});
			});

			await connect(con1);
			await execute(con1, `CREATE DATABASE IF NOT EXISTS ${DB_NAME};`);
			con1.end();
			await connect(con2);

			await Promise.all(
				execute(con2, `
					CREATE TABLE IF NOT EXISTS ${PROFESSOR_TABLE} (
						id INT AUTO_INCREMENT PRIMARY KEY,
						first_name VARCHAR(255) NOT NULL,
						last_name VARCHAR(255) NOT NULL,
						n_number CHAR(9) NOT NULL,
					);
				`),
				execute(con2, `
					CREATE TABLE IF NOT EXISTS ${COURSES_TABLE} (
						course CHAR(7) PRIMARY KEY,
						name VARCHAR(255) NOT NULL,
						description VARCHAR(4096) NULL,
					);
				`),
				execute(con2, `
 					CREATE TABLE IF NOT EXISTS ${SYLLABUS_TABLE} (
						id INT AUTO_INCREMENT PRIMARY KEY,
						filename TEXT NULL,
						course CHAR(7) NOT NULL,
						professor INT NOT NULL,
						time_begin TIME NOT NULL,
						time_end TIME NOT NULL,
						days ENUM('MWF', 'TR', 'MW', 'Online') NOT NULL,
						term ENUM('Spring', 'Summer', 'Fall') NOT NULL,
						year INT NOT NULL,
						FOREIGN KEY (professor) REFERENCES ${PROFESSOR_TABLE}(id),
						FOREIGN KEY (course) REFERENCES ${COURSES_TABLE}(course)
					); 
				`),
				execute(con2, `
					CREATE OR REPLACE VIEW ${SYLLAVIEW} AS
					SELECT S.filename, S.course, P.first_name, P.last_name, P.nnumber, S.time_begin, S.time_end, S.days, S.term, S.year
					FROM ${SYLLABUS_TABLE} S, ${PROFESSOR_TABLE} P, ${COURSES_TABLE} T
					WHERE S.professor = P.id;
				`),
			);


			// connects to the sql server with no database selected
			const iConnect = () => new Promise((res, rej) => {
				con1.connect(err => {
					if (err) {
						rej(errToString(err));
						return;
					}
					res();
					return;
				});
			});

			// creates the database if it doesn't exist
			const iCreateDb = () => new Promise((res, rej) => {
				con1.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME};`, err => {
					if (err) {
						rej(errToString(err));
						return;
					}
					res();
					return;
				});
			});

			// connects to the newly made database
			const iReconnect = () => new Promise((res, rej) => {
				con2.connect(err => {
					if (err) {
						rej(errToString(err));
						return;
					}
					res();
					return;
				});
			});

			// creates the tables
			const iCreateTables = () => new Promise((res, rej) => {
				const sql1 =
					`
					CREATE TABLE IF NOT EXISTS ${PROFESSOR_TABLE} (
						id INT AUTO_INCREMENT PRIMARY KEY,
						first_name VARCHAR(255) NOT NULL,
						last_name VARCHAR(255) NOT NULL,
						n_number CHAR(9) NOT NULL,
					);
					`;
				const sql2 = `
					CREATE TABLE IF NOT EXISTS ${COURSES_TABLE} (
						course CHAR(7) PRIMARY KEY,
						name VARCHAR(255) NOT NULL,
						description VARCHAR(4096) NULL,
					);
					`;
				const sql3 = `	
					CREATE TABLE IF NOT EXISTS ${SYLLABUS_TABLE} (
						id INT AUTO_INCREMENT PRIMARY KEY,
						filename TEXT NULL,
						course CHAR(7) NOT NULL,
						professor INT NOT NULL,
						time_begin TIME NOT NULL,
						time_end TIME NOT NULL,
						days ENUM('MWF', 'TR', 'MW', 'Online') NOT NULL,
						term ENUM('Spring', 'Summer', 'Fall') NOT NULL,
						year INT NOT NULL,
						FOREIGN KEY (professor) REFERENCES ${PROFESSOR_TABLE}(id),
						FOREIGN KEY (course) REFERENCES ${COURSES_TABLE}(course)
					);
					`;
				const sql4 = `	
					CREATE OR REPLACE VIEW ${SYLLAVIEW} AS
					SELECT S.filename, S.course, P.first_name, P.last_name, P.nnumber, S.time_begin, S.time_end, S.days, S.term, S.year
					FROM ${SYLLABUS_TABLE} S, ${PROFESSOR_TABLE} P, ${COURSES_TABLE} T
					WHERE S.professor = P.id;
					`;
				con2.query(sql1, err => {
					if (err) {
						rej(errToString(err));
						return;
					}
					res();
					return;
				});
			});

			try {
				await iConnect();
				await iCreateDb();
				con1.end();
				await iReconnect();
				await iCreateTable();
			}
			catch (e) {
				reject(errToString(e));
				return;
			}

			resolve(new SQLServer(con2, DB_NAME));
			return;
		});
	}

	/**
	 * Private constructor. Do not use.
	 * Instead, use SQLServer.create() to create a server
	 * @param {mysql.Connection} con    MySQL.Connection created from SQLServer.create()
	 * @param {string}           dbName The name of the database to connect to.
	 */
	constructor(con, dbName) {
		this.con = con;
		this.dbName = dbName;
	}

	/**
	 * Inserts all the given entries into the field.
	 * All the columns should be specified except the id column, which is auto-generated.
	 * Fields can be an array, in which case it will insert for all SyllabusEntries of the array.
	 * @param {Object[] | Object} fields An array or a single SyllabusEntry
	 * @returns {Promise<void>}
	 */
	async insert(fields) {
		if (!Array.isArray(fields)) {
			fields = [fields];
		}
		const a = fields.filter(s => isCourseEntry(s));
		const b = fields.filter(s => isProfessorEntry(s));
		const c = fields.filter(s => isSyllaview(s));

		return Promise.all(this.insertCourses(a), this.insertProfessors(b), this.insertSyllaviews(c));
	}

	/**
	 * Inserts a course into the table.
	 * @param {CourseEntry[] | CourseEntry} fields An array or a single Course to insert
	 * @returns {Promise<void>}
	 */
	async insertCourses(fields) {
		if (!Array.isArray(fields)) {
			fields = [fields];
		}

		const q = fields.map(s => {
			if (!isCourseEntry(s)) {
				throw new Error("All arguments of insertCourse must be CourseEntries");
			}

			return [
				s.course,
				s.name,
				s.description
			];
		});

		return this._query(`INSERT INTO ${COURSES_TABLE} VALUES ? ON DUPLICATE KEY UPDATE course=course;`, q);
	}

	/**
	 * Inserts a course into the table.
	 * @param {ProfessorEntry[] | ProfessorEntry} fields An array or a single Professor to insert
	 * @returns {Promise<void>}
	 */
	async insertProfessors(fields) {
		if (!Array.isArray(fields)) {
			fields = [fields];
		}

		const q = fields.map(s => {
			if (!isProfessorEntry(s)) {
				throw new Error("All arguments of insertCourse must be CourseEntries");
			}

			return [
				s.first_name,
				s.last_name,
				s.n_number,
			];
		});

		return this._query(`INSERT INTO ${PROFESSOR_TABLE} (first_name, last_name, n_number) VALUES ? ON DUPLICATE KEY UPDATE id=id;`, q);
	}

	/**
	 * Inserts a SyllaView into the table.
	 * All the columns of the SyllaView except the filename and first OR last name must be specified.
	 * @param {SyllabusEntry[] | SyllabusEntry} fields An array or a single SyllabusEntry
	 * @returns {Promise<void>}
	 */
	async insertSyllaviews(fields) {
		const profToId = async ({ first, last }) => {
			if (typeof first !== "string" && typeof last !== "string") {
				return Promise.reject("Need to give a first name or last name");
			}
			if (typeof first === "string" && typeof last === "string") {
				first = mysql.escape(first);
				last = mysql.escape(last);
				const res = await this._query(`SELECT id FROM ${PROFESSOR_TABLE} WHERE first_name=${first} AND last_name=${last};`);
				const ids = res.map(s => s["id"]);
				return ids;
			}
			if (typeof first === "string") {
				first = mysql.escape(first);
				const res = await this._query(`SELECT id FROM ${PROFESSOR_TABLE} WHERE first_name=${first};`);
				const ids = res.map(s => s["id"]);
				return ids;
			}
			else {
				last = mysql.escape(last);
				const res = await this._query(`SELECT id FROM ${PROFESSOR_TABLE} WHERE first_name=${first};`);
				const ids = res.map(s => s["id"]);
				return ids;
			}
		};

		if (!Array.isArray(fields)) {
			fields = [fields];
		}

		const q = await Promise.all(fields.map(async s => {
			if (!isSyllaview(s)) {
				throw new Error("All arguments of insertSyllaview must be Syllaviews");
			}

			const ids = await profToId({ first: s.first_name, last: s.last_name });
			if (ids.length === 0) {
				throw new Error(`No professor found with first: "${s.first_name}" and last: "${s.last_name}"`);
			}

			return [
				s.filename,
				s.course,
				profToId({ first: s.first_name, last: s.last_name })[0],
				s.time_begin,
				s.time_end,
				s.days,
				s.term,
				s.year
			];
		}));


		const keys = ["filename", "course", "professor", "time_begin", "time_end", "days", "term", "year"];

		return this._query(`INSERT INTO ${SYLLABUS_TABLE} (${keys.join(",")}) VALUES ? ON DUPLICATE KEY UPDATE id=id;`, q);
	}

	/**
	 * Selects from the database.
	 * @param {Partial<SyllabusEntry>} fields An object containing the fields to select.
	 * For example, { course: "COT3210", professor_last: "Asai" } returns all rows where course = 'COT3210' AND professor_last = 'Asai'
	 * An empty object selects all the fields from the database.
	 * See the table above for a list of fields.
	 * @returns {Promise<SyllabusEntry[]>}
	 */
	async select(fields) {
		if (isPartialSyllaview(fields)) {
			return this.selectSyllaviews(fields);
		}
		if (isPartialProfessorEntry(fields)) {
			return this.selectProfessors(fields);
		}
		if (isPartialCourseEntry(fields)) {
			return this.selectCourses(fields);
		}
		return Promise.reject("Given object does not correspond to a Syllaview, Professor, or Course selector");
	}

	/**
	 * Selects syllabus entries from the database.
	 * @param {Partial<SyllabusEntry>} fields An object containing the fields to select.
	 * For example, { course: "COT3210", professor_last: "Asai" } returns all rows where course = 'COT3210' AND professor_last = 'Asai'
	 * An empty object selects all the entries from the table.
	 * See the table above for a list of fields.
	 * @returns {Promise<SyllabusEntry[]>}
	 */
	async selectSyllaviews(fields) {
		if (!isPartialSyllaview(fields)) {
			return Promise.reject("fields needs to be a partial SyllabusEntry object.");
		}

		return this._query(`SELECT * FROM ${SYLLAVIEW} ${partialWhere(fields)};`);
	}

	/**
	 * Selects syllabus entries from the database.
	 * @param {Partial<ProfessorEntry>} fields An object containing the fields to select.
	 * For example, { course: "COT3210", professor_last: "Asai" } returns all rows where course = 'COT3210' AND professor_last = 'Asai'
	 * An empty object selects all the fields from the database.
	 * See the table above for a list of fields.
	 * @returns {Promise<ProfessorEntry[]>}
	 */
	async selectProfessors(fields) {
		if (!isPartialProfessorEntry(fields)) {
			return Promise.reject("fields needs to be a partial SyllabusEntry object.");
		}

		return this._query(`SELECT first_name, last_name, n_number FROM ${PROFESSOR_TABLE} ${partialWhere(fields)};`);
	}

	/**
	 * Selects from the database.
	 * @param {Partial<SyllabusEntry>} fields An object containing the fields to select.
	 * For example, { course: "COT3210", professor_last: "Asai" } returns all rows where course = 'COT3210' AND professor_last = 'Asai'
	 * An empty object selects all the fields from the database.
	 * See the table above for a list of fields.
	 * @returns {Promise<SyllabusEntry[]>}
	 */
	async selectCourses(fields) {
		if (!isPartialCourseEntry(fields)) {
			return Promise.reject("fields needs to be a partial SyllabusEntry object.");
		}

		return this._query(`SELECT * FROM ${COURSES_TABLE} ${partialWhere(fields)};`);
	}


	/**
	 * Ends the connection to the SQL server.
	 * @returns {Promise<void>}
	 */
	async end() {
		return new Promise((resolve, reject) => {
			this.con.end(err => {
				if (err) {
					reject(errToString(err));
					return;
				}
				resolve();
				return;
			});
		});
	}

	/**
	 * Ends the connection to the SQL server and drops all data associated with syllabank.
	 * @returns {Promise<void>}
	 */
	async nuke() {
		return new Promise((resolve, reject) => {
			this._query(`DROP DATABASE ${DB_NAME}`);
			this.con.end(err => {
				if (err) {
					reject(errToString(err));
					return;
				}
				resolve();
				return;
			});
		});
	}
}
