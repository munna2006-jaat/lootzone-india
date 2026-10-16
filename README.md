# ⚡ LootZone India — Multi-Page Gaming Top-Up Platform (Free Fire & BGMI)

Official, clean, trustworthy multi-page digital gaming top-up platform built specifically for Indian gamers.

---

## 🌐 Complete Multi-Page Architecture (5-6 Separate Pages)

| Page | URL Path | Purpose |
|---|---|---|
| **Home Hub** | `/` | Official Indian gaming store hub, game cards, trust metrics, reviews & live feed |
| **Free Fire MAX** | `/freefire` | Dedicated diamond top-up page with UID input, bundle selection & live summary |
| **BGMI UC** | `/bgmi` | Dedicated BGMI UC top-up page with Character ID input & Royale Pass packs |
| **Payment Checkout** | `/payment` | Dynamic UPI QR code, GPay/PhonePe/Paytm intents, UTR submission & slip upload |
| **Order Tracking** | `/track` | 4-step real-time timeline tracking by Player UID or Order ID |
| **Admin Panel (Isolated)** | `/admin` | Private dashboard with 1-click UID copy, WhatsApp messaging, QR/UPI settings |

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

## 🛡️ Admin Dashboard (`/admin`)

- **Security Password**: `LootZone@Admin#2026!` *(Changeable anytime from settings tab)*.
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

---

## 🚀 Free Deployment on Render (render.com)

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository: `munna2006-jaat/lootzone-india`.
3. Configure the service:
   - **Name**: `lootzone-india` (or your chosen name)
   - **Region**: `Singapore` (Closest to India for fastest latency)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Click **Create Web Service**. Your live link will be `https://lootzone-india.onrender.com`.

---

## 🤖 UptimeRobot Setup (Keep Render 24/7 Alive for Free)

Render's free tier spins down after 15 minutes of inactivity. Set up a free monitor on UptimeRobot to keep it awake 24/7:

1. Sign up / Log in to [https://uptimerobot.com](https://uptimerobot.com).
2. Click **+ Add New Monitor**.
3. Fill in the details:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `LootZone India Top-Up`
   - **URL (or IP)**: `https://<YOUR-RENDER-APP-NAME>.onrender.com/health`
     *(Example: `https://lootzone-india.onrender.com/health`)*
   - **Monitoring Interval**: `5 minutes`
4. Click **Create Monitor**.
5. Done! UptimeRobot will ping `/health` every 5 minutes, keeping your Render server **100% active and running 24x7 without sleeping**.
