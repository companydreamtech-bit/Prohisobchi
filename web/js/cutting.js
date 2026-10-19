/**
 * Pro Hisobchi - cutting.js
 * 1D Raskroy (Aqlli chiqindisiz kesish) Algoritmi & Alohida Profil Guruhlari
 */

export const STANDART_PROFIL_UZUNLIGI = 600; // sm
export const ARRA_QALINLIGI = 0.3; // sm (3 mm)
export const YAROQLI_QOLDIQ_CHEGARA = 100; // sm

/**
 * Bitta profil turi uchun 1D Cutting Stock Algoritmi (Best-Fit Decreasing)
 */
export function hisobla1DRaskroy(kesimlar, profilUzunligi = STANDART_PROFIL_UZUNLIGI, mavjudQoldiqlar = [], arraQalinligi = ARRA_QALINLIGI) {
  const qismlar = [];
  kesimlar.forEach(k => {
    const sm = parseFloat(k.sm) || 0;
    const dona = parseInt(k.dona) || 0;
    if (sm > 0 && dona > 0) {
      for (let i = 0; i < dona; i++) {
        qismlar.push(sm);
      }
    }
  });

  if (qismlar.length === 0) {
    return {
      tayoqlar: [],
      jamiTayoqSoni: 0,
      yangiTayoqSoni: 0,
      ishlatilganQoldiqSoni: 0,
      jamiUzunlik: 0,
      jamiKesimUzunligi: 0,
      jamiIsrof: 0,
      samaradorlikFoiz: 100,
      yaroqliQoldiqlar: []
    };
  }

  qismlar.sort((a, b) => b - a);

  const saralanganQoldiqlar = [...mavjudQoldiqlar]
    .map(q => parseFloat(q))
    .filter(q => q > 0)
    .sort((a, b) => b - a);

  const binlar = [];

  // 1. Ombordagi qoldiqlardan birinchi foydalanish
  saralanganQoldiqlar.forEach((qUzunlik, idx) => {
    binlar.push({
      id: `qoldiq-${idx + 1}`,
      boshlangichUzunlik: qUzunlik,
      qolganJoy: qUzunlik,
      kesimlar: [],
      isQoldiq: true,
      nom: `Qoldiq (${qUzunlik} sm)`
    });
  });

  // 2. Best-Fit Decreasing joylashtirish
  qismlar.forEach(qism => {
    let engYaxshiBinIndex = -1;
    let minimalQoldiq = Infinity;

    for (let i = 0; i < binlar.length; i++) {
      const bin = binlar[i];
      const zarurJoy = bin.kesimlar.length > 0 ? (qism + arraQalinligi) : qism;

      if (bin.qolganJoy >= zarurJoy) {
        const yangiQoldiq = bin.qolganJoy - zarurJoy;
        if (yangiQoldiq < minimalQoldiq) {
          minimalQoldiq = yangiQoldiq;
          engYaxshiBinIndex = i;
        }
      }
    }

    if (engYaxshiBinIndex !== -1) {
      const bin = binlar[engYaxshiBinIndex];
      const sarf = bin.kesimlar.length > 0 ? (qism + arraQalinligi) : qism;
      bin.kesimlar.push(qism);
      bin.qolganJoy = parseFloat((bin.qolganJoy - sarf).toFixed(2));
    } else {
      const yangiBin = {
        id: `tayoq-${binlar.length + 1}`,
        boshlangichUzunlik: profilUzunligi,
        qolganJoy: parseFloat((profilUzunligi - qism).toFixed(2)),
        kesimlar: [qism],
        isQoldiq: false,
        nom: `Yangi (${profilUzunligi} sm)`
      };

      if (qism <= profilUzunligi) {
        binlar.push(yangiBin);
      }
    }
  });

  const ishlatilganTayoqlar = binlar.filter(b => b.kesimlar.length > 0);

  let jamiUzunlik = 0;
  let jamiKesimUzunligi = 0;
  let jamiIsrof = 0;
  let yangiTayoqSoni = 0;
  let ishlatilganQoldiqSoni = 0;
  const yaroqliQoldiqlar = [];

  ishlatilganTayoqlar.forEach((t, i) => {
    t.index = i + 1;
    t.kesimlarJami = t.kesimlar.reduce((sum, v) => sum + v, 0);
    t.arraIsrofi = (t.kesimlar.length - 1) * arraQalinligi;
    t.aniqQoldiq = Math.max(0, parseFloat((t.boshlangichUzunlik - t.kesimlarJami - t.arraIsrofi).toFixed(2)));
    t.samaradorlik = Math.round(((t.kesimlarJami) / t.boshlangichUzunlik) * 100);

    jamiUzunlik += t.boshlangichUzunlik;
    jamiKesimUzunligi += t.kesimlarJami;
    jamiIsrof += t.aniqQoldiq;

    if (t.isQoldiq) {
      ishlatilganQoldiqSoni++;
    } else {
      yangiTayoqSoni++;
    }

    if (t.aniqQoldiq >= YAROQLI_QOLDIQ_CHEGARA) {
      yaroqliQoldiqlar.push({
        uzunlik: t.aniqQoldiq,
        manba: `Tayoq #${t.index}`,
        sana: new Date().toLocaleDateString('ru-RU')
      });
    }
  });

  const samaradorlikFoiz = jamiUzunlik > 0 
    ? Math.round((jamiKesimUzunligi / jamiUzunlik) * 100) 
    : 100;

  return {
    tayoqlar: ishlatilganTayoqlar,
    jamiTayoqSoni: ishlatilganTayoqlar.length,
    yangiTayoqSoni,
    ishlatilganQoldiqSoni,
    jamiUzunlik: parseFloat(jamiUzunlik.toFixed(1)),
    jamiKesimUzunligi: parseFloat(jamiKesimUzunligi.toFixed(1)),
    jamiIsrof: parseFloat(jamiIsrof.toFixed(1)),
    samaradorlikFoiz,
    yaroqliQoldiqlar
  };
}

