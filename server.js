const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage for file uploads (payment screenshots and custom QR codes)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Helper functions for reading/writing JSON data
const readJSON = (file) => {
  const filePath = path.join(DATA_DIR, file);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return null;
  }
};

const writeJSON = (file, data) => {
  const filePath = path.join(DATA_DIR, file);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
    return false;
  }
};

// Static files
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Multi-page routes for LootZone India
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/freefire', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'freefire.html'));
});

app.get('/bgmi', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bgmi.html'));
});

app.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'track.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ==========================================
// PUBLIC API ENDPOINTS
// ==========================================

// GET config (Settings and Packs, omitting secret admin pin)
app.get('/api/config', (req, res) => {
  const settings = readJSON('settings.json') || {};
  const packs = readJSON('packs.json') || {};
  
  // Strip sensitive info
  const safeSettings = { ...settings };
  delete safeSettings.adminPin;

  res.json({
    settings: safeSettings,
    packs
  });
});

// Dynamic QR Generator (UPI)
app.get('/api/qr', async (req, res) => {
  try {
    const { amount, note, orderId } = req.query;
    const settings = readJSON('settings.json') || {};
    
    // If admin uploaded a custom QR code image and wants to use it directly
    if (settings.customQrUrl && settings.useCustomQrOnly) {
      return res.json({ qrDataUrl: settings.customQrUrl, isCustomImage: true });
    }

    const upiId = settings.upiId || 'paytmqr@paytm';
    const merchantName = settings.merchantName || 'Gaming Store';
    const transNote = encodeURIComponent(note || `TopUp_${orderId || 'Game'}`);
    const payeeName = encodeURIComponent(merchantName);

    // Standard NPCI UPI URI Scheme
    let upiUri = `upi://pay?pa=${upiId}&pn=${payeeName}&cu=INR&tn=${transNote}`;
    if (amount && parseFloat(amount) > 0) {
      upiUri += `&am=${parseFloat(amount).toFixed(2)}`;
    }

    // Generate high quality QR Code Data URL
    const qrDataUrl = await QRCode.toDataURL(upiUri, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#030712',
        light: '#ffffff'
      }
    });

    res.json({
      upiUri,
      qrDataUrl,
      upiId,
      merchantName,
      customQrUrl: settings.customQrUrl || null
    });
  } catch (err) {
    console.error('QR Generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Submit Top-Up Order
app.post('/api/orders', upload.single('screenshot'), (req, res) => {
  try {
    const {
      game,
      uid,
      playerName,
      phone,
      packId,
      utr,
      notes
    } = req.body;

    if (!game || !uid || !phone || !packId) {
      return res.status(400).json({ error: 'Please provide Game, Player UID, Phone, and Pack selection.' });
    }

    const packs = readJSON('packs.json') || {};
    const gamePacks = packs[game] || [];
    const selectedPack = gamePacks.find(p => p.id === packId);

    if (!selectedPack) {
      return res.status(400).json({ error: 'Invalid pack selected.' });
    }

    const orders = readJSON('orders.json') || [];
    
    // Generate order ID
    const prefix = game === 'freefire' ? 'FF' : 'BGMI';
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `${prefix}-${randomNum}`;

    let screenshotUrl = '';
    if (req.file) {
      screenshotUrl = `/uploads/${req.file.filename}`;
    }

    const newOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      game: game,
      gameName: game === 'freefire' ? 'Free Fire MAX' : 'BGMI (Battlegrounds Mobile India)',
      uid: String(uid).trim(),
      playerName: (playerName || 'Player').trim(),
      phone: String(phone).trim(),
      packId: selectedPack.id,
      packName: selectedPack.name,
      itemsAmount: selectedPack.amount,
      bonusAmount: selectedPack.bonus,
      totalItems: selectedPack.total,
      price: selectedPack.price,
      itemType: game === 'freefire' ? 'Diamonds' : 'UC',
      utr: (utr || '').trim(),
      screenshotUrl,
      status: 'pending',
      notes: (notes || '').trim()
    };

    // Prepend new order
    orders.unshift(newOrder);
    writeJSON('orders.json', orders);

    res.json({
      success: true,
      message: 'Order placed successfully! Top-up will be processed in 5-15 mins.',
      order: newOrder
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Server error placing order' });
  }
});

// Track Order by Order ID or UID
app.get('/api/orders/track', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Please provide Order ID or Player UID' });
  }

  const orders = readJSON('orders.json') || [];
  const q = String(query).trim().toLowerCase();

  const matched = orders.filter(o => 
    o.id.toLowerCase() === q || 
    o.uid.toLowerCase() === q ||
    o.phone === q
  ).slice(0, 5);

  res.json({ orders: matched });
});

// ==========================================
// ADMIN API ENDPOINTS (Protected)
// ==========================================

// Simple auth middleware for admin actions
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const settings = readJSON('settings.json') || {};
  const currentPin = settings.adminPin || 'admin123';

  if (!authHeader || authHeader !== `Bearer ${currentPin}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }
  next();
};

// Admin Login Check
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const settings = readJSON('settings.json') || {};
  const currentPin = settings.adminPin || 'admin123';

  if (pin === currentPin) {
    res.json({
      success: true,
      token: currentPin,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect Admin PIN' });
  }
});

// Get Admin Stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const orders = readJSON('orders.json') || [];
  
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const rejectedOrders = orders.filter(o => o.status === 'rejected').length;

  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

  const pendingRevenue = orders
    .filter(o => o.status === 'pending')
    .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

  res.json({
    totalOrders,
    pendingOrders,
    completedOrders,
    rejectedOrders,
    totalRevenue,
    pendingRevenue
  });
});

// Get All Orders (with optional filter)
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const { status, game } = req.query;
  let orders = readJSON('orders.json') || [];

  if (status && status !== 'all') {
    orders = orders.filter(o => o.status === status);
  }
  if (game && game !== 'all') {
    orders = orders.filter(o => o.game === game);
  }

  res.json({ orders });
});

// Update Order Status
app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  const orders = readJSON('orders.json') || [];
  const orderIndex = orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (status) orders[orderIndex].status = status;
  if (adminNotes !== undefined) orders[orderIndex].adminNotes = adminNotes;
  orders[orderIndex].updatedAt = new Date().toISOString();

  writeJSON('orders.json', orders);
  res.json({ success: true, order: orders[orderIndex] });
});

// Delete Order
app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  let orders = readJSON('orders.json') || [];
  const initialLength = orders.length;
  orders = orders.filter(o => o.id !== id);

  if (orders.length === initialLength) {
    return res.status(404).json({ error: 'Order not found' });
  }

  writeJSON('orders.json', orders);
  res.json({ success: true, message: 'Order deleted successfully' });
});

// Update Settings (UPI ID, Merchant Name, Announcement, Admin PIN, etc.)
app.post('/api/admin/settings', requireAdmin, (req, res) => {
  const currentSettings = readJSON('settings.json') || {};
  const {
    upiId,
    merchantName,
    customQrUrl,
    useCustomQrOnly,
    adminPin,
    whatsappSupport,
    deliveryNotice,
    announcement,
    autoRefreshSeconds
  } = req.body;

  const updatedSettings = {
    ...currentSettings,
    upiId: upiId !== undefined ? upiId.trim() : currentSettings.upiId,
    merchantName: merchantName !== undefined ? merchantName.trim() : currentSettings.merchantName,
    customQrUrl: customQrUrl !== undefined ? customQrUrl.trim() : currentSettings.customQrUrl,
    useCustomQrOnly: useCustomQrOnly !== undefined ? Boolean(useCustomQrOnly) : currentSettings.useCustomQrOnly,
    adminPin: adminPin ? adminPin.trim() : currentSettings.adminPin,
    whatsappSupport: whatsappSupport !== undefined ? whatsappSupport.trim() : currentSettings.whatsappSupport,
    deliveryNotice: deliveryNotice !== undefined ? deliveryNotice.trim() : currentSettings.deliveryNotice,
    announcement: announcement !== undefined ? announcement.trim() : currentSettings.announcement,
    autoRefreshSeconds: Number(autoRefreshSeconds) || 10
  };

  writeJSON('settings.json', updatedSettings);

  const safeSettings = { ...updatedSettings };
  delete safeSettings.adminPin;

  res.json({ success: true, settings: safeSettings });
});

// Upload Custom QR Image
app.post('/api/admin/upload-qr', requireAdmin, upload.single('qrImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const qrImageUrl = `/uploads/${req.file.filename}`;
  const currentSettings = readJSON('settings.json') || {};
  currentSettings.customQrUrl = qrImageUrl;
  writeJSON('settings.json', currentSettings);

  res.json({
    success: true,
    message: 'QR Code image uploaded successfully!',
    customQrUrl: qrImageUrl
  });
});

// Update Packs / Pricing
app.post('/api/admin/packs', requireAdmin, (req, res) => {
  const { packs } = req.body;
  if (!packs || typeof packs !== 'object') {
    return res.status(400).json({ error: 'Invalid packs data' });
  }

  writeJSON('packs.json', packs);
  res.json({ success: true, packs });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Gaming Top-Up Platform running at http://localhost:${PORT}`);
  console.log(`🛡️ Admin Panel available at http://localhost:${PORT}/admin`);
});
