// =========================
// USER ID -> NAME MAPPING
// =========================
const USER_NAMES = {
  1: "నాసిన. అంకయ్య",
  2: "నాసిన. వాసు",
  3: "నాసిన. సంపూర్ణమ్మ",
  4: "గెద్దే. కొండయ్య",
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
  15: "గిద్దలూరి. ప్రకాష్",
  16: "కూనిశెట్టి. కళాధరరావు",
  17: "వడ్లమాని. బుజ్జయ్య",
  18: "N/A",
  19: "N/A",
  20: "N/A",
};

function getUserNameById(id){
  const n = Number(id);
  return USER_NAMES[n] || "";
}

// Each row: { date (ISO), session ('AM'/'PM'), id, quantity, percentage, amount, saved: true/false }
let rows = [];
let nextFormId = 1;

// DOM refs
const formArea     = document.getElementById('form-area');
const fileInput    = document.getElementById('file-input');
const fileInfo     = document.getElementById('file-info');
const btnAddRow    = document.getElementById('btn-add-row');
const btnSave      = document.getElementById('btn-save');
const btnClearForm = document.getElementById('btn-clear-form');
const btnDeleteAll = document.getElementById('btn-delete-all');
const btnDownload  = document.getElementById('btn-download-xlsx');
const tableHead    = document.getElementById('table-head');
const tableBody    = document.getElementById('table-body');
const rowsCount    = document.getElementById('rows-count');
const userTableBody = document.getElementById('user-table-body');

function buildKey(dateIso, session, id){
  return `${dateIso}__${session}__${Number(id)}`;
}

function formatNumber(n){
  if (!isFinite(n)) return '';
  return (Math.round(n * 100) / 100).toFixed(2);
}
function isoFromDate(d){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}
function displayDateFromISO(iso){
  if (!iso) return '';

  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso);

  const day   = m[3];
  const month = parseInt(m[2], 10);
  const year  = m[1].slice(-2);

  const MONTH_SHORT = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  const monName = MONTH_SHORT[month - 1] || m[2];

  return `${day}-${monName}-${year}`;
}

function parseDateToISO(value){
  if (value instanceof Date && !isNaN(value)) return isoFromDate(value);
  if (typeof value === 'number') {
    const epoch = new Date(Date.UTC(1899,11,30));
    const d = new Date(epoch.getTime() + value * 24*60*60*1000);
    if (!isNaN(d)) return isoFromDate(d);
  }
  const s = String(value||'').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = Date.parse(s);
  if (!isNaN(parsed)) return isoFromDate(new Date(parsed));
  const m = s.match(/^(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2,4})$/);
  if (m){
    let dd = Number(m[1]), mm = Number(m[2]), yy = Number(m[3]);
    if (yy < 100) yy += 2000;
    const d = new Date(yy, mm-1, dd);
    if (!isNaN(d)) return isoFromDate(d);
  }
  return s;
}

function validateId(v){
  if (v === '' || v === null || v === undefined) return 'User ID is required.';
  if (!/^[-+]?\d+$/.test(String(v))) return 'User ID must be an integer.';
  const n = Number(v);
  if (!Number.isInteger(n)) return 'User ID must be an integer.';
  if (n < 1 || n > 20) return 'User ID must be between 1 and 20.';
  return '';
}
function validateDate(v){ if (!v) return 'Date is required.'; return ''; }
function validateSession(v){
  if (!v) return 'Session is required.';
  if (v !== 'AM' && v !== 'PM') return 'Session must be AM or PM.';
  return '';
}
function validateQty(v){
  if (v === '' || v === null || v === undefined) return 'Quantity is required.';
  const n = Number(v);
  if (isNaN(n)) return 'Quantity must be a number.';
  if (!(n > 0)) return 'Quantity must be greater than 0.0.';
  return '';
}
function validatePct(v){
  if (v === '' || v === null || v === undefined) return 'Percentage is required.';
  const n = Number(v);
  if (isNaN(n)) return 'Percentage must be a number.';
  if (n < 5.0 || n > 10.0) return 'Percentage must be between 5.0 and 10.0.';
  return '';
}
function calcAmount(q,p){
  const qn = Number(q);
  const pn = Number(p);
  if (!isFinite(qn) || !isFinite(pn)) return '';
  return Number((qn * pn * 7.5).toFixed(2));
}

