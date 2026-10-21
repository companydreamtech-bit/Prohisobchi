import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Node.js test muhitida localStorage simulyatsiyasi
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

import {
  KONSTRUKSIYA_TURLARI,
  DEFAULT_PROFIL_BRENDLARI,
  DEFAULT_TANNARX_STAVKALARI,
  hisoblaM2,
  formatSom,
  hisoblaBuyurtmaNarxi,
  generatsiyaDetallar,
  hisoblaSebestoimost
} from '../web/js/calculator.js';

import {
  hisobla1DRaskroy,
  hisoblaGuruhlanganRaskroy,
  STANDART_PROFIL_UZUNLIGI,
  ARRA_QALINLIGI
} from '../web/js/cutting.js';

import { hisoblaBOM } from '../web/js/inventory.js';

import {
  tranzaksiyaQosh,
  qarzQosh,
  qarzYopish,
  hisoblaKassaBalansi,
  hisoblaQarzlarStatistikasi,
  generatsiyaKassaTelegramHisoboti,
  eksportCSV
} from '../web/js/finance.js';

import {
  generatsiyaIshchiXabari,
  generatsiyaMijozCheki
} from '../web/js/telegram.js';

describe('🚀 1. KONSTRUKSIYA VA HISOB-KITOB FORMULALARI (7 XIL TUR)', () => {
  const brend = DEFAULT_PROFIL_BRENDLARI[0]; // Standart (romEnDopusk: 2.0, eshikEnDopusk: 4.0, ruchkaDopusk: -0.8)

  it('1.1 Rom yonga: Ramka bo\'yi va eni, ruchkasi va profili to\'g\'ri bo\'lishi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.yonga.hisobla(70, 140, brend);
    assert.equal(res.ramkaBoy, 140);
    assert.equal(res.ramkaEn, 72); // 70 + 2
    assert.equal(res.ruchka, 139.2); // 140 - 0.8
    assert.equal(res.ip, 70 + 140 + 20); // 230
    assert.equal(res.profilTuri, 'kichik');
    assert.equal(res.ruchkaTuri, 'romRuchka');
  });

  it('1.2 Rom pastga: Ramka bo\'yi va eni, ruchkasi va profili to\'g\'ri bo\'lishi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.pastga.hisobla(60, 150, brend);
    assert.equal(res.ramkaBoy, 152); // 150 + 2
    assert.equal(res.ramkaEn, 60);
    assert.equal(res.ruchka, 59.2); // 60 - 0.8
    assert.equal(res.ip, 60 + 150 + 20);
    assert.equal(res.profilTuri, 'kichik');
  });

  it('1.3 Oddiy Eshik: Katta profil va katta ruchka ishlatilishi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.eshik.hisobla(90, 210, brend);
    assert.equal(res.ramkaBoy, 210);
    assert.equal(res.ramkaEn, 94); // 90 + 4
    assert.equal(res.ruchka, 209.2); // 210 - 0.8
    assert.equal(res.profilTuri, 'katta');
    assert.equal(res.ruchkaTuri, 'kattaRuchka');
  });

  it('1.4 Tayyor Eshik: Ichki o\'lchamlar chegirilishi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.tayyor.hisobla(80, 200, brend);
    assert.equal(res.ramkaBoy, 192); // 200 - 8
    assert.equal(res.ramkaEn, 76); // 80 - 4
    assert.equal(res.profilTuri, 'katta');
  });

  it('1.5 Evro Parog: A profil va B profil ajralishi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.evro.hisobla(85, 205, brend);
    assert.equal(res.ramkaBoy, 203); // 205 - 2
    assert.equal(res.ramkaEn, 89); // B profil: 85 + 4
    assert.equal(res.aProfilEn, 89); // A profil: 85 + 4
    assert.equal(res.hasAProfil, true);
  });

  it('1.6 Tayyor Evro: Maxsus chegirma bilan hisoblanishi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.tayyor_evro.hisobla(80, 200, brend);
    assert.equal(res.ramkaBoy, 193.5); // 200 - 6.5
    assert.equal(res.ramkaEn, 76); // 80 - 4
    assert.equal(res.aProfilEn, 76);
  });

  it('1.7 Haytek: Qo\'shimcha 3 sm qo\'shilishi va ruchkasiz bo\'lishi kerak', () => {
    const res = KONSTRUKSIYA_TURLARI.haytek.hisobla(60, 140);
    assert.equal(res.ramkaBoy, 143);
    assert.equal(res.ramkaEn, 63);
    assert.equal(res.ruchka, 0);
    assert.equal(KONSTRUKSIYA_TURLARI.haytek.hasRuchka, false);
    assert.equal(res.profilTuri, 'haytek');
  });
});

