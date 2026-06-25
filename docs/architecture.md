# 6304 Agent — Arsitektur Teknis

---

## 1. Gambaran Sistem

```
┌─────────────────────────────────────────────────────────┐
│                     6304 AGENT PLATFORM                    │
│                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐ │
│  │ Dashboard │   │ Audit Engine │   │ Distribution    │ │
│  │ (Web App) │   │              │   │ Engine          │ │
│  └─────┬─────┘   └──────┬───────┘   └────────┬────────┘ │
│        │                │                     │         │
│        └────────┬───────┴─────────────┬───────┘         │
│                 │                     │                  │
│          ┌──────┴──────┐    ┌────────┴────────┐        │
│          │  Core API   │    │  Canonical Facts │        │
│          │  Server     │    │  Store           │        │
│          └──────┬──────┘    └─────────────────┘        │
│                 │                                       │
│     ┌───────────┼───────────┐                          │
│     │           │           │                          │
│  ┌──┴──┐   ┌───┴───┐   ┌──┴──┐                       │
│  │Query│   │Result │   │Score│                        │
│  │Queue│   │Store  │   │Calc │                        │
│  └──┬──┘   └───────┘   └─────┘                        │
│     │                                                  │
└─────┼──────────────────────────────────────────────────┘
      │
┌─────┴──────────────────────────────────────────────────┐
│              AI ENGINE ADAPTERS                         │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌───────────────┐ │
│  │ ChatGPT  │ │Perplexity│ │Gemini│ │Google AI      │ │
│  │ Adapter  │ │ Adapter  │ │Adapt.│ │Overviews Adpt.│ │
│  └──────────┘ └──────────┘ └──────┘ └───────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 2. Komponen Utama

### 2.1 AI Engine Adapters

Lapisan abstraksi untuk berkomunikasi dengan setiap AI engine. Setiap adapter menangani:
- Pengiriman query (prompt) ke engine
- Parsing respons (teks jawaban, sumber yang dikutip, entitas yang disebut)
- Rate limiting dan retry logic
- Normalisasi output ke format internal yang seragam

**Engine yang didukung (MVP):**
| Engine | Metode Akses | Prioritas |
|---|---|---|
| ChatGPT | OpenAI API | P0 |
| Perplexity | Perplexity API | P0 |
| Gemini | Google AI API | P1 |
| Google AI Overviews | SERP scraping | P1 |

### 2.2 Core API Server

Backend utama yang mengorkestrasi seluruh operasi:
- Manajemen brand, query, dan jadwal monitoring
- Autentikasi dan otorisasi (multi-tenant)
- Endpoint untuk dashboard dan integrasi
- Job scheduling untuk monitoring berkala

### 2.3 Query Queue

Antrian query yang dijadwalkan untuk dikirim ke AI engine:
- Scheduling (harian, mingguan, on-demand)
- Prioritisasi berdasarkan tier pelanggan
- Distribusi beban ke berbagai engine secara paralel

### 2.4 Result Store

Penyimpanan hasil respons AI secara historikal:
- Snapshot jawaban AI per query per engine per waktu
- Tracking perubahan jawaban dari waktu ke waktu
- Data mentah untuk analisis dan pelaporan

### 2.5 Canonical Facts Store

Sumber kebenaran yang didefinisikan oleh brand:
- Fakta-fakta resmi tentang brand (produk, harga, klaim, fitur)
- Digunakan sebagai baseline untuk deteksi misinformasi
- CRUD oleh pelanggan melalui dashboard

### 2.6 Score Calculator

Mesin perhitungan metrik visibilitas:
- **Share of Answer (SoA)** — seberapa sering brand disebut vs kompetitor
- **Accuracy Score** — seberapa akurat info yang disampaikan AI vs canonical facts
- **Citation Score** — seberapa sering sumber brand dikutip sebagai referensi
- **Trend Analysis** — pergerakan metrik dari waktu ke waktu

### 2.7 Audit Engine

Modul untuk menjalankan audit satu kali (produk pembuka):
- Menjalankan batch query untuk satu brand + kompetitor
- Menghasilkan laporan "Invisible Competitor" dan audit akurasi
- Output berupa laporan PDF/web yang siap presentasi

### 2.8 Distribution Engine

Modul untuk eksekusi strategi distribusi konten:
- Identifikasi sumber yang dipercaya AI (knowledge bases, direktori, media)
- Generasi konten dan structured data (schema markup)
- Tracking status distribusi
- Pengukuran dampak post-distribusi

### 2.9 Dashboard (Web App)

Antarmuka pelanggan untuk:
- Melihat metrik visibilitas real-time
- Mengelola canonical facts
- Melihat laporan dan tren
- Mengelola query dan kompetitor yang dipantau

---

## 3. Tech Stack (Rekomendasi)

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | Next.js (React) | SSR, performa, ekosistem luas |
| Backend API | Node.js (Fastify) atau Python (FastAPI) | Fleksibel, cocok untuk integrasi AI API |
| Database | PostgreSQL | Relasional, mature, cocok untuk data terstruktur |
| Queue | Redis + BullMQ | Job scheduling, rate limiting |
| Cache | Redis | Caching respons API, session |
| Object Storage | S3-compatible | Laporan PDF, snapshot |
| Auth | NextAuth / Clerk | Multi-tenant auth |
| Hosting | Vercel (frontend) + Railway/Fly.io (backend) | Cost-effective untuk MVP |
| Monitoring | Sentry + PostHog | Error tracking + product analytics |

---

## 4. Data Flow: Monitoring Loop

```
1. Scheduler triggers query batch
         │
         ▼
2. Query Queue dispatches to AI Engine Adapters
         │
         ▼
3. Adapters send prompts to ChatGPT, Perplexity, Gemini, etc.
         │
         ▼
4. Responses parsed → normalized → stored in Result Store
         │
         ▼
5. Score Calculator computes SoA, Accuracy, Citation scores
         │
         ▼
6. Accuracy checked against Canonical Facts Store
         │
         ▼
7. Alerts generated for misinformation or visibility drops
         │
         ▼
8. Dashboard updated with latest metrics
```

---

## 5. Data Flow: Audit (Produk Pembuka)

```
1. Client submits brand name + competitors + canonical facts
         │
         ▼
2. Audit Engine generates query set (kategori × variasi)
         │
         ▼
3. Queries dispatched to all supported AI engines
         │
         ▼
4. Results analyzed: SoA, accuracy, citation presence
         │
         ▼
5. Report generated: Invisible Competitor + Accuracy Audit
         │
         ▼
6. Report delivered via dashboard / PDF
```

---

## 6. Keamanan & Compliance

- **Multi-tenant isolation** — data brand terpisah secara ketat
- **API key encryption** — semua credential AI engine dienkripsi at rest
- **Rate limiting** — per tenant dan per engine untuk kontrol biaya
- **Audit logging** — semua aksi tercatat untuk compliance
- **Data residency** — pertimbangan penyimpanan data di region Indonesia

---

## 7. Skalabilitas

- **Horizontal scaling** pada query workers untuk menangani volume tinggi
- **Database read replicas** untuk dashboard yang berat query
- **CDN** untuk asset statis dan laporan
- **Queue-based architecture** memungkinkan backpressure handling yang baik

---

*Dokumen ini akan diperbarui seiring pengembangan MVP.*
