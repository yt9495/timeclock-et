/*************************************************************
 * 출퇴근 기록 시스템 / Time Clock System
 * -----------------------------------------------------------
 * 시간대 / Timezone : America/New_York (EST/EDT 자동 전환)
 * 모든 시각은 Google 서버에서 생성됩니다.
 * 직원 PC/휴대폰의 시계를 바꿔도 기록은 위조되지 않습니다.
 *
 * All timestamps are generated on Google's servers.
 * Changing a device clock cannot alter the record.
 *************************************************************/

const TZ         = 'America/New_York';
const SHEET_EMP  = 'Employees';
const SHEET_LOG  = 'TimeLog';
const SHEET_CFG  = 'Settings';

/* ============================================================
 * 1. 초기 설정 / SETUP
 * ==========================================================*/

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⏱ 출퇴근 / Time Clock')
    .addItem('초기 설정 실행 / Run Setup', 'setup')
    .addItem('이번 달 리포트 생성 / Monthly Report', 'createMonthlyReport')
    .addToUi();
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);

  // ---- Employees ----
  let emp = ss.getSheetByName(SHEET_EMP);
  if (!emp) {
    emp = ss.insertSheet(SHEET_EMP);
    emp.getRange('A1:D1').setValues([[
      '이름 (Name)', '표시명 EN (Display EN)', '사번 (Emp ID)', '활성 (Active)'
    ]]);
    emp.getRange('A2:D4').setValues([
      ['홍길동', 'Gildong Hong', 'E001', true],
      ['김철수', 'Chulsoo Kim',  'E002', true],
      ['이영희', 'Younghee Lee', 'E003', true]
    ]);
    emp.setFrozenRows(1);
    emp.getRange('A1:D1').setFontWeight('bold').setBackground('#e8eaed');
    emp.setColumnWidths(1, 4, 160);
  }

  // ---- TimeLog ----
  let log = ss.getSheetByName(SHEET_LOG);
  if (!log) {
    log = ss.insertSheet(SHEET_LOG);
    log.getRange('A1:J1').setValues([[
      '기록ID (Record ID)', '날짜 ET (Date)', '요일 (Day)', '이름 (Name)',
      '구분 (Type)', '시각 ET (Time)', 'ISO 타임스탬프 (ISO)',
      'UTC epoch(ms)', '비고 (Note)', 'IP (참고용 / advisory)'
    ]]);
    log.getRange('B2:B').setNumberFormat('@');   // 날짜를 텍스트로 고정 / keep date as text
    log.getRange('F2:F').setNumberFormat('@');   // 시각을 텍스트로 고정 / keep time as text
    log.getRange('J2:J').setNumberFormat('@');   // IP도 텍스트로 / keep IP as text
    log.setFrozenRows(1);
    log.getRange('A1:J1').setFontWeight('bold').setBackground('#e8eaed');
    log.setColumnWidths(1, 10, 150);
    log.protect().setDescription('출퇴근 원본 기록 / Raw punch log').setWarningOnly(true);
  }

  // ---- Settings ----
  let cfg = ss.getSheetByName(SHEET_CFG);
  if (!cfg) {
    cfg = ss.insertSheet(SHEET_CFG);
    cfg.getRange('A1:C1').setValues([['키 (Key)', '값 (Value)', '설명 (Description)']]);
    cfg.getRange('B2:B20').setNumberFormat('@');   // 값은 항상 텍스트로 / keep values as text
    cfg.getRange('A2:C6').setValues([
      ['ADMIN_PIN',      '1234',  '관리자 대시보드 PIN / Admin dashboard PIN'],
      ['WORK_START',     '09:00', '기준 출근 시각 (지각 판정) / Scheduled start time'],
      ['WORK_END',       '18:00', '기준 퇴근 시각 / Scheduled end time'],
      ['STANDARD_HOURS', '8',     '1일 소정 근무시간 / Standard hours per day'],
      ['COMPANY_NAME',   'My Company', '회사명 / Company name']
    ]);
    cfg.setFrozenRows(1);
    cfg.getRange('A1:C1').setFontWeight('bold').setBackground('#e8eaed');
    cfg.setColumnWidths(1, 3, 220);
  }

  const sh1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
  if (sh1 && ss.getSheets().length > 1) ss.deleteSheet(sh1);

  SpreadsheetApp.getActive().toast('설정 완료 / Setup complete', '⏱', 5);
}

