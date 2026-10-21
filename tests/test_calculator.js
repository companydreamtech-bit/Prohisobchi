import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  KONSTRUKSIYA_TURLARI,
  DEFAULT_PROFIL_BRENDLARI,
  hisoblaM2,
  formatSom,
  hisoblaBuyurtmaNarxi,
  generatsiyaDetallar,
  hisoblaSebestoimost,
  DEFAULT_TANNARX_STAVKALARI
} from '../web/js/calculator.js';
import { hisoblaGuruhlanganRaskroy } from '../web/js/cutting.js';

describe('1. Kvadratura va Formatlash Testlari', () => {
  it('hisoblaM2: 60 sm x 140 sm = 0.84 m² bo\'lishi kerak', () => {
    const m2 = hisoblaM2(60, 140);
    assert.equal(m2, 0.84);
  });

  it('hisoblaM2: 100 sm x 200 sm = 2.0 m² bo\'lishi kerak', () => {
    const m2 = hisoblaM2(100, 200);
    assert.equal(m2, 2.0);
  });

  it('hisoblaM2: 0 yoki manfiy qiymatlarda 0 qaytarishi kerak', () => {
    assert.equal(hisoblaM2(0, 140), 0);
    assert.equal(hisoblaM2(null, undefined), 0);
  });

  it('formatSom: raqamlarni probel bilan ajratib formatlashi kerak', () => {
    const formatted = formatSom(1250000);
    // ru-RU format bo'yicha non-breaking space yoki oddiy space
    assert.ok(formatted.replace(/\s+/g, ' ') === '1 250 000' || formatted === '1 250 000');
  });
});

describe('2. Konstruksiya Formulalari Testlari (7 xil tur)', () => {
  const brendStandart = DEFAULT_PROFIL_BRENDLARI[0]; // romEnDopusk: 2.0, eshikEnDopusk: 4.0, ruchkaDopusk: -0.8

  it('Rom yonga formulasi to\'g\'ri hisoblashi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.yonga.hisobla(60, 140, brendStandart);
    assert.equal(res.ramkaBoy, 140);
    assert.equal(res.ramkaEn, 62); // 60 + 2
    assert.equal(res.ruchka, 139.2); // 140 - 0.8
    assert.equal(res.profilTuri, 'kichik');
    assert.equal(res.ruchkaTuri, 'romRuchka');
  });

  it('Rom pastga formulasi to\'g\'ri hisoblashi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.pastga.hisobla(60, 140, brendStandart);
    assert.equal(res.ramkaBoy, 142); // 140 + 2
    assert.equal(res.ramkaEn, 60);
    assert.equal(res.ruchka, 59.2); // 60 - 0.8
    assert.equal(res.profilTuri, 'kichik');
  });

  it('Oddiy eshik formulasi to\'g\'ri hisoblashi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.eshik.hisobla(80, 200, brendStandart);
    assert.equal(res.ramkaBoy, 200);
    assert.equal(res.ramkaEn, 84); // 80 + 4
    assert.equal(res.profilTuri, 'katta');
    assert.equal(res.ruchkaTuri, 'kattaRuchka');
  });

  it('Tayyor eshik formulasi to\'g\'ri hisoblashi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.tayyor.hisobla(80, 200, brendStandart);
    assert.equal(res.ramkaBoy, 192); // 200 - 8
    assert.equal(res.ramkaEn, 76); // 80 - 4
    assert.equal(res.profilTuri, 'katta');
  });

  it('Evro parog formulasi (A va B profil) to\'g\'ri hisoblashi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.evro.hisobla(80, 200, brendStandart);
    assert.equal(res.ramkaBoy, 198); // 200 - 2
    assert.equal(res.ramkaEn, 84); // B profil: 80 + 4
    assert.equal(res.aProfilEn, 84); // A profil: 80 + 4
    assert.equal(res.hasAProfil, true);
  });

  it('Tayyor evro parog formulasi to\'g\'ri hisoblashi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.tayyor_evro.hisobla(80, 200, brendStandart);
    assert.equal(res.ramkaBoy, 193.5); // 200 - 6.5
    assert.equal(res.ramkaEn, 76); // 80 - 4
    assert.equal(res.aProfilEn, 76);
  });

  it('Haytek konstruksiya formulasi to\'g\'ri hisoblashi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.haytek.hisobla(60, 140);
    assert.equal(res.ramkaBoy, 143); // 140 + 3
    assert.equal(res.ramkaEn, 63); // 60 + 3
    assert.equal(res.ruchka, 0);
    assert.equal(res.profilTuri, 'haytek');
    assert.equal(res.ruchkaTuri, 'none');
  });
});

