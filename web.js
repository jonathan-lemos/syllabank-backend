import express;
import path;

export default class WebServer {
	static sendError(res, msg) {
		res.status(400).send(msg);
	}

	constructor(sqlcon, port = 80, baseDir = path.join(__dirname, "../"))
}