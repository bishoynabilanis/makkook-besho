// مكوك بيشو — واجهة الصفحة
// كل حاجة قابلة للتعديل: الأجهزة (ضيف/امسح/عدّل أي خانة)، الأقسام، الميزانية، الساعات.
// وكل تعديل بيتخزن تلقائيًا على الجهاز (localStorage) فبيحتفظ بيه بعد القفل والفتح، حتى أوفلاين.
(function () {
  var STORE_KEY = "makkook-besho-state-v1";
  var DEFAULT_ITEMS = [
    { name: "غسالة (طرمبة)", category: "غسالات", cost: 600, profit: 900, hours: 3 },
    { name: "تلاجة (ريليه)", category: "تلاجات", cost: 450, profit: 500, hours: 2 },
    { name: "ميكروويف (ماجنترون)", category: "ميكروويف", cost: 700, profit: 800, hours: 2 },
    { name: "سخان (ثرموستات)", category: "سخانات", cost: 300, profit: 450, hours: 1 },
    { name: "بوردة تلفزيون", category: "تلفزيون", cost: 500, profit: 650, hours: 4 },
  ];
  var DEFAULTS = { budget: 1500, hours: 8, items: DEFAULT_ITEMS };
  var highs = null;
  var rowsEl = document.getElementById("rows");
  var solveBtn = document.getElementById("solveBtn");
  var statusEl = document.getElementById("status");
  var budgetEl = document.getElementById("budget");
  var hoursEl = document.getElementById("hours");

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
      inp.addEventListener("input", saveState);
      td.appendChild(inp);
      tr.appendChild(td);
    });
    var td = document.createElement("td");
    var del = document.createElement("button");
    del.type = "button"; del.className = "del"; del.textContent = "×"; del.title = "امسح الجهاز ده";
    del.addEventListener("click", function () { tr.remove(); saveState(); });
    td.appendChild(del);
    tr.appendChild(td);
    rowsEl.appendChild(tr);
  }

  function readItems() {
    var items = [];
    rowsEl.querySelectorAll("tr").forEach(function (tr) {
      var get = function (k) { return tr.querySelector('input[data-k="' + k + '"]').value; };
      items.push({
        name: get("name").trim() || "جهاز",
        category: get("category").trim(),
        cost: Number(get("cost")) || 0,
        profit: Number(get("profit")) || 0,
        hours: Number(get("hours")) || 0,
      });
    });
    return items;
  }

  // حفظ تلقائي على الجهاز
  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        budget: budgetEl.value, hours: hoursEl.value, items: readItems(),
      }));
    } catch (e) { /* مساحة مش متاحة — الصفحة تفضل شغالة عادي */ }
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !Array.isArray(s.items) || s.items.length === 0) return null;
      return s;
    } catch (e) { return null; }
  }
  function renderState(s) {
    budgetEl.value = s.budget;
    hoursEl.value = s.hours;
    rowsEl.innerHTML = "";
    s.items.forEach(addRow);
  }

  function fmt(n) { return Number(n.toFixed ? n.toFixed(2) : n).toLocaleString("en-US"); }
  function label(it) { return it.category ? it.name + " (" + it.category + ")" : it.name; }

  function solve() {
    var items = readItems();
    var budget = Number(budgetEl.value) || 0;
    var hours = Number(hoursEl.value) || 0;
    var ex;
    try { ex = MakkookModel.explain(highs, items, budget, hours); }
    catch (e) { statusEl.textContent = "في مشكلة في الأرقام: " + e.message; return; }
    var base = ex.base;
    var card = document.getElementById("resultCard");
    card.classList.remove("hidden");
    var verdict = document.getElementById("verdict");
    if (base.status !== "Optimal" || base.chosen.length === 0) {
      verdict.textContent = base.status !== "Optimal"
        ? "مفيش أي جهاز يدخل في القيود دي. جرّب تزوّد الميزانية أو الساعات."
        : "أحسن قرار: متصلّحش حاجة النهارده بالقيود دي.";
    } else {
      verdict.textContent = "صلّح: " + base.chosen.map(function (i) { return items[i].name; }).join(" + ");
    }
    document.getElementById("tProfit").textContent = fmt(base.profit) + " جنيه";
    document.getElementById("tCost").textContent = fmt(base.cost) + " من " + fmt(budget);
    document.getElementById("tHours").textContent = fmt(base.hoursUsed) + " من " + fmt(hours) + " ساعة";
    var why = [];
    if (base.status === "Optimal") {
      if (ex.moneyDelta > 0) why.push("لو زوّدت الميزانية 100 جنيه: الربح يزيد " + fmt(ex.moneyDelta) + " (يبقى " + fmt(ex.moneyPlan.profit) + ").");
      else why.push("لو زوّدت الميزانية 100 جنيه: الربح مش هيتغير.");
      if (ex.timeDelta > 0) why.push("لو وفّرت ساعة فني زيادة: الربح يزيد " + fmt(ex.timeDelta) + " (يبقى " + fmt(ex.timePlan.profit) + ").");
      else why.push("ساعة فني زيادة مش هتغير حاجة.");
      if (ex.moneyDelta > 0 && ex.timeDelta === 0) why.push("يعني اللي مقيّدك الفلوس، مش الوقت.");
      else if (ex.timeDelta > 0 && ex.moneyDelta === 0) why.push("يعني اللي مقيّدك الوقت، مش الفلوس.");
      else if (ex.timeDelta === 0 && ex.moneyDelta === 0) why.push("زيادة فلوس أو وقت لوحدهم مش هتفرق — القيد على الاتنين مع بعض.");
    }
    document.getElementById("why").innerHTML = why.join("<br>");
    var skipped = items.filter(function (_, i) { return base.chosen.indexOf(i) === -1; }).map(function (it) { return it.name; });
    document.getElementById("skipList").textContent = skipped.length ? "اللي مش هيتصلح النهارده: " + skipped.join("، ") : "";
    statusEl.textContent = "";
    document.body.dataset.solved = "1";
  }

  var saved = loadState();
  renderState(saved || DEFAULTS);
  if (!saved) saveState();

  document.getElementById("addRow").addEventListener("click", function () { addRow(null); saveState(); });
  document.getElementById("resetBtn").addEventListener("click", function () {
    renderState(DEFAULTS); saveState();
    document.getElementById("resultCard").classList.add("hidden");
    statusEl.textContent = "رجعنا للمثال الأصلي.";
  });
  budgetEl.addEventListener("input", saveState);
  hoursEl.addEventListener("input", saveState);
  solveBtn.addEventListener("click", solve);

  // تثبيت كتطبيق أوفلاين لما يتستضاف على رابط (مش من ملف محلي)
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  // تحميل المحرك من الذاكرة (مفيش أي تحميل من الشبكة)
  var bin = Uint8Array.from(atob(window.HIGHS_WASM_B64), function (c) { return c.charCodeAt(0); });
  window.HighsFactory({
    instantiateWasm: function (imports, done) {
      WebAssembly.instantiate(bin, imports).then(function (r) { done(r.instance, r.module); });
      return {};
    }
  }).then(function (h) {
    highs = h;
    solveBtn.disabled = false;
    statusEl.textContent = "المحرك جاهز. عدّل الأرقام براحتك واضغط الزرار.";
    if (location.search.indexOf("demo=1") !== -1) solve();
  }).catch(function (e) {
    statusEl.textContent = "محرك الحساب ما اتحمّلش: " + e;
  });
})();
