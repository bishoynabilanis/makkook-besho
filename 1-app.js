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
  var APP_VERSION = "14";
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
    [1, 2, 3, 4, 5].forEach(function (i) {
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
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (reg) {
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
      if (dbgEl) dbgEl.textContent = "v" + APP_VERSION + " cv " + c.width + "x" + c.height + " dpr" + dpr + " " + extra;
    }
    function size() {
      W = window.innerWidth; H = window.innerHeight;
      if (!W || !H) { setTimeout(size, 300); return; }
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);
    dbg(REDUCED ? "rm:1 gentle" : "ctx:ok");
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
    var t0 = 0;
    var errOnce = false;
    var GENTLE = REDUCED; // تقليل الحركة: حركة أبطأ وأخف — مش إيقاف (بطلب المستخدم)
    function frame(t) {
      if (document.hidden) { requestAnimationFrame(frame); return; }
      if (t - t0 < (GENTLE ? 70 : 40)) { requestAnimationFrame(frame); return; } // ~25fps (~14 لطيف)
      try {
      var dt = t - t0; t0 = t;
      if (GENTLE) dt = dt * 0.45;
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
        if (!GENTLE && !comet && Math.random() < dt / 3800) {
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
      if (dbgFrames % 20 === 1) dbg((GENTLE ? "gentle " : "") + "f:" + dbgFrames + " st:" + (document.body.dataset.step || "?"));
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

  // ---------- قناتك: تحليل أداء فيسبوك ويوتيوب من ملفات التصدير نفسها ----------
  (function () {
    var fileEl = document.getElementById("chFile");
    if (!fileEl) return;
    var pasteEl = document.getElementById("chPaste");
    var outEl = document.getElementById("chOut");
    var stEl = document.getElementById("chStatus");
    var PROPS = {
      tr_yt: "تريند رادار — يوتيوب",
      mh_yt: "المهندس — يوتيوب",
      mh_fb: "المهندس — فيسبوك"
    };
    var PROP_KEY = "mk_channel_prop";
    var prop = "tr_yt";
    try { prop = localStorage.getItem(PROP_KEY) || "tr_yt"; } catch (e) {}
    if (!PROPS[prop]) prop = "tr_yt";
    var DAYS = ["الحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"];
    var STOP = ("في,من,على,إلى,عن,أن,إن,كان,ما,لا,لم,لن,يا,هو,هي,ده,دي,the,a,an,and,or,to,of,in,on,for,with,how,why,is,are,at,it,this,that,vs,its,his,her,says,after,new,first,back,what,happened,show,shows,means,mattered,week,stories,اللي,بعد,قبل,أول,اخر,آخر,كل,لو,مش,أو,و").split(",");
    var STOPMAP = {}; STOP.forEach(function (w) { STOPMAP[w] = 1; });

    function esc(s) {
      return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function fmtN(x) {
      if (x == null || isNaN(x)) return "—";
      var r = Math.round(x * 10) / 10;
      var s = String(Math.abs(r) % 1 ? r : Math.round(r));
      var neg = r < 0 ? "-" : "";
      return neg + s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function num(s) {
      if (s == null) return null;
      s = String(s).replace(/[,\s٬]/g, "").replace(/[٫]/g, ".").trim();
      if (s === "" || s === "--" || s === "-") return null;
      var m = s.match(/-?\d+(\.\d+)?/);
      return m ? parseFloat(m[0]) : null;
    }
    function pctV(s) {
      if (s == null) return null;
      return num(String(s).replace("%", ""));
    }
    function hms(s) {
      s = String(s == null ? "" : s).trim();
      var m = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      return (+m[1] || 0) * 3600 + (+m[2]) * 60 + (+m[3]);
    }
    function parseDateSmart(s) {
      s = String(s == null ? "" : s).trim();
      if (!s) return null;
      var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
      m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
      if (m) return new Date(+m[3], +m[1] - 1, +m[2], +(m[4] || 0), +(m[5] || 0)); // شهر أولًا (تصدير ميتا)
      var t = Date.parse(s.replace(/\s+/g, " "));
      return isNaN(t) ? null : new Date(t);
    }
    function pickDelim(line) {
      var c = (line.match(/,/g) || []).length, s = (line.match(/;/g) || []).length, t = (line.match(/\t/g) || []).length;
      return t > c && t > s ? "\t" : (s > c ? ";" : ",");
    }
    function parseCSV(text) {
      text = String(text).replace(/^﻿/, "");
      var dl = pickDelim(text.split(/\r?\n/, 1)[0] || "");
      var rows = [], row = [], cell = "", inQ = false, i, c;
      for (i = 0; i < text.length; i++) {
        c = text[i];
        if (inQ) {
          if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
          else cell += c;
        } else if (c === '"') inQ = true;
        else if (c === dl) { row.push(cell); cell = ""; }
        else if (c === "\n" || c === "\r") {
          if (c === "\r" && text[i + 1] === "\n") i++;
          row.push(cell); cell = "";
          if (row.length > 1 || row[0] !== "") rows.push(row);
          row = [];
        } else cell += c;
      }
      if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
      return rows;
    }
    function colIdx(headers, names) {
      var low = headers.map(function (h) { return String(h || "").trim().toLowerCase(); });
      var i, n, want;
      for (n = 0; n < names.length; n++) {
        want = names[n].toLowerCase();
        for (i = 0; i < low.length; i++) if (low[i] === want) return i;
      }
      for (n = 0; n < names.length; n++) {
        want = names[n].toLowerCase();
        for (i = 0; i < low.length; i++) if (low[i].indexOf(want) !== -1) return i;
      }
      return -1;
    }
    function stat(nums) {
      nums = nums.filter(function (v) { return v != null && !isNaN(v); }).sort(function (a, b) { return a - b; });
      if (!nums.length) return null;
      var sum = 0; nums.forEach(function (v) { sum += v; });
      return { n: nums.length, avg: sum / nums.length, med: nums[Math.floor(nums.length / 2)], max: nums[nums.length - 1], min: nums[0], sum: sum };
    }
    function card(title, bodyHtml) { return '<div class="ch-card"><h3>' + title + '</h3>' + bodyHtml + '</div>'; }
    function statRow(items) {
      return '<div class="ch-stat">' + items.map(function (it) { return "<div>" + esc(it[0]) + "<b>" + esc(it[1]) + "</b></div>"; }).join("") + "</div>";
    }
    var VICON = { "اعمل": "✅", "بطّل": "🛑", "ظبّط": "🛠️", "خد بالك": "👀" };
    function verdictCard(verdicts) {
      if (!verdicts.length) return "";
      return card("🎯 الخلاصة — القرار لـ " + esc(PROPS[prop]),
        "<ul>" + verdicts.map(function (v) {
          return "<li><b>" + (VICON[v[0]] || "▫️") + " " + v[0] + ":</b> " + v[1] + "</li>";
        }).join("") + "</ul>");
    }
    function keywords(titles) {
      var map = {};
      titles.forEach(function (t) {
        String(t || "").toLowerCase().replace(/#\S+/g, " ").replace(/[.,!?:;()\[\]"'«»،|&]/g, " ").split(/\s+/).forEach(function (w) {
          if (w.length > 2 && !STOPMAP[w]) map[w] = (map[w] || 0) + 1;
        });
      });
      return Object.keys(map).map(function (k) { return [k, map[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    }

    // ---- كشف نوع الجدول ----
    function sniffCSV(rows) {
      var h = rows[0].map(function (x) { return String(x || "").trim(); });
      var low0 = (h[0] || "").toLowerCase();
      if ((low0 === "date" || h[0] === "التاريخ") && h.length >= 2) {
        if ((h[1] || "").toLowerCase() === "content" || h[1] === "المحتوى") return { kind: "chart", h: h, rows: rows.slice(1) };
        return { kind: "totals", h: h, rows: rows.slice(1) };
      }
      if (colIdx(h, ["post_id"]) >= 0 && colIdx(h, ["created_time_utc", "status_type"]) >= 0)
        return { kind: "fbgraph", h: h, rows: rows.slice(1) };
      if (colIdx(h, ["date_end_time_utc"]) >= 0 && colIdx(h, ["page_media_view", "page_post_engagements"]) >= 0)
        return { kind: "fbdaily", h: h, rows: rows.slice(1) };
      if (colIdx(h, ["publish time", "وقت النشر"]) >= 0 && (colIdx(h, ["post type", "نوع المنشور"]) >= 0 || colIdx(h, ["description", "الوصف"]) >= 0))
        return { kind: "meta", h: h, rows: rows.slice(1) };
      if (colIdx(h, ["video title", "عنوان الفيديو"]) >= 0 || colIdx(h, ["content", "المحتوى", "video", "الفيديو"]) >= 0 && colIdx(h, ["views", "المشاهدات"]) >= 0)
        return { kind: "studio", h: h, rows: rows.slice(1) };
      return { kind: "generic", h: h, rows: rows.slice(1) };
    }

    // ---- استوديو يوتيوب: جدول الفيديوهات ----
    function analyzeStudio(h, rows, fname) {
      var iTitle = colIdx(h, ["video title", "عنوان الفيديو", "title"]);
      var iViews = colIdx(h, ["views", "المشاهدات"]);
      var iPct = colIdx(h, ["average percentage viewed", "متوسط النسبة المئوية للمشاهدة"]);
      var iDurSec = colIdx(h, ["duration", "المدة"]);
      var iDur = colIdx(h, ["average view duration", "متوسط مدة المشاهدة"]);
      var iImpr = colIdx(h, ["thumbnail impressions", "impressions", "مرات الظهور"]);
      var iCtr = colIdx(h, ["click-through rate", "نسبة النقر"]);
      var iSubs = colIdx(h, ["subscribers", "المشتركون"]);
      var iWatch = colIdx(h, ["watch time (hours)", "مدة المشاهدة (ساعات)", "watch time"]);
      var iPub = colIdx(h, ["video publish time", "تاريخ نشر الفيديو", "publish time", "وقت النشر"]);
      var iLike = colIdx(h, ["likes", "الإعجابات"]);
      var iCom = colIdx(h, ["comments", "التعليقات"]);
      var iShare = colIdx(h, ["shares", "عمليات المشاركة"]);
      var iEngaged = colIdx(h, ["engaged views", "المشاهدات المتفاعلة"]);
      var iStayed = colIdx(h, ["stayed to watch", "استمروا في المشاهدة", "استمرّوا في المشاهدة"]);
      var iUnique = colIdx(h, ["unique viewers", "مشاهدون فرديون", "المشاهدون الفرديون"]);
      var iNewV = colIdx(h, ["new viewers", "مشاهدون جدد", "المشاهدون الجدد"]);
      var iRetV = colIdx(h, ["returning viewers", "مشاهدون عائدون", "المشاهدون العائدون"]);
      // صف الإجمالي (Total) بيكون أول صف من غير عنوان
      var totalRow = null;
      rows = rows.filter(function (r) {
        var c0 = String(r[0] || "").trim().toLowerCase();
        if (c0 === "total" || c0 === "الإجمالي") { totalRow = r; return false; }
        return r.length > 1 && (iTitle < 0 || String(r[iTitle] || "").trim());
      });
      var V = []; // verdicts
      var out = [];
      var views = rows.map(function (r) { return iViews >= 0 ? num(r[iViews]) : null; });
      var vs = stat(views);
      var found = [];
      if (iViews >= 0) found.push("المشاهدات");
      if (iEngaged >= 0) found.push("المشاهدات المتفاعلة");
      if (iStayed >= 0) found.push("فضلوا واقفين يتفرجوا");
      if (iNewV >= 0) found.push("مشاهدين جدد/عائدين");
      if (iUnique >= 0) found.push("مشاهدين فريدين");
      if (iWatch >= 0) found.push("مدة المشاهدة");
      if (iDurSec >= 0) found.push("مدة الفيديو");
      if (iImpr >= 0) found.push("مرات ظهور المصغرة");
      if (iCtr >= 0) found.push("نسبة النقر");
      if (iSubs >= 0) found.push("المشتركين");
      if (iPub >= 0) found.push("تاريخ النشر");
      if (iLike >= 0) found.push("الإعجابات");
      if (iCom >= 0) found.push("التعليقات");
      if (iShare >= 0) found.push("المشاركات");
      var missing = [];
      if (iPub < 0) missing.push("Video publish time");
      if (iImpr < 0) missing.push("Thumbnail impressions");
      if (iCtr < 0) missing.push("Thumbnail click-through rate");
      if (iLike < 0) missing.push("Likes");
      if (iCom < 0) missing.push("Comments");

      // الاحتفاظ: من العمود أو محسوب من مدة المشاهدة / المدة
      var ret = rows.map(function (r, k) {
        if (iPct >= 0) { var p = pctV(r[iPct]); if (p != null) return p; }
        if (iWatch >= 0 && iDurSec >= 0 && views[k]) {
          var wh = num(r[iWatch]), dur = num(r[iDurSec]);
          if (wh != null && dur && dur > 0) return wh * 3600 / views[k] / dur * 100;
        }
        return null;
      });
      var rs = stat(ret);

      if (vs) {
        var idx = views.map(function (v, k) { return [v == null ? -1 : v, k]; }).sort(function (a, b) { return b[0] - a[0]; });
        var top = idx[0], bot = idx[idx.length - 1];
        var topT = iTitle >= 0 ? String(rows[top[1]][iTitle]) : "—";
        var botT = iTitle >= 0 ? String(rows[bot[1]][iTitle]) : "—";
        // قرار: اعمل أكتر من نوع الفائز / بطّل الخاسر
        if (idx.length >= 3) {
          var win = idx.filter(function (p) { return p[0] >= vs.med * 2 && p[0] > 0; });
          var losers = idx.filter(function (p) { return p[0] <= vs.med * 0.35; });
          if (win.length && iTitle >= 0) {
            var wk = keywords(win.map(function (p) { return rows[p[1]][iTitle]; })).slice(0, 3).map(function (p) { return p[0]; });
            V.push(["اعمل", "أكتر من مواضيع زي «" + esc(topT.slice(0, 45)) + "» — جابت " + fmtN(top[0]) + " مشاهدة (" + fmtN(top[0] / (vs.med || 1)) + "× الوسط)" + (wk.length ? ". الكلمات الرابحة: " + esc(wk.join("، ")) : "") + "."]);
          }
          if (losers.length >= Math.max(2, Math.ceil(idx.length / 3)) && iTitle >= 0) {
            var lk = keywords(losers.map(function (p) { return rows[p[1]][iTitle]; })).slice(0, 3).map(function (p) { return p[0]; });
            V.push(["بطّل", "الشكل اللي بيجيب " + fmtN(bot[0]) + " مشاهدة زي «" + esc(botT.slice(0, 45)) + "» — أقل من تلت الوسط (" + fmtN(vs.med) + ")" + (lk.length ? ". الكلمات الخاسرة: " + esc(lk.join("، ")) : "") + "."]);
          }
        }
      }
      if (rs) {
        var isMostlyShort = iDurSec >= 0 && stat(rows.map(function (r) { return num(r[iDurSec]); })) && stat(rows.map(function (r) { return num(r[iDurSec]); })).med <= 60;
        var th = isMostlyShort ? 70 : 40;
        if (rs.med < th) {
          V.push(["ظبّط", "أول ثانيتين — الوسط بيشوف " + fmtN(rs.med) + "% بس من " + (isMostlyShort ? "الشورت" : "الفيديو") + " (المقبول " + th + "%+). ابدأ بالخبر نفسه فورًا، بلاش مقدمة."]);
        } else {
          V.push(["اعمل", "الاحتفاظ كويس (" + fmtN(rs.med) + "% وسط) — كمّل على نفس طريقة البداية."]);
        }
        // أسوأ فيديو احتفاظ
        var rIdx = ret.map(function (v, k) { return [v == null ? 1e9 : v, k]; }).sort(function (a, b) { return a[0] - b[0]; });
        if (rIdx.length && rIdx[0][0] !== 1e9 && iTitle >= 0 && rIdx[0][0] < th * 0.6) {
          V.push(["بطّل", "أسلوب «" + esc(String(rows[rIdx[0][1]][iTitle]).slice(0, 45)) + "» — أسوأ احتفاظ (" + fmtN(rIdx[0][0]) + "%). الناس بتقفل فورًا."]);
        }
      }
      if (iStayed >= 0) {
        var stw = stat(rows.map(function (r) { return pctV(r[iStayed]); }));
        if (stw) {
          if (stw.med < 25) V.push(["ظبّط", "بس " + fmtN(stw.med) + "% بيقفوا يتفرجوا من أول لحظة (Stayed to watch) — الخُطّاف أضعف حاجة عندك: أول جملة = النتيجة أو الخبر، من غير سلامات."]);
          else if (stw.med >= 40) V.push(["اعمل", fmtN(stw.med) + "% بيفضلوا واقفين يتفرجوا (Stayed to watch) — بدايتك مسكة، حافظ عليها."]);
        }
      }
      if (iNewV >= 0 && iRetV >= 0) {
        var newS = 0, retS = 0;
        rows.forEach(function (r) { newS += num(r[iNewV]) || 0; retS += num(r[iRetV]) || 0; });
        if (newS + retS >= 20) {
          if (retS < newS * 0.15) V.push(["ظبّط", "جمهورك كله تقريبًا جديد (" + fmtN(newS) + " جديد مقابل " + fmtN(retS) + " راجع) — مفيش حد بيرجع. اعمل سلاسل مترابطة (جزء ١ وجزء ٢) وثبّت موعد النشر."]);
          else if (retS > newS * 0.3) V.push(["اعمل", "عندك جمهور بيرجع (" + fmtN(retS) + " راجع) — ده أصل غالي: اعملهم سلسلة ثابتة بموعد."]);
        }
      }
      if (iEngaged >= 0 && vs) {
        var er = stat(rows.map(function (r, k) { var e = num(r[iEngaged]); return e != null && views[k] ? e / views[k] * 100 : null; }));
        if (er && er.med < 60) V.push(["خد بالك", "المشاهدات المتفاعلة " + fmtN(er.med) + "% بس من كل مشاهدة — جزء كبير بيعدّي من غير مشاهدة حقيقية."]);
      }
      if (iImpr >= 0 && iCtr >= 0) {
        var imp = rows.map(function (r) { return num(r[iImpr]); });
        var ctr = rows.map(function (r) { return pctV(r[iCtr]); });
        var wsum = 0, isum = 0;
        ctr.forEach(function (c, k) { if (c != null && imp[k]) { wsum += c * imp[k]; isum += imp[k]; } });
        var is = stat(imp);
        if (isum > 0) {
          var wavg = wsum / isum;
          if (wavg < 4) V.push(["ظبّط", "المصغرات والعناوين — نسبة النقر " + fmtN(wavg) + "% من " + fmtN(isum) + " ظهور (الصحي 4%+). مصغرة بوجه/رقم كبير وعنوان فيه فضول."]);
          else V.push(["اعمل", "نسبة النقر " + fmtN(wavg) + "% — المصغرات شغالة، متبوظهاش."]);
        }
        if (is && is.med < 100 && rows.length >= 5) {
          V.push(["خد بالك", "يوتيوب مش بيعرض فيديوهاتك كفاية (وسط " + fmtN(is.med) + " ظهور للفيديو) — القناة محتاجة عناوين فيها كلمات الناس بتدوّر عليها فعلًا، ونشر ثابت."]);
        }
      }
      if (iSubs >= 0) {
        var subT = 0, anyS = false;
        rows.forEach(function (r) { var s = num(r[iSubs]); if (s) { subT += s; anyS = true; } });
        var bestS = -1, bestK = -1;
        rows.forEach(function (r, k) { var s = num(r[iSubs]); if (s != null && s > bestS) { bestS = s; bestK = k; } });
        if (anyS && bestK >= 0 && bestS > 0 && iTitle >= 0) {
          V.push(["اعمل", "تكملة لـ«" + esc(String(rows[bestK][iTitle]).slice(0, 45)) + "» — الفيديو الوحيد اللي جاب مشتركين (" + fmtN(bestS) + "). الفيديوهات اللي بتجيب مشتركين أغلى من اللي بتجيب مشاهدات فاضية."]);
        } else if (!anyS && rows.length >= 5) {
          V.push(["ظبّط", "ولا فيديو جاب مشترك جديد في الفترة دي — حط طلب اشتراك واضح في أول ١٠ ثواني أو في النهاية."]);
        }
      }
      if (iPub >= 0) {
        var dates = rows.map(function (r) { return parseDateSmart(r[iPub]); }).filter(Boolean);
        var daySet = {};
        dates.forEach(function (d) { daySet[d.getDay()] = (daySet[d.getDay()] || 0) + 1; });
        var dk = Object.keys(daySet);
        if (dates.length >= 3 && dk.length <= 2) {
          V.push(["خد بالك", "كل النشر على " + dk.map(function (k) { return DAYS[+k]; }).join(" و") + " بس — انشر في أيام مختلفة عشان نعرف أحسن يوم لجمهورك."]);
        }
        // معدل النشر
        if (dates.length >= 3) {
          dates.sort(function (a, b) { return a - b; });
          var spanDays = Math.max(1, (dates[dates.length - 1] - dates[0]) / 86400000 + 1);
          var perWeek = dates.length / spanDays * 7;
          if (perWeek < 3) V.push(["اعمل", "معدل النشر " + fmtN(perWeek) + " فيديو/أسبوع — قليل لقناة شورتس. ٥+ في الأسبوع بيدّي الخوارزمية فرص أكتر."]);
        }
      }
      if (!V.length) V.push(["خد بالك", "البيانات اللي في الملف مش كفاية لقرار حاسم — صدّر بمقاييس أكتر (المشاهدات + مدة المشاهدة + الظهور + نسبة النقر + تاريخ النشر)."]);

      var statsItems = [["فيديوهات", fmtN(rows.length)]];
      if (vs) { statsItems.push(["إجمالي المشاهدات", fmtN(totalRow && iViews >= 0 && num(totalRow[iViews]) != null ? num(totalRow[iViews]) : vs.sum)]); statsItems.push(["وسط المشاهدات", fmtN(vs.med)]); }
      if (rs) statsItems.push(["وسط الاحتفاظ", fmtN(rs.med) + "%"]);
      var detail = "<p class='dim'>اتعرف على: جدول فيديوهات استوديو يوتيوب (" + esc(fname) + "). المقاييس المقروءة: " + esc(found.join("، ") || "ولا واحد") + ".</p>" + statRow(statsItems);
      if (missing.length) detail += '<p class="dim">عشان قرار أعمق، زوّد في التصدير: ' + esc(missing.join(" • ")) + "</p>";
      if (vs && iTitle >= 0) {
        var idx2 = views.map(function (v, k) { return [v == null ? -1 : v, k]; }).sort(function (a, b) { return b[0] - a[0]; });
        detail += "<p>الأعلى:</p><ul>" + idx2.slice(0, 3).map(function (p) { return "<li>" + esc(String(rows[p[1]][iTitle]).slice(0, 55)) + " — <b>" + fmtN(p[0]) + "</b></li>"; }).join("") + "</ul>";
      }
      return verdictCard(V) + card("📹 التفاصيل (" + esc(fname) + ")", detail);
    }

    // ---- Chart data (يومي لكل فيديو) و Totals (يومي للقناة) ----
    function analyzeChart(h, rows, fname) {
      var iDate = 0, iTitle = colIdx(h, ["video title", "عنوان الفيديو"]), iViews = colIdx(h, ["views", "المشاهدات"]);
      if (iViews < 0) return analyzeGeneric(h, rows, fname);
      var perV = {}, days = {};
      rows.forEach(function (r) {
        var t = iTitle >= 0 ? String(r[iTitle] || "").slice(0, 45) : "?";
        var v = num(r[iViews]) || 0;
        var d = String(r[iDate] || "");
        if (!perV[t]) perV[t] = [];
        if (v > 0) perV[t].push([d, v]);
        days[d] = (days[d] || 0) + v;
      });
      var V = [];
      var died = 0, alive = 0;
      Object.keys(perV).forEach(function (t) {
        var dd = perV[t];
        if (!dd.length) { died++; return; }
        var firstDay = dd[0][0], lastDay = dd[dd.length - 1][0];
        if (dd.length === 1) died++; else alive++;
      });
      var total = Object.keys(perV).length;
      if (total >= 3) {
        if (died >= total * 0.6) V.push(["ظبّط", died + " من " + total + " فيديو بياخد مشاهدات يوم واحد وبعدها صفر — يوتيوب بيوقّف توزيعها فورًا. الحل: عناوين أقوى (بحث) واحتفاظ أعلى عشان الفيديو يعيش أكتر من يوم."]);
        else if (alive > 0) V.push(["اعمل", alive + " فيديو لسه بيجيب مشاهدات بعد يوم النشر — دول الأصول الحقيقية، اعمل لهم أشباه."]);
      }
      var dv = Object.keys(days).sort().map(function (d) { return [d, days[d]]; });
      var detail = "<p class='dim'>اتعرف على: بيانات يومية لكل فيديو (" + esc(fname) + ") — " + dv.length + " يوم، " + total + " فيديو.</p>";
      if (dv.length) detail += "<p>أعلى يوم: <b>" + esc(dv.sort(function (a, b) { return b[1] - a[1]; })[0][0]) + "</b> (" + fmtN(days[dv[0][0]]) + " مشاهدة).</p>";
      return verdictCard(V) + card("📅 الحركة اليومية (" + esc(fname) + ")", detail);
    }
    function analyzeTotals(h, rows, fname) {
      var iV = colIdx(h, ["views", "المشاهدات"]);
      if (iV < 0) return analyzeGeneric(h, rows, fname);
      var pts = rows.map(function (r) { return [String(r[0] || ""), num(r[iV]) || 0]; }).filter(function (p) { return p[0]; });
      var V = [];
      var detail = "<p class='dim'>اتعرف على: إجمالي يومي للقناة (" + esc(fname) + ") — " + pts.length + " يوم.</p>";
      if (pts.length >= 7) {
        var last3 = stat(pts.slice(-3).map(function (p) { return p[1]; }));
        var prev = stat(pts.slice(-10, -3).map(function (p) { return p[1]; }));
        var sum = 0; pts.forEach(function (p) { sum += p[1]; });
        detail += statRow([["الفترة", pts.length + " يوم"], ["إجمالي", fmtN(sum)], ["آخر ٣ أيام", fmtN(last3 ? last3.sum : 0)]]);
        if (prev && last3) {
          if (last3.avg > prev.avg * 1.5 && last3.avg > 0) V.push(["اعمل", "القناة بتصعد: آخر ٣ أيام متوسط " + fmtN(last3.avg) + " مشاهدة/يوم مقابل " + fmtN(prev.avg) + " قبل كده. ثبّت النشر دلوقتي."]);
          else if (last3.avg < prev.avg * 0.5) V.push(["ظبّط", "نزول حاد: آخر ٣ أيام " + fmtN(last3.avg) + "/يوم مقابل " + fmtN(prev.avg) + " — راجع آخر تغيير في المحتوى أو التوقيت."]);
          else if (sum > 0 && last3.avg === 0) V.push(["بطّل", "مفيش مشاهدات خالص آخر ٣ أيام — انشر فورًا، القناة نايمة."]);
          else V.push(["خد بالك", "ثابت على " + fmtN(last3.avg) + " مشاهدة/يوم — النمو محتاج تغيير في الموضوع أو العنوان مش بس استمرارية."]);
        }
      }
      return verdictCard(V) + card("📈 ترند القناة (" + esc(fname) + ")", detail);
    }

    // ---- تصدير ميتا (فيسبوك/إنستجرام Business Suite) ----
    function analyzeMeta(h, rows, fname) {
      var iViews = colIdx(h, ["views", "المشاهدات", "plays"]);
      var iPub = colIdx(h, ["publish time", "وقت النشر", "تاريخ النشر"]);
      var iType = colIdx(h, ["post type", "نوع المنشور"]);
      var iDesc = colIdx(h, ["description", "الوصف"]);
      var iTitle2 = colIdx(h, ["title", "العنوان"]);
      var iText = iDesc >= 0 ? iDesc : iTitle2;
      var i3s = colIdx(h, ["3-second video views", "مشاهدات الفيديو لمدة 3 ثوان"]);
      var i1m = colIdx(h, ["1-minute video views", "مشاهدات الفيديو لمدة دقيقة"]);
      var iLike = colIdx(h, ["likes", "الإعجابات", "reactions"]);
      var iCom = colIdx(h, ["comments", "التعليقات"]);
      var iShare = colIdx(h, ["shares", "عمليات المشاركة"]);
      var iReach = colIdx(h, ["reach", "الوصول"]);
      var iFollows = colIdx(h, ["follows", "المتابعات الجديدة"]);
      rows = rows.filter(function (r) { return r.length > 2; });
      var views = rows.map(function (r) { return iViews >= 0 ? num(r[iViews]) : null; });
      var vs = stat(views);
      var V = [], out = [];
      var found = [];
      if (iViews >= 0) found.push("المشاهدات"); if (iPub >= 0) found.push("وقت النشر");
      if (iType >= 0) found.push("نوع المنشور"); if (iReach >= 0) found.push("الوصول");
      if (iLike >= 0) found.push("الإعجابات"); if (iCom >= 0) found.push("التعليقات");
      if (iShare >= 0) found.push("المشاركات"); if (i3s >= 0) found.push("مشاهدات ٣ ثوان");
      if (i1m >= 0) found.push("مشاهدات الدقيقة"); if (iFollows >= 0) found.push("المتابعات");

      if (vs && iType >= 0) {
        var byType = {};
        rows.forEach(function (r, k) { var t = String(r[iType] || "غير معروف"); (byType[t] = byType[t] || []).push(views[k]); });
        var ts = Object.keys(byType).map(function (t) { return [t, stat(byType[t])]; }).filter(function (p) { return p[1] && p[1].n >= 2; }).sort(function (a, b) { return b[1].avg - a[1].avg; });
        if (ts.length >= 2) {
          V.push(["اعمل", "منشورات «" + esc(ts[0][0]) + "» — متوسط " + fmtN(ts[0][1].avg) + " مشاهدة، الأعلى بين الأنواع."]);
          if (ts[ts.length - 1][1].avg < ts[0][1].avg * 0.5)
            V.push(["بطّل", "منشورات «" + esc(ts[ts.length - 1][0]) + "» — متوسط " + fmtN(ts[ts.length - 1][1].avg) + " بس (" + fmtN(ts[0][1].avg / ts[ts.length - 1][1].avg) + "× أقل). حوّل مجهودها للنوع الرابح."]);
        }
      }
      if (i3s >= 0 && i1m >= 0) {
        var ratios = rows.map(function (r) { var a = num(r[i3s]), b = num(r[i1m]); return a && b != null && a > 0 ? b / a * 100 : null; });
        var hs = stat(ratios);
        if (hs) {
          if (hs.med < 10) V.push(["ظبّط", "الخطّاف ميت: " + fmtN(hs.med) + "% بس بيكمّلوا من ٣ ثواني لدقيقة. أول لقطة/جملة لازم تكون الخبر نفسه."]);
          else if (hs.med >= 25) V.push(["اعمل", "الخطّاف قوي (" + fmtN(hs.med) + "% بيكمّلوا لدقيقة) — ثبّت الأسلوب."]);
          else V.push(["ظبّط", "الخطّاف وسط (" + fmtN(hs.med) + "%) — قرّب أقوى معلومة للثانية الأولى."]);
        }
      }
      if (iShare >= 0 && vs) {
        var sh = rows.map(function (r, k) { var s = num(r[iShare]); return s != null && views[k] ? s / views[k] * 100 : null; });
        var ss = stat(sh);
        if (ss && ss.med < 0.2) V.push(["ظبّط", "المشاركات قريبة من الصفر (" + fmtN(ss.med) + "% من المشاهدات) — المحتوى اللي بيتبعت هو اللي بيكبّر الصفحات. اختم بسؤال أو معلومة تستاهل البعت."]);
      }
      if (iFollows >= 0) {
        var fsum = 0; rows.forEach(function (r) { var f = num(r[iFollows]); if (f) fsum += f; });
        if (fsum === 0 && rows.length >= 5) V.push(["ظبّط", "مفيش متابعين جدد من المنشورات دي — راجع الدعوة للمتابعة وتسلسل المحتوى."]);
      }
      if (iPub >= 0) {
        var parsed = rows.map(function (r, k) { return [parseDateSmart(r[iPub]), views[k]]; }).filter(function (p) { return p[0]; });
        if (parsed.length >= 4) {
          var byDay = {}, byHour = {};
          parsed.forEach(function (p) {
            var dk = p[0].getDay(), hk = Math.floor(p[0].getHours() / 3) * 3;
            (byDay[dk] = byDay[dk] || []).push(p[1] || 0);
            (byHour[hk] = byHour[hk] || []).push(p[1] || 0);
          });
          function bestOf(map) { var bk = null, ba = -1; Object.keys(map).forEach(function (k) { var s = stat(map[k]); if (s && s.avg > ba) { ba = s.avg; bk = k; } }); return bk == null ? null : [bk, stat(map[bk])]; }
          var bd = bestOf(byDay), bh = bestOf(byHour);
          if (bd && bd[1].n >= 1) V.push(["اعمل", "انشر يوم " + DAYS[+bd[0]] + (bh ? " بين " + (+bh[0]) + " و" + (+bh[0] + 3) : "") + " — متوسط " + fmtN(bd[1].avg) + " مشاهدة هناك (من " + parsed.length + " منشور بتاريخ مقروء)."]);
        }
      }
      if (iText >= 0) {
        var seen = {}, dupN = 0;
        rows.forEach(function (r) {
          var t = String(r[iText] || "").trim().replace(/\s+/g, " ").slice(0, 120);
          if (!t) return;
          if (seen[t]) dupN++; else seen[t] = 1;
        });
        if (dupN > 0) V.push(["بطّل", dupN + " منشور بوصف مكرر حرفيًا — التكرار بيضرب الوصول (وقاعدتك أصلاً: ممنوع التكرار)."]);
      }
      if (!V.length) V.push(["خد بالك", "الملف اتقري (" + rows.length + " منشور) بس المقاييس الموجودة مش كفاية لقرار — الأعمدة المهمة: Views, Publish time, Post type, 3-second و1-minute video views, Shares, Follows."]);

      var detail = "<p class='dim'>اتعرف على: تصدير ميتا Business Suite (" + esc(fname) + "). المقروء: " + esc(found.join("، ") || "ولا عمود معروف") + ".</p>";
      if (vs) detail += statRow([["منشورات", fmtN(vs.n)], ["وسط المشاهدات", fmtN(vs.med)], ["متوسط", fmtN(vs.avg)], ["الأعلى", fmtN(vs.max)]]);
      if (vs && iText >= 0) {
        var idx = views.map(function (v, k) { return [v == null ? -1 : v, k]; }).sort(function (a, b) { return b[0] - a[0]; });
        detail += "<p>الأعلى:</p><ul>" + idx.slice(0, 3).map(function (p) { return "<li>" + esc(String(rows[p[1]][iText]).slice(0, 55)) + " — <b>" + fmtN(p[0]) + "</b></li>"; }).join("") + "</ul>" +
          "<p>الأقل:</p><ul>" + idx.slice(-3).reverse().map(function (p) { return "<li>" + esc(String(rows[p[1]][iText]).slice(0, 55)) + " — <b>" + fmtN(p[0]) + "</b></li>"; }).join("") + "</ul>";
      }
      return verdictCard(V) + card("📘 التفاصيل (" + esc(fname) + ")", detail);
    }

    // ---- فيسبوك Graph API: تصدير رؤى المنشورات (post_id + created_time_utc) ----
    function parseUtc(s) {
      var m = String(s == null ? "" : s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
      if (!m) return null;
      return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    }
    function analyzeFbGraph(h, rows, fname) {
      var iTime = colIdx(h, ["created_time_utc", "created_time"]);
      var iMedia = colIdx(h, ["media_type"]);
      var iMsg = colIdx(h, ["message", "description", "الوصف"]);
      var iReact = colIdx(h, ["reactions_total", "reactions"]);
      var iComm = colIdx(h, ["comments_total", "comments"]);
      var iShare = colIdx(h, ["shares", "عمليات المشاركة"]);
      var iView = colIdx(h, ["post_media_view", "views", "المشاهدات"]);
      var iReach = colIdx(h, ["post_total_media_view_unique", "reach", "الوصول"]);
      var iClicks = colIdx(h, ["post_clicks", "clicks"]);
      var iVv = colIdx(h, ["post_video_views"]);
      var V = [];
      rows = rows.filter(function (r) { return r && r.some(function (c) { return String(c || "").trim(); }); });
      if (!rows.length) return card("📘 فيسبوك", "<p>الملف مفيهوش منشورات.</p>");
      function g(r, i) { return i >= 0 ? num(r[i]) : null; }
      function typeOf(r) {
        var t = iMedia >= 0 ? String(r[iMedia] || "").trim().toLowerCase() : "";
        return t === "photo" ? "صور" : t === "video" ? "فيديو" : "نص بس";
      }
      var views = rows.map(function (r) { return g(r, iView); });
      var vs = stat(views);
      // ١) نوع المنشور: صور × نص × فيديو
      var groups = {};
      rows.forEach(function (r, k) { var t = typeOf(r); (groups[t] = groups[t] || []).push(views[k]); });
      var gStats = Object.keys(groups).map(function (t) { return { t: t, s: stat(groups[t]), n: groups[t].length }; }).filter(function (x) { return x.s && x.n >= 3; });
      gStats.sort(function (a, b) { return b.s.avg - a.s.avg; });
      if (gStats.length >= 2) {
        var best = gStats[0], worst = gStats[gStats.length - 1];
        V.push(["اعمل", "منشورات «" + best.t + "» — متوسط " + fmtN(Math.round(best.s.avg)) + " مشاهدة (من " + fmtN(best.n) + " منشور)، الأعلى بين الأنواع."]);
        if (best.s.avg >= worst.s.avg * 2 && worst.s.avg > 0) V.push(["بطّل", "منشورات «" + worst.t + "» — متوسط " + fmtN(Math.round(worst.s.avg)) + " بس (" + fmtN(Math.round(best.s.avg / Math.max(worst.s.avg, 0.1))) + "× أقل). حوّل مجهودها لـ«" + best.t + "»."]);
      } else if (gStats.length === 1) {
        V.push(["اعمل", "كل منشوراتك تقريبًا «" + gStats[0].t + "» (متوسط " + fmtN(Math.round(gStats[0].s.avg)) + " مشاهدة) — جرّب تنوّع بسيط عشان تقيس الأفضل."]);
      }
      // ٢) أحسن ساعة نشر (توقيت دبي = UTC+4)
      if (iTime >= 0) {
        var byHour = {};
        rows.forEach(function (r, k) {
          var t = parseUtc(r[iTime]); if (t == null || views[k] == null) return;
          var hr = (new Date(t).getUTCHours() + 4) % 24;
          (byHour[hr] = byHour[hr] || []).push(views[k]);
        });
        var hStats = Object.keys(byHour).map(function (hr) { return { hr: +hr, s: stat(byHour[hr]), n: byHour[hr].length }; }).filter(function (x) { return x.n >= 3; });
        hStats.sort(function (a, b) { return b.s.avg - a.s.avg; });
        if (hStats.length) {
          var bh = hStats[0];
          V.push(["اعمل", "انشر حوالين الساعة " + bh.hr + " بتوقيت دبي — متوسط " + fmtN(Math.round(bh.s.avg)) + " مشاهدة في الساعة دي (من " + fmtN(bh.n) + " منشور)."]);
        }
      }
      // ٣) السلاسل (سلسلة / رقم / جزء في النص)
      if (iMsg >= 0) {
        var ser = [], non = [];
        rows.forEach(function (r, k) {
          if (views[k] == null) return;
          var msg = String(r[iMsg] || "");
          (/سلسلة|رقم\s*\d+|\(رقم|جزء/.test(msg) ? ser : non).push(views[k]);
        });
        var ss = stat(ser), ns = stat(non);
        if (ss && ns && ser.length >= 3 && non.length >= 3) {
          if (ss.avg >= ns.avg * 1.3) V.push(["اعمل", "السلاسل بتكسب — متوسط " + fmtN(Math.round(ss.avg)) + " مشاهدة مقابل " + fmtN(Math.round(ns.avg)) + " للمنفرد. كمّل السلاسل ورقّمها."]);
          else if (ns.avg >= ss.avg * 1.3) V.push(["ظبّط", "السلاسل أقل من المنفرد (" + fmtN(Math.round(ss.avg)) + " مقابل " + fmtN(Math.round(ns.avg)) + ") — راجع عناوين السلسلة أو موضوعاتها."]);
        }
        // التكرار (قاعدة بيشو: ممنوع التكرار)
        var seen = {}, dups = 0;
        rows.forEach(function (r) {
          var msg = String(r[iMsg] || "").replace(/\s+/g, " ").trim().slice(0, 80);
          if (msg.length < 20) return;
          if (seen[msg]) dups++; else seen[msg] = 1;
        });
        if (dups) V.push(["بطّل", fmtN(dups) + " منشور بنص مكرر — التكرار بيضرب الوصول (وقاعدتك أصلاً: ممنوع التكرار)."]);
      }
      // ٤) المشاركات والتعليقات (أقوى إشارة)
      var shSum = 0, cmSum = 0, topShare = null;
      rows.forEach(function (r, k) {
        var sh = g(r, iShare) || 0, cm = g(r, iComm) || 0;
        shSum += sh; cmSum += cm;
        if (sh > 0 && (!topShare || sh > topShare.sh)) topShare = { sh: sh, k: k };
      });
      if (rows.length && (shSum + cmSum) / rows.length < 0.5) {
        V.push(["ظبّط", "التفاعل ضعيف — " + fmtN(shSum) + " مشاركة و" + fmtN(cmSum) + " تعليق في " + fmtN(rows.length) + " منشور. اختم كل منشور بسؤال صريح (مثال: «حصلت معاك قبل كده؟»)."]);
      } else if (topShare && iMsg >= 0) {
        V.push(["اعمل", "أكتر منشور اتشار («" + esc(String(rows[topShare.k][iMsg] || "بدون نص").slice(0, 45)) + "» — " + fmtN(topShare.sh) + " مشاركة) — اعمل منه سلسلة."]);
      }
      // ٥) الوصول × المشاهدات
      var vSum = 0, rSum = 0;
      rows.forEach(function (r) { vSum += g(r, iView) || 0; rSum += g(r, iReach) || 0; });
      if (rSum > 0) {
        var per = vSum / rSum;
        if (per < 1.3) V.push(["خد بالك", "كل شخص بيشوف المنشور مرة واحدة تقريبًا (" + fmtN(vSum) + " مشاهدة / " + fmtN(rSum) + " وصول) — مفيش إعادة مشاهدة؛ المحتوى محتاج سبب يرجّع الناس."]);
        else V.push(["اعمل", "الناس بترجع للمنشور (" + per.toFixed(1) + " مشاهدة لكل شخص) — ده أسلوب يتكرر."]);
      }
      // ٦) معدل النشر
      if (iTime >= 0) {
        var ts = rows.map(function (r) { return parseUtc(r[iTime]); }).filter(function (t) { return t != null; }).sort(function (a, b) { return a - b; });
        if (ts.length >= 4) {
          var weeks = Math.max((ts[ts.length - 1] - ts[0]) / 6048e5, 0.5);
          var rate = ts.length / weeks;
          if (rate < 3) V.push(["ظبّط", "معدل النشر " + rate.toFixed(1) + " منشور/أسبوع — قليل للخوارزمية. استهدف ٥+ في الأسبوع."]);
          else V.push(["اعمل", "معدل النشر " + rate.toFixed(1) + " منشور/أسبوع — كويس، حافظ عليه بجدول ثابت."]);
        }
      }
      // ٧) الفيديو لو كل قيمه صفر
      if (iVv >= 0) {
        var anyVid = rows.some(function (r) { return typeOf(r) === "فيديو"; });
        var vvSum = rows.reduce(function (a, r) { return a + (g(r, iVv) || 0); }, 0);
        if (anyVid && vvSum === 0) V.push(["خد بالك", "عندك فيديو بس مشاهدات الفيديو كلها صفر في التصدير — لو فعلاً فيديوهاتك مهمة، راجع طريقة النشر (رفع مباشر مش رابط)."]);
      }
      var found = [];
      if (iView >= 0) found.push("المشاهدات");
      if (iReach >= 0) found.push("الوصول الفريد");
      if (iShare >= 0) found.push("المشاركات");
      if (iComm >= 0) found.push("التعليقات");
      if (iReact >= 0) found.push("التفاعلات");
      if (iClicks >= 0) found.push("النقرات");
      var statsItems = [["منشورات", fmtN(rows.length)]];
      if (vs) { statsItems.push(["إجمالي المشاهدات", fmtN(vs.sum)]); statsItems.push(["وسط المشاهدات", fmtN(vs.med)]); }
      if (rSum) statsItems.push(["إجمالي الوصول", fmtN(rSum)]);
      statsItems.push(["مشاركات/تعليقات", fmtN(shSum) + "/" + fmtN(cmSum)]);
      var detail = "<p class='dim'>اتعرف على: تصدير رؤى فيسبوك (Graph API) — منشورات الصفحة (" + esc(fname) + "). المقاييس: " + esc(found.join("، ")) + ".</p>" + statRow(statsItems);
      if (iMsg >= 0 && vs) {
        var idx = views.map(function (v, k) { return [v == null ? -1 : v, k]; }).sort(function (a, b) { return b[0] - a[0]; });
        detail += "<p>الأعلى:</p><ul>" + idx.slice(0, 3).map(function (p) { return "<li>" + esc(String(rows[p[1]][iMsg] || "(بدون نص)").slice(0, 55)) + " — <b>" + fmtN(p[0]) + "</b></li>"; }).join("") + "</ul>" +
          "<p>الأقل:</p><ul>" + idx.slice(-3).reverse().map(function (p) { return "<li>" + esc(String(rows[p[1]][iMsg] || "(بدون نص)").slice(0, 55)) + " — <b>" + fmtN(p[0]) + "</b></li>"; }).join("") + "</ul>";
      }
      return verdictCard(V) + card("📘 منشورات فيسبوك (" + esc(fname) + ")", detail);
    }

    // ---- فيسبوك Graph API: الحركة اليومية للصفحة (date_end_time_utc) ----
    function analyzeFbDaily(h, rows, fname) {
      var iDate = colIdx(h, ["date_end_time_utc", "date"]);
      var iViews = colIdx(h, ["page_media_view", "views"]);
      var iReach = colIdx(h, ["page_total_media_view_unique", "reach"]);
      var iEng = colIdx(h, ["page_post_engagements", "engagements"]);
      var iFol = colIdx(h, ["page_daily_follows", "follows"]);
      var V = [];
      rows = rows.filter(function (r) { return r && String(r[iDate] || "").trim(); });
      if (rows.length < 4) return card("📘 الحركة اليومية", "<p>أيام قليلة أوي في الملف.</p>");
      var views = rows.map(function (r) { return iViews >= 0 ? num(r[iViews]) || 0 : 0; });
      var half = Math.floor(rows.length / 2);
      var first = stat(views.slice(0, half)), second = stat(views.slice(half));
      if (first && second) {
        if (second.avg > first.avg * 1.5) V.push(["اعمل", "المشاهدات اليومية طالعة — متوسط " + fmtN(Math.round(second.avg)) + "/يوم آخر فترة مقابل " + fmtN(Math.round(first.avg)) + " قبلها. اللي بتعمله مؤخرًا شغال، كمّل."]);
        else if (first.avg > 0 && second.avg < first.avg * 0.6) V.push(["ظبّط", "المشاهدات اليومية نازلة — " + fmtN(Math.round(second.avg)) + "/يوم بعد ما كانت " + fmtN(Math.round(first.avg)) + ". ارجع للمنشورات اللي كانت ماشية."]);
        else V.push(["خد بالك", "المشاهدات اليومية ثابتة تقريبًا (" + fmtN(Math.round(second.avg)) + "/يوم) — محتاجة دفعة: سلسلة جديدة أو تعاون."]);
      }
      if (iFol >= 0) {
        var fol = rows.reduce(function (a, r) { return a + (num(r[iFol]) || 0); }, 0);
        var vw = views.reduce(function (a, b) { return a + b; }, 0);
        if (vw > 100 && fol / Math.max(rows.length, 1) < 0.2) V.push(["ظبّط", "المشاهدات مش بتتحول لمتابعة — " + fmtN(fol) + " متابعة جديدة في " + fmtN(rows.length) + " يوم رغم " + fmtN(vw) + " مشاهدة. اطلب المتابعة صراحة في أول سطر."]);
        else if (fol > 0) V.push(["اعمل", "في " + fmtN(fol) + " متابعة جديدة في الفترة دي — الزخم بيبني."]);
      }
      if (iEng >= 0) {
        var eng = stat(rows.map(function (r) { return num(r[iEng]); }));
        if (eng && views.reduce(function (a, b) { return a + b; }, 0) > 0) {
          var ratio = eng.sum / views.reduce(function (a, b) { return a + b; }, 0) * 100;
          if (ratio < 2) V.push(["ظبّط", "التفاعل " + ratio.toFixed(1) + "% من المشاهدات — الناس بتتفرج وبتعدي. سؤال في آخر كل منشور بيرفع النسبة دي."]);
        }
      }
      var statsItems = [["أيام", fmtN(rows.length)]];
      if (iViews >= 0) statsItems.push(["إجمالي المشاهدات", fmtN(views.reduce(function (a, b) { return a + b; }, 0))]);
      if (iReach >= 0) statsItems.push(["إجمالي الوصول", fmtN(rows.reduce(function (a, r) { return a + (num(r[iReach]) || 0); }, 0))]);
      var detail = "<p class='dim'>اتعرف على: الحركة اليومية لصفحة فيسبوك (Graph API) (" + esc(fname) + ").</p>" + statRow(statsItems);
      return verdictCard(V) + card("📘 الحركة اليومية (" + esc(fname) + ")", detail);
    }

    // ---- تيك آوت: سجل المشاهدة (JSON أو HTML) ----
    function analyzeTakeout(entries, fname) {
      var chan = {}, hours = new Array(24).fill(0), n = 0, t0 = null, t1 = null;
      entries.forEach(function (e) {
        if (!e.title) return;
        n++;
        if (e.channel) chan[e.channel] = (chan[e.channel] || 0) + 1;
        var d = e.time ? new Date(e.time) : null;
        if (d && !isNaN(d)) {
          hours[d.getHours()]++;
          if (!t0 || d < t0) t0 = d; if (!t1 || d > t1) t1 = d;
        }
      });
      var topC = Object.keys(chan).map(function (k) { return [k, chan[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
      var bestH = 0; hours.forEach(function (v, i) { if (v > hours[bestH]) bestH = i; });
      var V = [["خد بالك", "ده سجل مشاهدتك إنت من جوجل تيك آوت، مش أداء قناة. أرقام قناتك هاتها من استوديو يوتيوب ← الوضع المتقدّم ← تصدير (الخطوات فوق)."]];
      return verdictCard(V) + card("👀 سجل المشاهدة (" + esc(fname) + ")",
        "<p>" + fmtN(n) + " مشاهدة" + (t0 && t1 ? "، من " + t0.toLocaleDateString("ar-EG") + " لـ " + t1.toLocaleDateString("ar-EG") : "") + ".</p>" +
        (topC.length ? "<p>أكتر قنوات بتتفرج عليها:</p><ul>" + topC.map(function (p) { return "<li>" + esc(p[0]) + " (" + fmtN(p[1]) + ")</li>"; }).join("") + "</ul>" : "") +
        "<p>أكتر ساعة بتتفرج فيها: حوالي <b>" + bestH + ":00</b>.</p>");
    }
    function parseTakeoutJSON(text) {
      var arr = JSON.parse(text);
      if (!Array.isArray(arr)) return null;
      return arr.map(function (e) {
        if (!e || typeof e !== "object") return null;
        var title = String(e.title || "").replace(/^Watched ?|^Watched /, "");
        var ch = null;
        if (Array.isArray(e.subtitles) && e.subtitles[0]) ch = e.subtitles[0].name || null;
        if (e.details) return null;
        return { title: title || null, channel: ch, time: e.time || null };
      }).filter(function (e) { return e && e.title; });
    }
    function parseTakeoutHTML(text) {
      var out = [], m;
      var re = /Watched(?:&nbsp;| )<a href="[^"]*"[^>]*>(.*?)<\/a>(?:<br\s*\/?>(?:<a href="[^"]*"[^>]*>(.*?)<\/a>)<br\s*\/?>([^<]*)|)/g;
      while ((m = re.exec(text)) && out.length < 60000) out.push({ title: m[1] || null, channel: m[2] || null, time: m[3] || null });
      return out.filter(function (e) { return e.title; });
    }

    // ---- فيسبوك الشخصي (تنزيل معلوماتك) ----
    function analyzeFbPersonal(arr, fname) {
      var posts = arr.filter(function (e) { return e && (e.timestamp || e.data); });
      var t0 = null, t1 = null;
      posts.forEach(function (e) {
        var d = e.timestamp ? new Date(e.timestamp * 1000) : null;
        if (d && !isNaN(d)) { if (!t0 || d < t0) t0 = d; if (!t1 || d > t1) t1 = d; }
      });
      var V = [["خد بالك", "ده أرشيف منشوراتك الشخصي من «تنزيل معلوماتك» — مفيهوش ولا رقم أداء. الأرقام من Meta Business Suite ← الرؤى ← المحتوى ← تصدير (الخطوات فوق)."]];
      return verdictCard(V) + card("📘 أرشيف شخصي (" + esc(fname) + ")",
        "<p>" + fmtN(posts.length) + " منشور" + (t0 ? "، من " + t0.toLocaleDateString("ar-EG") + " لـ " + t1.toLocaleDateString("ar-EG") : "") + ".</p>");
    }

    function analyzeGeneric(h, rows, fname) {
      var iV = colIdx(h, ["views", "المشاهدات", "reach", "plays"]);
      if (iV < 0) return card("🤔 مش قادرين نتعرف على نوع الملف — " + esc(fname),
        "<p>اتقري كجدول (" + rows.length + " صف) بس الأعمدة مش مألوفة. أول الأعمدة: <span class='dim'>" + esc(h.slice(0, 10).join(" | ")) + "</span></p><p>صدّر من المصادر المذكورة فوق وارفع الملف زي ما هو.</p>");
      var vs = stat(rows.map(function (r) { return num(r[iV]); }));
      return card("📊 قراءة عامة — " + esc(fname),
        "<p>" + rows.length + " صف، عمود الأرقام: «" + esc(h[iV]) + "».</p>" +
        (vs ? statRow([["صفوف", fmtN(vs.n)], ["المتوسط", fmtN(vs.avg)], ["الأعلى", fmtN(vs.max)]]) : ""));
    }

    function analyzeText(name, text) {
      var t = String(text).replace(/^﻿/, "");
      var first = t.slice(0, 400).trim();
      if (first[0] === "[" || first[0] === "{") {
        try {
          var j = JSON.parse(t);
          if (Array.isArray(j)) {
            if (j[0] && (String(j[0].title || "").indexOf("Watched") === 0 || j[0].header === "YouTube")) return analyzeTakeout(parseTakeoutJSON(t), name);
            return analyzeFbPersonal(j, name);
          }
          return card("🤔 JSON مش مألوف — " + esc(name), "<p>الملف اتقري بس شكله مش من الصيغ اللي نعرفها.</p>");
        } catch (e) {
          return card("⚠️ JSON مكسور — " + esc(name), "<p>الملف مش مكتمل أو متقصوص. الصقه كله أو ارفع الملف نفسه.</p>");
        }
      }
      if (/<[a-z][\s\S]*>/i.test(first)) {
        var entries = parseTakeoutHTML(t);
        if (entries.length) return analyzeTakeout(entries, name);
        return card("🤔 صفحة HTML مش مألوفة — " + esc(name), "<p>مش لاقيين فيها سجل مشاهدة يوتيوب.</p>");
      }
      var rows = parseCSV(t);
      if (rows.length < 2) return card("⚠️ مفيش بيانات — " + esc(name), "<p>الملف فاضي أو مش بصيغة جدول.</p>");
      var s = sniffCSV(rows);
      if (s.kind === "meta") return analyzeMeta(s.h, s.rows, name);
      if (s.kind === "fbgraph") return analyzeFbGraph(s.h, s.rows, name);
      if (s.kind === "fbdaily") return analyzeFbDaily(s.h, s.rows, name);
      if (s.kind === "studio") return analyzeStudio(s.h, s.rows, name);
      if (s.kind === "chart") return analyzeChart(s.h, s.rows, name);
      if (s.kind === "totals") return analyzeTotals(s.h, s.rows, name);
      return analyzeGeneric(s.h, s.rows, name);
    }

    // ---- فك ZIP (STORE و DEFLATE) من غير مكتبات ----
    function unzipTexts(buf) {
      return new Promise(function (resolve, reject) {
        try {
          var dv = new DataView(buf), len = dv.byteLength, i, out = [];
          var eocd = -1;
          for (i = len - 22; i >= 0 && i >= len - 66000; i--) {
            if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
          }
          if (eocd < 0) return reject(new Error("مش ملف ZIP"));
          var count = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true);
          var dec = new TextDecoder("utf-8"), jobs = [];
          for (i = 0; i < count && off < len; i++) {
            if (dv.getUint32(off, true) !== 0x02014b50) break;
            var method = dv.getUint16(off + 10, true);
            var csize = dv.getUint32(off + 20, true);
            var nlen = dv.getUint16(off + 28, true), elen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true);
            var lho = dv.getUint32(off + 42, true);
            var name = dec.decode(new Uint8Array(buf, off + 46, nlen));
            off += 46 + nlen + elen + clen;
            if (!/\.(csv|json|html?|txt)$/i.test(name) || csize > 12 * 1024 * 1024) continue;
            if (out.length >= 12) continue;
            (function (nm, mth, cs, lo) {
              jobs.push(new Promise(function (res) {
                try {
                  var lnlen = dv.getUint16(lo + 26, true), lelen = dv.getUint16(lo + 28, true);
                  var start = lo + 30 + lnlen + lelen;
                  var data = new Uint8Array(buf, start, cs);
                  if (mth === 0) { out.push({ name: nm, text: dec.decode(data) }); return res(); }
                  if (mth === 8 && "DecompressionStream" in window) {
                    var ds = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
                    new Response(ds).text().then(function (txt) { out.push({ name: nm, text: txt }); res(); }, function () { res(); });
                  } else res();
                } catch (e) { res(); }
              }));
            })(name, method, csize, lho);
          }
          Promise.all(jobs).then(function () { resolve(out); });
        } catch (e) { reject(e); }
      });
    }

    function storeKey() { return "mk_channel_v1_" + prop; }
    function renderParts(parts, note) {
      var html = parts.join("");
      outEl.innerHTML = html;
      try { localStorage.setItem(storeKey(), JSON.stringify({ when: Date.now(), html: html })); } catch (e) {}
      stEl.textContent = note || "خلّصنا. النتيجة اتحفظت على جهازك.";
    }
    function loadSaved() {
      outEl.innerHTML = "";
      try {
        var saved = JSON.parse(localStorage.getItem(storeKey()) || "null");
        if (saved && saved.html) {
          outEl.innerHTML = saved.html;
          stEl.textContent = "آخر تحليل محفوظ لـ«" + PROPS[prop] + "» (" + new Date(saved.when).toLocaleString("ar-EG") + ").";
          return;
        }
      } catch (e) {}
      stEl.textContent = "اختار ملف تصدير «" + PROPS[prop] + "» أو الصقه.";
    }
    document.querySelectorAll("#chProps button").forEach(function (b) {
      if (b.dataset.prop === prop) b.classList.add("active");
      b.addEventListener("click", function () {
        prop = b.dataset.prop;
        try { localStorage.setItem(PROP_KEY, prop); } catch (e) {}
        document.querySelectorAll("#chProps button").forEach(function (x) { x.classList.toggle("active", x === b); });
        try { sfxStep(); } catch (e) {}
        loadSaved();
      });
    });
    function runFiles(list) {
      var parts = [], done = 0, total = list.length;
      if (!total) return;
      stEl.textContent = "بنقرأ " + total + " ملف...";
      list.forEach(function (f, k) {
        var finish = function (html) {
          parts[k] = html; done++;
          if (done === total) renderParts(parts, "اتحلل " + total + " ملف لـ«" + PROPS[prop] + "». النتيجة اتحفظت على جهازك.");
        };
        var isZip = /\.zip$/i.test(f.name);
        if (isZip || (f.text && f.text.slice(0, 2) === "PK")) {
          var go = f.buffer ? Promise.resolve(f.buffer) : (f.file ? f.file.arrayBuffer() : Promise.reject(new Error("no buf")));
          go.then(function (ab) { return unzipTexts(ab); }).then(function (entries) {
            if (!entries.length) return finish(card("⚠️ ZIP من غير ملفات نصية — " + esc(f.name), "<p>فك الضغط مش متاح في المتصفح ده أو الملفات جواه مش CSV/JSON/HTML. فك الضغط على جهازك وارفع اللي جواه.</p>"));
            finish(entries.map(function (e) { return analyzeText(e.name + " (جوّه " + f.name + ")", e.text); }).join(""));
          }).catch(function (e) {
            finish(card("⚠️ مش قادرين نقرا الـ ZIP — " + esc(f.name), "<p>" + esc(e.message || e) + "</p>"));
          });
        } else if (f.text != null) {
          finish(analyzeText(f.name, f.text));
        } else {
          var rd = new FileReader();
          rd.onload = function () { finish(analyzeText(f.file.name, rd.result)); };
          rd.onerror = function () { finish(card("⚠️ قراءة فشلت — " + esc(f.file.name), "")); };
          rd.readAsText(f.file);
        }
      });
    }

    fileEl.addEventListener("change", function () {
      var list = [];
      for (var i = 0; i < fileEl.files.length && i < 10; i++) list.push({ name: fileEl.files[i].name, file: fileEl.files[i] });
      if (list.length) { try { sfxGo(); } catch (e) {} runFiles(list); }
      fileEl.value = "";
    });
    document.getElementById("chGo").addEventListener("click", function () {
      var txt = pasteEl.value.trim();
      if (!txt) { stEl.textContent = "الصق محتوى ملف الأول، أو اختار ملف من فوق."; return; }
      try { sfxGo(); } catch (e) {}
      renderParts([analyzeText("نص ملصوق", txt)], "اتحلل النص الملصوق لـ«" + PROPS[prop] + "». النتيجة اتحفظت على جهازك.");
    });
    document.getElementById("chClear").addEventListener("click", function () {
      outEl.innerHTML = ""; pasteEl.value = ""; stEl.textContent = "";
      try { localStorage.removeItem(storeKey()); } catch (e) {}
    });
    loadSaved();
  })();
})();
