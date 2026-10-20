import unittest
import os
import sys
import shutil
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import database

class TestSaasDatabaseAndMultiTenant(unittest.TestCase):
    def setUp(self):
        database.init_db()

    def test_01_create_tenant_and_verify(self):
        """Yangi mijoz yaratish va litsenziyasini tekshirish"""
        tenant = database.create_tenant(name="Akfa Sex Yunusobod", phone="+998901234567", duration_days=30)
        self.assertIsNotNone(tenant["tenant_id"])
        self.assertTrue(tenant["license_key"].startswith("PRO-"))

        # Kalitni tekshirish
        v = database.verify_license(tenant["license_key"])
        self.assertTrue(v["valid"])
        self.assertEqual(v["status"], "active")
        self.assertEqual(v["tenant"]["name"], "Akfa Sex Yunusobod")
        self.assertGreaterEqual(v["days_left"], 29)

    def test_02_invalid_and_expired_license(self):
        """Noto'g'ri yoki muddati tugagan litsenziya holatlari"""
        v_fake = database.verify_license("PRO-FAKE-9999")
        self.assertFalse(v_fake["valid"])
        self.assertEqual(v_fake["status"], "not_found")

        # 0 kunlik (muddati o'tgan) mijoz yaratish
        tenant_exp = database.create_tenant(name="Eski Sex", duration_days=-1)
        v_exp = database.verify_license(tenant_exp["license_key"])
        self.assertFalse(v_exp["valid"])
        self.assertEqual(v_exp["status"], "expired")

    def test_03_extend_subscription(self):
        """Obunani uzaytirish test"""
        tenant = database.create_tenant(name="Termiz OynaRom", duration_days=10)
        v1 = database.verify_license(tenant["license_key"])
        days_before = v1["days_left"]

        # +30 kun qo'shamiz
        new_exp = database.extend_tenant_subscription(tenant["license_key"], 30)
        self.assertIsNotNone(new_exp)

        v2 = database.verify_license(tenant["license_key"])
        self.assertGreater(v2["days_left"], days_before + 28)

    def test_04_block_and_unblock_tenant(self):
        """Mijozni bloklash va qayta yoqish"""
        tenant = database.create_tenant(name="Samarqand Rom", duration_days=60)
        
        # Bloklash
        database.set_tenant_status(tenant["license_key"], False)
        v_blocked = database.verify_license(tenant["license_key"])
        self.assertFalse(v_blocked["valid"])
        self.assertEqual(v_blocked["status"], "blocked")

        # Blokdan chiqarish
        database.set_tenant_status(tenant["license_key"], True)
        v_active = database.verify_license(tenant["license_key"])
        self.assertTrue(v_active["valid"])
        self.assertEqual(v_active["status"], "active")

    def test_05_multi_tenant_data_isolation(self):
        """Har bir mijozning bazasi alohida saqlanishi (Data Isolation)"""
        tenant_A = database.create_tenant(name="Ustaxona A", duration_days=30)
        tenant_B = database.create_tenant(name="Ustaxona B", duration_days=30)

        data_A = [{"id": 1, "mijoz": "Mijoz A", "summa": 500000}]
        data_B = [{"id": 2, "mijoz": "Mijoz B", "summa": 800000}]

        database.save_tenant_data(tenant_A["tenant_id"], "buyurtmalar", data_A)
        database.save_tenant_data(tenant_B["tenant_id"], "buyurtmalar", data_B)

        loaded_A = database.get_tenant_data(tenant_A["tenant_id"], "buyurtmalar")
        loaded_B = database.get_tenant_data(tenant_B["tenant_id"], "buyurtmalar")

        # A ning ma'lumotlari faqat A ga tegishli
        self.assertEqual(len(loaded_A), 1)
        self.assertEqual(loaded_A[0]["mijoz"], "Mijoz A")

        # B ning ma'lumotlari faqat B ga tegishli
        self.assertEqual(len(loaded_B), 1)
        self.assertEqual(loaded_B[0]["mijoz"], "Mijoz B")

if __name__ == '__main__':
    unittest.main()
