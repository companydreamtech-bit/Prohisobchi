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
  generatsiyaDetallar
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

const DEFAULT_PROFILLAR = [
  { id: 1, nom: 'Rom (Kichik)', chakanaNarx: 23, dilerNarx: 20, minNarx: true, tur: 'kichik' },
  { id: 2, nom: 'Eshik (Katta)', chakanaNarx: 28, dilerNarx: 24, minNarx: false, tur: 'katta' },
  { id: 3, nom: 'Setka profil (Universal)', chakanaNarx: 18, dilerNarx: 15, minNarx: false, tur: 'haytek' }
];

// Telegram foydalanuvchi ID si orqali ko'p foydalanuvchili xotira
const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'default';
const storagePrefix = `prohisobchi_${telegramUserId}_`;

let state = {
  kurs: parseFloat(localStorage.getItem('prohisobchi_kurs')) || 12900,
  currentScreen: 'home',
  theme: localStorage.getItem('prohisobchi_theme') || 'light',
  profillar: JSON.parse(localStorage.getItem(storagePrefix + 'profillar')) || DEFAULT_PROFILLAR,
  brendlar: getProfilBrendlari(),
  selectedBrendId: 'standart',
  buyurtmalar: JSON.parse(localStorage.getItem(storagePrefix + 'buyurtmalar')) || [
    {
      id: 1048,
      sana: 'Bugun 14:30',
      mijozIsm: 'Alisher aka',
      mijozTel: '+998 90 987 65 43',
      rang: 'OQ',
      brendId: 'akfa',
      status: 'Tayyor',
      jamiSoni: 3,
      jamiM2: 3.84,
      jamiUsd: 35.00,
      jamiSom: 450000,
      tolovHolati: 'To\'landi (Kassa)',
      qatorlar: [
        { id: 1, profilId: 1, eni: 60, boy: 140, soni: 2, tur: 'yonga' },
        { id: 2, profilId: 1, eni: 80, boy: 210, soni: 1, tur: 'eshik' }
      ]
    },
    {
      id: 1047,
      sana: 'Kecha 17:15',
      mijozIsm: 'Rustam aka',
      mijozTel: '+998 93 111 22 33',
      rang: 'MOKKO',
      brendId: 'ekapen',
      status: 'Jarayonda',
      jamiSoni: 2,
      jamiM2: 2.10,
      jamiUsd: 17.00,
      jamiSom: 220000,
      tolovHolati: 'Nasiya (Qarz)',
      qatorlar: [
        { id: 1, profilId: 1, eni: 55, boy: 135, soni: 2, tur: 'yonga' }
      ]
    }
  ],
  orderRows: [
    { id: 1, profilId: 1, eni: '51.5', boy: '153.0', soni: 1, tur: 'yonga' }
  ],
  cuttingRows: [
    { id: 1, profilId: 1, eni: '60', boy: '140', soni: 2, tur: 'yonga' }
  ],
  cuttingSelectedBrendId: 'standart',
  orderNarxTuri: 'chakana',
  orderTolovTuri: 'Naqd',
  nextRowId: 2,
  qc: {
    profilTur: 'kichik',
    narxTuri: 'chakana',
    eni: 60,
    boy: 140,
    soni: 1
  },
  lastCuttingResult: null,
  activeModalOrder: null,
  kassaModalType: 'kirim',
  qarzModalType: 'haqqim'
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

      <!-- Konstruksiya chiplari -->
      <div class="konstruksiya-chips-flow">
        ${Object.values(KONSTRUKSIYA_TURLARI).map(k => `
          <button type="button" class="konstruksiya-chip-btn ${row.tur === k.id ? 'active' : ''}" data-rowid="${row.id}" data-tur="${k.id}">
            <span>${k.belgi}</span> <span>${k.nom}</span>
          </button>
        `).join('')}
      </div>

      <!-- 3 ta input: Eni, Bo'yi, Soni -->
      <div class="order-row-nums">
        <div>
          <label style="font-size:9px;font-weight:700;color:var(--text-muted);display:block;text-align:center;">ENI (sm)</label>
          <input type="number" step="0.1" class="inp-eni" data-id="${row.id}" value="${row.eni}" placeholder="51.5">
        </div>
        <div>
          <label style="font-size:9px;font-weight:700;color:var(--text-muted);display:block;text-align:center;">BO'YI (sm)</label>
          <input type="number" step="0.1" class="inp-boy" data-id="${row.id}" value="${row.boy}" placeholder="153.0">
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

  const tanlanganBrend = state.brendlar.find(b => b.id === brendId) || state.brendlar[0];
  const calc = hisoblaBuyurtmaNarxi(validRows, state.profillar, state.kurs, state.orderNarxTuri, true);
  const detallar = generatsiyaDetallar(validRows, tanlanganBrend);
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
    qatorlar: validRows,
    detallar,
    bom
  };

  state.buyurtmalar.unshift(newOrder);
  localStorage.setItem(storagePrefix + 'buyurtmalar', JSON.stringify(state.buyurtmalar));

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
          <input type="number" step="0.1" class="inp-cut-eni" data-id="${row.id}" value="${row.eni}" placeholder="60">
        </div>
        <div>
          <label style="font-size:9px;font-weight:700;color:var(--text-muted);display:block;text-align:center;">BO'YI (sm)</label>
          <input type="number" step="0.1" class="inp-cut-boy" data-id="${row.id}" value="${row.boy}" placeholder="140">
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

