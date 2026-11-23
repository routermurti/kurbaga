# Kurbağa Felsefesi

Üyeliksiz, isimsiz ve reklamsız bir tek sayfa: kurbağa felsefesi üzerine kısa
dersler, bataklık bilgeliği kartları ve herkese açık anonim bir not duvarı.

Site tamamen statiktir. HTML, CSS ve JavaScript dışında bir derleme adımı yoktur;
bu yüzden GitHub Pages'e doğrudan yüklenebilir.

![Kurbağa Felsefesi](assets/img/og.png)

## Neler var?

- Tek sayfa: hero, üç kısa felsefe dersi, manifesto, not duvarı, bilgelik kartı ve kapanış.
- Üyelik, e-posta ve hesap gerektirmeyen anonim not bırakma.
- Notlar tarayıcıda güvenli biçimde (`textContent`) gösterilir; HTML enjekte edilmez.
- Karakter sayacı, taslak kaydetme, gönderim sonrası kısa bekleme süresi ve kopyalama.
- Mobil menü, klavye erişimi, azaltılmış hareket desteği ve erişilebilir diyalog.
- Varsayılan olarak **yerel demo**: notlar yalnızca o tarayıcının `localStorage`
  alanında saklanır. Ortak duvar için aşağıdaki Supabase adımlarını yap.

## Hızlı başlangıç

`index.html` dosyasını doğrudan açmak çoğu tarayıcıda çalışır; ancak bulut
modunu ve bazı tarayıcı API'lerini doğru test etmek için yerel bir sunucu
kullanmak daha iyidir.

```powershell
# Python 3 kuruluysa
python -m http.server 8080

# Alternatif: Node.js ile
npx serve .
```

Ardından `http://localhost:8080` adresini aç.

## GitHub Pages'e yükleme

1. GitHub'da bir repository oluştur.
2. Bu klasördeki tüm dosyaları repository'nin köküne yükle. `assets/`,
   `favicon.svg` ve `index.html` birlikte yüklenmeli.
3. **Settings → Pages → Build and deployment** bölümünde
   **Deploy from a branch** seçeneğini kullan.
4. Branch olarak `main`, klasör olarak `/ (root)` seç ve kaydet.
5. Sayfan birkaç dakika içinde `https://<kullanıcı>.github.io/<repo>/`
   adresinde yayına çıkar.

`.nojekyll` dosyası GitHub Pages'in dosyaları Jekyll ile işlemesini engeller;
bu repo için gereklidir ve silinmemelidir.

## Herkese açık ortak duvar (Supabase)

Varsayılan yerel demo modunda notlar başka ziyaretçiler tarafından görülmez.
Ortak bir duvar için ücretsiz bir Supabase projesi açıp iki anahtar girmen
yeterlidir.

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje oluştur.
2. Projenin **SQL Editor** bölümünü aç.
3. `supabase/schema.sql` dosyasının içeriğini yapıştırıp çalıştır.
   Bu SQL:
   - `notes` tablosunu ve `created_at` indeksini oluşturur,
   - satır seviyesi güvenliğini (RLS) açar,
   - anonim kullanıcılara yalnızca **okuma** ve **not ekleme** izni verir,
   - güncelleme ve silme izni vermez.
4. **Settings → API** bölümünden **Project URL** ve **anon public** anahtarını
   kopyala. `service_role` anahtarını **asla** kullanma.
5. `assets/js/config.js` dosyasında bu iki alanı doldur:

   ```js
   window.KF_CONFIG = {
     cloud: {
       provider: "supabase",
       supabaseUrl: "https://xxxxx.supabase.co",
       supabaseAnonKey: "eyJhbGciOi...",
       table: "notes"
     },
     // ...
   };
   ```

6. Sayfayı yenile. Üstteki durum etiketi `yerel demo` yerine
   `herkese açık` olmalı ve notlar artık aynı veritabanında saklanır.

> Not: `config.js` herkese açık bir ön yüz yapılandırmasıdır; içine yalnızca
> `anon public` anahtarını yaz. Supabase'in `service_role` anahtarı arka uç
> içindir ve tarayıcıya konulmamalıdır.

### Veritabanını doğrulama

Supabase tablosunda hızlı bir kontrol:

```sql
select count(*) from public.notes;
```

Yeni bir not gönderdikten sonra bu sayının artması, bulut bağlantısının çalıştığını
gösterir. Notları silmek veya denetlemek istersen Supabase Dashboard →
**Table Editor → notes** bölümünü kullanabilirsin.

## Dosya yapısı

```text
.
├── index.html              # Sayfa içeriği ve SVG sahnesi
├── assets/
│   ├── css/
│   │   ├── base.css        # Renkler, tipografi, header, hero, genel düzen
│   │   └── wall.css        # Not duvarı, form, kartlar, bilgelik kartı
│   ├── img/
│   │   └── og.png          # Sosyal paylaşım önizlemesi (1200 × 630)
│   └── js/
│       ├── app.js          # Arayüz etkileşimleri ve duvar mantığı
│       ├── config.js       # Supabase anahtarları ve duvar limitleri
│       └── store.js        # localStorage / Supabase veri adaptörü
├── supabase/
│   └── schema.sql          # Supabase tablo, indeks ve RLS politikaları
├── favicon.svg
├── .nojekyll
└── README.md
```

## Özelleştirme

- **Metinler:** `index.html` içindeki Türkçe metinler.
- **Renkler ve tipografi:** `assets/css/base.css` içindeki `:root` değişkenleri.
- **Bilgelik kartları:** `assets/js/app.js` içindeki `QUOTES` dizisi.
- **Duvar limitleri:** `assets/js/config.js` içindeki `wall` bölümü.
  Varsayılanlar: 480 karakter not, 24 karakter takma ad, 60 not, 20 saniye
  gönderim aralığı, 60 saniyede bir yenileme.
- **Sosyal önizleme:** `assets/img/og.png` dosyasını değiştirip
  `index.html` içindeki `og:image` yolunu güncelle. Paylaşım önizlemesi göreli
  yolu çözmezse `og:image` ve `twitter:image` içeriklerini sitenin tam URL'si
  ile yaz.

## Davranış ve sınırlar

- **Yerel demo:** Notlar yalnızca ziyaretçinin tarayıcısında tutulur; sayfa
  yenilendiğinde kaybolmaz, ancak başka cihazlardan görünmez.
- **Bulut modu:** Notlar ortak Supabase tablosunda saklanır. Herkes okuyabilir
  ve not ekleyebilir. Bu yüzden kişisel bilgi paylaşımını engelleyen bir
  arayüz/uyarı bulunur; yine de kullanıcıların yazdıklarından kullanıcı
  sorumludur.
- **Moderatör yoktur.** Site, spam ve uygunsuz içerik için otomatik filtreleme
  yapmaz. Gerekirse Supabase Dashboard üzerinden veya ek bir yönetim katmanıyla
  denetim ekleyebilirsin.
- **Supabase erişilemezse** son görülen notlar gösterilir ve durum etiketi
  `bağlantı yok` olur. Yeni not gönderimi tekrar denemeye açıktır.
- **Tarayıcı desteği:** Güncel Chrome, Edge, Firefox ve Safari. `dialog`
  ve `IntersectionObserver` desteklenmeyen eski tarayıcılarda temel içerik
  yine okunabilir; animasyonlar ve bazı etkileşimler sadeleşir.

## Lisans

MIT Lisansı. Ayrıntılar için [LICENSE](LICENSE) dosyasına bak.