function createFormRow(prefill = {}) {
  const id = 'fr_' + (nextFormId++);
  const wrapper = document.createElement('div');
  wrapper.className = 'row-input';
  wrapper.dataset.formId = id;

  const serialCol = document.createElement('div');
  serialCol.className = 'serial-badge';
  serialCol.textContent = '—';

  const colDate = document.createElement('div'); colDate.className='field';
  const lblDate = document.createElement('label'); lblDate.textContent='Date';
  const inpDate = document.createElement('input'); inpDate.type='date';
  if (prefill.date) inpDate.value = prefill.date;
  const errDate = document.createElement('span'); errDate.className='inline-error'; errDate.style.display='none';
  colDate.appendChild(lblDate); colDate.appendChild(inpDate); colDate.appendChild(errDate);

  const colSession = document.createElement('div'); colSession.className='field';
  const lblSession = document.createElement('label'); lblSession.textContent='Session';
  const selSession = document.createElement('select');
  const optEmpty = document.createElement('option'); optEmpty.value=''; optEmpty.textContent='-- Select --';
  const optAM    = document.createElement('option'); optAM.value='AM'; optAM.textContent='AM';
  const optPM    = document.createElement('option'); optPM.value='PM'; optPM.textContent='PM';
  selSession.appendChild(optEmpty); selSession.appendChild(optAM); selSession.appendChild(optPM);
  if (prefill.session) selSession.value = prefill.session;
  const errSession = document.createElement('span'); errSession.className='inline-error'; errSession.style.display='none';
  colSession.appendChild(lblSession); colSession.appendChild(selSession); colSession.appendChild(errSession);

  // User ID
  const colId = document.createElement('div');
  colId.className = 'field';
  const lblId = document.createElement('label');
  lblId.textContent = 'User ID';
  const inpId = document.createElement('input');
  inpId.type = 'number';
  inpId.min = 0;
  inpId.max = 21;
  inpId.step = 1;
  inpId.value = (prefill.id !== undefined && prefill.id !== null) ? prefill.id : '';
  inpId.placeholder = '1–20';

  const errId = document.createElement('span');
  errId.className = 'inline-error';
  errId.style.display = 'none';

  colId.appendChild(lblId);
  colId.appendChild(inpId);
  colId.appendChild(errId);

  const colQty = document.createElement('div'); colQty.className='field';
  const lblQty = document.createElement('label'); lblQty.textContent='Quantity';
  const inpQty = document.createElement('input'); inpQty.type='number'; inpQty.step='any';
  if (prefill.quantity !== undefined && prefill.quantity !== null) inpQty.value = prefill.quantity;
  const errQty = document.createElement('span'); errQty.className='inline-error'; errQty.style.display='none';
  colQty.appendChild(lblQty); colQty.appendChild(inpQty); colQty.appendChild(errQty);

  const colPct = document.createElement('div'); colPct.className='field';
  const lblPct = document.createElement('label'); lblPct.textContent='Percentage';
  const inpPct = document.createElement('input'); inpPct.type='number'; inpPct.step='any';
  if (prefill.percentage !== undefined && prefill.percentage !== null) inpPct.value = prefill.percentage;
  const errPct = document.createElement('span'); errPct.className='inline-error'; errPct.style.display='none';
  colPct.appendChild(lblPct); colPct.appendChild(inpPct); colPct.appendChild(errPct);

  const colAmt = document.createElement('div'); colAmt.className='field col-amount';
  const lblAmt = document.createElement('label'); lblAmt.textContent='Amount';
  const inpAmt = document.createElement('input'); inpAmt.type='text'; inpAmt.readOnly=true;
  if (prefill.amount !== undefined && prefill.amount !== null) inpAmt.value = formatNumber(prefill.amount);
  colAmt.appendChild(lblAmt); colAmt.appendChild(inpAmt);

  const colAct = document.createElement('div'); colAct.className='field col-actions';
  const btnRemove = document.createElement('button'); btnRemove.type='button'; btnRemove.className='ghost small'; btnRemove.textContent='Remove';
  btnRemove.addEventListener('click', () => { wrapper.remove(); updateFormSerials(); });
  colAct.appendChild(document.createElement('div')); colAct.appendChild(btnRemove);

  wrapper.appendChild(serialCol);
  wrapper.appendChild(colDate);
  wrapper.appendChild(colSession);
  wrapper.appendChild(colId);
  wrapper.appendChild(colQty);
  wrapper.appendChild(colPct);
  wrapper.appendChild(colAmt);
  wrapper.appendChild(colAct);

  function recalc(){
    const q = inpQty.value;
    const p = inpPct.value;
    const a = calcAmount(q,p);
    inpAmt.value = a === '' ? '' : formatNumber(a);
  }
  inpQty.addEventListener('input', recalc);
  inpPct.addEventListener('input', recalc);

  function updateNameTooltip(){
    const nm = getUserNameById(inpId.value);
    inpId.title = nm ? `Name: ${nm}` : '';
  }

  inpId.addEventListener('input', updateNameTooltip);
  updateNameTooltip();

  inpId.addEventListener('blur', () => {
    const msg = validateId(inpId.value);
    if (msg){ errId.style.display='block'; errId.textContent = msg; } else { errId.style.display='none'; }
    updateNameTooltip();
  });
  inpDate.addEventListener('blur', () => {
    const msg = validateDate(inpDate.value);
    if (msg){ errDate.style.display='block'; errDate.textContent = msg; } else { errDate.style.display='none'; }
  });
  selSession.addEventListener('blur', () => {
    const msg = validateSession(selSession.value);
    if (msg){ errSession.style.display='block'; errSession.textContent = msg; } else { errSession.style.display='none'; }
  });
  inpQty.addEventListener('blur', () => {
    const msg = validateQty(inpQty.value);
    if (msg){ errQty.style.display='block'; errQty.textContent = msg; } else { errQty.style.display='none'; }
  });
  inpPct.addEventListener('blur', () => {
    const msg = validatePct(inpPct.value);
    if (msg){ errPct.style.display='block'; errPct.textContent = msg; } else { errPct.style.display='none'; }
  });

  wrapper._fields = {
    serialCol,
    inpDate,
    selSession,
    inpId,
    inpQty,
    inpPct,
    inpAmt,
    errId,
    errDate,
    errSession,
    errQty,
    errPct
  };

  formArea.insertBefore(wrapper, formArea.firstChild);
  updateFormSerials();
  return wrapper;
}

