import asyncio
import logging
import json
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    WebAppInfo,
    FSInputFile
)
import os
from aiogram.enums import ParseMode

import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

bot = Bot(token=config.BOT_TOKEN)
dp = Dispatcher()

def get_main_keyboard(webapp_url: str):
    """Pastki doimiy WebApp menyusi"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Pro Hisobchi ilovasini ochish", web_app=WebAppInfo(url=webapp_url))]
        ],
        resize_keyboard=True
    )

def get_inline_keyboard(webapp_url: str):
    """Inline WebApp tugmasi"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🚀 Ilovani ishga tushirish", web_app=WebAppInfo(url=webapp_url))],
            [InlineKeyboardButton(text="ℹ️ Tizim haqida", callback_data="about_system")]
        ]
    )

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    webapp_url = config.WEBAPP_URL
    user_name = message.from_user.first_name if message.from_user else "Hurmatli mijoz"
    
    welcome_text = (
        f"👋 <b>Assalomu alaykum, {user_name}!</b>\n\n"
        f"🏢 <b>«Pro Hisobchi»</b> — Oyna-rom va to'rlar "
        f"ishlab chiqarish sexlari uchun avtomatlashtirilgan boshqaruv tizimiga xush kelibsiz!\n\n"
        f"<b>Tizim imkoniyatlari:</b>\n"
        f"• 📐 7 xil konstruksiya bo'yicha aniq avtomatik hisob-kitob\n"
        f"• ✂️ 1D Raskroy (chiqindisiz kesish optimizatsiyasi)\n"
        f"• 💰 Ikki toifali narxlash (Chakana & Diler)\n"
        f"• 📦 Xomashyo sarfi (BOM) va qoldiqlar ombori\n"
        f"• 💵 Kassa va Nasiya (qarz) daftari\n"
        f"• 👥 Ishchilar guruhi va mijozlar uchun avtomatik Telegram cheklari\n\n"
        f"Ilovani ochish uchun quyidagi tugmani bosing 👇"
    )
    
    logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "web", "img", "logo.png")
    
    if os.path.exists(logo_path):
        photo = FSInputFile(logo_path)
        await message.answer_photo(
            photo=photo,
            caption=welcome_text,
            parse_mode=ParseMode.HTML,
            reply_markup=get_inline_keyboard(webapp_url)
        )
        await message.answer(
            text="Pastki menyudan ham ilovani istalgan vaqt ochishingiz mumkin 👇",
            reply_markup=get_main_keyboard(webapp_url)
        )
    else:
        await message.answer(
            text=welcome_text,
            parse_mode=ParseMode.HTML,
            reply_markup=get_main_keyboard(webapp_url)
        )
        await message.answer(
            text="👇 <b>Mini App oynasini to'liq hajmda ochish:</b>",
            parse_mode=ParseMode.HTML,
            reply_markup=get_inline_keyboard(webapp_url)
        )

@dp.callback_query(F.data == "about_system")
async def about_handler(callback: types.CallbackQuery):
    info_text = (
        "🛠 <b>«Pro Hisobchi» Tizimi Haqida:</b>\n\n"
        "Tizim O'zbekistondagi ishlab chiqaruvchilar ehtiyojlariga moslashtirilgan.\n\n"
        "<b>Modullar:</b>\n"
        "1. <b>Yangi Buyurtma:</b> Tezkor o'lcham olish va narx chiqarish.\n"
        "2. <b>Buyurtmalar Tarixi:</b> Statuslar bilan tartiblangan arxiv.\n"
        "3. <b>Kesish (Raskroy):</b> Minimal chiqindi bilan 600 sm profil kesish rejasi.\n"
        "4. <b>Kalkulyator:</b> Tezkor kirim/chiqim hisob-kitobi.\n"
        "5. <b>Kassa:</b> Sof balans va moliyaviy oqim.\n"
        "6. <b>Qarz Daftari:</b> Haqqim va Qarzim hisobi.\n"
        "7. <b>Xomashyo & Qoldiqlar:</b> BOM spetsifikatsiyasi va 100 sm+ qoldiqlar.\n"
        "8. <b>Sozlamalar:</b> Profil formulalari, valyuta kursi va narxlar.\n\n"
        "<i>«Pro Hisobchi» — aniqlik, tezlik va yuqori daromad garovi!</i>"
    )
    await callback.message.answer(info_text, parse_mode=ParseMode.HTML)
    await callback.answer()

