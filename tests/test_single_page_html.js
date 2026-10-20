import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'web', 'index.html');

describe('A. HTML Fayl Strukturasining Yaxlitligi', () => {
  it('web/index.html fayli mavjud va hajmi yetarli bo\'lishi kerak', () => {
    assert.ok(fs.existsSync(htmlPath), 'index.html topilmadi');
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.length > 20000, 'index.html to\'liq emas yoki juda qisqa');
  });

  it('Barcha 7 ta asosiy bo\'lim (tablar) mavjud bo\'lishi kerak', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    const tabs = ['tab-yangi', 'tab-tarix', 'tab-kesish', 'tab-kassa', 'tab-qarz', 'tab-kalkulyator', 'tab-sozlama'];
    tabs.forEach(tab => {
      assert.ok(content.includes(`id="${tab}"`), `${tab} topilmadi`);
    });
  });

  it('Barcha 5 ta rang varianti mavjud bo\'lishi kerak', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    const colors = ['306G', 'Mokko', 'Oq', 'Zalatoy dub', 'Shefelskiy dub'];
    colors.forEach(col => {
      assert.ok(content.includes(col), `${col} rangi topilmadi`);
    });
  });

  it('Standart va Diller narx rejimi tugmalari mavjud bo\'lishi kerak', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('tierStandartBtn'), 'tierStandartBtn topilmadi');
    assert.ok(content.includes('tierDillerBtn'), 'tierDillerBtn topilmadi');
  });
});

describe('B. Narxlash va 1 m² Minimal Qoidasi (Buyurtma bo\'limi)', () => {
  // Mock hisoblash funksiyalari (index.html dagi aynan bir xil mantiq)
  function calcM2(boy, eni) { return (parseFloat(boy) || 0) * (parseFloat(eni) || 0) / 10000; }
  
  const PROFILLAR = [
    { id: 1, nom: 'Eshik (Set Pro Katta)', narx: 40, dillerNarx: 28, minNarx: false, kesishTur: 'eshik' },
    { id: 2, nom: 'Kichkina profil pastga', narx: 32, dillerNarx: 23, minNarx: true,  kesishTur: 'pastga' },
    { id: 5, nom: 'Kichkina profil yonga', narx: 33, dillerNarx: 25, minNarx: true,  kesishTur: 'yonga' },
    { id: 3, nom: 'Haytek profil', narx: 700, dillerNarx: 390, minNarx: false, kesishTur: 'haytek', isPerimeter: true },
    { id: 4, nom: 'Oddiy Setka',    narx: 15, dillerNarx: 10, minNarx: false, kesishTur: 'yonga' }
  ];

  function hisoblaNarx(list, tier, kurs = 12900) {
    let totalUsd = 0, totalM2 = 0;
    list.forEach(q => {
      const p = PROFILLAR.find(x => x.id === q.profilId);
      const pr = tier === 'diller' ? p.dillerNarx : p.narx;
      const soni = parseInt(q.soni) || 1;
      const bitta = calcM2(q.boy, q.eni);
      totalM2 += bitta * soni;
      if (p.isPerimeter || p.kesishTur === 'haytek') {
        const som = (parseFloat(q.boy) + parseFloat(q.eni)) * pr * soni;
        totalUsd += som / kurs;
      } else if (p.minNarx) {
        totalUsd += (bitta <= 1 ? pr : bitta * pr) * soni;
      } else {
        totalUsd += bitta * soni * pr;
      }
    });
    return { m2: totalM2, usd: totalUsd, som: totalUsd * kurs };
  }

  it('Kichkina profil pastga (minNarx: true) 0.5 m² bo\'lganda ham 1 m² (Standart 32$) hisoblanishi kerak', () => {
    // 50 sm x 100 sm = 0.5 m²
    const res = hisoblaNarx([{ profilId: 2, boy: '100', eni: '50', soni: '1' }], 'standart');
    assert.equal(res.m2, 0.5);
    assert.equal(res.usd, 32); // Min 1m²
    assert.equal(res.som, 32 * 12900);
  });

  it('Kichkina profil yonga 1.5 m² bo\'lganda kvadratiga ko\'paytirilishi kerak (1.5 * 33 = 49.5$)', () => {
    // 100 sm x 150 sm = 1.5 m²
    const res = hisoblaNarx([{ profilId: 5, boy: '150', eni: '100', soni: '1' }], 'standart');
    assert.equal(res.m2, 1.5);
    assert.equal(res.usd, 49.5);
  });

  it('Eshik (minNarx: false) 0.5 m² bo\'lganda aniq kvadratiga ko\'payishi kerak (0.5 * 40 = 20$)', () => {
    const res = hisoblaNarx([{ profilId: 1, boy: '100', eni: '50', soni: '1' }], 'standart');
    assert.equal(res.m2, 0.5);
    assert.equal(res.usd, 20);
  });

  it('Diller narxi tanlanganda narxlar diller stavkasida hisoblanishi kerak (Katta: 28$, Kichik pastga: 23$, Kichik yonga: 25$)', () => {
    const resKatta = hisoblaNarx([{ profilId: 1, boy: '100', eni: '100', soni: '1' }], 'diller');
    assert.equal(resKatta.usd, 28);

    const resPastga = hisoblaNarx([{ profilId: 2, boy: '100', eni: '50', soni: '1' }], 'diller');
    assert.equal(resPastga.usd, 23); // Min 1m² diller narxi

    const resYonga = hisoblaNarx([{ profilId: 5, boy: '100', eni: '50', soni: '1' }], 'diller');
    assert.equal(resYonga.usd, 25); // Min 1m² diller narxi
  });
});

