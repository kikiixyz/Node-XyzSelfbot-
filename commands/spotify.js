// commands/spotify.js
import { spawn } from "child_process";

export default {
  name: "!spotify",
  description: "Download lagu / info dari Spotify (via Python savify)",
  tag: "Downloader",

  async run(sock, msg, args) {
    const chat = msg.key.remoteJid;

    if (!args) {
      return sock.sendMessage(chat, { text: "⚠️ Kirim link Spotify!\nContoh: !spotify https://open.spotify.com/track/..." });
    }

    try {
      const url = args.trim();

      const result = await new Promise((resolve, reject) => {
        const py = spawn("python3", ["./utils/worker.py", url]);
        let data = "";

        py.stdout.on("data", chunk => (data += chunk.toString()));
        py.stderr.on("data", err => console.error(err.toString()));

        py.on("close", code => {
          if (code !== 0) return reject("Python process error");
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      });

      if (!result) {
        return sock.sendMessage(chat, { text: "❌ Gagal mengambil lagu!" });
      }

      const caption = `
🎵 Title: ${result.title}
👤 Artist: ${result.artist}
⏱ Duration: ${result.duration}
🔗 Link: ${result.spotify_url}
`;

      if (result.file_path) {
        await sock.sendMessage(chat, {
          audio: { url: result.file_path },
          mimetype: "audio/mpeg",
          fileName: `${result.title}.mp3`,
          caption
        });
      } else {
        await sock.sendMessage(chat, { text: caption });
      }

    } catch (err) {
      console.error("SPOTIFY ERROR:", err);
      await sock.sendMessage(chat, { text: "❌ Terjadi error saat mengambil lagu Spotify!" });
    }
  }
};