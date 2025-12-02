//--------------------------
// ++++++ reports.js +++++++
//--------------------------

/**
 * USER ID -> NAME mapping
 * Use getUserNameById(id) to safely lookup a name (returns empty string if not found).
 */
const USER_NAMES = {
   1: "Naasina. Ankaiah",
   2: "Naasina. Vasu",
   3: "Naasina. Sampoornamma",
   4: "Gedde. Kondaiah",
   5: "Kuttuboyina. Varalakshmamma",
   6: "Velineni. Sugunamma",
   7: "Vadlamani. Raghavulu Naidu",
   8: "Velineni. Ravanamma",
   9: "Vadlamani. Alli Babu",
   10: "Vadlamani. Anil",
   11: "Vadlamani. Dorasanamma",
   12: "Kakuturi. Nageswara Rao",
   13: "Chittiboyina. Venkateswarlu",
   14: "Chittiboyina. Mamatha",
   15: "Giddaluri. Prakash",
   16: "Koonisetty. Kaladhara Rao",
   17: "Vadlamani. Bujjaiah",
   18: "N/A",
   19: "N/A",
   20: "N/A"
};

/**
 * getUserNameById
 * ----------------
 * Safe lookup for USER_NAMES. Converts id to Number and returns mapped name or empty string.
 *
 * @param {number|string} id - user id (number or numeric string)
 * @returns {string} - user name or empty string
 */
function getUserNameById(id) {
   const n = Number(id);
   return USER_NAMES[n] || "";
}

/* -------------------------
   Application data
   ------------------------- */
let rows = [];

/* -------------------------
   DOM references
   ------------------------- */
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

/* ------------ Formatting helpers ------------- */

/**
 * fmtQty
 * Format a quantity to 1 decimal place (returns empty string for invalid input).
 */
function fmtQty(n) {
   if (!isFinite(n)) return '';
   return (Math.round(n * 10) / 10).toFixed(1);
}

/**
 * fmtPct
 * Format a percentage to 1 decimal place (returns empty string for invalid input).
 */
function fmtPct(n) {
   if (!isFinite(n)) return '';
   return (Math.round(n * 10) / 10).toFixed(1);
}

/**
 * fmtAmt
 * Format an amount to 2 decimal places (returns empty string for invalid input).
 */
function fmtAmt(n) {
   if (!isFinite(n)) return '';
   return (Math.round(n * 100) / 100).toFixed(2);
}

/**
 * fmtAmtWithSep
 * Format amount with thousands separators and two decimal places.
 */
function fmtAmtWithSep(n) {
   if (!isFinite(n)) return '';
   const s = (Math.round(n * 100) / 100).toFixed(2);
   const parts = s.split('.');
   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
   return parts.join('.');
}

/**
 * fmtFinalAmt
 * Round to nearest integer and add thousands separator (used for final display).
 */
function fmtFinalAmt(n) {
   if (!isFinite(n)) return '';
   const v = Math.round(n);
   return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* ------------ Date helpers ------------- */

/**
 * isoFromDate
 * Convert Date object to yyyy-mm-dd string.
 */
function isoFromDate(d) {
   const yyyy = d.getFullYear();
   const mm = String(d.getMonth() + 1).padStart(2, '0');
   const dd = String(d.getDate()).padStart(2, '0');
   return `${yyyy}-${mm}-${dd}`;
}

/**
 * displayDateFromISO
 * Convert ISO yyyy-mm-dd to human short format dd-Mon-yy (e.g. 01-Nov-25).
 * If input doesn't match ISO pattern, returns the input as string.
 */
function displayDateFromISO(iso) {
   if (!iso) return '';
   const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
   if (!m) return String(iso);
   const day = m[3];
   const month = parseInt(m[2], 10);
   const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
   const monName = MONTH_SHORT[month - 1] || m[2];
   return `${day}-${monName}-${m[1].slice(-2)}`;
}

/**
 * parseDateToISO
 * Accepts Date, Excel serial (number), or common date string formats and returns yyyy-mm-dd.
 * If parsing fails, returns the original string.
 */
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

/* ------------ Session normalization ------------- */

/**
 * normalizeSession
 * Normalize various session representations (e.g., 'am', 'A.M.', '1') to either 'AM' or 'PM'.
 * Returns empty string if not recognizable.
 */
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

/* ----------- Header mapping ----------- */

/**
 * mapHeaders
 * Map header row strings (from sheet) to internal field names.
 * Returns an object mapping columnIndex -> fieldName.
 */
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

/* ------------- Load workbook -> rows[] -------------
   Reads an uploaded Excel file (SheetJS/XLSX required),
   maps headers, parses rows and normalizes values into `rows[]`.
*/
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
            const qn = Number(obj.quantity);
            const pn = Number(obj.percentage);
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
      fileInfo.textContent = `Loaded: ${file.name} — ${rows.length} row${rows.length === 1 ? '' : 's'}.`;
      fileInput.value = '';
   };

   reader.onerror = (err) => {
      alert('File read error: ' + err);
   };

   reader.readAsArrayBuffer(file);
}

