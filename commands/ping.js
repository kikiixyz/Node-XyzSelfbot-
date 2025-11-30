// commands/ping.js
export default {
  name: "!ping",
  description: "Membalas dengan pong!",
  tag: "info",
  async run(sock, msg, args) {
    const now = Date.now();
    const timestamp = msg.messageTimestamp * 1000;
    const latency = now - timestamp;
    await sock.sendMessage(msg.key.remoteJid, {
      text: `Pong! 🏓 Kecepatan respon: ${latency}ms`,
    });
  },
};