/* ============================================================
 * 2. 웹앱 진입점 / WEB APP ENTRY
 * ==========================================================*/

function doGet(e) {
  const page = (e && e.parameter && e.parameter.page === 'admin') ? 'Admin' : 'Index';
  return HtmlService.createHtmlOutputFromFile(page)
    .setTitle(page === 'Admin' ? 'Admin Dashboard' : 'Time Clock')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

/* ============================================================
 * 3. 공통 유틸 / HELPERS
 * ==========================================================*/

function ss_()  { return SpreadsheetApp.getActiveSpreadsheet(); }
function fmt_(d, p) { return Utilities.formatDate(d, TZ, p); }

function getConfig_() {
  const sh = ss_().getSheetByName(SHEET_CFG);
  const out = {};
  if (!sh) return out;
  const v = sh.getDataRange().getValues();
  // 시트가 '09:00'을 시간(Date)으로 자동 변환하는 경우가 있어 HH:mm 문자열로 복원합니다.
  // Sheets may coerce '09:00' into a Date — normalise it back to HH:mm.
  for (let i = 1; i < v.length; i++) {
    if (v[i][0]) out[String(v[i][0]).trim()] = String(v[i][1] instanceof Date ? Utilities.formatDate(v[i][1], TZ, 'HH:mm') : v[i][1]).trim();
  }
  return out;
}

/** 서버(구글) 기준 동부시간 정보 / Server-side Eastern Time snapshot */
function serverNow_() {
  const now = new Date();
  return {
    epoch : now.getTime(),
    date  : fmt_(now, 'yyyy-MM-dd'),
    time  : fmt_(now, 'HH:mm:ss'),
    day   : fmt_(now, 'EEE'),
    iso   : fmt_(now, "yyyy-MM-dd'T'HH:mm:ssZ"),
    tz    : fmt_(now, 'zzz')            // EST or EDT
  };
}

/** 클라이언트 시계 동기화용 / For client clock sync */
function getServerTime() {
  const s = serverNow_();
  return { epoch: s.epoch, date: s.date, time: s.time, tz: s.tz };
}

function logSheet_() { return ss_().getSheetByName(SHEET_LOG); }

/**
 * 시트가 날짜/시각으로 자동 변환해 버린 셀을 원래 문자열로 되돌립니다.
 * Sheets coerces '2026-08-04' and '17:34:21' into Date objects on write —
 * normalise them back so string comparison works.
 */
function cellStr_(v, pattern) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, pattern) : String(v).trim();
}

function readLog_() {
  const sh = logSheet_();
  if (!sh || sh.getLastRow() < 2) return [];
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, 10).getValues();
  return v.map(r => ({
    id: r[0], date: cellStr_(r[1], 'yyyy-MM-dd'), day: r[2], name: String(r[3]).trim(),
    type: String(r[4]).toUpperCase().trim(), time: cellStr_(r[5], 'HH:mm:ss'),
    iso: r[6], epoch: Number(r[7]) || 0, note: r[8], ip: String(r[9] || '').trim()
  })).filter(r => r.name);
}

/* ============================================================
 * 4. 직원 / EMPLOYEES
 * ==========================================================*/

function getEmployees() {
  const sh = ss_().getSheetByName(SHEET_EMP);
  if (!sh || sh.getLastRow() < 2) return [];
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();
  return v
    .filter(r => r[0] && r[3] !== false && String(r[3]).toUpperCase() !== 'FALSE')
    .map(r => ({ name: String(r[0]).trim(), en: String(r[1] || r[0]).trim(), id: String(r[2] || '') }));
}

function isValidEmployee_(name) {
  return getEmployees().some(e => e.name === name);
}