describe('3. Narxlash va 1m² Minimal Qoidasi Testlari', () => {
  const profillar = [
    { id: 1, nom: 'Rom', chakanaNarx: 23, dilerNarx: 20, minNarx: true, tur: 'kichik' },
    { id: 2, nom: 'Eshik', chakanaNarx: 28, dilerNarx: 24, minNarx: false, tur: 'katta' }
  ];
  const kurs = 12900;

  it('Maydoni 1m² dan kichik bo\'lsa (masalan 0.84m²), min 1m² narxi bilan hisoblanishi kerak (Chakana)', () => {
    const qatorlar = [{ id: 1, profilId: 1, eni: 60, boy: 140, soni: 1, tur: 'yonga' }];
    const res = hisoblaBuyurtmaNarxi(qatorlar, profillar, kurs, 'chakana', true);

    assert.equal(res.jamiM2, 0.84);
    assert.equal(res.jamiHisoblanganM2, 1.0); // 1m² ga yaxlitlangan
    assert.equal(res.jamiUsd, 23.0); // 1m² * 23$
    assert.equal(res.jamiSom, 23.0 * 12900);
  });

  it('Diler narxida hisoblash: 1m² * 20$ = 20$', () => {
    const qatorlar = [{ id: 1, profilId: 1, eni: 60, boy: 140, soni: 1, tur: 'yonga' }];
    const res = hisoblaBuyurtmaNarxi(qatorlar, profillar, kurs, 'diler', true);

    assert.equal(res.jamiUsd, 20.0);
    assert.equal(res.jamiSom, 20.0 * 12900);
  });

  it('Maydoni 1m² dan katta bo\'lsa (masalan 1.5m²), haqiqiy maydoni bilan hisoblanishi kerak', () => {
    const qatorlar = [{ id: 1, profilId: 1, eni: 100, boy: 150, soni: 1, tur: 'yonga' }];
    const res = hisoblaBuyurtmaNarxi(qatorlar, profillar, kurs, 'chakana', true);

    assert.equal(res.jamiM2, 1.5);
    assert.equal(res.jamiHisoblanganM2, 1.5);
    assert.equal(res.jamiUsd, 1.5 * 23);
  });
});

describe('4. Detallar Generatsiyasi (generatsiyaDetallar) Testlari', () => {
  it('Bir nechta o\'lchamlar uchun ramka, ruchka, ip va setkalarni to\'g\'ri ajratishi kerak', () => {
    const olchamlar = [
      { id: 1, eni: 60, boy: 140, soni: 2, tur: 'yonga' },
      { id: 2, eni: 80, boy: 200, soni: 1, tur: 'eshik' }
    ];
    const brend = DEFAULT_PROFIL_BRENDLARI[1]; // Akfa

    const detallar = generatsiyaDetallar(olchamlar, brend);
    assert.equal(detallar.length, 2);

    // 1-detal: Rom yonga
    assert.equal(detallar[0].ramkaBoy, 140);
    assert.equal(detallar[0].ramkaEn, 62);
    assert.equal(detallar[0].soni, 2);
    assert.equal(detallar[0].profilTuri, 'kichik');

    // 2-detal: Eshik
    assert.equal(detallar[1].ramkaBoy, 200);
    assert.equal(detallar[1].ramkaEn, 84);
    assert.equal(detallar[1].soni, 1);
    assert.equal(detallar[1].profilTuri, 'katta');
  });
});

