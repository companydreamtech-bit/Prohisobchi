# 🏢 Pro Hisobchi — Oyna-Rom va To'rlar Sexi Boshqaruv Tizimi

**«Pro Hisobchi»** — O'zbekistondagi oyna-rom va to'r ishlab chiqaruvchi sexlar, ustalar va dilerlar uchun maxsus yaratilgan yaxlit **Telegram Bot** va **Telegram Mini App (TMA)** boshqaruv platformasi.

---

## 🚀 Loyiha Imkoniyatlari

1. **📐 8 ta To'liq Modul:**
   - **Yangi Buyurtma:** O'lchamlarni qulay kiritish, jonli narx hisoblash, to'lov holatini tanlash.
   - **Buyurtmalar Tarixi:** Qidiruv, statuslar (*Kutilmoqda, Jarayonda, Tayyor*), nusxa olish, Telegramga jo'natish.
   - **Kesish (1D Raskroy):** Standart 600 sm lik profildan eng kam chiqindi bilan kesish xaritasi, rangli vizual lentalar, 100 sm+ yaroqli qoldiqlardan birinchi foydalanish.
   - **Tezkor Kalkulyator:** Kvadratura va narxni bir lahzada hisoblash.
   - **Kassa:** Jami kirim, chiqim, sof balans va moliyaviy tranzaksiyalar.
   - **Qarz Daftari:** *Menga berilishi kerak (Haqqim)* va *Men berishim kerak (Qarzim)*, to'lovni bir bosishda yopish.
   - **Xomashyo & Qoldiqlar Ombori:** Avtomatik BOM (Bill of Materials) ehtiyoji va 100 sm+ qoldiqlar zaxirasi.
   - **Sozlamalar:** Chakana/Diler narxlari ($/m²), valyuta kursi (so'm), Telegram Bot sozlamalari, JSON Backup & Restore.

2. **⚙️ 7 ta Konstruksiya Bo'yicha Aniq Formulalar:**
   - **Rom yonga:** `RamkaBo'yi = H`, `RamkaEni = W + 2`, `Ruchka = H - 0.8`, `Setka = H + 2 (dona: En/2)`, `Ip = H + W + 20`
   - **Rom pastga:** `RamkaBo'yi = H + 2`, `RamkaEni = W`, `Ruchka = W - 0.8`, `Setka = Bo'yi/2 (dona: W + 2)`, `Ip = H + W + 20`
   - **Eshik:** `RamkaBo'yi = H`, `RamkaEni = W + 4`, `Ruchka = H - 0.6`, `Setka = H + 4 (dona: W / 2.5)`
   - **Tayyor eshik:** `RamkaBo'yi = H - 8`, `RamkaEni = W - 4`, `Ruchka = H - 8.6`, `Setka = H - 4 (dona: W / 2.5)`
   - **Evro parog:** `RamkaBo'yi = H - 2`, `RamkaEni = W + 4`, `Ruchka = H - 2`, `Setka = H + 3 (dona: W / 2.5)`
   - **Tayyor evro:** `RamkaBo'yi = H - 6.5`, `RamkaEni = W - 4`, `Ruchka = H - 6.5`, `Setka = H - 2 (dona: W / 2.5)`
   - **Haytek:** `RamkaBo'yi = H + 3`, `RamkaEni = W + 3`, Ruchka yo'q.

3. **🎨 Premium B2B SaaS Dizayn:**
   - To'q zumrad yashil (`#0F382C`) va yalpiz aksenti (`#10B981`) uyg'unligi.
   - Tungi va Kunduzgi rejim (Dark / Light mode).
   - Mobil-birinchi (Telegram oynasi, 390px kenglik) va to'liq Telegram WebApp integratsiyasi (Haptic feedback, SendData).

---

## 📁 Loyiha Tuzilmasi

```
pro-hisobchi/
├── bot/                  # Telegram Bot (Python / Aiogram 3.x)
│   ├── bot.py            # /start komandasi, Web App tugmasi va guruhga jo'natish
│   ├── config.py         # Bot token va sozlamalar
│   └── requirements.txt  # aiogram, aiohttp, python-dotenv
│
├── web/                  # Telegram Mini App (Frontend)
│   ├── index.html        # Asosiy sahifa (8 ta modul)
│   ├── css/
│   │   └── style.css     # Zamonaviy B2B dizayn (to'q yashil + neytral)
│   └── js/
│       ├── app.js        # Boshqaruv va marshrutlash (tabs)
│       ├── calculator.js # Narx, kvadratura va formulalar
│       ├── cutting.js    # 1D Raskroy (chiqindisiz kesish) algoritmi
│       ├── inventory.js  # Xomashyo sarfi (BOM) va qoldiqlar ombori
│       ├── finance.js    # Kassa va Qarz daftari
│       └── telegram.js   # Guruhga yuborish va nusxalash
│
└── README.md             # Hujjat va ishga tushirish qo'llanmasi
```

---

## 🛠 O'rnatish va Ishga Tushirish

### 1. Telegram Botni Ishga Tushirish (Python)

1. **Virtual muhit yaratish va kutubxonalarni o'rnatish:**
   ```bash
   cd bot
   python -m venv venv
   # Windows uchun:
   venv\Scripts\activate
   # Linux/macOS uchun:
   # source venv/bin/activate

   pip install -r requirements.txt
   ```

2. **Sozlamalarni kiritish:**
   `bot/config.py` yoki `.env` faylida bot tokeningiz va web ilova havolasini tekshiring:
   ```python
   BOT_TOKEN = "SIZNING_BOT_TOKENINGIZ"
   DEFAULT_GROUP_CHAT_ID = "-1004321522025"
   WEBAPP_URL = "https://pro-hisobchi.vercel.app"  # Mini app havolasi
   ```

3. **Botni yurgazish:**
   ```bash
   python bot.py
   ```

---

### 🚂 Railway orqali 1-bosqichda To'liq Deploy Qilish (Yagona Server)

Loyiha uchun yagona `main.py` yaratilgan bo'lib, u **ham Web App (Mini App) ni, ham Telegram Botni bir vaqtning o'zida yagona konteynerda** ishga tushiradi:

1. GitHub'ga loyihani yuklang (`git push`).
2. [Railway.app](https://railway.app) ga kiring va **"New Project"** -> **"Deploy from GitHub repo"** ni tanlang.
3. **Variables** (Muhit o'zgaruvchilari) bo'limiga quyidagilarni kiriting:
   - `BOT_TOKEN`: `8679001022:AAEIMoxtqikm1uvCiQu6RUBfT7tvEp9EWSs`
   - `GROUP_CHAT_ID`: `-1004321522025`
4. **Networking** bo'limida **"Generate Domain"** tugmasini bosing (masalan: `prohisobchi.up.railway.app`).
5. Tayyor! Railway ushbu domenni avtomatik aniqlaydi va botingiz ham, Mini Appingiz ham bir joyda 24/7 ishlab turadi.

---

### 2. Telegram Mini App (Web) ni Ishga Tushirish

Frontend toza HTML, CSS va Vanilla JS da yozilgan bo'lib, hech qanday qo'shimcha kompilyatsiya yoki og'ir node_modules talab qilmaydi.

1. **Lokal tekshirish (Local Server):**
   VS Code da `Live Server` plagini orqali yoki Python orqali:
   ```bash
   cd web
   python -m http.server 8000
   ```
   Brauzerda oching: `http://localhost:8000`

2. **Telegramda ochish uchun internetga joylash:**
   - Loyihani [Vercel](https://vercel.com), [Netlify](https://netlify.com) yoki [GitHub Pages](https://pages.github.com) ga bepul yuklang.
   - Masalan: `https://sizning-saytingiz.vercel.app`

3. **@BotFather orqali Mini App tugmasini ulash:**
   - Telegramda [@BotFather](https://t.me/BotFather) ga kiring.
   - `/mybots` -> Botingizni tanlang -> `Bot Settings` -> `Menu Button` -> `Configure menu button`.
   - WebApp havolasini yuboring (masalan: `https://sizning-saytingiz.vercel.app`).
   - Tugma nomini yozing: `Pro Hisobchi 📱`.

---

## 📦 Guruhga Xabar Yuborish Formati

Buyurtma tasdiqlanganda bot API orqali sex guruhiga avtomatik **2 ta toza formatlangan xabar** jo'natiladi:

1. **Ishchilar uchun kesish xaritasi:**
   - Buyurtma raqami, sanasi, mijoz ismi va rangi.
   - Konstruksiya bo'yicha ramka, ruchka, to'r va ip o'lchamlari.
   - 600 sm tayoqlardan qaysi qismlar qanday kesilishi va qoldiqlar.
   - Moddiy ehtiyoj ro'yxati (BOM).

2. **Kassa va Mijoz cheki:**
   - Kvadratura, dona, chakana/diler narxi.
   - Jami summa (Dollar va So'mda).
   - Valyuta kursi va to'lov holati (Kassa / Nasiya).

---

## 💾 Ma'lumotlar Xavfsizligi

Barcha ma'lumotlar foydalanuvchining o'z qurilmasida `localStorage` orqali xavfsiz saqlanadi. **Sozlamalar** bo'limida **"JSON Eksport"** tugmasi orqali istalgan vaqtda to'liq zaxira nusxasini (Backup) yuklab olish va boshqa telefon/kompyuterga **"JSON Tiklash"** tugmasi orqali bir lahzada ko'chirish mumkin.
