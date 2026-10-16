// =====================================================
// GAMING TOP-UP PLATFORM - ADMIN PANEL SCRIPT
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    token: sessionStorage.getItem('adminToken') || '',
    orders: [],
    stats: {},
    settings: {},
    packs: { freefire: [], bgmi: [] },
    filterStatus: 'all',
    filterGame: 'all',
    autoRefreshTimer: null,
    knownOrderCount: 0
  };

  // DOM Elements
  const loginOverlay = document.getElementById('admin-login-overlay');
  const loginForm = document.getElementById('admin-login-form');
  const loginPinInput = document.getElementById('login-pin');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  // Tabs
  const navTabs = document.querySelectorAll('.nav-tab-btn');
  const tabOrders = document.getElementById('tab-orders-content');
  const tabSettings = document.getElementById('tab-settings-content');
  const tabPacks = document.getElementById('tab-packs-content');

  // Orders DOM
  const ordersList = document.getElementById('orders-list');
  const filterStatusSelect = document.getElementById('filter-status');
  const filterGameSelect = document.getElementById('filter-game');
  const manualRefreshBtn = document.getElementById('manual-refresh-btn');

  // Stats DOM
  const statPending = document.getElementById('stat-pending');
  const statCompleted = document.getElementById('stat-completed');
  const statTotal = document.getElementById('stat-total');
  const statRevenue = document.getElementById('stat-revenue');

  // Settings DOM
  const settingsForm = document.getElementById('settings-form');
  const inputUpiId = document.getElementById('input-upi-id');
  const inputMerchantName = document.getElementById('input-merchant-name');
  const inputWhatsapp = document.getElementById('input-whatsapp');
  const inputNotice = document.getElementById('input-notice');
  const inputAnnouncement = document.getElementById('input-announcement');
  const inputNewPin = document.getElementById('input-new-pin');
  const qrUploadInput = document.getElementById('qr-upload-input');
  const currentQrImg = document.getElementById('current-qr-img');

  // Packs DOM
  const ffPacksList = document.getElementById('ff-packs-list');
  const bgmiPacksList = document.getElementById('bgmi-packs-list');
  const savePacksBtn = document.getElementById('save-packs-btn');
  const addFfPackBtn = document.getElementById('add-ff-pack-btn');
  const addBgmiPackBtn = document.getElementById('add-bgmi-pack-btn');

  // Screenshot Preview Modal
  const imageModal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');
  const closeModalBtn = document.getElementById('close-img-modal');

  // Notification sound
  const playNewOrderBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  // Toast
  const showAdminToast = (msg, isErr = false) => {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      toast.style.cssText = `
        position: fixed; top: 18px; right: 18px; z-index: 9999;
        padding: 10px 18px; border-radius: 8px; font-weight: 700;
        font-size: 0.82rem; color: #fff; background: rgba(14, 21, 38, 0.95);
        border: 1px solid ${isErr ? 'var(--accent-orange)' : 'var(--accent-cyan)'};
        box-shadow: 0 4px 20px rgba(0,0,0,0.5); transition: opacity 0.3s;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 2500);
  };

  // Auth Headers helper
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${state.token}`
  });

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = loginPinInput.value.trim();
    if (!pin) return;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        state.token = data.token;
        sessionStorage.setItem('adminToken', data.token);
        loginOverlay.style.display = 'none';
        loginError.style.display = 'none';
        initDashboard();
      } else {
        loginError.textContent = data.error || 'Incorrect PIN';
        loginError.style.display = 'block';
      }
    } catch (err) {
      loginError.textContent = 'Network error during login';
      loginError.style.display = 'block';
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminToken');
    state.token = '';
    clearInterval(state.autoRefreshTimer);
    loginOverlay.style.display = 'flex';
  });

  // Check login on load
  if (state.token) {
    loginOverlay.style.display = 'none';
    initDashboard();
  } else {
    loginOverlay.style.display = 'flex';
  }

  // Tab switching
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      tabOrders.style.display = target === 'orders' ? 'block' : 'none';
      tabSettings.style.display = target === 'settings' ? 'block' : 'none';
      tabPacks.style.display = target === 'packs' ? 'block' : 'none';
    });
  });

  // Dashboard Initialization
  function initDashboard() {
    loadStats();
    loadOrders();
    loadSettings();
    loadPacks();

    // Auto-refresh orders every 8 seconds
    clearInterval(state.autoRefreshTimer);
    state.autoRefreshTimer = setInterval(() => {
      loadStats();
      loadOrders(true);
    }, 8000);
  }

  // Load Stats
  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats', { headers: authHeaders() });
      if (res.status === 401) return logoutBtn.click();
      const stats = await res.json();
      state.stats = stats;

      statPending.textContent = stats.pendingOrders || 0;
      statCompleted.textContent = stats.completedOrders || 0;
      statTotal.textContent = stats.totalOrders || 0;
      statRevenue.textContent = `₹${stats.totalRevenue || 0}`;
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  }

  // Load Orders
  async function loadOrders(isBackground = false) {
    try {
      const url = `/api/admin/orders?status=${state.filterStatus}&game=${state.filterGame}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 401) return logoutBtn.click();
      const data = await res.json();
      const newOrders = data.orders || [];

      // Check for new incoming order sound
      if (isBackground && newOrders.length > state.knownOrderCount) {
        playNewOrderBeep();
        showAdminToast('🔔 NEW ORDER RECEIVED!');
      }
      state.knownOrderCount = newOrders.length;
      state.orders = newOrders;

      renderOrdersList();
    } catch (e) {
      console.warn('Failed to load orders:', e);
    }
  }

  // Render Orders
  function renderOrdersList() {
    if (state.orders.length === 0) {
      ordersList.innerHTML = `
        <div style="background: var(--admin-card); padding: 30px; text-align: center; border-radius: var(--radius-md); color: var(--text-muted);">
          No orders found matching filters.
        </div>
      `;
      return;
    }

    ordersList.innerHTML = state.orders.map(order => {
      const isFF = order.game === 'freefire';
      const createdDate = new Date(order.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      // Customer WhatsApp Message Pre-filled text
      const waMessage = encodeURIComponent(
        `Namaste ${order.playerName}! 👋\nLootZone India se aapka top-up order #${order.id} (${order.totalItems} ${order.itemType}) for UID: ${order.uid} successfully COMPLETED ho gaya hai! ✅\nApna game account check karein. Thank you for choosing LootZone India!`
      );
      const waLink = `https://wa.me/91${order.phone.replace(/\D/g, '')}?text=${waMessage}`;

      return `
        <div class="order-card ${order.status}" id="order-card-${order.id}">
          <div class="order-card-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="order-id-badge">#${order.id}</span>
              <span class="game-tag ${order.game}">${isFF ? '🔥 Free Fire MAX' : '🪖 BGMI'}</span>
              <span style="font-size: 0.72rem; color: var(--text-muted);">${createdDate}</span>
            </div>
            <span class="status-pill ${order.status}">${order.status}</span>
          </div>

          <div class="order-details-grid">
            <!-- Player UID with ONE CLICK COPY -->
            <div class="detail-item">
              <span class="detail-label">Player UID (Top-Up ID)</span>
              <div class="uid-action-box">
                <span class="uid-num">${order.uid}</span>
                <button class="copy-uid-btn" onclick="copyOrderUid('${order.uid}', this)">📋 COPY UID</button>
              </div>
            </div>

            <!-- Player Name & Phone -->
            <div class="detail-item">
              <span class="detail-label">Player Name</span>
              <div class="detail-value">${order.playerName || 'Gamer'}</div>
            </div>

            <div class="detail-item">
              <span class="detail-label">WhatsApp Contact</span>
              <div class="detail-value" style="color: var(--accent-cyan); font-family: var(--font-mono);">${order.phone}</div>
            </div>

            <!-- Pack & Price -->
            <div class="detail-item">
              <span class="detail-label">Package Plan</span>
              <div class="detail-value" style="color: var(--accent-gold); font-weight: 700;">
                ${order.totalItems} ${order.itemType} (${order.itemsAmount}+${order.bonusAmount} Free)
              </div>
            </div>

            <div class="detail-item">
              <span class="detail-label">Amount Paid</span>
              <div class="detail-value" style="font-family: var(--font-gaming); font-size: 1.15rem; color: var(--accent-green);">
                ₹${order.price}
              </div>
            </div>

            <!-- UTR & Payment Proof -->
            <div class="detail-item">
              <span class="detail-label">Payment UTR / Ref</span>
              <div class="detail-value" style="font-family: var(--font-mono); font-size: 0.8rem;">
                ${order.utr ? order.utr : '<span style="color: #64748b;">Not provided</span>'}
                ${order.screenshotUrl ? `<button class="btn btn-secondary" style="padding: 2px 6px; font-size: 0.65rem; margin-left: 6px;" onclick="viewScreenshot('${order.screenshotUrl}')">🖼️ View Slip</button>` : ''}
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="order-actions-bar">
            <!-- Left: Direct WhatsApp Button -->
            <a href="${waLink}" target="_blank" class="btn btn-wa" title="Open chat with player">
              💬 WhatsApp Customer
            </a>

            <!-- Right: Status management -->
            <div class="status-buttons">
              ${order.status !== 'completed' ? `
                <button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'completed')">
                  ✅ Mark Completed
                </button>
              ` : ''}

              ${order.status !== 'pending' ? `
                <button class="btn btn-secondary" onclick="updateOrderStatus('${order.id}', 'pending')">
                  ⏳ Reopen
                </button>
              ` : ''}

              ${order.status !== 'rejected' ? `
                <button class="btn btn-danger" onclick="updateOrderStatus('${order.id}', 'rejected')">
                  ❌ Reject
                </button>
              ` : ''}

              <button class="btn btn-secondary" style="color: #ef4444;" onclick="deleteOrder('${order.id}')" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Global functions exposed for onclick inline handlers
  window.copyOrderUid = (uid, btnElement) => {
    navigator.clipboard.writeText(uid).then(() => {
      showAdminToast(`UID Copied: ${uid}`);
      const oldText = btnElement.textContent;
      btnElement.textContent = 'COPIED! ✅';
      btnElement.style.background = '#00ff88';
      setTimeout(() => {
        btnElement.textContent = oldText;
        btnElement.style.background = '';
      }, 1500);
    });
  };

  window.viewScreenshot = (url) => {
    modalImg.src = url;
    imageModal.style.display = 'flex';
  };

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      imageModal.style.display = 'none';
    });
  }

  window.updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showAdminToast(`Order #${orderId} marked as ${newStatus}`);
        loadStats();
        loadOrders();
      }
    } catch (e) {
      showAdminToast('Failed to update status', true);
    }
  };

  window.deleteOrder = async (orderId) => {
    if (!confirm(`Are you sure you want to delete order #${orderId}?`)) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.ok) {
        showAdminToast(`Order #${orderId} deleted`);
        loadStats();
        loadOrders();
      }
    } catch (e) {
      showAdminToast('Failed to delete order', true);
    }
  };

  // Filter events
  filterStatusSelect.addEventListener('change', () => {
    state.filterStatus = filterStatusSelect.value;
    loadOrders();
  });

  filterGameSelect.addEventListener('change', () => {
    state.filterGame = filterGameSelect.value;
    loadOrders();
  });

  manualRefreshBtn.addEventListener('click', () => {
    manualRefreshBtn.textContent = '🔄 Refreshing...';
    loadStats();
    loadOrders().then(() => {
      setTimeout(() => { manualRefreshBtn.textContent = '🔄 Refresh'; }, 400);
    });
  });

  // Settings: Load Settings
  async function loadSettings() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      state.settings = data.settings || {};

      inputUpiId.value = state.settings.upiId || '';
      inputMerchantName.value = state.settings.merchantName || '';
      inputWhatsapp.value = state.settings.whatsappSupport || '';
      inputNotice.value = state.settings.deliveryNotice || '';
      inputAnnouncement.value = state.settings.announcement || '';

      const qrStatusText = document.getElementById('qr-status-text');
      const btnRemoveQr = document.getElementById('btn-remove-qr');

      if (state.settings.customQrUrl && state.settings.customQrUrl.trim() !== '') {
        currentQrImg.src = `${state.settings.customQrUrl}?_t=${Date.now()}`;
        if (qrStatusText) qrStatusText.textContent = '✅ Custom Uploaded QR Code Active';
        if (btnRemoveQr) btnRemoveQr.style.display = 'inline-flex';
      } else {
        // Fallback to generated QR
        const qrRes = await fetch(`/api/qr?amount=100&_t=${Date.now()}`);
        const qrData = await qrRes.json();
        currentQrImg.src = qrData.qrDataUrl || '/assets/diamond.jpg';
        if (qrStatusText) qrStatusText.textContent = '⚡ Auto-Generated Dynamic UPI QR Active';
        if (btnRemoveQr) btnRemoveQr.style.display = 'none';
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  // Settings: Save Settings Form
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      upiId: inputUpiId.value.trim(),
      merchantName: inputMerchantName.value.trim(),
      whatsappSupport: inputWhatsapp.value.trim(),
      deliveryNotice: inputNotice.value.trim(),
      announcement: inputAnnouncement.value.trim()
    };

    if (inputNewPin.value.trim()) {
      payload.adminPin = inputNewPin.value.trim();
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        sessionStorage.removeItem('adminToken');
        state.token = '';
        loginOverlay.style.display = 'flex';
        loginError.textContent = 'Session expired. Please log in with password: LootZone@Admin#2026!';
        loginError.style.display = 'block';
        return;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        showAdminToast('Settings & UPI ID updated successfully!');
        if (payload.adminPin) {
          state.token = payload.adminPin;
          sessionStorage.setItem('adminToken', payload.adminPin);
          inputNewPin.value = '';
        }
        loadSettings();
      } else {
        showAdminToast(data.error || 'Failed to save settings', true);
      }
    } catch (err) {
      showAdminToast('Network error saving settings', true);
    }
  });

  // Settings: Custom QR Image File Upload
  qrUploadInput.addEventListener('change', async () => {
    const file = qrUploadInput.files[0];
    if (!file) return;

    // Instant local preview
    currentQrImg.src = URL.createObjectURL(file);
    const qrStatusText = document.getElementById('qr-status-text');
    if (qrStatusText) qrStatusText.textContent = '⏳ Uploading to server...';

    const formData = new FormData();
    formData.append('qrImage', file);

    try {
      showAdminToast('Uploading custom QR Code image...');
      const res = await fetch('/api/admin/upload-qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        },
        body: formData
      });

      if (res.status === 401) {
        sessionStorage.removeItem('adminToken');
        state.token = '';
        loginOverlay.style.display = 'flex';
        loginError.textContent = 'Session expired. Please log in with password: LootZone@Admin#2026!';
        loginError.style.display = 'block';
        return;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        currentQrImg.src = `${data.customQrUrl}?_t=${Date.now()}`;
        if (qrStatusText) qrStatusText.textContent = '✅ Custom Uploaded QR Code Active';
        const btnRemoveQr = document.getElementById('btn-remove-qr');
        if (btnRemoveQr) btnRemoveQr.style.display = 'inline-flex';
        showAdminToast('Custom QR Code applied and live on payment page!');
      } else {
        showAdminToast(data.error || 'Upload failed', true);
        loadSettings();
      }
    } catch (err) {
      showAdminToast('Error uploading QR code', true);
      loadSettings();
    }
  });

  // Remove / Reset Custom QR Image button
  const btnRemoveQr = document.getElementById('btn-remove-qr');
  if (btnRemoveQr) {
    btnRemoveQr.addEventListener('click', async () => {
      if (!confirm('Revert to automatic Dynamic UPI QR Code?')) return;

      try {
        const res = await fetch('/api/admin/reset-qr', {
          method: 'POST',
          headers: authHeaders()
        });

        if (res.status === 401) {
          sessionStorage.removeItem('adminToken');
          state.token = '';
          loginOverlay.style.display = 'flex';
          loginError.textContent = 'Session expired. Please log in again.';
          loginError.style.display = 'block';
          return;
        }

        const data = await res.json();
        if (res.ok && data.success) {
          showAdminToast('Switched to Dynamic UPI QR Code!');
          qrUploadInput.value = '';
          loadSettings();
        } else {
          showAdminToast(data.error || 'Failed to remove QR', true);
        }
      } catch (err) {
        showAdminToast('Error resetting QR code', true);
      }
    });
  }

  // Packs & Pricing Management
  async function loadPacks() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      state.packs = data.packs || { freefire: [], bgmi: [] };
      renderPacksManager();
    } catch (e) {
      console.warn('Failed to load packs:', e);
    }
  }

  function renderPacksManager() {
    // Free Fire Packs editor
    ffPacksList.innerHTML = (state.packs.freefire || []).map((p, idx) => `
      <div class="stat-card" style="margin-bottom: 10px; position: relative;" data-index="${idx}">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
          <div>
            <label class="detail-label">Base Diamonds</label>
            <input type="number" class="form-control pack-amt" value="${p.amount}">
          </div>
          <div>
            <label class="detail-label">Bonus Diamonds</label>
            <input type="number" class="form-control pack-bonus" value="${p.bonus}">
          </div>
          <div>
            <label class="detail-label">Price (₹)</label>
            <input type="number" class="form-control pack-price" value="${p.price}">
          </div>
          <div>
            <label class="detail-label">Badge Tag</label>
            <input type="text" class="form-control pack-badge" value="${p.badge || ''}">
          </div>
        </div>
        <button type="button" class="btn btn-danger" style="margin-top: 8px; font-size: 0.7rem; padding: 4px 8px;" onclick="removePack('freefire', ${idx})">
          Remove Pack
        </button>
      </div>
    `).join('');

    // BGMI Packs editor
    bgmiPacksList.innerHTML = (state.packs.bgmi || []).map((p, idx) => `
      <div class="stat-card" style="margin-bottom: 10px; position: relative;" data-index="${idx}">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
          <div>
            <label class="detail-label">Base UC</label>
            <input type="number" class="form-control pack-amt" value="${p.amount}">
          </div>
          <div>
            <label class="detail-label">Bonus UC</label>
            <input type="number" class="form-control pack-bonus" value="${p.bonus}">
          </div>
          <div>
            <label class="detail-label">Price (₹)</label>
            <input type="number" class="form-control pack-price" value="${p.price}">
          </div>
          <div>
            <label class="detail-label">Badge Tag</label>
            <input type="text" class="form-control pack-badge" value="${p.badge || ''}">
          </div>
        </div>
        <button type="button" class="btn btn-danger" style="margin-top: 8px; font-size: 0.7rem; padding: 4px 8px;" onclick="removePack('bgmi', ${idx})">
          Remove Pack
        </button>
      </div>
    `).join('');
  }

  window.removePack = (game, index) => {
    state.packs[game].splice(index, 1);
    renderPacksManager();
  };

  addFfPackBtn.addEventListener('click', () => {
    state.packs.freefire.push({
      id: `ff-${Date.now()}`,
      name: 'Custom Diamond Pack',
      amount: 100,
      bonus: 50,
      total: 150,
      price: 80,
      badge: 'NEW',
      popular: false
    });
    renderPacksManager();
  });

  addBgmiPackBtn.addEventListener('click', () => {
    state.packs.bgmi.push({
      id: `bgmi-${Date.now()}`,
      name: 'Custom UC Pack',
      amount: 120,
      bonus: 60,
      total: 180,
      price: 150,
      badge: 'NEW',
      popular: false
    });
    renderPacksManager();
  });

  savePacksBtn.addEventListener('click', async () => {
    // Collect edited values from DOM
    const ffCards = ffPacksList.querySelectorAll('.stat-card');
    ffCards.forEach((card, idx) => {
      const amt = Number(card.querySelector('.pack-amt').value);
      const bonus = Number(card.querySelector('.pack-bonus').value);
      const price = Number(card.querySelector('.pack-price').value);
      const badge = card.querySelector('.pack-badge').value.trim();

      if (state.packs.freefire[idx]) {
        state.packs.freefire[idx].amount = amt;
        state.packs.freefire[idx].bonus = bonus;
        state.packs.freefire[idx].total = amt + bonus;
        state.packs.freefire[idx].price = price;
        state.packs.freefire[idx].badge = badge;
      }
    });

    const bgmiCards = bgmiPacksList.querySelectorAll('.stat-card');
    bgmiCards.forEach((card, idx) => {
      const amt = Number(card.querySelector('.pack-amt').value);
      const bonus = Number(card.querySelector('.pack-bonus').value);
      const price = Number(card.querySelector('.pack-price').value);
      const badge = card.querySelector('.pack-badge').value.trim();

      if (state.packs.bgmi[idx]) {
        state.packs.bgmi[idx].amount = amt;
        state.packs.bgmi[idx].bonus = bonus;
        state.packs.bgmi[idx].total = amt + bonus;
        state.packs.bgmi[idx].price = price;
        state.packs.bgmi[idx].badge = badge;
      }
    });

    try {
      const res = await fetch('/api/admin/packs', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ packs: state.packs })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAdminToast('Prices & Packs updated successfully!');
      } else {
        showAdminToast('Failed to save packs', true);
      }
    } catch (e) {
      showAdminToast('Error saving packs', true);
    }
  });

});
