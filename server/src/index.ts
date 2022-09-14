import express from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT;

// setup static folder serving assets

app.get('/', (req, res) => {
	// serve up react app
	res.send('Express + TypeScript Server');
});

app.listen(port, () => {
	console.log(`[server]: Server is running at https://localhost:${port}`);
});

app.use(express.static("public"));