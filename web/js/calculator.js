/**
 * Pro Hisobchi - calculator.js
 * Mahsulot turlari, Multi-Brend Konstruktori, aniq formulalar va narxlash
 */

// 1. Standart Profil Brendlari va Dopusklari
export const DEFAULT_PROFIL_BRENDLARI = [
  { id: 'standart', nom: 'Standart (Universal)', romEnDopusk: 2.0, eshikEnDopusk: 4.0, ruchkaDopusk: -0.8, arra: 0.3 },
  { id: 'akfa', nom: 'Akfa (Trio / Quattro)', romEnDopusk: 2.0, eshikEnDopusk: 4.0, ruchkaDopusk: -0.8, arra: 0.3 },
  { id: 'ekapen', nom: 'EKAPEN Plastik', romEnDopusk: 2.2, eshikEnDopusk: 4.2, ruchkaDopusk: -1.0, arra: 0.3 },
  { id: 'engelberg', nom: 'Engelberg 70/80', romEnDopusk: 1.8, eshikEnDopusk: 3.8, ruchkaDopusk: -0.6, arra: 0.3 },
  { id: 'alutex', nom: 'Alutex Aluminiy', romEnDopusk: 1.6, eshikEnDopusk: 3.6, ruchkaDopusk: -0.8, arra: 0.25 }
];

export const DEFAULT_PROFILLAR = [
  { id: 5, nom: 'Rom yonga', chakanaNarx: 33, dilerNarx: 25, narx: 33, dillerNarx: 25, minNarx: true, tur: 'kichik', kesishTur: 'yonga' },
  { id: 2, nom: 'Rom pastga', chakanaNarx: 32, dilerNarx: 23, narx: 32, dillerNarx: 23, minNarx: true, tur: 'kichik', kesishTur: 'pastga' },
  { id: 1, nom: 'Eshik', chakanaNarx: 40, dilerNarx: 28, narx: 40, dillerNarx: 28, minNarx: false, tur: 'katta', kesishTur: 'eshik' },
  { id: 3, nom: 'Haytek', chakanaNarx: 700, dilerNarx: 390, narx: 700, dillerNarx: 390, minNarx: false, tur: 'haytek', kesishTur: 'haytek', isPerimeter: true }
];

export const INITIAL_ACTIVE_BRENDLARI = [
  { id: 'standart', nom: 'Standart (Universal)', romEnDopusk: 2.0, eshikEnDopusk: 4.0, ruchkaDopusk: -0.8, arra: 0.3 }
];

export function getProfilBrendlari() {
  try {
    const data = (typeof localStorage !== 'undefined') && localStorage.getItem('prohisobchi_brendlar');
    return data ? JSON.parse(data) : INITIAL_ACTIVE_BRENDLARI;
  } catch (e) {
    return INITIAL_ACTIVE_BRENDLARI;
  }
}

export function saqlaProfilBrendlari(brendlar) {
  localStorage.setItem('prohisobchi_brendlar', JSON.stringify(brendlar));
}