function updateFormSerials(){
  const nodes = Array.from(formArea.children);
  for (let i=0; i<nodes.length; i++){
    const w = nodes[i];
    if (w._fields && w._fields.serialCol) w._fields.serialCol.textContent = (i+1);
  }
}

function mapHeaders(headerRow){
  const map = {};
  headerRow.forEach((h, idx) => {
    if (h == null) return;
    const key = String(h).trim().toLowerCase();
    if (!key) return;
    if (['date','day'].includes(key)) map[idx] = 'date';
    else if (['session','am/pm','am-pm','ampm'].includes(key)) map[idx] = 'session';
    else if (['user id','userid','user_id','id','identifier','ident','no','number'].includes(key)) map[idx] = 'id';
    else if (['quantity','qty','q'].includes(key)) map[idx] = 'quantity';
    else if (['percentage','pct','percent','%'].includes(key)) map[idx] = 'percentage';
    else if (['amount','amt','value','total'].includes(key)) map[idx] = 'amount';
    else {
      if (key.includes('date')) map[idx]='date';
      else if (key.includes('session')) map[idx]='session';
      else if (key.includes('user') && key.includes('id')) map[idx]='id';
      else if (key.includes('id')) map[idx]='id';
      else if (key.includes('qty')||key.includes('quant')) map[idx]='quantity';
      else if (key.includes('pct')||key.includes('percent')||key.includes('%')) map[idx]='percentage';
      else if (key.includes('amt')||key.includes('amount')) map[idx]='amount';
    }
  });
  return map;
}

