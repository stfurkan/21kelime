# 21kelime

Günlük Türkçe kelime oyunu. Her gün 21 tur: süre dolmadan, karışık harflerin hepsini kullanıp geçerli bir kelime bulmalısın.

|             Oyun              |              Sonuç              |
| :---------------------------: | :-----------------------------: |
| ![Oyun ekranı](docs/oyun.png) | ![Sonuç ekranı](docs/sonuc.png) |

## Nasıl oynanır?

- Günde **21 tur** var. Kelimeler kısa başlar, gittikçe uzar: ilk turlar 4 harfli, son turlar 9 harfli.
- Her turun süresi **30 saniye**. Süre biterse o tur yanar, oyun sonraki turla devam eder; gün sonunda skorun X/21 olur.
- Günde **3 ipucu** hakkın var. İpucu, cevabın sıradaki harfini senin yerine koyar.
- Aynı harflerle yazılabilen **bütün sözlük kelimeleri** kabul edilir: cevap elmas diye selam yazdıysan o da doğrudur.
- Aceleyi sevmiyorsan **rahat modu** aç: süre yok, takıldığın turu geçebilirsin. Paylaşımda "rahat mod" etiketi görünür, gizli saklı yok.
- Sonucunu spoiler'sız emoji kartıyla paylaşabilir, hikaye boyutunda görsel indirebilir, arkadaşına meydan okuyabilirsin.
- Kaçırdığın günler **Arşiv**'de seni bekler; bol alıştırma için **Antrenman** var (her seferinde yeni kelimeler). Seri ve istatistikler yalnızca kendi cihazında tutulur.
- Açık ve koyu tema var; oyun klavyeyle de dokunmatik ekranla da rahatça oynanır.
- Yeni bulmaca her gece yarısı Türkiye saatiyle yayınlanır. Birinci gün 2026-07-12; bu tarihi [src/lib/game/daily.ts](src/lib/game/daily.ts) içindeki `EPOCH_DATE` belirler.

## Nasıl çalışır?

- **SvelteKit 2 + Svelte 5 (runes)**, TypeScript, Vite 8, Vitest 4. Cloudflare Workers üzerinde çalışır.
- Sözlük istemciye hiç gitmez. Tarayıcıya yalnızca günün turları iner, cevaplar da hafifçe şifrelenmiştir. Yarının bulmacasını isteyen 404 alır.
- Bulmacalar deterministiktir: kelime havuzları derleme sırasında sabit bir tohumla bir kez karıştırılır, her gün havuzdan sırayla çekilir. Veritabanı yoktur; dünyanın neresinde olursan ol herkes aynı bulmacayı çözer.
- En hassas kısım Türkçe'nin kendisi: bütün harf işlemleri `tr-TR` locale ile yapılır (İ/i ve I/ı ayrımı), şapkalı harfler sadeleştirilir (kâr = kar), klavye girişi hem Q hem F düzeninde çalışır.

## Geliştirme

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # birim testleri
npm run check          # tip denetimi
npm run lint           # prettier + eslint
```

### Kelime verisi

Kelimeler iki açık kaynaktan alınmıştır: Zemberek-NLP sözlükleri (TDK madde başlıkları) ve FrequencyWords sıklık listesi. Veriyi yeniden üretmek istersen:

```bash
./scripts/fetch-data.sh           # ham verileri indirir
npm run build:words               # words.json'ı üretir
npm run build:words -- --report   # havuz istatistiklerini de gösterir
```

Günlük bulmacada çıkmasını istemediğin kelimeleri [data/blocklist.txt](data/blocklist.txt) dosyasına ekleyebilirsin; oyuncu yazarsa yine kabul edilir, sadece soru olarak sorulmaz.

**Dikkat:** Havuz sırası `POOL_SHUFFLE_SEED` tohumuna bağlı. Kelime verisini ya da tohumu değiştirirsen gelecek günlerin bulmacaları baştan sona değişir. Site yayındayken veri güncellemesini bilerek ve isteyerek yap, tohumun sürümünü de artır.

### Uçtan uca testler

Gerçek Chrome açıp oyunu baştan sona oynar:

```bash
npm run build && npm run preview   # 4173 portunda çalışır
npm run test:e2e                   # ayrı bir terminalde
```

## Yayınlama

Cloudflare Workers'a yayınlamak için tek komut yeter (derlemeyi wrangler kendisi çalıştırır):

```bash
npx wrangler deploy
```

GitHub'a bağlayıp otomatik dağıtım da kurabilirsin: Cloudflare panelinde Workers → Import a repository de, gerisini [wrangler.jsonc](wrangler.jsonc) halleder. Ziyaretçi sayıları için panelden Web Analytics'i açman yeterli; alan adı Cloudflare'dan geçtiği için kod tarafında hiçbir şey gerekmez, çerez de kullanılmaz.

## Lisans ve atıf

- Kod: MIT.
- Kelime verileri: [Zemberek-NLP](https://github.com/ahmetaa/zemberek-nlp) sözlükleri (Apache-2.0) ve [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (MIT).
- Oyun, [18words.com](https://18words.com)'dan ilham alınarak Türkçe için sıfırdan tasarlandı ve yazıldı.
