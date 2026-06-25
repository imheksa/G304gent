# 6304 Agent — Roadmap

---

## Fase 0: Foundation (Minggu 1-4)

**Tujuan:** Setup infrastruktur dasar dan validasi teknis

- [ ] Setup repository, CI/CD, dan environment
- [ ] Pilih dan setup tech stack (frontend + backend)
- [ ] Buat AI engine adapter untuk ChatGPT dan Perplexity (2 engine pertama)
- [ ] Validasi teknis: kirim query → terima dan parse respons → simpan hasil
- [ ] Setup database schema (brands, queries, results, canonical_facts)
- [ ] Setup autentikasi dasar

**Deliverable:** Sistem bisa mengirim query ke 2 AI engine dan menyimpan hasilnya.

---

## Fase 1: Audit MVP (Minggu 5-8)

**Tujuan:** Produk pembuka yang bisa dijual — audit berbayar

- [ ] Audit Engine: input brand + kompetitor → jalankan batch query
- [ ] Score Calculator: hitung Share of Answer dan Accuracy Score
- [ ] Canonical Facts Store: CRUD fakta resmi brand
- [ ] Deteksi misinformasi (bandingkan respons AI vs canonical facts)
- [ ] Laporan audit: "Invisible Competitor" + Accuracy Audit
- [ ] Landing page dengan form request audit
- [ ] Output laporan (web view + PDF export)

**Deliverable:** Bisa menjalankan audit untuk klien pertama dan menghasilkan laporan yang actionable.

---

## Fase 2: Monitoring Dashboard — Tier Foundations (Minggu 9-14)

**Tujuan:** Produk langganan pertama — monitoring berkelanjutan

- [ ] Dashboard web app (login, brand setup, overview)
- [ ] Scheduled monitoring (harian/mingguan)
- [ ] Visualisasi metrik: SoA trend, accuracy trend, citation tracking
- [ ] Alert system: notifikasi saat visibility turun atau misinformasi terdeteksi
- [ ] Tambah adapter Gemini dan Google AI Overviews
- [ ] Multi-brand dan multi-query management
- [ ] Laporan berkala otomatis (mingguan/bulanan)
- [ ] Billing dan subscription management

**Deliverable:** Pelanggan bisa langganan dan memantau visibilitas AI brand mereka secara mandiri.

---

## Fase 3: Distribution Engine — Tier Growth (Minggu 15-20)

**Tujuan:** Fitur distribusi untuk pelanggan yang ingin aktif memperbaiki posisi

- [ ] Peta target distribusi: identifikasi sumber yang dipercaya AI
- [ ] Generasi konten dan structured data (schema markup)
- [ ] Workflow distribusi: assign → execute → track → measure
- [ ] Pengukuran dampak post-distribusi
- [ ] Template konten per industri
- [ ] Add-on billing untuk fitur distribusi

**Deliverable:** Pelanggan bisa menjalankan strategi distribusi dan mengukur dampaknya.

---

## Fase 4: Enterprise & Scale (Minggu 21+)

**Tujuan:** Fitur enterprise dan pertumbuhan

- [ ] Monitoring intensif (frekuensi lebih tinggi)
- [ ] Pelaporan mendalam dan custom reporting
- [ ] White-label capability untuk agensi
- [ ] API access untuk integrasi
- [ ] Template dan playbook per vertikal industri
- [ ] Ekspansi engine (Claude, Copilot, dll)
- [ ] Tim dan role management

**Deliverable:** Platform siap melayani enterprise dan agensi.

---

## Milestone Bisnis

| Milestone | Target | Metrik Sukses |
|---|---|---|
| Audit pertama selesai | Akhir Fase 1 | 1 klien berbayar, laporan delivered |
| 10 audit terjual | Selama Fase 2 | Validasi product-market fit |
| 5 pelanggan langganan Foundations | Akhir Fase 2 | MRR pertama |
| Studi kasus industri beachhead | Akhir Fase 2 | 1 studi kasus publishable |
| 20 pelanggan langganan | Akhir Fase 3 | MRR growing, churn < 10% |
| Klien enterprise pertama | Fase 4 | Retainer deal signed |

---

## Prinsip Pengembangan

1. **Ship audit dulu** — validasi pasar sebelum bangun monitoring penuh
2. **Manual dulu, otomasi kemudian** — distribusi bisa dimulai manual, otomasi seiring skala
3. **Satu wedge industry** — fokus satu vertikal sampai menang, baru perluas
4. **Bahasa Indonesia first** — query, parsing, dan laporan harus kuat di Bahasa
5. **Data sebagai moat** — setiap audit dan monitoring menambah dataset yang memperkuat platform

---

*Roadmap ini bersifat iteratif dan akan disesuaikan berdasarkan feedback pasar.*
