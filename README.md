# 21kelime

**Günlük Türkçe kelime oyunu** — her gün 21 tur; her turda karışık harflerden, **tüm harfleri kullanarak** geçerli bir Türkçe kelime bul, süre dolmadan!

[18words.com](https://18words.com) konseptinin Türkçe uyarlamasıdır (mekanikler yeniden tasarlandı ve sıfırdan yazıldı).

## Oyun

- **21 tur / gün**, zorluk rampası: 3×4, 4×5, 4×6, 4×7, 3×8, 3×9 harfli kelimeler.
- Her tur **30 saniye**; süre dolarsa tur yanar ama oyun devam eder (skor X/21).
- Günde **3 ipucu**: cevabın sıradaki harfini yerine koyar (o tur 🟨 sayılır).
- **Aynı harflerle yazılan her sözlük kelimesi kabul edilir** (ör. _eczane / cenaze_, _hayır / hıyar_).
- 🌙 **Rahat mod**: süresiz oyna (paylaşımda 🌙 ile işaretlenir).
- **Arşiv** (geçmiş günler), **Antrenman** (sınırsız pratik), seri/istatistik takibi, spoiler'sız emoji paylaşım tablosu.
- Yeni bulmaca her gece yarısı **Türkiye saatiyle** (Europe/Istanbul, tüm dünya için aynı anda) yayınlanır. Gün 1 = 2026-07-12.

## Teknoloji

- **SvelteKit 2 + Svelte 5 (runes)**, TypeScript, Vite 8, Vitest 4.
- Sunucu tarafında tek `words.json` (sözlük istemciye asla gönderilmez); istemciye yalnızca günün turları, cevaplar hafifçe şifrelenmiş (XOR+hex — casual spoiler koruması) gider.
- Bulmacalar **deterministik** üretilir: build sırasında uzunluk başına seed'li karıştırılmış hedef havuzları çıkar, gün N havuzları dilimler → herkes aynı bulmacayı görür, sunucuda durum tutulmaz, kelimeler havuz bitene dek tekrarlanmaz.
- İlerleme/istatistik `localStorage`'da; hesap yok, çerez yok.

### Türkçe'ye özgü ayrıntılar

- Tüm harf işlemleri `tr-TR` locale ile (`toLocaleUpperCase`): `i→İ`, `ı→I`. Klavye girişi hem Türkçe Q hem F düzeninde çalışır (karakter bazlı).
- Şapkalı ünlüler oyunda sadeleştirilir: `â→a, î→i, û→u` (kâr = kar).
- Kelime kaynağı: [Zemberek-NLP](https://github.com/ahmetaa/zemberek-nlp) sözlükleri (Apache-2.0, TDK madde başları) + sıklık için [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (MIT). Hedef kelimeler sıklık eşiğiyle seçilir; doğrulama seti ~27k madde başıdır. `data/blocklist.txt` günlük hedeflerden çıkarılacak kelimeleri listeler (cevap olarak yine kabul edilirler).

## Geliştirme

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # birim testleri (41 test)
npm run check          # svelte-check / typecheck
npm run lint           # prettier + eslint
```

### Kelime verisini yeniden üretme

```bash
./scripts/fetch-data.sh    # ham verileri data/raw/ altına indirir
npm run build:words        # src/lib/server/data/words.json üretir
npm run build:words -- --report   # havuz istatistikleriyle
```

> Havuz sıralaması `21kelime-pools-v1` seed'iyle sabittir; seed'i değiştirmek TÜM günlerin bulmacalarını değiştirir. Yayına girdikten sonra kelime eklemek/çıkarmak da sonraki günlerin dizilimini kaydırır — canlıda veri güncellemesini yeni bir `POOL_SHUFFLE_SEED` sürümüyle ve bilinçli yap.

### Uçtan uca testler (gerçek Chrome ile oynar)

```bash
npm run build && npm run preview   # 4173 portunda
npm run test:e2e                   # ayrı terminalde
```

## Dağıtım

`@sveltejs/adapter-auto` kuruludur: Vercel / Netlify / Cloudflare'a repo'yu bağlamak yeterli. Belirli bir platforma sabitlemek için ilgili adapter'ı kur ([docs](https://svelte.dev/docs/kit/adapters)). Sunucu tarafı yalnızca iki küçük GET endpoint'i çalıştırır (`/api/puzzle/[date]`, `/api/practice`); veritabanı gerekmez.

Yayın kontrol listesi:

1. `21kelime.com` alan adını kaydet ve platforma bağla.
2. `npm run build` — üretim derlemesi.
3. Gün 1 tarihi `src/lib/game/daily.ts` içindeki `EPOCH_DATE` sabitidir; lansman gününe göre güncelle.
4. (İsteğe bağlı) Plausible/Umami gibi çerezsiz analitik ekle.

## Lisans ve atıf

Kod: MIT. Kelime verileri: Zemberek-NLP sözlükleri (Apache-2.0), FrequencyWords sıklık listesi (MIT). Oyun konsepti ilhamı: 18words.
