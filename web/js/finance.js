/**
 * Pro Hisobchi - finance.js
 * Kassa, Qarz Daftari, CSV Eksport va Kassa Telegram Hisoboti
 */

import { formatSom } from './calculator.js';
import { telegramgaFaylYubor } from './telegram.js';

export const DEFAULT_MOLIYA = {
  kassaTranzaksiyalar: [],
  qarzDaftari: []
};

export function getMoliya(storageKey = 'prohisobchi_moliya') {
  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : DEFAULT_MOLIYA;
  } catch (e) {
    console.error('Moliya o\'qishda xatolik:', e);
    return DEFAULT_MOLIYA;
  }
}

export function saqlaMoliya(moliyaData, storageKey = 'prohisobchi_moliya') {
  localStorage.setItem(storageKey, JSON.stringify(moliyaData));
}

export function hisoblaKassaBalansi(storageKey = 'prohisobchi_moliya') {
  const moliya = getMoliya(storageKey);
  let jamiKirimSom = 0;
  let jamiChiqimSom = 0;
  let jamiKirimUsd = 0;
  let jamiChiqimUsd = 0;

  moliya.kassaTranzaksiyalar.forEach(t => {
    const som = parseFloat(t.summaSom) || 0;
    const usd = parseFloat(t.summaUsd) || 0;
    if (t.tur === 'kirim') {
      jamiKirimSom += som;
      jamiKirimUsd += usd;
    } else if (t.tur === 'chiqim') {
      jamiChiqimSom += som;
      jamiChiqimUsd += usd;
    }
  });

  const sofBalansSom = jamiKirimSom - jamiChiqimSom;
  const sofBalansUsd = jamiKirimUsd - jamiChiqimUsd;

  return {
    jamiKirimSom,
    jamiChiqimSom,
    sofBalansSom,
    jamiKirimUsd: parseFloat(jamiKirimUsd.toFixed(2)),
    jamiChiqimUsd: parseFloat(jamiChiqimUsd.toFixed(2)),
    sofBalansUsd: parseFloat(sofBalansUsd.toFixed(2))
  };
}

export function hisoblaQarzlarStatistikasi(storageKey = 'prohisobchi_moliya') {
  const moliya = getMoliya(storageKey);
  let jamiHaqqimSom = 0;
  let jamiHaqqimUsd = 0;
  let jamiQarzimSom = 0;
  let jamiQarzimUsd = 0;

  moliya.qarzDaftari.filter(q => q.status === 'ochiq').forEach(q => {
    const som = parseFloat(q.summaSom) || 0;
    const usd = parseFloat(q.summaUsd) || 0;
    if (q.tur === 'haqqim') {
      jamiHaqqimSom += som;
      jamiHaqqimUsd += usd;
    } else if (q.tur === 'qarzim') {
      jamiQarzimSom += som;
      jamiQarzimUsd += usd;
    }
  });

  return {
    jamiHaqqimSom,
    jamiHaqqimUsd: parseFloat(jamiHaqqimUsd.toFixed(2)),
    jamiQarzimSom,
    jamiQarzimUsd: parseFloat(jamiQarzimUsd.toFixed(2))
  };
}

export function tranzaksiyaQosh(tranzaksiya, storageKey = 'prohisobchi_moliya') {
  const moliya = getMoliya(storageKey);
  const rand = Math.random().toString(36).slice(2, 6);
  const yangiT = {
    id: `t_${Date.now()}_${rand}`,
    tur: tranzaksiya.tur || 'kirim',
    summaSom: parseFloat(tranzaksiya.summaSom) || 0,
    summaUsd: parseFloat(tranzaksiya.summaUsd) || 0,
    izoh: tranzaksiya.izoh || '',
    toifa: tranzaksiya.toifa || 'boshqa',
    sana: new Date().toLocaleString('ru-RU')
  };
  moliya.kassaTranzaksiyalar.unshift(yangiT);
  saqlaMoliya(moliya, storageKey);
  return moliya;
}

export function qarzQosh(qarz, storageKey = 'prohisobchi_moliya') {
  const moliya = getMoliya(storageKey);
  const rand = Math.random().toString(36).slice(2, 6);
  const yangiQ = {
    id: `q_${Date.now()}_${rand}`,
    tur: qarz.tur || 'haqqim',
    shaxs: qarz.shaxs || 'Mijoz',
    telefon: qarz.telefon || '',
    summaSom: parseFloat(qarz.summaSom) || 0,
    summaUsd: parseFloat(qarz.summaUsd) || 0,
    izoh: qarz.izoh || '',
    status: 'ochiq',
    sana: new Date().toLocaleDateString('ru-RU')
  };
  moliya.qarzDaftari.unshift(yangiQ);
  saqlaMoliya(moliya, storageKey);
  return yangiQ;
}

export function qarzYopish(qarzId, kassagaKiritish = true, storageKey = 'prohisobchi_moliya') {
  const moliya = getMoliya(storageKey);
  const qarz = moliya.qarzDaftari.find(q => q.id === qarzId);
  if (!qarz) return moliya;

  qarz.status = 'yopildi';
  qarz.yopilganSana = new Date().toLocaleString('ru-RU');

  if (kassagaKiritish) {
    if (qarz.tur === 'haqqim') {
      moliya.kassaTranzaksiyalar.unshift({
        id: `t_${Date.now()}`,
        tur: 'kirim',
        summaSom: qarz.summaSom,
        summaUsd: qarz.summaUsd,
        izoh: `Qarz uzildi (Haqqim): ${qarz.shaxs}`,
        toifa: 'qarz_uzilishi',
        sana: new Date().toLocaleString('ru-RU')
      });
    } else if (qarz.tur === 'qarzim') {
      moliya.kassaTranzaksiyalar.unshift({
        id: `t_${Date.now()}`,
        tur: 'chiqim',
        summaSom: qarz.summaSom,
        summaUsd: qarz.summaUsd,
        izoh: `Qarz to'landi (Qarzim): ${qarz.shaxs}`,
        toifa: 'qarz_tolanishi',
        sana: new Date().toLocaleString('ru-RU')
      });
    }
  }

  saqlaMoliya(moliya, storageKey);
  return moliya;
}

