import express from "express";
import path from "path";

export default class WebServer {
	static _senderror(res, msg) {
		res.status(400).send(msg);
	}

	constructor(sqlcon, {port = 80, baseSiteDir = path.join(__dirname, "/site"), homepage = "index.html", basePdfDir = path.join(__dirname, "/pdfs")}) {
		if (typeof port !== "number") {
			throw new Error("Port must be a number");
		}

		if (typeof baseSiteDir !== "string") {
			throw new Error("baseDir must be a string");
		}

		if (typeof homepage !== "string") {
			throw new Error("defaultFile must be a string");
		}

		if (typeof basePdfDir !== "string") {
			throw new Error("defaultFile must be a string");
		}

		this.nodeServer = null;
		this.con = sqlcon;
		this.port = port;
		this.web = express();
		this.web.use(express.static(baseSiteDir));
		this.web.get("/", (req, res) => res.sendFile(path.join(baseSiteDir, homepage)));

		this.web.get("/api/selectSylabi", async (req, res) => {
			try {
				res.json(await this.con.selectSyllaviews(req.query));
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
				res.json(await this.con.selectCourses(req.query));
			}
			catch (e) {
				WebServer._senderror(res, e);
			}
		});

		this.web.get("/api/searchCourses/:name", async (req, res) => {
			if (req.params.name === undefined) {
				WebServer._senderror(res, "Route param name must be given");
				return;
			}

			try {
				res.json(await this.con.searchCourses(req.params.name));
			}
			catch (e) {
				WebServer._senderror(res, e);
			}
		});

		this.web.get("/api/searchProfessors/:name", async (req, res) => {
			if (req.params.name === undefined) {
				WebServer._senderror(res, "Route param name must be given");
				return;
			}

			try {
				res.json(await this.con.searchProfessors(req.params.name));
			}
			catch (e) {
				WebServer._senderror(res, e);
			}
		});

		this.web.get("/api/sendFile/:id", async (req, res) => {
			if (req.params.id === undefined) {
				WebServer._senderror(res, "Route param id must be given");
				return;
			}
			try {
				const r = await this.con.selectFiles({file_id: req.params.id});
				if (r.length === 0) {
					WebServer._senderror(res, `No file with id ${req.params.id} exists`);
					return;
				}
				res.download(path.join(basePdfDir, r[0].filename), "download.pdf");
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
		return new Promise(resolve => {
			this.nodeServer = this.web.listen(this.port, () => resolve());
		});
	}
}