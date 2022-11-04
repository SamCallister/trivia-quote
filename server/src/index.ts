import express from 'express';
import * as dotenv from 'dotenv';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import cookieParser from 'cookie-parser';
import expressWs from 'express-ws';
import bodyParser from 'body-parser';
import games from './service/games';
import constants from './constants';
import { v4 as uuidv4 } from 'uuid';
import { merge } from 'lodash';
import { STATUS_CODES } from 'http';


dotenv.config();

const { app, getWss, applyTo } = expressWs(express());
const port = process.env.PORT;
const { combine, timestamp, json } = winston.format;
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'info',
	format: combine(timestamp(), json(), winston.format.errors({ stack: true })),
	transports: [new winston.transports.Console()],
});
app.use(cookieParser());
app.use(bodyParser.json());

app.use((req, res, next) => {
	if (!req.cookies[constants.PLAYER_ID_COOKIE_ID]) {
		const newPlayerId = uuidv4();

		req.cookies[constants.PLAYER_ID_COOKIE_ID] = newPlayerId;
		res.cookie(
			constants.PLAYER_ID_COOKIE_ID,
			newPlayerId,
			{ maxAge: constants.MAX_COOKIE_AGE }
		);
	}

	next();
});

const router = express.Router();

router.use(expressWinston.logger({
	transports: [
		new winston.transports.Console()
	],
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	meta: true, // optional: control whether you want to log the meta data about the request (default to true)
	msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
	expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
	colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
	ignoreRoute: function () { return false; } // optional: allows to skip some log messages based on request and/or response
}));


router.get('/', (req, res) => {
	// serve up react app public index.html
	res.sendFile('public/index.html', { root: __dirname });
});

router.post("/multiplayer-game", (req, res) => {
	const roomInfo = games.createNewGame(
		req.cookies[constants.PLAYER_ID_COOKIE_ID],
		merge({}, req.body, { isHost: true }));

	res.status(200).send(roomInfo);
});

const joinGame = (req:express.Request, res:express.Response) => {
	const roomInfo = games.joinGame(
		req.params.gameId,
		req.cookies[constants.PLAYER_ID_COOKIE_ID],
		merge({}, req.body, { isHost: false })
	);
	
	if (!roomInfo) {
		return res.status(404).send();
	}

	return res.status(200).send(roomInfo);
};

router.put("/multiplayer-game/:gameId", joinGame);

// setup static folder serving assets
router.use(express.static("public"));

// if playerId cookie doesn't exist setone
router.ws('/ws/:gameId', (ws, req) => {
	games.addSocketToGame(
		req.params.gameId,
		req.cookies[constants.PLAYER_ID_COOKIE_ID],
		ws
	);

});

// Now we can tell the app to use our routing code:
app.use(router);

// express-winston errorLogger makes sense AFTER the router.
app.use(expressWinston.errorLogger({
	transports: [
		new winston.transports.Console()
	],
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	)
}));

app.listen(port, () => {
	logger.info(`[server]: Server is running at https://localhost:${port}`);
});