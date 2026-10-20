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

export function getProfilBrendlari() {
  try {
    const data = localStorage.getItem('prohisobchi_brendlar');
    return data ? JSON.parse(data) : DEFAULT_PROFIL_BRENDLARI;
  } catch (e) {
    return DEFAULT_PROFIL_BRENDLARI;
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
      const setkaBoy = ramkaBoy / 2;
      const setkaEnDona = w + enDopusk;
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
    const profil = profillar.find(p => p.id === q.profilId) || profillar[0];

    const haqiqiyM2 = hisoblaM2(eni, boy);
    let hisoblanganBittaM2 = haqiqiyM2;

    if (min1m2Qoidasi && (profil.minNarx !== false) && haqiqiyM2 > 0) {
      hisoblanganBittaM2 = Math.max(1.0, haqiqiyM2);
    }

    const metrKvadratNarxiUsd = narxTuri === 'diler' 
      ? (profil.dilerNarx ?? profil.dillerNarx ?? profil.narx ?? 0)
      : (profil.chakanaNarx ?? profil.narx ?? 0);

    const qatorM2 = haqiqiyM2 * soni;
    const qatorHisoblanganM2 = hisoblanganBittaM2 * soni;
    const qatorUsd = qatorHisoblanganM2 * metrKvadratNarxiUsd;

    jamiM2 += qatorM2;
    jamiHisoblanganM2 += qatorHisoblanganM2;
    jamiUsd += qatorUsd;
    jamiSoni += soni;

    return {
      ...q,
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
      ramkaEn: parseFloat(hisob.ramkaEn.toFixed(1)),
      aProfilEn: hisob.aProfilEn ? parseFloat(hisob.aProfilEn.toFixed(1)) : null,
      hasAProfil: !!hisob.hasAProfil,
      ruchka: parseFloat(hisob.ruchka.toFixed(1)),
      setkaBoy: parseFloat(hisob.setkaBoy.toFixed(1)),
      setkaEnDona: parseFloat(hisob.setkaEnDona.toFixed(1)),
      ip: parseFloat(hisob.ip.toFixed(1)),
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
  function hisoblaRejaNarxi(rejaTayoqlar, narxPerMetr, qoldiqChegara = null) {
    let jami = 0;
    (rejaTayoqlar || []).forEach(r => {
      (r.kesimlar || []).forEach(sm => {
        jami += (sm / 100) * narxPerMetr;
      });
      if (qoldiqChegara && r.aniqQoldiq > 0 && r.aniqQoldiq < qoldiqChegara) {
        jami += (r.aniqQoldiq / 100) * narxPerMetr;
      }
    });
    return jami;
  }

  let setkaUsd = 0;
  let aksessuarSoni = 0;
  detallar.forEach(d => {
    const s = d.soni;
    aksessuarSoni += s;
    if (d.tur === 'yonga') {
      setkaUsd += d.setkaUz * d.setkaDona * s * stavkalar.setka;
    } else if (d.tur === 'pastga') {
      setkaUsd += d.setkaDona * d.setkaUz * s * stavkalar.setka;
    } else if (d.tur !== 'haytek') {
      setkaUsd += d.setkaUz * Math.ceil(d.setkaDona) * s * stavkalar.setka;
    }
  });

  const aksessuarUsd = aksessuarSoni * stavkalar.aksessuar;

  const qismlar = [];
  let profillarUsd = 0;

  guruhRejalar.forEach(g => {
    let stavka = 0;
    let qoldiqChegara = null;

    if (g.key === 'kichikRom') {
      stavka = stavkalar.kichkina;
    } else if (g.key === 'romRuchka') {
      stavka = stavkalar.romRuchka;
    } else if (g.key === 'kattaEshik') {
      stavka = stavkalar.katta;
      qoldiqChegara = 190;
    } else if (g.key === 'kattaRuchka') {
      stavka = stavkalar.kattaRuchka;
      qoldiqChegara = 190;
    } else if (g.key === 'haytek') {
      stavka = stavkalar.haytek;
    } else if (g.key === 'aProfil') {
      stavka = stavkalar.katta;
      qoldiqChegara = 190;
    }

    const narx = hisoblaRejaNarxi(g.natija.tayoqlar, stavka, qoldiqChegara);
    profillarUsd += narx;
    qismlar.push({
      nom: g.nom,
      stavka,
      usd: parseFloat(narx.toFixed(2)),
      tayoqSoni: g.natija.jamiTayoqSoni
    });
  });

  const jamiUsd = parseFloat((profillarUsd + setkaUsd + aksessuarUsd).toFixed(2));

  return {
    qismlar,
    profillarUsd: parseFloat(profillarUsd.toFixed(2)),
    setkaUsd: parseFloat(setkaUsd.toFixed(2)),
    aksessuarUsd: parseFloat(aksessuarUsd.toFixed(2)),
    jamiUsd
  };
}