/* ------------ Render HTML preview table -------------
   Builds the table header and body from `rows[]` for preview in the page.
*/
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

   rowsCount.textContent = `${rows.length} row${rows.length === 1 ? '' : 's'}`;
}

/* -------------- PDF generator -------------
   generatePdfReport(data, filters)
   - data: array of rows (grouped by id inside function)
   - filters: optional object { idMin, idMax, fromDate, toDate }
   Renders 2x2 cards per page, draws tiled cards and then adds dotted cut guides on every page.
*/
function generatePdfReport(data, filters) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF library not loaded.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 6;

  // spacing between cards (adjust as needed)
  const gapX = 6; // horizontal gap between cards
  const gapY = 6; // vertical gap between cards

  const cols = 2;
  const rowsPerPage = 2;
  const cardsPerPage = cols * rowsPerPage;

  // card size reduced to account for gaps
  const cardW = ((pageW - margin * 2) - gapX) / cols;
  const cardH = ((pageH - margin * 2) - gapY) / rowsPerPage;

  // group rows by ID
  const grouped = {};
  data.forEach(r => {
    const id = r.id;
    if (!grouped[id]) grouped[id] = [];
    grouped[id].push(r);
  });

  const ids = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  // render cards (may add pages)
  ids.forEach((id, idx) => {
    if (idx > 0 && idx % cardsPerPage === 0) doc.addPage();

    const slot = idx % cardsPerPage;
    const col = slot % cols;
    const rowIdx = Math.floor(slot / cols);

    // position accounts for gap spacing
    const x0 = margin + col * (cardW + gapX);
    const y0 = margin + rowIdx * (cardH + gapY);

    const idRows = grouped[id].slice();
    idRows.sort((a, b) => (a.date < b.date ? -1 : (a.date > b.date ? 1 : 0)));

    const datesMap = {};
    idRows.forEach(r => {
      const dt = r.date || '';
      if (!datesMap[dt]) datesMap[dt] = { AM: null, PM: null };
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

  // ---------------------------
  // Draw dotted cut guides on EVERY page (no scissors)
  // Ensures dashed style is set per page so jsPDF doesn't accidentally render solid lines.
  // ---------------------------
  const totalPages = typeof doc.getNumberOfPages === 'function'
    ? doc.getNumberOfPages()
    : (doc.internal && typeof doc.internal.getNumberOfPages === 'function' ? doc.internal.getNumberOfPages() : 1);

  // compute cut line positions (centered inside the gap between cards)
  const cutX = margin + cardW + gapX / 2;
  const cutY = margin + cardH + gapY / 2;

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // apply dashed stroke for this page explicitly
    doc.setLineDash([1.5, 2]); // dash/gap in mm (tweak to taste)
    doc.setLineWidth(0.2);

    // vertical dotted line (full height between margins)
    doc.line(cutX, margin, cutX, pageH - margin);

    // horizontal dotted line (full width between margins)
    doc.line(margin, cutY, pageW - margin, cutY);

    // reset dash so subsequent drawing uses solid strokes
    doc.setLineDash([]);
  }

  doc.save('report.pdf');
}

/* ------------- drawCardWithExplicitCols -------------
   Draws the card (single user report) at given x,y with width w and height h.
   Uses explicit column widths and renders header, 15 rows, totals and final amount.
*/
function drawCardWithExplicitCols(doc, x, y, w, h, id, dateKeys, datesMap, filters) {
   const pad = 4;

   // outer border (thin)
   doc.setLineWidth(0.25);
   doc.rect(x, y, w, h);
   doc.setLineWidth(0.2);    // restore thin inner grid lines

   const headerH = 18;
   const subHeaderH = 12;
   const footerH = 30;
   const tableTop = y + headerH + subHeaderH;
   const tableBottom = y + h - footerH;

   const name = getUserNameById(id) || '';
   const allDates = dateKeys.filter(Boolean);
   const minDate = filters.fromDate || (allDates[0] || '');
   const maxDate = filters.toDate || (allDates[allDates.length - 1] || '');

   doc.setFontSize(11);
   doc.setFont(undefined, 'bold');

   // Header text (ID and Name)
   doc.text(`ID: ${id}`, x + pad, y + 6);
   doc.text(`Name: ${name || '—'}`, x + pad, y + 12, {
      align: 'left'
   });

   doc.setFont(undefined, 'normal');
   doc.setFontSize(9);

   // Optional From/To dates at top-right of card
   if (minDate) doc.text(`From: ${displayDateFromISO(minDate)}`, x + w - pad, y + 6, {
      align: 'right'
   });
   if (maxDate) doc.text(`To: ${displayDateFromISO(maxDate)}`, x + w - pad, y + 12, {
      align: 'right'
   });

   // thin separator after header
   doc.line(x, y + headerH, x + w, y + headerH);

   // layout and column widths (explicit)
   const innerX = x + pad;
   const innerW = w - pad * 2;

   const colDateW = 12;
   const colAMQtyW = 15;
   const colAMPctW = 15;
   const colAMAmtW = 15;
   const colPMQtyW = 15;
   const colPMPctW = 15;
   const colPMAmtW = 15;

   const totalExplicit = colDateW + colAMQtyW + colAMPctW + colAMAmtW + colPMQtyW + colPMPctW + colPMAmtW;
   let scale = 1;
   if (totalExplicit > innerW) scale = innerW / totalExplicit;
   const dW = (v) => v * scale;

   // cumulative positions for vertical lines
   const pos = [];
   let cur = innerX;
   pos.push(Number(cur.toFixed(2)));
   cur += dW(colDateW);
   pos.push(Number(cur.toFixed(2)));
   cur += dW(colAMQtyW);
   pos.push(Number(cur.toFixed(2)));
   cur += dW(colAMPctW);
   pos.push(Number(cur.toFixed(2)));
   cur += dW(colAMAmtW);
   pos.push(Number(cur.toFixed(2)));
   cur += dW(colPMQtyW);
   pos.push(Number(cur.toFixed(2)));
   cur += dW(colPMPctW);
   pos.push(Number(cur.toFixed(2)));
   cur += dW(colPMAmtW);
   pos.push(Number(cur.toFixed(2)));

   // outer table rect
   doc.setLineWidth(0.2);
   doc.rect(innerX, tableTop, innerW, tableBottom - tableTop);

   // vertical separators
   doc.setLineWidth(0.25);
   for (let i = 1; i <= 6; i++) {
      const vx = pos[i];
      doc.line(vx, tableTop, vx, tableBottom);
   }
   doc.setLineWidth(0.2);

   const hdrTop = y + headerH;
   const hdrSub = hdrTop + subHeaderH;

   // header horizontal delimiters
   doc.line(innerX, hdrTop, innerX + innerW, hdrTop);
   doc.line(innerX, hdrSub, innerX + innerW, hdrSub);

   // draw header boxes
   doc.setLineWidth(0.25);
   for (let i = 0; i < 7; i++) {
      const left = pos[i];
      const right = pos[i + 1];
      const width = right - left;
      doc.rect(left, hdrTop, width, hdrSub - hdrTop);
   }
   doc.setLineWidth(0.2);

   doc.setFontSize(8);

   /**
    * drawWrappedCentered
    * Helper to wrap and center text inside a rectangular header cell.
    */
   function drawWrappedCentered(text, left, right, top, bottom) {
      const boxW = right - left - 2;
      const lines = doc.splitTextToSize(String(text), boxW);
      const lineH = 3.2;
      const totalH = lines.length * lineH;
      const centerY = top + (bottom - top) / 2;
      let startY = centerY - (totalH / 2) + (lineH - 1.2);
      for (let i = 0; i < lines.length; i++) {
         doc.text(lines[i], left + (right - left) / 2, startY + i * lineH, {
            align: 'center'
         });
      }
   }

   // header labels
   drawWrappedCentered('DATE', pos[0], pos[1], hdrTop, hdrSub);
   drawWrappedCentered('Quantity', pos[1], pos[2], hdrTop, hdrSub);
   drawWrappedCentered('Percentage', pos[2], pos[3], hdrTop, hdrSub);
   drawWrappedCentered('Amount', pos[3], pos[4], hdrTop, hdrSub);
   drawWrappedCentered('Quantity', pos[4], pos[5], hdrTop, hdrSub);
   drawWrappedCentered('Percentage', pos[5], pos[6], hdrTop, hdrSub);
   drawWrappedCentered('Amount', pos[6], pos[7], hdrTop, hdrSub);

   // body rows
   doc.setFont(undefined, 'normal');
   const rowsToShow = 15;
   const usableH = tableBottom - tableTop;
   const rowH = usableH / rowsToShow;
   let cursorY = tableTop;
   let totalQty = 0;
   let totalAmt = 0;

   const qtyCenterAM = pos[1] + (pos[2] - pos[1]) / 2;
   const pctCenterAM = pos[2] + (pos[3] - pos[2]) / 2;
   const amtCenterAM = pos[3] + (pos[4] - pos[3]) / 2;
   const qtyCenterPM = pos[4] + (pos[5] - pos[4]) / 2;
   const pctCenterPM = pos[5] + (pos[6] - pos[5]) / 2;
   const amtCenterPM = pos[6] + (pos[7] - pos[6]) / 2;

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
         doc.text(fmtPct(amObj.percentage), pctCenterAM, midY, {
            align: 'center'
         });
         doc.text(fmtAmtWithSep(amObj.amount), amtCenterAM, midY, {
            align: 'center'
         });
         totalQty += Number(amObj.quantity) || 0;
         totalAmt += Number(amObj.amount) || 0;
      }

      if (pmObj) {
         doc.text(fmtQty(pmObj.quantity), qtyCenterPM, midY, {
            align: 'center'
         });
         doc.text(fmtPct(pmObj.percentage), pctCenterPM, midY, {
            align: 'center'
         });
         doc.text(fmtAmtWithSep(pmObj.amount), amtCenterPM, midY, {
            align: 'center'
         });
         totalQty += Number(pmObj.quantity) || 0;
         totalAmt += Number(pmObj.amount) || 0;
      }

      cursorY += rowH;
      doc.line(innerX, cursorY, innerX + innerW, cursorY);
   }

   // footer totals
   const footerTop = tableBottom;
   doc.setLineWidth(0.25);
   doc.line(x, footerTop, x + w, footerTop);

   doc.setFontSize(9);
   const leftX = x + pad + 2;
   const rightX = x + w - pad - 2;
   const totalsRight = x + w - pad - 4;
   const totalsLeft = x + pad + 2;
   const totalsCenter = (totalsLeft + totalsRight) / 2;

   doc.setFont(undefined, 'normal');

   doc.text(`Total Milk in liters: ${(Math.round(totalQty * 10) / 10).toFixed(1)}`, totalsLeft, footerTop + 5, {
      align: 'left'
   });
   doc.text(`Total Amount: ${fmtAmtWithSep(totalAmt)}`, totalsLeft, footerTop + 10, {
      align: 'left'
   });

   doc.setTextColor(255, 0, 0);
   doc.text(`Recovery: 0`, totalsRight, footerTop + 5, {
      align: 'right'
   });
   doc.setTextColor(0, 0, 0);

   doc.setFontSize(15);
   doc.setFont(undefined, 'bold');
   doc.text(`Final Amount: ${fmtFinalAmt(totalAmt)}`, totalsCenter, footerTop + 20, {
      align: 'center'
   });

   doc.setFont(undefined, 'normal');
}

/* --------- Events --------- */

/**
 * File input change -> load workbook and render preview table
 */
fileInput.addEventListener('change', (evt) => {
   const f = evt.target.files && evt.target.files[0];
   if (!f) return;
   loadWorkbookFileToTable(f);
});

/**
 * Drag and drop support for file upload
 */
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
   e.preventDefault();
   const f = e.dataTransfer.files && e.dataTransfer.files[0];
   if (f) loadWorkbookFileToTable(f);
});

/**
 * Generate button: validate filters, apply them to rows, and generate PDF.
 * Resets filter inputs after generation.
 */
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

/* -------------------------
   Initial rendering
   ------------------------- */
renderTable();
