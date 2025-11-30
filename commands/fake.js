// commands/fake.js
export default {
  name: "!fake",
  alias: ["!fke", "!fak", "!fk"], 
  description: "Buat fake quoted reply",
  tag: "fun",

  async run(sock, msg, text) {
    try {
      const args = text.replace(/!\w+/, "").trim().split("|");

      const fakeText = (args[0] || "").trim();
      const replyText = (args[1] || "").trim();
      const target = (args[2] || "").trim();

      if (!fakeText || !replyText) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: "[*X*] Format salah!\nContoh:\n```!fake teks|balasan|628xxxx```"
        });
        return;
      }

      const fakeJid =
        target !== ""
          ? target.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
          : msg.key.remoteJid;

      const quoted = {
        key: {
          fromMe: false,
          remoteJid: fakeJid,
          id: "FAKE-" + Date.now(),
          participant: fakeJid,
        },
        message: {
          extendedTextMessage: { text: fakeText }
        }
      };

      await sock.sendMessage(
        fakeJid,
        { text: replyText },
        { quoted }
      );

    } catch (err) {
      console.log("FAKE ERROR:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "[*X*] Terjadi error saat menjalankan fitur fake!",
      });
    }
  },
};