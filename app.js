// مكوك بيشو — واجهة الصفحة (نسخة مسار الخطوات + قوالب + سيناريوهات)
// زي فكرة مكوك: ١ عرّف البنود ٢ حدد القيود ٣ القرار الأمثل ٤ ليه وماذا لو.
// كل خانة قابلة للتعديل، وكل تعديل بيتخزن على الجهاز تلقائيًا (localStorage).
(function () {
  var STORE_KEY = "makkook-besho-state-v3";
  var SCN_KEY = "makkook-besho-scenarios-v1";

  var TEMPLATES = {
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
  function addRow(item) {
    var tr = document.createElement("tr");
    ["name", "category", "cost", "profit", "hours"].forEach(function (k) {
      var td = document.createElement("td");
      var inp = document.createElement("input");
      inp.dataset.k = k;
      if (k === "name" || k === "category") {
        inp.type = "text";
        if (k === "category") inp.setAttribute("list", "cats");
      } else { inp.type = "number"; inp.min = "0"; }
      inp.value = item ? item[k] : (k === "name" || k === "category" ? "" : 0);
      inp.addEventListener("input", function () { saveState(); maybeResolve(); });
      td.appendChild(inp);
      tr.appendChild(td);
    });
    var td = document.createElement("td");
    var del = document.createElement("button");
    del.type = "button"; del.className = "del"; del.textContent = "×"; del.title = "امسح البند ده";
    del.addEventListener("click", function () { tr.remove(); saveState(); maybeResolve(); });
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

  // ---------- الخطوات ----------
  function showStep(n) {
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
    svMsg.className = "sv-msg"; svMsg.textContent = "";
    viz.classList.remove("hidden");
    var neon = neonStart(items);
    solveBtn.disabled = true;
    solveBtn.classList.add("thinking");
    solveBtn.textContent = "بيشتغل قدامك…";
    var n = items.length;
    var total = Math.pow(2, n) - 1;
    var MAXSTEPS = 96;
    var stride = Math.max(1, Math.ceil(total / MAXSTEPS));
    var steps = Math.ceil(total / stride);
    var delay = Math.max(25, Math.min(120, Math.round(2800 / steps)));
    svTitle.textContent = stride === 1
      ? "بيجرّب كل التركيبات الممكنة واحدة واحدة…"
      : "بيستعرض عينة من " + fmt(total) + " تركيبة — والمحرك بيحسمها كلها في الآخر…";
    var bestProfit = -1, tried = 0, prevMask = -1, mask = 0;
    function stepFn() {
      mask += stride;
      if (mask > total) { finish(); return; }
      tried++;
      var cost = 0, hrs = 0, prof = 0;
      for (var i = 0; i < n; i++) {
        var on = (mask >> i) & 1;
        if (on) { cost += items[i].cost; hrs += items[i].hours; prof += items[i].profit; }
        chipEls[i].classList.toggle("in", !!on);
        chipEls[i].classList.toggle("out", !on);
        if (prevMask >= 0 && (((mask ^ prevMask) >> i) & 1)) {
          chipEls[i].classList.add("flip");
          (function (el) { setTimeout(function () { el.classList.remove("flip"); }, 160); })(chipEls[i]);
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
      svCount.textContent = tried + " / " + (stride === 1 ? fmt(total) : steps) + " تركيبة";
      svProg.style.width = Math.min(100, (tried / steps) * 100) + "%";
      var over = cost > budget || hrs > hours;
      if (!over) {
        if (prof > bestProfit) {
          bestProfit = prof;
          svBest.textContent = fmt(prof);
          svBestBox.classList.remove("bump"); void svBestBox.offsetWidth; svBestBox.classList.add("bump");
          svMsg.className = "sv-msg good";
          svMsg.textContent = "✓ دي أحسن تشكيلة لحد دلوقتي — " + fmt(prof) + " جنيه";
          neonBurst(neon, mask);
        }
      } else {
        svMsg.className = "sv-msg bad";
        svMsg.textContent = "✗ التركيبة دي خارج القيود — " + (cost > budget ? "الفلوس مش مكفية" : "الوقت مش مكفي");
      }
      setTimeout(stepFn, delay);
    }
    function finish() {
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
    setTimeout(stepFn, 350);
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

  document.getElementById("addRow").addEventListener("click", function () { addRow(null); saveState(); });
  document.getElementById("resetBtn").addEventListener("click", function () {
    var t = TEMPLATES[currentTemplate];
    renderState({ template: currentTemplate, budget: t.budget, hours: t.hours, items: JSON.parse(JSON.stringify(t.items)) });
    saveState();
    lastExplain = null;
    document.getElementById("verdict").textContent = "اضغط «احسب القرار الأمثل»";
    document.body.dataset.solved = "";
    statusEl.textContent = "رجعنا للقالب الأصلي.";
  });
  budgetEl.addEventListener("input", function () { saveState(); maybeResolve(); });
  hoursEl.addEventListener("input", function () { saveState(); maybeResolve(); });
  solveBtn.addEventListener("click", solveLive);
  document.getElementById("saveScn").addEventListener("click", saveCurrentScenario);
  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () { showStep(Number(b.dataset.go)); });
  });
  document.querySelectorAll("#stepper button").forEach(function (b) {
    b.addEventListener("click", function () { showStep(Number(b.dataset.step)); });
  });

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

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