/* ============================================================
 * 5. 출퇴근 기록 / PUNCH
 * ==========================================================*/

/**
 * 오늘 해당 직원의 현재 상태를 반환
 * Returns today's state for one employee.
 */
function getMyStatus(name) {
  const s = serverNow_();
  const rows = readLog_().filter(r => r.name === name && r.date === s.date)
                         .sort((a, b) => a.epoch - b.epoch);
  let working = false, firstIn = null, lastOut = null, worked = 0, openAt = null;
  rows.forEach(r => {
    if (r.type === 'IN')  { working = true;  openAt = r.epoch; if (!firstIn) firstIn = r.time; }
    if (r.type === 'OUT') { if (openAt) worked += r.epoch - openAt; working = false; openAt = null; lastOut = r.time; }
  });
  if (working && openAt) worked += s.epoch - openAt;
  return {
    name: name,
    serverTime: s,
    working: working,
    firstIn: firstIn,
    lastOut: lastOut,
    workedMs: worked,
    workedText: msToHM_(worked),
    records: rows.map(r => ({ type: r.type, time: r.time }))
  };
}

/**
 * 클라이언트가 보고한 IP를 안전한 형태로만 통과시킵니다.
 * IP는 브라우저가 알려주는 값이라 위조 가능 — 참고용 기록일 뿐 신뢰하지 마세요.
 * Client-reported IP: advisory only, spoofable. Sanitised before storage.
 */
function safeIp_(ip) {
  const s = String(ip || '').trim();
  return /^[0-9a-fA-F:.]{3,45}$/.test(s) ? s : '';
}

/**
 * 출근/퇴근 기록. 시각은 전적으로 서버에서 생성됩니다.
 * Punch in/out. The timestamp is created on the server only.
 * @param {string} name
 * @param {string} type 'IN' | 'OUT'
 * @param {string} [ip] 브라우저가 조회한 공인 IP (선택) / public IP reported by the browser
 */
function punch(name, type, ip) {
  type = String(type).toUpperCase();
  if (type !== 'IN' && type !== 'OUT') return { ok: false, code: 'BAD_TYPE' };
  if (!isValidEmployee_(name))         return { ok: false, code: 'NO_EMP' };

  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch (e) { return { ok: false, code: 'BUSY' }; }

  try {
    const st = getMyStatus(name);
    if (type === 'IN'  && st.working)  return { ok: false, code: 'ALREADY_IN',  status: st };
    if (type === 'OUT' && !st.working) return { ok: false, code: 'NOT_IN',      status: st };

    const s  = serverNow_();
    const sh = logSheet_();
    const id = Utilities.getUuid().slice(0, 8).toUpperCase();

    sh.appendRow([id, s.date, s.day, name, type, s.time, s.iso, s.epoch, '', safeIp_(ip)]);
    SpreadsheetApp.flush();

    return { ok: true, code: 'OK', type: type, time: s.time, date: s.date,
             tz: s.tz, id: id, status: getMyStatus(name) };
  } finally {
    lock.releaseLock();
  }
}

/** 'YYYY-MM-DD' + 'HH:mm' (동부시간) → Date 객체 / Eastern local time → Date */
function etToDate_(dateStr, hhmm) {
  const guess = new Date(dateStr + 'T' + hhmm + ':00Z');          // UTC로 가정
  const back  = new Date(Utilities.formatDate(guess, TZ, "yyyy-MM-dd'T'HH:mm:ss") + 'Z');
  return new Date(guess.getTime() + (guess.getTime() - back.getTime()));
}

function msToHM_(ms) {
  if (!ms || ms < 0) ms = 0;
  const m = Math.floor(ms / 60000);
  return Math.floor(m / 60) + 'h ' + ('0' + (m % 60)).slice(-2) + 'm';
}

/* ============================================================
 * 6. 집계 / AGGREGATION
 * ==========================================================*/

/**
 * 날짜+이름별 근무시간 계산 / Pair IN→OUT and sum durations
 * 퇴근 기록이 없는 과거 날짜는 시간을 누적하지 않고 '미퇴근'으로 표시합니다.
 * Past days with no clock-out are flagged instead of accruing time forever.
 */
