// reports.js 


const USER_NAMES = {
   1: "Naasina. Ankaiah",
   2: "Naasina. Vasu",
   3: "Naasina. Sampoornamma",
   4: "Gedde. Kondaiah",
   5: "కుట్టుబోయిన. వరలక్ష్మమ్మ",
   6: "వెలినేని. సుగుణమ్మ",
   7: "వడ్లమాని. రాఘవులు నాయుడు",
   8: "వెలినేని. రవణమ్మ",
   9: "వడ్లమాని. అల్లిబాబు",
   10: "వడ్లమాని. అనిల్",
   11: "వడ్లమాని. దొరసానమ్మ",
   12: "కాకుటూరి. నాగేశ్వరరావు",
   13: "చిట్టిబోయిన. వేంకటేశ్వర్లు",
   14: "చిట్టిబోయిన. మమత",
   15: "గిద్దలూరి. ప్రకాశ్",
   16: "కూనిశెట్టి. కళాధరరావు",
   17: "వడ్లమాని. బుజ్జయ్య",
   18: "N/A",
   19: "N/A",
   20: "N/A"
};

function getUserNameById(id) {
   const n = Number(id);
   return USER_NAMES[n] || "";
}

let rows = [];

// DOM refs
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const tableHead = document.getElementById('table-head');
const tableBody = document.getElementById('table-body');
const rowsCount = document.getElementById('rows-count');

const reportFromId = document.getElementById('report-from-id');
const reportToId = document.getElementById('report-to-id');
const reportFromDate = document.getElementById('report-from-date');
const reportToDate = document.getElementById('report-to-date');
const btnGenerateReport = document.getElementById('btn-generate-report');

// Formatting helpers
function fmtQty(n) {
   if (!isFinite(n)) return '';
   return (Math.round(n * 10) / 10).toFixed(1);
}

function fmtPct(n) {
   if (!isFinite(n)) return '';
   return (Math.round(n * 10) / 10).toFixed(1);
}

function fmtAmt(n) {
   if (!isFinite(n)) return '';
   return (Math.round(n * 100) / 100).toFixed(2);
}

function fmtAmtWithSep(n) {
   if (!isFinite(n)) return '';
   const s = (Math.round(n * 100) / 100).toFixed(2);
   const parts = s.split('.');
   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
   return parts.join('.');
}

function fmtFinalAmt(n) {
   if (!isFinite(n)) return '';
   const v = Math.round(n);
   return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// date helpers
function isoFromDate(d) {
   const yyyy = d.getFullYear(),
      mm = String(d.getMonth() + 1).padStart(2, '0'),
      dd = String(d.getDate()).padStart(2, '0');
   return `${yyyy}-${mm}-${dd}`;
}

function displayDateFromISO(iso) {
   if (!iso) return '';
   const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
   if (!m) return String(iso);
   const day = m[3],
      month = parseInt(m[2], 10);
   const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
   const monName = MONTH_SHORT[month - 1] || m[2];
   return `${day}-${monName}-${m[1].slice(-2)}`;
}

function parseDateToISO(value) {
   if (value instanceof Date && !isNaN(value)) return isoFromDate(value);
   if (typeof value === 'number') {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(epoch.getTime() + value * 24 * 60 * 60 * 1000);
      if (!isNaN(d)) return isoFromDate(d);
   }
   const s = String(value || '').trim();
   if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
   const parsed = Date.parse(s);
   if (!isNaN(parsed)) return isoFromDate(new Date(parsed));
   const m = s.match(/^(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2,4})$/);
   if (m) {
      let dd = Number(m[1]),
         mm = Number(m[2]),
         yy = Number(m[3]);
      if (yy < 100) yy += 2000;
      const d = new Date(yy, mm - 1, dd);
      if (!isNaN(d)) return isoFromDate(d);
   }
   return s;
}

// normalize session values
function normalizeSession(raw) {
   if (raw == null) return '';
   let s = String(raw).trim().toUpperCase().replace(/\s+/g, '');
   if (s === 'AM' || /^A\.?M\.?$/.test(s) || s === 'A') return 'AM';
   if (s === 'PM' || /^P\.?M\.?$/.test(s) || s === 'P') return 'PM';
   const n = Number(String(raw).replace(/\D/g, ''));
   if (n === 1) return 'AM';
   if (n === 2) return 'PM';
   if (s.includes('AM')) return 'AM';
   if (s.includes('PM')) return 'PM';
   return '';
}

