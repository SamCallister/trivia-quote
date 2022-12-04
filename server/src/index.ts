import express from 'express';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import expressWs from 'express-ws';
import bodyParser from 'body-parser';
import games from './service/games';
import constants from './constants';
import { v4 as uuidv4 } from 'uuid';
import { merge } from 'lodash';
import loggerService from './service/logger';


const NODE_ENV = process.env.NODE_ENV || 'dev';
dotenv.config({ path: `config/.env.${NODE_ENV}` });
const LOG_PATH = process.env.LOG_PATH || "";

const { app, getWss, applyTo } = expressWs(express());
const port = process.env.PORT;


loggerService.configure(LOG_PATH);
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

router.use(loggerService.buildRequestLogger(LOG_PATH));


router.get('/', (req, res) => {
	// serve up react app public index.html
	res.sendFile('public/index.html', { root: __dirname });
});

router.post("/multiplayer-game", (req, res) => {
	const roomInfo = games.createNewGame(
		req.cookies[constants.PLAYER_ID_COOKIE_ID],
		merge({}, req.body, { isHost: true, playerId: req.cookies[constants.PLAYER_ID_COOKIE_ID] }));

	res.status(200).send(roomInfo);
});

const joinGame = (req: express.Request, res: express.Response) => {
	const roomInfo = games.joinGame(
		req.params.gameId,
		req.cookies[constants.PLAYER_ID_COOKIE_ID],
		merge({}, req.body, { isHost: false, playerId: req.cookies[constants.PLAYER_ID_COOKIE_ID] })
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
app.use(loggerService.buildExpressErrorLogger(LOG_PATH));

app.listen(port, () => {
	loggerService.getLogger().info(`[server]: Server is running at https://localhost:${port}`);
});