/* =========================================================
   Kurbağa Felsefesi — ayarlar
   ---------------------------------------------------------
   Site kutudan çıktığı gibi "yerel demo" modunda çalışır:
   notlar yalnızca ziyaretçinin tarayıcısında saklanır.

   Ortak duvar için iki seçenek var:
   1) Kendi cPanel sunucun: provider "custom" + apiBase
   2) Supabase: provider "supabase" + URL/anon anahtar

   cPanel kurulumu: DEPLOY.md → "GitHub Pages + cPanel".
   ========================================================= */

window.KF_CONFIG = {
  cloud: {
    // "local" = sadece bu tarayıcı, "custom" = kendi sunucun, "supabase" = Supabase
    provider: "custom",

    // cPanel hazır olunca:
    // "https://api.perihanmustafayeva.com/api.php"
    apiBase: "",

    supabaseUrl: "",       // örn. "https://abcdefgh.supabase.co"
    supabaseAnonKey: "",   // Settings → API → anon public anahtarı
    table: "notes"
  },

  wall: {
    maxLength: 480,
    nicknameMax: 24,
    limit: 60,
    cooldownSeconds: 20,
    pollSeconds: 60
  }
};