// header mapping
function mapHeaders(headerRow) {
   const map = {};
   headerRow.forEach((h, idx) => {
      if (h == null) return;
      const key = String(h).trim().toLowerCase();
      if (!key) return;
      if (['date', 'day'].includes(key)) map[idx] = 'date';
      else if (['session', 'am/pm', 'am-pm', 'ampm', 'sessionid'].includes(key)) map[idx] = 'session';
      else if (['user id', 'userid', 'user_id', 'id', 'identifier', 'ident', 'no', 'number'].includes(key)) map[idx] = 'id';
      else if (['quantity', 'qty', 'q'].includes(key)) map[idx] = 'quantity';
      else if (['percentage', 'pct', 'percent', '%'].includes(key)) map[idx] = 'percentage';
      else if (['amount', 'amt', 'value', 'total'].includes(key)) map[idx] = 'amount';
      else {
         if (key.includes('date')) map[idx] = 'date';
         else if (key.includes('session')) map[idx] = 'session';
         else if (key.includes('user') && key.includes('id')) map[idx] = 'id';
         else if (key.includes('id')) map[idx] = 'id';
         else if (key.includes('qty') || key.includes('quant')) map[idx] = 'quantity';
         else if (key.includes('pct') || key.includes('percent') || key.includes('%')) map[idx] = 'percentage';
         else if (key.includes('amt') || key.includes('amount')) map[idx] = 'amount';
      }
   });
   return map;
}

// load workbook
function loadWorkbookFileToTable(file) {
   if (!file) return;
   const reader = new FileReader();
   reader.onload = (e) => {
      const data = e.target.result;
      let workbook;
      try {
         workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            dateNF: 'yyyy-mm-dd'
         });
      } catch (err) {
         alert('Failed to read file: ' + err);
         return;
      }
      const firstSheet = workbook.SheetNames[0];
      const ws = workbook.Sheets[firstSheet];
      if (!ws) {
         alert('No sheets found');
         return;
      }

      const aoa = XLSX.utils.sheet_to_json(ws, {
         header: 1,
         defval: null,
         raw: false,
         dateNF: 'yyyy-mm-dd'
      });
      if (aoa.length === 0) {
         alert('Sheet empty');
         return;
      }

      const header = aoa[0].map(h => h === null ? '' : String(h));
      let mapping = mapHeaders(header);
      if (!Object.values(mapping).includes('date') && aoa.length > 1 && aoa[0].length >= 4) {
         mapping = {
            0: 'date',
            1: 'session',
            2: 'id',
            3: 'quantity',
            4: 'percentage'
         };
         if (aoa[0].length >= 6) mapping[5] = 'amount';
      }

      const extracted = [];
      for (let r = 1; r < aoa.length; r++) {
         const row = aoa[r];
         if (!row || row.every(c => c === null || c === '')) continue;
         const obj = {};
         for (let c = 0; c < row.length; c++) {
            const field = mapping[c];
            if (!field) continue;
            const cell = row[c];
            if (field === 'date') obj.date = parseDateToISO(cell);
            else if (field === 'session') obj.session = cell == null ? '' : normalizeSession(cell);
            else if (field === 'id') {
               const n = (cell === null) ? null : Number(cell);
               obj.id = Number.isFinite(n) ? Math.trunc(n) : (cell !== null ? String(cell).trim() : null);
            } else if (field === 'quantity') {
               const n = (cell === null) ? null : Number(cell);
               obj.quantity = Number.isFinite(n) ? n : (cell !== null ? Number(String(cell).replace(/,/g, '')) : null);
            } else if (field === 'percentage') {
               const raw = cell;
               let n = null;
               if (raw !== null) {
                  const s = String(raw).replace('%', '').replace(/,/g, '').trim();
                  n = Number(s);
               }
               obj.percentage = Number.isFinite(n) ? n : null;
            } else if (field === 'amount') {
               const n = (cell === null) ? null : Number(cell);
               obj.amount = Number.isFinite(n) ? n : null;
            }
         }

         if ((obj.amount === null || obj.amount === undefined || obj.amount === '') && obj.quantity != null && obj.percentage != null) {
            const qn = Number(obj.quantity),
               pn = Number(obj.percentage);
            const amt = (isFinite(qn) && isFinite(pn)) ? Number((qn * pn * 7.5).toFixed(2)) : null;
            obj.amount = amt;
         }

         const idVal = Number(obj.id);
         extracted.push({
            date: obj.date || '',
            session: obj.session || '',
            id: Number.isFinite(idVal) ? Number(idVal) : obj.id,
            quantity: Number(obj.quantity) || 0,
            percentage: Number(obj.percentage) || 0,
            amount: Number(obj.amount) || 0
         });
      }

      rows = extracted;
      renderTable();
      fileInfo.textContent = `Loaded: ${file.name} — ${rows.length} row${rows.length===1?'':'s'}.`;
      fileInput.value = '';
   };
   reader.onerror = (err) => {
      alert('File read error: ' + err);
   };
   reader.readAsArrayBuffer(file);
}

