/**
 * Pro Hisobchi - app.js
 * Multi-Brend, Mini CRM, CSV Eksport, Kassa Telegram Hisoboti va Barcha Funksiyalar
 */

import {
  KONSTRUKSIYA_TURLARI,
  DEFAULT_PROFIL_BRENDLARI,
  getProfilBrendlari,
  saqlaProfilBrendlari,
  hisoblaM2,
  formatSom,
  hisoblaBuyurtmaNarxi,
  generatsiyaDetallar,
  DEFAULT_TANNARX_STAVKALARI,
  getTannarxStavkalari,
  saqlaTannarxStavkalari,
  hisoblaSebestoimost
} from './calculator.js';

import {
  STANDART_PROFIL_UZUNLIGI,
  ARRA_QALINLIGI,
  YAROQLI_QOLDIQ_CHEGARA,
  hisoblaGuruhlanganRaskroy
} from './cutting.js';

import {
  getOmbor,
  saqlaOmbor,
  hisoblaBOM,
  qoldiqQoshOmborga,
  qoldiqOchirOmbordan
} from './inventory.js';

import {
  getMoliya,
  saqlaMoliya,
  hisoblaKassaBalansi,
  hisoblaQarzlarStatistikasi,
  tranzaksiyaQosh,
  qarzQosh,
  qarzYopish,
  generatsiyaKassaTelegramHisoboti,
  eksportKassaCSV,
  eksportQarzCSV,
  eksportCSV
} from './finance.js';

import {
  DEFAULT_TELEGRAM_CONFIG,
  getTelegramConfig,
  saqlaTelegramConfig,
  generatsiyaIshchiXabari,
  generatsiyaMijozCheki,
  klipbordgaNusxala,
  buyurtmaniGuruhgaYubor,
  kassaHisobotiniGuruhgaYubor
} from './telegram.js';

// ==========================================================================
// BAZAVIY HOLAT (STATE) & SAAS MULTI-TENANCY
// ==========================================================================

export const BUYURTMA_KATEGORIYALARI = [
  { id: 'yonga', nom: 'Rom yonga', belgi: '➡️', profilId: 5 },
  { id: 'pastga', nom: 'Rom pastga', belgi: '⬇️', profilId: 2 },
  { id: 'eshik', nom: 'Eshik', belgi: '🚪', profilId: 1 },
  { id: 'haytek', nom: 'Haytek', belgi: '⚡', profilId: 3 }
];

export const DEFAULT_PROFILLAR = [
  { id: 5, nom: 'Rom yonga', chakanaNarx: 25, dilerNarx: 25, narx: 25, dillerNarx: 25, minNarx: true, tur: 'kichik', kesishTur: 'yonga' },
  { id: 2, nom: 'Rom pastga', chakanaNarx: 23, dilerNarx: 23, narx: 23, dillerNarx: 23, minNarx: true, tur: 'kichik', kesishTur: 'pastga' },
  { id: 1, nom: 'Eshik', chakanaNarx: 28, dilerNarx: 28, narx: 28, dillerNarx: 28, minNarx: false, tur: 'katta', kesishTur: 'eshik' },
  { id: 3, nom: 'Haytek', chakanaNarx: 700, dilerNarx: 390, narx: 700, dillerNarx: 390, minNarx: false, tur: 'haytek', kesishTur: 'haytek', isPerimeter: true }
];

export function getSyncedProfillar(storagePrefix) {
  const version = '2026_rates_v5';
  if (typeof localStorage === 'undefined') return DEFAULT_PROFILLAR;
  const savedVer = localStorage.getItem('prohisobchi_profillar_ver');
  if (savedVer !== version) {
    localStorage.setItem('prohisobchi_profillar_ver', version);
    localStorage.setItem(storagePrefix + 'profillar', JSON.stringify(DEFAULT_PROFILLAR));
    localStorage.setItem('prohisobchi_profillar', JSON.stringify(DEFAULT_PROFILLAR));
    return DEFAULT_PROFILLAR;
  }
  try {
    const saved = localStorage.getItem(storagePrefix + 'profillar') || localStorage.getItem('prohisobchi_profillar');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILLAR;
  } catch (e) {
    return DEFAULT_PROFILLAR;
  }
}

// Telegram foydalanuvchi ID si orqali ko'p foydalanuvchili xotira
const telegramUserId = (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) || 'default';
const storagePrefix = `prohisobchi_${telegramUserId}_`;

let state = {
  kurs: (typeof localStorage !== 'undefined' && parseFloat(localStorage.getItem('prohisobchi_kurs'))) || 12900,
  currentScreen: 'home',
  theme: (typeof localStorage !== 'undefined' && localStorage.getItem('prohisobchi_theme')) || 'light',
  profillar: getSyncedProfillar(storagePrefix),
  brendlar: getProfilBrendlari(),
  selectedBrendId: 'standart',
  buyurtmalar: (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem(storagePrefix + 'buyurtmalar'))) || [],
  orderRows: [
    { id: 1, profilId: 5, eni: '', boy: '', soni: 1, tur: 'yonga' }
  ],
  cuttingRows: [],
  cuttingSelectedBrendId: 'standart',
  orderNarxTuri: 'diler',
  orderTolovTuri: 'Naqd',
  nextRowId: 2,
  qc: {
    profilTur: 'pastga',
    narxTuri: 'diler',
    eni: '',
    boy: '',
    soni: 1
  },
  lastCuttingResult: null,
  activeModalOrder: null,
  kassaModalType: 'kirim',
  qarzModalType: 'haqqim',
  tannarxStavkalari: getTannarxStavkalari(),
  qoldiqlar: (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('prohisobchi_qoldiqlar'))) || {
    kichkina: [],
    katta: [],
    romRuchka: [],
    kattaRuchka: [],
    haytek: []
  },
  saqlanganOlchamlar: (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('saqlangan_olchamlar'))) || []
};

// ==========================================================================
// TOAST & THEME
// ==========================================================================

export function showToast(message, icon = '✅') {
  const toast = document.getElementById('appToast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast) return;

  toastIcon.textContent = icon;
  toastMsg.textContent = message;
  toast.classList.add('show');

  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('prohisobchi_theme', state.theme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  showToast(state.theme === 'dark' ? 'Tungi rejim yoqildi' : 'Kunduzgi rejim yoqildi', '🌓');
}

// ==========================================================================
// EKRANLARNI ALMASHTIRISH (ROUTING)
// ==========================================================================

function navigateToScreen(screenId) {
  state.currentScreen = screenId;

  document.querySelectorAll('.view-screen').forEach(el => {
    el.classList.toggle('active', el.id === `screen-${screenId}`);
  });

  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === screenId);
  });

  if (screenId === 'yangi') {
    renderOrderRows();
    updateCrmDatalist();
  }
  if (screenId === 'tarix') renderOrdersHistory();
  if (screenId === 'kesish') renderCuttingScreen();
  if (screenId === 'kassa') renderKassaScreen();
  if (screenId === 'qarz') renderQarzScreen();
  if (screenId === 'kalkulyator') updateQuickCalc();
  if (screenId === 'ombor') renderOmborScreen();
  if (screenId === 'sozlamalar') renderSozlamalarScreen();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// MINI CRM: MIJOZLAR BAZASI VA AVTOTOLDIRISH
// ==========================================================================

function updateCrmDatalist() {
  const datalist = document.getElementById('crmMijozlarList');
  if (!datalist) return;

  const mijozlarMap = new Map();
  state.buyurtmalar.forEach(b => {
    if (b.mijozIsm && !mijozlarMap.has(b.mijozIsm)) {
      mijozlarMap.set(b.mijozIsm, b.mijozTel || '');
    }
  });

  datalist.innerHTML = '';
  mijozlarMap.forEach((tel, ism) => {
    const opt = document.createElement('option');
    opt.value = ism;
    opt.label = tel ? `${ism} (${tel})` : ism;
    datalist.appendChild(opt);
  });
}

function checkClientCrm(clientName) {
  const badge = document.getElementById('orderCrmInfoBadge');
  const nameEl = document.getElementById('crmClientName');
  const statsEl = document.getElementById('crmClientStats');
  const telInput = document.getElementById('orderMijozTel');

  if (!clientName || clientName.trim().length < 2) {
    if (badge) badge.style.display = 'none';
    return;
  }

  const clientOrders = state.buyurtmalar.filter(b => b.mijozIsm && b.mijozIsm.toLowerCase() === clientName.toLowerCase().trim());
  const moliya = getMoliya();
  const clientDebts = moliya.qarzDaftari.filter(q => q.status === 'ochiq' && q.shaxs && q.shaxs.toLowerCase().includes(clientName.toLowerCase().trim()));

  if (clientOrders.length > 0 || clientDebts.length > 0) {
    nameEl.textContent = clientName;
    if (clientOrders.length > 0 && !telInput.value && clientOrders[0].mijozTel) {
      telInput.value = clientOrders[0].mijozTel;
    }

    let debtText = '';
    const jamiQarz = clientDebts.reduce((sum, q) => sum + (q.tur === 'haqqim' ? q.summaSom : -q.summaSom), 0);
    if (jamiQarz > 0) {
      debtText = ` • Haqqimiz: ${formatSom(jamiQarz)} so'm`;
    } else if (jamiQarz < 0) {
      debtText = ` • Qarzimiz: ${formatSom(Math.abs(jamiQarz))} so'm`;
    }

    statsEl.textContent = `${clientOrders.length} ta oldingi buyurtma${debtText}`;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ==========================================================================
// 1. YANGI BUYURTMA EKRANI LOGIKASI
// ==========================================================================

function renderOrderRows() {
  const container = document.getElementById('orderItemsContainer');
  if (!container) return;

  container.innerHTML = '';
  document.getElementById('orderTotalRowsCount').textContent = `${state.orderRows.length} ta to'r`;

  state.orderRows.forEach((row, idx) => {
    const box = document.createElement('div');
    box.className = 'order-row-box';

    box.innerHTML = `
      <div class="order-row-top">
        <span style="font-size:12px; font-weight:800; color:var(--text-primary);">${idx + 1}-to'r o'lchamlari</span>
        ${state.orderRows.length > 1 ? `<button class="del-row-btn" data-id="${row.id}" style="background:#FEE8E8;color:#EF4444;border:none;border-radius:6px;width:24px;height:24px;font-weight:700;cursor:pointer;">✕</button>` : ''}
      </div>

      <!-- Faqat 4 ta kategoriya (knopka) -->
      <div class="konstruksiya-chips-flow">
        ${BUYURTMA_KATEGORIYALARI.map(k => `
          <button type="button" class="konstruksiya-chip-btn ${row.tur === k.id ? 'active' : ''}" data-rowid="${row.id}" data-tur="${k.id}">
            <span>${k.belgi}</span> <span>${k.nom}</span>
          </button>
        `).join('')}
      </div>

      <!-- 3 ta input: Eni, Bo'yi, Soni -->
      <div class="order-row-nums">
        <div>
          <label style="font-size:9px;font-weight:700;color:var(--text-muted);display:block;text-align:center;">ENI (sm)</label>
          <input type="number" step="0.1" class="inp-eni" data-id="${row.id}" value="${row.eni}" placeholder="0">
        </div>
        <div>
          <label style="font-size:9px;font-weight:700;color:var(--text-muted);display:block;text-align:center;">BO'YI (sm)</label>
          <input type="number" step="0.1" class="inp-boy" data-id="${row.id}" value="${row.boy}" placeholder="0">
        </div>
        <div>
          <label style="font-size:9px;font-weight:700;color:var(--text-muted);display:block;text-align:center;">SONI</label>
          <input type="number" min="1" class="inp-soni" data-id="${row.id}" value="${row.soni || 1}">
        </div>
      </div>
    `;

    box.querySelectorAll('.konstruksiya-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        row.tur = btn.dataset.tur;
        if (row.tur === 'pastga') row.profilId = 2;
        else if (row.tur === 'yonga') row.profilId = 5;
        else if (row.tur === 'eshik') row.profilId = 1;
        else if (row.tur === 'haytek') row.profilId = 3;
        renderOrderRows();
        updateOrderSummary();
      });
    });

    box.querySelector('.inp-eni')?.addEventListener('input', (e) => {
      row.eni = e.target.value;
      updateOrderSummary();
    });

    box.querySelector('.inp-boy')?.addEventListener('input', (e) => {
      row.boy = e.target.value;
      updateOrderSummary();
    });

    box.querySelector('.inp-soni')?.addEventListener('input', (e) => {
      row.soni = parseInt(e.target.value) || 1;
      updateOrderSummary();
    });

    box.querySelector('.del-row-btn')?.addEventListener('click', () => {
      state.orderRows = state.orderRows.filter(r => r.id !== row.id);
      renderOrderRows();
      updateOrderSummary();
    });

    container.appendChild(box);
  });

  updateOrderSummary();
}

