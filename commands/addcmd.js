import fs from "fs";
import path from "path";
import { loadCommands } from "../handler.js";

export default {
  name: "!addcmd",
  description: "Menambahkan command baru melalui chat (Owner only)",
  tag: "setting",

  async run(sock, msg, text) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;
    const OWNER = "6281273206055@s.whatsapp.net";

    const inputRaw = text.replace("!addcmd", "").trim();
    const input = inputRaw.split("|").map(a => a.trim());

    if (input.length < 3) {
      return sock.sendMessage(jid, {
        text: ` Format salah!

Gunakan:
!addcmd nama | deskripsi | code

Contoh:
!addcmd ping2 | tes ping | sock.sendMessage(jid,{text:"pong"});`
      });
    }

    const [name, description, code] = input;

    const commandsDir = path.join(process.cwd(), "commands");
    const filePath = path.join(commandsDir, `${name}.js`);

    if (fs.existsSync(filePath)) {
      return sock.sendMessage(jid, {
        text: `❌ Command *${name}* sudah ada!`
      });
    }

    const template = `export default {
  name: "${name}",
  description: "${description}",

  async run(sock, msg, text) {
    const jid = msg.key.remoteJid;
    ${code}
  }
};`;

    try {
      fs.writeFileSync(filePath, template, "utf-8");
    } catch (e) {
      return sock.sendMessage(jid, {
        text: "❌ Gagal menyimpan file command!"
      });
    }

    try {
      const modulePath = path.resolve(`./commands/${name}.js`);
      await import(`../commands/${name}.js?update=${Date.now()}`);

      const ok = await loadCommands();

      if (ok) {
        await sock.sendMessage(jid, {
          text: `✅ Command *${name}* berhasil dibuat & direfresh!\nDeskripsi: ${description}`
        });
      } else {
        await sock.sendMessage(jid, {
          text: `⚠️ Command *${name}* dibuat, tapi gagal reload!`
        });
      }

    } catch (err) {
      console.log("Reload error:", err);
      await sock.sendMessage(jid, {
        text: `⚠ Error reload command baru! (${err.message})`
      });
    }
  }
};