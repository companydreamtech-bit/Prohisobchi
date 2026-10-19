import os
from dotenv import load_dotenv

load_dotenv()

# Telegram Bot sozlamalari
BOT_TOKEN = os.getenv("BOT_TOKEN", "8679001022:AAEIMoxtqikm1uvCiQu6RUBfT7tvEp9EWSs")
DEFAULT_GROUP_CHAT_ID = os.getenv("GROUP_CHAT_ID", "-1004321522025")

# Telegram Mini App URL (Railway domenni avtomatik aniqlash)
railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
default_url = f"https://{railway_domain}" if railway_domain else "https://pro-hisobchi.vercel.app"
WEBAPP_URL = os.getenv("WEBAPP_URL", default_url)