function buildSummary_(rows, nowEpoch, todayStr) {
  const cfg  = getConfig_();
  const std  = parseFloat(cfg.STANDARD_HOURS || '8');
  const ws   = (cfg.WORK_START || '09:00').split(':');
  const startMin = (parseInt(ws[0], 10) || 9) * 60 + (parseInt(ws[1], 10) || 0);

  const map = {};
  rows.sort((a, b) => a.epoch - b.epoch).forEach(r => {
    const k = r.date + '|' + r.name;
    if (!map[k]) map[k] = { date: r.date, day: r.day, name: r.name, ms: 0, open: null, first: null, last: null, punches: 0 };
    const o = map[k];
    o.punches++;
    if (r.type === 'IN')  { o.open = r.epoch; if (!o.first) o.first = r.time; }
    if (r.type === 'OUT') { if (o.open) { o.ms += r.epoch - o.open; o.open = null; } o.last = r.time; }
  });

  return Object.keys(map).map(k => {
    const o = map[k];
    let ms = o.ms, openNow = false, missing = false;
    if (o.open) {
      if (o.date === todayStr) { ms += (nowEpoch - o.open); openNow = true; }
      else { missing = true; }            // 과거 날짜 퇴근 누락 / unclosed past day
    }
    const hours = Math.round((ms / 3600000) * 100) / 100;
    let lateMin = 0;
    if (o.first) {
      const f = o.first.split(':');
      lateMin = Math.max(0, (parseInt(f[0], 10) * 60 + parseInt(f[1], 10)) - startMin);
    }
    return {
      date: o.date, day: o.day, name: o.name,
      first: o.first || '-', last: o.last || '-',
      hours: hours, hm: msToHM_(ms),
      late: lateMin, over: Math.max(0, Math.round((hours - std) * 100) / 100),
      open: openNow, missing: missing
    };
  }).sort((a, b) => (a.date === b.date ? a.name.localeCompare(b.name) : (a.date < b.date ? 1 : -1)));
}

/* ============================================================
 * 7. 관리자 API / ADMIN API
 * ==========================================================*/

function adminCheck_(pin) {
  const cfg = getConfig_();
  return String(pin) === String(cfg.ADMIN_PIN || '1234');
}

function adminLogin(pin) {
  const cfg = getConfig_();
  return { ok: adminCheck_(pin), company: cfg.COMPANY_NAME || '', tz: serverNow_().tz };
}

/** 오늘 현황 / Today's board */
function adminToday(pin) {
  if (!adminCheck_(pin)) return { ok: false };
  const s    = serverNow_();
  const emps = getEmployees();
  const rows = readLog_().filter(r => r.date === s.date);
  const sum  = buildSummary_(rows, s.epoch, s.date);
  const byName = {};
  sum.forEach(r => byName[r.name] = r);

  const board = emps.map(e => {
    const r = byName[e.name];
    return {
      name: e.name, en: e.en, id: e.id,
      state: r ? (r.open ? 'WORKING' : 'DONE') : 'ABSENT',
      first: r ? r.first : '-', last: r ? r.last : '-',
      hm: r ? r.hm : '-', late: r ? r.late : 0
    };
  });
  return { ok: true, date: s.date, time: s.time, tz: s.tz, board: board };
}

/** 기간 집계 / Range summary */
function adminRange(pin, from, to, name) {
  if (!adminCheck_(pin)) return { ok: false };
  const s = serverNow_();
  let rows = readLog_().filter(r => r.date >= from && r.date <= to);
  if (name) rows = rows.filter(r => r.name === name);
  const daily = buildSummary_(rows, s.epoch, s.date);

  const tot = {};
  daily.forEach(d => {
    if (!tot[d.name]) tot[d.name] = { name: d.name, days: 0, hours: 0, late: 0, over: 0, missing: 0 };
    tot[d.name].days    += 1;
    tot[d.name].hours   += d.hours;
    tot[d.name].late    += d.late > 0 ? 1 : 0;
    tot[d.name].over    += d.over;
    tot[d.name].missing += d.missing ? 1 : 0;
  });
  const totals = Object.keys(tot).map(k => {
    const t = tot[k];
    t.hours = Math.round(t.hours * 100) / 100;
    t.over  = Math.round(t.over * 100) / 100;
    return t;
  }).sort((a, b) => a.name.localeCompare(b.name));

  return { ok: true, daily: daily, totals: totals, from: from, to: to, tz: s.tz };
}

