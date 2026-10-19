import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  STANDART_PROFIL_UZUNLIGI,
  ARRA_QALINLIGI,
  YAROQLI_QOLDIQ_CHEGARA,
  hisobla1DRaskroy,
  hisoblaGuruhlanganRaskroy
} from '../web/js/cutting.js';

describe('1. 1D Cutting Stock Algoritmi Testlari', () => {
  it('Standart parametrlar to\'g\'ri belgilangan bo\'lishi kerak', () => {
    assert.equal(STANDART_PROFIL_UZUNLIGI, 600);
    assert.equal(ARRA_QALINLIGI, 0.3);
    assert.equal(YAROQLI_QOLDIQ_CHEGARA, 100);
  });

  it('Bitta 600sm tayoqqa sig\'adigan kesimlar bitta tayoqda joylashishi kerak', () => {
    // 140 sm dan 2 ta va 60 sm dan 2 ta = 140 + 140 + 60 + 60 = 400 sm (+ 3 ta arra = 0.9 sm)
    const kesimlar = [
      { sm: 140, dona: 2 },
      { sm: 60, dona: 2 }
    ];

    const natija = hisobla1DRaskroy(kesimlar);
    assert.equal(natija.jamiTayoqSoni, 1);
    assert.equal(natija.yangiTayoqSoni, 1);
    assert.equal(natija.ishlatilganQoldiqSoni, 0);

    const tayoq = natija.tayoqlar[0];
    assert.equal(tayoq.kesimlar.length, 4);
    // 400 sm kesim + 3 ta arra (0.9 sm) = 400.9 sm sarflandi. Qoldiq: 600 - 400.9 = 199.1 sm
    assert.equal(tayoq.aniqQoldiq, 199.1);
    assert.ok(tayoq.aniqQoldiq >= YAROQLI_QOLDIQ_CHEGARA);
    // 100 sm dan katta qoldiq omborga yaroqli qoldiq sifatida kiritilishi kerak
    assert.equal(natija.yaroqliQoldiqlar.length, 1);
    assert.equal(natija.yaroqliQoldiqlar[0].uzunlik, 199.1);
  });

  it('600 sm dan ko\'p bo\'lsa, qo\'shimcha tayoqlar ochilishi kerak', () => {
    // 200 sm dan 4 ta = 800 sm. Kamida 2 ta 600 sm tayoq kerak (har biriga 2 tadan 200 sm)
    const kesimlar = [
      { sm: 200, dona: 4 }
    ];

    const natija = hisobla1DRaskroy(kesimlar);
    assert.equal(natija.jamiTayoqSoni, 2);
    assert.equal(natija.yangiTayoqSoni, 2);
  });

  it('Omborda mavjud qoldiq bo\'lsa, avval undan foydalanishi kerak', () => {
    const kesimlar = [
      { sm: 130, dona: 1 }
    ];
    // Omborda 150 sm lik qoldiq bor
    const mavjudQoldiqlar = [150];

    const natija = hisobla1DRaskroy(kesimlar, 600, mavjudQoldiqlar);
    assert.equal(natija.jamiTayoqSoni, 1);
    assert.equal(natija.ishlatilganQoldiqSoni, 1);
    assert.equal(natija.yangiTayoqSoni, 0); // Yangi tayoq ochilmadi!

    const tayoq = natija.tayoqlar[0];
    assert.equal(tayoq.isQoldiq, true);
    assert.equal(tayoq.aniqQoldiq, 20); // 150 - 130 = 20 sm
  });

  it('Bo\'sh kesimlar ro\'yxatida nol natija qaytarishi kerak', () => {
    const natija = hisobla1DRaskroy([]);
    assert.equal(natija.jamiTayoqSoni, 0);
    assert.equal(natija.samaradorlikFoiz, 100);
  });
});

describe('2. Guruhlangan Raskroy (Profil turlari bo\'yicha alohida kesish)', () => {
  it('Sexda profillar aralashmasdan, Rom va Eshik alohida tayoqlarga taqsimlanishi kerak', () => {
    const detallar = [
      {
        tur: 'yonga',
        soni: 2,
        ramkaBoy: 140,
        ramkaEn: 62,
        ruchka: 139.2,
        hasRuchka: true
      },
      {
        tur: 'eshik',
        soni: 1,
        ramkaBoy: 200,
        ramkaEn: 84,
        ruchka: 199.4,
        hasRuchka: true
      }
    ];

    const res = hisoblaGuruhlanganRaskroy(detallar);

    // Kutiladi:
    // 1) kichikRom guruhi (Rom ramkasi)
    // 2) kattaEshik guruhi (Eshik ramkasi)
    // 3) romRuchka guruhi
    // 4) kattaRuchka guruhi
    const guruhKalitlari = res.guruhNatijalar.map(g => g.key);

    assert.ok(guruhKalitlari.includes('kichikRom'));
    assert.ok(guruhKalitlari.includes('kattaEshik'));
    assert.ok(guruhKalitlari.includes('romRuchka'));
    assert.ok(guruhKalitlari.includes('kattaRuchka'));

    // Har bir guruhda kamida 1 tadan tayoq bo'lishi kerak
    res.guruhNatijalar.forEach(g => {
      assert.ok(g.natija.jamiTayoqSoni > 0);
      assert.ok(g.natija.samaradorlikFoiz > 0);
    });

    assert.ok(res.jamiTayoqlarBarcha >= 4);
    assert.ok(res.umumiySamaradorlik > 0 && res.umumiySamaradorlik <= 100);
  });

  it('Evro parog bo\'lganda A profil alohida guruhga ajralishi kerak', () => {
    const detallar = [
      {
        tur: 'evro',
        soni: 1,
        ramkaBoy: 198,
        ramkaEn: 84, // B profil
        aProfilEn: 84, // A profil
        ruchka: 198,
        hasRuchka: true
      }
    ];

    const res = hisoblaGuruhlanganRaskroy(detallar);
    const aProfilGuruh = res.guruhNatijalar.find(g => g.key === 'aProfil');
    assert.ok(aProfilGuruh, 'aProfil guruhi mavjud bo\'lishi kerak');
    assert.equal(aProfilGuruh.natija.jamiTayoqSoni, 1);
  });
});