function updateOrderSummary() {
  const calc = hisoblaBuyurtmaNarxi(state.orderRows, state.profillar, state.kurs, state.orderNarxTuri, true);

  document.getElementById('orderSummaryM2').textContent = `${calc.jamiM2} m²`;
  document.getElementById('orderSummaryUsd').textContent = `${calc.jamiUsd} $`;
  document.getElementById('orderSummarySom').textContent = `${formatSom(calc.jamiSom)} so'm`;
}

function saveCurrentOrder() {
  const ism = document.getElementById('orderMijozIsm')?.value.trim();
  const tel = document.getElementById('orderMijozTel')?.value.trim();
  const rang = document.getElementById('orderRangSelect')?.value || 'OQ';
  const brendId = document.getElementById('orderBrendSelect')?.value || 'standart';
  const muddat = document.getElementById('orderMuddat')?.value || 'Bugun';

  const validRows = state.orderRows.filter(r => parseFloat(r.eni) > 0 && parseFloat(r.boy) > 0);
  if (validRows.length === 0) {
    alert('Iltimos, o\'lchamlarni to\'liq kiriting!');
    return;
  }

  const formattedRows = validRows.map(r => {
    let mosTur = 'pastga';
    if (r.tur === 'pastga' || r.profilId === 2) mosTur = 'pastga';
    else if (r.tur === 'yonga' || r.profilId === 5) mosTur = 'yonga';
    else if (r.tur === 'eshik' || r.profilId === 1 || ['eshik', 'tayyor', 'evro', 'tayyor_evro'].includes(r.tur)) mosTur = 'eshik';
    else if (r.tur === 'haytek' || r.profilId === 3) mosTur = 'haytek';
    else mosTur = r.tur || 'pastga';
    return { ...r, tur: mosTur };
  });

  const tanlanganBrend = state.brendlar.find(b => b.id === brendId) || state.brendlar[0];
  const calc = hisoblaBuyurtmaNarxi(formattedRows, state.profillar, state.kurs, state.orderNarxTuri, true);
  const detallar = generatsiyaDetallar(formattedRows, tanlanganBrend);
  const bom = hisoblaBOM(detallar);

  const newOrder = {
    id: Date.now().toString().slice(-4),
    sana: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    mijozIsm: ism || 'Mijoz',
    mijozTel: tel || '',
    rang,
    brendId,
    brendNom: tanlanganBrend.nom,
    muddat,
    status: 'Kutilmoqda',
    jamiSoni: calc.jamiSoni,
    jamiM2: calc.jamiM2,
    jamiUsd: calc.jamiUsd,
    jamiSom: calc.jamiSom,
    tolovHolati: state.orderTolovTuri,
    qatorlar: formattedRows,
    detallar,
    bom
  };

  state.buyurtmalar.unshift(newOrder);
  localStorage.setItem(storagePrefix + 'buyurtmalar', JSON.stringify(state.buyurtmalar));
  syncTenantDataToCloud('buyurtmalar', state.buyurtmalar);

  // Avtomatik ravishda Kesish -> Saqlangan o'lchamlar ga mos turi bilan qo'shish
  try {
    const sList = JSON.parse(localStorage.getItem('saqlangan_olchamlar')) || [];
    sList.unshift({
      id: Date.now(),
      nom: `${newOrder.mijozIsm} (#${newOrder.id}) — ${newOrder.rang}`,
      mijozIsm: newOrder.mijozIsm,
      izoh: `Buyurtma #${newOrder.id}`,
      rang: newOrder.rang,
      vaqt: new Date().toLocaleString('ru-RU'),
      olchamlar: formattedRows.map(r => ({
        id: Date.now() + Math.random(),
        boy: r.boy,
        eni: r.eni,
        soni: r.soni || 1,
        tur: r.tur // Rom pastga -> pastga, Rom yonga -> yonga, Eshik -> eshik, Haytek -> haytek
      }))
    });
    localStorage.setItem('saqlangan_olchamlar', JSON.stringify(sList));
    state.saqlanganOlchamlar = sList;
  } catch (e) {
    console.warn('Saqlangan olchamlar xatosi:', e);
  }

  if (state.orderTolovTuri === 'Naqd' || state.orderTolovTuri === 'Karta') {
    tranzaksiyaQosh({
      tur: 'kirim',
      summaSom: newOrder.jamiSom,
      summaUsd: newOrder.jamiUsd,
      izoh: `Buyurtma #${newOrder.id} (${newOrder.mijozIsm})`,
      toifa: 'buyurtma'
    });
  } else if (state.orderTolovTuri === 'Nasiya') {
    qarzQosh({
      tur: 'haqqim',
      shaxs: newOrder.mijozIsm,
      telefon: newOrder.mijozTel,
      summaSom: newOrder.jamiSom,
      summaUsd: newOrder.jamiUsd,
      izoh: `Buyurtma #${newOrder.id} nasiyasi`
    });
  }

  try {
    buyurtmaniGuruhgaYubor(newOrder, null, bom);
  } catch (e) {
    console.warn('Telegram yuborish:', e);
  }

  showToast('Buyurtma saqlandi va guruhga yuborildi!', '✅');

  state.orderRows = [{ id: state.nextRowId++, profilId: 1, eni: '', boy: '', soni: 1, tur: 'yonga' }];
  document.getElementById('orderMijozIsm').value = '';
  document.getElementById('orderMijozTel').value = '';
  navigateToScreen('tarix');
}

// ==========================================================================
// 2. BUYURTMALAR TARIXI VA CHEK MODALI
// ==========================================================================

function openOrderDetailModal(order) {
  state.activeModalOrder = order;
  const overlay = document.getElementById('modalOrderOverlay');
  const body = document.getElementById('modalOrderBody');
  const title = document.getElementById('modalOrderTitle');

  if (!overlay || !body) return;

  title.textContent = `🧾 Buyurtma #${order.id} — ${order.mijozIsm}`;

  let rowsHtml = '';
  if (order.qatorlar) {
    order.qatorlar.forEach((q, i) => {
      const m2 = hisoblaM2(q.eni, q.boy) * (q.soni || 1);
      const turNom = KONSTRUKSIYA_TURLARI[q.tur]?.nom || q.tur;
      rowsHtml += `
        <div style="padding:6px 0; border-bottom:1px dashed var(--border-card); font-size:12px; display:flex; justify-content:space-between;">
          <div>
            <b>${i + 1}) ${q.eni} × ${q.boy} sm</b> (${q.soni} dona)
            <div style="color:var(--text-muted); font-size:11px;">${turNom}</div>
          </div>
          <div style="text-align:right; font-family:var(--font-mono);">
            <b>${m2.toFixed(3)} m²</b>
          </div>
        </div>
      `;
    });
  }

  body.innerHTML = `
    <div style="background:var(--bg-input); padding:10px 12px; border-radius:10px; margin-bottom:10px; font-size:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span style="color:var(--text-muted);">Mijoz:</span>
        <b>${order.mijozIsm}</b>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span style="color:var(--text-muted);">Telefon:</span>
        <b>${order.mijozTel || '-'}</b>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span style="color:var(--text-muted);">Brend & Rangi:</span>
        <b>${order.brendNom || 'Standart'} (${order.rang})</b>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span style="color:var(--text-muted);">Holati / To'lov:</span>
        <span class="order-status-badge ${order.status.toLowerCase()}">${order.status}</span>
      </div>
    </div>

    <!-- Narxni tahrirlash inputi -->
    <div style="background:var(--bg-input); padding:8px 12px; border-radius:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:12px; font-weight:700;">Narxni tahrirlash ($):</span>
      <div style="display:flex; gap:6px; align-items:center;">
        <input type="number" step="0.5" id="detailOrderPriceInput" value="${order.jamiUsd}" style="width:75px; padding:5px 8px; border-radius:8px; border:1px solid var(--border-card); font-weight:800; font-family:var(--font-mono); text-align:center; font-size:13px;">
        <button type="button" id="btnSaveDetailOrderPrice" class="btn-solid-green" style="padding:6px 12px; font-size:11px;">Saqlash</button>
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <span style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">O'LCHAMLAR:</span>
      ${rowsHtml}
    </div>

    <div style="background:#E6FBF2; border:1px solid #10B981; border-radius:10px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:11px; color:#059669; font-weight:700;">JAMI SUMMA:</div>
        <div style="font-size:18px; font-weight:800; font-family:var(--font-mono); color:#062419;">${formatSom(order.jamiSom)} so'm</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:15px; font-weight:800; font-family:var(--font-mono); color:#059669;">${order.jamiUsd} $</div>
        <div style="font-size:11px; color:#64748B;">${order.jamiM2} m² (${order.jamiSoni} dona)</div>
      </div>
    </div>

    <!-- Terminal preview chek -->
    <div style="margin-bottom:10px;">
      <span style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:4px;">CHEK MATNI:</span>
      <pre class="preview-box">${generatsiyaIshchiXabari(order, null, order.bom, state.kurs)}</pre>
    </div>

    <!-- Buyurtma holatini o'zgartirish chiplari -->
    <div style="margin-bottom:8px;">
      <span style="font-size:11px; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px;">BUYURTMA HOLATI:</span>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
        <button type="button" class="btn-change-status" data-st="Kutilmoqda" style="padding:7px 4px; font-size:11px; font-weight:700; border-radius:8px; border:1.5px solid #F59E0B; background:${order.status === 'Kutilmoqda' ? '#FEF3C7' : 'transparent'}; color:#D97706; cursor:pointer;">⏳ Kutilmoqda</button>
        <button type="button" class="btn-change-status" data-st="Jarayonda" style="padding:7px 4px; font-size:11px; font-weight:700; border-radius:8px; border:1.5px solid #3B82F6; background:${order.status === 'Jarayonda' ? '#EFF6FF' : 'transparent'}; color:#2563EB; cursor:pointer;">⚙️ Jarayonda</button>
        <button type="button" class="btn-change-status" data-st="Tayyor" style="padding:7px 4px; font-size:11px; font-weight:700; border-radius:8px; border:1.5px solid #10B981; background:${order.status === 'Tayyor' ? '#D1FAE5' : 'transparent'}; color:#059669; cursor:pointer;">✅ Tayyor</button>
      </div>
    </div>

    <!-- O'chirish tugmasi -->
    <div style="text-align:center; margin-top:8px;">
      <button type="button" id="btnDeleteDetailOrder" style="background:transparent; border:none; color:#EF4444; font-size:12px; font-weight:700; cursor:pointer; padding:6px 12px;">
        🗑 Ushbu buyurtmani o'chirish
      </button>
    </div>
  `;

  // Narxni saqlash hodisasi
  body.querySelector('#btnSaveDetailOrderPrice')?.addEventListener('click', () => {
    const val = parseFloat(body.querySelector('#detailOrderPriceInput')?.value);
    if (!isNaN(val) && val >= 0) {
      order.jamiUsd = val;
      order.jamiSom = Math.round(val * state.kurs);
      localStorage.setItem(storagePrefix + 'buyurtmalar', JSON.stringify(state.buyurtmalar));
      openOrderDetailModal(order);
      renderOrdersHistory();
      showToast('Buyurtma narxi yangilandi!', '💰');
    }
  });

  // Statusni o'zgartirish hodisalari
  body.querySelectorAll('.btn-change-status').forEach(btn => {
    btn.addEventListener('click', () => {
      order.status = btn.dataset.st;
      localStorage.setItem(storagePrefix + 'buyurtmalar', JSON.stringify(state.buyurtmalar));
      openOrderDetailModal(order);
      renderOrdersHistory();
      showToast(`Buyurtma holati: ${order.status}`, '🔄');
    });
  });

  // O'chirish hodisasi
  body.querySelector('#btnDeleteDetailOrder')?.addEventListener('click', () => {
    if (confirm(`Haqiqatan ham #${order.id} raqamli buyurtmani o'chirmoqchimisiz?`)) {
      state.buyurtmalar = state.buyurtmalar.filter(b => b.id !== order.id);
      localStorage.setItem(storagePrefix + 'buyurtmalar', JSON.stringify(state.buyurtmalar));
      overlay.classList.remove('active');
      renderOrdersHistory();
      showToast('Buyurtma o\'chirildi!', '🗑');
    }
  });

  overlay.classList.add('active');
}