// 2. Konstruksiya turlari va formulalari (Brend dopuski bilan hisoblash)
export const KONSTRUKSIYA_TURLARI = {
  yonga: {
    id: 'yonga',
    nom: 'Rom yonga',
    belgi: '➡️',
    tavsif: 'Oyna uchun yonga suriladigan to\'r',
    hasRuchka: true,
    hisobla: (w, h, brendDopusk = {}) => {
      const enDopusk = brendDopusk.romEnDopusk ?? 2;
      const ruchkaDop = brendDopusk.ruchkaDopusk ?? -0.8;

      const ramkaBoy = h;
      const ramkaEn = w + enDopusk;
      const ruchka = h + ruchkaDop;
      const setkaBoy = h + enDopusk;
      const setkaEnDona = ramkaEn / 2;
      const ip = h + w + 20;
      return {
        ramkaBoy,
        ramkaEn,
        ruchka,
        setkaBoy,
        setkaEnDona,
        ip,
        profilTuri: 'kichik',
        ruchkaTuri: 'romRuchka'
      };
    }
  },
  pastga: {
    id: 'pastga',
    nom: 'Rom pastga',
    belgi: '⬇️',
    tavsif: 'Oyna uchun pastga suriladigan to\'r',
    hasRuchka: true,
    hisobla: (w, h, brendDopusk = {}) => {
      const enDopusk = brendDopusk.romEnDopusk ?? 2;
      const ruchkaDop = brendDopusk.ruchkaDopusk ?? -0.8;

      const ramkaBoy = h + enDopusk;
      const ramkaEn = w;
      const ruchka = w + ruchkaDop;
      const setkaBoy = w + enDopusk;      // Setka uzunligi (sm): Eni + 2 (masalan: 49 + 2 = 51 sm)
      const setkaEnDona = ramkaBoy / 2;  // Setka donasi (ta): (Bo'yi + 2) / 2 (masalan: (147 + 2) / 2 = 74.5 dona)
      const ip = h + w + 20;
      return {
        ramkaBoy,
        ramkaEn,
        ruchka,
        setkaBoy,
        setkaEnDona,
        ip,
        profilTuri: 'kichik',
        ruchkaTuri: 'romRuchka'
      };
    }
  },
  eshik: {
    id: 'eshik',
    nom: 'Eshik',
    belgi: '🚪',
    tavsif: 'Oddiy eshik to\'ri',
    hasRuchka: true,
    hisobla: (w, h, brendDopusk = {}) => {
      const eshikDop = brendDopusk.eshikEnDopusk ?? 4;
      const ruchkaDop = brendDopusk.ruchkaDopusk ?? -0.6;

      const ramkaBoy = h;
      const ramkaEn = w + eshikDop;
      const ruchka = h + ruchkaDop;
      const setkaBoy = h + eshikDop;
      const setkaEnDona = w / 2.5;
      const ip = h + w + 20;
      return {
        ramkaBoy,
        ramkaEn,
        ruchka,
        setkaBoy,
        setkaEnDona,
        ip,
        profilTuri: 'katta',
        ruchkaTuri: 'kattaRuchka'
      };
    }
  },
  tayyor: {
    id: 'tayyor',
    nom: 'Tayyor eshik',
    belgi: '✅',
    tavsif: 'Tayyor romga o\'rnatiladigan eshik to\'ri',
    hasRuchka: true,
    hisobla: (w, h, brendDopusk = {}) => {
      const eshikDop = brendDopusk.eshikEnDopusk ?? 4;
      const ramkaBoy = h - 8;
      const ramkaEn = w - eshikDop;
      const ruchka = h - 8.6;
      const setkaBoy = h - eshikDop;
      const setkaEnDona = w / 2.5;
      const ip = h + w + 20;
      return {
        ramkaBoy,
        ramkaEn,
        ruchka,
        setkaBoy,
        setkaEnDona,
        ip,
        profilTuri: 'katta',
        ruchkaTuri: 'kattaRuchka'
      };
    }
  },
  evro: {
    id: 'evro',
    nom: 'Evro parog',
    belgi: '🔲',
    tavsif: 'Evro parog rezina profilli (A va B profillar bilan)',
    hasRuchka: true,
    hisobla: (w, h, brendDopusk = {}) => {
      const eshikDop = brendDopusk.eshikEnDopusk ?? 4;
      const ramkaBoy = h - 2;
      const ramkaEn = w + eshikDop; // B profil
      const aProfilEn = w + eshikDop; // A profil
      const ruchka = h - 2;
      const setkaBoy = h + 3;
      const setkaEnDona = w / 2.5;
      const ip = h + w + 20;
      return {
        ramkaBoy,
        ramkaEn,
        aProfilEn,
        ruchka,
        setkaBoy,
        setkaEnDona,
        ip,
        profilTuri: 'katta',
        ruchkaTuri: 'kattaRuchka',
        hasAProfil: true
      };
    }
  },
  tayyor_evro: {
    id: 'tayyor_evro',
    nom: 'Tayyor evro',
    belgi: '✔️',
    tavsif: 'Tayyor o\'lchamdagi evro parog',
    hasRuchka: true,
    hisobla: (w, h, brendDopusk = {}) => {
      const eshikDop = brendDopusk.eshikEnDopusk ?? 4;
      const ramkaBoy = h - 6.5;
      const ramkaEn = w - eshikDop; // B profil
      const aProfilEn = w - eshikDop; // A profil
      const ruchka = h - 6.5;
      const setkaBoy = h - 2;
      const setkaEnDona = w / 2.5;
      const ip = h + w + 20;
      return {
        ramkaBoy,
        ramkaEn,
        aProfilEn,
        ruchka,
        setkaBoy,
        setkaEnDona,
        ip,
        profilTuri: 'katta',
        ruchkaTuri: 'kattaRuchka',
        hasAProfil: true
      };
    }
  },
  haytek: {
    id: 'haytek',
    nom: 'Haytek',
    belgi: '⚡',
    tavsif: 'Tutqichsiz yengil haytek konstruksiya',
    hasRuchka: false,
    hisobla: (w, h) => {
      const ramkaBoy = h + 3;
      const ramkaEn = w + 3;
      const ruchka = 0;
      const setkaBoy = 0;
      const setkaEnDona = 0;
      const ip = h + w + 20;
      return {
        ramkaBoy,
        ramkaEn,
        ruchka,
        setkaBoy,
        setkaEnDona,
        ip,
        profilTuri: 'haytek',
        ruchkaTuri: 'none'
      };
    }
  }
};