describe('💰 2. NARXLASH, KVADRATURA VA MINIMAL 1m² QOIDASI', () => {
  const profillar = [
    { id: 1, nom: 'Eshik (Set Pro Katta)', chakanaNarx: 40, dilerNarx: 28, minNarx: false, tur: 'katta', kesishTur: 'eshik' },
    { id: 2, nom: 'Kichkina profil pastga', chakanaNarx: 32, dilerNarx: 23, minNarx: true, tur: 'kichik', kesishTur: 'pastga' },
    { id: 5, nom: 'Kichkina profil yonga', chakanaNarx: 33, dilerNarx: 25, minNarx: true, tur: 'kichik', kesishTur: 'yonga' },
    { id: 3, nom: 'Haytek profil', chakanaNarx: 700, dilerNarx: 390, minNarx: false, tur: 'haytek', kesishTur: 'haytek' }
  ];
  const kurs = 12800;

  it('2.1 MinNarx=true bo\'lsa va maydon 0.5 m² bo\'lsa, 1 m² narxi olinishi kerak', () => {
    // Kichkina profil pastga: Standart 32$, Diler 23$
    const qatorlar = [{ id: 1, profilId: 2, eni: 50, boy: 100, soni: 1, tur: 'pastga' }];
    const narx = hisoblaBuyurtmaNarxi(qatorlar, profillar, kurs, 'chakana', true);
    assert.equal(narx.jamiM2, 0.5);
    assert.equal(narx.jamiHisoblanganM2, 1.0);
    assert.equal(narx.jamiUsd, 32.0); // Standart min 1m² = 32$
    assert.equal(narx.jamiSom, 32.0 * kurs);
  });

  it('2.2 MinNarx=false bo\'lsa, aniq 0.5 m² narxi olinishi kerak (0.5 * 40 = 20$)', () => {
    // Eshik: Standart 40$, Diler 28$
    const qatorlar = [{ id: 1, profilId: 1, eni: 50, boy: 100, soni: 1, tur: 'eshik' }];
    const narx = hisoblaBuyurtmaNarxi(qatorlar, profillar, kurs, 'chakana', true);
    assert.equal(narx.jamiM2, 0.5);
    assert.equal(narx.jamiHisoblanganM2, 0.5);
    assert.equal(narx.jamiUsd, 20.0); // 0.5 * 40 = 20$
  });

  it('2.3 Diler narxi rejimida diler stavkasida hisoblanishi kerak (Kichik pastga 23$, Eshik 14$)', () => {
    const qatorlar = [{ id: 1, profilId: 2, eni: 50, boy: 100, soni: 1, tur: 'pastga' }];
    const narx = hisoblaBuyurtmaNarxi(qatorlar, profillar, kurs, 'diler', true);
    assert.equal(narx.jamiUsd, 23.0); // 1m² * 23$
    assert.equal(narx.jamiSom, 23.0 * kurs);

    const qatorlarEshik = [{ id: 2, profilId: 1, eni: 50, boy: 100, soni: 1, tur: 'eshik' }];
    const narxEshik = hisoblaBuyurtmaNarxi(qatorlarEshik, profillar, kurs, 'diler', true);
    assert.equal(narxEshik.jamiUsd, 14.0); // 0.5 * 28 = 14$
  });

  it('2.4 Haytek profil perimetr santimetri bo\'yicha hisoblanishi kerak', () => {
    // 50 x 150 sm, Perimetr = (50+150)*2 = 400 sm. Diler: 400 * 390 = 156,000 so'm
    const qatorlar = [{ id: 1, profilId: 3, eni: 50, boy: 150, soni: 1, tur: 'haytek' }];
    const narxDiler = hisoblaBuyurtmaNarxi(qatorlar, profillar, kurs, 'diler', true);
    assert.equal(narxDiler.jamiSom, 156000);

    // Standart: 400 * 700 = 280,000 so'm
    const narxStandart = hisoblaBuyurtmaNarxi(qatorlar, profillar, kurs, 'chakana', true);
    assert.equal(narxStandart.jamiSom, 280000);
  });

  it('2.4 formatSom: summalarni chiroyli probel bilan formatlashi kerak', () => {
    const res = formatSom(2560000);
    assert.ok(res.replace(/\s+/g, ' ') === '2 560 000');
  });
});

