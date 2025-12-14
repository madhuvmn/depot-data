//--------------------------
// ++++++ reports.js +++++++
//--------------------------


/**
 * USER ID -> NAME mapping
 * Use getUserNameById(id) to safely lookup a name (returns empty string if not found).
 */
/*
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

function getUserNameById(id) {
  const n = Number(id);
  return USER_NAMES[n] || "";
}
*/

function getUserImagePath(id) {
   const n = Number(id);
   if (!Number.isFinite(n)) return null;
   return `Images/Image${n}.jpg`;
}

function loadImageAsDataUrl(path) {
   return new Promise((resolve) => {
      if (!path) return resolve(null);

      fetch(path)
         .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.blob();
         })
         .then(blob => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
         })
         .catch(() => resolve(null));
   });
}

// ---- Header image paths ----
const HEADER_IMAGE_PATHS = {
   date: 'Images/Date.jpg',
   quantity: 'Images/Quantity.jpg',
   percentage: 'Images/Percentage.jpg',
   amount: 'Images/Amount.jpg'
};

// ---- Footer image paths ----
const FOOTER_IMAGE_PATHS = {
   total: 'Images/tAmount.jpg',
   recovery: 'Images/recovery.jpg',
   final: 'Images/fAmount.jpg'
};

// ---- AM/PM image paths ----
const AMPM_IMAGE_PATHS = {
   am: 'Images/AM.jpg',
   pm: 'Images/PM.jpg'
};


async function preloadHeaderImages() {
   const result = {};
   for (const [key, path] of Object.entries(HEADER_IMAGE_PATHS)) {
      result[key] = await loadImageAsDataUrl(path);
   }
   return result;
}

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

/**
 * normalizeHalfMonthRange
 * -----------------------
 * Given fromDate / toDate (yyyy-mm-dd), snap to either:
 *  - 1..15  of that month, or
 *  - 16..lastDay of that month
 *
 * If both dates are empty, returns { fromDate: null, toDate: null }.
 * If only one is given, that is used as the base to decide 1–15 or 16–end.
 */
function normalizeHalfMonthRange(fromDate, toDate) {
   if (!fromDate && !toDate) {
      return {
         fromDate: null,
         toDate: null
      };
   }

   const base = fromDate || toDate;
   const d = new Date(base);
   if (isNaN(d)) {
      // fall back to whatever user gave
      return {
         fromDate,
         toDate
      };
   }

   const year = d.getFullYear();
   const month = d.getMonth(); // 0-based
   const lastDay = new Date(year, month + 1, 0).getDate();
   let startDay, endDay;

   if (d.getDate() <= 15) {
      // First half of month
      startDay = 1;
      endDay = 15;
   } else {
      // Second half of month
      startDay = 16;
      endDay = lastDay; // 28 / 29 / 30 / 31
   }

   const mm = String(month + 1).padStart(2, '0');
   const ddStart = String(startDay).padStart(2, '0');
   const ddEnd = String(endDay).padStart(2, '0');

   return {
      fromDate: `${year}-${mm}-${ddStart}`,
      toDate: `${year}-${mm}-${ddEnd}`
   };
}

/**
 * buildDateRangeISO
 * -----------------
 * Returns an array of ISO dates (yyyy-mm-dd) from fromISO to toISO (inclusive).
 */
