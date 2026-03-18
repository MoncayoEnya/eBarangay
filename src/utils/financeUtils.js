// src/utils/financeUtils.js
// Receipt (OR) generation + Financial Statement PDF
// Uses browser window.open + print — same pattern as pdfGenerator.js

const getBrgyInfo = () => ({
  name:         localStorage.getItem('brgy_name')         || 'BARANGAY',
  municipality: localStorage.getItem('brgy_municipality') || 'Municipality, Province',
  captain:      localStorage.getItem('brgy_captain')      || 'HON. BARANGAY CAPTAIN',
  treasurer:    localStorage.getItem('brgy_treasurer')    || 'BARANGAY TREASURER',
});

// ─── OFFICIAL RECEIPT ─────────────────────────────────────────────────────────

export const generateOfficialReceipt = (txn) => {
  const brgy   = getBrgyInfo();
  const today  = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const orNum  = txn.reference || `OR-${Date.now()}`;
  const amount = Math.abs(txn.amount || 0);
  const amountWords = numberToWords(amount);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Official Receipt — ${orNum}</title>
<style>
  @page { margin: 0.75in; size: letter; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; margin: 0; }
  .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 16px; }
  .republic { font-size: 9pt; }
  .brgy-name { font-size: 15pt; font-weight: bold; text-transform: uppercase; margin: 4px 0; }
  .municipality { font-size: 10pt; }
  .doc-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; margin: 8px 0 4px; text-decoration: underline; }
  .or-box { border: 2px solid #000; display: inline-block; padding: 6px 20px; font-size: 11pt; font-weight: bold; margin-bottom: 16px; }
  .field-row { display: flex; align-items: flex-end; margin-bottom: 10px; gap: 8px; }
  .field-label { font-size: 10pt; white-space: nowrap; }
  .field-line { flex: 1; border-bottom: 1px solid #000; min-width: 80px; padding-bottom: 1px; font-size: 11pt; font-weight: bold; }
  .amount-box { border: 2px solid #000; padding: 14px 20px; margin: 18px 0; display: flex; justify-content: space-between; align-items: center; }
  .amount-label { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  .amount-value { font-size: 18pt; font-weight: bold; }
  .words-row { margin-bottom: 18px; font-size: 10.5pt; }
  .words-line { border-bottom: 1px solid #000; display: inline-block; min-width: 400px; font-style: italic; }
  .sig-section { display: flex; justify-content: space-between; margin-top: 40px; }
  .sig-block { text-align: center; width: 42%; }
  .sig-line { border-top: 1.5px solid #000; margin-top: 36px; padding-top: 4px; font-size: 10pt; font-weight: bold; text-transform: uppercase; }
  .sig-title { font-size: 9pt; font-style: italic; }
  .footer { text-align: center; margin-top: 24px; font-size: 9pt; color: #555; border-top: 1px solid #ccc; padding-top: 10px; }
  .copy-label { position: absolute; right: 0.75in; top: 0.75in; font-size: 9pt; border: 1px solid #999; padding: 2px 8px; color: #666; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
<div class="header">
  <div class="republic">Republic of the Philippines</div>
  <div class="brgy-name">${brgy.name}</div>
  <div class="municipality">${brgy.municipality}</div>
  <div class="doc-title">Official Receipt</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
  <div class="or-box">O.R. No.: &nbsp; ${orNum}</div>
  <div style="text-align:right;font-size:10pt;">
    <div>Date: <strong>${txn.date || today}</strong></div>
    <div style="margin-top:4px;">Fund: <strong>General Fund</strong></div>
  </div>
</div>

<div class="field-row">
  <span class="field-label">Received from:</span>
  <span class="field-line">${txn.paidBy || txn.description || ''}</span>
</div>
<div class="field-row">
  <span class="field-label">Address:</span>
  <span class="field-line">${brgy.municipality}</span>
</div>
<div class="field-row">
  <span class="field-label">In payment of:</span>
  <span class="field-line">${txn.description || ''}</span>
</div>
${txn.reference ? `<div class="field-row"><span class="field-label">Reference:</span><span class="field-line">${txn.reference}</span></div>` : ''}

<div class="amount-box">
  <div class="amount-label">Amount Received</div>
  <div class="amount-value">₱ ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
</div>

<div class="words-row">
  <span class="field-label">Amount in words: </span>
  <span class="words-line">${amountWords} Pesos only</span>
</div>

<div style="font-size:10pt;margin-bottom:8px;">
  <strong>Payment Method:</strong> &nbsp; ${txn.paymentMethod || 'Cash'}
  &nbsp;&nbsp;&nbsp;
  <strong>Status:</strong> &nbsp; ${txn.status || 'Paid'}
</div>

${txn.notes ? `<div style="font-size:10pt;margin-bottom:16px;"><strong>Notes:</strong> ${txn.notes}</div>` : ''}

<div class="sig-section">
  <div class="sig-block">
    <div class="sig-line">${brgy.treasurer}</div>
    <div class="sig-title">Barangay Treasurer</div>
  </div>
  <div class="sig-block">
    <div class="sig-line">Received by</div>
    <div class="sig-title">Signature over Printed Name</div>
  </div>
</div>

<div class="footer">
  This is an official receipt of ${brgy.name}, ${brgy.municipality}<br>
  Generated: ${today} &nbsp;|&nbsp; e-Barangay Financial System
</div>

<div class="no-print" style="text-align:center;margin-top:24px;">
  <button onclick="window.print()" style="padding:10px 28px;background:#2563EB;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-right:10px;">
    Print / Save PDF
  </button>
  <button onclick="window.close()" style="padding:10px 28px;background:#64748B;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">
    Close
  </button>
</div>

<script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
};

// ─── PAYSLIP ──────────────────────────────────────────────────────────────────

export const generatePayslip = (record, payrollRun) => {
  const brgy  = getBrgyInfo();
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  const fmtAmt = (n) => '₱ ' + Math.abs(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Payslip — ${record.fullName}</title>
<style>
  @page { margin: 0.75in; size: letter; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; margin: 0; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
  .brgy-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
  .doc-title { font-size: 12pt; font-weight: bold; letter-spacing: 2px; text-decoration: underline; margin-top: 4px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 14px; padding: 10px 14px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; }
  .info-item { font-size: 10pt; }
  .info-label { color: #666; font-size: 9pt; }
  .pay-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  .pay-table th { background: #1E3A8A; color: #fff; padding: 7px 10px; text-align: left; font-size: 10pt; }
  .pay-table td { padding: 6px 10px; font-size: 10pt; border-bottom: 1px solid #e5e7eb; }
  .pay-table tr:nth-child(even) td { background: #f8fafc; }
  .pay-table .total-row td { font-weight: bold; border-top: 2px solid #000; background: #f1f5f9; }
  .net-box { border: 2px solid #1E3A8A; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: #EFF6FF; border-radius: 6px; }
  .net-label { font-size: 12pt; font-weight: bold; color: #1E3A8A; }
  .net-value { font-size: 18pt; font-weight: bold; color: #1E3A8A; }
  .sig-row { display: flex; justify-content: space-between; margin-top: 32px; }
  .sig-block { text-align: center; width: 44%; }
  .sig-line { border-top: 1px solid #000; margin-top: 32px; padding-top: 4px; font-weight: bold; font-size: 10pt; text-transform: uppercase; }
  .sig-sub { font-size: 9pt; color: #555; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
<div class="header">
  <div class="brgy-name">${brgy.name}</div>
  <div style="font-size:9pt;">${brgy.municipality}</div>
  <div class="doc-title">Payslip</div>
  <div style="font-size:9pt;margin-top:3px;">Pay Period: ${payrollRun?.periodFrom || ''} — ${payrollRun?.periodTo || ''}</div>
</div>

<div class="info-grid">
  <div class="info-item"><div class="info-label">Employee Name</div><strong>${record.fullName}</strong></div>
  <div class="info-item"><div class="info-label">Employee No.</div><strong>${record.employeeNo || '—'}</strong></div>
  <div class="info-item"><div class="info-label">Position</div>${record.position || '—'}</div>
  <div class="info-item"><div class="info-label">Department</div>${record.department || '—'}</div>
  <div class="info-item"><div class="info-label">Payroll No.</div>${payrollRun?.payrollNumber || '—'}</div>
  <div class="info-item"><div class="info-label">Date Issued</div>${today}</div>
</div>

<table class="pay-table">
  <thead>
    <tr><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
    <tr>
      <th>Description</th><th style="text-align:right">Amount</th>
      <th>Description</th><th style="text-align:right">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Basic Salary</td><td style="text-align:right">${fmtAmt(record.basicSalary)}</td>
      <td>SSS</td><td style="text-align:right">${fmtAmt(record.deductions?.sss)}</td>
    </tr>
    <tr>
      <td>Rice Allowance</td><td style="text-align:right">${fmtAmt(record.allowances?.rice)}</td>
      <td>PhilHealth</td><td style="text-align:right">${fmtAmt(record.deductions?.philhealth)}</td>
    </tr>
    <tr>
      <td>Clothing Allowance</td><td style="text-align:right">${fmtAmt(record.allowances?.clothing)}</td>
      <td>Pag-IBIG</td><td style="text-align:right">${fmtAmt(record.deductions?.pagibig)}</td>
    </tr>
    <tr>
      <td>Medical Allowance</td><td style="text-align:right">${fmtAmt(record.allowances?.medical)}</td>
      <td>Withholding Tax</td><td style="text-align:right">${fmtAmt(record.deductions?.tax)}</td>
    </tr>
    <tr>
      <td>Other Allowances</td><td style="text-align:right">${fmtAmt(record.allowances?.other)}</td>
      <td>Other Deductions</td><td style="text-align:right">${fmtAmt(record.deductions?.other)}</td>
    </tr>
    <tr class="total-row">
      <td>Gross Pay</td><td style="text-align:right">${fmtAmt(record.grossPay)}</td>
      <td>Total Deductions</td><td style="text-align:right">${fmtAmt(record.deductions?.total)}</td>
    </tr>
  </tbody>
</table>

<div class="net-box">
  <div class="net-label">NET PAY</div>
  <div class="net-value">${fmtAmt(record.netPay)}</div>
</div>

<div class="sig-row">
  <div class="sig-block">
    <div class="sig-line">${brgy.treasurer}</div>
    <div class="sig-sub">Barangay Treasurer</div>
  </div>
  <div class="sig-block">
    <div class="sig-line">${record.fullName}</div>
    <div class="sig-sub">Employee Signature & Date</div>
  </div>
</div>

<div class="no-print" style="text-align:center;margin-top:24px;">
  <button onclick="window.print()" style="padding:10px 28px;background:#1E3A8A;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-right:10px;">
    Print / Save PDF
  </button>
  <button onclick="window.close()" style="padding:10px 28px;background:#64748B;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">
    Close
  </button>
</div>

<script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
};

// ─── FINANCIAL STATEMENT ──────────────────────────────────────────────────────

export const generateFinancialStatement = (transactions, budgetItems, period = 'Annual') => {
  const brgy  = getBrgyInfo();
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const year  = new Date().getFullYear();

  const revenues  = transactions.filter(t => t.type === 'income');
  const expenses  = transactions.filter(t => t.type === 'expense' && t.category !== 'Payroll');
  const payrolls  = transactions.filter(t => t.category === 'Payroll');

  const totalRevenue  = revenues.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalExpense  = expenses.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalPayroll  = payrolls.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalExp      = totalExpense + totalPayroll;
  const netIncome     = totalRevenue - totalExp;
  const fmtAmt = (n) => '₱ ' + Math.abs(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });

  // Group revenues by description
  const revGroups = {};
  revenues.forEach(t => {
    const key = t.description || 'Other Revenue';
    revGroups[key] = (revGroups[key] || 0) + Math.abs(t.amount || 0);
  });

  // Group expenses
  const expGroups = {};
  expenses.forEach(t => {
    const key = t.description || 'Other Expense';
    expGroups[key] = (expGroups[key] || 0) + Math.abs(t.amount || 0);
  });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Financial Statement ${year}</title>
<style>
  @page { margin: 0.75in; size: letter; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 10.5pt; color: #000; margin: 0; }
  .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 16px; }
  .brgy-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
  .doc-title { font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; }
  .period { font-size: 10pt; margin-top: 4px; }
  .stmt-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .stmt-table td { padding: 5px 10px; }
  .section-head td { background: #1E3A8A; color: #fff; font-weight: bold; font-size: 11pt; padding: 8px 10px; }
  .subtotal-row td { border-top: 1px solid #ccc; font-weight: bold; background: #f1f5f9; }
  .total-row td { border-top: 3px double #000; font-size: 12pt; font-weight: bold; }
  .net-row td { background: ${netIncome >= 0 ? '#ECFDF5' : '#FEF2F2'}; font-size: 13pt; font-weight: bold; color: ${netIncome >= 0 ? '#065F46' : '#991B1B'}; border: 2px solid ${netIncome >= 0 ? '#A7F3D0' : '#FECACA'}; }
  .indent { padding-left: 28px !important; }
  .amount-col { text-align: right; width: 140px; }
  .budget-section { margin-top: 20px; }
  .budget-table { width: 100%; border-collapse: collapse; }
  .budget-table th { background: #374151; color: #fff; padding: 7px 10px; text-align: left; font-size: 10pt; }
  .budget-table td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
  .bar-cell { width: 120px; }
  .bar-outer { height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; }
  .sig-row { display: flex; justify-content: space-between; margin-top: 40px; }
  .sig-block { text-align: center; width: 44%; }
  .sig-line { border-top: 1.5px solid #000; margin-top: 36px; padding-top: 4px; font-weight: bold; font-size: 10pt; text-transform: uppercase; }
  .sig-sub { font-size: 9pt; color: #555; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
<div class="header">
  <div class="brgy-name">${brgy.name}</div>
  <div style="font-size:9.5pt;">${brgy.municipality}</div>
  <div class="doc-title">Statement of Income & Expenditure</div>
  <div class="period">${period} — Fiscal Year ${year}</div>
  <div style="font-size:9pt;margin-top:3px;">As of ${today}</div>
</div>

<!-- INCOME STATEMENT -->
<table class="stmt-table">
  <tr class="section-head"><td colspan="2">I. REVENUES</td></tr>
  ${Object.entries(revGroups).map(([desc, amt]) => `
  <tr><td class="indent">${desc}</td><td class="amount-col">${fmtAmt(amt)}</td></tr>`).join('')}
  <tr class="subtotal-row">
    <td>Total Revenues</td>
    <td class="amount-col">${fmtAmt(totalRevenue)}</td>
  </tr>

  <tr><td colspan="2" style="padding:6px 0;"></td></tr>
  <tr class="section-head"><td colspan="2">II. EXPENDITURES</td></tr>
  ${Object.entries(expGroups).map(([desc, amt]) => `
  <tr><td class="indent">${desc}</td><td class="amount-col">${fmtAmt(amt)}</td></tr>`).join('')}
  ${totalPayroll > 0 ? `<tr><td class="indent">Personnel Services (Payroll)</td><td class="amount-col">${fmtAmt(totalPayroll)}</td></tr>` : ''}
  <tr class="subtotal-row">
    <td>Total Expenditures</td>
    <td class="amount-col">${fmtAmt(totalExp)}</td>
  </tr>

  <tr><td colspan="2" style="padding:6px 0;"></td></tr>
  <tr class="net-row">
    <td>${netIncome >= 0 ? 'NET SURPLUS (Revenue Over Expenditure)' : 'NET DEFICIT (Expenditure Over Revenue)'}</td>
    <td class="amount-col">${fmtAmt(netIncome)}</td>
  </tr>
</table>

${budgetItems.length > 0 ? `
<div class="budget-section">
  <div style="font-size:12pt;font-weight:bold;margin-bottom:8px;border-bottom:2px solid #000;padding-bottom:6px;">III. BUDGET UTILIZATION</div>
  <table class="budget-table">
    <thead>
      <tr>
        <th>Budget Item</th>
        <th style="text-align:right">Allocated</th>
        <th style="text-align:right">Spent</th>
        <th style="text-align:right">Balance</th>
        <th>Utilization</th>
        <th style="text-align:right">Year</th>
      </tr>
    </thead>
    <tbody>
      ${budgetItems.map(b => {
        const pct = b.total > 0 ? Math.min(100, Math.round((b.spent / b.total) * 100)) : 0;
        const color = pct >= 90 ? '#EF4444' : pct >= 75 ? '#F59E0B' : '#10B981';
        const balance = (b.total || 0) - (b.spent || 0);
        return `<tr>
          <td>${b.label}</td>
          <td style="text-align:right">${fmtAmt(b.total)}</td>
          <td style="text-align:right">${fmtAmt(b.spent)}</td>
          <td style="text-align:right;color:${balance >= 0 ? '#065F46' : '#991B1B'}">${fmtAmt(balance)}</td>
          <td class="bar-cell">
            <div class="bar-outer"><div style="height:100%;width:${pct}%;background:${color};border-radius:4px;"></div></div>
            <div style="font-size:8pt;text-align:right;margin-top:2px;">${pct}%</div>
          </td>
          <td style="text-align:right">${b.year}</td>
        </tr>`;
      }).join('')}
      <tr style="font-weight:bold;border-top:2px solid #000;background:#f1f5f9;">
        <td>TOTAL</td>
        <td style="text-align:right">${fmtAmt(budgetItems.reduce((s,b) => s+(b.total||0), 0))}</td>
        <td style="text-align:right">${fmtAmt(budgetItems.reduce((s,b) => s+(b.spent||0), 0))}</td>
        <td style="text-align:right">${fmtAmt(budgetItems.reduce((s,b) => s+(b.total||0)-(b.spent||0), 0))}</td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>
</div>` : ''}

<div class="sig-row">
  <div class="sig-block">
    <div class="sig-line">${brgy.captain}</div>
    <div class="sig-sub">Punong Barangay</div>
  </div>
  <div class="sig-block">
    <div class="sig-line">${brgy.treasurer}</div>
    <div class="sig-sub">Barangay Treasurer</div>
  </div>
</div>

<div style="text-align:center;margin-top:20px;font-size:8.5pt;color:#666;border-top:1px solid #ccc;padding-top:8px;">
  Prepared by e-Barangay Financial System &nbsp;|&nbsp; ${today}<br>
  This document is computer-generated and is valid without signature for internal reference only.
</div>

<div class="no-print" style="text-align:center;margin-top:24px;">
  <button onclick="window.print()" style="padding:10px 28px;background:#1E3A8A;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-right:10px;">
    Print / Save PDF
  </button>
  <button onclick="window.close()" style="padding:10px 28px;background:#64748B;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">
    Close
  </button>
</div>

<script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function numberToWords(n) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (n === 0) return 'Zero';
  const num = Math.floor(n);

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
    return convert(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 ? ' ' + convert(n % 1000000000) : '');
  }
  return convert(num);
}

export default { generateOfficialReceipt, generatePayslip, generateFinancialStatement };
