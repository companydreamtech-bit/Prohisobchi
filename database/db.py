import sqlite3
import os
import json
import secrets
import string
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "prohisobchi.db")

def get_connection():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Baza jadvallarini yaratish va initsializatsiya qilish"""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Tenants / Mijozlar va ularning obunasi jadvali
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tenants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                phone TEXT,
                license_key TEXT UNIQUE NOT NULL,
                telegram_id INTEGER,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                role TEXT DEFAULT 'client',
                notes TEXT
            )
        """)

        # Har bir mijozning alohida ma'lumotlari (buyurtmalar, moliya, ombor, sozlamalar)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tenant_data (
                tenant_id TEXT NOT NULL,
                data_key TEXT NOT NULL,
                data_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (tenant_id, data_key),
                FOREIGN KEY (tenant_id) REFERENCES tenants (tenant_id) ON DELETE CASCADE
            )
        """)
        conn.commit()

def generate_license_key():
    """Chiroyli va xavfsiz PRO-XXXX-XXXX litsenziya kaliti yaratish"""
    chars = string.ascii_uppercase + string.digits
    # O'xshash belgilarni (O, 0, I, 1) chiqarib tashlaymiz
    clean_chars = ''.join(c for c in chars if c not in 'O0I1')
    p1 = ''.join(secrets.choice(clean_chars) for _ in range(4))
    p2 = ''.join(secrets.choice(clean_chars) for _ in range(4))
    return f"PRO-{p1}-{p2}"

def create_tenant(name: str, phone: str = "", duration_days: int = 30, license_key: str = None, telegram_id: int = None, notes: str = ""):
    """Yangi mijoz va unga litsenziya yaratish"""
    init_db()
    tenant_id = f"t_{secrets.token_hex(4)}"
    if not license_key:
        license_key = generate_license_key()
    else:
        license_key = license_key.strip().upper()

    now = datetime.now()
    expires_at = now + timedelta(days=duration_days)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tenants (tenant_id, name, phone, license_key, telegram_id, is_active, created_at, expires_at, notes)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
        """, (
            tenant_id,
            name.strip(),
            phone.strip(),
            license_key,
            telegram_id,
            now.strftime('%Y-%m-%d %H:%M:%S'),
            expires_at.strftime('%Y-%m-%d %H:%M:%S'),
            notes.strip()
        ))
        conn.commit()

    return {
        "tenant_id": tenant_id,
        "name": name,
        "phone": phone,
        "license_key": license_key,
        "created_at": now.strftime('%Y-%m-%d %H:%M:%S'),
        "expires_at": expires_at.strftime('%Y-%m-%d %H:%M:%S'),
        "duration_days": duration_days
    }

def verify_license(license_key: str, telegram_id: int = None):
    """
    Litsenziya kalitini tekshirish:
    - Kalit mavjudmi?
    - Bloklanganmi?
    - Muddati o'tganmi?
    """
    init_db()
    if not license_key:
        return {"valid": False, "status": "missing_key", "message": "Litsenziya kaliti kiritilmadi"}

    clean_key = license_key.strip().upper()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tenants WHERE license_key = ?", (clean_key,))
        row = cursor.fetchone()

        if not row:
            return {"valid": False, "status": "not_found", "message": "Bunday litsenziya kaliti topilmadi"}

        tenant = dict(row)

        if not tenant["is_active"]:
            return {"valid": False, "status": "blocked", "message": "Ushbu litsenziya administrator tomonidan to'xtatilgan"}

        # Telegram ID ni bog'lash (agar mavjud bo'lmasa)
        if telegram_id and not tenant.get("telegram_id"):
            cursor.execute("UPDATE tenants SET telegram_id = ? WHERE id = ?", (telegram_id, tenant["id"]))
            conn.commit()
            tenant["telegram_id"] = telegram_id

        # Muddatni tekshirish
        expires_at = datetime.strptime(tenant["expires_at"], '%Y-%m-%d %H:%M:%S')
        now = datetime.now()
        days_left = (expires_at - now).days

        if now > expires_at:
            return {
                "valid": False,
                "status": "expired",
                "message": f"Obuna muddati tugagan ({tenant['expires_at']}). Uzaytirish uchun adminga murojaat qiling.",
                "tenant": {
                    "tenant_id": tenant["tenant_id"],
                    "name": tenant["name"],
                    "expires_at": tenant["expires_at"]
                }
            }

        return {
            "valid": True,
            "status": "active",
            "message": "Litsenziya faol",
            "days_left": max(0, days_left),
            "tenant": {
                "tenant_id": tenant["tenant_id"],
                "name": tenant["name"],
                "phone": tenant["phone"],
                "license_key": tenant["license_key"],
                "expires_at": tenant["expires_at"],
                "role": tenant["role"]
            }
        }

