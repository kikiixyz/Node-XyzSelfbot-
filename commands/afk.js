export default {
  name: "!afk",
  description: "Aktifkan mode AFK dengan alasan optional",
  tag: "info",

  async run(sock, msg, args) {
    const from = msg.key.remoteJid;

    if (!global.afkStatus) {
      global.afkStatus = {
        isAfk: false,
        start: null,
        reason: "",
        replied: new Set()
      };
    }

    if (!global.afkStatus.isAfk) {
      global.afkStatus.isAfk = true;
      global.afkStatus.start = Date.now();
      global.afkStatus.reason = args || "Tidak ada alasan";
      global.afkStatus.replied.clear();

      await sock.sendMessage(from, { text: `✅ AFK diaktifkan: ${global.afkStatus.reason}` });
    } else {
      global.afkStatus.isAfk = false;
      const duration = Date.now() - global.afkStatus.start;
      await sock.sendMessage(from, {
        text: `✔ Kamu kembali! Durasi AFK: ${Math.floor(duration / 1000)} detik.`
      });
    }
  }
};