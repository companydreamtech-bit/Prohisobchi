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

    import database

    # REST API: Litsenziya tekshirish
    async def api_auth_verify(request):
        try:
            body = await request.json()
        except Exception:
            body = {}
        license_key = body.get("license_key", "")
        telegram_id = body.get("telegram_id")
        result = database.verify_license(license_key, telegram_id)
        return web.json_response(result, headers={"Access-Control-Allow-Origin": "*"})

    # REST API: Mijoz ma'lumotlarini yuklab olish
    async def api_tenant_get_data(request):
        license_key = request.query.get("license_key", "")
        data_key = request.query.get("data_key")
        v = database.verify_license(license_key)
        if not v.get("valid"):
            return web.json_response({"ok": False, "error": v.get("message")}, status=403, headers={"Access-Control-Allow-Origin": "*"})
        
        tenant_id = v["tenant"]["tenant_id"]
        data = database.get_tenant_data(tenant_id, data_key)
        return web.json_response({"ok": True, "tenant": v["tenant"], "data": data}, headers={"Access-Control-Allow-Origin": "*"})

    # REST API: Mijoz ma'lumotlarini serverga sinxronizatsiya qilish
    async def api_tenant_sync(request):
        try:
            body = await request.json()
        except Exception:
            return web.json_response({"ok": False, "error": "Noto'g'ri JSON formati"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
            
        license_key = body.get("license_key", "")
        data_key = body.get("data_key", "")
        content = body.get("content")
        
        v = database.verify_license(license_key)
        if not v.get("valid"):
            return web.json_response({"ok": False, "error": v.get("message")}, status=403, headers={"Access-Control-Allow-Origin": "*"})
        
        tenant_id = v["tenant"]["tenant_id"]
        database.save_tenant_data(tenant_id, data_key, content)
        return web.json_response({"ok": True, "synced_key": data_key}, headers={"Access-Control-Allow-Origin": "*"})

    # CORS OPTIONS
    async def api_options_handler(request):
        return web.Response(status=204, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        })

    app.router.add_get('/', index_handler)
    app.router.add_get('/index.html', index_handler)
    app.router.add_get('/health', health_handler)
    
    app.router.add_post('/api/auth/verify', api_auth_verify)
    app.router.add_get('/api/tenant/data', api_tenant_get_data)
    app.router.add_post('/api/tenant/sync', api_tenant_sync)
    
    app.router.add_route('OPTIONS', '/api/auth/verify', api_options_handler)
    app.router.add_route('OPTIONS', '/api/tenant/data', api_options_handler)
    app.router.add_route('OPTIONS', '/api/tenant/sync', api_options_handler)

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
