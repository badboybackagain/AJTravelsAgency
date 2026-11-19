# AJ Travels — Vehicle Rental & Intercity Travel Agency Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF.svg)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![PageSpeed](https://img.shields.io/badge/Agentic%20Browsing-4%2F4%20(100%25)-success.svg)](https://pagespeed.web.dev/)

**AJ Travels (AJ Tours & Travels Pune)** is a full-stack, enterprise-grade vehicle rental and intercity chauffeured travel booking platform based in Pune, Maharashtra. It specializes in 24/7 Mumbai–Pune Expressway transfers, BOM/PNQ airport pickups, outstation holiday packages, corporate fleet rentals, and luxury Tempo Traveller bookings.

---

## 📖 Master Documentation

> **For the full, in-depth architectural and operational manual, please read [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).**
>
> It covers:
> - Complete technology stack details
> - Core business logic, pricing formulas, and toll calculation rules
> - Booking flow and instant WhatsApp lead dispatch
> - Admin panel capabilities (`/admin`)
> - Dynamic SEO routing and Schema.org architecture
> - Google Lighthouse Agentic Browsing (4/4 compliance)
> - PageSpeed mobile performance optimizations
> - Full Prisma database schema & model relationships
> - Maintenance recipes (how to update phone numbers, add fares, add routes, and deploy)

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Git**

### 1. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env   # or create .env as detailed in PROJECT_DOCUMENTATION.md

# Generate Prisma client and start the server
npx prisma generate
npm run start          # Backend runs on http://localhost:3001
```

### 2. Frontend Setup
```bash
cd travel-agency
npm install

# Start development server
npm run dev            # Frontend runs on http://localhost:8080
```

### 3. Production Build
```bash
npm --prefix travel-agency run build
```

---

## 📁 Repository Overview

```
AJTravelsAgency/
├── PROJECT_DOCUMENTATION.md   # Master technical and business architecture manual
├── README.md                  # Project overview and quick start guide
├── backend/                   # Node.js + Express REST API with Prisma ORM
│   ├── prisma/                # Database schema & migrations
│   └── src/                   # Controllers, routes, and fare calculation services
└── travel-agency/             # React 19 + Vite 8 frontend application
    ├── public/                # Static assets, WebP images, llms.txt, ARD manifest
    └── src/                   # Components, pages, hooks, data, and design systems
```

---

## 📞 Business Contacts & Operations Desk

- **Headquarters:** Old Mumbai–Pune Highway, Nashik Fata, Kasarawadi, Pune, Maharashtra 411064
- **Primary Support:** `+91 7447443536`
- **Secondary Line:** `+91 8421051299`
- **WhatsApp Desk:** `+91 7447443536`
- **Email:** `ajtravelpune@gmail.com`