function loadWorkbookFileToTable(file){
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    let workbook;
    try {
      workbook = XLSX.read(data, { type:'array', cellDates:true, dateNF:'yyyy-mm-dd' });
    } catch(err){
      alert('Failed to read file: '+err);
      return;
    }
    const firstSheet = workbook.SheetNames[0];
    const ws = workbook.Sheets[firstSheet];
    if (!ws) { alert('No sheets found'); return; }
    const aoa = XLSX.utils.sheet_to_json(ws, { header:1, defval:null, raw:false, dateNF:'yyyy-mm-dd' });
    if (aoa.length === 0) { alert('Sheet empty'); return; }

    const header = aoa[0].map(h => h===null ? '' : String(h));
    let mapping = mapHeaders(header);

    if (!Object.values(mapping).includes('date') && aoa.length>1 && aoa[0].length>=4) {
      mapping = {0:'date',1:'session',2:'id',3:'quantity',4:'percentage'};
      if (aoa[0].length>=6) mapping[5]='amount';
    }

    const extracted = [], errors = [];
    const existingKeys = new Set(rows.map(r => buildKey(r.date, r.session, r.id)));
    const batchKeys    = new Set();

    for (let r=1; r<aoa.length; r++){
      const row = aoa[r];
      if (!row || row.every(c=>c===null||c==='')) continue;
      const obj = {};
      for (let c=0; c<row.length; c++){
        const field = mapping[c]; if (!field) continue;
        const cell = row[c];
        if (field==='date'){
          obj.date = parseDateToISO(cell);
        } else if (field==='session'){
          if (cell == null) obj.session = null;
          else {
            let s = String(cell).trim().toUpperCase();
            if (s === 'A.M.') s = 'AM';
            if (s === 'P.M.') s = 'PM';
            if (s === 'AM' || s === 'PM') obj.session = s;
            else obj.session = s;
          }
        } else if (field==='id'){
          const n = (cell===null)?null:Number(cell);
          obj.id = Number.isFinite(n)?Math.trunc(n):(cell!==null?String(cell).trim():null);
        } else if (field==='quantity'){
          const n=(cell===null)?null:Number(cell);
          obj.quantity = Number.isFinite(n)?n:(cell!==null?Number(String(cell).replace(/,/g,'')):null);
        } else if (field==='percentage'){
          const raw = cell; let n=null;
          if (raw!==null){
            const s = String(raw).replace('%','').replace(/,/g,'').trim();
            n = Number(s);
          }
          obj.percentage = Number.isFinite(n)?n:null;
        } else if (field==='amount'){
          const n=(cell===null)?null:Number(cell);
          obj.amount = Number.isFinite(n)?n:null;
        }
      }

      if ((obj.amount===null||obj.amount===undefined||obj.amount==='') &&
          obj.quantity!=null && obj.percentage!=null){
        obj.amount = calcAmount(obj.quantity,obj.percentage);
      }

      const eid  = validateId(obj.id);
      const ed   = validateDate(obj.date);
      const es   = validateSession(obj.session || '');
      const eq   = validateQty(obj.quantity);
      const ep   = validatePct(obj.percentage);

      if (eid||ed||es||eq||ep){
        errors.push({row:r+1, issues:[eid,ed,es,eq,ep].filter(Boolean).join(' | '), raw: obj});
        continue;
      }

      const key = buildKey(obj.date, obj.session, obj.id);
      if (existingKeys.has(key) || batchKeys.has(key)){
        errors.push({row:r+1, issues:'Duplicate entry (same Date, Session and User ID already exists).', raw: obj});
        continue;
      }
      batchKeys.add(key);

      extracted.push({
        date: obj.date,
        session: obj.session,
        id: Number(obj.id),
        quantity: Number(obj.quantity),
        percentage: Number(obj.percentage),
        amount: Number(obj.amount) || calcAmount(obj.quantity,obj.percentage),
        saved: false
      });
    }

    if (extracted.length) {
      rows = rows.concat(extracted);
      renderTable();
    }
    let msg = `Imported ${extracted.length} valid row${extracted.length===1?'':'s'} from "${file.name}".`;
    if (errors.length){
      msg += ` ${errors.length} row${errors.length===1?'':'s'} skipped.`;
      console.warn('Import skipped rows:', errors);
    }
    alert(msg);
    fileInfo.textContent = `Last imported: ${file.name} — ${extracted.length} rows loaded, ${errors.length} skipped.`;

    fileInput.value = "";
  };
  reader.onerror = (err) => { alert('File read error: ' + err); };
  reader.readAsArrayBuffer(file);
}