describe('5. Tannarx (Sebestoimost) NaN Bo\'lmaslik va To\'liq Hisoblash Testlari', () => {
  const brend = DEFAULT_PROFIL_BRENDLARI[0];

  it('Barcha 7 xil turdagi to\'rlar uchun hisoblaSebestoimost NaN chiqmasligi va musbat raqam bo\'lishi kerak', () => {
    const turlar = ['yonga', 'pastga', 'eshik', 'tayyor', 'evro', 'tayyor_evro', 'haytek'];
    const olchamlar = turlar.map((tur, i) => ({
      id: i + 1,
      eni: 70,
      boy: 150,
      soni: 1,
      tur
    }));

    const detallar = generatsiyaDetallar(olchamlar, brend);
    const guruhlangan = hisoblaGuruhlanganRaskroy(detallar, 600, {}, 0.3);
    const seb = hisoblaSebestoimost(guruhlangan.guruhNatijalar, detallar, DEFAULT_TANNARX_STAVKALARI);

    assert.ok(!isNaN(seb.jamiUsd), 'jamiUsd NaN bo\'lmasligi kerak');
    assert.ok(!isNaN(seb.setkaUsd), 'setkaUsd NaN bo\'lmasligi kerak');
    assert.ok(!isNaN(seb.profillarUsd), 'profillarUsd NaN bo\'lmasligi kerak');
    assert.ok(!isNaN(seb.aksessuarUsd), 'aksessuarUsd NaN bo\'lmasligi kerak');

    assert.ok(seb.jamiUsd > 0, 'jamiUsd > 0 bo\'lishi kerak');
    assert.ok(seb.setkaUsd > 0, 'setkaUsd > 0 bo\'lishi kerak');
    assert.ok(seb.aksessuarUsd > 0, 'aksessuarUsd > 0 bo\'lishi kerak');
    assert.ok(seb.profillarUsd > 0, 'profillarUsd > 0 bo\'lishi kerak');
  });

  it('3 ta asosiy tuzatish: 4 ta kategoriya, Haytek 390/700 perimetr formulasi va Raskroy varaqasi', async () => {
    // 1. Faqat 4 ta kategoriya app.js da mavjudligi
    const fs = await import('node:fs');
    const path = await import('node:path');
    const appCode = fs.readFileSync(path.resolve('web/js/app.js'), 'utf8');
    assert.ok(appCode.includes("nom: 'Rom yonga'"));
    assert.ok(appCode.includes("nom: 'Rom pastga'"));
    assert.ok(appCode.includes("nom: 'Eshik'"));
    assert.ok(appCode.includes("nom: 'Haytek'"));

    // 2. Haytek perimetr formulasi (100 x 100 sm, 1 dona):
    // Umumiy_sm = (100 + 100) * 2 = 400 sm
    // Diller: 400 * 390 = 156 000 so'm
    // Standart: 400 * 700 = 280 000 so'm
    const profillar = [
      { id: 3, nom: 'Haytek profil', chakanaNarx: 700, dilerNarx: 390, minNarx: false, tur: 'haytek', kesishTur: 'haytek' }
    ];
    const haytekRow = [{ id: 1, profilId: 3, eni: 100, boy: 100, soni: 1, tur: 'haytek' }];
    const narxDiler = hisoblaBuyurtmaNarxi(haytekRow, profillar, 12900, 'diler', true);
    assert.equal(narxDiler.jamiSom, 156000);

    const narxStandart = hisoblaBuyurtmaNarxi(haytekRow, profillar, 12900, 'chakana', true);
    assert.equal(narxStandart.jamiSom, 280000);

    // 3. Kesish: 147 x 48 sm, 6 dona (Rom pastga)
    const { generatsiyaIshchiXabari } = await import('../web/js/telegram.js');
    const orderRows = [{ id: 1, profilId: 2, eni: 48, boy: 147, soni: 6, tur: 'pastga' }];
    const detallar = generatsiyaDetallar(orderRows, brend);
    const mockOrder = {
      id: 'TEST1234',
      sana: '12:00',
      mijozIsm: 'Anvar aka',
      rang: '306G',
      detallar
    };

    const varaq = generatsiyaIshchiXabari(mockOrder, null, null, 12900);
    // Ramka soni soni ga ko'paytirilgan: 149 sm (12 dona), 48 sm (12 dona)
    assert.ok(varaq.includes('149') && varaq.includes('12 dona'), 'Ramka bo\'yi 12 dona bo\'lishi kerak');
    assert.ok(varaq.includes('48') && varaq.includes('12 dona'), 'Ramka eni 12 dona bo\'lishi kerak');
    assert.ok(varaq.includes('Ruchka:') && varaq.includes('6 dona'), 'Ruchka 6 dona bo\'lishi kerak');

    // Raskroy bloki
    assert.ok(varaq.includes('KESISH REJASI (Profil: 600sm)'), 'Raskroy sarlavhasi chiqishi kerak');
    assert.ok(varaq.includes('149 / 149 / 149 / 149'), 'Kesimlar / bilan ajratilishi kerak');
    assert.ok(varaq.includes('qoldiq:'), 'Qoldiq ko\'rsatilishi kerak');
    assert.ok(varaq.includes('JAMI PROFIL SARFI:'), 'Jami profil sarfi chiqishi kerak');
    assert.ok(!varaq.includes('TANNARX (SEBESTOIMOST)'), 'Tannarx sex varaqasida bo\'lmasligi kerak');
    assert.ok(!varaq.includes('KERAKLI XOMASHYO'), 'Kerakli xomashyo sex varaqasida bo\'lmasligi kerak');
  });
});

