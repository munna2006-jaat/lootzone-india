// =====================================================
// GAMING TOP-UP PLATFORM - FRONTEND APPLICATION SCRIPT
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    currentGame: 'freefire',
    selectedPack: null,
    packsData: { freefire: [], bgmi: [] },
    settings: {},
    scene3D: null,
    audioEnabled: true
  };

  // DOM Elements
  const canvasContainer = document.getElementById('canvas3d-container');
  const gameTabFF = document.getElementById('tab-freefire');
  const gameTabBGMI = document.getElementById('tab-bgmi');
  const gameBadgeTag = document.getElementById('game-badge-tag');
  const bonusTag = document.getElementById('bonus-tag');
  const tickerText = document.getElementById('ticker-text');
  const packsContainer = document.getElementById('packs-container');
  const orderSummaryBox = document.getElementById('order-summary-box');
  const qrImage = document.getElementById('qr-image');
  const qrAmountBadge = document.getElementById('qr-amount-badge');
  const upiIdDisplay = document.getElementById('upi-id-display');
  const copyUpiBtn = document.getElementById('copy-upi-btn');
  const upiPaytmBtn = document.getElementById('upi-paytm');
  const upiPhonepeBtn = document.getElementById('upi-phonepe');
  const upiGpayBtn = document.getElementById('upi-gpay');
  const upiBhimBtn = document.getElementById('upi-bhim');
  const orderForm = document.getElementById('topup-order-form');
  const uidInput = document.getElementById('player-uid');
  const nameInput = document.getElementById('player-name');
  const phoneInput = document.getElementById('player-phone');
  const utrInput = document.getElementById('payment-utr');
  const screenshotInput = document.getElementById('payment-screenshot');
  const submitBtn = document.getElementById('submit-order-btn');
  const liveToast = document.getElementById('live-toast-ticker');

  // Modals
  const successModal = document.getElementById('success-modal');
  const trackModal = document.getElementById('track-modal');
  const openTrackBtn = document.getElementById('open-track-btn');
  const closeSuccessBtn = document.getElementById('close-success-btn');
  const closeTrackBtn = document.getElementById('close-track-btn');
  const trackSubmitBtn = document.getElementById('track-submit-btn');
  const trackInput = document.getElementById('track-input');
  const trackResults = document.getElementById('track-results');

  // Audio synthesizer for cyber clicks
  const playCyberSound = (type = 'click') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'select') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio not permitted yet
    }
  };

  // Toast Notification
  const showToast = (message) => {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  // Initialize 3D Graphics
  if (window.Gaming3DScene && canvasContainer) {
    try {
      state.scene3D = new Gaming3DScene('canvas3d-container');
    } catch (err) {
      console.warn('3D canvas fallback:', err);
    }
  }

  // Fetch Configurations & Packs
  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      state.packsData = data.packs || { freefire: [], bgmi: [] };
      state.settings = data.settings || {};

      if (state.settings.announcement && tickerText) {
        tickerText.textContent = state.settings.announcement;
      }

      if (state.settings.whatsappSupport) {
        const floatWa = document.getElementById('floating-whatsapp');
        if (floatWa) {
          floatWa.href = `https://wa.me/${state.settings.whatsappSupport}?text=${encodeURIComponent('Hello! I want help with my Top-Up order.')}`;
        }
      }

      renderPacks();
    } catch (err) {
      console.error('Error fetching config:', err);
      showToast('Offline mode loaded');
    }
  };

  // Switch Game Tab
  const switchGame = (game) => {
    state.currentGame = game;
    playCyberSound('click');

    if (game === 'freefire') {
      gameTabFF.classList.add('active');
      gameTabBGMI.classList.remove('active');
      gameBadgeTag.textContent = '🔥 FREE FIRE MAX 3D';
      bonusTag.textContent = '⚡ 1000+2000 PROMO';
      bonusTag.className = 'hero-tag orange';
      uidInput.placeholder = 'Enter 10-Digit Free Fire UID (e.g. 1849204819)';
      document.getElementById('uid-label-text').textContent = 'Free Fire Player UID';
    } else {
      gameTabBGMI.classList.add('active');
      gameTabFF.classList.remove('active');
      gameBadgeTag.textContent = '🪖 BGMI BATTLEGROUNDS';
      bonusTag.textContent = '👑 VIP 3000+4000 UC';
      bonusTag.className = 'hero-tag cyan';
      uidInput.placeholder = 'Enter BGMI Character ID (e.g. 5183928419)';
      document.getElementById('uid-label-text').textContent = 'BGMI Character ID';
    }

    if (state.scene3D) {
      state.scene3D.setGame(game);
    }

    renderPacks();
  };

  gameTabFF.addEventListener('click', () => switchGame('freefire'));
  gameTabBGMI.addEventListener('click', () => switchGame('bgmi'));

  // Render Packs Grid
  const renderPacks = () => {
    const list = state.packsData[state.currentGame] || [];
    packsContainer.innerHTML = '';

    if (list.length === 0) {
      packsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">No packs available.</div>`;
      return;
    }

    list.forEach((pack, idx) => {
      const card = document.createElement('div');
      card.className = `pack-card ${pack.popular ? 'popular' : ''}`;
      card.dataset.id = pack.id;

      const isFF = state.currentGame === 'freefire';
      const itemTitle = isFF ? `${pack.amount} + ${pack.bonus} Free` : `${pack.amount} + ${pack.bonus} UC`;
      const itemSub = isFF ? `Total: ${pack.total} Diamonds` : `Total: ${pack.total} UC`;
      const iconPath = isFF ? '/assets/diamond.jpg' : '/assets/uc.jpg';

      card.innerHTML = `
        <div class="pack-badge">${pack.badge || 'SPECIAL'}</div>
        <img src="${iconPath}" alt="currency" class="pack-icon-img" />
        <div class="pack-title">${itemTitle}</div>
        <div class="pack-bonus-highlight">🎁 ${itemSub}</div>
        <div class="pack-price-tag">₹${pack.price}</div>
      `;

      card.addEventListener('click', () => {
        selectPack(pack, card);
      });

      packsContainer.appendChild(card);

      // Auto-select first or popular pack initially
      if (idx === 0 && !state.selectedPack) {
        selectPack(pack, card);
      }
    });

    // If current selected pack doesn't match current game, select the first
    if (state.selectedPack && !list.find(p => p.id === state.selectedPack.id)) {
      if (list[0]) {
        selectPack(list[0], packsContainer.firstElementChild);
      }
    }
  };

  // Select a Pack
  const selectPack = (pack, cardElement) => {
    state.selectedPack = pack;
    playCyberSound('select');

    // Update UI selected state
    document.querySelectorAll('.pack-card').forEach(c => c.classList.remove('selected'));
    if (cardElement) {
      cardElement.classList.add('selected');
    }

    updateSummaryAndPayment(pack);
  };

  // Update Summary, QR Code, and Intent Links
  const updateSummaryAndPayment = async (pack) => {
    const isFF = state.currentGame === 'freefire';
    const itemName = isFF ? 'Free Fire Diamonds' : 'BGMI UC';
    const totalAmount = pack.total;

    // Summary box
    orderSummaryBox.innerHTML = `
      <div class="summary-row">
        <span>Game</span>
        <span style="color: var(--text-main); font-weight: 700;">${isFF ? 'Free Fire MAX 🔥' : 'BGMI 🪖'}</span>
      </div>
      <div class="summary-row">
        <span>Package</span>
        <span style="color: var(--accent-cyan); font-weight: 700;">${pack.name}</span>
      </div>
      <div class="summary-row">
        <span>Base + Bonus</span>
        <span>${pack.amount} + ${pack.bonus} (${totalAmount} ${isFF ? '💎' : '🪙'})</span>
      </div>
      <div class="summary-row highlight">
        <span>Payable Amount</span>
        <span class="total-val">₹${pack.price}</span>
      </div>
    `;

    // QR Badge
    qrAmountBadge.textContent = `PAY ₹${pack.price}`;

    // Request fresh QR code from server
    try {
      const res = await fetch(`/api/qr?amount=${pack.price}&note=${encodeURIComponent(isFF ? 'FF_Diamond' : 'BGMI_UC')}&_t=${Date.now()}`);
      const qrData = await res.json();

      if (qrData.qrDataUrl) {
        qrImage.src = qrData.isCustomImage ? `${qrData.qrDataUrl}?_t=${Date.now()}` : qrData.qrDataUrl;
      }

      const activeUpiId = qrData.upiId || state.settings.upiId || 'paytmqr@paytm';
      upiIdDisplay.textContent = activeUpiId;

      // Update UPI App deep links
      const payee = encodeURIComponent(qrData.merchantName || state.settings.merchantName || 'TopUp Store');
      const note = encodeURIComponent(`${isFF ? 'FF' : 'BGMI'}_Topup`);
      const amt = pack.price;

      // Direct UPI deep link strings
      const baseUpi = `upi://pay?pa=${activeUpiId}&pn=${payee}&am=${amt}&cu=INR&tn=${note}`;
      const paytmDeepLink = `paytmmp://pay?pa=${activeUpiId}&pn=${payee}&am=${amt}&cu=INR&tn=${note}`;
      const phonepeDeepLink = `phonepe://pay?pa=${activeUpiId}&pn=${payee}&am=${amt}&cu=INR&tn=${note}`;
      const gpayDeepLink = `tez://upi/pay?pa=${activeUpiId}&pn=${payee}&am=${amt}&cu=INR&tn=${note}`;

      if (upiPaytmBtn) upiPaytmBtn.href = paytmDeepLink;
      if (upiPhonepeBtn) upiPhonepeBtn.href = phonepeDeepLink;
      if (upiGpayBtn) upiGpayBtn.href = gpayDeepLink;
      if (upiBhimBtn) upiBhimBtn.href = baseUpi;

    } catch (err) {
      console.error('Failed to update QR:', err);
    }
  };

  // Copy UPI ID button
  copyUpiBtn.addEventListener('click', () => {
    const upiText = upiIdDisplay.textContent;
    if (upiText) {
      navigator.clipboard.writeText(upiText).then(() => {
        showToast('UPI ID Copied to Clipboard!');
        copyUpiBtn.textContent = 'COPIED! ✅';
        setTimeout(() => {
          copyUpiBtn.textContent = 'COPY';
        }, 2000);
      });
    }
  });

  // Handle Order Submission
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const uid = uidInput.value.trim();
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const utr = utrInput.value.trim();
    const screenshotFile = screenshotInput.files[0];

    if (!uid) {
      showToast('⚠️ Please enter Player UID');
      uidInput.focus();
      return;
    }

    if (uid.length < 6 || isNaN(uid)) {
      showToast('⚠️ Please enter a valid numerical UID (min 6 digits)');
      uidInput.focus();
      return;
    }

    if (!phone || phone.length < 10) {
      showToast('⚠️ Please enter valid 10-digit WhatsApp number');
      phoneInput.focus();
      return;
    }

    if (!state.selectedPack) {
      showToast('⚠️ Please select a Diamond/UC bundle');
      return;
    }

    // Submit button state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳</span> <span>VERIFYING & PLACING...</span>`;

    const formData = new FormData();
    formData.append('game', state.currentGame);
    formData.append('uid', uid);
    formData.append('playerName', name || 'Gamer');
    formData.append('phone', phone);
    formData.append('packId', state.selectedPack.id);
    formData.append('utr', utr);
    if (screenshotFile) {
      formData.append('screenshot', screenshotFile);
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        playCyberSound('success');
        showSuccessModal(resData.order);
        orderForm.reset();
        // re-select current pack
        renderPacks();
      } else {
        showToast(resData.error || 'Failed to place order. Try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      showToast('Network error submitting order.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>⚡</span> <span>SUBMIT ORDER & TOP-UP</span>`;
    }
  });

  // Show Success Modal
  const showSuccessModal = (order) => {
    const detailsContainer = document.getElementById('success-order-details');
    detailsContainer.innerHTML = `
      <div style="background: rgba(7, 10, 18, 0.9); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; margin-bottom: 14px; text-align: left;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--text-muted); font-size: 0.75rem;">ORDER ID</span>
          <span style="color: var(--accent-cyan); font-family: var(--font-mono); font-weight: 700;">#${order.id}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--text-muted); font-size: 0.75rem;">GAME</span>
          <span style="font-weight: 700;">${order.gameName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--text-muted); font-size: 0.75rem;">PLAYER UID</span>
          <span style="color: var(--accent-gold); font-family: var(--font-mono); font-weight: 700;">${order.uid}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--text-muted); font-size: 0.75rem;">PACKAGE</span>
          <span style="font-weight: 700;">${order.totalItems} ${order.itemType}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
          <span style="color: var(--text-muted); font-size: 0.75rem;">STATUS</span>
          <span style="color: var(--accent-green); font-weight: 700;">⏳ Processing (5-15 min)</span>
        </div>
      </div>
      <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-bottom: 12px;">
        Our automated gaming portal is verifying your payment. Your diamonds/UC will be delivered directly to your account.
      </p>
    `;

    successModal.classList.add('active');
  };

  closeSuccessBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
  });

  // Track Order Feature
  openTrackBtn.addEventListener('click', () => {
    trackModal.classList.add('active');
    trackInput.focus();
  });

  closeTrackBtn.addEventListener('click', () => {
    trackModal.classList.remove('active');
  });

  trackSubmitBtn.addEventListener('click', async () => {
    const q = trackInput.value.trim();
    if (!q) {
      showToast('Enter Order ID or Player UID');
      return;
    }

    trackResults.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 10px;">Searching...</div>`;

    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (data.orders && data.orders.length > 0) {
        trackResults.innerHTML = data.orders.map(o => `
          <div style="background: #ffffff; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 8px; text-align: left; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
              <span style="color: var(--primary-blue); font-weight: 700;">#${o.id}</span>
              <span class="status-badge ${o.status}" style="font-weight: 700; text-transform: uppercase; color: ${o.status === 'completed' ? 'var(--accent-green)' : (o.status === 'rejected' ? 'var(--accent-red)' : 'var(--gold-primary)')}">
                ${o.status === 'completed' ? '✅ Completed' : (o.status === 'rejected' ? '❌ Rejected' : '⏳ Pending')}
              </span>
            </div>
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">${o.gameName} - ${o.totalItems} ${o.itemType}</div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">UID: ${o.uid} | Price: ₹${o.price}</div>
            <div style="font-size: 0.68rem; color: var(--text-sub); margin-top: 4px;">Placed: ${new Date(o.createdAt).toLocaleTimeString()}</div>
          </div>
        `).join('');
      } else {
        trackResults.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 12px;">No orders found for "${q}".</div>`;
      }
    } catch (err) {
      trackResults.innerHTML = `<div style="text-align: center; color: var(--accent-orange); padding: 12px;">Error checking order.</div>`;
    }
  });

  // Simulated Live Purchase Notification Ticker
  const simulatedNames = ['Aman', 'Rahul', 'Vikas', 'Rohit', 'Sahil', 'Karan', 'Deepak', 'Arjun', 'Dev', 'Manish'];
  const simulatedCities = ['Delhi', 'Mumbai', 'Kolkata', 'Patna', 'Lucknow', 'Jaipur', 'Indore', 'Ahmedabad'];

  const triggerLivePurchaseToast = () => {
    if (!liveToast) return;
    const isFF = Math.random() > 0.4;
    const name = simulatedNames[Math.floor(Math.random() * simulatedNames.length)];
    const city = simulatedCities[Math.floor(Math.random() * simulatedCities.length)];
    const item = isFF ? '1000 + 2000 Diamonds' : '600 + 600 UC';

    liveToast.innerHTML = `
      <span class="live-badge">LIVE</span>
      <span class="live-toast-text">${name} (${city}) just bought <strong>${item}</strong>!</span>
    `;

    setTimeout(triggerLivePurchaseToast, 12000 + Math.random() * 8000);
  };

  setTimeout(triggerLivePurchaseToast, 4000);

  // Initial Boot
  loadConfig();
});
