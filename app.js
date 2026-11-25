// مكوك بيشو — واجهة الصفحة (نسخة مسار الخطوات + قوالب + سيناريوهات)
// زي فكرة مكوك: ١ عرّف البنود ٢ حدد القيود ٣ القرار الأمثل ٤ ليه وماذا لو.
// كل خانة قابلة للتعديل، وكل تعديل بيتخزن على الجهاز تلقائيًا (localStorage).
(function () {
  var STORE_KEY = "makkook-besho-state-v3";
  var SCN_KEY = "makkook-besho-scenarios-v1";

  var TEMPLATES = {
    complex: {
      title: "مصنع كامل — تجربة معقدة",
      desc: "١٠ بنود وألف تركيبة — شوف المخ بيفكر إزاي",
      budgetLabel: "ميزانية التشغيل (جنيه)",
      hoursLabel: "ساعات التشغيل المتاحة",
      th: { name: "الخط / المهمة", cost: "التكلفة", profit: "العائد", hours: "الساعات" },
      budget: 2200, hours: 12,
      items: [
        { name: "خط تعبئة عصير", category: "تعبئة", cost: 800, profit: 1300, hours: 4 },
        { name: "فرن مخبوزات", category: "مخبوزات", cost: 650, profit: 950, hours: 3 },
        { name: "ماكينة طحن بن", category: "مشروبات", cost: 300, profit: 420, hours: 1 },
        { name: "خط تغليف بلاستيك", category: "تغليف", cost: 500, profit: 700, hours: 2 },
        { name: "خلاط صلصات", category: "معلبات", cost: 420, profit: 640, hours: 2 },
        { name: "ماكينة ثلج", category: "تبريد", cost: 350, profit: 380, hours: 1 },
        { name: "خط معكرونة", category: "مخبوزات", cost: 900, profit: 1450, hours: 5 },
        { name: "معصرة زيت", category: "زيوت", cost: 550, profit: 800, hours: 3 },
        { name: "ماكينة كبس علب", category: "معلبات", cost: 250, profit: 330, hours: 1 },
        { name: "خط تعقيم زجاجات", category: "تعبئة", cost: 480, profit: 600, hours: 2 }
      ]
    },
    workshop: {
      title: "ورشة الصيانة",
      desc: "أنهي أجهزة تتصلح النهارده بأعلى ربح",
      budgetLabel: "ميزانية قطع الغيار (جنيه)",
      hoursLabel: "ساعات الفني المتاحة",
      th: { name: "الجهاز / القطعة", cost: "تكلفة القطعة", profit: "ربح التصليح", hours: "ساعات الشغل" },
      budget: 1500, hours: 8,
      items: [
        { name: "غسالة (طرمبة)", category: "غسالات", cost: 600, profit: 900, hours: 3 },
        { name: "تلاجة (ريليه)", category: "تلاجات", cost: 450, profit: 500, hours: 2 },
        { name: "ميكروويف (ماجنترون)", category: "ميكروويف", cost: 700, profit: 800, hours: 2 },
        { name: "سخان (ثرموستات)", category: "سخانات", cost: 300, profit: 450, hours: 1 },
        { name: "بوردة تلفزيون", category: "تلفزيون", cost: 500, profit: 650, hours: 4 },
      ],
    },
    purchasing: {
      title: "شراء قطع الغيار",
      desc: "أنهي قطع تشتريها النهارده بأعلى هامش ربح",
      budgetLabel: "ميزانية الشراء (جنيه)",
      hoursLabel: "ساعات التجهيز/الاستلام",
      th: { name: "القطعة", cost: "سعر الشراء", profit: "هامش الربح", hours: "وقت التجهيز" },
      budget: 800, hours: 5,
      items: [
        { name: "طرمبة غسالة", category: "قطع غسالات", cost: 250, profit: 120, hours: 1 },
        { name: "ريليه تلاجة", category: "قطع تلاجات", cost: 180, profit: 90, hours: 1 },
        { name: "ثرموستات سخان", category: "قطع سخانات", cost: 90, profit: 55, hours: 1 },
        { name: "ماجنترون ميكروويف", category: "قطع ميكروويف", cost: 420, profit: 210, hours: 2 },
        { name: "موتور سخان", category: "قطع سخانات", cost: 350, profit: 160, hours: 1 },
      ],
    },
    blank: {
      title: "قالب فاضي",
      desc: "ابني مسألتك من الصفر",
      budgetLabel: "الميزانية (جنيه)",
      hoursLabel: "الساعات المتاحة",
      th: { name: "البند", cost: "التكلفة", profit: "العائد", hours: "الوقت" },
      budget: 1000, hours: 8,
      items: [
        { name: "", category: "", cost: 0, profit: 0, hours: 0 },
        { name: "", category: "", cost: 0, profit: 0, hours: 0 },
        { name: "", category: "", cost: 0, profit: 0, hours: 0 },
      ],
    },
  };

  var highs = null;
  var currentTemplate = "workshop";
  var currentStep = 1;
  var lastExplain = null;
  var rowsEl = document.getElementById("rows");
  var solveBtn = document.getElementById("solveBtn");
  var statusEl = document.getElementById("status");
  var budgetEl = document.getElementById("budget");
  var hoursEl = document.getElementById("hours");

  // ---------- البنود ----------
  function enableDrag(tr, handle) {
    handle.addEventListener("touchstart", function (e) { e.preventDefault(); }, { passive: false });
    handle.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var startY = e.clientY;
      var rows = Array.prototype.slice.call(rowsEl.children);
      var from = rows.indexOf(tr);
      var rowH = tr.offsetHeight + 8;
      var to = from;
      tr.classList.add("dragging");
      sfxGrab();
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      function onMove(ev) {
        var dy = ev.clientY - startY;
        tr.style.transform = "translateY(" + dy + "px)";
        to = Math.max(0, Math.min(rows.length - 1, from + Math.round(dy / rowH)));
      }
      function onUp() {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onUp);
        tr.classList.remove("dragging");
        tr.style.transform = "";
        sfxDrop();
        if (to !== from) {
          var cur = Array.prototype.slice.call(rowsEl.children);
          var ref = cur[to];
          if (to > from) rowsEl.insertBefore(tr, ref.nextSibling);
          else rowsEl.insertBefore(tr, ref);
          saveState(); maybeResolve();
        }
      }
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onUp);
    });
  }

  function addRow(item) {
    var tr = document.createElement("tr");
    var hd = document.createElement("td");
    hd.className = "drag";
    hd.textContent = "⋮⋮";
    hd.title = "اسحب البند من هنا";
    hd.dataset.sfx = "1";
    tr.appendChild(hd);
    enableDrag(tr, hd);
    ["name", "category", "cost", "profit", "hours"].forEach(function (k) {
      var td = document.createElement("td");
      var inp = document.createElement("input");
      inp.dataset.k = k;
      if (k === "name" || k === "category") {
        inp.type = "text";
        if (k === "category") inp.setAttribute("list", "cats");
      } else { inp.type = "number"; inp.min = "0"; }
      inp.value = item ? item[k] : (k === "name" || k === "category" ? "" : 0);
      inp.addEventListener("input", function () { sfxTick(); saveState(); maybeResolve(); });
      td.appendChild(inp);
      tr.appendChild(td);
    });
    var td = document.createElement("td");
    var del = document.createElement("button");
    del.type = "button"; del.className = "del"; del.textContent = "مسح"; del.title = "امسح البند ده";
    del.dataset.sfx = "1";
    del.addEventListener("click", function () { sfxDel(); tr.remove(); saveState(); maybeResolve(); });
    td.appendChild(del);
    tr.appendChild(td);
    rowsEl.appendChild(tr);
  }

  function readItems() {
    var items = [];
    rowsEl.querySelectorAll("tr").forEach(function (tr) {
      var get = function (k) { return tr.querySelector('input[data-k="' + k + '"]').value; };
      items.push({
        name: get("name").trim() || "بند",
        category: get("category").trim(),
        cost: Number(get("cost")) || 0,
        profit: Number(get("profit")) || 0,
        hours: Number(get("hours")) || 0,
      });
    });
    return items;
  }

  // ---------- الحفظ التلقائي ----------
  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        template: currentTemplate, budget: budgetEl.value, hours: hoursEl.value, items: readItems(),
      }));
    } catch (e) {}
    updateLiveBar();
  }

  // شريط الأرقام الحي: مجموع الأرباح + الميزانية + الساعات، بيتحدث مع أي تعديل
  function updateLiveBar() {
    try {
      var items = readItems();
      var sum = 0;
      items.forEach(function (it) { sum += Number(it.profit) || 0; });
      var lp = document.getElementById("lbProfit");
      if (!lp) return;
      var txt = fmt(sum);
      if (lp.textContent !== txt) {
        lp.textContent = txt;
        if (!REDUCED) {
          lp.classList.remove("tick"); void lp.offsetWidth; lp.classList.add("tick");
          setTimeout(function () { lp.classList.remove("tick"); }, 200);
        }
      }
      document.getElementById("lbBudget").textContent = fmt(Number(budgetEl.value) || 0);
      document.getElementById("lbHours").textContent = fmt(Number(hoursEl.value) || 0);
    } catch (e) {}
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !Array.isArray(s.items) || s.items.length === 0) return null;
      if (!TEMPLATES[s.template]) s.template = "workshop";
      return s;
    } catch (e) { return null; }
  }
  function applyTemplateLabels(t) {
    document.getElementById("budgetLabel").textContent = t.budgetLabel;
    document.getElementById("hoursLabel").textContent = t.hoursLabel;
    document.getElementById("thName").textContent = t.th.name;
    document.getElementById("thCost").textContent = t.th.cost;
    document.getElementById("thProfit").textContent = t.th.profit;
    document.getElementById("thHours").textContent = t.th.hours;
  }
  function renderState(s) {
    currentTemplate = s.template || "workshop";
    var t = TEMPLATES[currentTemplate];
    applyTemplateLabels(t);
    budgetEl.value = s.budget;
    hoursEl.value = s.hours;
    rowsEl.innerHTML = "";
    s.items.forEach(addRow);
    markActiveTemplate();
  }

  // ---------- القوالب ----------
  function markActiveTemplate() {
    document.querySelectorAll("#templates button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.t === currentTemplate);
    });
  }
  function buildTemplateBar() {
    var bar = document.getElementById("templates");
    Object.keys(TEMPLATES).forEach(function (key) {
      var t = TEMPLATES[key];
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.t = key;
      b.innerHTML = "";
      b.appendChild(document.createTextNode(t.title));
      var sm = document.createElement("small");
      sm.textContent = t.desc;
      b.appendChild(sm);
      b.addEventListener("click", function () {
        if (key === currentTemplate) return;
        if (!window.confirm("اختيار قالب هيستبدل البنود الحالية. متأكد؟")) return;
        var nt = TEMPLATES[key];
        renderState({ template: key, budget: nt.budget, hours: nt.hours, items: JSON.parse(JSON.stringify(nt.items)) });
        saveState();
        lastExplain = null;
        document.getElementById("verdict").textContent = "اضغط «احسب القرار الأمثل»";
      });
      bar.appendChild(b);
    });
  }

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;




  // ---------- النسخة والتحديث التلقائي على نفس الرابط ----------
  var APP_VERSION = "12";
  var verTag = document.getElementById("verTag");
  if (verTag) verTag.textContent = "النسخة " + APP_VERSION;
  var updatePending = false;
  function showUpdateBar() {
    var b = document.getElementById("updatebar");
    if (b) b.classList.remove("hidden");
  }
  var updateBar = document.getElementById("updatebar");
  if (updateBar) {
    updateBar.dataset.sfx = "1";
    updateBar.addEventListener("click", function () { sfxTap(); location.reload(); });
  }
  function checkVersion() {
    if (location.protocol.indexOf("http") !== 0) return;
    fetch("version.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.v && String(j.v) !== APP_VERSION) {
        if (document.hidden) { updatePending = true; }
        else { showUpdateBar(); }
      }
    }).catch(function () {});
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      if (updatePending) { location.reload(); }
      else { checkVersion(); }
    }
  });
  window.addEventListener("focus", checkVersion);
  setTimeout(checkVersion, 2500);

  // ---------- شريط الأخطاء: أي خطأ في الصفحة يظهر نصه على الشاشة ----------
  function showErr(msg) {
    try {
      var b = document.getElementById("errbar");
      if (!b) return;
      b.textContent = (b.classList.contains("hidden") ? "" : b.textContent + "\n") + String(msg).slice(0, 300);
      b.classList.remove("hidden");
    } catch (e) {}
  }
  window.addEventListener("error", function (e) {
    showErr("ERR: " + (e.message || "?") + " @ " + String(e.filename || "").split("/").pop() + ":" + (e.lineno || 0));
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    showErr("REJ: " + ((r && r.message) || r || "?"));
  });

  // ---------- الصوت: نغمات فضائية مولّدة (WebAudio، من غير ملفات) ----------
  var SOUND_KEY = "makkook-besho-sound";
  var soundOn = true;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== "off"; } catch (e) {}
  var actx = null;
  function ac() {
    if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) { try { actx = new AC(); } catch (e) {} } }
    if (actx && actx.state === "suspended") { actx.resume(); }
    return actx;
  }
  function tone(f0, f1, dur, type, vol, delay) {
    if (!soundOn) return;
    var a = ac(); if (!a) return;
    try {
      var t = a.currentTime + (delay || 0);
      var o = a.createOscillator(), gn = a.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(f0, t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(vol || 0.03, t + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(a.destination);
      o.start(t); o.stop(t + dur + 0.03);
    } catch (e) {}
  }
  function sfxTap() { tone(880, 1320, 0.06, "square", 0.018); }
  function sfxStep() { tone(220, 760, 0.2, "sine", 0.03); tone(1520, 1520, 0.08, "sine", 0.012, 0.16); }
  function sfxAdd() { tone(523, 784, 0.12, "triangle", 0.032); tone(1046, 1046, 0.1, "sine", 0.02, 0.1); }
  function sfxDel() { tone(440, 160, 0.18, "sawtooth", 0.02); }
  function sfxGrab() { tone(300, 420, 0.05, "square", 0.016); }
  function sfxDrop() { tone(540, 380, 0.07, "square", 0.02); }
  function sfxReset() { tone(660, 660, 0.07, "triangle", 0.025); tone(440, 440, 0.09, "triangle", 0.025, 0.09); }
  function sfxSave() { tone(784, 784, 0.08, "sine", 0.028); tone(1175, 1175, 0.14, "sine", 0.028, 0.08); }
  function sfxBest() { tone(1568, 1568, 0.07, "sine", 0.016); }
  var lastTick = 0;
  function sfxTick() {
    var now = Date.now();
    if (now - lastTick < 70) return;
    lastTick = now;
    tone(1200, 1200, 0.03, "square", 0.008);
  }
  function sfxCalc() {
    [392, 523, 659, 880, 1174].forEach(function (f, i) { tone(f, f * 1.01, 0.14, "triangle", 0.032, i * 0.09); });
    tone(98, 196, 0.7, "sawtooth", 0.012, 0); // وشوشة هايبرسبيس
  }
  function sfxWin() {
    [523, 659, 784].forEach(function (f, i) { tone(f, f, 0.4, "sine", 0.036, i * 0.06); });
    tone(1568, 2093, 0.5, "sine", 0.02, 0.22);
  }
  document.addEventListener("click", function (e) {
    if (!e.target || !e.target.closest) return;
    var b = e.target.closest("button");
    if (b && b.dataset.sfx !== "1") sfxTap();
  });
  var muteBtn = document.getElementById("muteBtn");
  function paintMute() { if (muteBtn) muteBtn.textContent = soundOn ? "🔊" : "🔇"; }
  if (muteBtn) {
    muteBtn.dataset.sfx = "1";
    muteBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      if (soundOn) sfxTap();
      try { localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off"); } catch (e) {}
      paintMute();
    });
    paintMute();
  }

  // ---------- الخطوات ----------
  function showStep(n) {
    if (n !== currentStep) sfxStep();
    currentStep = n;
    [1, 2, 3, 4].forEach(function (i) {
      document.getElementById("step-" + i).classList.toggle("hidden", i !== n);
    });
    document.querySelectorAll("#stepper button").forEach(function (b) {
      b.classList.toggle("active", Number(b.dataset.step) === n);
    });
    document.body.dataset.step = String(n);
    if (!REDUCED) {
      var sec = document.getElementById("step-" + n);
      sec.classList.remove("enter");
      void sec.offsetWidth;
      sec.classList.add("enter");
    }
    if (n === 3 && highs) {
      if (document.body.dataset.solved === "1") solveInstant(); else solveLive();
    }
    if (n === 4) renderWhy();
    window.scrollTo(0, 0);
  }

  // ---------- الحل ----------
  function fmt(n) { return Number(n.toFixed ? n.toFixed(2) : n).toLocaleString("en-US"); }
  function compute() {
    var items = readItems();
    var budget = Number(budgetEl.value) || 0;
    var hours = Number(hoursEl.value) || 0;
    var ex;
    try { ex = MakkookModel.explain(highs, items, budget, hours); }
    catch (e) { statusEl.textContent = "في مشكلة في الأرقام: " + e.message; return null; }
    lastExplain = { ex: ex, items: items, budget: budget, hours: hours };
    return { ex: ex, items: items, budget: budget, hours: hours };
  }

  // عدّاد رقمي بيعد من صفر للقيمة النهائية
  function countUp(el, final, format, done) {
    if (REDUCED) { el.textContent = format(final); if (done) done(); return; }
    var t0 = null, DUR = 650;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / DUR);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(final * eased);
      if (p < 1) requestAnimationFrame(frame); else { el.textContent = format(final); if (done) done(); }
    }
    requestAnimationFrame(frame);
  }

  function renderResult(d, animate) {
    var base = d.ex.base, items = d.items;
    var verdict = document.getElementById("verdict");
    var chosenNames = base.chosen.map(function (i) { return items[i].name; });
    if (base.status !== "Optimal" || base.chosen.length === 0) {
      verdict.textContent = base.status !== "Optimal"
        ? "مفيش أي بند يدخل في القيود دي. جرّب تزوّد الميزانية أو الساعات."
        : "أحسن قرار: متعملش حاجة النهارده بالقيود دي.";
    } else {
      verdict.textContent = "اختار: " + chosenNames.join(" + ");
    }
    // شرائح البنود المختارة بتظهر واحدة ورا التانية
    var chips = document.getElementById("planChips");
    chips.innerHTML = "";
    chosenNames.forEach(function (nm, i) {
      var c = document.createElement("span");
      c.className = "chip";
      c.textContent = "✓ " + nm;
      if (animate && !REDUCED) c.style.animationDelay = (0.15 + i * 0.12) + "s";
      else c.style.animationDelay = "0s";
      chips.appendChild(c);
    });
    // الأرقام بتعد لفوق
    var fP = function (v) { return fmt(Math.round(v)) + " جنيه"; };
    var fC = function (v) { return fmt(Math.round(v)) + " من " + fmt(d.budget); };
    var fH = function (v) { return fmt(Math.round(v * 10) / 10) + " من " + fmt(d.hours) + " ساعة"; };
    if (animate && !REDUCED) {
      countUp(document.getElementById("tProfit"), base.profit, fP);
      countUp(document.getElementById("tCost"), base.cost, fC);
      countUp(document.getElementById("tHours"), base.hoursUsed, fH);
    } else {
      document.getElementById("tProfit").textContent = fP(base.profit);
      document.getElementById("tCost").textContent = fC(base.cost);
      document.getElementById("tHours").textContent = fH(base.hoursUsed);
    }
    // شريطا الفلوس والوقت (الانتقال بالـ CSS)
    var barC = document.getElementById("barCost");
    var barH = document.getElementById("barHours");
    var pc = d.budget > 0 ? Math.min(100, (base.cost / d.budget) * 100) : 0;
    var ph = d.hours > 0 ? Math.min(100, (base.hoursUsed / d.hours) * 100) : 0;
    if (animate && !REDUCED) {
      barC.style.width = "0%"; barH.style.width = "0%";
      setTimeout(function () { barC.style.width = pc + "%"; barH.style.width = ph + "%"; }, 60);
    } else {
      barC.style.width = pc + "%"; barH.style.width = ph + "%";
    }
    var skipped = items.filter(function (_, i) { return base.chosen.indexOf(i) === -1; }).map(function (it) { return it.name; });
    document.getElementById("skipList").textContent = skipped.length ? "اللي مش هيتعمل النهارده: " + skipped.join("، ") : "";
    statusEl.textContent = "";
    renderWhy();
  }

  function solveInstant() {
    var viz0 = document.getElementById("searchViz");
    if (viz0) viz0.classList.add("hidden");
    neonStop();
    var d = compute();
    if (!d) return;
    renderResult(d, false);
    document.body.dataset.solved = "1";
  }


  // ---------- محرك النيون: كرة مضيئة وخيوط توصلها بالبنود ----------
  var neonState = { raf: 0, running: false };
  function neonStart(items) {
    var canvas = document.getElementById("svCanvas");
    if (REDUCED || !canvas.getContext) return null;
    if (neonState.raf) cancelAnimationFrame(neonState.raf);
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    var W = canvas.clientWidth || 340, H = 190;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    var g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = items.length;
    var orb = { x: W / 2, y: H * 0.68 };
    var R = Math.min(W * 0.44, 165);
    var nodes = [];
    for (var i = 0; i < n; i++) {
      var ang = Math.PI + Math.PI * ((i + 0.5) / n); // مروحة فوق الكرة
      nodes.push({ x: orb.x + R * Math.cos(ang), y: orb.y + R * 0.62 * Math.sin(ang), name: items[i].name });
    }
    var st = { g: g, W: W, H: H, orb: orb, nodes: nodes, cur: 0, flash: 0, particles: [], frame: 0, n: n };
    neonState.running = true;
    function quad(ox, oy, cxp, cyp, nx, ny, t) {
      var u = 1 - t;
      return { x: u * u * ox + 2 * u * t * cxp + t * t * nx, y: u * u * oy + 2 * u * t * cyp + t * t * ny };
    }
    function draw(t) {
      if (!neonState.running) return;
      st.frame++;
      if (st.frame % 2 === 0) { neonState.raf = requestAnimationFrame(draw); return; } // ~30fps للموبايلات الضعيفة
      g.clearRect(0, 0, W, H);
      if (st.flash > 0) st.flash -= 0.03;
      // الخيوط
      for (var i = 0; i < n; i++) {
        var nd = nodes[i];
        var cxp = (orb.x + nd.x) / 2, cyp = Math.min(orb.y, nd.y) - 16;
        var on = (st.cur >> i) & 1;
        g.beginPath();
        g.moveTo(orb.x, orb.y);
        g.quadraticCurveTo(cxp, cyp, nd.x, nd.y);
        if (on) {
          g.strokeStyle = "rgba(84,255,159,.85)";
          g.lineWidth = 1.6;
          g.setLineDash([7, 9]);
          g.lineDashOffset = -t / 40;
          g.shadowColor = "#54ff9f"; g.shadowBlur = 7;
        } else {
          g.strokeStyle = "rgba(120,130,165,.18)";
          g.lineWidth = 1;
          g.setLineDash([]);
          g.shadowBlur = 0;
        }
        g.stroke();
      }
      g.setLineDash([]); g.shadowBlur = 0;
      // جسيمات بتطلع من الكرة على الخيوط
      for (var p = st.particles.length - 1; p >= 0; p--) {
        var pt = st.particles[p];
        pt.t += 0.045;
        if (pt.t >= 1) { st.particles.splice(p, 1); continue; }
        var nd2 = nodes[pt.i];
        var pos = quad(orb.x, orb.y, (orb.x + nd2.x) / 2, Math.min(orb.y, nd2.y) - 16, nd2.x, nd2.y, pt.t);
        g.beginPath();
        g.arc(pos.x, pos.y, 3, 0, 6.283);
        g.fillStyle = "#e8fbff";
        g.shadowColor = "#22d8ee"; g.shadowBlur = 10;
        g.fill();
        g.shadowBlur = 0;
      }
      // الكرة
      var r = 15 + 2.5 * Math.sin(t / 280);
      var grad = g.createRadialGradient(orb.x, orb.y, 1, orb.x, orb.y, r + 8);
      grad.addColorStop(0, "#e8fbff");
      grad.addColorStop(0.45, "#22d8ee");
      grad.addColorStop(1, "rgba(168,85,247,.05)");
      g.beginPath();
      g.arc(orb.x, orb.y, r + 8, 0, 6.283);
      g.fillStyle = grad;
      g.shadowColor = "#22d8ee"; g.shadowBlur = 16;
      g.fill();
      g.shadowBlur = 0;
      // موجة فرح عند اكتشاف أفضل
      if (st.flash > 0) {
        g.beginPath();
        g.arc(orb.x, orb.y, r + (1 - st.flash) * 55, 0, 6.283);
        g.strokeStyle = "rgba(124,224,163," + (st.flash * 0.7).toFixed(3) + ")";
        g.lineWidth = 2;
        g.stroke();
      }
      // العقد
      g.textAlign = "center"; g.direction = "rtl"; g.font = "10px Tahoma";
      for (var j = 0; j < n; j++) {
        var nd3 = nodes[j];
        var on2 = (st.cur >> j) & 1;
        g.beginPath();
        g.arc(nd3.x, nd3.y, on2 ? 6 : 4, 0, 6.283);
        if (on2) { g.fillStyle = "#7ce0a3"; g.shadowColor = "#7ce0a3"; g.shadowBlur = 10; }
        else { g.fillStyle = "rgba(150,150,165,.4)"; g.shadowBlur = 0; }
        g.fill();
        g.shadowBlur = 0;
        if (n <= 7) {
          g.fillStyle = on2 ? "#b9f5d2" : "rgba(154,154,165,.75)";
          var nm = nd3.name.length > 14 ? nd3.name.slice(0, 13) + "…" : nd3.name;
          g.fillText(nm, nd3.x, nd3.y - 10);
        }
      }
      neonState.raf = requestAnimationFrame(draw);
    }
    neonState.raf = requestAnimationFrame(draw);
    return st;
  }
  function neonBurst(st, mask) {
    if (!st) return;
    st.flash = 1;
    for (var i = 0; i < st.n && st.particles.length < 24; i++) {
      if ((mask >> i) & 1) st.particles.push({ i: i, t: 0 });
    }
  }
  function neonStop() {
    neonState.running = false;
    if (neonState.raf) cancelAnimationFrame(neonState.raf);
    neonState.raf = 0;
  }

  // ---------- البحث الحي: بنجرّب كل التركيبات قدام المستخدم ----------
  function solveLive() {
    if (REDUCED) { solveInstant(); return; }
    var items = readItems();
    var budget = Number(budgetEl.value) || 0;
    var hours = Number(hoursEl.value) || 0;
    if (!items.length) { solveInstant(); return; }
    var viz = document.getElementById("searchViz");
    var svChips = document.getElementById("svChips");
    var svProfit = document.getElementById("svProfit");
    var svBest = document.getElementById("svBest");
    var svBestBox = document.getElementById("svBestBox");
    var svCount = document.getElementById("svCount");
    var svBarCost = document.getElementById("svBarCost");
    var svBarHours = document.getElementById("svBarHours");
    var svProg = document.getElementById("svProg");
    var svMsg = document.getElementById("svMsg");
    var svTitle = document.getElementById("svTitle");
    svChips.innerHTML = "";
    var chipEls = items.map(function (it) {
      var c = document.createElement("span");
      c.className = "chip out";
      c.textContent = it.name;
      svChips.appendChild(c);
      return c;
    });
    svBest.textContent = "0"; svProfit.textContent = "0"; svProg.style.width = "0%";
    var svLog0 = document.getElementById("svLog");
    if (svLog0) svLog0.innerHTML = "";
    svMsg.className = "sv-msg"; svMsg.textContent = "";
    viz.classList.remove("hidden");
    document.body.dataset.warp = "1";
    sfxCalc();
    var neon = neonStart(items);
    solveBtn.disabled = true;
    solveBtn.classList.add("thinking");
    solveBtn.textContent = "بيشتغل قدامك…";
    var n = items.length;
    var total = Math.pow(2, n) - 1;
    var MAXSTEPS = 340;
    var stride = Math.max(1, Math.ceil(total / MAXSTEPS));
    var steps = Math.ceil(total / stride);
    var delay = Math.max(12, Math.min(150, Math.round(2600 / steps)));
    var STAGES = 5;
    function stageBase(i2) {
      svProg.style.width = Math.round((i2 / STAGES) * 100) + "%";
      sfxStep();
    }

    // ١) مسح البنود واحد واحد
    svTitle.textContent = "١) مسح البنود واحد واحد…";
    stageBase(0);
    var scanI = 0;
    (function scan() {
      if (scanI > 0) chipEls[scanI - 1].classList.remove("scanning");
      if (scanI >= n) { chipEls.forEach(function (c) { c.classList.remove("scanning"); }); pruneStage(); return; }
      chipEls[scanI].classList.add("scanning");
      svCount.textContent = (scanI + 1) + " / " + n + " بند";
      scanI++;
      setTimeout(scan, Math.max(70, Math.min(240, Math.round(750 / n))));
    })();

    // ٢) تقليم المستحيل — فحص حقيقي: البند اللي لوحده بيكسر القيود
    function pruneStage() {
      svTitle.textContent = "٢) تقليم المستحيل…";
      stageBase(1);
      var pruned = 0;
      items.forEach(function (it, i2) {
        if ((budget > 0 && Number(it.cost) > budget) || (hours > 0 && Number(it.hours) > hours)) {
          chipEls[i2].classList.add("pruned");
          pruned++;
        }
      });
      svMsg.className = "sv-msg";
      svMsg.textContent = pruned > 0
        ? "اتاستبعد " + pruned + " بند بيكسر القيود حتى لو لوحده"
        : "مفيش بند مستحيل لوحده — الكل داخل البحث";
      setTimeout(boundStage, 850);
    }

    // ٣) الحد الأعلى النظري — حساب جشع حقيقي بنسبة الربح للتكلفة
    function boundStage() {
      svTitle.textContent = "٣) حساب الحد الأعلى النظري…";
      stageBase(2);
      var sorted = items.slice().sort(function (a, b) {
        return (Number(b.profit) / Math.max(1, Number(b.cost))) - (Number(a.profit) / Math.max(1, Number(a.cost)));
      });
      var rem = budget > 0 ? budget : 0, ub = 0;
      sorted.forEach(function (it) {
        var cst = Number(it.cost) || 0, prf = Number(it.profit) || 0;
        if (cst <= 0) { ub += prf; return; }
        var take = Math.min(cst, rem);
        if (take > 0) { ub += prf * (take / cst); rem -= take; }
      });
      ub = Math.round(ub);
      svMsg.className = "sv-msg";
      svMsg.textContent = "أعلى ربح ممكن نظريًا (لو القيود اتجاهلت): " + fmt(ub) + " جنيه — القرار الحقيقي تحته أو بيساويه";
      svBest.textContent = fmt(ub);
      setTimeout(exploreStage, 900);
    }

    // ٤) استكشاف شجرة التركيبات — عدّ حقيقي على كل تركيبة
    function exploreStage() {
      stageBase(3);
      svTitle.textContent = stride === 1
        ? "٤) استكشاف شجرة التركيبات — كل تركيبة بتتفحص فعلًا…"
        : "٤) استكشاف شجرة التركيبات — عينة حقيقية من " + fmt(total) + " تركيبة…";
      var bestProfit = -1, tried = 0, prevMask = -1, mask = 0;
      (function stepFn() {
        mask += stride;
        if (mask > total) { verifyStage(); return; }
        tried++;
        var cost = 0, hrs = 0, prof = 0;
        for (var i2 = 0; i2 < n; i2++) {
          var on = (mask >> i2) & 1;
          if (on) { cost += items[i2].cost; hrs += items[i2].hours; prof += items[i2].profit; }
          chipEls[i2].classList.toggle("in", !!on);
          chipEls[i2].classList.toggle("out", !on);
          if (prevMask >= 0 && (((mask ^ prevMask) >> i2) & 1)) {
            chipEls[i2].classList.add("flip");
            (function (el) { setTimeout(function () { el.classList.remove("flip"); }, 160); })(chipEls[i2]);
          }
        }
        prevMask = mask;
        if (neon) neon.cur = mask;
        svProfit.textContent = fmt(prof);
        var pc = budget > 0 ? (cost / budget) * 100 : (cost > 0 ? 101 : 0);
        var ph = hours > 0 ? (hrs / hours) * 100 : (hrs > 0 ? 101 : 0);
        svBarCost.style.width = Math.min(100, pc) + "%";
        svBarHours.style.width = Math.min(100, ph) + "%";
        svBarCost.classList.toggle("over", cost > budget);
        svBarHours.classList.toggle("over", hrs > hours);
        svCount.textContent = "عُقدة " + tried + " / " + (stride === 1 ? fmt(total) : steps);
        svProg.style.width = Math.min(96, ((3 + tried / steps) / STAGES) * 100) + "%";
        var over = cost > budget || hrs > hours;
        if (!over) {
          if (prof > bestProfit) {
            bestProfit = prof;
            sfxBest();
            svBest.textContent = fmt(prof);
            svBestBox.classList.remove("bump"); void svBestBox.offsetWidth; svBestBox.classList.add("bump");
            svMsg.className = "sv-msg good";
            svMsg.textContent = "✓ دي أحسن تشكيلة لحد دلوقتي — " + fmt(prof) + " جنيه";
            var svLog = document.getElementById("svLog");
            if (svLog) {
              var li = document.createElement("div");
              var names = [];
              for (var li2 = 0; li2 < n; li2++) { if ((mask >> li2) & 1) names.push(items[li2].name); }
              li.className = "sv-log-row";
              li.textContent = "حل رقم " + (svLog.children.length + 1) + ": " + names.join(" + ") + " — " + fmt(prof) + " جنيه";
              svLog.insertBefore(li, svLog.firstChild);
              while (svLog.children.length > 5) svLog.removeChild(svLog.lastChild);
            }
            neonBurst(neon, mask);
          }
        } else {
          svMsg.className = "sv-msg bad";
          svMsg.textContent = "✗ التركيبة دي خارج القيود — " + (cost > budget ? "الفلوس مش مكفية" : "الوقت مش مكفي");
        }
        setTimeout(stepFn, delay);
      })();
    }

    // ٥) تحقق المحرك — الحل الرياضي الحقيقي بيأكد النتيجة
    function verifyStage() {
      stageBase(4);
      svTitle.textContent = "٥) تحقق المحرك — HiGHS بيحسم رياضيًا…";
      svMsg.className = "sv-msg";
      svMsg.textContent = "المحرك بيحل النموذج الكامل ويأكد إن مفيش تركيبة أحسن من اللي اتختارت…";
      setTimeout(finish, 600);
    }
    function finish() {
      document.body.dataset.warp = "";
      sfxWin();
      svProg.style.width = "100%";
      svMsg.className = "sv-msg good";
      svMsg.textContent = "✓ خلص البحث — وده القرار الأمثل المتأكد منه";
      var d = compute();
      solveBtn.classList.remove("thinking");
      solveBtn.textContent = "احسب القرار الأمثل";
      solveBtn.disabled = false;
      if (!d) { neonStop(); return; }
      if (neon) {
        var fm = 0;
        d.ex.base.chosen.forEach(function (ci) { fm |= (1 << ci); });
        neon.cur = fm;
        neonBurst(neon, fm);
        setTimeout(neonStop, 2000);
      }
      document.getElementById("verdict").classList.remove("pop");
      void document.getElementById("verdict").offsetWidth;
      document.getElementById("verdict").classList.add("pop");
      renderResult(d, true);
      setTimeout(function () { document.body.dataset.solved = "1"; }, 700);
    }
  }

  function maybeResolve() {
    if (currentStep >= 3 && highs && document.body.dataset.solved === "1") solveInstant();
  }
  function renderWhy() {
    var whyEl = document.getElementById("why");
    if (!lastExplain) { whyEl.textContent = "احسب الخطة الأول من خطوة «الخطة»."; return; }
    var ex = lastExplain.ex;
    if (ex.base.status !== "Optimal") { whyEl.textContent = "القيود الحالية مانعة أي خطة — زوّد الميزانية أو الساعات."; return; }
    var why = [];
    if (ex.moneyDelta > 0) why.push("لو زوّدت الميزانية 100 جنيه: الربح يزيد " + fmt(ex.moneyDelta) + " (يبقى " + fmt(ex.moneyPlan.profit) + ").");
    else why.push("لو زوّدت الميزانية 100 جنيه: الربح مش هيتغير.");
    if (ex.timeDelta > 0) why.push("لو وفّرت ساعة زيادة: الربح يزيد " + fmt(ex.timeDelta) + " (يبقى " + fmt(ex.timePlan.profit) + ").");
    else why.push("ساعة زيادة مش هتغير حاجة.");
    if (ex.moneyDelta > 0 && ex.timeDelta === 0) why.push("يعني اللي مقيّدك الفلوس، مش الوقت.");
    else if (ex.timeDelta > 0 && ex.moneyDelta === 0) why.push("يعني اللي مقيّدك الوقت، مش الفلوس.");
    else if (ex.timeDelta === 0 && ex.moneyDelta === 0) why.push("زيادة فلوس أو وقت لوحدهم مش هتفرق — القيد على الاتنين مع بعض.");
    whyEl.innerHTML = why.join("<br>");
  }

  // ---------- السيناريوهات ----------
  function loadScenarios() {
    try { return JSON.parse(localStorage.getItem(SCN_KEY)) || []; } catch (e) { return []; }
  }
  function saveScenarios(list) {
    try { localStorage.setItem(SCN_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function saveCurrentScenario() {
    if (!lastExplain || lastExplain.ex.base.status !== "Optimal") return;
    var le = lastExplain, base = le.ex.base;
    var list = loadScenarios();
    list.push({
      id: Date.now(),
      template: TEMPLATES[le.items ? currentTemplate : currentTemplate].title,
      budget: le.budget, hours: le.hours,
      profit: base.profit, cost: base.cost, hoursUsed: base.hoursUsed,
      chosen: base.chosen.map(function (i) { return le.items[i].name; }),
      itemsCount: le.items.length,
    });
    saveScenarios(list);
    renderScenarios();
  }
  function renderScenarios() {
    var list = loadScenarios();
    var box = document.getElementById("scnList");
    var cmp = document.getElementById("scnCmp");
    box.innerHTML = ""; cmp.innerHTML = "";
    if (list.length === 0) return;
    var best = list.reduce(function (m, s) { return Math.max(m, s.profit); }, 0);
    list.forEach(function (s, idx) {
      var d = document.createElement("div");
      d.className = "scn" + (s.profit === best && list.length > 1 ? " best" : "");
      var top = document.createElement("div");
      top.className = "top";
      var t = document.createElement("div");
      t.className = "t";
      t.textContent = "سيناريو " + (idx + 1) + ": ربح " + fmt(s.profit) + " جنيه";
      top.appendChild(t);
      if (s.profit === best && list.length > 1) {
        var badge = document.createElement("span");
        badge.className = "badge"; badge.textContent = "الأعلى ربحًا";
        top.appendChild(badge);
      }
      var del = document.createElement("button");
      del.type = "button"; del.className = "del"; del.textContent = "×"; del.title = "امسح السيناريو";
      del.addEventListener("click", function () {
        var l2 = loadScenarios().filter(function (x) { return x.id !== s.id; });
        saveScenarios(l2); renderScenarios();
      });
      top.appendChild(del);
      d.appendChild(top);
      var n = document.createElement("div");
      n.className = "n";
      n.textContent = s.template + " — ميزانية " + fmt(s.budget) + " وساعات " + fmt(s.hours) + " — صرف " + fmt(s.cost) + " — " + s.chosen.join(" + ");
      d.appendChild(n);
      box.appendChild(d);
    });
    if (list.length > 1) {
      var tb = document.createElement("table");
      tb.className = "cmp";
      tb.innerHTML = "<thead><tr><th>السيناريو</th><th>الربح</th><th>المصروف</th><th>الساعات</th></tr></thead>";
      var body = document.createElement("tbody");
      list.forEach(function (s, idx) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>سيناريو " + (idx + 1) + (s.profit === best ? " ⭐" : "") + "</td><td>" + fmt(s.profit) + "</td><td>" + fmt(s.cost) + "</td><td>" + fmt(s.hoursUsed) + " / " + fmt(s.hours) + "</td>";
        body.appendChild(tr);
      });
      tb.appendChild(body);
      cmp.appendChild(tb);
    }
  }

  // ---------- تشغيل ----------
  buildTemplateBar();
  var saved = loadState();
  if (saved) renderState(saved);
  else {
    var wt = TEMPLATES.workshop;
    renderState({ template: "workshop", budget: wt.budget, hours: wt.hours, items: JSON.parse(JSON.stringify(wt.items)) });
    saveState();
  }
  renderScenarios();
  updateLiveBar();

  var addRowBtn = document.getElementById("addRow");
  addRowBtn.dataset.sfx = "1";
  addRowBtn.addEventListener("click", function () { sfxAdd(); addRow(null); saveState(); });
  var resetBtnEl = document.getElementById("resetBtn");
  resetBtnEl.dataset.sfx = "1";
  resetBtnEl.addEventListener("click", function () {
    sfxReset();
    var t = TEMPLATES[currentTemplate];
    renderState({ template: currentTemplate, budget: t.budget, hours: t.hours, items: JSON.parse(JSON.stringify(t.items)) });
    saveState();
    lastExplain = null;
    document.getElementById("verdict").textContent = "اضغط «احسب القرار الأمثل»";
    document.body.dataset.solved = "";
    statusEl.textContent = "رجعنا للقالب الأصلي.";
  });
  budgetEl.addEventListener("input", function () { sfxTick(); saveState(); maybeResolve(); });
  hoursEl.addEventListener("input", function () { sfxTick(); saveState(); maybeResolve(); });
  solveBtn.dataset.sfx = "1";
  solveBtn.addEventListener("click", solveLive);
  var saveScnBtn = document.getElementById("saveScn");
  saveScnBtn.dataset.sfx = "1";
  saveScnBtn.addEventListener("click", function () { sfxSave(); saveCurrentScenario(); });
  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.dataset.sfx = "1";
    b.addEventListener("click", function () { showStep(Number(b.dataset.go)); });
  });
  document.querySelectorAll("#stepper button").forEach(function (b) {
    b.addEventListener("click", function () { showStep(Number(b.dataset.step)); });
  });

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (hadController) { location.reload(); }
    });
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      reg.update();
      window.addEventListener("focus", function () { reg.update(); });
    }).catch(function () {});
  }


  // ---------- الحياة المحيطة: خلفية نيون هادئة في كل الشاشات ----------
  // ---------- الفضاء المحيط: سديم ونجوم وكوكب بحلقات وأقمار — لكل خطوة قطاع بلونه ----------
  (function ambient() {
    var c = document.getElementById("bgCanvas");
    if (!c || !c.getContext) { showErr("canvas: no 2d context"); return; }
    var g = c.getContext("2d");
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    var W = 0, H = 0;
    var dbgEl = document.getElementById("dbg");
    var dbgFrames = 0;
    function dbg(extra) {
      if (dbgEl) dbgEl.textContent = "cv " + c.width + "x" + c.height + " dpr" + dpr + " " + extra;
    }
    function size() {
      W = window.innerWidth; H = window.innerHeight;
      if (!W || !H) { setTimeout(size, 300); return; }
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);
    dbg(REDUCED ? "rm:1" : "ctx:ok");
    var fg = document.getElementById("fgCanvas");
    var fg2 = null;
    try { fg2 = fg && fg.getContext ? fg.getContext("2d") : null; } catch (efg) { fg2 = null; }
    function sizeFg() {
      if (!fg2 || !W) return;
      fg.width = Math.round(window.innerWidth * dpr); fg.height = Math.round(window.innerHeight * dpr);
      fg2.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeFg();
    window.addEventListener("resize", sizeFg);
    var SECTORS = {
      "1": { n1: [34, 216, 238],  n2: [168, 85, 247], sat: "rgba(103,232,249,.85)" },
      "2": { n1: [255, 167, 38],  n2: [244, 81, 30],  sat: "rgba(255,204,128,.85)" },
      "3": { n1: [236, 64, 122],  n2: [34, 216, 238], sat: "rgba(244,143,177,.85)" },
      "4": { n1: [124, 224, 163], n2: [255, 213, 79], sat: "rgba(200,230,201,.85)" }
    };
    function sector() { return SECTORS[document.body.dataset.step] || SECTORS["1"]; }
    function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
    var i;
    var stars = [];
    for (i = 0; i < 70; i++) stars.push({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.1, tw: Math.random() * 6.28, ts: 0.001 + Math.random() * 0.003 });
    var wstars = [];
    for (i = 0; i < 60; i++) wstars.push({ a: Math.random() * 6.28, z: Math.random() });
    var sats = [{ r: 2.1, sp: 0.0009, ph: 0, sz: 3 }, { r: 2.7, sp: -0.00055, ph: 2.2, sz: 2.2 }];
    var arts = [{ x: 0.12, y: 0.75, s: 9, sp: 0.0004, ph: 1 }, { x: 0.88, y: 0.55, s: 7, sp: 0.0006, ph: 3 }];
    var threads = [];
    for (i = 0; i < 3; i++) threads.push({ x: Math.random() * 1.3 - 0.3, sp: 0.00006 + Math.random() * 0.00008, tilt: 0.22 + Math.random() * 0.28 });
    var comet = null;
    if (REDUCED) {
      // تقليل الحركة: فريم واحد ثابت — المنظر يفضل موجود من غير حركة
      try {
        var sec0 = sector();
        var m0 = Math.max(W, H);
        var ng0 = g.createRadialGradient(W / 2, H * 0.3, 10, W / 2, H * 0.3, m0 * 0.7);
        ng0.addColorStop(0, rgba(sec0.n1, 0.09)); ng0.addColorStop(0.5, rgba(sec0.n2, 0.05)); ng0.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = ng0; g.fillRect(0, 0, W, H);
        stars.forEach(function (s0) {
          g.beginPath(); g.arc(s0.x * W, s0.y * H, s0.r, 0, 6.283);
          g.fillStyle = "rgba(255,255,255,.45)"; g.fill();
        });
        var ox0 = W / 2, oy0 = H * 0.2, R0 = 46;
        var halo0 = g.createRadialGradient(ox0, oy0, R0 * 0.3, ox0, oy0, R0 * 2.6);
        halo0.addColorStop(0, rgba(sec0.n1, 0.18)); halo0.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = halo0; g.beginPath(); g.arc(ox0, oy0, R0 * 2.6, 0, 6.283); g.fill();
        var pb0 = g.createRadialGradient(ox0 - R0 * 0.35, oy0 - R0 * 0.35, R0 * 0.1, ox0, oy0, R0);
        pb0.addColorStop(0, rgba(sec0.n1, 0.38)); pb0.addColorStop(1, rgba(sec0.n2, 0.12));
        g.fillStyle = pb0; g.beginPath(); g.arc(ox0, oy0, R0, 0, 6.283); g.fill();
      } catch (e0) { showErr("ambient-static: " + (e0.message || e0)); }
      dbg("rm:1 static");
      return;
    }
    var t0 = 0;
    var errOnce = false;
    function frame(t) {
      if (document.hidden) { requestAnimationFrame(frame); return; }
      if (t - t0 < 40) { requestAnimationFrame(frame); return; } // ~25fps للموبايلات الضعيفة
      try {
      var dt = t - t0; t0 = t;
      var sec = sector();
      g.clearRect(0, 0, W, H);

      // سديم عميق بألوان القطاع
      var nx = W * (0.5 + 0.25 * Math.sin(t / 9000)), ny = H * (0.3 + 0.15 * Math.cos(t / 11000));
      var m = Math.max(W, H);
      var ng = g.createRadialGradient(nx, ny, 10, nx, ny, m * 0.7);
      ng.addColorStop(0, rgba(sec.n1, 0.10)); ng.addColorStop(0.5, rgba(sec.n2, 0.055)); ng.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = ng; g.fillRect(0, 0, W, H);
      var n2g = g.createRadialGradient(W - nx, H - ny, 10, W - nx, H - ny, m * 0.55);
      n2g.addColorStop(0, rgba(sec.n2, 0.07)); n2g.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = n2g; g.fillRect(0, 0, W, H);

      if (document.body.dataset.warp === "1") {
        // هايبرسبيس وقت الحساب: خطوط نجمية متسارعة من المركز
        var cx = W / 2, cy = H * 0.4;
        wstars.forEach(function (s) {
          s.z += dt * 0.0016;
          if (s.z > 1) { s.z = 0.05; s.a = Math.random() * 6.28; }
          var d1 = s.z * s.z * m;
          var d0 = Math.max(1, d1 - s.z * 90);
          g.beginPath();
          g.moveTo(cx + Math.cos(s.a) * d0, cy + Math.sin(s.a) * d0);
          g.lineTo(cx + Math.cos(s.a) * d1, cy + Math.sin(s.a) * d1);
          g.strokeStyle = rgba(sec.n1, 0.35 * s.z + 0.1);
          g.lineWidth = s.z * 2 + 0.4;
          g.stroke();
        });
        var wg = g.createRadialGradient(cx, cy, 1, cx, cy, 120);
        wg.addColorStop(0, "rgba(255,255,255,.14)"); wg.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = wg; g.beginPath(); g.arc(cx, cy, 120, 0, 6.283); g.fill();
        if (fg2) { try { fg2.clearRect(0, 0, W, H); } catch (ecf) {} }
        requestAnimationFrame(frame);
        return;
      }

      // نجوم بتومض
      stars.forEach(function (s) {
        s.tw += dt * s.ts;
        g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, 6.283);
        g.fillStyle = "rgba(255,255,255," + (0.35 + 0.4 * Math.abs(Math.sin(s.tw))) + ")";
        g.fill();
      });

      // الكوكب النيون: أكبر وأوضح مع هالة وحلقات
      var ox = W / 2, oy = H * 0.2;
      var R = 46 + 6 * Math.sin(t / 750);
      var halo = g.createRadialGradient(ox, oy, R * 0.3, ox, oy, R * 2.6);
      halo.addColorStop(0, rgba(sec.n1, 0.16)); halo.addColorStop(0.6, rgba(sec.n2, 0.06)); halo.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = halo; g.beginPath(); g.arc(ox, oy, R * 2.6, 0, 6.283); g.fill();
      var pb = g.createRadialGradient(ox - R * 0.35, oy - R * 0.35, R * 0.1, ox, oy, R);
      pb.addColorStop(0, rgba(sec.n1, 0.35)); pb.addColorStop(1, rgba(sec.n2, 0.10));
      g.fillStyle = pb; g.beginPath(); g.arc(ox, oy, R, 0, 6.283); g.fill();
      [1.45, 1.8].forEach(function (rm, ri) {
        g.save(); g.translate(ox, oy); g.rotate(Math.sin(t / 4000 + ri) * 0.35 + 0.3); g.scale(1, 0.32);
        g.beginPath(); g.arc(0, 0, R * rm, 0, 6.283);
        g.strokeStyle = rgba(sec.n2, 0.22 - ri * 0.06); g.lineWidth = 1.4; g.stroke();
        g.restore();
      });
      // أقمار صناعية بتدور
      sats.forEach(function (s2) {
        s2.ph += dt * s2.sp;
        var sx = ox + Math.cos(s2.ph) * R * s2.r, sy = oy + Math.sin(s2.ph) * R * s2.r * 0.42;
        g.beginPath(); g.arc(sx, sy, s2.sz * 3, 0, 6.283); g.fillStyle = rgba(sec.n1, 0.12); g.fill();
        g.beginPath(); g.arc(sx, sy, s2.sz, 0, 6.283); g.fillStyle = sec.sat; g.fill();
      });
      // قطع أثرية متوهجة بتطفو وتلف
      arts.forEach(function (a) {
        var ay = a.y + 0.04 * Math.sin(t * a.sp * 3 + a.ph);
        var ax = a.x + 0.03 * Math.cos(t * a.sp * 2);
        g.save(); g.translate(ax * W, ay * H); g.rotate(t * a.sp);
        g.beginPath();
        g.moveTo(0, -a.s); g.lineTo(a.s, 0); g.lineTo(0, a.s); g.lineTo(-a.s, 0); g.closePath();
        g.strokeStyle = rgba(sec.n2, 0.3); g.lineWidth = 1.2; g.stroke();
        g.fillStyle = rgba(sec.n1, 0.07); g.fill();
        g.restore();
      });

      // ===== الطبقة الأمامية: خيوط ضوء ومذنّب فوق الواجهة =====
      if (fg2) {
        fg2.clearRect(0, 0, W, H);
        threads.forEach(function (th, ti) {
          th.x += dt * th.sp;
          if (th.x > 1.35) th.x = -0.35;
          var x0 = th.x * W, slope = W * th.tilt;
          var grd = fg2.createLinearGradient(x0, -40, x0 + slope, H + 40);
          grd.addColorStop(0, "rgba(0,0,0,0)");
          grd.addColorStop(0.5, rgba(ti % 2 ? sec.n1 : sec.n2, 0.11));
          grd.addColorStop(1, "rgba(0,0,0,0)");
          fg2.beginPath(); fg2.moveTo(x0, -40); fg2.lineTo(x0 + slope, H + 40);
          fg2.strokeStyle = grd; fg2.lineWidth = 1.6; fg2.stroke();
        });
        if (!comet && Math.random() < dt / 3800) {
          comet = { x: Math.random() * W * 0.6 + W * 0.1, y: -30, vx: 0.16 + Math.random() * 0.12, vy: 0.3 + Math.random() * 0.16, life: 1 };
        }
        if (comet) {
          comet.x += comet.vx * dt; comet.y += comet.vy * dt; comet.life -= dt / 1500;
          if (comet.life <= 0 || comet.y > H + 60) { comet = null; }
          else {
            var tx = comet.x - comet.vx * 260, ty = comet.y - comet.vy * 260;
            var cg = fg2.createLinearGradient(tx, ty, comet.x, comet.y);
            cg.addColorStop(0, "rgba(0,0,0,0)");
            cg.addColorStop(1, "rgba(255,255,255," + (0.34 * comet.life) + ")");
            fg2.beginPath(); fg2.moveTo(tx, ty); fg2.lineTo(comet.x, comet.y);
            fg2.strokeStyle = cg; fg2.lineWidth = 2; fg2.stroke();
            fg2.beginPath(); fg2.arc(comet.x, comet.y, 6, 0, 6.283);
            fg2.fillStyle = rgba(sec.n1, 0.25 * comet.life); fg2.fill();
            fg2.beginPath(); fg2.arc(comet.x, comet.y, 2, 0, 6.283);
            fg2.fillStyle = "rgba(255,255,255," + (0.6 * comet.life) + ")"; fg2.fill();
          }
        }
      }
      } catch (ef) {
        if (!errOnce) { errOnce = true; showErr("ambient-frame: " + (ef.message || ef)); }
        return; // وقّف اللوب بدل تكرار الخطأ
      }
      dbgFrames++;
      if (dbgFrames % 20 === 1) dbg("f:" + dbgFrames + " st:" + (document.body.dataset.step || "?"));
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  var bin = Uint8Array.from(atob(window.HIGHS_WASM_B64), function (c) { return c.charCodeAt(0); });
  window.HighsFactory({
    instantiateWasm: function (imports, done) {
      WebAssembly.instantiate(bin, imports).then(function (r) { done(r.instance, r.module); });
      return {};
    }
  }).then(function (h) {
    highs = h;
    solveBtn.disabled = false;
    statusEl.textContent = "المحرك جاهز.";
    if (location.search.indexOf("demo=1") !== -1) showStep(3);
  }).catch(function (e) {
    statusEl.textContent = "محرك الحساب ما اتحمّلش: " + e;
  });
})();
