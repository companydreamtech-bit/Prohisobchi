import unittest
import os
import sys

# Loyiha ildiz jildini sys.path ga qo'shish
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from bot import config, bot
from bot.bot import get_main_keyboard, get_inline_keyboard
from main import create_web_application


class TestBackend(unittest.IsolatedAsyncioTestCase):

    def test_1_config_loaded(self):
        """Konfiguratsiya va muhit o'zgaruvchilari to'g'ri yuklanganligini tekshirish"""
        self.assertIsNotNone(config.BOT_TOKEN, "BOT_TOKEN bo'sh bo'lmasligi kerak")
        self.assertIsNotNone(config.DEFAULT_GROUP_CHAT_ID, "DEFAULT_GROUP_CHAT_ID bo'sh bo'lmasligi kerak")
        self.assertTrue(config.WEBAPP_URL.startswith("http"), "WEBAPP_URL http yoki https bilan boshlanishi kerak")

    def test_2_keyboards(self):
        """Bot klaviaturalari to'g'ri tuzilganligini tekshirish"""
        url = "https://prohisobchi.test"
        
        reply_kb = get_main_keyboard(url)
        self.assertEqual(len(reply_kb.keyboard), 1)
        self.assertEqual(reply_kb.keyboard[0][0].web_app.url, url)

        inline_kb = get_inline_keyboard(url)
        self.assertEqual(len(inline_kb.inline_keyboard), 2)
        self.assertEqual(inline_kb.inline_keyboard[0][0].web_app.url, url)

    async def test_3_web_application_routes(self):
        """aiohttp server marshrutlari (routes) to'g'ri sozlanganligini tekshirish"""
        app = await create_web_application()
        
        routes = [r.resource.canonical for r in app.router.routes() if hasattr(r, 'resource') and r.resource]
        
        self.assertIn('/', routes, "Bosh sahifa / marshruti bo'lishi kerak")
        self.assertIn('/index.html', routes, "/index.html marshruti bo'lishi kerak")
        self.assertIn('/health', routes, "/health salomatlik marshruti bo'lishi kerak")

    def test_4_static_files_exist(self):
        """Web App asosiy statik fayllari mavjudligini tekshirish"""
        web_dir = os.path.join(BASE_DIR, "web")
        index_file = os.path.join(web_dir, "index.html")
        css_file = os.path.join(web_dir, "css", "style.css")
        app_js = os.path.join(web_dir, "js", "app.js")

        self.assertTrue(os.path.exists(index_file), "web/index.html mavjud bo'lishi kerak")
        self.assertTrue(os.path.exists(css_file), "web/css/style.css mavjud bo'lishi kerak")
        self.assertTrue(os.path.exists(app_js), "web/js/app.js mavjud bo'lishi kerak")


if __name__ == '__main__':
    unittest.main()
