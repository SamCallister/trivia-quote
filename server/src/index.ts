import express from 'express';
import * as dotenv from 'dotenv';
import * as winston from 'winston';

dotenv.config();

const app = express();
const port = process.env.PORT;

// setup static folder serving assets

app.get('/', (req, res) => {
	// serve up react app public index.html
	res.sendFile('public/index.html', { root: __dirname });
});

app.listen(port, () => {
	winston.info(`[server]: Server is running at https://localhost:${port}`);
});

app.use(express.static("public"));