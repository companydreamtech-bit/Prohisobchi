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

try:
    from . import config
except (ImportError, ValueError):
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

import database

def is_admin(user_id: int) -> bool:
    """Foydalanuvchi admin ekanligini tekshirish"""
    if not config.ADMIN_IDS:
        return True  # Agar ADMIN_IDS bo'sh bo'lsa, erkin boshqarishga ruxsat
    return user_id in config.ADMIN_IDS

@dp.message(Command("admin"))
async def admin_panel_command(message: types.Message):
    """SaaS Admin Boshqaruv Paneli"""
    if not is_admin(message.from_user.id):
        await message.answer("⛔ <b>Kechirasiz, bu bo'lim faqat tizim administratori uchun!</b>", parse_mode=ParseMode.HTML)
        return

    tenants = database.list_all_tenants()
    active_count = sum(1 for t in tenants if t["is_active"] and not t["is_expired"])
    expired_count = sum(1 for t in tenants if t["is_expired"])

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="👥 Mijozlar ro'yxati", callback_data="admin_list_clients")],
            [
                InlineKeyboardButton(text="➕ 1 oylik mijoz", callback_data="admin_add_30"),
                InlineKeyboardButton(text="➕ 1 yillik mijoz", callback_data="admin_add_365")
            ],
            [InlineKeyboardButton(text="📊 Statistika", callback_data="admin_stats")]
        ]
    )

    admin_text = (
        "👑 <b>«PRO HISOBCHI» SAAS ADMIN PANELI</b>\n\n"
        f"📊 <b>Jami mijozlar:</b> {len(tenants)} ta\n"
        f"🟢 <b>Faol obunalar:</b> {active_count} ta\n"
        f"🔴 <b>Muddati tugaganlar:</b> {expired_count} ta\n\n"
        "<b>Tezkor buyruqlar:</b>\n"
        "• <code>/newclient Nomi Kunlar</code> — Yangi mijoz va parol ochish\n"
        "  <i>(Masalan: <code>/newclient Akfa_Chilonzor 30</code>)</i>\n"
        "• <code>/extend KALIT 30</code> — Obunani uzaytirish\n"
        "• <code>/block KALIT</code> — Mijozni to'xtatish\n"
        "• <code>/unblock KALIT</code> — Mijozni qayta faollashtirish\n"
        "• <code>/clients</code> — Barcha mijozlarni ko'rish"
    )
    await message.answer(admin_text, parse_mode=ParseMode.HTML, reply_markup=kb)

@dp.message(Command("newclient"))
async def newclient_command(message: types.Message):
    """Yangi mijoz va litsenziya kaliti yaratish"""
    if not is_admin(message.from_user.id):
        await message.answer("⛔ Faqat administrator uchun!")
        return

    parts = message.text.split()
    if len(parts) < 2:
        await message.answer(
            "⚠️ <b>Foydalanish tartibi:</b>\n"
            "<code>/newclient [Ustaxona_Nomi] [Kunlar_Soni]</code>\n\n"
            "Masalan:\n"
            "<code>/newclient Akfa_Sex_1 30</code>\n"
            "<code>/newclient OynaRom_Buxoro 365</code>",
            parse_mode=ParseMode.HTML
        )
        return

    nomi = parts[1].replace("_", " ")
    days = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 30

    tenant = database.create_tenant(name=nomi, duration_days=days)

    client_msg = (
        f"🎉 <b>Yangi mijoz muvaffaqiyatli yaratildi!</b>\n\n"
        f"🏢 Ustaxona: <b>{tenant['name']}</b>\n"
        f"🔑 Litsenziya kodi (Parol): <code>{tenant['license_key']}</code>\n"
        f"⏰ Obuna muddati: <b>{days} kun ({tenant['expires_at']} gacha)</b>\n"
        f"🆔 Tenant ID: <code>{tenant['tenant_id']}</code>\n\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📩 <b>Mijozga yuborish uchun tayyor matn:</b>\n\n"
        f"«Assalomu alaykum! <b>«Pro Hisobchi»</b> ustaxona ERP tizimiga xush kelibsiz!\n\n"
        f"🔑 Sizning kirish kodingiz: <code>{tenant['license_key']}</code>\n"
        f"⏰ Faollik muddati: {days} kun ({tenant['expires_at']} gacha)\n\n"
        f"Ilovani ochish uchun: {config.WEBAPP_URL} »"
    )
    await message.answer(client_msg, parse_mode=ParseMode.HTML)

@dp.message(Command("clients"))
async def clients_command(message: types.Message):
    """Barcha mijozlar ro'yxatini ko'rsatish"""
    if not is_admin(message.from_user.id):
        await message.answer("⛔ Faqat administrator uchun!")
        return

    tenants = database.list_all_tenants()
    if not tenants:
        await message.answer("Hozircha tizimda mijozlar yo'q. Yangi qo'shish uchun: <code>/newclient Nomi 30</code>", parse_mode=ParseMode.HTML)
        return

    lines = ["👥 <b>MIJOZLAR VA OBUNALAR RO'YXATI:</b>\n"]
    for i, t in enumerate(tenants, 1):
        status_icon = "🟢" if (t["is_active"] and not t["is_expired"]) else "🔴"
        qolgan = f"{t['days_left']} kun qoldi" if not t["is_expired"] else "TUGAGAN"
        lines.append(
            f"{i}. {status_icon} <b>{t['name']}</b>\n"
            f"   🔑 Kalit: <code>{t['license_key']}</code>\n"
            f"   ⏳ Muddat: {qolgan} ({t['expires_at'].split()[0]})\n"
        )

    await message.answer("\n".join(lines), parse_mode=ParseMode.HTML)