function renderTable() {
   tableHead.innerHTML = '';
   tableBody.innerHTML = '';
   if (!rows || rows.length === 0) {
      rowsCount.textContent = '0 rows';
      return;
   }

   const headRow = document.createElement('tr');
   ['S.No', 'Date', 'Session', 'User ID', 'Quantity', 'Percentage', 'Amount'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      headRow.appendChild(th);
   });
   tableHead.appendChild(headRow);

   rows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      const tdSerial = document.createElement('td');
      tdSerial.textContent = idx + 1;
      tdSerial.setAttribute('data-label', 'S.No');
      tr.appendChild(tdSerial);
      const tdDate = document.createElement('td');
      tdDate.textContent = displayDateFromISO(r.date);
      tdDate.setAttribute('data-label', 'Date');
      tr.appendChild(tdDate);
      const tdSess = document.createElement('td');
      tdSess.textContent = r.session;
      tdSess.setAttribute('data-label', 'Session');
      tr.appendChild(tdSess);
      const tdId = document.createElement('td');
      tdId.textContent = r.id;
      tdId.setAttribute('data-label', 'User ID');
      tr.appendChild(tdId);
      const tdQty = document.createElement('td');
      tdQty.textContent = fmtQty(r.quantity);
      tdQty.setAttribute('data-label', 'Quantity');
      tr.appendChild(tdQty);
      const tdPct = document.createElement('td');
      tdPct.textContent = fmtPct(r.percentage);
      tdPct.setAttribute('data-label', 'Percentage');
      tr.appendChild(tdPct);
      const tdAmt = document.createElement('td');
      tdAmt.textContent = fmtAmtWithSep(r.amount);
      tdAmt.setAttribute('data-label', 'Amount');
      tr.appendChild(tdAmt);
      tableBody.appendChild(tr);
   });

   rowsCount.textContent = `${rows.length} row${rows.length===1?'':'s'}`;
}

// PDF generator using explicit widths and merged AM/PM header row
function generatePdfReport(data, filters) {
   if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF library not loaded.');
      return;
   }
   const {
      jsPDF
   } = window.jspdf;
   const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
   });

   const pageW = doc.internal.pageSize.getWidth();
   const pageH = doc.internal.pageSize.getHeight();
   const margin = 6;

   const cols = 2,
      rowsPerPage = 2,
      cardsPerPage = cols * rowsPerPage;
   const cardW = (pageW - margin * 2) / cols;
   const cardH = (pageH - margin * 2) / rowsPerPage;

   // group by ID
   const grouped = {};
   data.forEach(r => {
      const id = r.id;
      if (!grouped[id]) grouped[id] = [];
      grouped[id].push(r);
   });
   const ids = Object.keys(grouped).map(Number).sort((a, b) => a - b);

   ids.forEach((id, idx) => {
      if (idx > 0 && idx % cardsPerPage === 0) doc.addPage();
      const slot = idx % cardsPerPage;
      const col = slot % cols;
      const rowIdx = Math.floor(slot / cols);
      const x0 = margin + col * cardW;
      const y0 = margin + rowIdx * cardH;

      const idRows = grouped[id].slice();
      idRows.sort((a, b) => (a.date < b.date ? -1 : (a.date > b.date ? 1 : 0)));

      const datesMap = {};
      idRows.forEach(r => {
         const dt = r.date || '';
         if (!datesMap[dt]) datesMap[dt] = {
            AM: null,
            PM: null
         };
         const s = r.session === 'AM' ? 'AM' : (r.session === 'PM' ? 'PM' : '');
         if (s === 'AM' || s === 'PM') datesMap[dt][s] = r;
         else {
            if (!datesMap[dt].AM) datesMap[dt].AM = r;
            else if (!datesMap[dt].PM) datesMap[dt].PM = r;
         }
      });

      const dateKeys = Object.keys(datesMap).sort();
      drawCardWithExplicitCols(doc, x0, y0, cardW, cardH, id, dateKeys, datesMap, filters);
   });

   doc.save('report.pdf');
}