function buildDateRangeISO(fromISO, toISO) {
   const result = [];
   if (!fromISO || !toISO) return result;

   const start = new Date(fromISO);
   const end = new Date(toISO);
   if (isNaN(start) || isNaN(end)) return result;

   let cur = new Date(start.getTime());
   while (cur <= end) {
      result.push(isoFromDate(cur));
      cur.setDate(cur.getDate() + 1);
   }
   return result;
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


// -------------------------
// PDF GENERATOR
// -------------------------

async function generatePdfReport(data, filters) {
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

   const gapX = 8;
   const gapY = 8;

   const cols = 2;
   const rowsPerPage = 2;
   const cardsPerPage = cols * rowsPerPage;

   const cardW = ((pageW - margin * 2) - gapX) / cols;
   const cardH = ((pageH - margin * 2) - gapY) / rowsPerPage;

   // Preload header + footer images
   const headerImages = await preloadHeaderImages();
   const footerImages = {};
   for (const [k, p] of Object.entries(FOOTER_IMAGE_PATHS)) {
      footerImages[k] = await loadImageAsDataUrl(p);
   }

   // ---- NEW: preload AM/PM images ----
   const ampmImages = {};
   for (const [k, p] of Object.entries(AMPM_IMAGE_PATHS)) {
      ampmImages[k] = await loadImageAsDataUrl(p);
   }


   // Group rows by ID
   const grouped = {};
   data.forEach(r => {
      if (!grouped[r.id]) grouped[r.id] = [];
      grouped[r.id].push(r);
   });
   const ids = Object.keys(grouped).map(Number).sort((a, b) => a - b);

   // Render cards
   for (let idx = 0; idx < ids.length; idx++) {
      const id = ids[idx];

      if (idx > 0 && idx % cardsPerPage === 0) {
         doc.addPage();
      }

      const slot = idx % cardsPerPage;
      const col = slot % cols;
      const rowIdx = Math.floor(slot / cols);

      const x0 = margin + col * (cardW + gapX);
      const y0 = margin + rowIdx * (cardH + gapY);

      const idRows = grouped[id].slice().sort((a, b) => (a.date < b.date ? -1 : (a.date > b.date ? 1 : 0)));

      const datesMap = {};
      idRows.forEach(r => {
         const dt = r.date || '';
         if (!datesMap[dt]) datesMap[dt] = {
            AM: null,
            PM: null
         };
         if (r.session === 'AM') datesMap[dt].AM = r;
         else if (r.session === 'PM') datesMap[dt].PM = r;
      });

      const dateKeys =
         (filters && filters.fromDate && filters.toDate) ?
         buildDateRangeISO(filters.fromDate, filters.toDate) :
         Object.keys(datesMap).filter(Boolean).sort();

      await drawCardWithExplicitCols(
         doc, x0, y0, cardW, cardH, id, dateKeys, datesMap,
         filters || {}, headerImages, footerImages, ampmImages
      );

   }

   // --------- DOTTED CUT GUIDES (center cross on every page) ---------
   const totalPages =
      typeof doc.getNumberOfPages === 'function' ?
      doc.getNumberOfPages() :
      (doc.internal && typeof doc.internal.getNumberOfPages === 'function' ?
         doc.internal.getNumberOfPages() :
         1);

   // Positions of cut lines between the 2x2 cards
   const cutX = margin + cardW + gapX / 2; // vertical guide (between left/right cards)
   const cutY = margin + cardH + gapY / 2; // horizontal guide (between top/bottom cards)

   for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      doc.setLineDash([1.5, 2]); // dotted style
      doc.setLineWidth(0.2);

      // Vertical dotted line
      doc.line(cutX, margin, cutX, pageH - margin);

      // Horizontal dotted line
      doc.line(margin, cutY, pageW - margin, cutY);

      doc.setLineDash([]); // reset to solid for other drawing
   }

   // Save with timestamp
   const now = new Date();
   const timestamp = now
      .toISOString()
      .replace(/[:]/g, '-')
      .replace('T', '_')
      .split('.')[0];

   const fileName = `report_${timestamp}.pdf`;
   doc.save(fileName);
}


// -------------------------
// DRAW CARD FUNCTION (Modified with AM/PM row)
// -------------------------

