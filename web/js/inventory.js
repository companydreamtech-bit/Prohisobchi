/**
 * Pro Hisobchi - inventory.js
 * Xomashyo sarfi (BOM - Bill of Materials) va Qoldiqlar ombori
 */

import { hisoblaM2 } from './calculator.js';

// Default ombor xomashyo qoldiqlari
export const DEFAULT_OMBOR = {
  profillar: [
    { id: 'p1', nom: 'Kichik ramka profil (Rom)', birlik: 'metr', miqdor: 120, minLimit: 30 },
    { id: 'p2', nom: 'Katta ramka profil (Eshik)', birlik: 'metr', miqdor: 80, minLimit: 25 },
    { id: 'p3', nom: 'Rom ruchka profil', birlik: 'metr', miqdor: 60, minLimit: 20 },
    { id: 'p4', nom: 'Katta ruchka profil', birlik: 'metr', miqdor: 45, minLimit: 15 },
    { id: 'p5', nom: 'Haytek profil', birlik: 'metr', miqdor: 50, minLimit: 15 }
  ],
  materiallar: [
    { id: 'm1', nom: 'To\'r matosi (Setka)', birlik: 'm²', miqdor: 85, minLimit: 20 },
    { id: 'm2', nom: 'Rezina shnur (ip)', birlik: 'metr', miqdor: 350, minLimit: 50 },
    { id: 'm3', nom: 'Ugolnik (plastik burchak)', birlik: 'dona', miqdor: 400, minLimit: 100 },
    { id: 'm4', nom: 'Tutqichlar (ruchka komplekt)', birlik: 'dona', miqdor: 65, minLimit: 20 },
    { id: 'm5', nom: 'Mahkamlagich (petlya & zamok)', birlik: 'dona', miqdor: 50, minLimit: 15 }
  ],
  // 100 sm dan uzun profil bo'laklari ombori
  yaroqliQoldiqlar: [
    { id: 'q1', profilId: 'p1', profilNom: 'Kichik rom', uzunlik: 245, soni: 2, sana: '2026-10-18' },
    { id: 'q2', profilId: 'p2', profilNom: 'Katta eshik', uzunlik: 180, soni: 1, sana: '2026-10-18' },
    { id: 'q3', profilId: 'p1', profilNom: 'Kichik rom', uzunlik: 135, soni: 3, sana: '2026-10-19' }
  ]
};

/**
 * Buyurtma uchun Xomashyo Sarfini (BOM) avtomatik hisoblash
 * @param {Array} detallar - generatsiyaDetallar() natijasi
 */
export function hisoblaBOM(detallar) {
  let jamiRamkaMetr = 0;
  let jamiRuchkaMetr = 0;
  let jamiSetkaM2 = 0;
  let jamiShnurMetr = 0;
  let jamiTorSoni = 0;
  let jamiTutqichSoni = 0;

  detallar.forEach(d => {
    const s = d.soni;
    jamiTorSoni += s;

    // Ramka profil metrda (2 ta bo'y + 2 ta en)
    const bittaRamkaMetr = ((d.ramkaBoy * 2) + (d.ramkaEn * 2)) / 100;
    jamiRamkaMetr += bittaRamkaMetr * s;

    // Ruchka profil metrda
    if (d.hasRuchka && d.ruchka > 0) {
      jamiRuchkaMetr += (d.ruchka / 100) * s;
      jamiTutqichSoni += s;
    }

    // Setka maydoni m2 da
    const bittaM2 = hisoblaM2(d.eni, d.boy);
    jamiSetkaM2 += bittaM2 * s;

    // Shnur (ip) uzunligi metrda
    if (d.ip > 0) {
      jamiShnurMetr += (d.ip / 100) * s;
    }
  });

  // 6 metrlik tayoqlar soni (zahira hisobi)
  const ramkaTayoq6m = Math.ceil(jamiRamkaMetr / 6);
  const ruchkaTayoq6m = Math.ceil(jamiRuchkaMetr / 6);
  const ugolnikSoni = jamiTorSoni * 4; // har bir to'rga 4 ta burchak
  const mahkamlagichSoni = jamiTorSoni * 2; // kamida 2 ta mahkamlagich

  return {
    jamiTorSoni,
    ramkaMetr: parseFloat(jamiRamkaMetr.toFixed(2)),
    ramkaTayoq6m,
    ruchkaMetr: parseFloat(jamiRuchkaMetr.toFixed(2)),
    ruchkaTayoq6m,
    setkaM2: parseFloat(jamiSetkaM2.toFixed(3)),
    shnurMetr: parseFloat(jamiShnurMetr.toFixed(1)),
    ugolnikSoni,
    tutqichSoni: jamiTutqichSoni,
    mahkamlagichSoni
  };
}

/**
 * Ombor holatini LocalStorage dan o'qish
 */
export function getOmbor() {
  try {
    const data = localStorage.getItem('prohisobchi_ombor');
    return data ? JSON.parse(data) : DEFAULT_OMBOR;
  } catch (e) {
    console.error('Ombor o\'qishda xatolik:', e);
    return DEFAULT_OMBOR;
  }
}

/**
 * Ombor holatini saqlash
 */
export function saqlaOmbor(omborData) {
  localStorage.setItem('prohisobchi_ombor', JSON.stringify(omborData));
}

/**
 * Yangi yaroqli qoldiq qo'shish (100sm dan uzun)
 */
export function qoldiqQoshOmborga(qoldiq) {
  const ombor = getOmbor();
  const yangiQoldiq = {
    id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    profilNom: qoldiq.profilNom || 'Kichik rom',
    uzunlik: parseFloat(qoldiq.uzunlik),
    soni: parseInt(qoldiq.soni) || 1,
    sana: new Date().toISOString().split('T')[0]
  };
  ombor.yaroqliQoldiqlar.unshift(yangiQoldiq);
  saqlaOmbor(ombor);
  return ombor;
}

/**
 * Qoldiqni ombordan o'chirish / ishlatish
 */
export function qoldiqOchirOmbordan(qoldiqId) {
  const ombor = getOmbor();
  ombor.yaroqliQoldiqlar = ombor.yaroqliQoldiqlar.filter(q => q.id !== qoldiqId);
  saqlaOmbor(ombor);
  return ombor;
}
