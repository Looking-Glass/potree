class MessageBus extends EventTarget {
  constructor() {
    super();
    this.channel = new BroadcastChannel('messagebus');
    this.channel.addEventListener('message', (e) => { this.onBusMessage(e); });
  }

  postMessage(msgType, msgDetail) {
    if (typeof msgType != 'string') throw new Error('msgType must be a string');
    this.channel.postMessage({type: msgType, detail: msgDetail});
  }

  onBusMessage(e) {
    this.dispatchEvent(new CustomEvent(e.data.type, {detail: e.data.detail}));
  }
}
