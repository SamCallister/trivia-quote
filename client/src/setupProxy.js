
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {

	app.use(
		createProxyMiddleware('/data', {
			target: 'http://localhost:8000',
			changeOrigin: true
		})
	);

	app.use(
		createProxyMiddleware('/multiplayer-game', {
			target: 'http://localhost:8000',
			changeOrigin: true
		})
	);

	app.use(
		createProxyMiddleware('/ws/*', {
			target: 'ws://localhost:8000',
			changeOrigin: true,
			ws: true
		})
	);

};