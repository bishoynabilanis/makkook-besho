/* مكوك بيشو — بناء نموذج القرار وحلّه (مشترك بين المتصفح واختبارات Node)
   المدخلات: قائمة أجهزة {name, cost, profit, hours} + ميزانية + ساعات متاحة
   المخرجات: أنهي أجهزة تتصلح عشان يبقى الربح أقصى ما يمكن في حدود القيود */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MakkookModel = api;
})(typeof self !== "undefined" ? self : this, function () {
  function num(x) {
    // رقم عادي من غير صيغة علمية
    if (Number.isInteger(x)) return String(x);
    return String(Number(x.toFixed(6)));
  }
  function terms(items, f) {
    const t = [];
    items.forEach((it, i) => {
      const v = f(it);
      if (v !== 0) t.push(num(v) + " x" + i);
    });
    return t.length ? t.join(" + ") : "0 x0";
  }
  function validate(items, budget, hours) {
    if (!Array.isArray(items) || items.length === 0) throw new Error("لازم جهاز واحد على الأقل");
    if (!(budget >= 0) || !(hours >= 0)) throw new Error("الميزانية والساعات لازم أرقام موجبة");
    items.forEach((it) => {
      if (!(it.cost >= 0) || !(it.profit >= 0) || !(it.hours >= 0))
        throw new Error("بيانات الجهاز «" + it.name + "» فيها رقم مش مظبوط");
    });
  }
  // نص المسألة بصيغة LP اللي HiGHS بيفهمها
  function buildLP(items, budget, hours) {
    validate(items, budget, hours);
    const vars = items.map((_, i) => "x" + i).join(" ");
    return [
      "Maximize",
      " obj: " + terms(items, (it) => it.profit),
      "Subject To",
      " budget: " + terms(items, (it) => it.cost) + " <= " + num(budget),
      " hours: " + terms(items, (it) => it.hours) + " <= " + num(hours),
      "Binary",
      " " + vars,
      "End",
      "",
    ].join("\n");
  }
  // حل المسألة. highs هنا هو المحرك الجاهز (instance)
  function solvePlan(highs, items, budget, hours) {
    const lp = buildLP(items, budget, hours);
    const res = highs.solve(lp);
    const status = res.Status;
    const chosen = [];
    if (status === "Optimal") {
      items.forEach((it, i) => {
        const col = res.Columns["x" + i];
        if (col && col.Primal > 0.5) chosen.push(i);
      });
    }
    const sum = (f) => chosen.reduce((s, i) => s + f(items[i]), 0);
    return {
      status: status,
      chosen: chosen,
      profit: sum((it) => it.profit),
      cost: sum((it) => it.cost),
      hoursUsed: sum((it) => it.hours),
      objectiveValue: status === "Optimal" ? res.ObjectiveValue : null,
    };
  }
  // شرح القرار: لو زوّدنا الميزانية 100 أو ساعة فني، الربح يتغير كام؟
  function explain(highs, items, budget, hours) {
    const base = solvePlan(highs, items, budget, hours);
    if (base.status !== "Optimal") return { base: base };
    const moreMoney = solvePlan(highs, items, budget + 100, hours);
    const moreTime = solvePlan(highs, items, budget, hours + 1);
    return {
      base: base,
      moneyDelta: moreMoney.profit - base.profit,
      moneyPlan: moreMoney,
      timeDelta: moreTime.profit - base.profit,
      timePlan: moreTime,
    };
  }
  return { buildLP: buildLP, solvePlan: solvePlan, explain: explain };
});
