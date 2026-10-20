/**
 * Pro Hisobchi - telegram.js
 * Telegram Bot API, guruhga yuborish, WebApp integratsiyasi va nusxa olish
 */

import { formatSom } from './calculator.js';

// Standart parametrlar
export const DEFAULT_TELEGRAM_CONFIG = {
  botToken: '8679001022:AAEIMoxtqikm1uvCiQu6RUBfT7tvEp9EWSs',
  chatId: '-1004321522025'
};

export function getTelegramConfig() {
  try {
    const data = localStorage.getItem('prohisobchi_telegram_cfg');
    return data ? JSON.parse(data) : DEFAULT_TELEGRAM_CONFIG;
  } catch (e) {
    return DEFAULT_TELEGRAM_CONFIG;
  }
}

export function saqlaTelegramConfig(cfg) {
  localStorage.setItem('prohisobchi_telegram_cfg', JSON.stringify(cfg));
}

/**
 * 1-XABAR: Ishchilar uchun ishlab chiqarish va kesish xaritasi matni
 */
export function generatsiyaIshchiXabari(buyurtma, kesishNatijasi, bom) {
  const chiziq = '━━━━━━━━━━━━━━━━━━━━';
  const lines = [
    '🏭 <b>ISHLAB CHIQARISH VARAQASI (SEX UCHUN)</b>',
    `🆔 Buyurtma: <code>#${buyurtma.id}</code>`,
    `📅 Sana: <b>${buyurtma.sana}</b>`,
    `👤 Mijoz: <b>${buyurtma.mijozIsm || 'Noma\'lum'}</b>`,
    `🎨 Rang: <b>${buyurtma.rang}</b>`,
    `⏰ Muddat: <b>${buyurtma.muddat || 'Ko\'rsatilmadi'}</b>`,
    chiziq,
    '📐 <b>O\'LCHAMLAR VA DETALLAR:</b>'
  ];

  if (buyurtma.detallar && buyurtma.detallar.length > 0) {
    buyurtma.detallar.forEach((d, i) => {
      lines.push(
        `<b>${i + 1}) ${d.boy} × ${d.eni} sm</b> [${d.soni} dona] — <i>${d.turNom}</i>\n` +
        `   • Ramka: <code>${d.ramkaBoy}</code> sm (2 dona), <code>${d.ramkaEn}</code> sm (2 dona)`
      );
      if (d.hasRuchka) {
        lines.push(`   • Ruchka: <code>${d.ruchka}</code> sm (${d.soni} dona)`);
        lines.push(`   • Shnur (Ip): <code>${d.ip}</code> sm`);
        lines.push(`   • To'r: <code>${d.setkaBoy}</code> sm uzunlik / <code>${d.setkaEnDona}</code> bo'lak`);
      }
    });
  }

  // Kesish rejasi xulosasi
  if (kesishNatijasi && kesishNatijasi.tayoqlar && kesishNatijasi.tayoqlar.length > 0) {
    lines.push(chiziq);
    lines.push(`✂️ <b>KESISH REJASI (Arra: 3mm):</b>`);
    kesishNatijasi.tayoqlar.forEach((t, i) => {
      const kesimStr = t.kesimlar.map(k => `${k}sm`).join(' + ');
      const qoldiqStr = t.aniqQoldiq > 0.1 ? ` (qoldiq: ${t.aniqQoldiq} sm)` : '';
      lines.push(`<b>${i + 1}) ${t.nom}:</b> <code>${kesimStr}</code>${qoldiqStr}`);
    });
    lines.push(`⚡ <b>Samaradorlik:</b> ${kesishNatijasi.samaradorlikFoiz}% | Isrof: ${kesishNatijasi.jamiIsrof} sm`);
  }

  // BOM Xomashyo ehtiyoji
  if (bom) {
    lines.push(chiziq);
    lines.push('📦 <b>KERAKLI XOMASHYO:</b>');
    lines.push(`• Profil: <b>${bom.ramkaMetr} m</b> (~${bom.ramkaTayoq6m} ta 6m tayoq)`);
    lines.push(`• To'r matosi (Setka): <b>${bom.setkaM2} m²</b>`);
    lines.push(`• Shnur: <b>${bom.shnurMetr} m</b>`);
    lines.push(`• Ugolnik: <b>${bom.ugolnikSoni} dona</b> | Ruchka: <b>${bom.tutqichSoni} dona</b>`);
  }

  if (buyurtma.izoh) {
    lines.push(chiziq);
    lines.push(`📝 <b>Izoh:</b> <i>${buyurtma.izoh}</i>`);
  }

  return lines.join('\n');
}

/**
 * 2-XABAR: Kassa va Mijoz uchun hisob cheki matni
 */
