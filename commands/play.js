import yts from "yt-search";
import axios from "axios";
global.processing = false;

export default {
  name: "!play",
  usage: ["!play", "!music"],
  description: "Mendownload audio dari youtube",
  tag: "Downloader",
  run: async (sock, msg, args) => {
    try {
      if (global.processing) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "⏳ Sedang memproses permintaan lain, silakan tunggu...",
        });
      }
      global.processing = true;

      if (!args)
        return sock.sendMessage(msg.key.remoteJid, {
          text: "Masukkan judul lagunya!",
        });

      const search = await yts(args);
      const video = search.videos[0];
      if (!video)
        return sock.sendMessage(msg.key.remoteJid, {
          text: "Video tidak ditemukan!",
        });

      const vidId = video.videoId;

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: video.thumbnail },
        caption:
          `"*Title:* " *${video.title}*\n` +
          `*Durasi:* ${video.timestamp}\n` +
          `*Channel:* ${video.author.name}\n\n` +
          `⚙️ Mengunduh audio dari server...`,
        jpegThumbnail: null
      });

      const audioStream = await axios({
        method: "GET",
        url: `https://youtube-mp3-audio-video-downloader.p.rapidapi.com/download-m4a/${vidId}`,
        headers: {
          "x-rapidapi-host": "youtube-mp3-audio-video-downloader.p.rapidapi.com",
          "x-rapidapi-key": "482fdcf05emsh76c43d9d0b70778p18c61ajsn1e0b42b22644",
          Accept: "*/*",
        },
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(audioStream.data);

      await sock.sendMessage(msg.key.remoteJid, {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: false,
        fileName: `${video.title}.m4a`,
      });

      global.processing = false;

    } catch (err) {
      global.processing = false;

      console.error("PLAY ERROR:", err);
      sock.sendMessage(msg.key.remoteJid, {
        text: "[*X*] Terjadi kesalahan mengambil audio!",
      });
    }
  },
};