import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { hisoblaBOM } from '../web/js/inventory.js';
import { formatSom } from '../web/js/calculator.js';
import {
  DEFAULT_MOLIYA,
  getMoliya,
  saqlaMoliya,
  hisoblaKassaBalansi,
  hisoblaQarzlarStatistikasi,
  tranzaksiyaQosh,
  qarzQosh,
  qarzYopish,
  generatsiyaKassaTelegramHisoboti
} from '../web/js/finance.js';
import {
  generatsiyaIshchiXabari,
  generatsiyaMijozCheki
} from '../web/js/telegram.js';

// Node.js test muhitida localStorage simulyatsiyasi
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

describe('1. BOM (Bill of Materials) Xomashyo Sarfi Testlari', () => {
  it('Bitta rom uchun BOM sarfi to\'g\'ri hisoblanishi kerak', () => {
    // 140 sm bo'y, 62 sm en (2 ta bo'y, 2 ta en) = (280 + 124) = 404 sm = 4.04 metr
    const detallar = [{
      eni: 60,
      boy: 140,
      soni: 1,
      ramkaBoy: 140,
      ramkaEn: 62,
      ruchka: 139.2,
      ip: 220,
      hasRuchka: true
    }];

    const bom = hisoblaBOM(detallar);

    assert.equal(bom.jamiTorSoni, 1);
    assert.equal(bom.ramkaMetr, 4.04);
    assert.equal(bom.ramkaTayoq6m, 1); // 4.04 m uchun 1 ta 6m tayoq yetadi
    assert.equal(bom.ruchkaMetr, 1.39); // 139.2 sm ~ 1.39 m
    assert.equal(bom.ruchkaTayoq6m, 1);
    assert.equal(bom.setkaM2, 0.84); // 60x140 / 10000 = 0.84 m²
    assert.equal(bom.shnurMetr, 2.2); // 220 sm = 2.2 m
    assert.equal(bom.ugolnikSoni, 4); // 1 ta to'rga 4 ta burchak
    assert.equal(bom.tutqichSoni, 1);
  });
});

describe('2. Moliya: Kassa va Qarz Daftari Testlari', () => {
  const testKey = 'test_moliya';

  beforeEach(() => {
    mockStorage.clear();
    saqlaMoliya(JSON.parse(JSON.stringify(DEFAULT_MOLIYA)), testKey);
  });

  it('Boshlang\'ich kassa balansi 0 bo\'lishi kerak', () => {
    const bal = hisoblaKassaBalansi(testKey);
    assert.equal(bal.jamiKirimSom, 0);
    assert.equal(bal.jamiChiqimSom, 0);
    assert.equal(bal.sofBalansSom, 0);
  });

  it('Yangi tranzaksiya qo\'shilganda kassa balansi oshishi/kamayishi kerak', () => {
    tranzaksiyaQosh({
      tur: 'kirim',
      summaSom: 500000,
      summaUsd: 38.76,
      izoh: 'Test kirim'
    }, testKey);

    const bal1 = hisoblaKassaBalansi(testKey);
    assert.equal(bal1.jamiKirimSom, 500000);
    assert.equal(bal1.sofBalansSom, 500000);

    tranzaksiyaQosh({
      tur: 'chiqim',
      summaSom: 100000,
      summaUsd: 7.75,
      izoh: 'Usta oyligi'
    }, testKey);

    const bal2 = hisoblaKassaBalansi(testKey);
    assert.equal(bal2.jamiChiqimSom, 100000);
    assert.equal(bal2.sofBalansSom, 400000);
  });

  it('Boshlang\'ich qarz daftari statistikasi 0 bo\'lishi kerak', () => {
    const stat = hisoblaQarzlarStatistikasi(testKey);
    assert.equal(stat.jamiHaqqimSom, 0);
    assert.equal(stat.jamiQarzimSom, 0);
  });

  it('Qarz qo\'shish va qarzni yopish (status: yopildi) to\'g\'ri ishlashi kerak', () => {
    const yangiQarz = qarzQosh({
      tur: 'haqqim',
      shaxs: 'Bekzod',
      telefon: '998901112233',
      summaSom: 300000,
      summaUsd: 23.25,
      izoh: 'Rom to\'ri uchun nasiya'
    }, testKey);

    let stat = hisoblaQarzlarStatistikasi(testKey);
    assert.equal(stat.jamiHaqqimSom, 300000);

    // Qarzni yopamiz (kassaga kiritish bilan)
    qarzYopish(yangiQarz.id, true, testKey);
    stat = hisoblaQarzlarStatistikasi(testKey);
    assert.equal(stat.jamiHaqqimSom, 0); // 300000 yopildi
    const bal = hisoblaKassaBalansi(testKey);
    assert.equal(bal.jamiKirimSom, 300000);
  });

  it('generatsiyaKassaTelegramHisoboti to\'liq HTML hisobot matnini tuzishi kerak', () => {
    const hisobot = generatsiyaKassaTelegramHisoboti(testKey);
    assert.ok(hisobot.includes('KASSA HISOBOTI'));
    assert.ok(hisobot.includes('SOF BALANS'));
    assert.ok(hisobot.includes('Jami Kirim'));
    assert.ok(hisobot.includes('Jami Chiqim'));
  });
});