export function generatsiyaMijozCheki(buyurtma) {
  const chiziq = '━━━━━━━━━━━━━━━━━━━━';
  const lines = [
    '🧾 <b>«PRO HISOBCHI» TO\'LOV CHEKI</b>',
    `🆔 Buyurtma: <code>#${buyurtma.id}</code>`,
    `📅 Sana: <b>${buyurtma.sana}</b>`,
    `👤 Mijoz: <b>${buyurtma.mijozIsm || 'Hurmatli mijoz'}</b>`,
    `📞 Telefon: <b>${buyurtma.mijozTel || '-'}</b>`,
    `🎨 Rang: <b>${buyurtma.rang}</b>`,
    `🏷️ Toifa: <b>${buyurtma.narxTuri === 'diler' ? 'Diler (Ulgurji)' : 'Chakana'}</b>`,
    chiziq,
    '📊 <b>BUYURTMA TARKIBI:</b>'
  ];

  if (buyurtma.qatorNatijalari) {
    buyurtma.qatorNatijalari.forEach((q, i) => {
      lines.push(
        `${i + 1}. <b>${q.eni} × ${q.boy} sm</b> — ${q.soni} dona\n` +
        `   Maydon: <code>${q.qatorM2.toFixed(3)} m²</code> | Narx: <b>${q.qatorUsd.toFixed(2)}$</b>`
      );
    });
  }

  lines.push(chiziq);
  lines.push(`🔢 <b>Jami mahsulot:</b> ${buyurtma.jamiSoni || 0} dona`);
  lines.push(`📐 <b>Jami kvadratura:</b> ${buyurtma.jamiM2 || 0} m²`);
  lines.push(`💰 <b>JAMI SUMMA:</b> <code>${buyurtma.jamiUsd} $</code>`);
  lines.push(`💵 <b>SO'MDA:</b> <b>${formatSom(buyurtma.jamiSom)} so'm</b>`);
  lines.push(`💱 <b>Kurs:</b> 1$ = ${formatSom(buyurtma.kurs || 12900)} so'm`);
  lines.push(`💳 <b>To'lov holati:</b> <b>${buyurtma.tolovHolati || 'Kutilmoqda'}</b>`);
  lines.push(chiziq);
  lines.push('<i>Xaridingiz uchun rahmat! Sifat va qulaylik siz uchun.</i>');

  return lines.join('\n');
}

/**
 * Matnni Telegram monospaced / toza formatda klipbordga nusxalash
 * "Vichir-vichir" bo'lib qolishining oldini olish uchun HTML teglarni toza belgilarga aylantiradi
 */
export async function klipbordgaNusxala(matn) {
  // HTML teglarni toza matnga va qatorlarga o'tkazamiz
  let cleanText = matn
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<i>(.*?)<\/i>/gi, '$1')
    .replace(/<code>(.*?)<\/code>/gi, '$1')
    .replace(/<[^>]*>?/gm, '')
    .trim();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(cleanText);
      return true;
    } catch (e) {
      console.warn('Clipboard API fallback:', e);
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = cleanText;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const muvaffaqiyat = document.execCommand('copy');
  document.body.removeChild(textArea);
  return muvaffaqiyat;
}

/**
 * Telegram API orqali guruhga xabar yuborish
 */
export async function telegramgaXabarYubor(matn, customChatId = null) {
  const cfg = getTelegramConfig();
  const token = cfg.botToken || DEFAULT_TELEGRAM_CONFIG.botToken;
  const chatId = customChatId || cfg.chatId || DEFAULT_TELEGRAM_CONFIG.chatId;

  if (!token || !chatId) {
    throw new Error('Telegram bot token yoki Chat ID sozlanmagan!');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: matn,
      parse_mode: 'HTML'
    })
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API xatoligi yuz berdi');
  }

  // Haptic feedback (Telegram WebApp ichida bo'lsa)
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

  return data;
}

/**
 * Buyurtmani tasdiqlashda 2 ta xabarni ketma-ket yuborish
 */
export async function buyurtmaniGuruhgaYubor(buyurtma, kesishNatijasi, bom, customChatId = null) {
  const xabarIshchi = generatsiyaIshchiXabari(buyurtma, kesishNatijasi, bom);
  const xabarMijoz = generatsiyaMijozCheki(buyurtma);

  // Agar Telegram Mini App oynasi ichida ishlayotgan bo'lsa va botga ma'lumot uzatish kerak bo'lsa:
  if (window.Telegram?.WebApp?.sendData) {
    try {
      window.Telegram.WebApp.sendData(JSON.stringify({
        chat_id: customChatId || getTelegramConfig().chatId,
        cutting_map_text: xabarIshchi,
        invoice_text: xabarMijoz
      }));
    } catch (e) {
      console.warn('WebApp.sendData ishlamadi:', e);
    }
  }

  // To'g'ridan-to'g'ri Bot API orqali 2 ta xabar yuborish
  await telegramgaXabarYubor(xabarIshchi, customChatId);
  await new Promise(r => setTimeout(r, 600));
  await telegramgaXabarYubor(xabarMijoz, customChatId);

  return true;
}

/**
 * Kassa Hisobotini Telegram guruhga to'g'ridan-to'g'ri jo'natish
 */
export async function kassaHisobotiniGuruhgaYubor(kassaMatni, customChatId = null) {
  return await telegramgaXabarYubor(kassaMatni, customChatId);
}

/**
 * Telegram Bot API orqali fayl (CSV / Document) yuborish
 */
export async function telegramgaFaylYubor(faylNomi, blob, customChatId = null, caption = '') {
  const cfg = getTelegramConfig();
  const token = cfg.botToken || DEFAULT_TELEGRAM_CONFIG.botToken;
  const tgUser = (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) || null;
  const chatId = customChatId || tgUser?.id || cfg.chatId || DEFAULT_TELEGRAM_CONFIG.chatId;

  if (!token || !chatId) {
    throw new Error('Telegram bot yoki Chat ID sozlanmagan!');
  }

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', blob, faylNomi);
  if (caption) formData.append('caption', caption);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!data.ok && chatId !== cfg.chatId && cfg.chatId) {
      // Agar shaxsiy chat ochilmagan bo'lsa, sex guruhiga yuborish
      const fbData = new FormData();
      fbData.append('chat_id', cfg.chatId);
      fbData.append('document', blob, faylNomi);
      if (caption) fbData.append('caption', caption);
      const resFallback = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: 'POST',
        body: fbData
      });
      return await resFallback.json();
    }
    return data;
  } catch (err) {
    console.warn('telegramgaFaylYubor xatoligi:', err);
    throw err;
  }
}
