# Kurbağa Felsefesi — GitHub Pages + cPanel kurulumu

Bu rehber, siteyi şu şekilde kurmak için:

- **Ön yüz:** `https://routermurti.github.io/kurbaga/`
- **Backend:** `https://api.perihanmustafayeva.com/api.php`
- **Veritabanı:** cPanel MySQL / MariaDB

```text
GitHub Pages (statik ön yüz)
        │
        │ HTTPS + CORS
        ▼
cPanel API (PHP)
        │
        ▼
MySQL: wwwafyon_kurbaga
```

## 1. cPanel'de API subdomain'i oluştur

1. cPanel → **Alan Adları** → **Subdomains**.
2. Subdomain: `api`
3. Ana alan adı: `perihanmustafayeva.com`
4. Document root: `/public_html/api`
5. Oluştur.

Sonuç adres: `https://api.perihanmustafayeva.com/`

## 2. SSL sertifikası

1. cPanel → **SSL/TLS Status** veya **SSL/TLS Certificates**.
2. `api.perihanmustafayeva.com` için **Run AutoSSL** yap.
3. Sertifika aktif olana kadar bekle.

## 3. MySQL veritabanı oluştur

1. cPanel → **MySQL Databases**.
2. Yeni veritabanı: `wwwafyon_kurbaga`
3. Yeni kullanıcı: `wwwafyon_kurbaga`
4. Güçlü bir şifre oluştur.
5. Kullanıcıyı veritabanına ekle ve **ALL PRIVILEGES** ver.

Not: cPanel kullanıcı adı önekini otomatik ekler. Gerçek ad
`wwwafyon_kurbaga` olabilir; cPanel'de gördüğün tam adı kullan.

## 4. `server/` dosyalarını yükle

cPanel → **File Manager** → `/public_html/api` klasörünü aç.

`server/` klasörünün **içindeki** dosyaları bu klasöre yükle:

- `api.php`
- `config.php`
- `db.php`
- `schema.sql`
- `.htaccess`

`server` klasörünü olduğu gibi yükleme; içeriğini yükle.

## 5. `config.php` dosyasını düzenle

`/public_html/api/config.php` dosyasını aç ve doldur:

```php
'db' => [
    'host'     => 'localhost',
    'port'     => 3306,
    'name'     => 'wwwafyon_kurbaga',
    'user'     => 'wwwafyon_kurbaga',
    'password' => 'BURAYA_MYSQL_SIFRESI',
],
```

Ayrıca:

```php
'security' => [
    'ip_salt' => 'BURAYA_UZUN_RASTGELE_BIR_DEGER',
],
```

`ip_salt` için uzun rastgele bir değer yaz. Bu değer IP adreslerini
hash'lemek için kullanılır; gerçek IP'ler veritabanında saklanmaz.

## 6. Veritabanını içe aktar

1. cPanel → **phpMyAdmin**.
2. `wwwafyon_kurbaga` veritabanını seç.
3. **Import** → `schema.sql` dosyasını seç → çalıştır.
4. `users`, `notes` ve `user_tokens` tabloları oluşmalı.

## 7. API'yi test et

Tarayıcıda aç:

```text
https://api.perihanmustafayeva.com/api.php?action=health
```

Beklenen çıktı:

```json
{"ok":true,"service":"kurbaga-api","time":"2026-11-25T..."}
```

Notlar:

```text
https://api.perihanmustafayeva.com/api.php?action=notes
```

## 8. Ön yüzü API'ye bağla

`assets/js/config.js` dosyasında:

```js
cloud: {
  provider: "custom",
  apiBase: "https://api.perihanmustafayeva.com/api.php",
  // ...
}
```

`provider` değeri `"custom"` olmalı. `apiBase` boş kalırsa site otomatik olarak
yerel demo moduna düşer.

## 9. GitHub'a yükle

`assets/js/config.js` değişikliğini GitHub'a yükle. GitHub Pages birkaç dakika
içinde yeniden yayınlar.

Site açıldığında üstteki durum etiketi `yerel demo` yerine `herkese açık`
olmalı.

## API uç noktaları

| İşlem | Yöntem | Adres |
|---|---|---|
| Sağlık | GET | `/api.php?action=health` |
| Notlar | GET | `/api.php?action=notes&limit=60` |
| Not bırak | POST | `/api.php?action=notes` |
| Kayıt | POST | `/api.php?action=register` |
| Giriş | POST | `/api.php?action=login` |
| Oturum | GET | `/api.php?action=me` |
| Çıkış | POST | `/api.php?action=logout` |

Not bırakma isteği:

```json
{
  "nickname": "İsimsiz Kurbağa",
  "body": "Bataklıktan bir not."
}
```

## Kullanıcı sistemi

Backend'de kullanıcı altyapısı hazır:

- `users`: ad, e-posta, şifre hash'i
- `user_tokens`: 30 günlük oturum anahtarları
- Şifreler `password_hash()` ile saklanır
- Giriş token'ı `Authorization: Bearer <token>` başlığıyla kullanılır

Ön yüzde henüz giriş/kayıt ekranı yok. İstersen sonraki adımda GitHub Pages
üzerindeki arayüze giriş penceresi ekleyebiliriz.

## Güvenlik

- `config.php` içindeki MySQL şifresini GitHub'a yükleme.
- `server/` klasörünü GitHub Pages'e yükleme; sadece cPanel'e yükle.
- Supabase `service_role` anahtarını kullanma.
- API'de `allowed_origins` listesini ihtiyacına göre daralt.
- cPanel'de AutoSSL açık olsun; HTTP'yi HTTPS'ye yönlendir.
- Düzenli yedek al: MySQL + `/public_html/api`.

## Yerel test

Yerel bilgisayarda `http://localhost:4173` zaten `allowed_origins` içinde.
`apiBase` boşken site yerel demo modunda çalışır; notlar tarayıcıda kalır.