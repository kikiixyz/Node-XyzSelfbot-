import axios from "axios";
import followRedirects from "follow-redirects";
const { https } = followRedirects;

const processingChats = new Set();

async function resolveTikTokUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      resolve(res.responseUrl || url);
    }).on("error", reject);
  });
}

function extractVideoId(url) {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
}

async function downloadFromAPIs(finalUrl) {
  const apis = [
    `https://download-api-azhb.onrender.com/tiktok/details?videoUrl=${encodeURIComponent(finalUrl)}`,
    `https://api.tiklydown.info/api/download?url=${encodeURIComponent(finalUrl)}`,
    `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}`
  ];

  for (const api of apis) {
    try {
      const res = await axios.get(api);
      const data = res.data;

      if (data.downloadUrl) return data;
      if (data.data?.play) return {
        username: data.data.author?.unique_id,
        description: data.data.title,
        avatar: data.data.author?.avatar,
        cover: data.data.cover,
        stats: {
          likes: data.data.digg_count,
          comments: data.data.comment_count,
          views: data.data.play_count,
          shares: data.data.share_count,
          saves: data.data.collect_count,
        },
        downloadUrl: data.data.play,
        audioUrl: data.data.music?.play_url,
      };

      if (data.video) return data.video;

    } catch {
      continue;
    }
  }

  throw new Error("Semua API gagal. Coba ulangi sebentar lagi.");
}

async function fetchTikTok(url) {
  const finalUrl = await resolveTikTokUrl(url);
  const id = extractVideoId(finalUrl);
  if (!id) throw new Error("ID video tidak ditemukan.");
  return await downloadFromAPIs(finalUrl);
}

export default {
  name: "!tiktok",
  description: "TikTok downloader advanced (video, audio, metadata) tanpa tombol",
  tag: "Downloader",

  async run(sock, msg, args) {
    const chat = msg.key.remoteJid;

    if (!args) {
      return sock.sendMessage(chat, { text: " Kirim link TikTok\nContoh: .tiktok https://vm.tiktok.com/xxxx" });
    }

    if (processingChats.has(chat)) {
      return sock.sendMessage(chat, { text: "Sedang memproses permintaan sebelumnya. Tunggu sebentar." });
    }

    processingChats.add(chat);

    try {
      await sock.sendMessage(chat, { text: " _Mengambil data..._" });

      const data = await fetchTikTok(args.trim());

      const {
        username,
        description,
        stats,
        cover,
        avatar,
        downloadUrl,
        audioUrl
      } = data;

      const info = `
TikTok Downloader
*• User:* @${username || "-"}
*• Caption:* ${description || "-"}
*• Likes:* ${stats?.likes?.toLocaleString() || 0}
*• Comments:* ${stats?.comments?.toLocaleString() || 0}
*• Views:* ${stats?.views?.toLocaleString() || 0}
*• Shares:* ${stats?.shares?.toLocaleString() || 0}
*• Saves:* ${stats?.saves?.toLocaleString() || 0}
`.trim();

      if (cover || avatar) {
        await sock.sendMessage(chat, {
          image: { url: cover || avatar },
          caption: info
        });
      } else {
        await sock.sendMessage(chat, { text: info });
      }

      if (downloadUrl) {
        await sock.sendMessage(chat, {
          video: { url: downloadUrl },
          caption: `Video TikTok: @${username || "-"}`
        });
      }

      if (audioUrl) {
        await sock.sendMessage(chat, {
          audio: { url: audioUrl },
          mimetype: "audio/mpeg",
          fileName: `${username || "tiktok"}.mp3`
        });
      }

    } catch (err) {
      return sock.sendMessage(chat, { text: ` Error: ${err.message}` });
    } finally {
      processingChats.delete(chat);
    }
  },
};