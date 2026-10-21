/**
 * Pro Hisobchi - telegram.js
 * Telegram Bot API, guruhga yuborish, WebApp integratsiyasi va nusxa olish
 */

import { formatSom, hisoblaSebestoimost, hisoblaBuyurtmaNarxi, hisoblaM2, DEFAULT_PROFILLAR } from './calculator.js';
import { hisoblaGuruhlanganRaskroy } from './cutting.js';

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
export function generatsiyaIshchiXabari(buyurtma, kesishNatijasi = null, bom = null, kurs = 12900) {
  if (typeof kesishNatijasi === 'number') {
    kurs = kesishNatijasi;
    kesishNatijasi = null;
  }
  const chiziq = '━━━━━━━━━━━━━━━━━━━━';
  const lines = [
    '🏭 <b>ISHLAB CHIQARISH VARAQASI (SEX UCHUN)</b>',
    `🆔 Buyurtma: <code>#${buyurtma.id}</code>`,
    `📅 Sana: <b>${buyurtma.sana}</b>`,
    `👤 Mijoz: <b>${buyurtma.mijozIsm || 'Noma\'lum'}</b>`,
    `🎨 Rang: <b>${buyurtma.rang || 'OQ'}</b>`,
    `⏰ Muddat: <b>${buyurtma.muddat || 'Ko\'rsatilmadi'}</b>`,
    chiziq,
    '📐 <b>O\'LCHAMLAR VA DETALLAR:</b>'
  ];

  if (buyurtma.detallar && buyurtma.detallar.length > 0) {
    buyurtma.detallar.forEach((d, i) => {
      const s = parseInt(d.soni) || 1;
      const ramkaBoyDona = 2 * s;
      const ramkaEnDona = 2 * s;
      let detalText = `<b>${i + 1}) ${d.boy} × ${d.eni} sm</b> [${s} dona] — <i>${d.turNom || d.tur}</i>\n` +
        `   • Ramka: <code>${d.ramkaBoy}</code> sm (${ramkaBoyDona} dona), <code>${d.ramkaEn}</code> sm (${ramkaEnDona} dona)`;
      
      if (d.hasAProfil && d.aProfilEn > 0) {
        detalText += `\n   • A profil: <code>${d.aProfilEn}</code> sm (${s} dona)`;
      }
      if (d.hasRuchka && d.ruchka > 0) {
        detalText += `\n   • Ruchka: <code>${d.ruchka}</code> sm (${s} dona)`;
      }
      if (d.ip > 0) {
        detalText += `\n   • Shnur (Ip): <code>${d.ip}</code> sm`;
      }
      if (d.setkaBoy > 0 || d.setkaUz > 0) {
        const setkaUz = d.setkaBoy || d.setkaUz;
        const setkaDona = d.setkaEnDona || d.setkaDona;
        detalText += `\n   • To'r: <code>${setkaUz}</code> sm (${setkaDona} dona)`;
      }
      lines.push(detalText);
    });
  }

  // Agar kesishNatijasi berilmagan bo'lsa, lekin detallar mavjud bo'lsa, avtomatik hisoblaymiz:
  let raskroyData = kesishNatijasi;
  if ((!raskroyData || (!raskroyData.guruhNatijalar && !raskroyData.tayoqlar)) && buyurtma.detallar && buyurtma.detallar.length > 0) {
    try {
      raskroyData = hisoblaGuruhlanganRaskroy(buyurtma.detallar, 600, {}, 0.3);
    } catch (e) {
      console.warn('Raskroy hisoblashda xatolik:', e);
    }
  }

  // 🔪 KESISH REJASI (RASKROY) BLOKI
  const guruhlar = raskroyData?.guruhNatijalar || [];
  if (guruhlar.length > 0) {
    const samaradorlik = raskroyData.umumiySamaradorlik ?? 99;
    const isrof = raskroyData.jamiIsrofBarcha ?? 0;

    lines.push('─────────────────────');
    lines.push(`⚡ <b>Samaradorlik:</b> ${samaradorlik}% (${isrof}sm isrof)`);
    lines.push(`🔪 <b>KESISH REJASI (Profil: 600sm):</b>\n`);

    guruhlar.forEach((g, gIdx) => {
      const gJamiTayoq = g.natija?.jamiTayoqSoni || (g.natija?.tayoqlar?.length || 0);
      const gSamarali = g.natija?.samaradorlikFoiz ?? 99;
      lines.push(`▸ <b>${g.nom}</b> (${gJamiTayoq} ta, ${gSamarali}% samarali):`);

      (g.natija?.tayoqlar || []).forEach((t, tIdx) => {
        const tNom = t.nom || `Yangi 600sm`;
        const kesimStr = t.kesimlar.join(' / ');
        const qoldiqStr = t.aniqQoldiq > 0 ? `${t.aniqQoldiq}sm` : '0sm';
        lines.push(`  ${tIdx + 1}) ${tNom}:`);
        lines.push(`     <code>${kesimStr}</code>`);
        lines.push(`     qoldiq: ${qoldiqStr}`);
      });
      if (gIdx < guruhlar.length - 1) {
        lines.push('');
      }
    });

    // 📦 JAMI PROFIL SARFI
    lines.push('─────────────────────');
    lines.push(`📦 <b>JAMI PROFIL SARFI:</b>`);
    guruhlar.forEach(g => {
      const gJamiTayoq = g.natija?.jamiTayoqSoni || (g.natija?.tayoqlar?.length || 0);
      lines.push(`  ${g.nom}: <b>${gJamiTayoq} ta</b>`);
    });
  } else if (raskroyData && raskroyData.tayoqlar && raskroyData.tayoqlar.length > 0) {
    // Oddiy 1D tayoqlar ro'yxati (fallback)
    lines.push('─────────────────────');
    lines.push(`⚡ <b>Samaradorlik:</b> ${raskroyData.samaradorlikFoiz}% (${raskroyData.jamiIsrof}sm isrof)`);
    lines.push(`🔪 <b>KESISH REJASI (Profil: 600sm):</b>\n`);
    raskroyData.tayoqlar.forEach((t, i) => {
      const kesimStr = t.kesimlar.join(' / ');
      const qoldiqStr = t.aniqQoldiq > 0 ? `${t.aniqQoldiq}sm` : '0sm';
      lines.push(`  ${i + 1}) ${t.nom || 'Yangi 600sm'}:`);
      lines.push(`     <code>${kesimStr}</code>`);
      lines.push(`     qoldiq: ${qoldiqStr}`);
    });
    lines.push('─────────────────────');
    lines.push(`📦 <b>JAMI PROFIL SARFI:</b>`);
    lines.push(`  Profil (600sm): <b>${raskroyData.tayoqlar.length} ta</b>`);
  }

  if (buyurtma.izoh) {
    lines.push('─────────────────────');
    lines.push(`📝 <b>Izoh:</b> <i>${buyurtma.izoh}</i>`);
  }

  return lines.join('\n');
}