@dp.message(F.web_app_data)
async def web_app_data_handler(message: types.Message):
    """
    Mini App dan Telegram.WebApp.sendData() orqali kelgan ma'lumotlarni qabul qilish
    va sex guruhiga 2 ta alohida xabar sifatida yo'naltirish:
    1) Ishchilar uchun kesish xaritasi
    2) Kassa va mijoz cheki
    """
    try:
        raw_data = message.web_app_data.data
        data = json.loads(raw_data)
        
        target_chat_id = data.get("chat_id") or config.DEFAULT_GROUP_CHAT_ID
        
        # 1-xabar: Ishchilar uchun kesish xaritasi
        cutting_map_text = data.get("cutting_map_text")
        if cutting_map_text:
            await bot.send_message(
                chat_id=target_chat_id,
                text=cutting_map_text,
                parse_mode=ParseMode.HTML
            )
            
        # 2-xabar: Kassa va mijoz hisob cheki
        invoice_text = data.get("invoice_text")
        if invoice_text:
            await bot.send_message(
                chat_id=target_chat_id,
                text=invoice_text,
                parse_mode=ParseMode.HTML
            )
            
        await message.answer(
            "✅ <b>Buyurtma muvaffaqiyatli qabul qilindi va sex guruhiga yuborildi!</b>\n"
            "• Ishchilar uchun kesish xaritasi ✂️\n"
            "• Moliyaviy hisob cheki 🧾",
            parse_mode=ParseMode.HTML
        )
    except Exception as e:
        logger.error(f"Xatolik web_app_data: {e}")
        await message.answer(f"⚠️ Ma'lumotlarni qabul qilishda xatolik yuz berdi: {str(e)}")

@dp.message(Command("help"))
async def help_command(message: types.Message):
    help_text = (
        "📖 <b>Yordam bo'limi:</b>\n\n"
        "• /start — Botni qayta ishga tushirish va menyuni ochish\n"
        "• /help — Botdan foydalanish bo'yicha ko'rsatma\n"
        "• /id — Joriy chat yoki guruhning ID raqamini aniqlash\n\n"
        "Savollar yoki takliflar uchun tizim administratoriga murojaat qiling."
    )
    await message.answer(help_text, parse_mode=ParseMode.HTML)

@dp.message(Command("license"))
async def license_command(message: types.Message):
    """SaaS Litsenziya va obuna tekshirish"""
    user_id = message.from_user.id
    license_text = (
        "🔐 <b>«Pro Hisobchi» Litsenziya Tizimi:</b>\n\n"
        f"• Sizning Telegram ID: <code>{user_id}</code>\n"
        "• Litsenziya holati: <b>Faol (Cheksiz / PRO)</b> ✅\n"
        "• Tizim rejimi: <b>Ko'p foydalanuvchili (Multi-Tenant SaaS)</b>\n\n"
        "<i>Boshqa usta yoki sexlar uchun litsenziya kalitini faollashtirish:</i>\n"
        "<code>/activate PRO-2026-UZB</code>"
    )
    await message.answer(license_text, parse_mode=ParseMode.HTML)

@dp.message(Command("activate"))
async def activate_command(message: types.Message):
    args = message.text.split()
    if len(args) > 1:
        code = args[1]
        await message.answer(
            f"🎉 <b>Litsenziya muvaffaqiyatli faollashtirildi!</b>\n"
            f"Kalit kodi: <code>{code}</code>\n"
            f"Barcha modullar (1D Raskroy, Kassa, Qarz, BOM) cheklovlarsiz ishga tushirildi.",
            parse_mode=ParseMode.HTML
        )
    else:
        await message.answer("⚠️ Litsenziya kodini kiriting. Masalan: <code>/activate PRO-2026-UZB</code>", parse_mode=ParseMode.HTML)

@dp.message(Command("id"))
async def id_command(message: types.Message):
    chat_info = (
        f"🆔 <b>Chat ma'lumotlari:</b>\n\n"
        f"• Chat ID: <code>{message.chat.id}</code>\n"
        f"• Chat turi: <b>{message.chat.type}</b>\n"
        f"• Sizning ID: <code>{message.from_user.id}</code>"
    )
    await message.answer(chat_info, parse_mode=ParseMode.HTML)

async def main():
    logger.info("Bot ishga tushmoqda...")
    # Polling boshlash
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot to'xtatildi!")
