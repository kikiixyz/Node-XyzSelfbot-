// commands/switchMode.js
import fs from "fs";

export default {
  name: ["!switchmode"],
  usage: ["!switchmode", "!mode"],
  description: "ganti mode bot",
  tag: "setting",
  async run(sock, msg, args) {
    const modeFile = "./mode.json";

    // ❗ HANYA BOLEH JIKA DIKIRIM DARI BOT SENDIRI
    if (!msg.key.fromMe) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "[*X*] Kamu tidak memiliki akses untuk mengganti mode.",
      });
    }

    if (!args) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "⚙️Usage:\n!switchmode self\n!switchmode public",
      });
    }

    const mode = args.toLowerCase();

    if (!["self", "public"].includes(mode)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "[*X*] Mode tidak valid! Gunakan: self / public",
      });
    }

    // ❗ Cek mode saat ini
    let currentMode = "public"; // default jika file belum ada
    if (fs.existsSync(modeFile)) {
      const data = fs.readFileSync(modeFile, "utf-8");
      try {
        currentMode = JSON.parse(data).mode || "public";
      } catch (e) {
        currentMode = "public";
      }
    }

    if (currentMode === mode) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `["X"] Sudah berada di mode *${mode.toUpperCase()}*`,
      });
    }

    fs.writeFileSync(modeFile, JSON.stringify({ mode }, null, 2));

    await sock.sendMessage(msg.key.remoteJid, {
      text: `⚙️ Mode diubah menjadi: *${mode.toUpperCase()}*`,
    });
  },
};