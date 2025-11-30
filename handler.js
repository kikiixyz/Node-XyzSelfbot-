import fs from "fs";
import path from "path";
import chalk from "chalk";

const commands = new Map();
const commandFolder = path.join(process.cwd(), "commands");

async function reloadCommand(file) {
  try {
    const filePath = path.join(commandFolder, file);
    const cmd = await import(filePath + "?update=" + Date.now());
    if (!cmd.default) return;
    const data = cmd.default;
    const names = Array.isArray(data.name) ? data.name : [data.name];
    names.forEach((n) => commands.set(n.toLowerCase(), data));
    console.log(chalk.green(`✔ Command reloaded: ${file}`));
  } catch (err) {
    console.log("Reload error:", err);
  }
}

export async function loadCommands() {
  const files = fs.readdirSync(commandFolder).filter((f) => f.endsWith(".js"));
  for (const file of files) await reloadCommand(file);

  fs.watch(commandFolder, async (event, filename) => {
    if (filename && filename.endsWith(".js")) {
      console.log(chalk.yellow(`↻ Updating: ${filename}`));
      await reloadCommand(filename);
    }
  });

  console.log(chalk.cyan("🔥 Commands loaded & hot-reload active"));
}

export async function commandHandler(sock, msg) {
  try {
    const buttonId =
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      msg.message?.templateButtonReplyMessage?.selectedId ||
      msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.id;

    if (buttonId) {
      const cmdBtn = commands.get(buttonId.toLowerCase());
      if (cmdBtn) return await cmdBtn.run(sock, msg, "");
    }

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";
    if (!text) return;

    const prefix = text.split(" ")[0].toLowerCase();
    const cmd = commands.get(prefix);
    if (!cmd) return;

    const args = text.replace(prefix, "").trim();
    await cmd.run(sock, msg, args);
  } catch (e) {
    console.log("Handler Error:", e);
    sock.sendMessage(msg.key.remoteJid, { text: "❌ Terjadi error pada handler!" });
  }
}