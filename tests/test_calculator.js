import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  KONSTRUKSIYA_TURLARI,
  DEFAULT_PROFIL_BRENDLARI,
  hisoblaM2,
  formatSom,
  hisoblaBuyurtmaNarxi,
  generatsiyaDetallar
} from '../web/js/calculator.js';

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