function runCuttingLogic(showToastMsg = false) {
  const validRows = (state.cuttingRows || []).filter(r => parseFloat(r.eni) > 0 && parseFloat(r.boy) > 0);
  const barsContainer = document.getElementById('cuttingVisualBarsContainer');

  if (validRows.length === 0) {
    document.getElementById('cutStatTotalBars').textContent = '0 ta';
    document.getElementById('cutStatEfficiency').textContent = '0%';
    document.getElementById('cutStatWaste').textContent = '0 sm';
    if (barsContainer) {
      barsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">Kesish hisoblash uchun yuqoridagi maydonlarga ENI va BO\'YI o\'lchamlarini kiriting yoki "Buyurtmadan olish" tugmasini bosing.</div>';
    }
    if (showToastMsg) showToast('Avval o\'lchamlarni kiriting!', '⚠️');
    return;
  }

  const tanlanganBrend = state.brendlar.find(b => b.id === (state.cuttingSelectedBrendId || state.selectedBrendId)) || state.brendlar[0];
  const detallar = generatsiyaDetallar(validRows, tanlanganBrend);

  const useStock = document.getElementById('cutUseStockSwitch')?.checked ?? true;
  let omborQoldiqlari = {};
  if (useStock) {
    const ombor = getOmbor();
    omborQoldiqlari = {
      kichikRom: ombor.yaroqliQoldiqlar.map(q => q.uzunlik),
      kattaEshik: ombor.yaroqliQoldiqlar.map(q => q.uzunlik)
    };
  }

  const guruhlangan = hisoblaGuruhlanganRaskroy(detallar, STANDART_PROFIL_UZUNLIGI, omborQoldiqlari, tanlanganBrend.arra || ARRA_QALINLIGI);
  state.lastCuttingResult = guruhlangan;

  document.getElementById('cutStatTotalBars').textContent = `${guruhlangan.jamiTayoqlarBarcha} ta`;
  document.getElementById('cutStatEfficiency').textContent = `${guruhlangan.umumiySamaradorlik}%`;
  document.getElementById('cutStatWaste').textContent = `${guruhlangan.jamiIsrofBarcha} sm`;

  if (barsContainer) {
    barsContainer.innerHTML = '';
    const colors = ['#10B981', '#059669', '#34D399', '#0D3B2C', '#3B82F6', '#8B5CF6'];

    guruhlangan.guruhNatijalar.forEach(g => {
      const groupHeader = document.createElement('div');
      groupHeader.className = 'profile-group-header';
      groupHeader.innerHTML = `
        <span>📌 ${g.nom}</span>
        <span style="font-family:var(--font-mono); color:var(--brand-emerald);">${g.natija.jamiTayoqSoni} ta 6m tayoq (${g.natija.samaradorlikFoiz}%)</span>
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

  const profil = state.profillar.find(p => p.tur === state.qc.profilTur) || state.profillar[0];
  const narxM2 = state.qc.narxTuri === 'diler' ? (profil.dilerNarx || profil.narx) : (profil.chakanaNarx || profil.narx);

  const bittaM2 = hisoblaM2(w, h);
  const totalM2 = bittaM2 * soni;
  const totalUsd = totalM2 * narxM2;
  const totalSom = totalUsd * state.kurs;

  document.getElementById('qcCounterVal').textContent = soni;
  document.getElementById('qcResultM2').textContent = `${totalM2.toFixed(2)} m²`;
  document.getElementById('qcResultUsd').textContent = `${totalUsd.toFixed(2)} $`;
  document.getElementById('qcResultSom').textContent = `${formatSom(totalSom)} so'm`;
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
      tbl.innerHTML += `
        <div style="padding:10px 0;border-bottom:1px solid var(--border-card);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:700;font-size:13px;">${p.nom}</div>
            <div style="font-size:11px;color:var(--text-muted);">Chakana: $${p.chakanaNarx} • Diler: $${p.dilerNarx}</div>
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

  const tg = getTelegramConfig();
  const tokenInp = document.getElementById('cfgBotTokenInput');
  const chatInp = document.getElementById('cfgChatIdInput');
  if (tokenInp) tokenInp.value = tg.botToken || '';
  if (chatInp) chatInp.value = tg.chatId || '';
}

// Buyurtmalar tarixini Excel (CSV) eksport qilish
function exportOrdersHistoryCsv() {
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
  eksportCSV(`buyurtmalar_${sana}.csv`, sarlavhalar, qatorlar);
  showToast('Buyurtmalar Excel (CSV) ga yuklandi!', '📊');
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

  // Kurs yangilash
  document.getElementById('btnUpdateKursHome')?.addEventListener('click', async () => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data?.rates?.UZS) {
        state.kurs = Math.round(data.rates.UZS);
        localStorage.setItem('prohisobchi_kurs', state.kurs);
        document.getElementById('headerKursVal').textContent = formatSom(state.kurs);
        updateOrderSummary();
        showToast(`Kurs yangilandi: 1$ = ${formatSom(state.kurs)} so'm`, '💱');
      }
    } catch (e) {
      showToast('Kursni olishda xatolik!', '⚠️');
    }
  });

  // Yangi buyurtma
  document.getElementById('tabChakanaMode')?.addEventListener('click', () => {
    state.orderNarxTuri = 'chakana';
    document.getElementById('tabChakanaMode').classList.add('active');
    document.getElementById('tabDilerMode').classList.remove('active');
    updateOrderSummary();
  });

  document.getElementById('tabDilerMode')?.addEventListener('click', () => {
    state.orderNarxTuri = 'diler';
    document.getElementById('tabDilerMode').classList.add('active');
    document.getElementById('tabChakanaMode').classList.remove('active');
    updateOrderSummary();
  });

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
    if (state.lastCuttingResult) {
      try {
        const tanlanganBrend = state.brendlar.find(b => b.id === (state.cuttingSelectedBrendId || state.selectedBrendId)) || state.brendlar[0];
        const dummy = {
          id: 'RASKROY',
          sana: new Date().toLocaleTimeString('ru-RU'),
          mijozIsm: 'Kesish Sexi',
          rang: 'OQ',
          detallar: generatsiyaDetallar(validRows, tanlanganBrend)
        };
        await buyurtmaniGuruhgaYubor(dummy, state.lastCuttingResult, hisoblaBOM(dummy.detallar));
        showToast('Sex guruhiga yuborildi!', '✈️');
      } catch (e) {
        alert(e.message);
      }
    }
  });

  document.getElementById('btnCopyCuttingClipboard')?.addEventListener('click', () => {
    const validRows = (state.cuttingRows || []).filter(r => parseFloat(r.eni) > 0 && parseFloat(r.boy) > 0);
    if (validRows.length === 0) {
      showToast('Avval kesish o\'lchamlarini kiriting!', '⚠️');
      return;
    }
    if (state.lastCuttingResult) {
      const tanlanganBrend = state.brendlar.find(b => b.id === (state.cuttingSelectedBrendId || state.selectedBrendId)) || state.brendlar[0];
      const msg = generatsiyaIshchiXabari(
        { id: 'KESISH', sana: new Date().toLocaleDateString(), rang: 'OQ', detallar: generatsiyaDetallar(validRows, tanlanganBrend) },
        state.lastCuttingResult,
        null
      );
      klipbordgaNusxala(msg);
      showToast('Kesish xaritasi nusxalandi!', '📋');
    }
  });

  document.getElementById('btnRecalculateCut')?.addEventListener('click', () => runCuttingLogic(true));
  document.getElementById('btnPrintCuttingPdf')?.addEventListener('click', () => window.print());

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

  document.getElementById('btnExportKassaCsv')?.addEventListener('click', () => {
    eksportKassaCSV();
    showToast('Kassa Excel (CSV) ga yuklandi!', '📊');
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

    document.getElementById('modalQarzOverlay').classList.remove('active');
    renderQarzScreen();
    showToast('Qarz daftariga yozildi!', '📒');
  });

  document.getElementById('btnExportQarzCsv')?.addEventListener('click', () => {
    eksportQarzCSV();
    showToast('Qarzlar Excel (CSV) ga yuklandi!', '📊');
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

  // Dastlabki render
  const headerKurs = document.getElementById('headerKursVal');
  if (headerKurs) headerKurs.textContent = formatSom(state.kurs);
  renderOrderRows();
  renderCuttingOrderRows();
  runCuttingLogic(false);
  updateQuickCalc();
  updateCrmDatalist();
});
