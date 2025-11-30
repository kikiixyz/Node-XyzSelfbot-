// utils/getMedia.js
export function getMediaMessageWrapper(msg) {
  try {
    // 1) Direct message (msg.message is already the wrapper)
    if (msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.documentMessage) {
      return msg; // full msg can be passed to downloadMediaMessage
    }

    // 2) Quoted message (reply)
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (ctx?.quotedMessage) {
      // ctx.quotedMessage is already a message node (e.g. { imageMessage: {...} })
      // We need to create a wrapper similar to an incoming message: { message: ctx.quotedMessage }
      return { key: ctx.stanzaId ? { id: ctx.stanzaId } : msg.key, message: ctx.quotedMessage };
    }

    // 3) ephemeralMessage (some clients wrap message in ephemeralMessage)
    if (msg.message?.ephemeralMessage?.message) {
      const inner = msg.message.ephemeralMessage.message;
      if (inner.imageMessage || inner.videoMessage || inner.documentMessage) {
        return { key: msg.key, message: inner };
      }
    }

    // 4) viewOnceMessage
    if (msg.message?.viewOnceMessage?.message) {
      const inner = msg.message.viewOnceMessage.message;
      if (inner.imageMessage || inner.videoMessage || inner.documentMessage) {
        return { key: msg.key, message: inner };
      }
    }

    // 5) contextInfo with quoted but nested (some versions)
    if (ctx?.quotedMessage?.ephemeralMessage?.message) {
      const inner = ctx.quotedMessage.ephemeralMessage.message;
      if (inner.imageMessage || inner.videoMessage || inner.documentMessage) {
        return { key: msg.key, message: inner };
      }
    }

    return null;
  } catch (e) {
    console.error("getMediaMessageWrapper error:", e);
    return null;
  }
}