import { calculatePayroll, hoursBetween, toCsv } from './payroll.js';

const KEY = 'anb-self-attendance-payroll-v1';
const defaults = { settings: { name: '', monthlySalary: 25000, workingDays: 26, dailyTargetHours: 8, overtimeRate: 150, monthlyDeductions: 0, monthlyBonus: 0, currency: 'INR' }, attendance: [], leaves: [] };
let state = loadState();
const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: state.settings.currency || 'INR', maximumFractionDigits: 0 }).format(value || 0);
const dateKey = date => { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const today = () => dateKey(new Date());
function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
const monthKey = () => today().slice(0,7);
let selectedMonth = monthKey();
function loadState() { try { const parsed = JSON.parse(localStorage.getItem(KEY) || 'null'); return parsed && parsed.settings && Array.isArray(parsed.attendance) ? { ...structuredClone(defaults), ...parsed, settings: { ...defaults.settings, ...parsed.settings } } : structuredClone(defaults); } catch { return structuredClone(defaults); } }
function save() { localStorage.setItem(KEY, JSON.stringify(state)); render(); }
function fmtTime(value) { return value ? new Date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'; }
function fmtDate(value) { return new Date(value + 'T12:00:00').toLocaleDateString([], {day:'numeric',month:'short'}); }
function currentRecord() { return state.attendance.find(r => r.checkIn && !r.checkOut) || state.attendance.find(r => r.date === today()); }
function duration(record) { return record?.checkIn && record?.checkOut ? hoursBetween(record.checkIn, record.checkOut) : record?.checkIn ? hoursBetween(record.checkIn, new Date().toISOString()) : 0; }
function monthlyRecords() { return state.attendance.filter(r => r.date.startsWith(selectedMonth)); }
function payroll() { const records = monthlyRecords(); const unpaid = state.leaves.filter(l => l.date.startsWith(selectedMonth) && l.type === 'unpaid').length; const hours = records.reduce((sum,r) => sum + Math.max(0, duration(r) - Number(state.settings.dailyTargetHours || 8)), 0); return calculatePayroll({ monthlySalary: state.settings.monthlySalary, workingDays: state.settings.workingDays, unpaidLeaveDays: unpaid, overtimeHours: hours, overtimeRate: state.settings.overtimeRate, deductions: state.settings.monthlyDeductions, bonus: state.settings.monthlyBonus }); }
function download(name, content, type) { const blob = new Blob([content], {type}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
function renderLeaveCalendar() {
  const [year, month] = selectedMonth.split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const monthLeaves = state.leaves.filter(l => l.date.startsWith(selectedMonth));
  $('paidLeaveCount').textContent = `${monthLeaves.filter(l => l.type === 'paid').length} days`;
  $('unpaidLeaveCount').textContent = `${monthLeaves.filter(l => l.type === 'unpaid').length} days`;
  const records = monthlyRecords();
  const overtime = records.reduce((sum, r) => sum + Math.max(0, duration(r) - Number(state.settings.dailyTargetHours || 8)), 0);
  $('overtimeHours').textContent = `${overtime.toFixed(1)} h`;
  $('overtimeHoursPay').textContent = `${overtime.toFixed(1)} h`;
  const names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let html = names.map(n => `<div class="calendar-weekday">${n}</div>`).join('');
  for (let i = 0; i < offset; i++) html += '<div class="calendar-day blank" aria-hidden="true"></div>';
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${selectedMonth}-${String(day).padStart(2,'0')}`;
    const leave = monthLeaves.find(l => l.date === key);
    const isToday = key === today();
    const cls = ['calendar-day', leave ? (leave.type === 'paid' ? 'paid-leave' : 'unpaid-leave') : '', isToday ? 'today' : ''].filter(Boolean).join(' ');
    const marker = leave ? `<span class="calendar-marker">${leave.type === 'paid' ? 'Paid' : 'Unpaid'}</span>` : '';
    html += `<div class="${cls}" aria-label="${key}${leave ? ', ' + leave.type + ' leave' : ''}"><b>${day}</b>${marker}</div>`;
  }
  $('leaveCalendar').innerHTML = html;
}
function render() {
  const rec = currentRecord(); const records = monthlyRecords(); const totalHours = records.reduce((s,r)=>s+duration(r),0); const pay = payroll();
  $('greeting').textContent = state.settings.name ? `Hello, ${state.settings.name}` : 'Your workday, at a glance';
  $('todayDate').textContent = new Date().toLocaleDateString([], {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  $('checkInBtn').disabled = Boolean(rec?.checkIn); $('checkOutBtn').disabled = !rec?.checkIn || Boolean(rec?.checkOut);
  $('statusPill').textContent = rec?.checkOut ? 'Day completed' : rec?.checkIn ? 'Currently checked in' : 'Not checked in';
  $('statusPill').className = `pill ${rec?.checkOut ? 'done' : rec?.checkIn ? 'active' : ''}`;
  $('checkInTime').textContent = fmtTime(rec?.checkIn); $('checkOutTime').textContent = fmtTime(rec?.checkOut);
  $('monthHours').textContent = `${totalHours.toFixed(1)} h`; $('daysCount').textContent = records.length; $('payMonth').textContent = selectedMonth; $('reportMonth').value = selectedMonth;
  renderLeaveCalendar(); $('salaryEstimate').textContent = money(pay.netPay); $('baseSalary').textContent = money(state.settings.monthlySalary); $('overtimePay').textContent = money(pay.overtimePay); $('leaveDeduction').textContent = `−${money(pay.unpaidDeduction)}`; $('deductions').textContent = `−${money(pay.deductions)}`;
  $('attendanceList').innerHTML = [...records].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8).map(r=>`<div class="history-row"><div class="date-badge"><b>${new Date(r.date+'T12:00:00').getDate()}</b><span>${new Date(r.date+'T12:00:00').toLocaleDateString([],{month:'short'})}</span></div><div class="history-main"><b>${fmtDate(r.date)}</b><span>${fmtTime(r.checkIn)} – ${fmtTime(r.checkOut)}</span></div><div class="history-hours">${duration(r).toFixed(1)}h</div></div>`).join('') || '<p class="empty">No attendance recorded this month. Check in to get started.</p>';
  $('leaveList').innerHTML = [...state.leaves].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(l=>`<div class="leave-row"><span>${fmtDate(l.date)}</span><span class="tag">${l.type === 'unpaid' ? 'Unpaid leave' : 'Paid leave'}</span></div>`).join('') || '<p class="empty">No leave entries yet.</p>';
  $('settingsName').value = state.settings.name; $('settingsSalary').value = state.settings.monthlySalary; $('settingsDays').value = state.settings.workingDays; $('settingsTarget').value = state.settings.dailyTargetHours; $('settingsOtRate').value = state.settings.overtimeRate; $('settingsDeductions').value = state.settings.monthlyDeductions; $('settingsBonus').value = state.settings.monthlyBonus;
}
$('checkInBtn').addEventListener('click',()=>{ if(currentRecord()?.checkIn) return; state.attendance.push({date:today(),checkIn:new Date().toISOString(),checkOut:null}); save(); });
$('checkOutBtn').addEventListener('click',()=>{ const rec=currentRecord(); if(!rec?.checkIn || rec.checkOut) return; const end=new Date(); if(end.getTime()<new Date(rec.checkIn).getTime()) return alert('Check-out time cannot be earlier than check-in.'); rec.checkOut=end.toISOString(); save(); });
$('settingsForm').addEventListener('submit',e=>{e.preventDefault(); state.settings={...state.settings,name:$('settingsName').value.trim(),monthlySalary:Number($('settingsSalary').value),workingDays:Number($('settingsDays').value),dailyTargetHours:Number($('settingsTarget').value),overtimeRate:Number($('settingsOtRate').value),monthlyDeductions:Number($('settingsDeductions').value),monthlyBonus:Number($('settingsBonus').value)}; save(); $('settingsDialog').close(); });
$('reportMonth').addEventListener('change', e => { if (/^\d{4}-\d{2}$/.test(e.target.value)) { selectedMonth = e.target.value; render(); } });
$('settingsBtn').addEventListener('click',()=>$('settingsDialog').showModal()); $('closeSettings').addEventListener('click',()=>$('settingsDialog').close());
$('addLeaveBtn').addEventListener('click',()=>{ const date=prompt('Leave date (YYYY-MM-DD)',today()); if(!date) return; if(!isValidDateKey(date)) return alert('Please enter a real calendar date as YYYY-MM-DD.'); if(state.leaves.some(l=>l.date===date)) return alert('A leave entry already exists for this date.'); const type=confirm('Press OK for paid leave, or Cancel for unpaid leave.')?'paid':'unpaid'; state.leaves.push({date,type}); save(); });
$('exportJsonBtn').addEventListener('click',()=>download(`attendance-backup-${today()}.json`,JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),...state},null,2),'application/json'));
$('importJsonInput').addEventListener('change',async e=>{const file=e.target.files?.[0]; if(!file)return; try {
  const incoming=JSON.parse(await file.text());
  const validSettings=incoming && incoming.settings && typeof incoming.settings==='object' && !Array.isArray(incoming.settings);
  const validAttendance=Array.isArray(incoming?.attendance) && incoming.attendance.every(r=>r && typeof r==='object' && isValidDateKey(r.date) && (r.checkIn===null || (typeof r.checkIn==='string' && Number.isFinite(Date.parse(r.checkIn)))) && (r.checkOut===null || (typeof r.checkOut==='string' && Number.isFinite(Date.parse(r.checkOut)))) && (!r.checkIn || !r.checkOut || Date.parse(r.checkOut)>=Date.parse(r.checkIn)));
  const validLeaves=Array.isArray(incoming?.leaves) && incoming.leaves.every(l=>l && typeof l==='object' && isValidDateKey(l.date) && ['paid','unpaid'].includes(l.type));
  if(!validSettings || !validAttendance || !validLeaves) throw new Error('Invalid backup format');
  if(!confirm('Import replaces the current data on this device. Export a backup first. Continue?')) return;
  state={...structuredClone(defaults),...incoming,settings:{...defaults.settings,...incoming.settings}};
  save(); alert('Backup imported on this device.');
} catch {alert('Could not import this file. Choose a valid app JSON backup. Your current records were not replaced.');} finally {e.target.value='';} });
$('exportCsvBtn').addEventListener('click',()=>{const rows=state.attendance.filter(r=>r.date.startsWith(selectedMonth)).map(r=>({date:r.date,check_in:r.checkIn,check_out:r.checkOut,worked_hours:duration(r).toFixed(2)})); download(`attendance-${selectedMonth}.csv`,toCsv(rows),'text/csv;charset=utf-8');});
$('exportPayrollBtn').addEventListener('click',()=>{const p=payroll(); const rows=[{month:selectedMonth,monthly_salary:state.settings.monthlySalary,unpaid_leave_deduction:p.unpaidDeduction,overtime_pay:p.overtimePay,other_deductions:p.deductions,bonus:p.bonus,estimated_net_pay:p.netPay}];download(`payroll-${selectedMonth}.csv`,toCsv(rows),'text/csv;charset=utf-8');});
$('clearDataBtn').addEventListener('click',()=>{if(confirm('Permanently clear attendance, leave and settings saved in this browser? Export a backup first.')){localStorage.removeItem(KEY);state=structuredClone(defaults);render();}});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();