def extend_tenant_subscription(tenant_id: str, additional_days: int):
    """Mijoz obunasini qo'shimcha kunlarga uzaytirish"""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT expires_at FROM tenants WHERE tenant_id = ? OR license_key = ?", (tenant_id, tenant_id))
        row = cursor.fetchone()
        if not row:
            return None

        current_exp = datetime.strptime(row["expires_at"], '%Y-%m-%d %H:%M:%S')
        now = datetime.now()
        # Agar muddati o'tib ketgan bo'lsa, bugundan boshlab qo'shamiz
        base_date = max(current_exp, now)
        new_exp = base_date + timedelta(days=additional_days)

        cursor.execute("UPDATE tenants SET expires_at = ?, is_active = 1 WHERE tenant_id = ? OR license_key = ?", (
            new_exp.strftime('%Y-%m-%d %H:%M:%S'),
            tenant_id,
            tenant_id
        ))
        conn.commit()
        return new_exp.strftime('%Y-%m-%d %H:%M:%S')

def set_tenant_status(tenant_id: str, is_active: bool):
    """Mijozni bloklash yoki qayta yoqish"""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE tenants SET is_active = ? WHERE tenant_id = ? OR license_key = ?", (
            1 if is_active else 0,
            tenant_id,
            tenant_id
        ))
        conn.commit()
        return cursor.rowcount > 0

def list_all_tenants():
    """Barcha mijozlar va ularning holati ro'yxati"""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tenants ORDER BY id DESC")
        rows = cursor.fetchall()
        now = datetime.now()
        natija = []
        for r in rows:
            t = dict(r)
            exp = datetime.strptime(t["expires_at"], '%Y-%m-%d %H:%M:%S')
            days_left = (exp - now).days
            t["days_left"] = days_left
            t["is_expired"] = now > exp
            natija.append(t)
        return natija

def save_tenant_data(tenant_id: str, data_key: str, data_content):
    """Mijoz ma'lumotlarini (buyurtma, kassa, ombor) serverga alohida saqlash"""
    init_db()
    json_str = json.dumps(data_content, ensure_ascii=False) if not isinstance(data_content, str) else data_content
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tenant_data (tenant_id, data_key, data_json, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(tenant_id, data_key) DO UPDATE SET
                data_json = excluded.data_json,
                updated_at = excluded.updated_at
        """, (tenant_id, data_key, json_str, now_str))
        conn.commit()
        return True

def get_tenant_data(tenant_id: str, data_key: str = None):
    """Mijozning serverdagi ma'lumotlarini olish"""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        if data_key:
            cursor.execute("SELECT data_json, updated_at FROM tenant_data WHERE tenant_id = ? AND data_key = ?", (tenant_id, data_key))
            row = cursor.fetchone()
            if row:
                try:
                    return json.loads(row["data_json"])
                except Exception:
                    return row["data_json"]
            return None
        else:
            cursor.execute("SELECT data_key, data_json, updated_at FROM tenant_data WHERE tenant_id = ?", (tenant_id,))
            rows = cursor.fetchall()
            natija = {}
            for r in rows:
                try:
                    natija[r["data_key"]] = json.loads(r["data_json"])
                except Exception:
                    natija[r["data_key"]] = r["data_json"]
            return natija