/**
 * 2-XABAR: Kassa va Mijoz uchun hisob cheki matni
 */
export function generatsiyaMijozCheki(buyurtma) {
  const chiziq = '━━━━━━━━━━━━━━━━━━━━';
  const isDiler = buyurtma.narxTuri === 'diler' || buyurtma.narxTuri === 'diller';
  const toifaMatni = isDiler ? 'Diller (Ulgurji)' : 'Standart (Chakana)';

  const lines = [
    '🧾 <b>«PRO HISOBCHI» TO\'LOV CHEKI</b>',
    `🆔 Buyurtma: <code>#${buyurtma.id}</code>`,
    `📅 Sana: <b>${buyurtma.sana}</b>`,
    `👤 Mijoz: <b>${buyurtma.mijozIsm || 'Mijoz'}</b>`,
    `📞 Telefon: <b>${buyurtma.mijozTel || '-'}</b>`,
    `🎨 Rang: <b>${buyurtma.rang || 'OQ'}</b>`,
    `🏷️ Toifa: <b>${toifaMatni}</b>`,
    chiziq,
    '📊 <b>BUYURTMA TARKIBI:</b>'
  ];

  let items = buyurtma.qatorNatijalari;
  let calcFallback = null;
  if (!items || items.length === 0) {
    const rawRows = buyurtma.qatorlar || buyurtma.detallar || [];
    if (rawRows.length > 0) {
      try {
        calcFallback = hisoblaBuyurtmaNarxi(
          rawRows,
          buyurtma.profillar || DEFAULT_PROFILLAR,
          buyurtma.kurs || 12900,
          buyurtma.narxTuri || 'chakana',
          true
        );
        items = calcFallback.qatorNatijalari;
      } catch (e) {
        console.warn('Chek qatorlarini hisoblashda xatolik:', e);
      }
    }
  }

  const TUR_NOMLARI = {
    yonga: 'Rom yonga',
    pastga: 'Rom pastga',
    eshik: 'Eshik',
    tayyor: 'Tayyor eshik',
    evro: 'Evro parog',
    tayyor_evro: 'Tayyor evro',
    haytek: 'Haytek'
  };

  if (items && items.length > 0) {
    items.forEach((q, i) => {
      const eni = parseFloat(q.eni) || 0;
      const boy = parseFloat(q.boy) || 0;
      const soni = parseInt(q.soni) || 1;
      const nom = q.profilNom || q.turNom || TUR_NOMLARI[q.tur] || q.nom || 'Rom';
      const qatorM2 = q.qatorM2 != null ? q.qatorM2 : (hisoblaM2(eni, boy) * soni);
      const qatorUsd = q.qatorUsd != null ? q.qatorUsd : 0;

      const m2Str = parseFloat(qatorM2.toFixed(3));
      const usdStr = parseFloat(qatorUsd.toFixed(2));

      lines.push(`${i + 1}) <b>${nom}:</b> ${eni} × ${boy} sm — ${soni} dona (<code>${m2Str} m²</code> | <b>${usdStr} $</b>)`);
    });
  }

  const jamiSoni = buyurtma.jamiSoni || calcFallback?.jamiSoni || (items ? items.reduce((acc, it) => acc + (parseInt(it.soni) || 1), 0) : 0);
  const jamiM2 = buyurtma.jamiM2 != null ? buyurtma.jamiM2 : (calcFallback?.jamiM2 || (items ? parseFloat(items.reduce((acc, it) => acc + (it.qatorM2 || 0), 0).toFixed(3)) : 0));
  const jamiUsd = buyurtma.jamiUsd != null ? buyurtma.jamiUsd : (calcFallback?.jamiUsd || (items ? parseFloat(items.reduce((acc, it) => acc + (it.qatorUsd || 0), 0).toFixed(2)) : 0));
  const jamiSom = buyurtma.jamiSom != null ? buyurtma.jamiSom : (calcFallback?.jamiSom || Math.round(jamiUsd * (buyurtma.kurs || 12900)));

  lines.push(chiziq);
  lines.push(`🔢 <b>Jami mahsulot:</b> ${jamiSoni} dona`);
  lines.push(`📐 <b>Jami kvadratura:</b> ${jamiM2} m²`);
  lines.push(`💰 <b>JAMI SUMMA:</b> <code>${jamiUsd} $</code>`);
  lines.push(`💵 <b>SO'MDA:</b> <b>${formatSom(jamiSom)} so'm</b>`);
  lines.push(`💱 <b>Kurs:</b> 1$ = ${formatSom(buyurtma.kurs || 12900)} so'm`);
  lines.push(`💳 <b>To'lov holati:</b> <b>${buyurtma.tolovHolati || 'Naqd'}</b>`);
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
