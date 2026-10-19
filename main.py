import asyncio
import logging
import os
import sys
from aiohttp import web

# Loyiha ildiz jildini sys.path ga qo'shish
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from bot import bot, dp, config

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("pro_hisobchi")

# Web App statik fayllari yo'li
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "web")

async def create_web_application():
    """Aiohttp orqali Web App statik fayllarini va salomatlik tekshiruvini (healthcheck) ulash"""
    app = web.Application()

    # Statik fayllar: css, js, img
    css_dir = os.path.join(WEB_DIR, "css")
    js_dir = os.path.join(WEB_DIR, "js")
    img_dir = os.path.join(WEB_DIR, "img")

    if os.path.exists(css_dir):
        app.router.add_static('/css', css_dir)
    if os.path.exists(js_dir):
        app.router.add_static('/js', js_dir)
    if os.path.exists(img_dir):
        app.router.add_static('/img', img_dir)

    async def index_handler(request):
        index_file = os.path.join(WEB_DIR, "index.html")
        return web.FileResponse(index_file)

    async def health_handler(request):
        return web.json_response({
            "status": "ok",
            "service": "Pro Hisobchi Unified Server",
            "bot_connected": True
        })

    app.router.add_get('/', index_handler)
    app.router.add_get('/index.html', index_handler)
    app.router.add_get('/health', health_handler)

    return app

async def main():
    # Railway PORT muhit parametrini oladi (standart 8080)
    port = int(os.environ.get("PORT", 8080))
    host = "0.0.0.0"

    logger.info("=" * 50)
    logger.info("🚀 «Pro Hisobchi» Railway Serveri Ishga Tushmoqda...")
    logger.info("=" * 50)

    # Railway tomonidan avtomatik berilgan domenni tekshirish
    railway_domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN")
    if railway_domain:
        auto_url = f"https://{railway_domain}"
        config.WEBAPP_URL = auto_url
        logger.info(f"🌐 Railway WebApp domeni aniqlandi: {auto_url}")

    # Web serverni ishga tushirish
    app = await create_web_application()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host, port)
    await site.start()
    logger.info(f"🌐 Web App serveri ishga tushdi: http://{host}:{port}")

    # Telegram Bot Pollingni ishga tushirish
    logger.info("🤖 Telegram Bot Polling boshlanmoqda...")
    await bot.delete_webhook(drop_pending_updates=True)
    
    try:
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()
        await bot.session.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Server to'xtatildi!")
