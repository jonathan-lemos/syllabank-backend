import mysql from "mysql";

const DB_NAME = "syllabank";
const SYLLABUS_TABLE_NAME = "sylabi";
const SyllabusEntryKeys = ["filename", "course", "professor_first", "professor_last", "time_begin", "time_end", "days", "term", "year"];

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
 * Returns true if a given object is a full SyllabusEntry, meaning
 * {
 *     filename: string | null
 *     course: string
 *     professor_first: string
 *     professor_last: string
 *     time_begin: string
 *     time_end: string
 *     days: string
 *     term: string
 *     year: number
 * }
 * and no other keys.
 * @param {any} se 
 * @returns {boolean}
 */
const isSyllabusEntry = se => {
	if (typeof se !== "object") {
		return false;
	}

	return Object.keys(se).length === 9 &&
	(se["filename"] == null || typeof se["filename"] === "string") &&
	typeof se["course"] === "string" &&
	typeof se["professor_first"] === "string" &&
	typeof se["professor_last"] === "string" &&
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
const isPartialSyllabusEntry = se => {
	if (typeof se !== "object") {
		return false;
	}

	return isSyllabusEntry(Object.assign({
		filename: null,
		course: "",
		professor_first: "",
		professor_last: "",
		time_begin: "",
		time_end: "",
		days: "",
		term: "",
		year: 0
	}, Object.assign({}, se)));
};

/**
 * Generates an insert statement for an array of SyllabusEntries
 * @param {Object[]} seArray The entries to generate an insert statement for.
 * @param {string[]} values  The order of keys to put in the insert statement.
 * @returns {string}
 */
const insertValues = (seArray, values) => seArray.reduce((a, v) => {
	return a + ",(" +
		values.reduce((b, c) => b + "," + mysql.escape(v[c]), "").slice(1) + ")";
}, "").slice(1);

/**
 * Generates a WHERE clause ANDing all the fields in a partial SyllabusEntry
 * @throws If the given object is not a partial SyllabusEntry
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

	if (!isPartialSyllabusEntry(se)) {
		throw new Error("Given object is not a partial SyllabusEntry");
	}

	for (const key in se) {
		addAnd();
		ret += key + " = " + mysql.escape(se[key]);
	}

	return ret;
};

/**
 * Class for interfacing with the backend MySQL server.
 *
 * At the moment there is only one table:
 * -------------------------------------------------------------------------------------------------------------------------------
 * |                                                 ${SYLLABUS_TABLE_NAME}                                                      |
 * |----------------------------------------------------------------------------------|------------------------------------------|
 * |     name        |              type                 |          flags             |               description                |
 * |-----------------|-----------------------------------|----------------------------|-------------------------------------------
 * | id              | INT                               | AUTO INCREMENT PRIMARY KEY | Integer primary key for fast indexing.   |
 * | filename        | VARCHAR(65535)                    | NULL                       | Filename.                                |
 * | course          | CHAR(7)                           | NOT NULL                   | Course code of professor.                |
 * | professor_first | VARCHAR(255)                      | NOT NULL                   | First name of professor.                 |
 * | professor_last  | VARCHAR(255)                      | NOT NULL                   | Last name of professor.                  |
 * | time_begin      | TIME                              | NOT NULL                   | Start time of class.                     |
 * | time_end        | TIME                              | NOT NULL                   | End time of class.                       |
 * | days            | ENUM('MWF', 'TR', 'MW', 'Online') | NOT NULL                   | The days the class takes place on.       |
 * | term            | ENUM('Spring', 'Summer', 'Fall')  | NOT NULL                   | The time of year a class takes place in. |
 * | year            | INT                               | NOT NULL                   | The year a class takes place in.         |
 * -------------------------------------------------------------------------------------------------------------------------------
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
			const iCreateTable = () => new Promise((res, rej) => {
				const sql =
					`CREATE TABLE IF NOT EXISTS ${SYLLABUS_TABLE_NAME} (` +
					"id INT NOT NULL AUTO_INCREMENT," +
					"filename TEXT NULL," +
					"course CHAR(7) NOT NULL," +
					"professor_first VARCHAR(255) NOT NULL," +
					"professor_last VARCHAR(255) NOT NULL," +
					"time_begin TIME NOT NULL," +
					"time_end TIME NOT NULL," +
					"days ENUM('MWF', 'TR', 'MW', 'Online') NOT NULL," +
					"term ENUM('Spring', 'Summer', 'Fall') NOT NULL," +
					"year INT NOT NULL," +
					"PRIMARY KEY (id)" +
					");";
				con2.query(sql, err => {
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
	 * Deletes any entries that match all of the conditions given in the field.
	 * Fields can be an array, in which case it will delete for all SyllabusEntries of the array.
	 * @param {Partial<SyllabusEntry>[] | Partial<SyllabusEntry>} fields An array or a single partial SyllabusEntry
	 * @returns {Promise<void>}
	 */
	async delete(fields) {
		if (!Array.isArray(fields)) {
			fields = [fields];
		}
		return Promise.all(fields.map(s => {
			try {
				return this._query(`DELETE FROM ${SYLLABUS_TABLE_NAME} ` + partialWhere(s) + ";");
			}
			catch (e) {
				return Promise.reject(errToString(e));
			}
		}));
	}

	/**
	 * Inserts all the given entries into the field.
	 * All the columns should be specified except the id column, which is auto-generated.
	 * Fields can be an array, in which case it will insert for all SyllabusEntries of the array.
	 * @param {SyllabusEntry[] | SyllabusEntry} fields An array or a single SyllabusEntry
	 * @returns {Promise<void>}
	 */
	async insert(fields) {
		if (!Array.isArray(fields)) {
			fields = [fields];
		}

		const q = fields.map(s => Object.assign({filename: null}, s));

		return this._query(`INSERT INTO ${SYLLABUS_TABLE_NAME} (${SyllabusEntryKeys.join(",")}) VALUES ` + insertValues(q, SyllabusEntryKeys) + ";");
	}

	/**
	 * Selects from the database.
	 * @param {SyllabusEntry} fields An object containing the fields to select.
	 * For example, { course: "COT3210", professor_last: "Asai" } returns all rows where course = 'COT3210' AND professor_last = 'Asai'
	 * See the table above for a list of fields.
	 * @returns {Promise<SyllabusEntry[]>}
	 */
	async select(fields) {
		if (!isPartialSyllabusEntry(fields)) {
			return Promise.reject("fields needs to be a partial SyllabusEntry object.");
		}

		try {
			return this._query(`SELECT ${SyllabusEntryKeys.join(",")} FROM ${SYLLABUS_TABLE_NAME} ` + partialWhere(fields) + ";");
		}
		catch (e) {
			return Promise.reject(errToString(e));
		}
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