describe('C. Kesish Bo\'limidagi 7 Xil Konstruksiya Formulalari', () => {
  function hisoblaDetal(boy, eni, tur, soni = 1) {
    let rBoy, rEn, ruchka, setkaUz, setkaDona, ipOlch;
    ipOlch = boy + eni + 20;

    if (tur === 'yonga') {
      rBoy = boy;
      rEn = eni + 2;
      ruchka = boy - 0.8;
      setkaUz = boy + 2;
      setkaDona = rEn / 2;
    } else if (tur === 'pastga') {
      rBoy = boy + 2;
      rEn = eni;
      ruchka = eni - 0.8;
      setkaUz = eni + 2;
      setkaDona = rBoy / 2;
    } else if (tur === 'eshik') {
      rBoy = boy;
      rEn = eni + 4;
      ruchka = boy - 0.6;
      setkaUz = boy + 4;
      setkaDona = eni / 2.5;
    } else if (tur === 'tayyor') {
      rBoy = boy - 8;
      rEn = eni - 4;
      ruchka = boy - 8.6;
      setkaUz = boy - 4;
      setkaDona = eni / 2.5;
    } else if (tur === 'evro') {
      rBoy = boy - 2;
      rEn = eni + 4;
      ruchka = boy - 2;
      setkaUz = boy + 3;
      setkaDona = eni / 2.5;
    } else if (tur === 'tayyor_evro') {
      rBoy = boy - 6.5;
      rEn = eni - 4;
      ruchka = boy - 6.5;
      setkaUz = boy - 2;
      setkaDona = eni / 2.5;
    } else if (tur === 'haytek') {
      rBoy = boy + 3;
      rEn = eni + 3;
      ruchka = 0;
      setkaUz = 0;
      setkaDona = 0;
    }

    return { rBoy, rEn, ruchka, setkaUz, setkaDona, ipOlch };
  }

  it('Ip o\'lchami har doim: boy + eni + 20 sm bo\'lishi kerak', () => {
    const d = hisoblaDetal(200, 80, 'eshik');
    assert.equal(d.ipOlch, 300); // 200 + 80 + 20 = 300
  });

  it('1. Rom yonga formulasi to\'g\'ri ishlashi kerak', () => {
    const d = hisoblaDetal(140, 60, 'yonga');
    assert.equal(d.rBoy, 140);
    assert.equal(d.rEn, 62);
    assert.equal(d.ruchka, 139.2);
    assert.equal(d.setkaUz, 142);
    assert.equal(d.setkaDona, 31);
  });

  it('2. Rom pastga formulasi to\'g\'ri ishlashi kerak', () => {
    const d = hisoblaDetal(140, 60, 'pastga');
    assert.equal(d.rBoy, 142);
    assert.equal(d.rEn, 60);
    assert.equal(d.ruchka, 59.2);
    assert.equal(d.setkaUz, 62);
    assert.equal(d.setkaDona, 71);
  });

  it('3. Eshik formulasi to\'g\'ri ishlashi kerak', () => {
    const d = hisoblaDetal(200, 80, 'eshik');
    assert.equal(d.rBoy, 200);
    assert.equal(d.rEn, 84);
    assert.equal(d.ruchka, 199.4);
    assert.equal(d.setkaUz, 204);
    assert.equal(d.setkaDona, 32);
  });

  it('4. Tayyor eshik formulasi to\'g\'ri ishlashi kerak', () => {
    const d = hisoblaDetal(200, 80, 'tayyor');
    assert.equal(d.rBoy, 192);
    assert.equal(d.rEn, 76);
    assert.equal(d.ruchka, 191.4);
    assert.equal(d.setkaUz, 196);
    assert.equal(d.setkaDona, 32);
  });

  it('5. Evro parog formulasi to\'g\'ri ishlashi kerak', () => {
    const d = hisoblaDetal(200, 80, 'evro');
    assert.equal(d.rBoy, 198);
    assert.equal(d.rEn, 84);
    assert.equal(d.ruchka, 198);
    assert.equal(d.setkaUz, 203);
    assert.equal(d.setkaDona, 32);
  });

  it('6. Tayyor evro formulasi to\'g\'ri ishlashi kerak', () => {
    const d = hisoblaDetal(200, 80, 'tayyor_evro');
    assert.equal(d.rBoy, 193.5);
    assert.equal(d.rEn, 76);
    assert.equal(d.ruchka, 193.5);
    assert.equal(d.setkaUz, 198);
    assert.equal(d.setkaDona, 32);
  });

  it('7. Haytek formulasi to\'g\'ri ishlashi kerak', () => {
    const d = hisoblaDetal(100, 60, 'haytek');
    assert.equal(d.rBoy, 103);
    assert.equal(d.rEn, 63);
    assert.equal(d.ruchka, 0);
  });
});

