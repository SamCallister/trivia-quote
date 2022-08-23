
class SinglePlayerSocket {
	send: SocketSendFunc;
	onmessage: OnMessageFunc;

	constructor(onmessageFunc:OnMessageFunc) {
		this.onmessage = onmessageFunc;
	}


}


// function wait(s) {
// 	if (s.onmessage) {
// 		return Promise.resolve(s);
// 	} else {
// 		return new Promise((resolve) => {
// 			setTimeout(() => {
// 				resolve(wait(s));
// 			}, 500);
// 		})
// 	}
// }

// build out the game state machine
// build the first round questions
// send question
// acceptable waiting period where looking for answer
// deal with timeout
// do round calculation

function getSinglePlayerSocket(onmessage:OnMessageFunc): Socket {
	return new SinglePlayerSocket(onmessage);

	// gameInfo.messages.reduce((p, m) => {
	// 	return p.then(() => {
	// 		return new Promise((resolve) => {
	// 			setTimeout(() => {
	// 				// waits for onmessage to be set
	// 				wait(s).then(() => {
	// 					s.onmessage({ data: m });
	// 					setTimeout(() => { resolve(); }, m.delay || 1000);
	// 				});
	// 			}, 100);
	// 		});
	// 	});
	// }, new Promise((resolve) => {
	// 	setTimeout(() => {
	// 		resolve()
	// 	}, 500);
	// }));

	// handle getting message
}

export { getSinglePlayerSocket };