// drawCardWithExplicitCols() function
function drawCardWithExplicitCols(doc, x, y, w, h, id, dateKeys, datesMap, filters) {
   const pad = 4;
   // outer border
   doc.setLineWidth(0.9);
   doc.rect(x, y, w, h);
   doc.setLineWidth(0.2);

   // Layout: slightly reduced header box height
   const headerH = 18; // header (ID/From/To + name)
   const subHeaderH = 18; // reduced height for header boxes (was larger before)
   const footerH = 30;
   const tableTop = y + headerH + subHeaderH; // top of data rows
   const tableBottom = y + h - footerH;

   // Header (ID / From / To / Name)
   const name = getUserNameById(id) || '';
   const allDates = dateKeys.filter(Boolean);
   const minDate = filters.fromDate || (allDates[0] || '');
   const maxDate = filters.toDate || (allDates[allDates.length - 1] || '');

   doc.setFontSize(9);
   doc.setFont(undefined, 'normal');
   doc.text(`ID: ${id}`, x + pad, y + 6);
   if (minDate) doc.text(`From: ${displayDateFromISO(minDate)}`, x + w / 2, y + 6, {
      align: 'center'
   });
   if (maxDate) doc.text(`To: ${displayDateFromISO(maxDate)}`, x + w - pad, y + 6, {
      align: 'right'
   });

   doc.setFontSize(11);
   doc.text(name || '—', x + w / 2, y + 14, {
      align: 'center'
   });

   // thin separator after main header area
   doc.line(x, y + headerH, x + w, y + headerH);

   // explicit column widths (user provided)
   const innerX = x + pad;
   const innerW = w - pad * 2;

   const colDateW = 12;
   const colAMQtyW = 12;
   const colAMPctW = 12;
   const colAMAmtW = 15;
   const colPMQtyW = 12;
   const colPMPctW = 12;
   const colPMAmtW = 15;

   // scale if needed
   const totalExplicit = colDateW + colAMQtyW + colAMPctW + colAMAmtW + colPMQtyW + colPMPctW + colPMAmtW;
   let scale = 1;
   if (totalExplicit > innerW) scale = innerW / totalExplicit;
   const dW = (v) => v * scale;

   // compute cumulative X positions, rounded to avoid fractional stroke gaps
   const pos = [];
   let cur = innerX;
   pos.push(Number(cur.toFixed(2))); // left edge (innerX)
   cur += dW(colDateW);
   pos.push(Number(cur.toFixed(2))); // after DATE
   cur += dW(colAMQtyW);
   pos.push(Number(cur.toFixed(2))); // after AM Qty
   cur += dW(colAMPctW);
   pos.push(Number(cur.toFixed(2))); // after AM Pct
   cur += dW(colAMAmtW);
   pos.push(Number(cur.toFixed(2))); // after AM Amt
   cur += dW(colPMQtyW);
   pos.push(Number(cur.toFixed(2))); // after PM Qty
   cur += dW(colPMPctW);
   pos.push(Number(cur.toFixed(2))); // after PM Pct
   cur += dW(colPMAmtW);
   pos.push(Number(cur.toFixed(2))); // right edge

   // draw table outer rect for data area
   doc.setLineWidth(0.2);
   doc.rect(innerX, tableTop, innerW, tableBottom - tableTop);

   // draw vertical separators for data area
   doc.setLineWidth(0.35);
   for (let i = 1; i <= 6; i++) {
      const vx = pos[i];
      doc.line(vx, tableTop, vx, tableBottom);
   }
   doc.setLineWidth(0.2);

   // header area positions
   const hdrTop = y + headerH;
   const hdrSub = hdrTop + subHeaderH; // bottom of header area equals tableTop

   // draw horizontal delimiters for header area
   doc.line(innerX, hdrTop, innerX + innerW, hdrTop);
   doc.line(innerX, hdrSub, innerX + innerW, hdrSub);

   // ----- Draw boxed header cells (trimmed height) -----
   doc.setLineWidth(0.35);
   for (let i = 0; i < 7; i++) {
      const left = pos[i];
      const right = pos[i + 1];
      const width = right - left;
      // draw rectangle for header cell
      doc.rect(left, hdrTop, width, hdrSub - hdrTop);
   }
   doc.setLineWidth(0.2);

   // ----- Header text: bold and wrapped, centered in each header cell -----
   doc.setFontSize(7);
   doc.setFont(undefined, 'bold');

   // helper to draw wrapped, centered text in a rectangular header cell
   function drawWrappedCentered(text, left, right, top, bottom) {
      const boxW = right - left - 2; // small horizontal padding
      const lines = doc.splitTextToSize(String(text), boxW);
      const lineH = 3.2; // approximate line height in mm for fontsize 7
      const totalH = lines.length * lineH;
      const centerY = top + (bottom - top) / 2;
      // starting Y so block is vertically centered
      let startY = centerY - (totalH / 2) + (lineH - 1.2); // minor tweak for visual centering
      for (let i = 0; i < lines.length; i++) {
         doc.text(lines[i], left + (right - left) / 2, startY + i * lineH, {
            align: 'center'
         });
      }
   }

   // DATE
   drawWrappedCentered('DATE', pos[0], pos[1], hdrTop, hdrSub);

   // AM columns: Quantity, Percentage, Amount
   drawWrappedCentered('Quantity', pos[1], pos[2], hdrTop, hdrSub);
   drawWrappedCentered('Percentage', pos[2], pos[3], hdrTop, hdrSub);
   drawWrappedCentered('Amount', pos[3], pos[4], hdrTop, hdrSub);

   // PM columns
   drawWrappedCentered('Quantity', pos[4], pos[5], hdrTop, hdrSub);
   drawWrappedCentered('Percentage', pos[5], pos[6], hdrTop, hdrSub);
   drawWrappedCentered('Amount', pos[6], pos[7], hdrTop, hdrSub);

   // restore normal font for body
   doc.setFont(undefined, 'normal');

   // rows area (15 rows)
   const rowsToShow = 15;
   const usableH = tableBottom - tableTop;
   const rowH = usableH / rowsToShow;
   let cursorY = tableTop;
   let totalQty = 0;
   let totalAmt = 0;

   // right-edge positions for right-aligned text with small padding
   const padRight = 1.5;
   const qtyCenterAM = pos[1] + (pos[2] - pos[1]) / 2;
   const qtyCenterPM = pos[4] + (pos[5] - pos[4]) / 2;
   const pctRightAM = pos[2] + (pos[3] - pos[2]) - padRight;
   const amtRightAM = pos[3] + (pos[4] - pos[3]) - padRight;
   const pctRightPM = pos[5] + (pos[6] - pos[5]) - padRight;
   const amtRightPM = pos[6] + (pos[7] - pos[6]) - padRight;

   doc.setFontSize(7.5);
   for (let i = 0; i < rowsToShow; i++) {
      const key = dateKeys[i] || '';
      const midY = cursorY + rowH * 0.65;

      let dateLabel = '';
      if (key) {
         const mm = String(key).match(/^(\d{4})-(\d{2})-(\d{2})$/);
         dateLabel = mm ? String(Number(mm[3])) : displayDateFromISO(key);
      }
      doc.setFontSize(8);
      doc.text(dateLabel, pos[0] + (pos[1] - pos[0]) / 2, midY, {
         align: 'center'
      });

      const amObj = key ? datesMap[key].AM : null;
      const pmObj = key ? datesMap[key].PM : null;

      doc.setFontSize(7.5);
      if (amObj) {
         doc.text(fmtQty(amObj.quantity), qtyCenterAM, midY, {
            align: 'center'
         });
         doc.text(fmtPct(amObj.percentage), pctRightAM, midY, {
            align: 'right'
         });
         doc.text(fmtAmtWithSep(amObj.amount), amtRightAM, midY, {
            align: 'right'
         });
         totalQty += Number(amObj.quantity) || 0;
         totalAmt += Number(amObj.amount) || 0;
      }

      if (pmObj) {
         doc.text(fmtQty(pmObj.quantity), qtyCenterPM, midY, {
            align: 'center'
         });
         doc.text(fmtPct(pmObj.percentage), pctRightPM, midY, {
            align: 'right'
         });
         doc.text(fmtAmtWithSep(pmObj.amount), amtRightPM, midY, {
            align: 'right'
         });
         totalQty += Number(pmObj.quantity) || 0;
         totalAmt += Number(pmObj.amount) || 0;
      }

      // horizontal grid line
      cursorY += rowH;
      doc.line(innerX, cursorY, innerX + innerW, cursorY);
   }

   // ----- Footer totals with boxed border -----
   const footerTop = tableBottom;
   doc.setLineWidth(0.3);
   doc.line(x, footerTop, x + w, footerTop);

   doc.setFontSize(9);
   const leftX = x + pad + 2;
   const rightX = x + w - pad - 2;

   // ----- Footer totals aligned as per the requirement -----

   // compute a right margin area for alignment
   const totalsRight = x + w - pad - 4; // consistent right alignment anchor
   const totalsLeft = x + pad + 2;
   const totalsCenter = (totalsLeft + totalsRight) / 2;

   doc.setFontSize(9);
   doc.setFont(undefined, 'normal');

   // Advance / Loan
   doc.setTextColor(255, 0, 0);
   doc.text(`Advance or Loan amount: 0`, totalsLeft, footerTop + 5, {
      align: 'left'
   });
   doc.setTextColor(0, 0, 0);

   // Total Milk in liters
   doc.text(`Total Milk in liters: ${(Math.round(totalQty*10)/10).toFixed(1)}`, totalsRight, footerTop + 5, {
      align: 'right'
   });

   // Total Amount
   doc.text(`Total Amount: ${fmtAmtWithSep(totalAmt)}`, totalsRight, footerTop + 10, {
      align: 'right'
   });

   // Final Amount bold
   doc.setFontSize(15);
   doc.setFont(undefined, 'bold');
   doc.text(`Final Amount: ${fmtFinalAmt(totalAmt)}`, totalsCenter, footerTop + 20, {
      align: 'center'
   });

   doc.setFont(undefined, 'normal');

}

