import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as expressWinston from 'express-winston';

let moduleConfigured = false;
let logger:winston.Logger = winston.createLogger();

function getLogger() {
	if (!moduleConfigured) {
		throw new Error("Tried to get logger without configuring first");
	}

	return logger;
}

function buildRequestLogger(logPath: string) {
	return expressWinston.logger({
		transports:getTransports(logPath),
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.json()
		),
		meta: true, // optional: control whether you want to log the meta data about the request (default to true)
		msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
		expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
		colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
		ignoreRoute: function () { return false; } // optional: allows to skip some log messages based on request and/or response
	})
}

function buildExpressErrorLogger(logPath:string) {
	return expressWinston.errorLogger({
		transports: getTransports(logPath),
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.json()
		)
	})
}

function getTransports(logPath: string) {
	if (logPath) {
		return [new DailyRotateFile({
			filename: 'trivia-quote-%DATE%.log',
			datePattern: 'YYYY-MM-DD', // defines how frequently they are rotated
			zippedArchive: false,
			maxSize: '1gb',
			maxFiles: '7d',
			dirname: '/var/log/trivia-quote'
		})];
	} else {
		return [new winston.transports.Console()];
	}
}

function configure(logPath: string) {
	if (moduleConfigured) {
		throw new Error("attempted to configure logger a second time")
	}
	moduleConfigured = true;

	const { combine, timestamp, json } = winston.format;

	logger = winston.createLogger({
		level: process.env.LOG_LEVEL || 'info',
		format: combine(timestamp(), json(), winston.format.errors({ stack: true })),
		transports: getTransports(logPath),
	});
}

export default {
	configure,
	getLogger,
	buildRequestLogger,
	buildExpressErrorLogger
}