function renderOrdersHistory() {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  const searchVal = document.getElementById('orderSearchInput')?.value.toLowerCase() || '';
  const filterBtn = document.querySelector('.filter-chips-row .filter-chip.active');
  const activeStatus = filterBtn ? filterBtn.dataset.status : 'hammasi';

  document.getElementById('countAllOrders').textContent = state.buyurtmalar.length;

  const filtered = state.buyurtmalar.filter(b => {
    const matchSearch = (b.mijozIsm && b.mijozIsm.toLowerCase().includes(searchVal)) ||
                        (b.mijozTel && b.mijozTel.includes(searchVal));
    const matchStatus = activeStatus === 'hammasi' || b.status === activeStatus;
    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">Buyurtmalar topilmadi.</div>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-history-card';
    card.innerHTML = `
      <div class="order-history-header">
        <div>
          <span style="font-weight:800;font-size:14px;color:var(--text-primary);">#${order.id} ${order.mijozIsm}</span>
          <span class="order-history-meta" style="margin-left:6px;">(${order.rang})</span>
        </div>
        <span class="order-status-badge ${order.status.toLowerCase()}">${order.status}</span>
      </div>

      <div style="font-size:12px;color:var(--text-secondary);margin:4px 0;">
        📞 ${order.mijozTel || 'Tel ko\'rsatilmadi'} • ⏰ ${order.sana} • Brend: <b>${order.brendNom || 'Standart'}</b>
      </div>

      <div style="font-size:12px;color:var(--text-secondary);">
        📐 ${order.jamiSoni} dona • ${order.jamiM2} m² • To'lov: <b>${order.tolovHolati || 'Kutilmoqda'}</b>
      </div>

      <div class="order-history-footer">
        <div>
          <div class="order-history-price">${formatSom(order.jamiSom)} so'm</div>
          <span style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">${order.jamiUsd} $</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn-outline-pill btn-view-order" data-id="${order.id}" style="padding:6px 10px;">👁 Ko'rish</button>
          <button class="btn-outline-pill btn-cut-order" data-id="${order.id}" style="padding:6px 10px;background:var(--brand-dark);color:#FFFFFF;border:none;">✂️ Kesish</button>
        </div>
      </div>
    `;

    card.querySelector('.btn-view-order').addEventListener('click', () => {
      openOrderDetailModal(order);
    });

    card.querySelector('.btn-cut-order').addEventListener('click', () => {
      state.cuttingRows = JSON.parse(JSON.stringify(order.qatorlar));
      state.cuttingSelectedBrendId = order.brendId || 'standart';
      navigateToScreen('kesish');
      renderCuttingScreen();
    });

    container.appendChild(card);
  });
}

// ==========================================================================
// 3. GURUHLANGAN 1D RASKROY (KESISH REJASI) LOGIKASI
// ==========================================================================

function renderCuttingOrderRows() {
  const container = document.getElementById('cuttingOrderItemsContainer');
  if (!container) return;

  container.innerHTML = '';
  if (!state.cuttingRows || state.cuttingRows.length === 0) {
    state.cuttingRows = [
      { id: Date.now(), profilId: 1, eni: '', boy: '', soni: 1, tur: 'yonga' }
    ];
  }

  state.cuttingRows.forEach((row, idx) => {
    const box = document.createElement('div');
    box.className = 'order-row-box';

    box.innerHTML = `
      <div class="order-row-top">
        <span style="font-size:12px; font-weight:800; color:var(--text-primary);">${idx + 1}-o'lcham (Kesish)</span>
        ${state.cuttingRows.length > 1 ? `<button class="del-cut-row-btn" data-id="${row.id}" style="background:#FEE8E8;color:#EF4444;border:none;border-radius:6px;width:24px;height:24px;font-weight:700;cursor:pointer;">✕</button>` : ''}
      </div>

      <div class="konstruksiya-chips-flow">
        ${Object.values(KONSTRUKSIYA_TURLARI).map(k => `
          <button type="button" class="konstruksiya-chip-btn ${row.tur === k.id ? 'active' : ''}" data-cutid="${row.id}" data-tur="${k.id}">
            <span>${k.belgi}</span> <span>${k.nom}</span>
          </button>
        `).join('')}
      </div>

      <div class="order-row-nums">
        <div>
          <label style="font-size:9px;font-weight:700;color:var(--text-muted);display:block;text-align:center;">ENI (sm)</label>
          <input type="number" step="0.1" class="inp-cut-eni" data-id="${row.id}" value="${row.eni}" placeholder="0">
        </div>
        <div>
          <label style="font-size:9px;font-weight:700;color:var(--text-muted);display:block;text-align:center;">BO'YI (sm)</label>
          <input type="number" step="0.1" class="inp-cut-boy" data-id="${row.id}" value="${row.boy}" placeholder="0">
        </div>
        <div>
          <label style="font-size:9px;font-weight:700;color:var(--text-muted);display:block;text-align:center;">SONI</label>
          <input type="number" min="1" class="inp-cut-soni" data-id="${row.id}" value="${row.soni || 1}">
        </div>
      </div>
    `;

    box.querySelectorAll('.konstruksiya-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        row.tur = btn.dataset.tur;
        renderCuttingOrderRows();
        runCuttingLogic(false);
      });
    });

    box.querySelector('.inp-cut-eni')?.addEventListener('input', (e) => {
      row.eni = e.target.value;
    });

    box.querySelector('.inp-cut-boy')?.addEventListener('input', (e) => {
      row.boy = e.target.value;
    });

    box.querySelector('.inp-cut-soni')?.addEventListener('input', (e) => {
      row.soni = parseInt(e.target.value) || 1;
    });

    box.querySelector('.del-cut-row-btn')?.addEventListener('click', () => {
      state.cuttingRows = state.cuttingRows.filter(r => r.id !== row.id);
      renderCuttingOrderRows();
      runCuttingLogic(false);
    });

    container.appendChild(box);
  });
}

function renderQoldiqlar(tur = null) {
  const turlar = tur ? [tur] : ['kichkina', 'katta', 'romRuchka', 'kattaRuchka', 'haytek'];
  turlar.forEach(t => {
    const wrap = document.getElementById(`qoldiqList-${t}`);
    if (!wrap) return;
    wrap.innerHTML = '';
    const items = state.qoldiqlar[t] || [];
    if (items.length === 0) return;

    items.forEach((q, qIdx) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:grid; grid-template-columns:1fr 70px 30px; gap:6px; margin-bottom:4px; align-items:center;';
      row.innerHTML = `
        <input type="number" step="0.5" class="inp-qoldiq-uz" value="${q.uzunlik}" placeholder="Uzunlik (sm)" style="padding:6px; font-size:12px; font-weight:700; border-radius:6px; border:1px solid var(--border-card);">
        <input type="number" min="1" class="inp-qoldiq-soni" value="${q.soni || 1}" placeholder="Soni" style="padding:6px; font-size:12px; font-weight:700; text-align:center; border-radius:6px; border:1px solid var(--border-card);">
        <button type="button" class="btn-del-qoldiq" style="background:#FEE8E8; color:#EF4444; border:none; border-radius:6px; height:28px; font-weight:700; cursor:pointer;">✕</button>
      `;

      row.querySelector('.inp-qoldiq-uz').addEventListener('input', (e) => {
        q.uzunlik = parseFloat(e.target.value) || 0;
        localStorage.setItem('prohisobchi_qoldiqlar', JSON.stringify(state.qoldiqlar));
      });
      row.querySelector('.inp-qoldiq-soni').addEventListener('input', (e) => {
        q.soni = parseInt(e.target.value) || 1;
        localStorage.setItem('prohisobchi_qoldiqlar', JSON.stringify(state.qoldiqlar));
      });
      row.querySelector('.btn-del-qoldiq').addEventListener('click', () => {
        state.qoldiqlar[t].splice(qIdx, 1);
        localStorage.setItem('prohisobchi_qoldiqlar', JSON.stringify(state.qoldiqlar));
        renderQoldiqlar(t);
        runCuttingLogic(false);
      });

      wrap.appendChild(row);
    });
  });
}

