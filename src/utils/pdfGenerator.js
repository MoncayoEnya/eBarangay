// src/utils/pdfGenerator.js
// PDF Generator — browser print with QR code support
// For real QR: npm install qrcode  then swap generateQR() below

// ── QR generation ──────────────────────────────────────────────────────────────
// Tries to use the qrcode npm package if installed, otherwise falls back to a
// Google Charts API URL (works offline-first with browser cache).
const generateQRDataURL = async (text) => {
  try {
    // If qrcode is installed: npm install qrcode
    const QRCode = await import('qrcode').catch(() => null);
    if (QRCode) {
      return await QRCode.default.toDataURL(text, { width: 120, margin: 1 });
    }
  } catch (_) {}
  // Fallback: Google Charts (requires internet)
  return `https://chart.googleapis.com/chart?chs=120x120&cht=qr&chl=${encodeURIComponent(text)}&choe=UTF-8`;
};

// ── Build QR value string ──────────────────────────────────────────────────────
const buildQRValue = (doc) =>
  `BRGY:${doc.requestId || ''}|TYPE:${doc.documentType || ''}|CTRL:${doc.document?.controlNumber || ''}|DATE:${new Date().toISOString().split('T')[0]}`;

// ── Main export ────────────────────────────────────────────────────────────────
export const generateDocumentPDF = async (doc) => {
  const today = new Date().toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Get QR data URL (async)
  const qrValue    = buildQRValue(doc);
  const qrDataURL  = await generateQRDataURL(qrValue);

  // Barangay name — pull from localStorage if set via Settings, else default
  const brgyName   = localStorage.getItem('brgy_name')   || 'BARANGAY MANAGEMENT SYSTEM';
  const brgyMunicipality = localStorage.getItem('brgy_municipality') || 'Municipality, Province';
  const captainName = localStorage.getItem('brgy_captain') || 'HON. BARANGAY CAPTAIN';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${doc.documentType} — ${doc.requester?.name}</title>
<style>
  @page { margin: 1in; size: letter; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; margin: 0; }

  .header { text-align: center; margin-bottom: 24px; border-bottom: 3px double #000; padding-bottom: 14px; position: relative; }
  .header-inner { display: flex; align-items: center; justify-content: center; gap: 16px; }
  .header-logo { width: 70px; height: 70px; }
  .header-text { text-align: center; }
  .republic   { font-size: 10pt; margin-bottom: 3px; }
  .brgy-name  { font-size: 15pt; font-weight: bold; text-transform: uppercase; margin: 4px 0; }
  .municipality { font-size: 10.5pt; margin-bottom: 3px; }
  .office     { font-size: 10pt; font-style: italic; }

  .doc-title  { text-align: center; margin: 22px 0 8px; }
  .doc-title h2 { font-size: 14pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; letter-spacing: 2px; margin: 0; }

  .control-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .control-text { font-size: 10pt; text-align: right; }

  .body { text-align: justify; line-height: 2; margin-bottom: 20px; }
  .body p { margin: 0 0 10px; text-indent: 40px; }
  .body .no-indent { text-indent: 0; }
  .highlight { font-weight: bold; text-decoration: underline; }

  .validity { margin-top: 16px; font-size: 10pt; font-style: italic; text-align: center; color: #444; }

  .sig-section { margin-top: 48px; display: flex; justify-content: flex-end; }
  .sig-block   { text-align: center; min-width: 220px; }
  .sig-line    { border-top: 1px solid #000; padding-top: 6px; margin-top: 56px; font-weight: bold; text-transform: uppercase; font-size: 11pt; }
  .sig-title   { font-size: 10pt; }

  .qr-section  { margin-top: 20px; display: flex; justify-content: flex-end; }
  .qr-block    { text-align: center; }
  .qr-block img { width: 90px; height: 90px; display: block; margin: 0 auto; }
  .qr-block p  { font-size: 8pt; color: #666; margin: 4px 0 0; }

  .footer { margin-top: 28px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 9pt; color: #666; display: flex; justify-content: space-between; }

  @media print { button { display: none !important; } }
</style>
</head>
<body>

<div class="header">
  <div class="header-inner">
    <div class="header-text">
      <div class="republic">Republic of the Philippines</div>
      <div class="brgy-name">${brgyName}</div>
      <div class="municipality">${brgyMunicipality}</div>
      <div class="office">Office of the Punong Barangay</div>
    </div>
  </div>
</div>

<div class="doc-title">
  <h2>${doc.documentType?.toUpperCase()}</h2>
</div>

<div class="control-row">
  <div></div>
  <div class="control-text">
    Control No.: <strong>${doc.document?.controlNumber || 'PENDING'}</strong><br/>
    Series of ${new Date().getFullYear()}
  </div>
</div>

<div class="body">
  <p class="no-indent">TO WHOM IT MAY CONCERN:</p>
  <p>This is to certify that <span class="highlight">${doc.requester?.name?.toUpperCase() || '_______________'}</span>,
  of legal age, Filipino citizen, and a bona fide resident of this barangay, is personally known to me and to the members of this community.</p>

  ${doc.documentType === 'Barangay Clearance' ? `
  <p>This certification is issued to attest that the above-named person has no derogatory records in this barangay and is a person of good moral character and good standing in the community.</p>` : ''}

  ${doc.documentType === 'Certificate of Residency' ? `
  <p>This is to further certify that the above-named person is a resident of this barangay and has been residing here for a considerable period of time.</p>` : ''}

  ${doc.documentType === 'Certificate of Indigency' ? `
  <p>This is to further certify that the above-named person belongs to the indigent sector of this community and is in need of financial assistance.</p>` : ''}

  ${doc.documentType === 'Certificate of Good Moral Character' ? `
  <p>This is to further certify that the above-named person is of good moral character, a law-abiding citizen, and has no known criminal record or pending criminal case in this barangay.</p>` : ''}

  ${doc.documentType === 'Business Clearance' ? `
  <p>This is to further certify that the above-named person is authorized to operate a business within the jurisdiction of this barangay, having complied with all barangay requirements.</p>` : ''}

  <p>This certification is issued upon the request of the above-named person for
  <span class="highlight">${doc.purpose?.toUpperCase() || 'WHATEVER LEGAL PURPOSE IT MAY SERVE'}</span>
  and for no other purpose.</p>
  <p>Issued this <span class="highlight">${today}</span>.</p>
</div>

<div class="validity">This document is valid for six (6) months from the date of issuance.</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;">
  <div class="qr-block">
    <img src="${qrDataURL}" alt="QR Code" />
    <p>Scan to verify<br/>${doc.document?.controlNumber || doc.requestId || ''}</p>
  </div>
  <div class="sig-block">
    <div class="sig-line">${captainName}</div>
    <div class="sig-title">Punong Barangay</div>
  </div>
</div>

<div class="footer">
  <span>Request ID: ${doc.requestId || '—'} | Requester: ${doc.requester?.name || '—'}</span>
  <span>Generated: ${today}</span>
</div>

<script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};