export function hoursBetween(start, end) {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.round(((b - a) / 3600000) * 100) / 100;
}

export function calculatePayroll({ monthlySalary = 0, workingDays = 26, unpaidLeaveDays = 0, overtimeHours = 0, overtimeRate = 0, deductions = 0, bonus = 0 }) {
  const salary = Math.max(0, Number(monthlySalary) || 0);
  const days = Math.max(1, Number(workingDays) || 26);
  const leave = Math.max(0, Number(unpaidLeaveDays) || 0);
  const overtime = Math.max(0, Number(overtimeHours) || 0);
  const rate = Math.max(0, Number(overtimeRate) || 0);
  const deductionTotal = Math.max(0, Number(deductions) || 0);
  const bonusTotal = Math.max(0, Number(bonus) || 0);
  const dailyRate = salary / days;
  const unpaidDeduction = Math.min(salary, dailyRate * leave);
  const overtimePay = overtime * rate;
  const netPay = Math.max(0, salary - unpaidDeduction - deductionTotal + bonusTotal + overtimePay);
  return Object.fromEntries(Object.entries({ dailyRate, unpaidDeduction, overtimePay, deductions: deductionTotal, bonus: bonusTotal, netPay }).map(([k,v]) => [k, Math.round(v * 100) / 100]));
}

export function toCsv(rows) {
  const escape = value => {
    const s = String(value ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  if (!rows.length) return '';
  const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
  return [headers.map(escape).join(','), ...rows.map(row => headers.map(h => escape(row[h])).join(','))].join('\r\n');
}