describe('5. Yangilangan Standart Tariflar va Bo\'sh Soni (UX) Testlari', () => {
  const standartProfillar = [
    { id: 5, nom: 'Rom yonga', chakanaNarx: 33, dilerNarx: 25, narx: 33, dillerNarx: 25, minNarx: true, tur: 'kichik', kesishTur: 'yonga' },
    { id: 2, nom: 'Rom pastga', chakanaNarx: 32, dilerNarx: 23, narx: 32, dillerNarx: 23, minNarx: true, tur: 'kichik', kesishTur: 'pastga' },
    { id: 1, nom: 'Eshik', chakanaNarx: 40, dilerNarx: 28, narx: 40, dillerNarx: 28, minNarx: false, tur: 'katta', kesishTur: 'eshik' },
    { id: 3, nom: 'Haytek', chakanaNarx: 700, dilerNarx: 390, narx: 700, dillerNarx: 390, minNarx: false, tur: 'haytek', kesishTur: 'haytek', isPerimeter: true }
  ];

  it('Soni kiritilmaganda (bo\'sh qolganda) avtomatik 1 deb hisoblanishi kerak', () => {
    const qatorlar = [{ id: 1, profilId: 5, eni: 100, boy: 100, soni: '', tur: 'yonga' }];
    const res = hisoblaBuyurtmaNarxi(qatorlar, standartProfillar, 12900, 'chakana', true);
    assert.equal(res.jamiSoni, 1);
    assert.equal(res.jamiM2, 1.0);
    assert.equal(res.jamiUsd, 33.0);
  });

  it('Rom yonga: 33 $/m² (1 m² gacha 33$, 1.5 m² bo\'lsa 49.5$)', () => {
    // 1 m² gacha
    const q1 = [{ id: 1, profilId: 5, eni: 60, boy: 140, soni: 1, tur: 'yonga' }]; // 0.84 m²
    const res1 = hisoblaBuyurtmaNarxi(q1, standartProfillar, 12900, 'chakana', true);
    assert.equal(res1.jamiHisoblanganM2, 1.0);
    assert.equal(res1.jamiUsd, 33.0);

    // 1 m² dan oshganda
    const q2 = [{ id: 1, profilId: 5, eni: 100, boy: 150, soni: 1, tur: 'yonga' }]; // 1.5 m²
    const res2 = hisoblaBuyurtmaNarxi(q2, standartProfillar, 12900, 'chakana', true);
    assert.equal(res2.jamiHisoblanganM2, 1.5);
    assert.equal(res2.jamiUsd, 49.5);
  });

  it('Rom pastga: 32 $/m² (1 m² gacha 32$, 2 m² bo\'lsa 64$)', () => {
    const q1 = [{ id: 1, profilId: 2, eni: 50, boy: 100, soni: 1, tur: 'pastga' }]; // 0.5 m²
    const res1 = hisoblaBuyurtmaNarxi(q1, standartProfillar, 12900, 'chakana', true);
    assert.equal(res1.jamiHisoblanganM2, 1.0);
    assert.equal(res1.jamiUsd, 32.0);

    const q2 = [{ id: 1, profilId: 2, eni: 100, boy: 200, soni: 1, tur: 'pastga' }]; // 2.0 m²
    const res2 = hisoblaBuyurtmaNarxi(q2, standartProfillar, 12900, 'chakana', true);
    assert.equal(res2.jamiHisoblanganM2, 2.0);
    assert.equal(res2.jamiUsd, 64.0);
  });

  it('Eshik: 40 $/m² (minNarx: false — 0.5 m² bo\'lsa ham 20$ hisoblanadi)', () => {
    const q = [{ id: 1, profilId: 1, eni: 50, boy: 100, soni: '', tur: 'eshik' }]; // 0.5 m², soni: ''
    const res = hisoblaBuyurtmaNarxi(q, standartProfillar, 12900, 'chakana', true);
    assert.equal(res.jamiM2, 0.5);
    assert.equal(res.jamiHisoblanganM2, 0.5);
    assert.equal(res.jamiUsd, 20.0);
  });

  it('Haytek: o\'zgarishsiz (Standart = 700 so\'m/sm, Diller = 390 so\'m/sm)', () => {
    const q = [{ id: 1, profilId: 3, eni: 100, boy: 100, soni: '', tur: 'haytek' }]; // Perimetr 400 sm
    const resChakana = hisoblaBuyurtmaNarxi(q, standartProfillar, 12900, 'chakana', true);
    assert.equal(resChakana.jamiSom, 400 * 700); // 280 000 so'm

    const resDiler = hisoblaBuyurtmaNarxi(q, standartProfillar, 12900, 'diler', true);
    assert.equal(resDiler.jamiSom, 400 * 390); // 156 000 so'm
  });

  it('generatsiyaMijozCheki: Barcha o\'lchamlar, profillar, m², summasi va toifa to\'g\'ri chiqishi kerak', async () => {
    const { generatsiyaMijozCheki } = await import('../web/js/telegram.js');
    const buyurtma = {
      id: '9671',
      sana: '21.10.2026, 12:04',
      mijozIsm: 'Anvar aka',
      mijozTel: '+998 90 123 45 67',
      rang: '306G',
      narxTuri: 'chakana',
      kurs: 12900,
      tolovHolati: 'Naqd',
      qatorlar: [
        { eni: 80, boy: 140, soni: 2, tur: 'yonga' },
        { eni: 70, boy: 130, soni: 2, tur: 'pastga' },
        { eni: 90, boy: 205, soni: 1, tur: 'eshik' }
      ]
    };

    const chek = generatsiyaMijozCheki(buyurtma);
    assert.ok(chek.includes('🏷️ Toifa: <b>Standart (Chakana)</b>'), 'Toifa Standart (Chakana) bo\'lishi kerak');
    assert.ok(chek.includes('1) <b>Rom yonga:</b> 80 × 140 sm — 2 dona'), 'Rom yonga chiqishi kerak');
    assert.ok(chek.includes('2) <b>Rom pastga:</b> 70 × 130 sm — 2 dona'), 'Rom pastga chiqishi kerak');
    assert.ok(chek.includes('3) <b>Eshik:</b> 90 × 205 sm — 1 dona'), 'Eshik chiqishi kerak');
    assert.ok(chek.includes('🔢 <b>Jami mahsulot:</b> 5 dona'), 'Jami soni chiqishi kerak');
  });

  it('generatsiyaMijozCheki: Diller tanlanganda toifa Diller (Ulgurji) chiqishi kerak', async () => {
    const { generatsiyaMijozCheki } = await import('../web/js/telegram.js');
    const buyurtma = {
      id: '9672',
      sana: '21.10.2026, 12:05',
      mijozIsm: 'Diler Sherzod',
      narxTuri: 'diler',
      qatorlar: [{ eni: 100, boy: 100, soni: 1, tur: 'pastga' }]
    };
    const chek = generatsiyaMijozCheki(buyurtma);
    assert.ok(chek.includes('🏷️ Toifa: <b>Diller (Ulgurji)</b>'), 'Toifa Diller (Ulgurji) bo\'lishi kerak');
    assert.ok(chek.includes('1) <b>Rom pastga:</b> 100 × 100 sm — 1 dona'), 'Rom pastga chiqishi kerak');
  });
});

