import sys
import yt_dlp

if len(sys.argv) < 3:
    print("Usage: python worker.py <query> <output_path>")
    sys.exit(1)

query = sys.argv[1]
output_path = sys.argv[2]

ydl_opts = {
    'format': 'bestaudio/best',
    'outtmpl': output_path,
    'noplaylist': True,
    'quiet': True,
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    try:
        info = ydl.extract_info(f"ytsearch1:{query}", download=True)
        print("✅ Download complete")
    except Exception as e:
        print("❌ Error:", e)
        sys.exit(1)