describe('✂️ 3. RASKROY, ARRA VA OMBOR QOLDIG\'IDAN FOYDALANISH', () => {
  it('3.1 1D Cutting Stock arra qalinligini to\'g\'ri hisobga olishi kerak', () => {
    // 3 ta 190 sm lik kesim + 2 ta arra (0.3 sm) = 570 + 0.6 = 570.6 sm <= 600 sm (1 tayoq)
    const kesimlar = [{ sm: 190, dona: 3 }];
    const res = hisobla1DRaskroy(kesimlar, 600, [], 0.3);
    assert.equal(res.jamiTayoqSoni, 1);
    assert.equal(res.tayoqlar[0].aniqQoldiq, 29.4); // 600 - 570.6 = 29.4
  });

  it('3.2 Qoldiqlar omboridagi profil birinchi navbatda ishlatilishi kerak', () => {
    const kesimlar = [{ sm: 150, dona: 1 }];
    const omborQoldiqlari = [180]; // omborda 180 sm bor
    const res = hisobla1DRaskroy(kesimlar, 600, omborQoldiqlari, 0.3);
    assert.equal(res.jamiTayoqSoni, 1);
    assert.equal(res.tayoqlar[0].nom.includes('Qoldiq'), true);
    assert.equal(res.tayoqlar[0].boshlangichUzunlik, 180);
  });

  it('3.3 Guruhlangan raskroy profillarni alohida tayoqlarga ajratishi kerak', () => {
    const detallar = [
      { ramkaBoy: 140, ramkaEn: 70, soni: 1, tur: 'yonga', ruchka: 139.2, hasRuchka: true },
      { ramkaBoy: 200, ramkaEn: 90, soni: 1, tur: 'eshik', ruchka: 199.2, hasRuchka: true }
    ];
    const res = hisoblaGuruhlanganRaskroy(detallar, 600, {}, 0.3);
    assert.ok(res.guruhNatijalar.length >= 2);
    assert.ok(res.umumiySamaradorlik > 0);
  });
});

describe('💵 4. TANNARX (SEBESTOIMOST) HISOBLASH MUKAMMALLIGI', () => {
  it('4.1 Barcha 7 ta konstruksiya bo\'yicha sebestoimost hech qachon NaN bermasligi kerak', () => {
    const turlar = ['yonga', 'pastga', 'eshik', 'tayyor', 'evro', 'tayyor_evro', 'haytek'];
    const olchamlar = turlar.map((tur, i) => ({
      id: i + 1,
      eni: 75,
      boy: 160,
      soni: 2,
      tur
    }));

    const detallar = generatsiyaDetallar(olchamlar, DEFAULT_PROFIL_BRENDLARI[0]);
    const guruhlangan = hisoblaGuruhlanganRaskroy(detallar, 600, {}, 0.3);
    const seb = hisoblaSebestoimost(guruhlangan.guruhNatijalar, detallar, DEFAULT_TANNARX_STAVKALARI);

    assert.equal(isNaN(seb.jamiUsd), false, 'jamiUsd NaN bo\'lmasligi kerak');
    assert.equal(isNaN(seb.setkaUsd), false, 'setkaUsd NaN bo\'lmasligi kerak');
    assert.equal(isNaN(seb.profillarUsd), false, 'profillarUsd NaN bo\'lmasligi kerak');
    assert.equal(isNaN(seb.aksessuarUsd), false, 'aksessuarUsd NaN bo\'lmasligi kerak');

    assert.ok(seb.jamiUsd > 0);
    assert.ok(seb.setkaUsd > 0);
    assert.ok(seb.aksessuarUsd > 0);
    assert.ok(seb.profillarUsd > 0);

    // So'mda hisoblash
    const jamiSom = seb.jamiUsd * 12800;
    assert.equal(isNaN(jamiSom), false);
    assert.ok(jamiSom > 0);
  });
});

describe('📦 5. XOMASHYO SARFI (BOM) VA OMBOR HISOBI', () => {
  it('5.1 BOM: 2 ta rom va 1 ta eshik uchun xomashyoni to\'liq hisoblashi kerak', () => {
    const detallar = [
      { ramkaBoy: 140, ramkaEn: 70, soni: 2, hasRuchka: true, ruchka: 139.2, eni: 70, boy: 140, ip: 230 },
      { ramkaBoy: 200, ramkaEn: 90, soni: 1, hasRuchka: true, ruchka: 199.2, eni: 90, boy: 200, ip: 310 }
    ];

    const bom = hisoblaBOM(detallar);
    assert.equal(bom.jamiTorSoni, 3);
    assert.ok(bom.ramkaMetr > 0);
    assert.ok(bom.ramkaTayoq6m >= 1);
    assert.ok(bom.setkaM2 > 0);
    assert.ok(bom.shnurMetr > 0);
    assert.equal(bom.ugolnikSoni, 12); // 3 * 4 = 12
    assert.equal(bom.tutqichSoni, 3);
  });
});