function gatherAndValidateAll(){
  const nodes = Array.from(formArea.children);
  const collected = [];
  let hasError = false;

  const existingKeys = new Set(rows.map(r => buildKey(r.date, r.session, r.id)));
  const newKeys = new Set();

  nodes.reverse();
  for (const wrapper of nodes){
    const f = wrapper._fields;
    const datev    = f.inpDate.value;
    const sessionv = f.selSession.value;
    const idv      = f.inpId.value;
    const qtyv     = f.inpQty.value;
    const pctv     = f.inpPct.value;

    const eDate = validateDate(datev);
    const eSess = validateSession(sessionv);
    const eId   = validateId(idv);
    const eQty  = validateQty(qtyv);
    const ePct  = validatePct(pctv);

    if (eDate){ f.errDate.style.display='block'; f.errDate.textContent=eDate; hasError=true; } else f.errDate.style.display='none';
    if (eSess){ f.errSession.style.display='block'; f.errSession.textContent=eSess; hasError=true; } else f.errSession.style.display='none';
    if (eId){   f.errId.style.display='block';   f.errId.textContent=eId;   hasError=true; } else f.errId.style.display='none';
    if (eQty){  f.errQty.style.display='block';  f.errQty.textContent=eQty; hasError=true; } else f.errQty.style.display='none';
    if (ePct){  f.errPct.style.display='block';  f.errPct.textContent=ePct; hasError=true; } else f.errPct.style.display='none';

    if (!eDate && !eSess && !eId && !eQty && !ePct){
      const key = buildKey(datev, sessionv, idv);
      if (existingKeys.has(key) || newKeys.has(key)){
        const dupMsg = 'Duplicate entry: same Date, Session and User ID already exists in table.';
        f.errId.style.display = 'block';
        f.errId.textContent   = dupMsg;
        hasError = true;
      } else {
        newKeys.add(key);
        const amt = calcAmount(qtyv,pctv);
        collected.push({
          date: datev,
          session: sessionv,
          id: Number(idv),
          quantity: Number(qtyv),
          percentage: Number(pctv),
          amount: amt===''?0:amt
        });
      }
    }
  }
  nodes.reverse();
  if (hasError) return { ok:false, data:null };
  return { ok:true, data:collected };
}

function saveAllFormRows(){
  const res = gatherAndValidateAll();
  if (!res.ok){
    alert('Please fix validation errors before saving.');
    return;
  }
  const savedRows = res.data.map(r => ({...r, saved:true}));
  rows = rows.concat(savedRows);
  rows = rows.map(r => ({ ...r, saved:true }));
  renderTable();
  clearForm();
}

