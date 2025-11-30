// commands/antidelete.js
export default {
  name: ["!antidelete"],
  tag: "setting",

  async run(sock, msg, args) {
    const chat = msg.key.remoteJid;
    const cmd = (args || "").trim().toLowerCase();

    if (!cmd) {
      return sock.sendMessage(chat, {
        text: `⚙️ *Anti-Delete Setting*\n\nGunakan:\n• *!antidelete on*\n• *!antidelete off*`
      });
    }

    if (cmd === "on") {
      global.ANTIDELETE = true;
      return sock.sendMessage(chat, { text: " *Anti-Delete diaktifkan!*" });
    }

    if (cmd === "off") {
      global.ANTIDELETE = false;
      return sock.sendMessage(chat, { text: " *Anti-Delete dimatikan!*" });
    }

    return sock.sendMessage(chat, {
      text: "⚙️ Gunakan: *!antidelete on/off*"
    });
  }
};