/**
 * Kassa Hisobotini Telegram uchun chiroyli formatlash
 */
export function generatsiyaKassaTelegramHisoboti(storageKey = 'prohisobchi_moliya') {
  const bal = hisoblaKassaBalansi(storageKey);
  const moliya = getMoliya(storageKey);
  const bugun = new Date().toLocaleString('ru-RU');

  const lines = [
    '📊 <b>«PRO HISOBCHI» KASSA HISOBOTI</b>',
    `📅 Sana: <b>${bugun}</b>`,
    '━━━━━━━━━━━━━━━━━━━━',
    `🟢 <b>Jami Kirim:</b> <code>+${formatSom(bal.jamiKirimSom)} so'm</code> (${bal.jamiKirimUsd} $)`,
    `🔴 <b>Jami Chiqim:</b> <code>-${formatSom(bal.jamiChiqimSom)} so'm</code> (${bal.jamiChiqimUsd} $)`,
    '────────────────────',
    `💰 <b>SOF BALANS:</b> <b>${formatSom(bal.sofBalansSom)} so'm</b> (${bal.sofBalansUsd} $)`,
    '━━━━━━━━━━━━━━━━━━━━',
    '<b>OXIRGI AMALLAR:</b>'
  ];

  const oxirgilari = moliya.kassaTranzaksiyalar.slice(0, 8);
  if (oxirgilari.length === 0) {
    lines.push('<i>Hozircha amallar yo\'q</i>');
  } else {
    oxirgilari.forEach((t, i) => {
      const sign = t.tur === 'kirim' ? '🟢 +' : '🔴 -';
      lines.push(`${i + 1}. ${sign}<b>${formatSom(t.summaSom)} so'm</b> — <i>${t.izoh}</i> (${t.sana})`);
    });
  }

  return lines.join('\n');
}

/**
 * CSV Eksport funksiyasi (Excel uchun mos UTF-8 BOM bilan)
 */
export async function eksportCSV(faylNomi, sarlavhalar, qatorlar, caption = '') {
  // UTF-8 BOM qo'shamiz (Excel rus/o'zbek harflarini to'g'ri ko'rsatishi uchun)
  let csvContent = '\uFEFF';
  csvContent += sarlavhalar.map(s => `"${s}"`).join(',') + '\r\n';

  qatorlar.forEach(row => {
    csvContent += row.map(val => `"${(val ?? '').toString().replace(/"/g, '""')}"`).join(',') + '\r\n';
  });

  let sentToTelegram = false;

  if (typeof Blob !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // 1. Standart brauzer yuklab olish (PC yoki tashqi brauzerda ishlashi uchun)
    if (typeof document !== 'undefined') {
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = faylNomi;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) {
        console.warn('Brauzer orqali yuklab olish ishlamadi:', e);
      }
    }

    // 2. Telegram WebApp ichida bo'lsa, Telegram bot orqali chatga to'g'ridan-to'g'ri yuboramiz
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        await telegramgaFaylYubor(faylNomi, blob, null, caption || `📊 ${faylNomi}`);
        sentToTelegram = true;
      } catch (err) {
        console.warn('Telegramga fayl yuborishda xatolik:', err);
      }
    }
  }

  return { sentToTelegram };
}

/**
 * Kassa tranzaksiyalarini Excel (CSV) qilib yuklab olish
 */
export async function eksportKassaCSV(storageKey = 'prohisobchi_moliya') {
  const moliya = getMoliya(storageKey);
  const sarlavhalar = ['ID', 'Sana', 'Turi', 'Summa (so\'m)', 'Summa ($)', 'Izoh', 'Toifa'];
  const qatorlar = moliya.kassaTranzaksiyalar.map(t => [
    t.id,
    t.sana,
    t.tur.toUpperCase(),
    t.summaSom,
    t.summaUsd,
    t.izoh,
    t.toifa
  ]);

  const sana = new Date().toISOString().split('T')[0];
  return await eksportCSV(`kassa_hisoboti_${sana}.csv`, sarlavhalar, qatorlar, '💵 Kassa hisoboti (Excel/CSV)');
}

/**
 * Qarz daftarini Excel (CSV) qilib yuklab olish
 */
export async function eksportQarzCSV(storageKey = 'prohisobchi_moliya') {
  const moliya = getMoliya(storageKey);
  const sarlavhalar = ['ID', 'Sana', 'Toifa', 'Shaxs / Ta\'minotchi', 'Telefon', 'Summa (so\'m)', 'Summa ($)', 'Izoh', 'Status'];
  const qatorlar = moliya.qarzDaftari.map(q => [
    q.id,
    q.sana,
    q.tur === 'haqqim' ? 'HAQQIM (Mijoz qarzi)' : 'QARZIM (Mening qarzim)',
    q.shaxs,
    q.telefon,
    q.summaSom,
    q.summaUsd,
    q.izoh,
    q.status.toUpperCase()
  ]);

  const sana = new Date().toISOString().split('T')[0];
  return await eksportCSV(`qarz_daftari_${sana}.csv`, sarlavhalar, qatorlar, '📒 Qarz daftari hisoboti (Excel/CSV)');
}

