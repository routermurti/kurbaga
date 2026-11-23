/* =========================================================
   Kurbağa Felsefesi — arayüz
   ========================================================= */

(function () {
  "use strict";

  var KF = window.KF || {};
  var CONFIG = window.KF_CONFIG || {};
  var WALL = Object.assign({
    maxLength: 480,
    nicknameMax: 24,
    limit: 60,
    cooldownSeconds: 20,
    pollSeconds: 60
  }, CONFIG.wall || {});

  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  var toastTimer = null;
  function showToast(message, isError) {
    var toast = $("#toast");
    var text = $("#toast-text");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.toggle("is-error", Boolean(isError));
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 4200);
  }

  function readDraft(key) {
    try { return window.localStorage.getItem(key) || ""; } catch (err) { return ""; }
  }
  function writeDraft(key, value) {
    try {
      if (value) window.localStorage.setItem(key, value);
      else window.localStorage.removeItem(key);
    } catch (err) { /* storage kapalı olabilir */ }
  }

  function formatFullDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(date);
    } catch (err) {
      return date.toLocaleString("tr-TR");
    }
  }

  function relativeTime(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return "şimdi";
    var diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 45) return "az önce";
    if (diff < 3600) return Math.max(1, Math.floor(diff / 60)) + " dk önce";
    if (diff < 86400) return Math.floor(diff / 3600) + " sa önce";
    if (diff < 604800) return Math.floor(diff / 86400) + " gün önce";
    try {
      return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(date);
    } catch (err) {
      return date.toLocaleDateString("tr-TR");
    }
  }

  function setYear() {
    var year = String(new Date().getFullYear());
    ["#year", "#year-2"].forEach(function (selector) {
      var el = $(selector);
      if (el) el.textContent = year;
    });
  }

  /* ---------- Reveal on scroll ---------- */

  function initReveal() {
    var elements = $$(".reveal");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isStatic = /(?:^|[?&])static=1(?:&|$)/.test(window.location.search);
    if (isStatic) {
      var style = document.createElement("style");
      style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
      document.head.appendChild(style);
    }
    if (isStatic || !("IntersectionObserver" in window) || reduce) return;

    elements.forEach(function (el) { el.classList.add("is-pending"); });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.classList.remove("is-pending");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
    elements.forEach(function (el) { observer.observe(el); });

    window.setTimeout(function () {
      elements.forEach(function (el) {
        el.classList.add("is-visible");
        el.classList.remove("is-pending");
      });
    }, 2800);
  }

  /* ---------- Header & navigation ---------- */

  function initHeader() {
    var toggle = $(".menu-toggle");
    var menu = $("#mobile-nav");
    if (!toggle || !menu) return;

    function closeMenu() {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      var label = $(".sr-only", toggle);
      if (label) label.textContent = "Menüyü aç";
      var use = $("use", toggle);
      if (use) use.setAttribute("href", "#i-menu");
    }

    toggle.addEventListener("click", function () {
      var open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      var label = $(".sr-only", toggle);
      if (label) label.textContent = open ? "Menüyü kapat" : "Menüyü aç";
      var use = $("use", toggle);
      if (use) use.setAttribute("href", open ? "#i-close" : "#i-menu");
    });

    $$("a", menu).forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !menu.hidden) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (menu.hidden) return;
      if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 940 && !menu.hidden) closeMenu();
    });

    if ("IntersectionObserver" in window) {
      var sections = ["felsefe", "duvar", "bilgelik"].map(function (id) {
        return document.getElementById(id);
      }).filter(Boolean);
      var navObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          $$(".nav a, .mobile-nav a:not(.btn)").forEach(function (link) {
            var active = link.getAttribute("href") === "#" + entry.target.id;
            if (active) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-35% 0px -55% 0px" });
      sections.forEach(function (section) { navObserver.observe(section); });
    }
  }

  /* ---------- Floating button ---------- */

  function initFab() {
    var fab = $("#fab");
    var hero = $(".hero");
    var wall = $("#duvar");
    var footer = $(".site-footer");
    if (!fab || !hero) return;
    var ticking = false;

    function update() {
      ticking = false;
      var pastHero = window.scrollY > window.innerHeight * 0.72;
      var wallRect = wall ? wall.getBoundingClientRect() : null;
      var inWall = wallRect && wallRect.top < window.innerHeight * 0.72 && wallRect.bottom > window.innerHeight * 0.25;
      var footerRect = footer ? footer.getBoundingClientRect() : null;
      var atFooter = footerRect && footerRect.top < window.innerHeight * 0.92;
      fab.classList.toggle("is-visible", pastHero && !inWall && !atFooter);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- Frog ---------- */

  function initFrog() {
    var button = $("#frog-button");
    var bubble = $("#frog-bubble");
    if (!button || !bubble) return;
    var lines = [
      "vırak.",
      "insanlar yine mi?",
      "su güzel, sen de gel.",
      "bir not bırak, rahatla.",
      "ben kurbağayım, sen?",
      "sessizlik de bir cevaptır.",
      "zıplamadan olmaz.",
      "bu nilüfer senin de."
    ];
    var index = 0;
    var hideTimer = null;
    button.addEventListener("click", function () {
      bubble.textContent = lines[index % lines.length];
      index += 1;
      bubble.classList.add("is-visible");
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () {
        bubble.classList.remove("is-visible");
      }, 3000);
    });
  }

  /* ---------- Quotes ---------- */

  var QUOTES = [
    { tag: "sabır", text: "Her bataklık, kendi nilüferini yetiştirir." },
    { tag: "dinlemek", text: "Sessizlik, vıraklamayan kurbağanın değil; dinlemeyenin sorunudur." },
    { tag: "cesaret", text: "Düşmek, zıplamanın kanıtıdır." },
    { tag: "deneyim", text: "Suya girmeden yüzmeyi öğrenen tek canlı insandır; bu yüzden hep kıyıda kalır." },
    { tag: "sohbet", text: "Bir taşın üstünde iki kurbağa varsa, orada zaten bir sohbet vardır." },
    { tag: "bakış", text: "Gökyüzüne bakmak için başını kaldırman gerekmez; bazen suda da görünür." },
    { tag: "ifade", text: "En güzel vırak, duyulmayı beklemeyen vıraktır." },
    { tag: "kökler", text: "Kurbağa battığı yeri unutmaz; insan çıktığı yeri unutmamalı." },
    { tag: "dinginlik", text: "Bazı günler sadece yaprağın üstünde durmak da bir felsefedir." }
  ];

  function initQuotes() {
    var tagEl = $("#quote-tag");
    var textEl = $("#quote-text");
    var countEl = $("#quote-count");
    var prev = $("#quote-prev");
    var next = $("#quote-next");
    var nextArrow = $("#quote-next-arrow");
    if (!tagEl || !textEl || !countEl) return;

    var start = 0;
    try {
      var day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      start = day % QUOTES.length;
    } catch (err) { start = 0; }
    var index = start;
    var timer = null;

    function paint() {
      var quote = QUOTES[index];
      tagEl.textContent = quote.tag;
      textEl.textContent = quote.text;
      countEl.textContent = String(index + 1).padStart(2, "0") + " / " + String(QUOTES.length).padStart(2, "0");
    }

    function move(direction) {
      index = (index + direction + QUOTES.length) % QUOTES.length;
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { paint(); return; }
      textEl.classList.add("is-switching");
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        paint();
        textEl.classList.remove("is-switching");
      }, 160);
    }

    paint();
    if (prev) prev.addEventListener("click", function () { move(-1); });
    if (next) next.addEventListener("click", function () { move(1); });
    if (nextArrow) nextArrow.addEventListener("click", function () { move(1); });
  }

  /* ---------- Privacy dialog ---------- */

  function initDialog(isCloud) {
    var dialog = $("#privacy-dialog");
    if (!dialog) return;
    $$("[data-local-only]").forEach(function (el) { el.hidden = Boolean(isCloud); });

    function openDialog() {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      document.documentElement.style.overflow = "hidden";
    }
    function closeDialog() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      document.documentElement.style.overflow = "";
    }

    $$("[data-open-privacy]").forEach(function (button) {
      button.addEventListener("click", openDialog);
    });
    $$("[data-close-dialog]", dialog).forEach(function (button) {
      button.addEventListener("click", closeDialog);
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("close", function () {
      document.documentElement.style.overflow = "";
    });
  }

  /* ---------- Wall ---------- */

  function initWall() {
    var form = $("#note-form");
    if (!form) return;

    var store = KF.createStore ? KF.createStore(CONFIG) : null;
    if (!store) {
      showToast("Not deposu yüklenemedi. Sayfayı yenile.", true);
      return;
    }

    var isCloud = store.mode === "cloud";
    var els = {
      grid: $("#notes-grid"),
      skeleton: $("#notes-skeleton"),
      empty: $("#empty-state"),
      notice: $("#feed-notice"),
      total: $("#note-total"),
      updated: $("#feed-updated"),
      mode: $("#mode-chip"),
      refresh: $("#refresh-notes"),
      footnote: $("#wall-footnote"),
      form: form,
      nickname: $("#nickname"),
      nicknameCount: $("#nickname-count"),
      note: $("#note"),
      noteCount: $("#note-count"),
      error: $("#note-error"),
      submit: $("#submit-note"),
      website: $("#website")
    };
    var template = $("#note-template");
    var localNotice = "Yerel demo: notlar yalnızca bu tarayıcıda saklanıyor. Herkesin görmesi için README'deki Supabase kurulumunu yap.";
    var state = {
      notes: [],
      loaded: false,
      loading: false,
      failed: false
    };

    initDialog(isCloud);

    /* mode indicator */
    if (els.mode) {
      els.mode.textContent = isCloud ? "herkese açık" : "yerel demo";
      els.mode.setAttribute("data-mode", isCloud ? "cloud" : "local");
      els.mode.title = isCloud
        ? "Notlar herkesin görebileceği ortak duvarda saklanıyor."
        : "Demo modu: notlar yalnızca bu tarayıcıda saklanıyor.";
    }
    if (isCloud) {
      if (els.footnote) els.footnote.textContent = "En yeni " + WALL.limit + " not gösteriliyor. Moderatör yok; nezaket sende.";
    } else if (els.notice) {
      els.notice.hidden = false;
      els.notice.className = "feed-notice";
      els.notice.textContent = localNotice;
    }

    /* draft */
    var draftNote = $("#note");
    var draftName = $("#nickname");
    if (draftNote) draftNote.value = readDraft("kf.draft.v1").slice(0, WALL.maxLength);
    if (draftName) draftName.value = readDraft("kf.draftname.v1").slice(0, WALL.nicknameMax);

    function updateCounts() {
      if (els.noteCount && els.note) {
        var noteLength = els.note.value.length;
        els.noteCount.textContent = noteLength + " / " + WALL.maxLength;
        els.noteCount.classList.toggle("is-near", noteLength > WALL.maxLength * 0.86);
      }
      if (els.nicknameCount && els.nickname) {
        els.nicknameCount.textContent = els.nickname.value.length + "/" + WALL.nicknameMax;
      }
    }
    updateCounts();

    if (els.note) {
      els.note.addEventListener("input", function () {
        updateCounts();
        writeDraft("kf.draft.v1", els.note.value);
        clearError();
      });
    }
    if (els.nickname) {
      els.nickname.addEventListener("input", function () {
        updateCounts();
        writeDraft("kf.draftname.v1", els.nickname.value);
      });
    }

    /* render */
    var iconCycle = ["#i-lily", "#i-reed", "#i-moon", "#i-lily"];

    function noteCard(note, isNew) {
      if (!template || !template.content) return null;
      var card = template.content.firstElementChild.cloneNode(true);
      card.dataset.id = note.id;
      if (isNew) card.classList.add("is-new");
      $(".note-body", card).textContent = note.body;
      $(".note-name", card).textContent = note.nickname || "İsimsiz Kurbağa";
      var copyButton = $(".note-copy", card);
      if (copyButton) copyButton.setAttribute("aria-label", "Notu kopyala: " + note.body.slice(0, 48));
      var time = $(".note-time", card);
      time.dateTime = note.created_at;
      time.textContent = relativeTime(note.created_at);
      time.title = formatFullDate(note.created_at);
      var stampUse = $(".note-stamp use", card);
      if (stampUse) {
        var sum = 0;
        String(note.id).split("").forEach(function (char) { sum += char.charCodeAt(0); });
        stampUse.setAttribute("href", iconCycle[sum % iconCycle.length]);
      }
      return card;
    }

    function render(isNewId) {
      if (!els.grid) return;
      els.grid.innerHTML = "";
      els.grid.setAttribute("aria-busy", "false");
      var hasNotes = state.notes.length > 0;
      if (els.skeleton) els.skeleton.hidden = true;
      if (els.empty) els.empty.hidden = hasNotes;
      els.grid.hidden = !hasNotes;
      if (els.total) els.total.textContent = state.notes.length + " not";
      if (!hasNotes) return;

      state.notes.forEach(function (note) {
        var card = noteCard(note, note.id === isNewId);
        if (card) els.grid.appendChild(card);
      });
    }

    function refreshTimes() {
      if (!els.grid) return;
      state.notes.forEach(function (note) {
        var card = els.grid.querySelector('[data-id="' + (window.CSS && CSS.escape ? CSS.escape(note.id) : note.id) + '"]');
        if (!card) return;
        var time = $(".note-time", card);
        if (time) time.textContent = relativeTime(note.created_at);
      });
    }

    function setMode(stateName) {
      if (!els.mode) return;
      if (stateName === "error") {
        els.mode.textContent = "bağlantı yok";
        els.mode.setAttribute("data-mode", "error");
      } else {
        els.mode.textContent = isCloud ? "herkese açık" : "yerel demo";
        els.mode.setAttribute("data-mode", isCloud ? "cloud" : "local");
      }
    }

    function showNotice(message, isError) {
      if (!els.notice) return;
      els.notice.hidden = !message;
      els.notice.textContent = message || "";
      els.notice.className = "feed-notice" + (isError ? " is-error" : "");
    }

    function setLoading(loading) {
      state.loading = loading;
      if (els.refresh) {
        els.refresh.disabled = loading;
        els.refresh.classList.toggle("is-spinning", loading);
      }
      if (els.grid && !state.loaded) els.grid.setAttribute("aria-busy", String(loading));
    }

    function load(options) {
      var silent = options && options.silent;
      if (state.loading) return;
      setLoading(true);
      if (!state.loaded && !silent && !state.notes.length && els.skeleton) els.skeleton.hidden = false;
      if (!state.loaded && !silent && !state.notes.length && els.empty) els.empty.hidden = true;

      store.loadNotes().then(function (notes) {
        state.notes = notes;
        state.loaded = true;
        state.failed = false;
        setMode("ok");
        if (!isCloud) {
          showNotice(localNotice);
        } else {
          showNotice("");
        }
        render(null);
        if (els.updated) els.updated.textContent = "az önce güncellendi";
      }).catch(function (error) {
        state.failed = true;
        if (!state.notes.length) {
          state.notes = store.getCachedNotes ? store.getCachedNotes() : [];
        }
        state.loaded = true;
        setMode("error");
        if (!isCloud) {
          if (els.skeleton) els.skeleton.hidden = true;
          showNotice("Notlar okunamadı. Tarayıcı depolaması kapalı olabilir.", true);
        } else {
          showNotice("Buluta şu an ulaşamıyoruz. " + (state.notes.length ? "Son görülen notlar aşağıda; yeni not göndermek için tekrar dene." : "Bağlantını kontrol edip yenile."), true);
        }
        render(null);
        if (!silent) showToast(error.message || "Notlar yüklenemedi.", true);
        if (els.updated) els.updated.textContent = "güncellenemedi";
      }).then(function () {
        setLoading(false);
      });
    }

    /* form */
    function clearError() {
      if (!els.error) return;
      els.error.textContent = "";
      els.error.closest && els.error.closest(".field") && els.error.closest(".field").classList.remove("has-error");
      if (els.note) els.note.removeAttribute("aria-invalid");
    }

    function setError(message) {
      if (!els.error) return;
      els.error.textContent = message;
      var field = els.error.closest(".field");
      if (field) field.classList.add("has-error");
      if (els.note) {
        els.note.setAttribute("aria-invalid", "true");
        els.note.focus();
      }
    }

    function cooldownLeft() {
      try {
        var last = Number(window.localStorage.getItem("kf.lastpost.v1") || 0);
        var passed = (Date.now() - last) / 1000;
        var left = WALL.cooldownSeconds - passed;
        return left > 0 ? Math.ceil(left) : 0;
      } catch (err) { return 0; }
    }

    function setBusy(busy) {
      form.classList.toggle("is-busy", busy);
      if (els.submit) els.submit.disabled = busy;
      form.setAttribute("aria-busy", String(busy));
    }

    if (els.note) {
      els.note.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          if (typeof form.requestSubmit === "function") form.requestSubmit();
          else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearError();
      if (state.loading) {
        showToast("Duvar yükleniyor, bir saniye.");
        return;
      }

      var nickname = (els.nickname ? els.nickname.value : "").trim().slice(0, WALL.nicknameMax);
      var body = (els.note ? els.note.value : "").trim();

      if (!body) {
        setError("Boş bir not bırakamazsın. Bir cümle yeter.");
        return;
      }
      if (body.length > WALL.maxLength) {
        setError("Notun " + WALL.maxLength + " karakterden uzun olamaz.");
        return;
      }
      if (els.website && els.website.value) {
        form.reset();
        updateCounts();
        showToast("Notun nilüfere bırakıldı.");
        return;
      }
      var left = cooldownLeft();
      if (left > 0) {
        setError("Yeni bir not için " + left + " saniye daha beklemelisin.");
        return;
      }

      setBusy(true);
      store.addNote({ nickname: nickname, body: body }).then(function (note) {
        state.notes.unshift(note);
        state.notes = state.notes.slice(0, WALL.limit);
        state.loaded = true;
        if (store.rememberNotes) store.rememberNotes(state.notes);
        render(note.id);
        if (els.note) els.note.value = "";
        writeDraft("kf.draft.v1", "");
        updateCounts();
        if (els.note) els.note.focus();
        if (els.updated) els.updated.textContent = "az önce güncellendi";
        showNotice(isCloud ? "" : localNotice);
        if (els.mode && !isCloud) setMode("ok");
        try { window.localStorage.setItem("kf.lastpost.v1", String(Date.now())); } catch (err) {}
        showToast("Notun nilüfere bırakıldı.");
      }).catch(function (error) {
        showNotice("Not gönderilemedi. Bağlantını kontrol edip yeniden dene.", true);
        showToast(error.message || "Not gönderilemedi.", true);
      }).then(function () {
        setBusy(false);
      });
    });

    /* copy note */
    if (els.grid) {
      els.grid.addEventListener("click", function (event) {
        var button = event.target.closest ? event.target.closest(".note-copy") : null;
        if (!button) return;
        var card = button.closest(".note-card");
        if (!card) return;
        var note = state.notes.find(function (item) { return item.id === card.dataset.id; });
        if (!note) return;
        var share = "“" + note.body + "”\n— " + (note.nickname || "İsimsiz Kurbağa") + "\n" + window.location.href.split("#")[0] + "#duvar";
        copyText(share).then(function () {
          showToast("Not kopyalandı.");
        }).catch(function () {
          showToast("Kopyalanamadı. Notu seçip elle kopyalayabilirsin.", true);
        });
      });
    }

    if (els.refresh) {
      els.refresh.addEventListener("click", function () { load(); });
    }

    $$("[data-focus-composer]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (!els.note) return;
        els.note.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(function () { els.note.focus({ preventScroll: true }); }, 400);
      });
    });

    var cached = store.getCachedNotes ? store.getCachedNotes() : [];
    if (els.note) els.note.maxLength = WALL.maxLength;
    if (els.nickname) els.nickname.maxLength = WALL.nicknameMax;
    if (cached.length) {
      state.notes = cached;
      render(null);
    }
    load({ silent: cached.length > 0 });

    window.setInterval(refreshTimes, 60000);

    if (isCloud) {
      window.setInterval(function () {
        if (document.hidden || state.loading || form.classList.contains("is-busy")) return;
        if ($("#duvar")) {
          var rect = $("#duvar").getBoundingClientRect();
          if (rect.top > window.innerHeight || rect.bottom < 0) return;
        }
        load({ silent: true });
      }, Math.max(30, WALL.pollSeconds) * 1000);
    }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      try {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        area.setSelectionRange(0, area.value.length);
        var ok = document.execCommand("copy");
        document.body.removeChild(area);
        ok ? resolve() : reject(new Error("copy failed"));
      } catch (err) {
        reject(err);
      }
    });
  }

  function boot() {
    setYear();
    initReveal();
    initHeader();
    initFab();
    initFrog();
    initQuotes();
    initWall();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