function renderSaqlanganSizes() {
  const countEl = document.getElementById('savedSizesCount');
  const container = document.getElementById('savedCuttingSizesList');
  if (countEl) countEl.textContent = state.saqlanganOlchamlar.length;
  if (!container) return;

  if (state.saqlanganOlchamlar.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:12px; color:var(--text-muted); font-size:11px;">Saqlangan o\'lchamlar mavjud emas.</div>';
    return;
  }

  container.innerHTML = '';
  state.saqlanganOlchamlar.forEach((item, idx) => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg-input); padding:8px 10px; border-radius:8px; margin-bottom:6px; border:1px solid var(--border-card);';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:12px; font-weight:800; color:var(--text-primary);">${item.nom || 'Saqlangan o\'lcham'}</span>
        <span style="font-size:10px; color:var(--text-muted);">${item.vaqt || ''}</span>
      </div>
      <div style="font-size:11px; color:var(--text-secondary); margin-bottom:6px;">
        📐 ${item.olchamlar?.length || 0} ta o'lcham • ${item.rang || 'OQ'}
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn-outline-pill btn-load-saved" style="padding:4px 8px; font-size:11px; flex:1; text-align:center;">📥 Yuklash</button>
        <button class="btn-solid-green btn-tg-saved" style="padding:4px 8px; font-size:11px; flex:1; text-align:center;">✈️ TG</button>
        <button class="btn-outline-pill btn-del-saved" style="padding:4px 8px; font-size:11px; color:#EF4444; border-color:#EF4444;">✕</button>
      </div>
    `;

    card.querySelector('.btn-load-saved').addEventListener('click', () => {
      state.cuttingRows = JSON.parse(JSON.stringify(item.olchamlar));
      renderCuttingOrderRows();
      runCuttingLogic(true);
      showToast('O\'lchamlar kesishga yuklandi!', '📥');
    });

    card.querySelector('.btn-tg-saved').addEventListener('click', async () => {
      try {
        const tanlanganBrend = state.brendlar.find(b => b.id === state.cuttingSelectedBrendId) || state.brendlar[0];
        const fakeOrder = {
          id: 'SAQLANGAN',
          sana: item.vaqt || new Date().toLocaleTimeString('ru-RU'),
          mijozIsm: item.mijozIsm || item.nom,
          rang: item.rang || 'OQ',
          detallar: generatsiyaDetallar(item.olchamlar, tanlanganBrend)
        };
        const pUz = parseFloat(document.getElementById('profilUzunlik')?.value) || STANDART_PROFIL_UZUNLIGI;
        const res = hisoblaGuruhlanganRaskroy(fakeOrder.detallar, pUz, {}, tanlanganBrend.arra || ARRA_QALINLIGI);
        await buyurtmaniGuruhgaYubor(fakeOrder, res, hisoblaBOM(fakeOrder.detallar));
        showToast('Saqlangan o\'lcham TG ga yuborildi!', '✈️');
      } catch (e) {
        alert(e.message);
      }
    });

    card.querySelector('.btn-del-saved').addEventListener('click', () => {
      state.saqlanganOlchamlar.splice(idx, 1);
      localStorage.setItem('saqlangan_olchamlar', JSON.stringify(state.saqlanganOlchamlar));
      renderSaqlanganSizes();
      showToast('O\'chirildi!', '🗑');
    });

    container.appendChild(card);
  });
}

function runCuttingLogic(showToastMsg = false) {
  const validRows = (state.cuttingRows || []).filter(r => parseFloat(r.eni) > 0 && parseFloat(r.boy) > 0);
  const barsContainer = document.getElementById('cuttingVisualBarsContainer');
  const detailsCard = document.getElementById('cuttingDetailsCard');
  const detailsContainer = document.getElementById('cuttingDetailsListContainer');
  const groupedContainer = document.getElementById('cuttingGroupedListContainer');
  const usageCard = document.getElementById('cuttingProfileUsageCard');
  const usageContainer = document.getElementById('cuttingProfileUsageContainer');
  const tannarxCard = document.getElementById('cuttingTannarxCard');

  if (validRows.length === 0) {
    document.getElementById('cutStatTotalBars').textContent = '0 ta';
    document.getElementById('cutStatEfficiency').textContent = '0%';
    document.getElementById('cutStatWaste').textContent = '0 sm';
    if (barsContainer) {
      barsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">Kesish hisoblash uchun yuqoridagi maydonlarga ENI va BO\'YI o\'lchamlarini kiriting yoki "Buyurtmadan olish" tugmasini bosing.</div>';
    }
    if (detailsCard) detailsCard.style.display = 'none';
    if (groupedContainer) groupedContainer.innerHTML = '';
    const textPlanCard = document.getElementById('cuttingTextPlanCard');
    if (textPlanCard) textPlanCard.style.display = 'none';
    if (usageCard) usageCard.style.display = 'none';
    if (tannarxCard) tannarxCard.innerHTML = '';
    if (showToastMsg) showToast('Avval o\'lchamlarni kiriting!', '⚠️');
    return;
  }

  const tanlanganBrend = state.brendlar.find(b => b.id === (state.cuttingSelectedBrendId || state.selectedBrendId)) || state.brendlar[0];
  const detallar = generatsiyaDetallar(validRows, tanlanganBrend);
  const pUz = parseFloat(document.getElementById('profilUzunlik')?.value) || STANDART_PROFIL_UZUNLIGI;

  const useStock = document.getElementById('cutUseStockSwitch')?.checked ?? true;
  let omborQoldiqlari = {};
  if (useStock) {
    omborQoldiqlari = {
      kichikRom: (state.qoldiqlar.kichkina || []).flatMap(q => Array(parseInt(q.soni) || 1).fill(parseFloat(q.uzunlik))),
      kattaEshik: (state.qoldiqlar.katta || []).flatMap(q => Array(parseInt(q.soni) || 1).fill(parseFloat(q.uzunlik))),
      romRuchka: (state.qoldiqlar.romRuchka || []).flatMap(q => Array(parseInt(q.soni) || 1).fill(parseFloat(q.uzunlik))),
      kattaRuchka: (state.qoldiqlar.kattaRuchka || []).flatMap(q => Array(parseInt(q.soni) || 1).fill(parseFloat(q.uzunlik))),
      haytek: (state.qoldiqlar.haytek || []).flatMap(q => Array(parseInt(q.soni) || 1).fill(parseFloat(q.uzunlik)))
    };
  }

  const guruhlangan = hisoblaGuruhlanganRaskroy(detallar, pUz, omborQoldiqlari, tanlanganBrend.arra || ARRA_QALINLIGI);
  state.lastCuttingResult = guruhlangan;

  document.getElementById('cutStatTotalBars').textContent = `${guruhlangan.jamiTayoqlarBarcha} ta`;
  document.getElementById('cutStatEfficiency').textContent = `${guruhlangan.umumiySamaradorlik}%`;
  document.getElementById('cutStatWaste').textContent = `${guruhlangan.jamiIsrofBarcha} sm`;

  // 1. Kerakli detallar ro'yxati (Ramka dona soni d.soni ga ko'paytirilgan)
  if (detailsCard && detailsContainer) {
    detailsCard.style.display = 'block';
    detailsContainer.innerHTML = '';
    detallar.forEach(d => {
      const s = parseInt(d.soni) || 1;
      const row = document.createElement('div');
      row.style.cssText = 'padding:6px 0; border-bottom:1px dashed var(--border-card); font-size:12px;';
      let info = `<b>${d.idx + 1}-to'r: ${d.eni} × ${d.boy} sm [${d.turNom}] (${s} dona)</b><br>`;
      info += `<span style="color:var(--text-secondary);">Ramka: ${d.ramkaBoy} sm (${2 * s} dona), ${d.ramkaEn} sm (${2 * s} dona)</span>`;
      if (d.hasAProfil && d.aProfilEn > 0) info += ` • <span style="color:var(--text-secondary);">A profil: ${d.aProfilEn} sm (${s} dona)</span>`;
      if (d.hasRuchka && d.ruchka > 0) info += ` • <span style="color:var(--text-secondary);">Ruchka: ${d.ruchka} sm (${s} dona)</span>`;
      if (d.setkaUz > 0) info += ` • <span style="color:var(--text-secondary);">Setka: ${d.setkaUz} sm (${d.setkaEnDona} dona)</span>`;
      info += ` • <span style="color:var(--text-secondary);">Ip: ${d.ip} sm</span>`;
      row.innerHTML = info;
      detailsContainer.appendChild(row);
    });
  }

  // 2. Umumiy bir xil o'lchamlar qo'shilgan
  if (groupedContainer) {
    const ramkaG = {}, ruchkaG = {};
    detallar.forEach(d => {
      const s = d.soni;
      const k1 = d.ramkaBoy;
      ramkaG[k1] = (ramkaG[k1] || 0) + 2 * s;
      const k2 = d.ramkaEn;
      ramkaG[k2] = (ramkaG[k2] || 0) + 2 * s;
      if (d.hasRuchka && d.ruchka > 0) {
        const k3 = d.ruchka;
        ruchkaG[k3] = (ruchkaG[k3] || 0) + s;
      }
    });

    let groupedHtml = `
      <div class="umumiy-box">
        <div class="umumiy-title">UMUMIY (bir xil o'lchamlar qo'shilgan)</div>
        <div class="sub-title">RAMKA PROFIL:</div>
    `;

    Object.keys(ramkaG).sort((a, b) => parseFloat(b) - parseFloat(a)).forEach(sm => {
      groupedHtml += `
        <div class="detal-row">
          <span class="detal-sm">${sm} sm</span>
          <span class="detal-dona">${ramkaG[sm]} ta</span>
        </div>
      `;
    });

    if (Object.keys(ruchkaG).length > 0) {
      groupedHtml += `<div class="sub-title" style="margin-top:10px;">RUCHKA PROFIL:</div>`;
      Object.keys(ruchkaG).sort((a, b) => parseFloat(b) - parseFloat(a)).forEach(sm => {
        groupedHtml += `
          <div class="detal-row">
            <span class="detal-sm">${sm} sm</span>
            <span class="detal-dona">${ruchkaG[sm]} ta</span>
          </div>
        `;
      });
    }

    groupedHtml += `</div>`;
    groupedContainer.innerHTML = groupedHtml;
  }

  // 2.5. Matnli 🔪 KESISH REJASI (RASKROY) BLOKI
  const textPlanCard = document.getElementById('cuttingTextPlanCard');
  const textPlanContainer = document.getElementById('cuttingTextPlanContainer');
  if (textPlanCard && textPlanContainer) {
    textPlanCard.style.display = 'block';
    let planHtml = '';
    guruhlangan.guruhNatijalar.forEach(g => {
      planHtml += `<div style="margin-bottom:12px; background:var(--bg-input); padding:10px 12px; border-radius:10px; border:1px solid var(--border-card);">`;
      planHtml += `<div style="font-weight:800; font-size:12px; color:var(--brand-emerald); margin-bottom:6px;">📌 ${g.nom}:</div>`;
      (g.natija?.tayoqlar || []).forEach((t, tIdx) => {
        const kesimStr = t.kesimlar.join(' + ');
        const qoldiqStr = t.aniqQoldiq > 0 ? ` | qoldiq: <b style="color:var(--text-muted);">${t.aniqQoldiq} sm</b>` : '';
        planHtml += `<div style="padding:4px 0; border-bottom:1px dashed var(--border-card); font-size:11px;">`;
        planHtml += `<b>${tIdx + 1}-profil (600 sm):</b> <span style="color:var(--brand-emerald); font-weight:700;">${kesimStr}</span>${qoldiqStr}`;
        planHtml += `</div>`;
      });
      planHtml += `</div>`;
    });
    textPlanContainer.innerHTML = planHtml;
  }

  // 3. Vizual lentalar
  if (barsContainer) {
    barsContainer.innerHTML = '';
    const colors = ['#10B981', '#059669', '#34D399', '#0D3B2C', '#3B82F6', '#8B5CF6'];

    guruhlangan.guruhNatijalar.forEach(g => {
      const groupHeader = document.createElement('div');
      groupHeader.className = 'profile-group-header';
      groupHeader.innerHTML = `
        <span>📌 ${g.nom}</span>
        <span style="font-family:var(--font-mono); color:var(--brand-emerald);">${g.natija.jamiTayoqSoni} ta ${pUz}sm tayoq (${g.natija.samaradorlikFoiz}%)</span>
      `;
      barsContainer.appendChild(groupHeader);

      g.natija.tayoqlar.forEach((tayoq, i) => {
        const card = document.createElement('div');
        card.className = 'bar-track-card';

        let segmentsHtml = '';
        tayoq.kesimlar.forEach((sm, sIdx) => {
          const pct = ((sm / tayoq.boshlangichUzunlik) * 100).toFixed(1);
          const col = colors[sIdx % colors.length];
          segmentsHtml += `<div class="bar-segment" style="width:${pct}%;background:${col};" title="${sm} sm">${sm} sm</div>`;
        });

        if (tayoq.aniqQoldiq > 0.1) {
          const qPct = ((tayoq.aniqQoldiq / tayoq.boshlangichUzunlik) * 100).toFixed(1);
          const isStock = tayoq.aniqQoldiq >= YAROQLI_QOLDIQ_CHEGARA;
          const cls = isStock ? 'qoldiq' : 'otxod';
          const txt = isStock ? `📦 ${tayoq.aniqQoldiq}sm` : `🗑 ${tayoq.aniqQoldiq}sm`;
          segmentsHtml += `<div class="bar-segment ${cls}" style="width:${qPct}%;" title="Qoldiq: ${tayoq.aniqQoldiq} sm">${txt}</div>`;
        }

        card.innerHTML = `
          <div class="bar-track-head">
            <span>#${i + 1} ${tayoq.nom}</span>
            <span style="color:var(--brand-emerald);">${tayoq.samaradorlik}% samarali</span>
          </div>
          <div class="bar-track-visual">
            ${segmentsHtml}
          </div>
          <div class="bar-track-foot">
            <span>Kesimlar: ${tayoq.kesimlar.join(' + ')} sm</span>
            <span>Qoldiq: <b>${tayoq.aniqQoldiq} sm</b></span>
          </div>
        `;
        barsContainer.appendChild(card);
      });
    });
  }

  // 4. Jami profil sarfi
  if (usageCard && usageContainer) {
    usageCard.style.display = 'block';
    usageContainer.innerHTML = guruhlangan.guruhNatijalar.map(g => `
      <div style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px solid var(--border-card);">
        <span>${g.nom}:</span>
        <b style="color:var(--brand-emerald);">${g.natija.jamiTayoqSoni} ta ${pUz}sm tayoq</b>
      </div>
    `).join('');
  }

  // 5. Tannarx (Sebestoimost)
  if (tannarxCard) {
    const seb = hisoblaSebestoimost(guruhlangan.guruhNatijalar, detallar, state.tannarxStavkalari);
    tannarxCard.innerHTML = `
      <div class="tannarx-summary-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:13px; font-weight:800; letter-spacing:0.5px;">💵 TANNARX (SEBESTOIMOST)</span>
          <span class="tannarx-total-val">${seb.jamiUsd} $</span>
        </div>
        <div class="tannarx-divider"></div>
        ${seb.qismlar.map(q => `
          <div class="tannarx-row">
            <span>${q.nom} (${q.tayoqSoni} tayoq × $${q.stavka}/m)</span>
            <b>${q.usd} $</b>
          </div>
        `).join('')}
        <div class="tannarx-row">
          <span>To'r (Setka) sarfi:</span>
          <b>${seb.setkaUsd} $</b>
        </div>
        <div class="tannarx-row">
          <span>Aksessuarlar (${detallar.reduce((a, b) => a + b.soni, 0)} dona):</span>
          <b>${seb.aksessuarUsd} $</b>
        </div>
        <div class="tannarx-divider"></div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; opacity:0.85;">So'mda umumiy tannarx:</span>
          <b style="font-size:15px; font-family:var(--font-mono); color:#34D399;">${formatSom((seb.jamiUsd || 0) * (parseFloat(state.kurs) || 12800))} so'm</b>
        </div>
      </div>
    `;
  }

  if (showToastMsg) {
    showToast(`Kesish xaritasi tuzildi: ${guruhlangan.umumiySamaradorlik}% samaradorlik!`, '✂️');
  }
}

