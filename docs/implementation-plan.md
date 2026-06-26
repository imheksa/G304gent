# Rencana Implementasi: Integrasi Engine AI Asli

Dokumen ini menjabarkan langkah teknis bertahap untuk mengubah 6304 Agent dari
prototipe data dummy menjadi platform yang benar-benar memanggil engine AI,
menganalisis hasil, dan menyimpan skor.

## Kondisi Saat Ini

| Aspek | Status sekarang |
|-------|-----------------|
| Frontend | Next.js 16 static export (`output: "export"`, `basePath: "/G304gent"`) di GitHub Pages |
| Auth | Firebase Auth (Google sign-in) — sudah jalan |
| Data brand/kompetitor | `localStorage` (belum ada server) |
| Data skor | Dummy, di-generate dari hash nama brand (`src/lib/brand-data.ts`) |
| Backend | **Belum ada** |

**Kendala utama:** static export tidak bisa menjalankan API route, dan API key
engine AI tidak boleh diekspos di browser. Maka butuh lapisan backend.

## Keputusan Arsitektur

- **Backend:** Firebase Cloud Functions (callable functions) — dipilih karena
  auth sudah memakai Firebase, jadi integrasi token & user paling mulus.
- **Database:** Firestore — simpan brand, hasil scan, histori, dan kuota.
- **Engine AI:** OpenRouter (1 API key untuk ChatGPT, Gemini, Claude, Grok,
  Deepseek). Google AI Overviews lewat SerpApi (ditunda ke fase lanjut).
- **Frontend tetap** static export di GitHub Pages; hanya memanggil Functions.

```
Browser (GitHub Pages) ──callable──▶ Firebase Functions ──▶ OpenRouter (5 engine)
        │                                   │            └─▶ SerpApi (Google AI, fase 4)
        └──────── Firestore (via SDK) ◀─────┘
```

---

## Fase 0 — Fondasi Backend (prasyarat)

**Tujuan:** menyiapkan infrastruktur tanpa mengubah perilaku frontend.

- [ ] Inisialisasi Firebase Functions (`firebase init functions`, TypeScript)
- [ ] Aktifkan Firestore + tulis `firestore.rules` (user hanya akses datanya)
- [ ] Simpan secret: `OPENROUTER_API_KEY` (dan `SERPAPI_KEY` nanti) via
      `firebase functions:secrets:set`
- [ ] Struktur koleksi Firestore:
  - `users/{uid}` — profil, tier, kuota terpakai
  - `users/{uid}/brands/{brandId}` — nama brand, canonical facts
  - `users/{uid}/scans/{scanId}` — hasil scan + timestamp
- [ ] Helper verifikasi auth token di setiap callable function

**Hasil:** backend siap dipanggil, belum dipakai frontend.

---

## Fase 1 — Adapter Engine (OpenRouter)

**Tujuan:** satu fungsi yang bisa bertanya ke 5 engine via OpenRouter.

- [ ] `functions/src/engines/openrouter.ts` — wrapper `POST /chat/completions`
- [ ] Mapping nama engine → model id OpenRouter:
  - ChatGPT → `openai/gpt-4o-mini`
  - Gemini → `google/gemini-flash-1.5`
  - Claude → `anthropic/claude-3.5-haiku`
  - Grok → `x-ai/grok-2`
  - Deepseek → `deepseek/deepseek-chat`
- [ ] Penanganan error & timeout per engine (1 engine gagal ≠ scan gagal)
- [ ] Jalankan paralel dengan `Promise.allSettled`

> Catatan: gunakan model murah (mini/flash/haiku) untuk menekan biaya.
> Bisa di-upgrade per-tier nanti.

---

## Fase 2 — Mesin Analisis & Scoring

**Tujuan:** mengubah jawaban mentah AI menjadi metrik (Brand Score, Share of
Answer, Accuracy).

- [ ] Generator query relevan dari kategori brand (mulai 10 query untuk MVP)
- [ ] Untuk tiap jawaban engine, panggil **LLM-judge** (model murah) untuk menilai:
  - apakah brand disebut? (boolean)
  - akurasi info vs canonical facts (skor 0–100)
  - sentimen / posisi vs kompetitor
- [ ] Hitung agregat:
  - **Share of Answer** = % query di mana brand muncul
  - **Accuracy Score** = rata-rata skor akurasi
  - **Brand Score** = komposit tertimbang
- [ ] Simpan hasil ke `users/{uid}/scans/{scanId}`

---

## Fase 3 — Integrasi Frontend

**Tujuan:** ganti data dummy dengan data scan asli.

- [ ] Tambah Firestore SDK ke `src/lib/firebase.ts`
- [ ] `src/lib/api.ts` — pemanggil callable function (`runScan`, `getScan`)
- [ ] Ganti `getSavedBrands`/`brand-data.ts` agar baca dari Firestore (fallback
      localStorage untuk mode tamu/demo)
- [ ] Quick Scan & Dashboard: panggil `runScan`, tampilkan progress nyata
      (scan async, polling status atau listener Firestore)
- [ ] State loading/error yang proper (scan butuh 30–90 detik)

---

## Fase 4 — Kuota, Tier & Google AI Overviews

**Tujuan:** kendali biaya & lengkapi engine ke-6.

- [ ] Enforce limit per tier di Functions (Free: 1 brand / X scan per bulan, dst)
- [ ] Catat pemakaian di `users/{uid}.quota`, tolak jika lewat batas
- [ ] Adapter SerpApi untuk Google AI Overviews (`functions/src/engines/serpapi.ts`)
- [ ] (Opsional) Stripe untuk upgrade tier

---

## Fase 5 — Polish & Operasional

- [ ] Histori scan + grafik tren di dashboard
- [ ] Alert misinformasi (Firestore trigger → email via SendGrid)
- [ ] Caching hasil (jangan scan ulang brand sama < 24 jam)
- [ ] Logging & monitoring biaya OpenRouter
- [ ] Update `docs/architecture.md` & `docs/roadmap.md` (hapus referensi
      Perplexity/AI Overviews lama)

---

## Estimasi Biaya Operasional

| Skenario | ±Panggilan AI | Estimasi biaya/scan |
|----------|---------------|---------------------|
| MVP (10 query, model murah) | ±120 | **< $0.20** |
| Scan penuh (50 query) | ±600 | **$0.30–0.70** |
| + Google AI Overviews | — | +$0.20–1.00 |

Wajib ada kuota per tier sebelum dibuka ke publik.

---

## Urutan Pengerjaan yang Disarankan

1. **Fase 0 + 1** — backend + 1 engine jalan (bukti konsep)
2. **Fase 2** — scoring untuk 1 brand
3. **Fase 3** — sambungkan ke UI, ganti dummy
4. **Fase 4–5** — kuota, engine ke-6, polish

> Setiap fase berdiri sendiri & bisa di-deploy bertahap tanpa merusak
> frontend yang sudah live.
