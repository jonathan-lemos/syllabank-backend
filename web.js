import express from "express";
import path from "path";

export default class WebServer {
	static _senderror(res, msg) {
		res.status(400).send(msg);
	}

	constructor(sqlcon, port = 80, baseDir = path.join(__dirname, "/site"), defaultFile = "index.html") {
		if (typeof port !== "number") {
			throw new Error("Port must be a number");
		}

		if (typeof baseDir !== "string") {
			throw new Error("baseDir must be a string");
		}

		if (typeof defaultFile !== "string") {
			throw new Error("defaultFile must be a string");
		}

		this.nodeServer = null;
		this.con = sqlcon;
		this.port = port;
		this.web = express();
		this.web.use(express.static(baseDir));
		this.web.get("/", (req, res) => res.sendFile(path.join(baseDir, defaultFile)));

		this.web.get("/api/select", async (req, res) => {
			try {
				res.json(await this.con.select(req.query));
			}
			catch (e) {
				WebServer._senderror(res, e);
			}
		});

		this.web.get("/api/selectSylabi", async (req, res) => {
			try {
				res.json(await this.con.selectProfessors(req.query));
			}
			catch (e) {
				WebServer._senderror(res, e);
			}
		});

		this.web.get("/api/selectProfessors", async (req, res) => {
			try {
				res.json(await this.con.selectProfessors(req.query));
			}
			catch (e) {
				WebServer._senderror(res, e);
			}
		});

		this.web.get("/api/selectCourses", async (req, res) => {
			try {
				res.json(await this.con.selectProfessors(req.query));
			}
			catch (e) {
				WebServer._senderror(res, e);
			}
		});
	}

	end() {
		if (this.nodeServer !== null) {
			this.nodeServer.close();
		}
		this.con.end();
	}

	async listen() {
		return new Promise((resolve, reject) => {
			this.nodeServer = this.web.listen(this.port, () => resolve());
		})
	}
}