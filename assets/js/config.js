/* =========================================================
   Kurbağa Felsefesi — ayarlar
   ---------------------------------------------------------
   Site kutudan çıktığı gibi "yerel demo" modunda çalışır:
   notlar yalnızca ziyaretçinin tarayıcısında saklanır.

   Herkesin aynı duvarı görmesi için ücretsiz bir Supabase
   projesi açıp aşağıdaki iki alanı doldurman yeterli.
   Adım adım kurulum: README.md → "Herkese açık duvar".
   ========================================================= */

window.KF_CONFIG = {
  cloud: {
    provider: "supabase",
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