export function hisoblaM2(eniSm, boySm) {
  const w = parseFloat(eniSm) || 0;
  const h = parseFloat(boySm) || 0;
  return (w * h) / 10000;
}

export function formatSom(qiymat) {
  if (isNaN(qiymat)) return '0';
  return Math.round(qiymat).toLocaleString('ru-RU');
}

export function hisoblaBuyurtmaNarxi(qatorlar, profillar, kurs = 12900, narxTuri = 'chakana', min1m2Qoidasi = true) {
  let jamiM2 = 0;
  let jamiHisoblanganM2 = 0;
  let jamiUsd = 0;
  let jamiSoni = 0;

  const qatorNatijalari = qatorlar.map(q => {
    const eni = parseFloat(q.eni) || 0;
    const boy = parseFloat(q.boy) || 0;
    const soni = parseInt(q.soni) || 1;
    // Profilni q.tur yoki q.profilId orqali topish
    let profil = null;
    if (q.tur === 'pastga') {
      profil = profillar.find(p => p.kesishTur === 'pastga' || p.id === 2);
    } else if (q.tur === 'yonga') {
      profil = profillar.find(p => p.kesishTur === 'yonga' || p.id === 5);
    } else if (['eshik', 'tayyor', 'evro', 'tayyor_evro'].includes(q.tur)) {
      profil = profillar.find(p => p.tur === 'katta' || p.kesishTur === 'eshik' || p.id === 1);
    } else if (q.tur === 'haytek') {
      profil = profillar.find(p => p.tur === 'haytek' || p.kesishTur === 'haytek' || p.id === 3);
    }
    if (!profil) {
      profil = profillar.find(p => p.id === q.profilId) || profillar[0];
    }

    const haqiqiyM2 = hisoblaM2(eni, boy);
    let hisoblanganBittaM2 = haqiqiyM2;
    let qatorM2 = haqiqiyM2 * soni;
    let qatorHisoblanganM2 = haqiqiyM2 * soni;
    let metrKvadratNarxiUsd = 0;
    let qatorUsd = 0;

    // 4. HAYTEK PROFILI: Kvadratga (m² ga) o'lchanmasin!
    // 4 ta tomoni yig'indisi (perimetri) bo'yicha hisoblansin: Umumiy_sm = (Eni + Bo'yi) * 2.
    // Diller rejimida: 1 sm = 390 so'm -> Narx = Umumiy_sm * 390 * soni (Masalan: 100 x 100 sm -> 400 * 390 = 156 000 so'm)
    // Standart (mijoz) rejimida: 1 sm = 700 so'm -> Narx = Umumiy_sm * 700 * soni (Masalan: 100 x 100 sm -> 400 * 700 = 280 000 so'm)
    if (profil.tur === 'haytek' || q.tur === 'haytek' || profil.isPerimeter) {
      const smStavka = narxTuri === 'diler' 
        ? (profil.dilerNarx ?? profil.dillerNarx ?? 390) 
        : (profil.chakanaNarx ?? profil.narx ?? 700);
      
      const perimetrSm = (eni + boy) * 2;
      const qatorSom = perimetrSm * smStavka * soni;
      qatorUsd = kurs > 0 ? (qatorSom / kurs) : 0;
      metrKvadratNarxiUsd = smStavka;
      hisoblanganBittaM2 = haqiqiyM2;
      qatorHisoblanganM2 = haqiqiyM2 * soni;
    } else {
      // 2 & 3. ESHIK VA KICHIKNA PROFILLAR:
      // Eshik (minNarx=false): Minimal cheklov yo'q, to'g'ridan-to'g'ri chiqqan kvadratiga ko'payadi (m² * 28$ yoki 40$).
      // Kichkina profillar (minNarx=true): 1 m² gacha bo'lsa 1 m² (23$/25$ yoki 32$/33$). 1 m² dan oshsa aniq kvadratiga ko'payadi.
      if (min1m2Qoidasi && (profil.minNarx !== false) && haqiqiyM2 > 0) {
        hisoblanganBittaM2 = Math.max(1.0, haqiqiyM2);
      } else {
        hisoblanganBittaM2 = haqiqiyM2;
      }

      metrKvadratNarxiUsd = narxTuri === 'diler' 
        ? (profil.dilerNarx ?? profil.dillerNarx ?? profil.narx ?? 0)
        : (profil.chakanaNarx ?? profil.narx ?? 0);

      qatorHisoblanganM2 = hisoblanganBittaM2 * soni;
      qatorUsd = qatorHisoblanganM2 * metrKvadratNarxiUsd;
    }

    jamiM2 += qatorM2;
    jamiHisoblanganM2 += qatorHisoblanganM2;
    jamiUsd += qatorUsd;
    jamiSoni += soni;

    return {
      ...q,
      soni,
      profilNom: profil.nom,
      turNom: profil.nom,
      haqiqiyM2,
      hisoblanganBittaM2,
      qatorM2,
      qatorUsd,
      metrKvadratNarxiUsd
    };
  });

  const jamiSom = jamiUsd * kurs;

  return {
    jamiSoni,
    jamiM2: parseFloat(jamiM2.toFixed(3)),
    jamiHisoblanganM2: parseFloat(jamiHisoblanganM2.toFixed(3)),
    jamiUsd: parseFloat(jamiUsd.toFixed(2)),
    jamiSom: Math.round(jamiSom),
    kurs,
    narxTuri,
    qatorNatijalari
  };
}

