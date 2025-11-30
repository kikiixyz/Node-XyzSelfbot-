import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export default {
  name: ["!buka", "!decrypt", "!open"],
  description: "Membuka/mengambil media view once via reply",
  usage: "!buka (reply pesan view-once)",

  async run(sock, msg) {
    const from = msg.key.remoteJid;

    // ambil pesan yang direply
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;

    if (!quoted) {
      return sock.sendMessage(from, {
        text: "❌ Kamu harus reply pesan view-once."
      });
    }

    // WhatsApp otomatis mengirim media view-once yang sudah didecrypt
    const img = quoted.imageMessage;
    const vid = quoted.videoMessage;
console.log(quoted)
    if (!img && !vid) {
      return sock.sendMessage(from, {
        text: "❌ Pesan yang kamu reply bukan view-once atau tidak mengandung media."
      });
    }

    try {
      // Fungsi download universal
      async function getBuffer(msgObj, type) {
        const stream = await downloadContentFromMessage(msgObj, type);
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
      }

      // Jika IMAGE
      if (img) {
        const buffer = await getBuffer(img, "image");
        return sock.sendMessage(from, {
          image: buffer,
          caption: "🖼 View-once berhasil dibuka!"
        });
      }

      // Jika VIDEO
      if (vid) {
        const buffer = await getBuffer(vid, "video");
        return sock.sendMessage(from, {
          video: buffer,
          caption: "🎥 View-once berhasil dibuka!"
        });
      }

    } catch (err) {
      console.log("Error buka view-once:", err);
      return sock.sendMessage(from, {
        text: "⚠ Terjadi kesalahan saat membuka media."
      });
    }
  }
};