import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n============================================================');
console.log('🧪 «PRO HISOBCHI» TO\'LIQ TIZIM TESTLARI BOSHLANMOQDA');
console.log('============================================================\n');

// 1. Node.js Testlarini ishga tushirish (Calculator, Cutting, Inventory, Finance, Telegram)
console.log('📌 1-BOSQICH: Frontend va Hisob-Kitob Yadrosi Testlari (Node.js Test Runner)...\n');

const jsTests = [
  path.join(__dirname, 'test_calculator.js'),
  path.join(__dirname, 'test_cutting.js'),
  path.join(__dirname, 'test_inventory_finance.js'),
  path.join(__dirname, 'test_single_page_html.js'),
  path.join(__dirname, 'test_full_system.js')
];

const nodeTest = spawnSync('node', ['--test', ...jsTests], {
  stdio: 'inherit',
  shell: true
});

if (nodeTest.status !== 0) {
  console.error('\n❌ Frontend testlarida xatolik aniqlandi!');
  process.exit(1);
}

console.log('\n✅ Frontend barcha unit testlari 100% muvaffaqiyatli yakunlandi!\n');

// 2. Python Backend Testlarini ishga tushirish
console.log('============================================================');
console.log('📌 2-BOSQICH: Python Backend va Telegram Bot Testlari (unittest)...\n');

import fs from 'node:fs';

const py312 = 'C:\\Users\\iqbol\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
const pythonExe = fs.existsSync(py312) ? py312 : 'python';

const pyTest = spawnSync(pythonExe, [path.join(__dirname, 'test_backend.py')], {
  stdio: 'inherit',
  shell: true
});

if (pyTest.status !== 0) {
  console.error('\n❌ Python backend testlarida xatolik aniqlandi!');
  process.exit(1);
}

console.log('\n✅ Python backend testlari 100% muvaffaqiyatli yakunlandi!\n');

console.log('============================================================');
console.log('🎉 XULOSA: Barcha 4 ta test to\'plami to\'liq va xatosiz o\'tdi!');
console.log('============================================================\n');
