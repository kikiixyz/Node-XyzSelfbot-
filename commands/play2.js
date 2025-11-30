import yts from "yt-search";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";

export default {
name: "!play2",
description: "Download audio YouTube via Python worker",
tag: "Downloader",

async run(sock, msg, args) {
const chat = msg.key.remoteJid;

if (!args) return sock.sendMessage(chat, { text: "_• Kirim judul lagu!\nContoh: !play2 Despacito_" });  

const query = args.trim();  
await sock.sendMessage(chat, { text: `_Mencari di YouTube: ${query}_` });  

let video;  
try {  
  const search = await yts(query);  
  video = search.videos[0];  
  if (!video) throw new Error("Video tidak ditemukan!");  
} catch (e) {  
  return sock.sendMessage(chat, { text: `Gagal mencari video: ${e.message}` });  
}  

const videoUrl = video.url;  
const tempDir = path.resolve("./temp");  
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);  

const filePath = path.join(tempDir, video.title);  

await sock.sendMessage(chat, { 
  image: { url: video.thumbnail }, 
  caption: `_• Title: ${video.title}_\n_• Duration: ${video.timestamp}_\n\n _Mengunduh audio..._`
});  

execFile("python3", ["./utils/worker.py", videoUrl, filePath], async (err, stdout, stderr) => {  
  if (err) {  
    console.error("Python worker error:", err, stderr);  
    return sock.sendMessage(chat, { text: `Gagal mendownload audio!\nError: ${err.message || stderr}` });  
  }  

  if (!fs.existsSync(filePath + ".mp3")) {  
    return sock.sendMessage(chat, { text: "File audio tidak ditemukan setelah proses download!" });  
  }  

  try {  
    const audioBuffer = fs.readFileSync(filePath + ".mp3");  

    await sock.sendMessage(chat, {  
      audio: audioBuffer,  
      mimetype: "audio/mpeg",  
      fileName: video.title + ".mp3",  
      ptt: false,  
    });  

  } catch (e) {  
    console.error("Send audio error:", e);  
    await sock.sendMessage(chat, { text: `_• Gagal mengirim audio!\nError: ${e.message}_` });  
  }  

  fs.unlinkSync(filePath + ".mp3");  
});

},
};