describe('3. Telegram Xabarlari Generatsiyasi Testlari', () => {
  const buyurtma = {
    id: '1048',
    sana: '19.10.2026',
    mijozIsm: 'Alisher aka',
    mijozTel: '+998 90 987 65 43',
    rang: 'OQ',
    narxTuri: 'chakana',
    jamiSoni: 2,
    jamiM2: 1.68,
    jamiUsd: 46.00,
    jamiSom: 593400,
    tolovHolati: 'Naqd',
    detallar: [{
      boy: 140,
      eni: 60,
      soni: 2,
      turNom: 'Rom yonga',
      ramkaBoy: 140,
      ramkaEn: 62,
      hasRuchka: true,
      ruchka: 139.2,
      ip: 220,
      setkaBoy: 142,
      setkaEnDona: 31
    }],
    qatorNatijalari: [{
      eni: 60,
      boy: 140,
      soni: 2,
      qatorM2: 1.68,
      qatorUsd: 46.00
    }]
  };

  const kesishNatijasi = {
    tayoqlar: [{
      nom: 'Yangi (600 sm)',
      kesimlar: [140, 140, 62, 62],
      aniqQoldiq: 195.1
    }],
    samaradorlikFoiz: 67,
    jamiIsrof: 195.1
  };

  const bom = {
    ramkaMetr: 8.08,
    ramkaTayoq6m: 2,
    setkaM2: 1.68,
    shnurMetr: 4.4,
    ugolnikSoni: 8,
    tutqichSoni: 2
  };

  it('generatsiyaIshchiXabari: Sex uchun barcha texnik detallarni o\'z ichiga olishi kerak', () => {
    const xabar = generatsiyaIshchiXabari(buyurtma, kesishNatijasi, bom);

    assert.ok(xabar.includes('ISHLAB CHIQARISH VARAQASI (SEX UCHUN)'));
    assert.ok(xabar.includes('#1048'));
    assert.ok(xabar.includes('KESISH REJASI'));
    assert.ok(xabar.includes('JAMI PROFIL SARFI'));
    assert.ok(!xabar.includes('KERAKLI XOMASHYO'));
    assert.ok(!xabar.includes('TANNARX'));
  });

  it('generatsiyaMijozCheki: Mijoz to\'lov chekida summa va kvadratura bo\'lishi kerak', () => {
    const chek = generatsiyaMijozCheki(buyurtma);

    assert.ok(chek.includes('«PRO HISOBCHI» TO\'LOV CHEKI'));
    assert.ok(chek.includes('#1048'));
    assert.ok(chek.includes(formatSom(buyurtma.jamiSom)));
    assert.ok(chek.includes('46 $') || chek.includes('46.00 $'));
    assert.ok(chek.includes('Naqd'));
  });
});
