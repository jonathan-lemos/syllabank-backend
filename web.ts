import express from "express";
import path from "path";
import cors from "cors";
import SQLServer from "./sql";
import {Server} from "http";

export default class WebServer {
	private web: express.Application;
	private con: SQLServer;
	private nodeServer: Server | null;
	private readonly port: number;

	private static senderror(res: express.Response, msg: string) {
		res.status(400).send(msg);
	}

	public constructor(sqlcon: SQLServer, {port = 80, baseSiteDir = path.join(__dirname, "/site"), homepage = "index.html", basePdfDir = path.join(__dirname, "/pdfs")}) {
		this.nodeServer = null;
		this.con = sqlcon;
		this.port = port;
		this.web = express();
		this.web.use(cors());
		this.web.use(express.static(baseSiteDir));
		this.web.get("/", (req, res) => res.sendFile(path.join(baseSiteDir, homepage)));

		this.web.get("/api/selectSylabi", async (req, res) => {
			try {
				res.json(await this.con.selectSyllaviews(req.query));
			}
			catch (e) {
				WebServer.senderror(res, e);
			}
		});

		this.web.get("/api/selectProfessors", async (req, res) => {
			try {
				res.json(await this.con.selectProfessors(req.query));
			}
			catch (e) {
				WebServer.senderror(res, e);
			}
		});

		this.web.get("/api/selectCourses", async (req, res) => {
			try {
				res.json(await this.con.selectCourses(req.query));
			}
			catch (e) {
				WebServer.senderror(res, e);
			}
		});

		this.web.get("/api/searchCourses/:name", async (req, res) => {
			if (req.params.name === undefined) {
				WebServer.senderror(res, "Route param name must be given");
				return;
			}

			try {
				res.json(await this.con.searchCourses(req.params.name));
			}
			catch (e) {
				WebServer.senderror(res, e);
			}
		});

		this.web.get("/api/searchProfessors/:name", async (req, res) => {
			if (req.params.name === undefined) {
				WebServer.senderror(res, "Route param name must be given");
				return;
			}

			try {
				res.json(await this.con.searchProfessors(req.params.name));
			}
			catch (e) {
				WebServer.senderror(res, e);
			}
		});

		this.web.get("/api/sendFile/:id", async (req, res) => {
			if (req.params.id === undefined) {
				WebServer.senderror(res, "Route param id must be given");
				return;
			}
			try {
				const r = await this.con.selectFiles({file_id: req.params.id});
				if (r.length === 0) {
					WebServer.senderror(res, `No file with id ${req.params.id} exists`);
					return;
				}
				res.download(path.join(basePdfDir, r[0].filename), "download.pdf");
			}
			catch (e) {
				WebServer.senderror(res, e);
			}
		});
	}

	public async end(): Promise<void> {
		if (this.nodeServer !== null) {
			this.nodeServer.close();
		}
		await this.con.end();
	}

	public async listen(): Promise<void> {
		return new Promise(resolve => {
			this.nodeServer = this.web.listen(this.port, () => resolve());
		});
	}
}
