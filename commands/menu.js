import fs from "fs";
import path from "path";
import config from "../config.json" assert { type: "json" };
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: ["!menu"],
  description: "Menampilkan daftar commands atau detail command tertentu.",
  tag: "info",

  async run(sock, msg, args) {
    const from = msg.key.remoteJid;

    // Path folder commands
    const folder = __dirname;

    // Ambil semua file command
    const files = fs.readdirSync(folder).filter(f => f.endsWith(".js"));

    // Jika user ketik: !menu sticker atau !menu info
    if (args) {
      const argLower = args.toLowerCase();

      // Cek apakah args adalah tag
      const commandsByTag = [];
      for (let f of files) {
        const imported = await import(`./${f}?v=${Date.now()}`);
        const cmd = imported.default;
        if (!cmd) continue;

        if (Array.isArray(cmd.tag) ? cmd.tag.includes(argLower) : cmd.tag === argLower) {
          commandsByTag.push(cmd);
        }
      }

      if (commandsByTag.length > 0) {
        let listByTag = `*Commands kategori ${argLower}:*\n`;
        for (let cmd of commandsByTag) {
          const names = Array.isArray(cmd.name) ? cmd.name.join(", ") : cmd.name;
          listByTag += `• ${names}\n`;
        }
        return sock.sendMessage(from, { text: listByTag });
      }

      // Jika bukan tag, cek apakah args adalah nama command
      const target = files.find(f => f.replace(".js", "") === argLower);
      if (!target)
        return sock.sendMessage(from, { text: `[*X*] Command atau kategori *${args}* tidak ditemukan.` });

      const imported = await import(`./${target}?v=${Date.now()}`);
      const cmd = imported.default;

      const detail = `
*command:* ${Array.isArray(cmd.name) ? cmd.name.join(", ") : cmd.name}
*Deskripsi:* ${cmd.description || "-"}
*Tag:* ${cmd.tag || "-"}
`;

      return sock.sendMessage(from, { text: detail });
    }

    // Mode (dari config)
    const mode = config.mode || "public";

    // List semua command grouped by tag
    const commandsByTag = {};
    for (let f of files) {
      const imported = await import(`./${f}?v=${Date.now()}`);
      const cmd = imported.default;
      if (!cmd || !cmd.name) continue;

      const tag = Array.isArray(cmd.tag) ? cmd.tag.join(", ") : cmd.tag || "misc";
      if (!commandsByTag[tag]) commandsByTag[tag] = [];
      const names = Array.isArray(cmd.name) ? cmd.name.join(", ") : cmd.name;
      commandsByTag[tag].push(names);
    }

    let list = "";
    for (let tag in commandsByTag) {
      list += `_*${tag.toUpperCase()}*_\n`;
      list += commandsByTag[tag].map(c => `• ${c}`).join("\n") + "\n\n";
    }

    const menuText = `
_*BOT COMMANDS:*_

${list}

_Node Xyzselfbot_
`;

    await sock.sendMessage(from, { text: menuText });
  }
};