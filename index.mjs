import fs from "fs";
import makeWASocket, { useMultiFileAuthState, downloadContentFromMessage } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { loadCommands, commandHandler } from "./handler.js";

async function startBot() {
  await loadCommands();
  const modeFile = "./mode.json";
  if (!fs.existsSync(modeFile)) fs.writeFileSync(modeFile, JSON.stringify({ mode: "public" }, null, 2));
  const { state, saveCreds } = await useMultiFileAuthState("./auth2");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false
  });

  sock.ev.on("connection.update", async ({ connection, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === "open") console.log("🤖 BOT SIAP ✔");
    if (connection === "close") {
      console.log("⚠️ BOT TERPUTUS – reconnecting...");
      setTimeout(async () => {
        const { spawn } = await import("child_process");
        console.log("♻️ Memulai ulang bot...");
        spawn("node", ["index.mjs"], { stdio: "inherit" });
        process.exit();
      }, 5000);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    const modeData = JSON.parse(fs.readFileSync(modeFile));
    const currentMode = modeData.mode || "public";

    if (global.afkStatus?.isAfk && !msg.key.fromMe) {
      const sender = msg.key.participant || msg.key.remoteJid;
      if (!global.afkStatus.replied.has(sender)) {
        const duration = Date.now() - global.afkStatus.start;
        await sock.sendMessage(msg.key.remoteJid, {
          text: `⚠ Saya sedang AFK (${global.afkStatus.reason}), sudah ${Math.floor(duration / 1000)} detik offline.`
        });
        global.afkStatus.replied.add(sender);
      }
    }

    if (msg.key.fromMe && global.afkStatus?.isAfk) {
      const duration = Date.now() - global.afkStatus.start;
      if (duration >= 30000) {
        global.afkStatus.isAfk = false;
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✔ Kamu kembali! Durasi AFK: ${Math.floor(duration / 1000)} detik.`
        });
      }
    }

    if (!global.deletedStore) global.deletedStore = new Map();
    if (msg.key.remoteJid !== "status@broadcast") global.deletedStore.set(msg.key.id, msg);

    if (currentMode === "self" && !msg.key.fromMe) return;

    await commandHandler(sock, msg);
  });

  if (!global.ANTIDELETE) global.ANTIDELETE = true;

  sock.ev.on("messages.update", async (updates) => {
    if (!global.ANTIDELETE) return;

    for (const upd of updates) {
      if (upd.key.fromMe) continue;
      if (upd.update?.message === null) {
        const id = upd.key.id;
        const chat = upd.key.remoteJid;
        const original = global.deletedStore.get(id);
        if (!original || original.key.fromMe) continue;

        const sender = original.key.participant || original.key.remoteJid;
        const mentionJid = sender.replace(/:[0-9]+/g, "");

        await sock.sendMessage(chat, {
          text: `⚠️ @${mentionJid.split("@")[0]} menghapus sebuah pesan! Berikut isi sebenarnya.`,
          mentions: [mentionJid],
          contextInfo: { stanzaId: original.key.id, participant: mentionJid, quotedMessage: original.message }
        });

        async function getBuffer(msgType, streamType) {
          const stream = await downloadContentFromMessage(msgType, streamType);
          let buffer = Buffer.alloc(0);
          for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
          return buffer;
        }

        const m = original.message;
        if (m.conversation) return sock.sendMessage(chat, { text: m.conversation });
        if (m.imageMessage) return sock.sendMessage(chat, { image: await getBuffer(m.imageMessage, "image"), caption: "🖼 Foto yang dihapus" });
        if (m.videoMessage) return sock.sendMessage(chat, { video: await getBuffer(m.videoMessage, "video"), caption: "🎥 Video yang dihapus" });
        if (m.audioMessage) return sock.sendMessage(chat, { audio: await getBuffer(m.audioMessage, "audio"), ptt: m.audioMessage.ptt || false, mimetype: m.audioMessage.mimetype || "audio/ogg" });
        if (m.documentMessage) return sock.sendMessage(chat, { document: await getBuffer(m.documentMessage, "document"), fileName: m.documentMessage.fileName });
        if (m.stickerMessage) return sock.sendMessage(chat, { sticker: await getBuffer(m.stickerMessage, "sticker") });
      }
    }
  });

  return sock;
}

async function main() {
  try {
    await startBot();
  } catch (err) {
    console.error("BOT TERPUTUS, mencoba reconnect...", err);
    setTimeout(main, 5000);
  }
}

main();