function renderCuttingScreen() {
  const brendSel = document.getElementById('cuttingBrendSelect');
  if (brendSel) {
    brendSel.value = state.cuttingSelectedBrendId || state.selectedBrendId || 'standart';
  }
  renderCuttingOrderRows();
  renderQoldiqlar();
  renderSaqlanganSizes();
  runCuttingLogic(false);
}

// ==========================================================================
// 4. KASSA VA MODAL LOGIKASI
// ==========================================================================

function openKassaModal(tur) {
  state.kassaModalType = tur;
  const overlay = document.getElementById('modalKassaOverlay');
  const title = document.getElementById('modalKassaTitle');
  const btn = document.getElementById('btnSubmitKassaModal');

  if (!overlay) return;

  if (tur === 'kirim') {
    title.textContent = '🟢 Kassaga Kirim Kiritish';
    btn.textContent = 'Kirimni Saqlash';
    btn.style.background = 'var(--brand-emerald)';
  } else {
    title.textContent = '🔴 Kassadan Chiqim Kiritish';
    btn.textContent = 'Chiqimni Saqlash';
    btn.style.background = '#EF4444';
  }

  document.getElementById('modalKassaSummaInput').value = '';
  document.getElementById('modalKassaIzohInput').value = '';
  overlay.classList.add('active');
}

function renderKassaScreen() {
  const bal = hisoblaKassaBalansi();
  document.getElementById('kassaMainBalanceSom').textContent = `${formatSom(bal.sofBalansSom)} so'm`;
  document.getElementById('kassaPillKirim').textContent = `+${formatSom(bal.jamiKirimSom)} so'm`;
  document.getElementById('kassaPillChiqim').textContent = `-${formatSom(bal.jamiChiqimSom)} so'm`;

  const container = document.getElementById('kassaTrxList');
  if (!container) return;

  const moliya = getMoliya();
  if (moliya.kassaTranzaksiyalar.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">Hali tranzaksiyalar yo\'q.</div>';
    return;
  }

  container.innerHTML = '';
  moliya.kassaTranzaksiyalar.forEach(t => {
    const row = document.createElement('div');
    row.className = 'trx-item-row';
    const isKirim = t.tur === 'kirim';
    row.innerHTML = `
      <div style="display:flex;align-items:center;">
        <div class="trx-icon-box" style="background:${isKirim ? '#E6FBF2' : '#FEE8E8'};color:${isKirim ? '#059669' : '#EF4444'};">
          ${isKirim ? '📥' : '📤'}
        </div>
        <div class="trx-details">
          <h4>${t.izoh}</h4>
          <span>${t.sana}</span>
        </div>
      </div>
      <div class="trx-amount ${t.tur}">
        ${isKirim ? '+' : '-'}${formatSom(t.summaSom)} so'm
      </div>
    `;
    container.appendChild(row);
  });
}

// ==========================================================================
// 5. QARZ DAFTARI VA MODAL LOGIKASI
// ==========================================================================

function openQarzModal() {
  const overlay = document.getElementById('modalQarzOverlay');
  if (!overlay) return;
  document.getElementById('modalQarzShaxsInput').value = '';
  document.getElementById('modalQarzSummaInput').value = '';
  document.getElementById('modalQarzIzohInput').value = '';
  overlay.classList.add('active');
}

function renderQarzScreen() {
  const stat = hisoblaQarzlarStatistikasi();
  document.getElementById('qarzValHaqqim').textContent = `${formatSom(stat.jamiHaqqimSom)} so'm`;
  document.getElementById('qarzValQarzim').textContent = `${formatSom(stat.jamiQarzimSom)} so'm`;

  const container = document.getElementById('qarzCardsList');
  if (!container) return;

  const activeChip = document.querySelector('#screen-qarz .filter-chips-row .filter-chip.active');
  const qFilter = activeChip ? activeChip.dataset.qfilter : 'hammasi';

  const moliya = getMoliya();
  const ochiqlar = moliya.qarzDaftari.filter(q => q.status === 'ochiq').filter(q => {
    if (qFilter === 'hammasi') return true;
    return q.tur === qFilter;
  });

  if (ochiqlar.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:25px;color:var(--text-muted);font-size:13px;">Ochiq qarzlar mavjud emas.</div>';
    return;
  }

  container.innerHTML = '';
  ochiqlar.forEach(q => {
    const card = document.createElement('div');
    card.className = 'qarz-card-item';
    const isHaq = q.tur === 'haqqim';
    card.innerHTML = `
      <div class="qarz-card-header">
        <span class="qarz-person-name">${q.shaxs}</span>
        <span class="qarz-type-badge ${q.tur}">${isHaq ? 'Haqqim' : 'Qarzim'}</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted);">${q.izoh || 'Qarz'} • 📅 ${q.sana}</div>
      <div class="qarz-card-body">
        <span class="qarz-summa" style="color:${isHaq ? 'var(--color-kirim)' : 'var(--color-chiqim)'};">${formatSom(q.summaSom)} so'm</span>
        <button class="btn-outline-pill btn-pay-qarz" data-id="${q.id}">
          ${isHaq ? 'To\'lov olish 💰' : 'To\'lash 💸'}
        </button>
      </div>
    `;

    card.querySelector('.btn-pay-qarz').addEventListener('click', () => {
      if (confirm(`Ushbu qarz (${q.shaxs}: ${formatSom(q.summaSom)} so'm) yopilsinmi va kassaga kiritilsinmi?`)) {
        qarzYopish(q.id, true);
        renderQarzScreen();
        showToast('Qarz yopildi va kassaga kiritildi!', '✅');
      }
    });

    container.appendChild(card);
  });
}

// ==========================================================================
// 6. TEZKOR KALKULYATOR LOGIKASI
// ==========================================================================

function updateQuickCalc() {
  const w = parseFloat(document.getElementById('qcInputEni')?.value) || 0;
  const h = parseFloat(document.getElementById('qcInputBoy')?.value) || 0;
  const soni = state.qc.soni;

  let tur = state.qc.profilTur || 'pastga';
  let profilId = 2;
  if (tur === 'yonga') {
    profilId = 5;
  } else if (tur === 'katta' || tur === 'eshik') {
    tur = 'eshik';
    profilId = 1;
  } else if (tur === 'haytek') {
    profilId = 3;
  } else {
    tur = 'pastga';
    profilId = 2;
  }

  const calc = hisoblaBuyurtmaNarxi(
    [{ eni: w, boy: h, soni: soni, profilId: profilId, tur: tur }],
    state.profillar,
    state.kurs,
    state.qc.narxTuri,
    true
  );

  document.getElementById('qcCounterVal').textContent = soni;
  document.getElementById('qcResultM2').textContent = `${calc.jamiM2.toFixed(2)} m²`;
  document.getElementById('qcResultUsd').textContent = `${calc.jamiUsd.toFixed(2)} $`;
  document.getElementById('qcResultSom').textContent = `${formatSom(calc.jamiSom)} so'm`;
}

// ==========================================================================
// 7. OMBOR VA SOZLAMALAR (BRENDLAR) LOGIKASI
// ==========================================================================