export function generatsiyaDetallar(olchamlar, brendDopusk = {}) {
  const natija = [];

  olchamlar.forEach((o, idx) => {
    const eni = parseFloat(o.eni) || 0;
    const boy = parseFloat(o.boy) || 0;
    const soni = parseInt(o.soni) || 1;
    const turConfig = KONSTRUKSIYA_TURLARI[o.tur] || KONSTRUKSIYA_TURLARI.yonga;

    if (eni <= 0 || boy <= 0) return;

    const hisob = turConfig.hisobla(eni, boy, brendDopusk);

    natija.push({
      idx,
      eni,
      boy,
      soni,
      tur: o.tur,
      turNom: turConfig.nom,
      hasRuchka: turConfig.hasRuchka,
      ramkaBoy: parseFloat(hisob.ramkaBoy.toFixed(1)),
      rBoy: parseFloat(hisob.ramkaBoy.toFixed(1)),
      ramkaEn: parseFloat(hisob.ramkaEn.toFixed(1)),
      rEn: parseFloat(hisob.ramkaEn.toFixed(1)),
      aProfilEn: hisob.aProfilEn ? parseFloat(hisob.aProfilEn.toFixed(1)) : null,
      hasAProfil: !!hisob.hasAProfil,
      ruchka: parseFloat(hisob.ruchka.toFixed(1)),
      setkaBoy: parseFloat(hisob.setkaBoy.toFixed(1)),
      setkaUz: parseFloat(hisob.setkaBoy.toFixed(1)),
      setkaEnDona: parseFloat(hisob.setkaEnDona.toFixed(1)),
      setkaDona: parseFloat(hisob.setkaEnDona.toFixed(1)),
      ip: parseFloat(hisob.ip.toFixed(1)),
      ipOlch: parseFloat(hisob.ip.toFixed(1)),
      profilTuri: hisob.profilTuri,
      ruchkaTuri: hisob.ruchkaTuri
    });
  });

  return natija;
}

// 4. Tannarx (Sebestoimost) Stavkalar va Hisoblash
export const DEFAULT_TANNARX_STAVKALARI = {
  katta: 2.66,
  kattaRuchka: 2.66,
  kichkina: 2.16,
  romRuchka: 2.16,
  haytek: 1.25,
  setka: 0.0004,
  aksessuar: 3
};

export function getTannarxStavkalari() {
  try {
    const data = localStorage.getItem('prohisobchi_tannarx');
    return data ? { ...DEFAULT_TANNARX_STAVKALARI, ...JSON.parse(data) } : DEFAULT_TANNARX_STAVKALARI;
  } catch (e) {
    return DEFAULT_TANNARX_STAVKALARI;
  }
}

export function saqlaTannarxStavkalari(stavkalar) {
  localStorage.setItem('prohisobchi_tannarx', JSON.stringify(stavkalar));
}

