// مكوك الورشة — واجهة الصفحة
(function () {
  var DEFAULT_ITEMS = [
    { name: "غسالة (طرمبة)", cost: 600, profit: 900, hours: 3 },
    { name: "تلاجة (ريليه)", cost: 450, profit: 500, hours: 2 },
    { name: "ميكروويف (ماجنترون)", cost: 700, profit: 800, hours: 2 },
    { name: "سخان (ثرموستات)", cost: 300, profit: 450, hours: 1 },
    { name: "بوردة تلفزيون", cost: 500, profit: 650, hours: 4 },
  ];
  var highs = null;
  var rowsEl = document.getElementById("rows");
  var solveBtn = document.getElementById("solveBtn");
  var statusEl = document.getElementById("status");

  function addRow(item) {
    var tr = document.createElement("tr");
    ["name", "cost", "profit", "hours"].forEach(function (k) {
      var td = document.createElement("td");
      var inp = document.createElement("input");
      inp.dataset.k = k;
      if (k === "name") { inp.type = "text"; }
      else { inp.type = "number"; inp.min = "0"; }
      inp.value = item ? item[k] : (k === "name" ? "" : 0);
      td.appendChild(inp);
      tr.appendChild(td);
    });
    var td = document.createElement("td");
    var del = document.createElement("button");
    del.type = "button"; del.className = "del"; del.textContent = "×"; del.title = "امسح الجهاز ده";
    del.addEventListener("click", function () { tr.remove(); });
    td.appendChild(del);
    tr.appendChild(td);
    rowsEl.appendChild(tr);
  }

  function readItems() {
    var items = [];
    rowsEl.querySelectorAll("tr").forEach(function (tr) {
      var get = function (k) { return tr.querySelector('input[data-k="' + k + '"]').value; };
      var name = get("name").trim() || "جهاز";
      items.push({ name: name, cost: Number(get("cost")) || 0, profit: Number(get("profit")) || 0, hours: Number(get("hours")) || 0 });
    });
    return items;
  }

  function fmt(n) { return Number(n.toFixed ? n.toFixed(2) : n).toLocaleString("en-US"); }

  function solve() {
    var items = readItems();
    var budget = Number(document.getElementById("budget").value) || 0;
    var hours = Number(document.getElementById("hours").value) || 0;
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


  // تثبيت كتطبيق أوفلاين لما يتستضاف على رابط (مش من ملف محلي)
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  DEFAULT_ITEMS.forEach(addRow);
  document.getElementById("addRow").addEventListener("click", function () { addRow(null); });
  solveBtn.addEventListener("click", solve);

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
