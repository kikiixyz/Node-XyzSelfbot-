import fs from "fs";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { writeFile } from "fs/promises";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { exec } from "child_process";

export default {
  name: "!sticker",
  alias: ["!sticker", "!stiker", "!stc", "!s", "!stk", "!st"],
  tag: "converter",
  description: "Convert media/reply/text menjadi stiker",

  async run(sock, msg, text) {
    const jid = msg.key.remoteJid;

    function extract(msg) {
      if (!msg.message) return null;
      let m = msg.message;
      if (m.ephemeralMessage) m = m.ephemeralMessage.message;
      if (m.viewOnceMessage) m = m.viewOnceMessage.message;
      if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
      return m;
    }

    const message = extract(msg);
    if (!message) return sock.sendMessage(jid, { text: "[*X*] Pesan tidak valid." });

    const quoted = message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!fs.existsSync("./temp")) fs.mkdirSync("./temp");

    const input = text.replace(/!sticker|!stiker|!stc|!s|!stk|!st/gi, "").trim();

    const run = (cmd) => new Promise((res, rej) => exec(cmd, (err) => (err ? rej(err) : res())));

    async function getBuffer(media) {
      if (!media?.mimetype) throw new Error("Media tidak valid");
      let buff = Buffer.from([]);
      const stream = await downloadContentFromMessage(media, media.mimetype.split("/")[0]);
      for await (const c of stream) buff = Buffer.concat([buff, c]);
      return buff;
    }

    async function makeSticker(buffer, output) {
      const img = await loadImage(buffer);
      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 512, 512);
      const ratio = Math.min(512 / img.width, 512 / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);
      await writeFile(output, canvas.toBuffer("image/webp"));
    }

    async function makeTextSticker(text, output) {
      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "black";
      ctx.font = "bold 50px Sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 256, 256, 480);
      await writeFile(output, canvas.toBuffer("image/webp"));
    }

    const mediaNow = message.imageMessage || message.videoMessage;
    const mediaQuoted = quoted?.imageMessage || quoted?.videoMessage;

    if (quoted?.imageMessage) {
      try {
        const buff = await getBuffer(quoted.imageMessage);
        const out = "./temp/st.webp";
        await makeSticker(buff, out);
        await sock.sendMessage(jid, { sticker: { url: out } });
        fs.unlinkSync(out);
      } catch (e) {
        return sock.sendMessage(jid, { text: "[*X*] Gagal membuat stiker foto.\n" + e.message });
      }
      return;
    }

    if (quoted?.videoMessage) {
      try {
        const buff = await getBuffer(quoted.videoMessage);
        const sticker = new Sticker(buff, { type: StickerTypes.FULL, pack: "anjir", author: "kikii", quality: 70 });
        const webp = await sticker.toBuffer();
        await sock.sendMessage(jid, { sticker: webp });
      } catch (e) {
        return sock.sendMessage(jid, { text: "[*X*] Gagal membuat stiker animasi (Formatter).\n" + e });
      }
      return;
    }

    if (mediaNow?.mimetype?.startsWith("image/")) {
      try {
        const buff = await getBuffer(mediaNow);
        const out = "./temp/st.webp";
        await makeSticker(buff, out);
        await sock.sendMessage(jid, { sticker: { url: out } });
        fs.unlinkSync(out);
      } catch (e) {
        return sock.sendMessage(jid, { text: "[*X*] Gagal membuat stiker foto.\n" + e.message });
      }
      return;
    }

    if (mediaNow?.mimetype?.startsWith("video/")) {
      try {
        const buff = await getBuffer(mediaNow);
        const sticker = new Sticker(buff, { type: StickerTypes.FULL, pack: "Anjir", author: "kiki", quality: 70 });
        const webp = await sticker.toBuffer();
        await sock.sendMessage(jid, { sticker: webp });
      } catch (e) {
        return sock.sendMessage(jid, { text: "[*X*] Gagal membuat stiker animasi (Formatter).\n" + e });
      }
      return;
    }

    if (input.length > 0) {
      try {
        const out = "./temp/text.webp";
        await makeTextSticker(input, out);
        await sock.sendMessage(jid, { sticker: { url: out } });
        fs.unlinkSync(out);
      } catch (e) {
        return sock.sendMessage(jid, { text: "[*X*] Gagal membuat stiker teks.\n" + e.message });
      }
      return;
    }

    sock.sendMessage(jid, {
      text:
        "⚙️ *Usage:*\n" +
        "• Kirim foto → `!stiker`\n" +
        "• Reply foto → `!stiker`\n" +
        "• Kirim video/GIF → `!stiker`\n" +
        "• Reply video → `!stiker`\n" +
        "• Tulis teks → `!stiker aku ganteng`\n",
    });
  },
};