function renderOmborScreen() {
  const ombor = getOmbor();

  const matContainer = document.getElementById('omborMaterialsListContainer');
  if (matContainer) {
    matContainer.innerHTML = '';
    ombor.materiallar.forEach(m => {
      matContainer.innerHTML += `
        <div style="padding:10px 0;border-bottom:1px solid var(--border-card);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:700;font-size:13px;">${m.nom}</div>
            <div style="font-size:11px;color:var(--text-muted);">Zaxirada mavjud</div>
          </div>
          <div style="font-weight:800;font-family:var(--font-mono);color:var(--brand-emerald-hover);">${m.miqdor} ${m.birlik}</div>
        </div>
      `;
    });
  }

  const remContainer = document.getElementById('omborRemnantsListContainer');
  if (remContainer) {
    remContainer.innerHTML = '';
    if (ombor.yaroqliQoldiqlar.length === 0) {
      remContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">Qoldiqlar yo\'q.</div>';
    } else {
      ombor.yaroqliQoldiqlar.forEach(q => {
        remContainer.innerHTML += `
          <div style="padding:10px 0;border-bottom:1px solid var(--border-card);display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:13px;">${q.profilNom}</div>
              <div style="font-size:11px;color:var(--text-muted);">${q.sana}</div>
            </div>
            <div style="font-weight:800;font-family:var(--font-mono);">${q.uzunlik} sm</div>
          </div>
        `;
      });
    }
  }
}

function renderSozlamalarScreen() {
  const tbl = document.getElementById('sozlamaProfillarTable');
  if (tbl) {
    tbl.innerHTML = '';
    state.profillar.forEach(p => {
      const narxMatni = (p.isPerimeter || p.tur === 'haytek')
        ? `Standart: ${p.chakanaNarx || p.narx} so'm/sm • Diler: ${p.dilerNarx || p.dillerNarx} so'm/sm`
        : `Standart: $${p.chakanaNarx || p.narx} • Diler: $${p.dilerNarx || p.dillerNarx || p.narx}`;
      tbl.innerHTML += `
        <div style="padding:10px 0;border-bottom:1px solid var(--border-card);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:700;font-size:13px;">${p.nom}</div>
            <div style="font-size:11px;color:var(--text-muted);">${narxMatni}</div>
          </div>
        </div>
      `;
    });
  }

  // Brendlar jadvali
  const brendTbl = document.getElementById('sozlamaBrendlarTable');
  if (brendTbl) {
    brendTbl.innerHTML = '';
    state.brendlar.forEach(b => {
      brendTbl.innerHTML += `
        <div style="padding:8px 0; border-bottom:1px solid var(--border-card); display:flex; justify-content:space-between; align-items:center; font-size:12px;">
          <div>
            <b>${b.nom}</b>
            <div style="color:var(--text-muted); font-size:11px;">
              Rom: +${b.romEnDopusk}sm | Eshik: +${b.eshikEnDopusk}sm | Ruchka: ${b.ruchkaDopusk}sm
            </div>
          </div>
          <span style="font-size:11px; font-weight:700; color:var(--brand-emerald);">Arra: ${b.arra}sm</span>
        </div>
      `;
    });
  }

  // Tannarx stavkalari inputlari
  const tn = state.tannarxStavkalari;
  if (document.getElementById('tnKatta')) document.getElementById('tnKatta').value = tn.katta;
  if (document.getElementById('tnKattaRuchka')) document.getElementById('tnKattaRuchka').value = tn.kattaRuchka;
  if (document.getElementById('tnKichkina')) document.getElementById('tnKichkina').value = tn.kichkina;
  if (document.getElementById('tnRomRuchka')) document.getElementById('tnRomRuchka').value = tn.romRuchka;
  if (document.getElementById('tnHaytek')) document.getElementById('tnHaytek').value = tn.haytek;
  if (document.getElementById('tnSetka')) document.getElementById('tnSetka').value = tn.setka;
  if (document.getElementById('tnAksessuar')) document.getElementById('tnAksessuar').value = tn.aksessuar;

  const tg = getTelegramConfig();
  const tokenInp = document.getElementById('cfgBotTokenInput');
  const chatInp = document.getElementById('cfgChatIdInput');
  if (tokenInp) tokenInp.value = tg.botToken || '';
  if (chatInp) chatInp.value = tg.chatId || '';
}

// Buyurtmalar tarixini Excel (CSV) eksport qilish
async function exportOrdersHistoryCsv() {
  const sarlavhalar = ['ID', 'Sana', 'Mijoz Ismi', 'Telefon', 'Rangi', 'Brend', 'To\'r Soni', 'Kvadratura (m²)', 'Summa ($)', 'Summa (so\'m)', 'To\'lov Holati', 'Status'];
  const qatorlar = state.buyurtmalar.map(b => [
    b.id,
    b.sana,
    b.mijozIsm,
    b.mijozTel,
    b.rang,
    b.brendNom || 'Standart',
    b.jamiSoni,
    b.jamiM2,
    b.jamiUsd,
    b.jamiSom,
    b.tolovHolati,
    b.status
  ]);

  const sana = new Date().toISOString().split('T')[0];
  const res = await eksportCSV(`buyurtmalar_${sana}.csv`, sarlavhalar, qatorlar, '📦 Buyurtmalar tarixi hisoboti (Excel/CSV)');
  if (res?.sentToTelegram) {
    showToast('Excel fayl Telegramingizga yuborildi! 📥', '📊');
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert('Excel (CSV) fayli Telegram botingizga yuborildi! 📥\nBot chatiga o\'tib, faylni bemalol ochishingiz mumkin.');
    }
  } else {
    showToast('Buyurtmalar Excel (CSV) ga yuklandi!', '📊');
  }
}

// ==========================================================================
// SAAS LITSENZIYA VA BULUT SINXRONIZATSIYASI (MULTI-TENANT ISOLATION)
// ==========================================================================

export async function verifyTenantLicense(licenseKey) {
  try {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenseKey,
        telegram_id: tgUser?.id || null
      })
    });
    return await res.json();
  } catch (e) {
    console.warn('Litsenziya serveriga ulanishda xatolik:', e);
    return { valid: true, offline: true };
  }
}

export async function syncTenantDataToCloud(dataKey, content) {
  const licenseKey = localStorage.getItem('prohisobchi_license_key');
  if (!licenseKey) return;
  try {
    await fetch('/api/tenant/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenseKey,
        data_key: dataKey,
        content: content
      })
    });
  } catch (e) {
    console.warn('Bulutga sinxronlashda xatolik:', e);
  }
}

export async function fetchTenantDataFromCloud(licenseKey) {
  try {
    const res = await fetch(`/api/tenant/data?license_key=${encodeURIComponent(licenseKey)}`);
    const json = await res.json();
    if (json.ok && json.data) {
      if (json.data.buyurtmalar && Array.isArray(json.data.buyurtmalar)) {
        state.buyurtmalar = json.data.buyurtmalar;
        localStorage.setItem('prohisobchi_buyurtmalar', JSON.stringify(state.buyurtmalar));
      }
      if (json.data.moliya) {
        localStorage.setItem('prohisobchi_moliya', JSON.stringify(json.data.moliya));
      }
      if (json.data.qoldiqlar) {
        state.qoldiqlar = json.data.qoldiqlar;
        localStorage.setItem('prohisobchi_qoldiqlar', JSON.stringify(state.qoldiqlar));
      }
      if (json.data.brendlar) {
        state.brendlar = json.data.brendlar;
        localStorage.setItem('prohisobchi_brendlar', JSON.stringify(state.brendlar));
      }
      renderOrderHistory();
      renderKassaScreen();
      renderQarzScreen();
      renderQoldiqlar();
    }
  } catch (e) {
    console.warn('Bulutdan ma\'lumot yuklashda xatolik:', e);
  }
}

function initLicenseSystem() {
  const licenseOverlay = document.getElementById('modalLicenseOverlay');
  const errorEl = document.getElementById('licenseErrorMsg');
  const submitBtn = document.getElementById('btnSubmitLicense');
  const keyInput = document.getElementById('inputLicenseKey');
  const tenantSub = document.getElementById('headerTenantSubtitle');

  let savedKey = localStorage.getItem('prohisobchi_license_key');

  // Avtomatik tekshirish (Admin Telegram orqali ochganda darhol kodsiz kiradi)
  verifyTenantLicense(savedKey || '').then(check => {
    if (check.valid) {
      licenseOverlay?.classList.remove('active');
      if (check.is_admin) {
        localStorage.setItem('prohisobchi_license_key', 'ADMIN-PRO');
        if (tenantSub) {
          tenantSub.innerHTML = `👑 <b>Administrator</b> • <span style="color:#60A5FA; font-weight:700;">Cheksiz PRO</span>`;
        }
        fetchTenantDataFromCloud('ADMIN-PRO');
      } else if (check.tenant) {
        if (tenantSub) {
          tenantSub.innerHTML = `<b>${check.tenant.name}</b> • <span style="color:#34D399; font-weight:700;">⏰ ${check.days_left} kun</span>`;
        }
        fetchTenantDataFromCloud(savedKey || check.tenant.license_key);
      }
    } else {
      licenseOverlay?.classList.add('active');
      if (savedKey && errorEl) {
        errorEl.textContent = check.message || 'Obuna muddati tugagan!';
        errorEl.style.display = 'block';
      }
    }
  }).catch(() => {
    if (!savedKey) {
      licenseOverlay?.classList.add('active');
    }
  });

  submitBtn?.addEventListener('click', async () => {
    const entered = keyInput?.value?.trim().toUpperCase();
    if (!entered) {
      if (errorEl) {
        errorEl.textContent = 'Iltimos, litsenziya kalitini kiriting!';
        errorEl.style.display = 'block';
      }
      return;
    }

    submitBtn.textContent = 'Tekshirilmoqda...';
    submitBtn.disabled = true;

    try {
      const res = await verifyTenantLicense(entered);
      if (res.valid) {
        const activeKey = res.is_admin ? 'ADMIN-PRO' : entered;
        localStorage.setItem('prohisobchi_license_key', activeKey);
        licenseOverlay?.classList.remove('active');
        if (tenantSub) {
          if (res.is_admin) {
            tenantSub.innerHTML = `👑 <b>Administrator</b> • <span style="color:#60A5FA; font-weight:700;">Cheksiz PRO</span>`;
          } else if (res.tenant) {
            tenantSub.innerHTML = `<b>${res.tenant.name}</b> • <span style="color:#34D399; font-weight:700;">⏰ ${res.days_left} kun</span>`;
          }
        }
        await fetchTenantDataFromCloud(activeKey);
        showToast(res.is_admin ? '👑 Administrator tizimga kirdi!' : `Xush kelibsiz! ${res.tenant?.name || ''} faollashtirildi.`, '🎉');
      } else {
        if (errorEl) {
          errorEl.textContent = res.message || 'Noto\'g\'ri litsenziya kaliti!';
          errorEl.style.display = 'block';
        }
      }
    } catch (e) {
      if (errorEl) {
        errorEl.textContent = 'Server bilan bog\'lanishda xatolik: ' + e.message;
        errorEl.style.display = 'block';
      }
    } finally {
      submitBtn.textContent = '🚀 Tizimga Kirish';
      submitBtn.disabled = false;
    }
  });
}