/** 직원 추가 / Add employee */
function adminAddEmployee(pin, name, en, empId) {
  if (!adminCheck_(pin)) return { ok: false };
  name = String(name || '').trim();
  if (!name) return { ok: false, code: 'EMPTY' };
  if (isValidEmployee_(name)) return { ok: false, code: 'DUP' };
  ss_().getSheetByName(SHEET_EMP).appendRow([name, en || name, empId || '', true]);
  return { ok: true };
}

/** 직원 비활성화 / Deactivate employee */
function adminDeactivate(pin, name) {
  if (!adminCheck_(pin)) return { ok: false };
  const sh = ss_().getSheetByName(SHEET_EMP);
  const v  = sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 1).getValues();
  for (let i = 0; i < v.length; i++) {
    if (String(v[i][0]).trim() === name) { sh.getRange(i + 2, 4).setValue(false); return { ok: true }; }
  }
  return { ok: false, code: 'NOT_FOUND' };
}

/** 관리자 수동 보정 (감사 로그로 사유 필수) / Manual correction with mandatory reason */
function adminCorrect(pin, name, date, type, hhmm, reason) {
  if (!adminCheck_(pin)) return { ok: false };
  if (!isValidEmployee_(name)) return { ok: false, code: 'NO_EMP' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))  return { ok: false, code: 'BAD_DATE' };
  if (!/^\d{2}:\d{2}$/.test(hhmm))        return { ok: false, code: 'BAD_TIME' };
  if (!String(reason || '').trim())       return { ok: false, code: 'NO_REASON' };

  const d = etToDate_(date, hhmm);
  const epoch = d.getTime();
  const sh = logSheet_();
  sh.appendRow([
    Utilities.getUuid().slice(0, 8).toUpperCase(), date,
    Utilities.formatDate(d, TZ, 'EEE'), name, String(type).toUpperCase(),
    hhmm + ':00', Utilities.formatDate(d, TZ, "yyyy-MM-dd'T'HH:mm:ssZ"), epoch,
    '[관리자 보정/Admin edit] ' + reason
  ]);
  SpreadsheetApp.flush();
  return { ok: true };
}

/* ============================================================
 * 8. 월간 리포트 시트 생성 / MONTHLY REPORT
 * ==========================================================*/

function createMonthlyReport() {
  const s    = serverNow_();
  const ym   = s.date.slice(0, 7);
  const rows = readLog_().filter(r => String(r.date).slice(0, 7) === ym);
  const res  = buildSummary_(rows, s.epoch, s.date);

  const ss   = ss_();
  const name = 'Report_' + ym;
  let sh = ss.getSheetByName(name);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(name);

  sh.getRange('A1:I1').setValues([[
    '날짜 (Date)', '요일 (Day)', '이름 (Name)', '출근 (In)', '퇴근 (Out)',
    '근무시간 (Hours)', '지각(분) (Late min)', '초과 (OT hrs)', '비고 (Note)'
  ]]);
  if (res.length) {
    sh.getRange(2, 1, res.length, 9).setValues(
      res.map(r => [r.date, r.day, r.name, r.first, r.last, r.hours, r.late, r.over,
                    r.missing ? '미퇴근 / Missing clock-out' : ''])
    );
  }
  sh.setFrozenRows(1);
  sh.getRange('A1:I1').setFontWeight('bold').setBackground('#e8eaed');
  sh.autoResizeColumns(1, 9);
  ss.setActiveSheet(sh);
  return name;
}