export function hisoblaSebestoimost(guruhRejalar, detallar, stavkalar = DEFAULT_TANNARX_STAVKALARI) {
  const safeStavkalar = {
    katta: (stavkalar && !isNaN(parseFloat(stavkalar.katta))) ? parseFloat(stavkalar.katta) : DEFAULT_TANNARX_STAVKALARI.katta,
    kattaRuchka: (stavkalar && !isNaN(parseFloat(stavkalar.kattaRuchka))) ? parseFloat(stavkalar.kattaRuchka) : DEFAULT_TANNARX_STAVKALARI.kattaRuchka,
    kichkina: (stavkalar && !isNaN(parseFloat(stavkalar.kichkina))) ? parseFloat(stavkalar.kichkina) : DEFAULT_TANNARX_STAVKALARI.kichkina,
    romRuchka: (stavkalar && !isNaN(parseFloat(stavkalar.romRuchka))) ? parseFloat(stavkalar.romRuchka) : DEFAULT_TANNARX_STAVKALARI.romRuchka,
    haytek: (stavkalar && !isNaN(parseFloat(stavkalar.haytek))) ? parseFloat(stavkalar.haytek) : DEFAULT_TANNARX_STAVKALARI.haytek,
    setka: (stavkalar && !isNaN(parseFloat(stavkalar.setka))) ? parseFloat(stavkalar.setka) : DEFAULT_TANNARX_STAVKALARI.setka,
    aksessuar: (stavkalar && !isNaN(parseFloat(stavkalar.aksessuar))) ? parseFloat(stavkalar.aksessuar) : DEFAULT_TANNARX_STAVKALARI.aksessuar
  };

  function hisoblaRejaNarxi(rejaTayoqlar, narxPerMetr, qoldiqChegara = null) {
    let jami = 0;
    const rate = parseFloat(narxPerMetr) || 0;
    (rejaTayoqlar || []).forEach(r => {
      (r.kesimlar || []).forEach(sm => {
        const smVal = parseFloat(sm) || 0;
        jami += (smVal / 100) * rate;
      });
      const qVal = parseFloat(r.aniqQoldiq) || 0;
      if (qoldiqChegara && qVal > 0 && qVal < qoldiqChegara) {
        jami += (qVal / 100) * rate;
      }
    });
    return isNaN(jami) ? 0 : jami;
  }

  let setkaUsd = 0;
  let aksessuarSoni = 0;
  (detallar || []).forEach(d => {
    const s = parseInt(d.soni) || 1;
    aksessuarSoni += s;
    const sUz = parseFloat(d.setkaUz || d.setkaBoy) || 0;
    const sDona = parseFloat(d.setkaDona || d.setkaEnDona) || 0;

    if (d.tur === 'yonga') {
      setkaUsd += sUz * sDona * s * safeStavkalar.setka;
    } else if (d.tur === 'pastga') {
      setkaUsd += sDona * sUz * s * safeStavkalar.setka;
    } else if (d.tur !== 'haytek') {
      setkaUsd += sUz * Math.ceil(sDona) * s * safeStavkalar.setka;
    }
  });

  const aksessuarUsd = aksessuarSoni * safeStavkalar.aksessuar;

  const qismlar = [];
  let profillarUsd = 0;

  (guruhRejalar || []).forEach(g => {
    let stavka = 0;
    let qoldiqChegara = null;

    if (g.key === 'kichikRom') {
      stavka = safeStavkalar.kichkina;
    } else if (g.key === 'romRuchka') {
      stavka = safeStavkalar.romRuchka;
    } else if (g.key === 'kattaEshik') {
      stavka = safeStavkalar.katta;
      qoldiqChegara = 190;
    } else if (g.key === 'kattaRuchka') {
      stavka = safeStavkalar.kattaRuchka;
      qoldiqChegara = 190;
    } else if (g.key === 'haytek') {
      stavka = safeStavkalar.haytek;
    } else if (g.key === 'aProfil') {
      stavka = safeStavkalar.katta;
      qoldiqChegara = 190;
    }

    const narx = hisoblaRejaNarxi(g.natija?.tayoqlar, stavka, qoldiqChegara);
    profillarUsd += narx;
    qismlar.push({
      nom: g.nom,
      stavka,
      usd: parseFloat((narx || 0).toFixed(2)),
      tayoqSoni: g.natija?.jamiTayoqSoni || 0
    });
  });

  profillarUsd = isNaN(profillarUsd) ? 0 : profillarUsd;
  setkaUsd = isNaN(setkaUsd) ? 0 : setkaUsd;
  const safeAksessuarUsd = isNaN(aksessuarUsd) ? 0 : aksessuarUsd;

  const jamiUsd = parseFloat((profillarUsd + setkaUsd + safeAksessuarUsd).toFixed(2));

  return {
    qismlar,
    profillarUsd: parseFloat(profillarUsd.toFixed(2)),
    setkaUsd: parseFloat(setkaUsd.toFixed(2)),
    aksessuarUsd: parseFloat(safeAksessuarUsd.toFixed(2)),
    jamiUsd: isNaN(jamiUsd) ? 0 : jamiUsd
  };
}
