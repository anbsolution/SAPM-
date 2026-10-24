import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePayroll, hoursBetween, toCsv } from '../payroll.js';

test('calculates fixed salary, unpaid leave, overtime, deductions and bonus', () => {
  const result = calculatePayroll({ monthlySalary: 26000, workingDays: 26, unpaidLeaveDays: 2, overtimeHours: 3, overtimeRate: 150, deductions: 500, bonus: 1000 });
  assert.equal(result.dailyRate, 1000);
  assert.equal(result.unpaidDeduction, 2000);
  assert.equal(result.overtimePay, 450);
  assert.equal(result.netPay, 24950);
});
test('prevents negative salary and deduction values', () => {
  const result = calculatePayroll({ monthlySalary: -1, unpaidLeaveDays: 100, overtimeHours: -5, deductions: -100, bonus: -3 });
  assert.equal(result.netPay, 0);
  assert.equal(result.overtimePay, 0);
});
test('supports invalid or reversed timestamps safely', () => {
  assert.equal(hoursBetween('bad', 'also bad'), 0);
  assert.equal(hoursBetween('2026-01-01T12:00:00Z', '2026-01-01T11:00:00Z'), 0);
  assert.equal(hoursBetween('2026-01-01T09:00:00Z', '2026-01-01T17:30:00Z'), 8.5);
});
test('CSV escapes commas, quotes and line breaks', () => {
  assert.equal(toCsv([{name:'A, B',note:'said "yes"'}]), 'name,note\r\n"A, B","said ""yes"""');
});
test('CSV returns empty string for no rows', () => assert.equal(toCsv([]), ''));