async function drawCardWithExplicitCols(doc, x, y, w, h, id, dateKeys, datesMap, filters = {}, headerImages = null,
   footerImages = null, ampmImages = null
) {
   const pad = 4;
   doc.setLineWidth(0.25);
   doc.rect(x, y, w, h); // outer card border
   doc.setLineWidth(0.2);

   const headerH = 20;
   const subHeaderH = 14;
   const ampmBarHeight = 6; // AM/PM row
   const footerH = 22;

   // --- vertical layout ---
   const ampmTop = y + headerH; // AM/PM row (top)
   const ampmBottom = ampmTop + ampmBarHeight;

   const hdrTop = ampmBottom; // header images row
   const hdrSub = hdrTop + subHeaderH;

   const tableTop = hdrSub; // body rows
   const tableBottom = y + h - footerH;

   // ----- HEADER: image + dates -----
   const imgPath = getUserImagePath(id);
   const imgData = await loadImageAsDataUrl(imgPath);
   if (imgData) {
      doc.addImage(imgData, 'JPEG', x + pad, y + 1, 52, 16);
   }

   const fromISO = dateKeys[0] || '';
   const toISO = dateKeys[dateKeys.length - 1] || '';

   doc.setFontSize(9);
   if (fromISO) {
      doc.text(`From: ${displayDateFromISO(fromISO)}`, x + w - pad, y + 6, {
         align: 'right'
      });
   }
   if (toISO) {
      doc.text(`To: ${displayDateFromISO(toISO)}`, x + w - pad, y + 12, {
         align: 'right'
      });
   }

   // separator below header
   doc.line(x, y + headerH, x + w, y + headerH);

   // ----- COLUMN LAYOUT -----
   const innerX = x + pad;
   const innerW = w - pad * 2;

   const colW = [12, 15, 15, 15, 15, 15, 15];
   const scale = innerW / colW.reduce((a, b) => a + b, 0);
   const dW = v => v * scale;

   let cur = innerX;
   const pos = [cur];
   for (const v of colW) {
      cur += dW(v);
      pos.push(cur);
   }

   // ---- BODY OUTER RECT + VERTICAL LINES (RESTORE BORDERS) ----
   doc.setLineWidth(0.2);
   doc.rect(innerX, tableTop, innerW, tableBottom - tableTop); // body rect

   doc.setLineWidth(0.25);
   for (let i = 1; i <= 6; i++) {
      const vx = pos[i];
      doc.line(vx, tableTop, vx, tableBottom); // body vertical grid
   }
   doc.setLineWidth(0.2);

   // ----- AM / PM ROW (ABOVE HEADER IMAGES) -----
   // full row rect
   doc.rect(innerX, ampmTop, innerW, ampmBarHeight);

   const amLeft = pos[1];
   const amRight = pos[4];
   const pmLeft = pos[4];
   const pmRight = pos[7];

   // divider between AM and PM
   doc.line(pmLeft, ampmTop, pmLeft, ampmBottom);

   // Try to draw AM/PM images; fall back to text if not present
   const amImg = ampmImages && ampmImages.am;
   const pmImg = ampmImages && ampmImages.pm;

   const imgPadX = 1.0;
   const imgPadY = 0.5;
   const amBoxW = amRight - amLeft;
   const pmBoxW = pmRight - pmLeft;
   const imgBoxH = ampmBarHeight;

   if (amImg) {
      const wImg = amBoxW - imgPadX * 2;
      const hImg = imgBoxH - imgPadY * 2;
      const xImg = amLeft + (amBoxW - wImg) / 2;
      const yImg = ampmTop + (imgBoxH - hImg) / 2;
      doc.addImage(amImg, 'JPEG', xImg, yImg, wImg, hImg);
   } else {
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('AM', amLeft + amBoxW / 2, ampmTop + ampmBarHeight * 0.68, {
         align: 'center'
      });
   }

   if (pmImg) {
      const wImg = pmBoxW - imgPadX * 2;
      const hImg = imgBoxH - imgPadY * 2;
      const xImg = pmLeft + (pmBoxW - wImg) / 2;
      const yImg = ampmTop + (imgBoxH - hImg) / 2;
      doc.addImage(pmImg, 'JPEG', xImg, yImg, wImg, hImg);
   } else {
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('PM', pmLeft + pmBoxW / 2, ampmTop + ampmBarHeight * 0.68, {
         align: 'center'
      });
   }

   // restore font for body rows
   doc.setFont(undefined, 'normal');
   doc.setFontSize(7.5);


   // ----- HEADER IMAGES ROW (BELOW AM/PM) -----
   doc.rect(innerX, hdrTop, innerW, subHeaderH); // header boxes
   for (let i = 1; i < pos.length - 1; i++) {
      doc.line(pos[i], hdrTop, pos[i], hdrSub); // header vertical lines
   }

   function drawHeaderImageOrText(key, left, right, top, bottom, fallbackText) {
      const img = headerImages && headerImages[key];
      if (!img) {
         doc.text(fallbackText, (left + right) / 2, top + 8, {
            align: 'center'
         });
         return;
      }
      const boxW = right - left - 2;
      const boxH = bottom - top - 2;
      doc.addImage(img, 'JPEG', left + 1, top + 1, boxW, boxH);
   }

   drawHeaderImageOrText('date', pos[0], pos[1], hdrTop, hdrSub, 'DATE');
   drawHeaderImageOrText('quantity', pos[1], pos[2], hdrTop, hdrSub, 'Q');
   drawHeaderImageOrText('percentage', pos[2], pos[3], hdrTop, hdrSub, '%');
   drawHeaderImageOrText('amount', pos[3], pos[4], hdrTop, hdrSub, 'AMT');
   drawHeaderImageOrText('quantity', pos[4], pos[5], hdrTop, hdrSub, 'Q');
   drawHeaderImageOrText('percentage', pos[5], pos[6], hdrTop, hdrSub, '%');
   drawHeaderImageOrText('amount', pos[6], pos[7], hdrTop, hdrSub, 'AMT');

   // ----- BODY ROWS -----
   const rowsToShow = 16;
   const usableH = tableBottom - tableTop;
   const rowH = usableH / rowsToShow;

   let cursorY = tableTop;
   let totalQty = 0;
   let totalAmt = 0;

   const amCenters = [
      pos[1] + (pos[2] - pos[1]) / 2,
      pos[2] + (pos[3] - pos[2]) / 2,
      pos[3] + (pos[4] - pos[3]) / 2
   ];
   const pmCenters = [
      pos[4] + (pos[5] - pos[4]) / 2,
      pos[5] + (pos[6] - pos[5]) / 2,
      pos[6] + (pos[7] - pos[6]) / 2
   ];

   for (let i = 0; i < rowsToShow; i++) {
      const dt = dateKeys[i] || '';
      const midY = cursorY + rowH * 0.65;

      if (dt) {
         const d = dt.split('-')[2];
         doc.text(d, pos[0] + (pos[1] - pos[0]) / 2, midY, {
            align: 'center'
         });
      }

      const entry = datesMap[dt];

      if (entry?.AM) {
         doc.text(fmtQty(entry.AM.quantity), amCenters[0], midY, {
            align: 'center'
         });
         doc.text(fmtPct(entry.AM.percentage), amCenters[1], midY, {
            align: 'center'
         });
         doc.text(fmtAmtWithSep(entry.AM.amount), amCenters[2], midY, {
            align: 'center'
         });
         totalQty += entry.AM.quantity || 0;
         totalAmt += entry.AM.amount || 0;
      }

      if (entry?.PM) {
         doc.text(fmtQty(entry.PM.quantity), pmCenters[0], midY, {
            align: 'center'
         });
         doc.text(fmtPct(entry.PM.percentage), pmCenters[1], midY, {
            align: 'center'
         });
         doc.text(fmtAmtWithSep(entry.PM.amount), pmCenters[2], midY, {
            align: 'center'
         });
         totalQty += entry.PM.quantity || 0;
         totalAmt += entry.PM.amount || 0;
      }

      cursorY += rowH;
      doc.line(innerX, cursorY, innerX + innerW, cursorY); // row separator
   }

   // ----- FOOTER (your existing footer code – unchanged) -----
   const footerTop = tableBottom;
   const footerBottom = y + h;
   const footerHeight = footerBottom - footerTop;

   const rowHeights = [
      footerHeight * 0.30,
      footerHeight * 0.30,
      footerHeight * 0.40
   ];

   doc.setLineWidth(0.20);
   doc.rect(x, footerTop, w, footerHeight);

   const footerMidX = x + w / 2;
   doc.line(footerMidX, footerTop, footerMidX, footerBottom);

   let yCursor2 = footerTop;
   const rowTops = [];
   for (let i = 0; i < rowHeights.length; i++) {
      rowTops[i] = yCursor2;
      yCursor2 += rowHeights[i];
      if (i < rowHeights.length - 1) doc.line(x, yCursor2, x + w, yCursor2);
   }

   function textY(i) {
      return rowTops[i] + rowHeights[i] * 0.63;
   }

   const valueCenterX = footerMidX + (w / 4);

   function drawFooterImage(key, rowIndex) {
      const img = footerImages && footerImages[key];
      if (!img) return;

      const boxW = footerMidX - x;
      const boxH = rowHeights[rowIndex];

      const padImgX = 1.5;
      const padImgY = 1;

      const wImg = boxW - padImgX * 2;
      const hImg = boxH - padImgY * 2;

      const xImg = footerMidX - wImg - padImgX;
      const yImg = rowTops[rowIndex] + (boxH - hImg) / 2;

      doc.addImage(img, 'JPEG', xImg, yImg, wImg, hImg);
   }

   doc.setFontSize(8);

   drawFooterImage('total', 0);
   doc.text(fmtAmtWithSep(totalAmt), valueCenterX, textY(0), {
      align: 'center'
   });

   doc.setTextColor(255, 0, 0);
   drawFooterImage('recovery', 1);
   doc.text('0', valueCenterX, textY(1), {
      align: 'center'
   });
   doc.setTextColor(0, 0, 0);

   drawFooterImage('final', 2);
   doc.setFontSize(12);
   doc.setFont(undefined, 'bold');
   doc.text(fmtFinalAmt(totalAmt), valueCenterX, textY(2), {
      align: 'center'
   });

   doc.setFontSize(9);
   doc.setFont(undefined, 'normal');
}

// -------------------------
// TABLE & FILE INPUT HANDLERS REMAIN SAME
// -------------------------

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
btnGenerateReport.addEventListener('click', async () => {
   if (!rows.length) {
      alert('No data loaded. Please upload a file first.');
      return;
   }

   const fromIdStr = reportFromId.value.trim();
   const toIdStr = reportToId.value.trim();
   const rawFromDate = reportFromDate.value; // user selection
   const rawToDate = reportToDate.value; // user selection

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

   // snap to half-month range (1–15 or 16–end)
   const {
      fromDate,
      toDate
   } = normalizeHalfMonthRange(rawFromDate, rawToDate);

   if (fromDate && toDate) {
      // ensure same year & month
      if (fromDate.slice(0, 7) !== toDate.slice(0, 7)) {
         alert('From Date and To Date must be in the same month for half-month reports.');
         return;
      }
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

   await generatePdfReport(filtered, {
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