// Events
fileInput.addEventListener('change', (evt) => {
   const f = evt.target.files && evt.target.files[0];
   if (!f) return;
   loadWorkbookFileToTable(f);
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
   e.preventDefault();
   const f = e.dataTransfer.files && e.dataTransfer.files[0];
   if (f) loadWorkbookFileToTable(f);
});

btnGenerateReport.addEventListener('click', () => {
   if (!rows.length) {
      alert('No data loaded. Please upload a file first.');
      return;
   }

   const fromIdStr = reportFromId.value.trim();
   const toIdStr = reportToId.value.trim();
   const fromDate = reportFromDate.value;
   const toDate = reportToDate.value;

   const idMin = fromIdStr ? Number(fromIdStr) : null;
   const idMax = toIdStr ? Number(toIdStr) : null;

   if ((fromIdStr && isNaN(idMin)) || (toIdStr && isNaN(idMax))) {
      alert('From ID and To ID must be numbers.');
      return;
   }
   if (idMin !== null && idMax !== null && idMin > idMax) {
      alert('From ID cannot be greater than To ID.');
      return;
   }

   const dateMin = fromDate || '0000-01-01';
   const dateMax = toDate || '9999-12-31';
   if (fromDate && toDate && dateMin > dateMax) {
      alert('From Date cannot be after To Date.');
      return;
   }

   const filtered = rows.filter(r => {
      const idOk = (idMin === null && idMax === null) ?
         true :
         ((idMin === null || r.id >= idMin) && (idMax === null || r.id <= idMax));

      const dateOk = (!fromDate && !toDate) ?
         true :
         (r.date >= dateMin && r.date <= dateMax);

      return idOk && dateOk;
   });

   if (!filtered.length) {
      alert('No rows found for the selected filters.');
      return;
   }

   generatePdfReport(filtered, {
      idMin,
      idMax,
      fromDate,
      toDate
   });

   // reset filters
   reportFromId.value = '';
   reportToId.value = '';
   reportFromDate.value = '';
   reportToDate.value = '';
});

// initial render
renderTable();