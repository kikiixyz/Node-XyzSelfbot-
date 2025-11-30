import { generateImage, waitResult } from "../utils/ai.js";

export default {
  name: "!imggen",
  description: "Generate gambar dari ai",
  tag: "ai",
  run: async (sock, msg, args) => {
    try {
      const prompt = args;
      if (!prompt) return sock.sendMessage(msg.key.remoteJid, { text: "Masukkan prompt gambar!" });

      await sock.sendMessage(msg.key.remoteJid, { text: "⚙️ Sedang membuat gambar... tunggu sebentar" });

      const taskId = await generateImage(prompt);
      const imageUrl = await waitResult(taskId);

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: imageUrl },
        caption: `⚙️ Hasil generate:\n\n*${prompt}*`
      });

    } catch (err) {
      console.error(err);
      sock.sendMessage(msg.key.remoteJid, { text: "[*X*] Gagal membuat gambar!" });
    }
  }
};