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
    if (n === 3 && highs) solve();
    if (n === 4) renderWhy();
    window.scrollTo(0, 0);
  }

  // ---------- الحل ----------
  function fmt(n) { return Number(n.toFixed ? n.toFixed(2) : n).toLocaleString("en-US"); }
  function solve() {
    var items = readItems();
    var budget = Number(budgetEl.value) || 0;
    var hours = Number(hoursEl.value) || 0;
    var ex;
    try { ex = MakkookModel.explain(highs, items, budget, hours); }
    catch (e) { statusEl.textContent = "في مشكلة في الأرقام: " + e.message; return; }
    lastExplain = { ex: ex, items: items, budget: budget, hours: hours };
    var base = ex.base;
    var verdict = document.getElementById("verdict");
    if (base.status !== "Optimal" || base.chosen.length === 0) {
      verdict.textContent = base.status !== "Optimal"
        ? "مفيش أي بند يدخل في القيود دي. جرّب تزوّد الميزانية أو الساعات."
        : "أحسن قرار: متعملش حاجة النهارده بالقيود دي.";
    } else {
      verdict.textContent = "اختار: " + base.chosen.map(function (i) { return items[i].name; }).join(" + ");
    }
    document.getElementById("tProfit").textContent = fmt(base.profit) + " جنيه";
    document.getElementById("tCost").textContent = fmt(base.cost) + " من " + fmt(budget);
    document.getElementById("tHours").textContent = fmt(base.hoursUsed) + " من " + fmt(hours) + " ساعة";
    var skipped = items.filter(function (_, i) { return base.chosen.indexOf(i) === -1; }).map(function (it) { return it.name; });
    document.getElementById("skipList").textContent = skipped.length ? "اللي مش هيتعمل النهارده: " + skipped.join("، ") : "";
    statusEl.textContent = "";
    renderWhy();
    document.body.dataset.solved = "1";
  }
  function maybeResolve() {
    if (currentStep >= 3 && highs && document.body.dataset.solved === "1") solve();
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
  solveBtn.addEventListener("click", solve);
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