@dp.message(Command("extend"))
async def extend_command(message: types.Message):
    """Obunani uzaytirish"""
    if not is_admin(message.from_user.id):
        await message.answer("⛔ Faqat administrator uchun!")
        return

    parts = message.text.split()
    if len(parts) < 3 or not parts[2].isdigit():
        await message.answer("⚠️ Format: <code>/extend [KALIT_YOKI_TENANT_ID] [QO'SHILADIGAN_KUNLAR]</code>\nMasalan: <code>/extend PRO-ABCD-1234 30</code>", parse_mode=ParseMode.HTML)
        return

    key = parts[1].strip()
    days = int(parts[2])
    new_exp = database.extend_tenant_subscription(key, days)

    if new_exp:
        await message.answer(f"✅ <b>{key}</b> obunasi +{days} kunga uzaytirildi!\nYangi tugash muddati: <b>{new_exp}</b>", parse_mode=ParseMode.HTML)
    else:
        await message.answer("❌ Bunday litsenziya kaliti topilmadi!")

@dp.message(Command("block"))
async def block_command(message: types.Message):
    """Mijozni to'xtatish"""
    if not is_admin(message.from_user.id):
        return
    parts = message.text.split()
    if len(parts) < 2:
        await message.answer("⚠️ Format: <code>/block [KALIT]</code>", parse_mode=ParseMode.HTML)
        return
    ok = database.set_tenant_status(parts[1].strip(), False)
    if ok:
        await message.answer(f"🚫 Litsenziya ({parts[1]}) muvaffaqiyatli bloklandi.")
    else:
        await message.answer("❌ Kalit topilmadi.")

@dp.message(Command("unblock"))
async def unblock_command(message: types.Message):
    """Mijozni qayta yoqish"""
    if not is_admin(message.from_user.id):
        return
    parts = message.text.split()
    if len(parts) < 2:
        await message.answer("⚠️ Format: <code>/unblock [KALIT]</code>", parse_mode=ParseMode.HTML)
        return
    ok = database.set_tenant_status(parts[1].strip(), True)
    if ok:
        await message.answer(f"✅ Litsenziya ({parts[1]}) faollashtirildi.")
    else:
        await message.answer("❌ Kalit topilmadi.")

@dp.callback_query(F.data == "admin_list_clients")
async def cb_admin_clients(callback: types.CallbackQuery):
    await callback.answer()
    await clients_command(callback.message)

@dp.callback_query(F.data.startswith("admin_add_"))
async def cb_admin_quick_add(callback: types.CallbackQuery):
    days = 365 if "365" in callback.data else 30
    tenant = database.create_tenant(name=f"Ustaxona_{secrets.token_hex(2).upper()}", duration_days=days)
    await callback.message.answer(
        f"🎉 <b>Yangi {days} kunlik litsenziya yaratildi:</b>\n\n"
        f"🏢 Nomi: <b>{tenant['name']}</b>\n"
        f"🔑 Kalit kodi: <code>{tenant['license_key']}</code>\n"
        f"⏰ Tugash muddati: <b>{tenant['expires_at']}</b>",
        parse_mode=ParseMode.HTML
    )
    await callback.answer("Yaratildi!")

@dp.message(Command("license"))
async def license_command(message: types.Message):
    """Mijoz o'z litsenziyasini tekshirishi"""
    user_id = message.from_user.id
    tenants = database.list_all_tenants()
    user_tenant = next((t for t in tenants if t.get("telegram_id") == user_id), None)

    if user_tenant:
        exp = user_tenant["expires_at"]
        status = "Faol ✅" if not user_tenant["is_expired"] and user_tenant["is_active"] else "Muddati tugagan 🔴"
        await message.answer(
            f"🔐 <b>Sizning Litsenziyangiz:</b>\n\n"
            f"🏢 Ustaxona: <b>{user_tenant['name']}</b>\n"
            f"🔑 Kalit: <code>{user_tenant['license_key']}</code>\n"
            f"📊 Holat: <b>{status}</b>\n"
            f"⏳ Tugash muddati: <b>{exp}</b> ({user_tenant['days_left']} kun qoldi)",
            parse_mode=ParseMode.HTML
        )
    else:
        await message.answer(
            "ℹ️ <b>Siz hali litsenziya kalitini faollashtirmagansiz.</b>\n\n"
            "Litsenziyani ulash uchun:\n"
            "<code>/activate PRO-XXXX-XXXX</code>\n\n"
            "Litsenziya sotib olish uchun adminga murojaat qiling.",
            parse_mode=ParseMode.HTML
        )

@dp.message(Command("activate"))
async def activate_command(message: types.Message):
    """Litsenziya kalitini Telegram hisobiga bog'lash"""
    args = message.text.split()
    if len(args) > 1:
        code = args[1].strip()
        v = database.verify_license(code, telegram_id=message.from_user.id)
        if v.get("valid"):
            t = v["tenant"]
            await message.answer(
                f"🎉 <b>Litsenziya muvaffaqiyatli faollashtirildi!</b>\n\n"
                f"🏢 Ustaxona: <b>{t['name']}</b>\n"
                f"🔑 Kalit: <code>{t['license_key']}</code>\n"
                f"⏳ Qolgan muddat: <b>{v.get('days_left', 0)} kun ({t['expires_at']} gacha)</b>\n\n"
                f"Endi dasturdan to'liq foydalanishingiz mumkin 👇",
                parse_mode=ParseMode.HTML,
                reply_markup=get_main_keyboard(config.WEBAPP_URL)
            )
        else:
            await message.answer(f"❌ <b>Xatolik:</b> {v.get('message')}", parse_mode=ParseMode.HTML)
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
