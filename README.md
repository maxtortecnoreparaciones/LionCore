# 🦁 LionCore POS

**Offline-first modular Point of Sale system** built with React + TypeScript + Electron + IndexedDB.  
Runs as a desktop app (Windows portable) **and** a PWA in the browser — no internet required.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron)](https://www.electronjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/maxtortecnoreparaciones/LionCore/pulls)

---

## ✨ Features

### 🏪 Multi-Business
Create unlimited businesses with dedicated templates: POS, Restaurant, Dehydrated Foods, Fruit & Vegetable, Service Store.

### 💰 Sales & Transactions
- Quick item entry with auto-calculation
- Multiple transaction modes: Sale, Purchase, Expense, Production
- Invoice preview with print support
- WhatsApp receipt sharing

### 📦 Inventory Management
- Real-time stock tracking per product
- Low-stock alerts & negative stock prevention
- Inventory adjustments with reason logging
- Warehouse management with inter-warehouse transfers
- Fruver module: waste registration & freshness tracking

### 🏭 Production Module
Track raw material → finished product conversion with:
- Yield percentage auto-calculation
- Batch history & cost tracking
- Per-batch metadata (weight, time, notes)

### 🔧 Service Orders (CRM)
Complete service management:
- Client registration with WhatsApp contact
- Device & problem tracking
- Status workflow: Received → Diagnosing → Repairing → Ready → Delivered
- Cost & price estimation

### 🍽️ Restaurant Module
Multi-device architecture for restaurants:
- **Table management** with move/merge support
- **Kitchen view** — real-time order status (pending → preparing → ready)
- **Waiter station** via browser on local network
- WebSocket-based real-time sync across devices

### 📊 Reports & Analytics
- Daily / Weekly / Monthly summaries
- Net profit calculation (revenue − costs)
- CSV export

### 🔐 License System
- **FREE** plan: Sales + Inventory + Production + Export
- **PRO** plan: Everything + Expenses + Purchases + Config
- Offline grace period: 72 hours
- Device-based activation via Google Sheets
- Registration webhook with auto-licensing

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 6, Tailwind CSS 4, Vite 8 |
| **Desktop** | Electron 33, electron-builder (portable .exe) |
| **Offline DB** | IndexedDB via Dexie.js (schema v7) |
| **Server** | Express 5 (embedded in Electron) |
| **Real-time** | WebSocket (ws) for restaurant sync |
| **PWA** | Service Worker, manifest.json, offline-first |
| **Licensing** | Google Sheets API + Device ID |
| **QR** | QR code generation + payment QR |

### Architecture
```
┌─────────────────────────────────────────────┐
│                  Electron                    │
│  ┌─────────────┐       ┌────────────────┐   │
│  │  Vite/React  │◄─────►│ Express Server │   │
│  │  (Renderer)  │       │  (port 3456)   │   │
│  └──────┬───────┘       └───────┬────────┘   │
│         │                       │            │
│         ▼                       ▼            │
│   IndexedDB (Dexie.js)    WebSocket Server   │
│   ┌─────────────────┐    ┌──────────────┐    │
│   │ 5 Business Types │    │ Real-time    │    │
│   │ 10+ Tables      │    │ Sync (Mesas) │    │
│   │ CRUD + Business │    └──────────────┘    │
│   │ Logic           │                        │
│   └─────────────────┘                        │
└─────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    Browser (LAN)        Browser (LAN)
   (Waiter / Kitchen)   (Another device)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Install & Run (Development)
```bash
git clone https://github.com/maxtortecnoreparaciones/LionCore.git
cd LionCore
npm install
npm run dev          # Web only at http://localhost:5173
npm run electron:dev # Desktop + Express server
```

### Build for Production
```bash
npm run build                 # Web build (dist/)
npm run electron:build        # Windows portable .exe
```

---

## 📦 Project Structure

```
src/
├── App.tsx                    # Main UI orchestrator (~1,739 lines)
├── components/
│   ├── layout/               # AppHeader
│   ├── modals/               # 19 modal components (License, Payment, Product, etc.)
│   ├── pos/                  # TransactionForm
│   ├── restaurant/           # 8 components (MesaCard, CocinaView, etc.)
│   └── views/                # 8 view components (History, Summary, Inventory, etc.)
├── services/
│   ├── db.ts                 # Dexie.js schema v7 + CRUD + business logic (~1,266 lines)
│   ├── license.ts            # License validation, device ID, plan management
│   └── registration.ts       # User registration webhook
└── utils/
    └── format.ts             # formatCOP, formatDate, getTypeStyle

electron/
├── main.js                   # Electron entry point
└── server.js                 # Express + WebSocket + API endpoints
```

---

## 🔑 License Plans

| Feature | FREE | PRO |
|---|---|---|
| Sales | ✅ | ✅ |
| Inventory | ✅ | ✅ |
| Production | ✅ | ✅ |
| Fruver Dashboard | ✅ | ✅ |
| Service Orders | ✅ | ✅ |
| Warehouses | ✅ | ✅ |
| Export CSV | ✅ | ✅ |
| Expenses | ❌ | ✅ |
| Purchases | ❌ | ✅ |
| Config (costs, margins) | ❌ | ✅ |
| Net Profit Reports | ❌ | ✅ |

---

## 🧪 Test Status
```bash
npm run build   # tsc + vite build — clean (cosmetic warnings only)
```

---

## 🔄 Versioning

| Version | Date | Highlights |
|---|---|---|
| **1.0.0** | 2026-05-02 | Initial release |
| **2.0.0** | 2026-05-20 | Full refactor: 37 components extracted from App.tsx, Kitchen status flow, Express v5, QR fix, Cash payment option |

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📱 Contact
- **WhatsApp**: [313 877 7115](https://wa.me/573138777115)
- **GitHub Issues**: [Report a bug](https://github.com/maxtortecnoreparaciones/LionCore/issues)

---

<div align="center">
  <strong>Built with ❤️ in Colombia</strong>
</div>