// ===== renderTable now adds data-labels for responsive cards =====
function renderTable(){
  tableHead.innerHTML = '';
  const headRow = document.createElement('tr');
  ['S.No','Date','Session','User ID','Quantity','Percentage','Amount','Actions'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  tableHead.appendChild(headRow);

  tableBody.innerHTML = '';
  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    if (!r.saved) tr.classList.add('unsaved-row');

    const tdSerial = document.createElement('td');
    tdSerial.textContent = idx+1;
    tdSerial.setAttribute('data-label','S.No');
    tr.appendChild(tdSerial);

    const tdDate   = document.createElement('td');
    tdDate.textContent   = displayDateFromISO(r.date);
    tdDate.setAttribute('data-label','Date');
    tr.appendChild(tdDate);

    const tdSess   = document.createElement('td');
    tdSess.textContent   = r.session;
    tdSess.setAttribute('data-label','Session');
    tr.appendChild(tdSess);

    const tdId     = document.createElement('td');
    tdId.textContent     = r.id;
    tdId.setAttribute('data-label','User ID');
    tr.appendChild(tdId);

    const tdQty    = document.createElement('td');
    tdQty.textContent    = formatNumber(r.quantity);
    tdQty.setAttribute('data-label','Quantity');
    tr.appendChild(tdQty);

    const tdPct    = document.createElement('td');
    tdPct.textContent    = formatNumber(r.percentage);
    tdPct.setAttribute('data-label','Percentage');
    tr.appendChild(tdPct);

    const tdAmt    = document.createElement('td');
    tdAmt.textContent    = formatNumber(r.amount);
    tdAmt.setAttribute('data-label','Amount');
    tr.appendChild(tdAmt);

    const tdAct = document.createElement('td'); tdAct.className='actions';
    tdAct.setAttribute('data-label','Actions');

    const btnEdit = document.createElement('button');
    btnEdit.className = 'small btn-edit';
    btnEdit.textContent = 'Edit';

    const btnDelete = document.createElement('button');
    btnDelete.className = 'small btn-delete-row';
    btnDelete.textContent = 'Delete';

    const btnCopy = document.createElement('button');
    btnCopy.className = 'small btn-copy';
    btnCopy.textContent = 'Copy';

    btnCopy.addEventListener('click', () => {
      createFormRow({
        date: r.date,
        session: r.session,
        id: r.id,
        quantity: r.quantity,
        percentage: r.percentage,
        amount: r.amount
      });
      window.scrollTo({ top: 0, behavior:'smooth' });
    });

    btnDelete.addEventListener('click', () => {
      if (!confirm('Delete this row?')) return;
      rows.splice(idx,1);
      renderTable();
    });

    btnEdit.addEventListener('click', () => {
      createFormRow({
        date: r.date,
        session: r.session,
        id: r.id,
        quantity: r.quantity,
        percentage: r.percentage,
        amount: r.amount
      });
      rows.splice(idx,1);
      renderTable();
      window.scrollTo({ top: 0, behavior:'smooth' });
    });

    tdAct.appendChild(btnEdit);
    tdAct.appendChild(btnDelete);
    tdAct.appendChild(btnCopy);
    tr.appendChild(tdAct);

    tableBody.appendChild(tr);
  });
  rowsCount.textContent = `${rows.length} row${rows.length===1?'':'s'}`;
}

function clearForm(){
  formArea.innerHTML = '';
  nextFormId = 1;
  createFormRow();
  fileInfo.textContent = '';
}

function downloadXLSX(){
  const aoa = [];
  aoa.push(['Date','Session','User ID','Quantity','Percentage','Amount']);
  rows.forEach(r => {
    aoa.push([
      displayDateFromISO(r.date),
      r.session,
      r.id,
      r.quantity,
      r.percentage,
      r.amount
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{wch:12},{wch:10},{wch:10},{wch:12},{wch:12},{wch:14}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'table-data.xlsx');
}

function renderUserList(){
  userTableBody.innerHTML = '';
  const ids = Object.keys(USER_NAMES)
    .map(k => Number(k))
    .filter(n => !isNaN(n))
    .sort((a,b)=>a-b);
  ids.forEach(id => {
    const tr = document.createElement('tr');
    const tdId = document.createElement('td'); tdId.textContent = id;
    const tdName = document.createElement('td'); tdName.textContent = USER_NAMES[id];
    tr.appendChild(tdId); tr.appendChild(tdName);
    userTableBody.appendChild(tr);
  });
}

renderTable();
clearForm();
renderUserList();

const btnToggleUsers = document.getElementById('btn-toggle-users');
const userListContainer = document.getElementById('user-list-container');
const userHint = document.getElementById('user-hint');

userListContainer.style.display = 'none';
if (userHint) userHint.style.display = 'none';
btnToggleUsers.textContent = '➕';

btnToggleUsers.addEventListener('click', () => {
  const isHidden = userListContainer.style.display === 'none';

  if (isHidden) {
    userListContainer.style.display = '';
    if (userHint) userHint.style.display = '';
    btnToggleUsers.textContent = '➖';
  } else {
    userListContainer.style.display = 'none';
    if (userHint) userHint.style.display = 'none';
    btnToggleUsers.textContent = '➕';
  }
});

btnAddRow.addEventListener('click', () => { createFormRow(); updateFormSerials(); });
btnClearForm.addEventListener('click', () => {
  if (!confirm('Clear all form rows?')) return;
  clearForm();
});
btnSave.addEventListener('click', saveAllFormRows);
btnDeleteAll.addEventListener('click', () => {
  if (!confirm('Delete ALL preview rows? This cannot be undone.')) return;
  rows = [];
  renderTable();
});
btnDownload.addEventListener('click', () => {
  if (rows.length === 0){
    if (!confirm('No rows available. Download header-only file?')) return;
  }
  downloadXLSX();
});

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
