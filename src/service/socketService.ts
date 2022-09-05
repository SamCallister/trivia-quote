
class SinglePlayerSocket {
	send: SocketSendFunc;
	onmessage: OnMessageFunc;

	constructor(onmessageFunc: OnMessageFunc) {
		this.onmessage = onmessageFunc;
	}


}

function getSinglePlayerSocket(onmessage: OnMessageFunc): Socket {
	return new SinglePlayerSocket(onmessage);
}

export { getSinglePlayerSocket };