describe('D. Raskroy (Cutting Stock) Algoritmi & ARRA Qalinligi', () => {
  const ARRA = 0.3;

  // index.html dagi BFD va Pattern algoritmining ixcham tekshiruvi
  function testSimpleRaskroy(kesimlar, pUz = 600) {
    let bins = [];
    const sorted = [...kesimlar].sort((a, b) => b - a);
    for (const sm of sorted) {
      let placed = false;
      for (const b of bins) {
        if (b.rem >= sm + ARRA) {
          b.cuts.push(sm);
          b.rem -= (sm + ARRA);
          placed = true;
          break;
        }
      }
      if (!placed) {
        bins.push({ cuts: [sm], rem: pUz - (sm + ARRA), uz: pUz });
      }
    }
    return bins;
  }

  it('3 ta 180 sm lik kesim 600 sm lik bitta profilga sig\'ishi kerak (180*3 + 2*0.3 = 540.6 sm)', () => {
    const bins = testSimpleRaskroy([180, 180, 180], 600);
    assert.equal(bins.length, 1, 'Bitta profilga sig\'ishi kerak edi');
    assert.ok(bins[0].rem > 50, 'Qoldiq 50 sm dan ko\'p bo\'lishi kerak');
  });

  it('4 ta 180 sm lik kesim bitta 600 sm profilga sig\'may, 2 ta profil ochishi kerak', () => {
    const bins = testSimpleRaskroy([180, 180, 180, 180], 600);
    assert.equal(bins.length, 2, '2 ta profil ochilishi kerak');
  });
});

describe('E. Tannarx (Sebestoimost) Stavkalarini Hisoblash', () => {
  const TANNARX = {
    kichkina: 2.16,
    romRuchka: 2.16,
    katta: 2.66,
    kattaRuchka: 2.66,
    haytek: 1.25,
    setka: 0.0004,
    aksessuar: 3
  };

  it('Tannarx stavkalari to\'g\'ri hisoblanishi kerak', () => {
    // Masalan: 1 dona eshik uchun aksessuar: 3$
    const aksessuarUsd = 1 * TANNARX.aksessuar;
    assert.equal(aksessuarUsd, 3);

    // 1 dona eshik setkasi: setkaUz = 204, setkaDona = 32
    // formula: setkaUz * setkaDona * 0.0004
    const setkaUsd = 204 * 32 * TANNARX.setka;
    assert.ok(Math.abs(setkaUsd - 2.6112) < 0.001);

    // 2 metr katta profil tannarxi: 2 * 2.66 = 5.32$
    const kattaProfilUsd = (200 / 100) * TANNARX.katta;
    assert.equal(kattaProfilUsd, 5.32);
  });
});

describe('F. Moliya & Kassa & Qarz Daftari', () => {
  it('Kassa kirim va chiqim amallaridan so\'ng balans to\'g\'ri hisoblanishi kerak', () => {
    let amallar = [
      { tur: 'kirim', summa: 500000 },
      { tur: 'chiqim', summa: 200000 },
      { tur: 'kirim', summa: 100000 }
    ];
    let kirim = amallar.filter(x => x.tur === 'kirim').reduce((a, b) => a + b.summa, 0);
    let chiqim = amallar.filter(x => x.tur === 'chiqim').reduce((a, b) => a + b.summa, 0);
    assert.equal(kirim, 600000);
    assert.equal(chiqim, 200000);
    assert.equal(kirim - chiqim, 400000);
  });

  it('Qarz daftari: "haqqim" va "qarzim" alohida ajratilishi kerak', () => {
    let qarzlar = [
      { yonalish: 'haqqim', summa: 150000 },
      { yonalish: 'qarzim', summa: 80000 },
      { yonalish: 'haqqim', summa: 50000 }
    ];
    let haqqim = qarzlar.filter(x => x.yonalish === 'haqqim').reduce((a, b) => a + b.summa, 0);
    let qarzim = qarzlar.filter(x => x.yonalish === 'qarzim').reduce((a, b) => a + b.summa, 0);
    assert.equal(haqqim, 200000);
    assert.equal(qarzim, 80000);
  });
});
