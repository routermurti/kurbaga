/* =========================================================
   Kurbağa Felsefesi — not deposu
   Yerel mod: localStorage | Bulut modu: Supabase REST
   ========================================================= */

(function () {
  "use strict";

  var KF = (window.KF = window.KF || {});
  var KEY_LOCAL = "kf.notes.local.v1";
  var KEY_CACHE = "kf.notes.cache.v1";

  function safeRead(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function safeWrite(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function validDate(value) {
    var date = new Date(value);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  function normalize(row) {
    if (!row || typeof row !== "object") return null;
    var body = typeof row.body === "string" ? row.body.trim() : "";
    if (!body) return null;
    return {
      id: row.id != null ? String(row.id) : makeId(),
      nickname: typeof row.nickname === "string" ? row.nickname.trim().slice(0, 40) : "",
      body: body.slice(0, 1000),
      created_at: validDate(row.created_at)
    };
  }

  function normalizeList(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map(normalize).filter(Boolean);
  }

  function newestFirst(notes) {
    return notes.slice().sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "n-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }

  function makeLocalStore(wall) {
    var limit = Math.max(1, wall.limit || 60);

    function readAll() {
      return newestFirst(normalizeList(safeRead(KEY_LOCAL) || []));
    }

    return {
      mode: "local",
      getCachedNotes: function () {
        return readAll().slice(0, limit);
      },
      loadNotes: function () {
        return Promise.resolve(readAll().slice(0, limit));
      },
      addNote: function (input) {
        var note = normalize({
          id: makeId(),
          nickname: input.nickname,
          body: input.body,
          created_at: new Date().toISOString()
        });
        if (!note) return Promise.reject(new Error("Not boş olamaz."));
        var notes = readAll();
        notes.unshift(note);
        safeWrite(KEY_LOCAL, notes.slice(0, 200));
        return Promise.resolve(note);
      },
      rememberNotes: function (notes) {
        safeWrite(KEY_LOCAL, newestFirst(notes).slice(0, 200));
      }
    };
  }

  function makeSupabaseStore(cloud, wall) {
    var base = String(cloud.supabaseUrl || "").replace(/\/+$/, "");
    var key = String(cloud.supabaseAnonKey || "").trim();
    var table = String(cloud.table || "notes").replace(/[^a-zA-Z0-9_]/g, "");
    var limit = Math.max(1, wall.limit || 60);
    var endpoint = base + "/rest/v1/" + table;

    function headers(extra) {
      var result = {
        apikey: key,
        Authorization: "Bearer " + key,
        Accept: "application/json"
      };
      if (extra) {
        Object.keys(extra).forEach(function (name) { result[name] = extra[name]; });
      }
      return result;
    }

    function request(url, options) {
      var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = null;
      if (controller) {
        options.signal = controller.signal;
        timer = window.setTimeout(function () { controller.abort(); }, 12000);
      }
      return window.fetch(url, options)
        .catch(function () {
          throw new Error("Bulut duvarına ulaşılamadı.");
        })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Duvar şu an yanıt vermiyor (" + response.status + ").");
          }
          if (response.status === 204) return null;
          return response.json().catch(function () { return null; });
        })
        .then(function (data) {
          if (timer) window.clearTimeout(timer);
          return data;
        })
        .catch(function (error) {
          if (timer) window.clearTimeout(timer);
          throw error;
        });
    }

    return {
      mode: "cloud",
      getCachedNotes: function () {
        var cached = safeRead(KEY_CACHE);
        if (!cached || !Array.isArray(cached.notes)) return [];
        return newestFirst(normalizeList(cached.notes)).slice(0, limit);
      },
      loadNotes: function () {
        var query = "?select=id,nickname,body,created_at&order=created_at.desc&limit=" + encodeURIComponent(limit);
        return request(endpoint + query, {
          method: "GET",
          headers: headers(),
          cache: "no-store"
        }).then(function (data) {
          var notes = newestFirst(normalizeList(data)).slice(0, limit);
          safeWrite(KEY_CACHE, { at: new Date().toISOString(), notes: notes });
          return notes;
        });
      },
      addNote: function (input) {
        return request(endpoint, {
          method: "POST",
          headers: headers({
            "Content-Type": "application/json",
            Prefer: "return=representation"
          }),
          body: JSON.stringify({
            nickname: input.nickname ? input.nickname : null,
            body: input.body
          })
        }).then(function (data) {
          var rows = Array.isArray(data) ? data : [data];
          var note = normalize(rows[0]);
          if (!note) {
            note = normalize({
              id: makeId(),
              nickname: input.nickname,
              body: input.body,
              created_at: new Date().toISOString()
            });
          }
          return note;
        });
      },
      rememberNotes: function (notes) {
        safeWrite(KEY_CACHE, { at: new Date().toISOString(), notes: newestFirst(notes).slice(0, limit) });
      }
    };
  }

  function makeCustomStore(cloud, wall) {
    var base = String(cloud.apiBase || "").replace(/\/+$/, "");
    var limit = Math.max(1, wall.limit || 60);

    function endpoint(action) {
      return base + (base.indexOf("?") === -1 ? "?" : "&") + "action=" + encodeURIComponent(action);
    }

    function headers(extra) {
      var result = { Accept: "application/json" };
      if (extra) {
        Object.keys(extra).forEach(function (name) { result[name] = extra[name]; });
      }
      return result;
    }

    function request(url, options) {
      var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = null;
      if (controller) {
        options.signal = controller.signal;
        timer = window.setTimeout(function () { controller.abort(); }, 12000);
      }
      return window.fetch(url, options)
        .catch(function () {
          throw new Error("Sunucuya ulaşılamadı.");
        })
        .then(function (response) {
          return response.text().then(function (text) {
            if (timer) window.clearTimeout(timer);
            var data = null;
            if (text) {
              try { data = JSON.parse(text); } catch (err) { data = null; }
            }
            if (!response.ok) {
              var message = data && (data.error || data.message)
                ? String(data.error || data.message)
                : "Sunucu yanıt vermedi (" + response.status + ").";
              var error = new Error(message);
              error.status = response.status;
              throw error;
            }
            return data;
          });
        })
        .catch(function (error) {
          if (timer) window.clearTimeout(timer);
          throw error;
        });
    }

    function notesFrom(data) {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.notes)) return data.notes;
      return [];
    }

    function noteFrom(data) {
      if (Array.isArray(data)) data = data[0];
      if (data && data.note) data = data.note;
      return normalize(data);
    }

    return {
      mode: "cloud",
      getCachedNotes: function () {
        var cached = safeRead(KEY_CACHE);
        if (!cached || !Array.isArray(cached.notes)) return [];
        return newestFirst(normalizeList(cached.notes)).slice(0, limit);
      },
      loadNotes: function () {
        return request(endpoint("notes") + "&limit=" + encodeURIComponent(limit), {
          method: "GET",
          headers: headers(),
          cache: "no-store"
        }).then(function (data) {
          var notes = newestFirst(normalizeList(notesFrom(data))).slice(0, limit);
          safeWrite(KEY_CACHE, { at: new Date().toISOString(), notes: notes });
          return notes;
        });
      },
      addNote: function (input) {
        return request(endpoint("notes"), {
          method: "POST",
          headers: headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            nickname: input.nickname ? input.nickname : null,
            body: input.body
          })
        }).then(function (data) {
          var note = noteFrom(data);
          if (!note) throw new Error("Sunucu notu döndüremedi.");
          return note;
        });
      },
      rememberNotes: function (notes) {
        safeWrite(KEY_CACHE, { at: new Date().toISOString(), notes: newestFirst(notes).slice(0, limit) });
      }
    };
  }

  KF.createStore = function (config) {
    var settings = config || {};
    var wall = settings.wall || {};
    var cloud = settings.cloud || {};
    var url = String(cloud.supabaseUrl || "").trim();
    var key = String(cloud.supabaseAnonKey || "").trim();
    var apiBase = String(cloud.apiBase || "").trim();
    var ready = false;

    if (cloud.provider === "supabase") {
      ready = /^https?:\/\/.+/i.test(url) &&
        key.length > 20 &&
        !/YOUR_|BURAYA/i.test(url + key);
    } else if (cloud.provider === "custom") {
      ready = /^https?:\/\/.+/i.test(apiBase) &&
        !/YOUR_|BURAYA/i.test(apiBase);
    }

    if (ready) {
      try {
        if (cloud.provider === "custom") return makeCustomStore(cloud, wall);
        return makeSupabaseStore(cloud, wall);
      } catch (err) {
        return makeLocalStore(wall);
      }
    }
    return makeLocalStore(wall);
  };
})();