describe('🏦 6. KASSA, QARZ DAFTARI VA MOLIYA MANTIQI', () => {
  const testStorageKey = 'test_moliya_unit';

  it('6.1 Kassa: Kirim va Chiqim amallari balansni to\'g\'ri o\'zgartirishi kerak', () => {
    const tr1 = tranzaksiyaQosh({ tur: 'kirim', summaSom: 500000, summaUsd: 40, izoh: 'Avans' }, testStorageKey);
    const tr2 = tranzaksiyaQosh({ tur: 'chiqim', summaSom: 200000, summaUsd: 15, izoh: 'Profil sotib olindi' }, testStorageKey);

    const balans = hisoblaKassaBalansi(testStorageKey);
    assert.equal(balans.sofBalansSom, 300000);
    assert.equal(balans.jamiKirimSom, 500000);
    assert.equal(balans.jamiChiqimSom, 200000);
  });

  it('6.2 Qarz daftari: "haqqim" va "qarzim"ni alohida saqlashi va yopishi kerak', () => {
    const q1 = qarzQosh({ tur: 'haqqim', shaxs: 'Alisher', summaSom: 400000, izoh: 'Oyna to\'r uchun' }, testStorageKey);
    const q2 = qarzQosh({ tur: 'qarzim', shaxs: 'Akfa Do\'kon', summaSom: 250000, izoh: 'Profil qarzi' }, testStorageKey);

    let stat = hisoblaQarzlarStatistikasi(testStorageKey);
    assert.equal(stat.jamiHaqqimSom, 400000);
    assert.equal(stat.jamiQarzimSom, 250000);

    // Qarzni yopish
    qarzYopish(q1.id, false, testStorageKey);
    stat = hisoblaQarzlarStatistikasi(testStorageKey);
    assert.equal(stat.jamiHaqqimSom, 0); // Yopilgan qarz statistikaga kirmaydi
    assert.equal(stat.jamiQarzimSom, 250000);
  });
});

describe('📱 7. TELEGRAM CHEKLARI VA HISOBOTLAR GENERATSIYASI', () => {
  it('7.1 generatsiyaIshchiXabari: Sex uchun o\'lchamlar va kesish rejasini o\'z ichiga olishi kerak', () => {
    const buyurtma = {
      id: 101,
      sana: '2026-10-20',
      mijozIsm: 'Bobur',
      rang: 'Mokko',
      muddat: 'Bugun',
      detallar: [{ boy: 140, eni: 70, soni: 1, turNom: 'Rom yonga', ramkaBoy: 140, ramkaEn: 72, hasRuchka: true, ruchka: 139.2, ip: 230, setkaBoy: 140, setkaEnDona: 1 }]
    };
    const kesish = {
      samaradorlikFoiz: 95,
      jamiIsrof: 20,
      tayoqlar: [{ nom: 'Profil #1', kesimlar: [140, 72, 72], aniqQoldiq: 316 }]
    };
    const matn = generatsiyaIshchiXabari(buyurtma, kesish, null);
    assert.ok(matn.includes('ISHLAB CHIQARISH VARAQASI'));
    assert.ok(matn.includes('Bobur'));
    assert.ok(matn.includes('Mokko'));
    assert.ok(matn.includes('140 × 70 sm'));
  });

  it('7.2 generatsiyaMijozCheki: Mijoz to\'lov chekida summa va to\'lov ko\'rsatilishi kerak', () => {
    const buyurtma = {
      id: 101,
      sana: '2026-10-20',
      mijozIsm: 'Bobur',
      mijozTel: '+998901234567',
      rang: 'Mokko',
      narxTuri: 'chakana',
      jamiSoni: 1,
      jamiM2: 0.98,
      jamiSom: 300000,
      oldindanTolanganSom: 100000,
      qoldiqSom: 200000,
      tolovHolati: 'qisman'
    };
    const chek = generatsiyaMijozCheki(buyurtma);
    assert.ok(chek.includes('TO\'LOV CHEKI'));
    assert.ok(chek.includes('Bobur'));
    assert.ok(chek.replace(/\s+/g, ' ').includes('300 000'));
  });

  it('7.3 generatsiyaKassaTelegramHisoboti: Balans va kirim/chiqim hisobotini shakllantirishi kerak', () => {
    const hisobot = generatsiyaKassaTelegramHisoboti('test_moliya_unit');
    assert.ok(hisobot.includes('KASSA HISOBOTI'));
    assert.ok(hisobot.includes('SOF BALANS'));
  });
});
