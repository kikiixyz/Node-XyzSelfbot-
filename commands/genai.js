import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDIaqMO_rVlT-NIP02SJqPwYbIArJJtqnI",
});

export default {
  name: "!ai",
  description: "Bertanya ke Gemini AI",
  tag: "ai",

  run: async (sock, msg, args) => {
    try {
      const text = args?.trim();
      const jid = msg.key.remoteJid;

      if (!text)
        return sock.sendMessage(jid, {
          text: "⚙️ Kirim pertanyaan seperti:\n\n*!ai apa itu kecerdasan buatan?*",
        });

      if (/buat.*video|generate.*video|create.*video/i.test(text)) {
        return sock.sendMessage(jid, {
          text: "❌ Maaf, saya *tidak bisa membuat video*.",
        });
      }

      const uniqueID = msg.key.id + "_AI";
      if (!global.__anti_dupe_ai) global.__anti_dupe_ai = new Set();
      if (global.__anti_dupe_ai.has(uniqueID)) return;
      global.__anti_dupe_ai.add(uniqueID);

      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: text,
      });

      if (res.images && res.images.length > 0) {
        const imgBuffer = Buffer.from(res.images[0], "base64");

        return sock.sendMessage(jid, {
          image: imgBuffer,
          caption: "🎨 Gambar dari Gemini AI",
        });
      }

      if (res.text) {
        return sock.sendMessage(jid, {
          text: res.text,
        });
      }

      return sock.sendMessage(jid, {
        text: "⚠️ AI tidak mengembalikan respons yang dapat dibaca.",
      });
    } catch (err) {
      console.log("AI ERROR:", err);
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Terjadi kesalahan saat memproses AI!",
      });
    }
  },
};