// ==========================================================================
// INITIALIZATION VA EVENT LISTENERS
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }
  applyTheme();
  initLicenseSystem();

  // Bottom Nav
  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateToScreen(btn.dataset.nav));
  });

  // Dashboard modullar
  document.querySelectorAll('.module-card-item').forEach(card => {
    card.addEventListener('click', () => navigateToScreen(card.dataset.goto));
  });

  document.getElementById('btnHeroNewOrder')?.addEventListener('click', () => navigateToScreen('yangi'));

  // Theme toggle
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

  function updateKursDisplay() {
    const formatted = formatSom(state.kurs);
    const headerEl = document.getElementById('headerKursVal');
    if (headerEl) headerEl.textContent = formatted;
    const bannerEl = document.getElementById('homeKursBannerText');
    if (bannerEl) bannerEl.textContent = `💱 Valyuta kursi: 1 USD = ${formatted} UZS`;
  }

  // Kurs yangilash
  document.getElementById('btnUpdateKursHome')?.addEventListener('click', async () => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data?.rates?.UZS) {
        state.kurs = Math.round(data.rates.UZS);
        localStorage.setItem('prohisobchi_kurs', state.kurs);
        updateKursDisplay();
        updateOrderSummary();
        showToast(`Kurs yangilandi: 1$ = ${formatSom(state.kurs)} so'm`, '💱');
      }
    } catch (e) {
      showToast('Kursni olishda xatolik!', '⚠️');
    }
  });

  // Yangi buyurtma narx toifasi (Chakana/Standart vs Diler)
  const handleTierSwitch = (tier) => {
    state.orderNarxTuri = (tier === 'diller' || tier === 'diler') ? 'diler' : 'chakana';
    document.querySelectorAll('#tierStandartBtn, #tabChakanaMode').forEach(b => {
      b?.classList.toggle('active', state.orderNarxTuri === 'chakana');
    });
    document.querySelectorAll('#tierDillerBtn, #tabDilerMode').forEach(b => {
      b?.classList.toggle('active', state.orderNarxTuri === 'diler');
    });
    updateOrderSummary();
  };

  document.getElementById('tierStandartBtn')?.addEventListener('click', () => handleTierSwitch('standart'));
  document.getElementById('tierDillerBtn')?.addEventListener('click', () => handleTierSwitch('diller'));
  document.getElementById('tabChakanaMode')?.addEventListener('click', () => handleTierSwitch('standart'));
  document.getElementById('tabDilerMode')?.addEventListener('click', () => handleTierSwitch('diller'));

  // Brend tanlash
  document.getElementById('orderBrendSelect')?.addEventListener('change', (e) => {
    state.selectedBrendId = e.target.value;
  });

  // Mini CRM input event
  document.getElementById('orderMijozIsm')?.addEventListener('input', (e) => {
    checkClientCrm(e.target.value);
  });

  document.getElementById('btnAddOrderRow')?.addEventListener('click', () => {
    state.orderRows.push({
      id: state.nextRowId++,
      profilId: 1,
      eni: '',
      boy: '',
      soni: 1,
      tur: 'yonga'
    });
    renderOrderRows();
  });

  document.querySelectorAll('#paymentTypeChips .chip-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#paymentTypeChips .chip-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.orderTolovTuri = btn.dataset.type;
    });
  });

  document.getElementById('btnSubmitOrder')?.addEventListener('click', saveCurrentOrder);

  // Tarix
  document.getElementById('orderSearchInput')?.addEventListener('input', renderOrdersHistory);
  document.querySelectorAll('#screen-tarix .filter-chips-row .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#screen-tarix .filter-chips-row .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderOrdersHistory();
    });
  });

  // Kesish
  document.getElementById('btnAddCuttingItemRow')?.addEventListener('click', () => {
    state.cuttingRows.push({
      id: Date.now(),
      profilId: 1,
      eni: '',
      boy: '',
      soni: 1,
      tur: 'yonga'
    });
    renderCuttingOrderRows();
  });

  document.getElementById('btnExecuteCuttingCalc')?.addEventListener('click', () => {
    runCuttingLogic(true);
  });

  document.getElementById('btnSyncCuttingFromOrder')?.addEventListener('click', () => {
    if (!state.orderRows || state.orderRows.length === 0) {
      showToast('Yangi buyurtmada hali o\'lchamlar yo\'q!', '⚠️');
      return;
    }
    state.cuttingRows = JSON.parse(JSON.stringify(state.orderRows));
    state.cuttingSelectedBrendId = state.selectedBrendId || 'standart';
    const brendSel = document.getElementById('cuttingBrendSelect');
    if (brendSel) brendSel.value = state.cuttingSelectedBrendId;
    renderCuttingOrderRows();
    runCuttingLogic(true);
    showToast('Buyurtmadagi o\'lchamlar yuklandi!', '📋');
  });

  document.getElementById('cuttingBrendSelect')?.addEventListener('change', (e) => {
    state.cuttingSelectedBrendId = e.target.value;
    runCuttingLogic(false);
  });

  document.getElementById('cutUseStockSwitch')?.addEventListener('change', () => {
    runCuttingLogic(false);
  });

  document.getElementById('btnSendCuttingTelegram')?.addEventListener('click', async () => {
    const validRows = (state.cuttingRows || []).filter(r => parseFloat(r.eni) > 0 && parseFloat(r.boy) > 0);
    if (validRows.length === 0) {
      showToast('Avval kesish o\'lchamlarini kiriting!', '⚠️');
      return;
    }
    if (!state.lastCuttingResult) {
      runCuttingLogic(false);
    }
    try {
      const tanlanganBrend = state.brendlar.find(b => b.id === (state.cuttingSelectedBrendId || state.selectedBrendId)) || state.brendlar[0];
      const detallar = generatsiyaDetallar(validRows, tanlanganBrend);
      const sexBuyurtma = {
        id: 'RASKROY',
        sana: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        mijozIsm: 'Kesish Sexi',
        rang: 'OQ',
        detallar
      };
      const bom = hisoblaBOM(detallar);
      const xabarIshchi = generatsiyaIshchiXabari(sexBuyurtma, state.lastCuttingResult, bom, state.kurs);
      
      if (window.Telegram?.WebApp?.sendData) {
        try {
          window.Telegram.WebApp.sendData(JSON.stringify({
            chat_id: getTelegramConfig().chatId,
            cutting_map_text: xabarIshchi
          }));
        } catch (e) {
          console.warn('WebApp.sendData:', e);
        }
      }

      await telegramgaXabarYubor(xabarIshchi);
      showToast('Sex guruhiga yuborildi!', '✈️');
    } catch (e) {
      alert(e.message);
    }
  });

  document.getElementById('btnCopyCuttingClipboard')?.addEventListener('click', () => {
    const validRows = (state.cuttingRows || []).filter(r => parseFloat(r.eni) > 0 && parseFloat(r.boy) > 0);
    if (validRows.length === 0) {
      showToast('Avval kesish o\'lchamlarini kiriting!', '⚠️');
      return;
    }
    if (!state.lastCuttingResult) {
      runCuttingLogic(false);
    }
    const tanlanganBrend = state.brendlar.find(b => b.id === (state.cuttingSelectedBrendId || state.selectedBrendId)) || state.brendlar[0];
    const detallar = generatsiyaDetallar(validRows, tanlanganBrend);
    const sexBuyurtma = {
      id: 'RASKROY',
      sana: new Date().toLocaleDateString('ru-RU'),
      mijozIsm: 'Kesish Sexi',
      rang: 'OQ',
      detallar
    };
    const msg = generatsiyaIshchiXabari(
      sexBuyurtma,
      state.lastCuttingResult,
      hisoblaBOM(detallar),
      state.kurs
    );
    klipbordgaNusxala(msg);
    showToast('Kesish xaritasi nusxalandi!', '📋');
  });

  document.getElementById('btnRecalculateCut')?.addEventListener('click', () => runCuttingLogic(true));
  document.getElementById('btnPrintCuttingPdf')?.addEventListener('click', () => window.print());

  // Kesish: Saqlangan o'lchamlar va Qoldiqlar hodisalari
  document.getElementById('toggleSavedSizesBtn')?.addEventListener('click', () => {
    const list = document.getElementById('savedCuttingSizesList');
    const icon = document.getElementById('toggleSavedIcon');
    if (!list) return;
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
    if (icon) icon.textContent = isHidden ? '▲' : '▼';
    if (isHidden) renderSaqlanganSizes();
  });

  document.getElementById('btnSaveCuttingSizes')?.addEventListener('click', () => {
    const validRows = (state.cuttingRows || []).filter(r => parseFloat(r.eni) > 0 && parseFloat(r.boy) > 0);
    if (validRows.length === 0) {
      showToast('Avval o\'lchamlarni kiriting!', '⚠️');
      return;
    }
    const name = prompt('Ushbu o\'lchamlar to\'plamiga nom bering:', `O'lchamlar — ${new Date().toLocaleDateString('ru-RU')}`);
    if (name) {
      state.saqlanganOlchamlar.unshift({
        id: Date.now(),
        nom: name,
        vaqt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        olchamlar: JSON.parse(JSON.stringify(validRows))
      });
      localStorage.setItem('saqlangan_olchamlar', JSON.stringify(state.saqlanganOlchamlar));
      renderSaqlanganSizes();
      showToast('O\'lchamlar saqlandi!', '📁');
    }
  });

  document.getElementById('toggleRemnantsBtn')?.addEventListener('click', () => {
    const content = document.getElementById('remnantsAccordionContent');
    const icon = document.getElementById('toggleRemnantsIcon');
    if (!content) return;
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    if (icon) icon.textContent = isHidden ? '▲' : '▼';
    if (isHidden) renderQoldiqlar();
  });

  document.querySelectorAll('.btn-add-qoldiq').forEach(btn => {
    btn.addEventListener('click', () => {
      const tur = btn.dataset.tur;
      if (!state.qoldiqlar[tur]) state.qoldiqlar[tur] = [];
      state.qoldiqlar[tur].push({ id: Date.now(), uzunlik: '', soni: 1 });
      localStorage.setItem('prohisobchi_qoldiqlar', JSON.stringify(state.qoldiqlar));
      renderQoldiqlar(tur);
    });
  });

  // Kassa modal va Telegram/CSV eksport
  document.getElementById('btnOpenKirimModal')?.addEventListener('click', () => openKassaModal('kirim'));
  document.getElementById('btnOpenChiqimModal')?.addEventListener('click', () => openKassaModal('chiqim'));
  document.getElementById('btnCloseKassaModal')?.addEventListener('click', () => {
    document.getElementById('modalKassaOverlay').classList.remove('active');
  });

  document.getElementById('btnSubmitKassaModal')?.addEventListener('click', () => {
    const summa = parseFloat(document.getElementById('modalKassaSummaInput').value);
    const izoh = document.getElementById('modalKassaIzohInput').value.trim();

    if (!summa || !izoh) {
      alert('Summa va izohni to\'liq kiriting!');
      return;
    }

    tranzaksiyaQosh({
      tur: state.kassaModalType,
      summaSom: summa,
      izoh
    });
    syncTenantDataToCloud('moliya', getMoliya());

    document.getElementById('modalKassaOverlay').classList.remove('active');
    renderKassaScreen();
    showToast(state.kassaModalType === 'kirim' ? 'Kirim saqlandi!' : 'Chiqim saqlandi!', '💵');
  });

  document.getElementById('btnSendKassaTelegram')?.addEventListener('click', async () => {
    try {
      const hisobotText = generatsiyaKassaTelegramHisoboti();
      await kassaHisobotiniGuruhgaYubor(hisobotText);
      showToast('Kassa hisoboti Telegramga yuborildi!', '✈️');
    } catch (e) {
      alert(`Xatolik: ${e.message}`);
    }
  });

  document.getElementById('btnExportKassaCsv')?.addEventListener('click', async () => {
    try {
      const res = await eksportKassaCSV();
      if (res?.sentToTelegram) {
        showToast('Kassa Excel fayli Telegramga yuborildi! 📥', '📊');
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('Kassa hisoboti (Excel/CSV) Telegram botingizga yuborildi! 📥\nIlovani yopib bot chatidan yuklab olishingiz mumkin.');
        }
      } else {
        showToast('Kassa Excel (CSV) ga yuklandi!', '📊');
      }
    } catch (e) {
      showToast('Xatolik: ' + e.message, '⚠️');
    }
  });

  // Qarz modal va CSV eksport
  document.getElementById('btnOpenNewQarzModal')?.addEventListener('click', openQarzModal);
  document.getElementById('btnCloseQarzModal')?.addEventListener('click', () => {
    document.getElementById('modalQarzOverlay').classList.remove('active');
  });

  document.querySelectorAll('#modalQarzTypeGroup .chip-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modalQarzTypeGroup .chip-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.qarzModalType = btn.dataset.qtur;
    });
  });

  document.getElementById('btnSubmitQarzModal')?.addEventListener('click', () => {
    const shaxs = document.getElementById('modalQarzShaxsInput').value.trim();
    const summa = parseFloat(document.getElementById('modalQarzSummaInput').value);
    const izoh = document.getElementById('modalQarzIzohInput').value.trim();

    if (!shaxs || !summa) {
      alert('Shaxs ismi va summani kiriting!');
      return;
    }

    qarzQosh({
      tur: state.qarzModalType,
      shaxs,
      summaSom: summa,
      izoh
    });
    syncTenantDataToCloud('moliya', getMoliya());

    document.getElementById('modalQarzOverlay').classList.remove('active');
    renderQarzScreen();
    showToast('Qarz daftariga yozildi!', '📒');
  });

  document.getElementById('btnExportQarzCsv')?.addEventListener('click', async () => {
    try {
      const res = await eksportQarzCSV();
      if (res?.sentToTelegram) {
        showToast('Qarzlar Excel fayli Telegramga yuborildi! 📥', '📊');
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('Qarz daftari (Excel/CSV) Telegram botingizga yuborildi! 📥\nIlovani yopib bot chatidan yuklab olishingiz mumkin.');
        }
      } else {
        showToast('Qarzlar Excel (CSV) ga yuklandi!', '📊');
      }
    } catch (e) {
      showToast('Xatolik: ' + e.message, '⚠️');
    }
  });

  // Buyurtma chek modal hodisalari
  document.getElementById('btnCloseOrderModal')?.addEventListener('click', () => {
    document.getElementById('modalOrderOverlay').classList.remove('active');
  });

  document.getElementById('modalOrderBtnTelegram')?.addEventListener('click', async () => {
    if (state.activeModalOrder) {
      try {
        await buyurtmaniGuruhgaYubor(state.activeModalOrder, null, state.activeModalOrder.bom);
        showToast('Telegram guruhga yuborildi!', '✈️');
      } catch (e) {
        alert(e.message);
      }
    }
  });

  document.getElementById('modalOrderBtnCopy')?.addEventListener('click', () => {
    if (state.activeModalOrder) {
      const chek = generatsiyaMijozCheki(state.activeModalOrder);
      klipbordgaNusxala(chek);
      showToast('Chek nusxalandi!', '📋');
    }
  });

  document.getElementById('modalOrderBtnPrint')?.addEventListener('click', () => window.print());

  // Buyurtmani to'g'ridan-to'g'ri Kesishga o'tkazish
  document.getElementById('modalOrderBtnTransferCut')?.addEventListener('click', () => {
    if (state.activeModalOrder && state.activeModalOrder.qatorlar) {
      state.cuttingRows = state.activeModalOrder.qatorlar.map(q => {
        const prof = state.profillar.find(p => p.id === q.profilId);
        return {
          id: Date.now() + Math.random(),
          profilId: q.profilId || 1,
          boy: q.boy,
          eni: q.eni,
          soni: q.soni || 1,
          tur: q.tur || prof?.kesishTur || 'yonga'
        };
      });
      state.cuttingSelectedBrendId = state.activeModalOrder.brendId || 'standart';
      document.getElementById('modalOrderOverlay')?.classList.remove('active');
      navigateToScreen('kesish');
      renderCuttingScreen();
      showToast('O\'lchamlar kesish bo\'limiga o\'tkazildi!', '✂️');
    }
  });

  // Tannarx stavkalarini saqlash
  document.getElementById('btnSaveTannarxSettings')?.addEventListener('click', () => {
    state.tannarxStavkalari = {
      katta: parseFloat(document.getElementById('tnKatta')?.value) || 2.66,
      kattaRuchka: parseFloat(document.getElementById('tnKattaRuchka')?.value) || 2.66,
      kichkina: parseFloat(document.getElementById('tnKichkina')?.value) || 2.16,
      romRuchka: parseFloat(document.getElementById('tnRomRuchka')?.value) || 2.16,
      haytek: parseFloat(document.getElementById('tnHaytek')?.value) || 1.25,
      setka: parseFloat(document.getElementById('tnSetka')?.value) || 0.0004,
      aksessuar: parseFloat(document.getElementById('tnAksessuar')?.value) || 3
    };
    saqlaTannarxStavkalari(state.tannarxStavkalari);
    showToast('Tannarx stavkalari saqlandi!', '💾');
    runCuttingLogic(false);
  });

  // Modal overlay fonini bosganda yopish
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Tezkor kalkulyator
  document.querySelectorAll('#quickCalcProfilChips .chip-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#quickCalcProfilChips .chip-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.qc.profilTur = btn.dataset.profil;
      updateQuickCalc();
    });
  });

  document.getElementById('qcTabChakana')?.addEventListener('click', () => {
    state.qc.narxTuri = 'chakana';
    document.getElementById('qcTabChakana').classList.add('active');
    document.getElementById('qcTabDiler').classList.remove('active');
    updateQuickCalc();
  });

  document.getElementById('qcTabDiler')?.addEventListener('click', () => {
    state.qc.narxTuri = 'diler';
    document.getElementById('qcTabDiler').classList.add('active');
    document.getElementById('qcTabChakana').classList.remove('active');
    updateQuickCalc();
  });

  document.getElementById('qcInputEni')?.addEventListener('input', updateQuickCalc);
  document.getElementById('qcInputBoy')?.addEventListener('input', updateQuickCalc);

  document.getElementById('qcBtnMinus')?.addEventListener('click', () => {
    if (state.qc.soni > 1) {
      state.qc.soni--;
      updateQuickCalc();
    }
  });

  document.getElementById('qcBtnPlus')?.addEventListener('click', () => {
    state.qc.soni++;
    updateQuickCalc();
  });

  document.getElementById('qcBtnAddToOrder')?.addEventListener('click', () => {
    state.orderRows.push({
      id: state.nextRowId++,
      profilId: 1,
      eni: document.getElementById('qcInputEni')?.value || '60',
      boy: document.getElementById('qcInputBoy')?.value || '140',
      soni: state.qc.soni,
      tur: 'yonga'
    });
    showToast('Buyurtmaga qo\'shildi!', '🛒');
    navigateToScreen('yangi');
  });

  // Kalkulyatordan to'g'ridan-to'g'ri Kassaga Kirim/Chiqim
  document.getElementById('qcBtnKassaKirim')?.addEventListener('click', () => {
    const summaSom = (hisoblaM2(document.getElementById('qcInputEni')?.value, document.getElementById('qcInputBoy')?.value) * state.qc.soni * 23) * state.kurs;
    tranzaksiyaQosh({
      tur: 'kirim',
      summaSom,
      izoh: `Kalkulyatordan tezkor kirim (${state.qc.soni} dona to'r)`
    });
    showToast(`Kassaga kirim qilindi: ${formatSom(summaSom)} so'm`, '🟢');
  });

  document.getElementById('qcBtnKassaChiqim')?.addEventListener('click', () => {
    const summaSom = (hisoblaM2(document.getElementById('qcInputEni')?.value, document.getElementById('qcInputBoy')?.value) * state.qc.soni * 15) * state.kurs;
    tranzaksiyaQosh({
      tur: 'chiqim',
      summaSom,
      izoh: `Kalkulyatordan tezkor chiqim`
    });
    showToast(`Kassadan chiqim qilindi: ${formatSom(summaSom)} so'm`, '🔴');
  });

  // Ombor tablari
  document.getElementById('tabOmborMateriallar')?.addEventListener('click', () => {
    document.getElementById('tabOmborMateriallar').classList.add('active');
    document.getElementById('tabOmborQoldiqlar').classList.remove('active');
    document.getElementById('omborViewMateriallar').style.display = 'block';
    document.getElementById('omborViewQoldiqlar').style.display = 'none';
  });

  document.getElementById('tabOmborQoldiqlar')?.addEventListener('click', () => {
    document.getElementById('tabOmborQoldiqlar').classList.add('active');
    document.getElementById('tabOmborMateriallar').classList.remove('active');
    document.getElementById('omborViewMateriallar').style.display = 'none';
    document.getElementById('omborViewQoldiqlar').style.display = 'block';
  });

  // Telegram sozlamalari
  document.getElementById('btnSaveTelegramSettings')?.addEventListener('click', () => {
    const token = document.getElementById('cfgBotTokenInput').value.trim();
    const chatId = document.getElementById('cfgChatIdInput').value.trim();
    saqlaTelegramConfig({ botToken: token, chatId });
    showToast('Telegram sozlamalari saqlandi!', '✈️');
  });

  // Buyurtmalar CSV eksport
  document.getElementById('btnExportOrdersCsv')?.addEventListener('click', exportOrdersHistoryCsv);

  // JSON Eksport / Tiklash
  document.getElementById('btnExportJsonFile')?.addEventListener('click', () => {
    const backup = {
      profillar: state.profillar,
      brendlar: state.brendlar,
      buyurtmalar: state.buyurtmalar,
      ombor: getOmbor(),
      moliya: getMoliya(),
      telegram: getTelegramConfig()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pro_hisobchi_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('JSON eksport qilindi!', '📥');
  });

  document.getElementById('btnImportJsonFile')?.addEventListener('click', () => {
    document.getElementById('backupFileInput')?.click();
  });

  document.getElementById('backupFileInput')?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.buyurtmalar) localStorage.setItem(storagePrefix + 'buyurtmalar', JSON.stringify(data.buyurtmalar));
          if (data.ombor) saqlaOmbor(data.ombor);
          if (data.moliya) saqlaMoliya(data.moliya);
          alert('Ma\'lumotlar tiklandi!');
          window.location.reload();
        } catch (err) {
          alert('JSON fayli xato!');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  });

  // Barcha ma'lumotlarni 0 qilish / Tozalash
  document.getElementById('btnResetAllData')?.addEventListener('click', () => {
    if (confirm('Diqqat! Barcha buyurtmalar, kassa amallari, qarzlar va ombor qoldiqlari o\'chiriladi va tizim 0 dan boshlanadi. Davom etasizmi?')) {
      localStorage.removeItem(storagePrefix + 'buyurtmalar');
      localStorage.removeItem('prohisobchi_moliya');
      localStorage.removeItem('prohisobchi_ombor');
      state.buyurtmalar = [];
      state.orderRows = [{ id: 1, profilId: 1, eni: '', boy: '', soni: 1, tur: 'yonga' }];
      state.cuttingRows = [];
      saqlaMoliya(DEFAULT_MOLIYA);
      saqlaOmbor(DEFAULT_OMBOR);
      showToast('Barcha ma\'lumotlar tozalandi! Tizim 0 da.', '🗑️');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    }
  });

  // Dastlabki render
  updateKursDisplay();
  renderOrderRows();
  renderCuttingOrderRows();
  runCuttingLogic(false);
  updateQuickCalc();
  updateCrmDatalist();
});
