# ⚡ LootZone India — Multi-Page Gaming Top-Up Platform (Free Fire & BGMI)

Official, clean, trustworthy multi-page digital gaming top-up platform built specifically for Indian gamers.

---

## 🌐 Complete Multi-Page Architecture (5-6 Separate Pages)

| Page | URL | Purpose |
|---|---|---|
| **Home Hub** | [http://localhost:3000/](http://localhost:3000/) | Official Indian gaming store hub, game cards, trust metrics, reviews & live feed |
| **Free Fire MAX** | [http://localhost:3000/freefire](http://localhost:3000/freefire) | Dedicated diamond top-up page with UID input, bundle selection & live summary |
| **BGMI UC** | [http://localhost:3000/bgmi](http://localhost:3000/bgmi) | Dedicated BGMI UC top-up page with Character ID input & Royale Pass packs |
| **Payment Checkout** | [http://localhost:3000/payment](http://localhost:3000/payment) | Dynamic UPI QR code, GPay/PhonePe/Paytm intents, UTR submission & slip upload |
| **Order Tracking** | [http://localhost:3000/track](http://localhost:3000/track) | 4-step real-time timeline tracking by Player UID or Order ID |
| **Admin Panel (Isolated)** | [http://localhost:3000/admin](http://localhost:3000/admin) | Private dashboard with 1-click UID copy, WhatsApp messaging, QR/UPI settings |

---

## 💎 Pricing & Bundle Configurations

### 🔥 Free Fire MAX (Diamonds + Bonus)
- **200 + 100 Diamonds** = **₹100**
- **310 + 290 Diamonds** = **₹200**
- **520 + 520 Diamonds** = **₹300** *(100% Double)*
- **1000 + 2000 Diamonds** = **₹800** *(🔥 3X Mega Offer)*

### 🪖 BGMI (Battlegrounds Mobile India UC)
- **60 + 30 UC** = **₹75**
- **300 + 150 UC** = **₹200**
- **600 + 600 UC** = **₹380** *(Royale Pass Pack)*
- **1500 + 1500 UC** = **₹750**
- **3000 + 4000 UC** = **₹1500** *(👑 VIP Special)*

---

## 🛡️ Admin Dashboard Features (`/admin`)

- **Security**: PIN Protected (Default: `admin123`).
- **Private Route**: No admin buttons or links exist on any user storefront page.
- **Owner Workflow for External Top-Up**:
  1. Customer places order on `/freefire` or `/bgmi` and pays via UPI on `/payment`.
  2. Order immediately alerts the Admin Dashboard (with audio chime).
  3. Admin clicks **"📋 COPY UID"** button -> UID is instantly in clipboard!
  4. Admin pastes UID into external top-up portal (Codashop, UniPin, Midasbuy, etc.) and completes top-up.
  5. Admin clicks **"💬 WhatsApp Customer"** button -> WhatsApp opens pre-filled with order confirmation.
  6. Admin clicks **"✅ Mark Completed"** -> Order updates to completed and customer sees it on `/track`.
- **Payment & QR Settings Tab**:
  - Update UPI ID anytime.
  - Update Business Name.
  - Upload custom QR code image (from PhonePe soundbox/standee).
  - Update customer support WhatsApp number.
- **Packs & Pricing Tab**:
  - Edit prices and diamond/UC bonus amounts anytime.

---

## 🚀 Running the Project

```bash
npm start
# or
node server.js
```
Server runs at `http://localhost:3000`.