/**
 * Detallar ro'yxatini PROFILLAR TURLARI BO'YICHA GURUHLAB KESISH
 * Sexda profillar aralashtirilmaydi, har biri o'z tayoqlaridan kesiladi:
 * 1) Kichkina profil (Rom ramkasi)
 * 2) Katta profil (Eshik ramkasi)
 * 3) Rom ruchka profili
 * 4) Katta ruchka profili
 * 5) Haytek profili
 * 6) A profil (Evro parog pastki profili)
 */
export function hisoblaGuruhlanganRaskroy(detallar, profilUzunligi = STANDART_PROFIL_UZUNLIGI, omborQoldiqlari = {}, arraQalinligi = ARRA_QALINLIGI) {
  const guruhKesimlar = {
    kichikRom: [],
    kattaEshik: [],
    romRuchka: [],
    kattaRuchka: [],
    haytek: [],
    aProfil: []
  };

  detallar.forEach(d => {
    const s = d.soni;

    if (d.tur === 'haytek') {
      guruhKesimlar.haytek.push({ sm: d.ramkaBoy, dona: 2 * s });
      guruhKesimlar.haytek.push({ sm: d.ramkaEn, dona: 2 * s });
    } else if (d.tur === 'yonga' || d.tur === 'pastga') {
      // Rom uchun kichik profil
      guruhKesimlar.kichikRom.push({ sm: d.ramkaBoy, dona: 2 * s });
      guruhKesimlar.kichikRom.push({ sm: d.ramkaEn, dona: 2 * s });
      if (d.hasRuchka && d.ruchka > 0) {
        guruhKesimlar.romRuchka.push({ sm: d.ruchka, dona: s });
      }
    } else if (d.tur === 'evro' || d.tur === 'tayyor_evro') {
      // Evro parog: 2 ta bo'y (katta profil), 1 ta en B profil (katta), 1 ta en A profil
      guruhKesimlar.kattaEshik.push({ sm: d.ramkaBoy, dona: 2 * s });
      guruhKesimlar.kattaEshik.push({ sm: d.ramkaEn, dona: 1 * s }); // B profil
      if (d.aProfilEn) {
        guruhKesimlar.aProfil.push({ sm: d.aProfilEn, dona: 1 * s }); // A profil
      }
      if (d.hasRuchka && d.ruchka > 0) {
        guruhKesimlar.kattaRuchka.push({ sm: d.ruchka, dona: s });
      }
    } else {
      // Oddiy eshik / tayyor eshik
      guruhKesimlar.kattaEshik.push({ sm: d.ramkaBoy, dona: 2 * s });
      guruhKesimlar.kattaEshik.push({ sm: d.ramkaEn, dona: 2 * s });
      if (d.hasRuchka && d.ruchka > 0) {
        guruhKesimlar.kattaRuchka.push({ sm: d.ruchka, dona: s });
      }
    }
  });

  const guruhNomlari = {
    kichikRom: 'Kichkina profil (Rom)',
    kattaEshik: 'Katta profil (Eshik / Evro)',
    romRuchka: 'Rom ruchka profili',
    kattaRuchka: 'Katta ruchka profili',
    haytek: 'Haytek profili',
    aProfil: 'A profil (Evro parog eni)'
  };

  const guruhNatijalar = [];
  let jamiTayoqlarBarcha = 0;
  let jamiUzunlikBarcha = 0;
  let jamiKesimBarcha = 0;
  let jamiIsrofBarcha = 0;
  const barchaYaroqliQoldiqlar = [];

  for (const [key, kesimList] of Object.entries(guruhKesimlar)) {
    if (kesimList.length > 0) {
      const qoldiqlar = omborQoldiqlari[key] || [];
      const natija = hisobla1DRaskroy(kesimList, profilUzunligi, qoldiqlar, arraQalinligi);

      if (natija.tayoqlar.length > 0) {
        guruhNatijalar.push({
          key,
          nom: guruhNomlari[key],
          natija
        });

        jamiTayoqlarBarcha += natija.jamiTayoqSoni;
        jamiUzunlikBarcha += natija.jamiUzunlik;
        jamiKesimBarcha += natija.jamiKesimUzunligi;
        jamiIsrofBarcha += natija.jamiIsrof;
        barchaYaroqliQoldiqlar.push(...natija.yaroqliQoldiqlar);
      }
    }
  }

  const umumiySamaradorlik = jamiUzunlikBarcha > 0 
    ? Math.round((jamiKesimBarcha / jamiUzunlikBarcha) * 100) 
    : 100;

  return {
    guruhNatijalar,
    jamiTayoqlarBarcha,
    jamiUzunlikBarcha: parseFloat(jamiUzunlikBarcha.toFixed(1)),
    jamiKesimBarcha: parseFloat(jamiKesimBarcha.toFixed(1)),
    jamiIsrofBarcha: parseFloat(jamiIsrofBarcha.toFixed(1)),
    umumiySamaradorlik,
    barchaYaroqliQoldiqlar
  };
}
