/* =========================================================
   JGSAS v3.0
   모바일 단일 HTML 업무 자동화 앱
   - 기본 출발안내 원본 보호
   - 010 번호 전용 명단 추출 엔진
   - 여행일정 자동 인식 엔진 (v3 신규)
     · 문서 유형 판별 (travel_only / contacts_only / mixed / unknown)
     · Excel / PDF / Word 통합 추출
     · 여행정보 + 고객명단 분리 추출 및 자동 채움
     · 진단 로그 기록
   - 로컬 데이터 저장(localStorage)
   - Github 수동 배포/업데이트 전제
========================================================= */
function normalizeTravelInfoFromForm(){
  // depDate: 숫자와 "." 만 허용, ".." 이상 연속 점 → "." 1개로 정규화
  const rawDepDate = document.getElementById('depDate').value.trim();
  state.currentTravelInfo.depDate = rawDepDate
    .replace(/[^\d.]/g, '')   // 숫자·점 외 문자 제거
    .replace(/\.{2,}/g, '.');  // ".." 이상 → "."
  state.currentTravelInfo.destination = document.getElementById('destination').value.trim();
  state.currentTravelInfo.duration = normalizeDuration(document.getElementById('duration').value.trim());
  state.currentTravelInfo.agency = document.getElementById('agency').value.trim();
  state.currentTravelInfo.flightOut = document.getElementById('flightOut').value.trim();
  state.currentTravelInfo.flightIn = document.getElementById('flightIn').value.trim();
  state.currentTravelInfo.meetingTime = document.getElementById('meetingTime').value.trim();
  state.currentTravelInfo.meetingPlace = document.getElementById('meetingPlace').value.trim();
  state.currentTravelInfo.hotelName = document.getElementById('hotelName').value.trim();
  state.currentTravelInfo.hotelPhone = document.getElementById('hotelPhone').value.trim();
  state.currentTravelInfo.extraMemo = document.getElementById('extraMemo').value.trim();
  state.currentTravelInfo.weatherMin = (document.getElementById('weatherMin')?.value || '').trim();
  state.currentTravelInfo.weatherMax = (document.getElementById('weatherMax')?.value || '').trim();
  state.currentTravelInfo.weatherNotice = (document.getElementById('weatherNotice')?.value || '').trim();
}

function bindTravelInfoToForm(){
  const t = state.currentTravelInfo || {};
  document.getElementById('depDate').value = t.depDate || '';
  document.getElementById('destination').value = t.destination || '';
  document.getElementById('duration').value = t.duration || '';
  document.getElementById('agency').value = t.agency || '';
  document.getElementById('flightOut').value = t.flightOut || '';
  document.getElementById('flightIn').value = t.flightIn || '';
  document.getElementById('meetingTime').value = t.meetingTime || '';
  document.getElementById('meetingPlace').value = t.meetingPlace || '';
  document.getElementById('hotelName').value = t.hotelName || '';
  document.getElementById('hotelPhone').value = t.hotelPhone || '';
  document.getElementById('extraMemo').value = t.extraMemo || '';
  if(document.getElementById('weatherMin')) document.getElementById('weatherMin').value = t.weatherMin || '';
  if(document.getElementById('weatherMax')) document.getElementById('weatherMax').value = t.weatherMax || '';
  if(document.getElementById('weatherNotice')) document.getElementById('weatherNotice').value = t.weatherNotice || '';
}

function openGuideEdit(){
  document.getElementById('guideBox').classList.add('open');
  document.getElementById('guideEditBtn').style.display = 'none';
  document.getElementById('guideName').focus();
}

function saveGuideEdit(){
  syncGuideProfile();
  document.getElementById('guideBox').classList.remove('open');
  document.getElementById('guideEditBtn').style.display = '';
}

function bindGuideProfile(){
  document.getElementById('guideName').value = state.guideProfile.name || '';
  document.getElementById('guidePhone').value = state.guideProfile.phone || '';
  updateGuideInfoDisplay();
}

function syncGuideProfile(){
  state.guideProfile.name = document.getElementById('guideName').value.trim();
  state.guideProfile.phone = normalizePhone(document.getElementById('guidePhone').value.trim()) || document.getElementById('guidePhone').value.trim();
  document.getElementById('guidePhone').value = state.guideProfile.phone;
  saveState();
  renderSmsArea();
  updateGuideInfoDisplay();
}

function updateGuideInfoDisplay(){
  const name = state.guideProfile.name || '';
  const phone = state.guideProfile.phone || '';
  const emptyEl = document.getElementById('guideInfoEmpty');
  const nameEl  = document.getElementById('guideInfoName');
  const phoneEl = document.getElementById('guideInfoPhone');
  if(!name && !phone){
    emptyEl.style.display = ''; nameEl.style.display = 'none'; phoneEl.style.display = 'none';
  } else {
    emptyEl.style.display = 'none';
    nameEl.style.display  = name  ? '' : 'none';
    phoneEl.style.display = phone ? '' : 'none';
    nameEl.textContent  = name;
    phoneEl.textContent = formatPhone(phone);
  }
}

function switchTab(name, fromHistory){
  const currentActive = document.querySelector('.tab.active')?.dataset.tab;
  if(currentActive === name && !fromHistory) return;

  // 문자 탭 직접 클릭 시 여행정보 필수 입력 검증 (뒤로가기 복원 제외)
  if(name === 'sms' && !fromHistory){
    normalizeTravelInfoFromForm();
    const info = state.currentTravelInfo;
    const required = ['depDate','destination','duration','agency','flightOut','flightIn','meetingTime','meetingPlace','hotelName','hotelPhone','weatherMin','weatherMax','weatherNotice'];
    const missingFields = required.filter(f => !info[f]);
    if(missingFields.length){
      const labelMap = {
        depDate:'출발일', destination:'여행지', duration:'기간', agency:'여행사',
        flightOut:'출국편', flightIn:'귀국편', meetingTime:'미팅시간',
        meetingPlace:'미팅장소', hotelName:'호텔명', hotelPhone:'호텔전화',
        weatherMin:'최저기온', weatherMax:'최고기온', weatherNotice:'날씨안내'
      };
      const missingLabels = missingFields.map(f => labelMap[f] || f).join(', ');
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center';
      overlay.innerHTML = `<div style="background:#1e1e2e;border-radius:16px;padding:28px 24px;max-width:300px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.5)">
        <div style="color:#f87171;font-size:18px;font-weight:900;margin-bottom:10px;line-height:1.4">여행정보를<br>완성하세요</div>
        <div style="color:#94a3b8;font-size:12px;margin-bottom:18px;line-height:1.6">미입력: ${missingLabels}</div>
        <button style="background:#4f8ef7;color:#fff;border:none;border-radius:10px;padding:10px 32px;font-size:15px;font-weight:700;cursor:pointer" onclick="this.closest('div[style*=fixed]').remove()">확인</button>
      </div>`;
      document.body.appendChild(overlay);
      return;
    }
  }

  document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');

  if(name === 'sms') renderSmsArea();
  if(name === 'manage') renderManagePage();
  if(name === 'template') renderTemplatePage();

  if(!fromHistory) history.pushState({ tab: name }, '', '');
}

function normalizeDuration(v){ if(!v) return ''; return /^\d+$/.test(v) ? `${v}일` : v; }
function depDayOfWeek(dateStr){
  const m = String(dateStr || '').trim().match(/^(\d{1,2})[.\/-](\d{1,2})$/);
  if(!m) return '';

  const month = Number(m[1]);
  const day = Number(m[2]);

  if(month < 1 || month > 12 || day < 1 || day > 31) return '';

  const now = new Date();
  let year = now.getFullYear();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let candidate = new Date(year, month - 1, day);

  // 자동 보정된 잘못된 날짜 차단
  if(candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return '';

  if(candidate < today){
    year += 1;
    candidate = new Date(year, month - 1, day);

    if(candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return '';
  }

  return ['일','월','화','수','목','금','토'][candidate.getDay()] || '';
}
function buildGroupPreview(){
  normalizeTravelInfoFromForm();
  const t = state.currentTravelInfo;
  // 미리보기 표시 직전 ".." 방어 (저장 경로 외 우회 케이스 대비)
  const safeDepDate = (t.depDate || '').replace(/\.{2,}/g, '.');
  // 기간: "2박3일" → "3일", "4일" → "4일" (미리보기에서 일수만 표시)
  const durRaw = normalizeDuration(t.duration || '');
  const durPreview = durRaw.replace(/\d+박(\d+일)/, '$1');
  const preview = `${safeDepDate || '출발일'}${t.destination || '여행지'}${durPreview || '기간'}${t.agency || '여행사'}`;
  document.getElementById('groupPreview').textContent = preview;
  saveState();
}

function normalizeText(raw=''){
  return String(raw)
    .replace(/\r\n?/g,'\n')
    .replace(/\[H\]/g, '§H§')  // [H] 마커 보호 — 브라켓 제거 전 임시 치환
    .replace(/[\uff10-\uff19]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212\uff0d]/g,'-')
    .replace(/[\u00b7\u2022\u318d]/g,' ')
    .replace(/[|\uff5c]/g,' ')
    .replace(/[\uff0f]/g,'/')
    .replace(/[\u201c\u201d\u201e'`]/g,' ')
    .replace(/[()\[\]{}<>]/g,' ')
    .replace(/§H§/g, '[H]')    // [H] 마커 복원
    .replace(/\t/g,' ')
    .replace(/[ ]{2,}/g,' ')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

function normalizePhone(value){
  const digits = String(value||'').replace(/\D/g,'');
  return /^010\d{8}$/.test(digits) ? digits : null;
}

function formatPhone(digits){
  // 01012345678 → 010-1234-5678
  if(!digits) return '';
  const d = String(digits).replace(/\D/g,'');
  if(/^010\d{8}$/.test(d)) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
  return digits;
}

function findPhonesInText(text){
  // 구분자는 최대 1자(-,.,space)만 허용 → 오탐 방지
  const regex = /010[-.\s]?\d{4}[-.\s]?\d{4}/g;
  return [...text.matchAll(regex)].map(m => ({ raw:m[0], normalized: normalizePhone(m[0]), index:m.index || 0 })).filter(x => x.normalized);
}

function tokenizeNameCandidates(context){
  const cleaned = context
    .replace(/010[-.\s]?\d{4}[-.\s]?\d{4}/g,' ')
    .replace(/[0-9]/g,' ')
    .replace(/[\/,:;_\-]/g,' ')
    .replace(/[ ]{2,}/g,' ')
    .trim();
  const tokens = cleaned.match(/[가-힣A-Za-z]{2,12}/g) || [];
  return tokens.filter(token => !STOPWORDS.has(token) && !STOPWORDS.has(token.toUpperCase()));
}

function extractBestName(beforeText, afterText){
  const koreanPattern = /^[가-힣]{2,5}$/;
  // 한글 이름 우선 (바로 앞 토큰이 가장 신뢰도 높음)
  const beforeKor = tokenizeNameCandidates(beforeText).filter(t => koreanPattern.test(t));
  const afterKor  = tokenizeNameCandidates(afterText).filter(t => koreanPattern.test(t));
  const best = beforeKor.slice(-1)[0] || afterKor[0] || '';
  if(best) return { name: best, unconfirmed: false };

  // fallback: 한글 2~6자 또는 영문 대소문자 이름
  const fallbackBefore = tokenizeNameCandidates(beforeText).filter(t => /^[가-힣]{2,6}$/.test(t) || /^[A-Z][a-z]{1,9}$/.test(t));
  const fallbackAfter  = tokenizeNameCandidates(afterText).filter(t => /^[가-힣]{2,6}$/.test(t) || /^[A-Z][a-z]{1,9}$/.test(t));
  const fallback = fallbackBefore.slice(-1)[0] || fallbackAfter[0] || '';
  if(fallback) return { name: fallback, unconfirmed: true };
  return { name: '이름 미확인', unconfirmed: true };
}

function extractContactsFromText(rawText, source='text'){
  const text = normalizeText(rawText);
  const lines = text.split('\n').filter(Boolean);
  const map = new Map();
  const failures = [];

  const consumePhoneOccurrence = (line, fullText, offsetBase=0) => {
    const found = findPhonesInText(line);
    if(!found.length) return;
    found.forEach((phoneObj, idx) => {
      const normalized = phoneObj.normalized;
      if(!normalized) return;
      const absoluteIndex = offsetBase + phoneObj.index;
      // 컨텍스트 창 확대: 앞 30자 / 뒤 20자 → 한글 이름 추출률 향상
      const beforeText = fullText.slice(Math.max(0, absoluteIndex - 30), absoluteIndex);
      const afterText = fullText.slice(absoluteIndex + phoneObj.raw.length, absoluteIndex + phoneObj.raw.length + 20);
      const picked = extractBestName(beforeText, afterText);
      const extraPhones = found.slice(1).map(x => x.normalized).filter(Boolean).filter(x => x !== normalized);
      const noteBits = [];
      if(found.length > 1 && idx === 0) noteBits.push('한 줄에 010 번호 여러 개');
      if(picked.unconfirmed) noteBits.push('이름 검수 필요');
      const item = {
        id: uid('draft'),
        name: picked.name,
        phone: normalized,
        selected: true,
        duplicate: false,
        nameUnconfirmed: picked.unconfirmed,
        extraPhones,
        source,
        note: noteBits.join(' · ')
      };
      if(map.has(normalized)){
        const existing = map.get(normalized);
        existing.duplicate = true;
        existing.note = [existing.note, '중복 번호'].filter(Boolean).join(' · ');
      } else {
        map.set(normalized, item);
      }
    });
  };

  // 라인별 오프셋을 사전 계산 (indexOf 중복 매칭 버그 방지)
  let cursor = 0;
  const lineOffsets = text.split('\n').map(line => {
    const offset = cursor;
    cursor += line.length + 1; // +1 for '\n'
    return { line, offset };
  });
  lineOffsets.forEach(({ line, offset }) => {
    // [FIX] 쓰루가이드/스루가이드 포함 행은 명단 추출 제외 (가이드 번호 오염 방지)
    const GUIDE_SKIP_KEYWORDS = ['쓰루가이드','스루가이드','through guide','through-guide','가이드 정보','가    이    드','t/g','tg'];
    if(GUIDE_SKIP_KEYWORDS.some(kw => line.toLowerCase().includes(kw))) return;
    if(line && findPhonesInText(line).length){
      consumePhoneOccurrence(line, text, offset);
    }
  });

  if(map.size === 0 && text){
    findPhonesInText(text).forEach(p => {
      const beforeText = text.slice(Math.max(0, p.index - 30), p.index);
      const afterText = text.slice(p.index + p.raw.length, p.index + p.raw.length + 20);
      // [FIX] 가이드 번호 fallback 경로 유입 방지 — 앞뒤 컨텍스트에 가이드 키워드 포함 시 제외
      const context = beforeText + afterText;
      if(['쓰루가이드','스루가이드','through guide'].some(kw => context.toLowerCase().includes(kw))) return;
      const picked = extractBestName(beforeText, afterText);
      if(!map.has(p.normalized)){
        map.set(p.normalized, {
          id: uid('draft'), name:picked.name, phone:p.normalized, selected:true,
          duplicate:false, nameUnconfirmed:picked.unconfirmed, extraPhones:[], source,
          note:picked.unconfirmed ? '이름 검수 필요' : ''
        });
      }
    });
  }

  text.split('\n').forEach(line => {
    if(/010/.test(line) && !findPhonesInText(line).length){ failures.push(line.trim()); }
  });

  const result = [...map.values()];
  const seen = new Set();
  result.forEach(item => { if(seen.has(item.phone)) item.duplicate = true; seen.add(item.phone); });
  return { contacts: result, failures };
}

async function parseExcelFile(file){
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type:'array', cellText:false, cellDates:true });

  // 셀 값 정규화 (과학적 표기법 → 정수)
  function cellStr(v){
    const s = String(v == null ? '' : v);
    if(/^[\d.]+e\+?\d+$/i.test(s)){ try{ return String(Math.round(Number(s))); }catch(e){} }
    return s;
  }

  // ── 1단계: 컬럼 구조 기반 추출 시도 (가이드명단 시트 전용) ──────────────
  // '핸드폰번호' 또는 '연락처' 헤더가 있는 시트를 구조형으로 처리
  const PHONE_HEADERS = ['핸드폰번호','핸드폰','연락처','전화번호','휴대폰','mobile','phone'];
  const NAME_HEADERS  = ['한글명','한글이름','이름','성명','name','고객명','탑승객'];

  for(const sheetName of wb.SheetNames){
    // '확정서' 등 일정표 시트는 건너뜀 — 가이드 번호 오염 방지
    if(['확정서','일정표','schedule','itinerary'].some(k => sheetName.toLowerCase().includes(k))) continue;

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'', raw:false });

    // 헤더 행 탐색 (최대 10행 이내)
    let phoneCol = -1, nameCol = -1, headerRow = -1;
    for(let r = 0; r < Math.min(rows.length, 10); r++){
      const row = rows[r].map(v => cellStr(v).trim().toLowerCase());
      const pIdx = row.findIndex(c => PHONE_HEADERS.includes(c));
      const nIdx = row.findIndex(c => NAME_HEADERS.includes(c));
      if(pIdx >= 0){ phoneCol = pIdx; nameCol = nIdx; headerRow = r; break; }
    }
    if(phoneCol < 0) continue; // 이 시트는 구조형 아님 → 건너뜀

    // 헤더 다음 행부터 데이터 추출
    const EXCEL_GUIDE_KEYWORDS = ['가이드','t/g','tg','쓰루가이드','스루가이드'];
    const map = new Map();
    for(let r = headerRow + 1; r < rows.length; r++){
      const row = rows[r];
      const rawPhone = cellStr(row[phoneCol]).trim();
      const rawName  = nameCol >= 0 ? cellStr(row[nameCol]).trim() : '';

      // 이름 또는 행 내 셀에 가이드 키워드 포함 시 해당 행 건너뜀
      const rowTextLower = row.map(v => cellStr(v)).join(' ').toLowerCase();
      if(EXCEL_GUIDE_KEYWORDS.some(kw => rowTextLower.includes(kw))) continue;

      const phone = normalizePhone(rawPhone);
      const name  = (rawName && rawName !== '이름 미확인') ? rawName : '이름 미확인';
      const nameUnconfirmed = !rawName;
      const noteBits = [];
      if(nameUnconfirmed) noteBits.push('이름 검수 필요');

      if(phone){
        if(map.has(phone)){
          map.get(phone).duplicate = true;
          map.get(phone).note = [map.get(phone).note, '중복 번호'].filter(Boolean).join(' · ');
        } else {
          map.set(phone, { id:uid('draft'), name, phone, selected:true, duplicate:false,
            nameUnconfirmed, extraPhones:[], source:'excel', note:noteBits.join(' · ') });
        }
      } else if(rawName){
        // 번호 없는 탑승객 — 이름만 등록, 수동 입력 유도
        const fakeKey = `nophone-${r}`;
        map.set(fakeKey, { id:uid('draft'), name, phone:'', selected:false, duplicate:false,
          nameUnconfirmed:false, extraPhones:[], source:'excel', note:'번호 없음 · 직접 입력 필요' });
      }
    }
    if(map.size > 0){
      const contacts = [...map.values()];
      // rawText 수집: 일정표 시트 우선 → 확정서 → 나머지 순서로 조합 (여행정보 추출 정확도 향상)
      const SCHEDULE_KEYS = ['일정','일정표','schedule','itinerary','여행일정'];
      const CONFIRM_KEYS  = ['확정서','확정표','confirmation','수배'];
      const scheduleSheets = wb.SheetNames.filter(n => SCHEDULE_KEYS.some(k => n.toLowerCase().includes(k)));
      const confirmSheets  = wb.SheetNames.filter(n => CONFIRM_KEYS.some(k => n.toLowerCase().includes(k)));
      const otherSheets    = wb.SheetNames.filter(n =>
        !scheduleSheets.includes(n) && !confirmSheets.includes(n));
      const orderedSheets  = [...scheduleSheets, ...confirmSheets, ...otherSheets];
      let rawText = '';
      orderedSheets.forEach(n => {
        const s = wb.Sheets[n];
        const rs = XLSX.utils.sheet_to_json(s, { header:1, defval:'', raw:false });
        rawText += rs.map(r => r.map(cellStr).join('\t')).join('\n') + '\n';
      });
      return { contacts, failures:[], rawText };
    }
  }

  // ── 2단계: 구조형 시트 없으면 기존 텍스트 방식 fallback ──────────────────
  // rawText 조합: 일정표 시트 우선 → 확정서 → 나머지 순서 (여행정보 추출 정확도 향상)
  const SCHEDULE_KEYS = ['일정','일정표','schedule','itinerary','여행일정'];
  const CONFIRM_KEYS  = ['확정서','확정표','confirmation','수배'];
  const scheduleSheets = wb.SheetNames.filter(n => SCHEDULE_KEYS.some(k => n.toLowerCase().includes(k)));
  const confirmSheets  = wb.SheetNames.filter(n => CONFIRM_KEYS.some(k => n.toLowerCase().includes(k)));
  const otherSheets    = wb.SheetNames.filter(n =>
    !scheduleSheets.includes(n) && !confirmSheets.includes(n));
  const orderedSheets  = [...scheduleSheets, ...confirmSheets, ...otherSheets];

  let text = '';
  let rawText = '';
  orderedSheets.forEach(name => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'', raw:false });
    const sheetStr = rows.map(r => r.map(cellStr).join('\t')).join('\n') + '\n';
    rawText += sheetStr;
    if(['확정서','일정표','schedule','itinerary'].some(k => name.toLowerCase().includes(k))) return;
    text += rows.map(r => r.map(cellStr).join(' ')).join('\n') + '\n';
  });
  const result = extractContactsFromText(text, 'excel');
  return { ...result, rawText };
}

/* =========================================================
   여행일정 자동 인식 엔진 v3
   ─ 문서 유형 판별 → 여행정보 추출 → 고객명단 추출
   ─ 정규화 → 기존 UI 반영 → 진단 로그 기록
========================================================= */

// ── 여행사 문서 추출 프롬프트 내장 상수 ──────────────────
const PROMPT_TRAVEL_DOC_EXTRACTION = `
[Goal] 업로드된 여행사 문서를 분석하여 문서 유형을 판정하고,
여행정보와 고객명단을 추출하여 기존 시스템 입력용 구조화 데이터로 변환한다.
[Constraints]
1. 문서에 근거한 정보만 사용한다. 외부 상식으로 보정하지 않는다.
2. 값이 없으면 빈 문자열 또는 빈 배열을 사용한다.
3. 여행정보와 고객명단을 분리해서 출력한다.
4. 표 안의 텍스트를 반드시 읽는다.
5. JSON 외 다른 설명은 출력하지 않는다.
[DocumentTypeLabels] travel_only | contacts_only | mixed | unknown
[TravelFields] depDate destination duration agency flightOut flightIn meetingTime meetingPlace hotelName hotelPhone extraMemo
[ContactFields] name phone memo
[Process]
STEP1. 문서 유형 판정
STEP2. travel_only/mixed → 여행정보 추출
STEP3. contacts_only/mixed → 고객명단 추출
STEP4. 추출 실패 항목은 빈 값 유지
STEP5. JSON으로만 출력
`;

// ── 여행정보 신호 키워드 ──────────────────────────────
const TRAVEL_SIGNALS = [
  '출발일','출발일자','일정','여행일정','여행기간','여행지','목적지',
  '항공편','출국편','귀국편','미팅','집합','공항','호텔','숙박',
  '확정서','출발안내','여행사','투어','인솔','가이드'
];
// ── 고객명단 신호 키워드 ──────────────────────────────
const CONTACT_SIGNALS = [
  '고객명단','명단','성명','이름','연락처','휴대폰','010','pax',
  'passenger','인원','룸조인','대표자','탑승객','여행자'
];

/* ══════════════════════════════════════════════════════════
   템플릿 기반 추출 엔진 v1.0
   Phase 2: 로더 + 캐시
   Phase 3: 매칭 + 추출 함수 6종
═══════════════════════════════════════════════════════════ */

let _templateCache = null;
let _templateLoadPromise = null;
const TEMPLATE_CONFIDENCE_THRESHOLD = 0.4;

const JP_DESTINATIONS_FOR_ENGINE = [
  '도쿄','오사카','교토','홋카이도','후쿠오카','오키나와','나고야','삿포로',
  '요나고','마쓰야마','히로시마','가고시마','나리타','간사이','오이타','벳푸',
  '유후인','기후','하코다테','센다이','니가타','나가사키','구마모토','도치기',
  '닛코','아키타','아오모리','모리오카','야마가타','후쿠시마','미야기','이와테'
];

async function loadExtractionTemplates(){
  if(_templateCache !== null) return _templateCache;
  if(_templateLoadPromise) return _templateLoadPromise;
  _templateLoadPromise = fetch('./templates.json')
    .then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      _templateCache = Array.isArray(data.templates) ? data.templates : [];
      console.info('[JGSAS] 템플릿 엔진: 로드 완료 (', _templateCache.length, '개)');
      return _templateCache;
    })
    .catch(err => {
      // L1/L2: 네트워크 오류 또는 JSON 파싱 오류 → 빈 배열 = fallback 신호
      console.warn('[JGSAS] templates.json 로드 실패 — 하드코딩 fallback 사용', err);
      _templateCache = [];
      return _templateCache;
    });
  return _templateLoadPromise;
}

function matchTemplate(templates, normalizedText){
  if(!templates || templates.length === 0) return null;
  const lowerText = normalizedText.toLowerCase();
  let best = null;
  let bestScore = -1;
  for(const tmpl of templates){
    const detect = tmpl.detect;
    if(!detect || !Array.isArray(detect.keywords)) continue;
    const minMatches = detect.minMatches || 1;
    let matched = 0;
    for(const kw of detect.keywords){
      if(lowerText.includes(kw.toLowerCase())) matched++;
    }
    if(matched < minMatches) continue;
    const confidence = matched / detect.keywords.length;
    const combinedScore = (tmpl.priority || 0) + confidence * 10;
    if(combinedScore > bestScore){
      bestScore = combinedScore;
      best = { template: tmpl, confidence, matchedKeywords: matched };
    }
  }
  return best;
}

function applyFieldPattern(line, patternStr){
  try{
    const regex = new RegExp(patternStr, 'i');
    const m = line.match(regex);
    if(!m) return null;
    return m[1] !== undefined ? m[1] : m[0];
  }catch(err){
    // L5: 개별 패턴 컴파일 오류 → 해당 패턴 스킵
    console.warn('[JGSAS] 패턴 컴파일 오류 (L5 skip):', patternStr, err.message);
    return null;
  }
}

function applyTransform(value, transformKey){
  if(!value) return '';
  const v = String(value).trim();
  if(!transformKey) return v;
  if(transformKey.startsWith('literal:')) return transformKey.slice(8);
  switch(transformKey){
    case 'dateNormalize':{
      const m1 = v.match(/^(\d{1,2})[\/\-](\d{1,2})/);
      if(m1) return `${parseInt(m1[1],10)}.${parseInt(m1[2],10)}`;
      const m2 = v.match(/(\d{1,2})월\s*(\d{1,2})일/);
      if(m2) return `${parseInt(m2[1],10)}.${parseInt(m2[2],10)}`;
      const m3 = v.match(/^(\d{2})-(\d{2})$/);
      if(m3) return `${parseInt(m3[1],10)}.${parseInt(m3[2],10)}`;
      return v;
    }
    case 'timeNormalize':{
      if(/^\d{1,2}:\d{2}$/.test(v)){
        const h = parseInt(v.split(':')[0], 10);
        const mm = v.split(':')[1];
        const ampm = h < 12 ? '오전' : '오후';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${ampm} ${String(h12).padStart(2,'0')}:${mm}`;
      }
      return v;
    }
    case 'flightNormalize':
      return v.replace(/\s/g,'').toUpperCase();
    case 'hotelNameClean':{
      let name = v.replace(/[\s\-]*[A-Za-z]?\.?[\s\-]*[\d]{3,}[\d\-\s]*$/,'').trim();
      name = name.replace(/\s+[A-Za-z]{1,3}\.?\s*$/,'').trim();
      return name.slice(0,50);
    }
    case 'durationNormalize':
      return v.replace(/\s/g,'');
    case 'trimFirst':
      return v.split(/\s{2,}/)[0].slice(0,20);
    case 'trimSlice30':
      return v.slice(0,30);
    case 'trimSlice60':
      return v.slice(0,60);
    case 'trim':
    default:
      return v;
  }
}

function applyKnownValues(text, knownValues){
  if(!Array.isArray(knownValues)) return null;
  for(const val of knownValues){
    if(text.includes(val)) return val;
  }
  return null;
}

function applyEngineFallback(fallbackKey, lines, fullText){
  switch(fallbackKey){
    case 'jpDestinationScan':
      for(const dest of JP_DESTINATIONS_FOR_ENGINE){
        if(fullText.includes(dest)) return dest;
      }
      return null;
    case 'durationFromRange':{
      for(const line of lines){
        const m = line.match(/(?:행사기간|여행기간)[^\d]*\d{4}\s+(\d{1,2})[\/\-](\d{1,2})\s*[~\-～]\s*(\d{1,2})[\/\-](\d{1,2})/i);
        if(m){
          const year = new Date().getFullYear();
          const diffMs = new Date(year, parseInt(m[3],10)-1, parseInt(m[4],10))
                       - new Date(year, parseInt(m[1],10)-1, parseInt(m[2],10));
          const totalDays = Math.round(diffMs/86400000) + 1;
          const nights = totalDays - 1;
          if(totalDays > 0 && totalDays <= 30){
            return nights > 0 ? `${nights}박${totalDays}일` : `${totalDays}일`;
          }
        }
      }
      const dayNums = [...fullText.matchAll(/제\s*([2-9])\s*일/g)].map(m2 => parseInt(m2[1],10));
      if(dayNums.length > 0){
        const maxDay = Math.max(...dayNums);
        if(maxDay >= 2 && maxDay <= 14) return `${maxDay-1}박${maxDay}일`;
      }
      return null;
    }
    default:
      return null;
  }
}

function extractFieldFromTemplate(lines, fullText, fieldDef){
  // 1. knownValues 직접 매칭 (우선순위 최고)
  if(fieldDef.knownValues){
    const found = applyKnownValues(fullText, fieldDef.knownValues);
    if(found) return applyTransform(found, fieldDef.transform);
  }
  // 2. 패턴 줄별 순서대로 시도
  if(Array.isArray(fieldDef.patterns)){
    for(const patternStr of fieldDef.patterns){
      for(const line of lines){
        const raw = applyFieldPattern(line, patternStr);
        if(raw && raw.trim()) return applyTransform(raw, fieldDef.transform);
      }
    }
  }
  // 3. fallback 함수 호출
  if(fieldDef.fallback){
    const raw = applyEngineFallback(fieldDef.fallback, lines, fullText);
    if(raw) return applyTransform(raw, fieldDef.transform);
  }
  return null;
}

function extractByTemplate(template, normalizedText, allTemplates){
  // inherits 처리 (1단계)
  let fields = {};
  if(template.inherits){
    const parent = (allTemplates || []).find(t => t.id === template.inherits);
    if(parent && parent.fields) fields = {...parent.fields};
  }
  if(template.fields) fields = {...fields, ...template.fields};

  const lines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean);
  const result = {
    depDate:'', destination:'', duration:'', agency:'',
    flightOut:'', flightIn:'', meetingTime:'', meetingPlace:'',
    hotelName:'', hotelPhone:'', extraMemo:''
  };
  const matchedPatterns = {};

  for(const [fieldKey, fieldDef] of Object.entries(fields)){
    if(!(fieldKey in result)) continue;
    const extracted = extractFieldFromTemplate(lines, normalizedText, fieldDef);
    if(extracted){
      result[fieldKey] = extracted;
      matchedPatterns[fieldKey] = fieldDef.knownValues ? 'knownValues' : 'patterns';
    }
  }
  return { result, matchedPatterns };
}

async function extractTravelInfoByTemplate(rawText){
  // L1/L2: 로드 실패 시 _templateCache=[] → length===0 분기로 null 반환
  const templates = await loadExtractionTemplates();
  if(templates.length === 0) return null;

  const normalizedText = normalizeText(rawText);
  const matchResult = matchTemplate(templates, normalizedText);

  // L3: 매칭 템플릿 없음
  if(!matchResult){
    console.warn('[JGSAS] 템플릿 미매칭 — 하드코딩 fallback 예정');
    return null;
  }

  const { template, confidence } = matchResult;
  const baseReturn = {
    templateId: template.id,
    templateName: template.name,
    confidence,
    result: null,
    matchedPatterns: {}
  };

  // L4: 신뢰도 임계값 미달 → templateId는 반환하되 result=null (fallback 신호)
  if(confidence < TEMPLATE_CONFIDENCE_THRESHOLD){
    console.warn('[JGSAS] 신뢰도 미달', confidence.toFixed(2), '< threshold', TEMPLATE_CONFIDENCE_THRESHOLD);
    return baseReturn;
  }

  console.info('[JGSAS] 템플릿 매칭:', template.id, `(${template.name})`, `신뢰도 ${(confidence*100).toFixed(0)}%`);

  // 유효 추출 필드가 없으면 (연락처 전용 템플릿) result=null
  const effectiveFields = {
    ...(template.inherits ? ((templates.find(t => t.id === template.inherits) || {}).fields || {}) : {}),
    ...(template.fields || {})
  };
  if(Object.keys(effectiveFields).length === 0){
    return baseReturn;
  }

  const { result, matchedPatterns } = extractByTemplate(template, normalizedText, templates);
  return { ...baseReturn, result, matchedPatterns };
}

/* ── STEP1: 문서 유형 판별 ──────────────────────────── */
function detectTravelDocumentType(rawText, fileType){
  const text = rawText.toLowerCase();
  let travelScore = 0;
  let contactScore = 0;
  TRAVEL_SIGNALS.forEach(kw => { if(text.includes(kw.toLowerCase())) travelScore++; });
  CONTACT_SIGNALS.forEach(kw => { if(text.includes(kw.toLowerCase())) contactScore++; });
  // 010 번호 존재 → 명단 점수 가중치
  const phoneMatches = (rawText.match(/010[-.\s]?\d{4}[-.\s]?\d{4}/g) || []).length;
  if(phoneMatches >= 2) contactScore += 3;
  if(phoneMatches >= 5) contactScore += 2;

  let docType;
  if(travelScore >= 2 && contactScore >= 2) docType = 'mixed';
  else if(travelScore >= 2 && contactScore < 2) docType = 'travel_only';
  else if(travelScore < 2 && contactScore >= 2) docType = 'contacts_only';
  else docType = 'unknown';

  return { docType, travelScore, contactScore, phoneMatches };
}

/* ── STEP2: 여행정보 추출 (raw) ──────────────────────── */
function extractTravelInfo(rawText){
  const text = normalizeText(rawText);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 각 필드별 패턴 매핑
  const result = {
    depDate:'', destination:'', duration:'', agency:'',
    flightOut:'', flightIn:'', meetingTime:'', meetingPlace:'',
    hotelName:'', hotelPhone:'', extraMemo:''
  };

  // [추가] 1일차 컨텍스트 추적 변수 (출국편/귀국편 맥락 기반 추출용)
  // ※ 항공편 패턴을 [A-Z0-9]{2}\d{3,4} 로 지정 — '7C' 같은 숫자+대문자 코드 포함
  let inFirstDay = false;
  let lastSeenFlight = '';

  // 출발일 추출 (우선순위: 명시적 라벨 > 행사기간 > 제1일 옆 datetime > 기타 datetime > 날짜 패턴)
  // [FIX] Excel datetime 직렬화 값(예: "2026-03-14 00:00:00") 및 행사기간 패턴 추가
  let _prev1il = false;
  let _prevFromEmpty = false;
  for(const line of lines){
    // [FIX] "기간 1/14/26 ..." — 엑셀 '기간' 셀 + XLSX.js M/D/YY 직렬화 패턴
    if(!result.depDate){
      const m = line.match(/^기간\s+(\d{1,2})\/(\d{1,2})\/\d{2,4}/);
      if(m) result.depDate = `${parseInt(m[1],10)}.${parseInt(m[2],10)}`;
    }
    // [FIX] PDF 테이블: "제1일 4/20 (월) ..." 동일 줄에 날짜 포함 패턴
    if(!result.depDate){
      const m = line.match(/(?:제\s*1\s*일|1일차)[^\d]*(\d{1,2})\/(\d{1,2})/);
      if(m) result.depDate = `${parseInt(m[1],10)}.${parseInt(m[2],10)}`;
    }
    // [FIX] 제1일 다음 행 M/D 또는 M/D/YY — "제1일" 행 다음줄에 날짜만 단독 기재된 경우
    if(!result.depDate && _prev1il){
      const m = line.match(/^(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?[\s\t]/) ||
                line.match(/^(\d{1,2})\/(\d{1,2})(\s*\([월화수목금토일]\))?$/);
      if(m && parseInt(m[2],10) !== 0) result.depDate = `${parseInt(m[1],10)}.${parseInt(m[2],10)}`;
    }
    if(!result.depDate){
      const m = line.match(/(?:출발일[자:\s]*|출발:\s*|일정:\s*)(\d{1,2}[.\/-]\d{1,2})/);
      if(m) result.depDate = m[1].replace(/\//,'.').replace(/-/,'.');
    }
    // [FIX] 행사기간 "03/14 ~ 03/17" 에서 출발일 추출 (가장 신뢰성 높음)
    if(!result.depDate){
      const m = line.match(/(?:행사기간|여행기간)[^\d]*(?:\d{4}\s+)?(\d{1,2})[\/\-](\d{1,2})\s*[~\-～]/i);
      if(m) result.depDate = `${parseInt(m[1],10)}.${parseInt(m[2],10)}`;
    }
    // [FIX] "제1일" 행 또는 인접행의 datetime "2026-MM-DD" 파싱
    if(!result.depDate){
      const m = line.match(/\b\d{4}-(\d{2})-(\d{2})(?:\s+\d{2}:\d{2}:\d{2})?/);
      // 같은 행에 "제1일","일자","일정","출발" 등 맥락 단어가 있을 때만 채택
      // 수신/발신 문서작성일 오탐 방지: "수신","일자","팩스" 단독 라인 제외
      if(m && /제1일|일정|출발|행사|도착/.test(line) && !/수신|발신|팩스|작성/.test(line)){
        result.depDate = `${parseInt(m[1],10)}.${parseInt(m[2],10)}`;
      }
    }
    if(!result.depDate){
      // [FIX] DATE:/발신일/작성일/수신일 포함 행은 문서 작성일이므로 제외
      const m = !/DATE:|발신일|작성일|수신일/i.test(line) && line.match(/(\d{1,2}월\s*\d{1,2}일)/);
      if(m){
        const inner = m[1].replace(/[월\s]/g,'.').replace(/일/,'');
        result.depDate = inner.replace(/\.$/,'');
      }
    }
    // 여행지 추출
    if(!result.destination){
      const m = line.match(/(?:여행지|목적지|행선지)[:\s　]+([가-힣A-Za-z\s]+)/);
      if(m) result.destination = m[1].trim().split(/\s{2,}/)[0].slice(0,20);
    }
    // 기간 추출
    if(!result.duration){
      const m = line.match(/(?:기간|여행기간|일정)\s*[:\s　]*(\d+박\s*\d+일|\d+일|\d+N\d+D)/i);
      if(m) result.duration = m[1].replace(/\s/g,'');
    }
    if(!result.duration){
      const m = line.match(/(\d+박\s*\d+일|\d+일간)/);
      if(m) result.duration = m[1].replace(/\s/g,'');
    }
    // [FIX] 행사기간 날짜 범위에서 기간 자동 계산: "03/14 ~ 03/17" → "3박4일"
    // 여행 총 일수 = 종료일 - 시작일 + 1 (출발일 포함), 박수 = 총일수 - 1
    if(!result.duration){
      const m = line.match(/(?:행사기간|여행기간)[^\d]*\d{4}\s+(\d{1,2})[\/\-](\d{1,2})\s*[~\-～]\s*(\d{1,2})[\/\-](\d{1,2})/i);
      if(m){
        const startMon=parseInt(m[1],10), startDay=parseInt(m[2],10);
        const endMon=parseInt(m[3],10),   endDay=parseInt(m[4],10);
        const year = new Date().getFullYear();
        const diffMs = new Date(year,endMon-1,endDay) - new Date(year,startMon-1,startDay);
        const diffDays = Math.round(diffMs/86400000); // 날짜 차이
        const totalDays = diffDays + 1; // 여행 총 일수 (출발~도착 포함)
        const nights = totalDays - 1;
        if(totalDays > 0 && totalDays <= 30){
          result.duration = nights > 0 ? `${nights}박${totalDays}일` : `${totalDays}일`;
        }
      }
    }
    // 여행사 추출 — ①알려진 여행사 목록 → ②ATTN/수신 키워드 → ③FROM 다음 줄 → ④기존 키워드 순 우선순위
    // ② FROM: 다음 줄에 "여행사명 / 담당자" 형식이 오면 '/' 앞을 여행사명으로 채택
    if(!result.agency && _prevFromEmpty && line.includes('/')){
      const agencyCandidate = line.split('/')[0].trim();
      if(agencyCandidate.length > 1 && agencyCandidate.length <= 30) result.agency = agencyCandidate;
    }
    if(!result.agency){
      // ① 알려진 국내 여행사 목록 직접 매칭 (가장 정확)
      const KNOWN_AGENCIES = /하나투어|모두투어|노랑풍선|참좋은여행|롯데관광개발|롯데관광|교원투어|한진관광|레드캡투어|세중여행|세중|현대드림투어|SM\s*C&C|인터파크트리플|인터파크투어|마이리얼트립|온라인투어|야놀자|여기어때|타이드스퀘어|땡처리닷컴|웹투어|트립닷컴|아고다|부킹닷컴|익스피디아|호텔스닷컴|클룩|KKday|내일투어|내일여행|여행박사|혜초여행|팜투어|허니문리조트|샬레트래블|트레바리|유니드파트너스|국일여행사|온누리투어|자유투어|투어2000|롯데JTB|세계로여행|CJ투어|갤럭시아투어|참투어|우리투어|KRT|진에어투어|제주항공투어/;
      const m1 = line.match(KNOWN_AGENCIES);
      if(m1) result.agency = m1[0].trim();
    }
    if(!result.agency){
      // ② ATTN / 수신 / TO 키워드 뒤 값 추출 — '/' 앞까지만 취함
      const m2 = line.match(/(?:ATTN|수신|TO)\s*:?\s*([가-힣A-Za-z0-9\s&]+?)(?:\s*\/|\s*담당|\s*부서|\s*과장|\s*팀장|\s*이사|$)/i);
      if(m2) result.agency = m2[1].trim().slice(0,30);
    }
    if(!result.agency){
      // ③ 기존 키워드 방식 유지 (여행사: / 주관: / 담당:)
      const m3 = line.match(/(?:여행사|주관|담당)[:\s　]+([가-힣A-Za-z0-9\s]+)/);
      if(m3) result.agency = m3[1].trim().split(/\s{2,}/)[0].slice(0,30);
    }
    // 항공편 출국 추출
    if(!result.flightOut){
      const m = line.match(/(?:출국편|출국항공|출발편|항공편)[:\s　]*([A-Z]{2}\s*\d{3,4}[A-Z]?)/i);
      if(m) result.flightOut = m[1].replace(/\s/g,'').toUpperCase();
    }
    if(!result.flightOut){
      // BUG-08 FIX: | 분기 우측 대안 매칭 시 m[1]이 undefined → TypeError 방어
      // 한국/인천 출발 괄호 표기를 단일 패턴으로 통합
      const m = line.match(/([A-Z]{2}\d{3,4})\s*[\(（][^)]*(?:한국|인천)\s*출발/i);
      if(m && m[1]) result.flightOut = m[1].toUpperCase();
    }
    // 귀국편 추출
    if(!result.flightIn){
      const m = line.match(/(?:귀국편|귀국항공|귀국)[:\s　]*([A-Z]{2}\s*\d{3,4}[A-Z]?)/i);
      if(m) result.flightIn = m[1].replace(/\s/g,'').toUpperCase();
    }
    // 미팅시간 추출
    if(!result.meetingTime){
      const m = line.match(/(?:미팅|집합|모임|집결|가이드\s*미팅)[^\d]*(\d{1,2}:\d{2}|\d{1,2}시\s*\d{0,2}분?)/);
      if(m){
        const raw = m[1];
        if(/^\d{1,2}:\d{2}$/.test(raw)){
          const h = parseInt(raw.split(':')[0], 10);
          const mm = raw.split(':')[1];
          const ampm = h < 12 ? '오전' : '오후';
          const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
          result.meetingTime = `${ampm} ${String(h12).padStart(2,'0')}:${mm}`;
        } else {
          result.meetingTime = raw;
        }
      }
    }
    // 방안A: 집결 키워드 뒤 날짜(M/D)가 끼어있어도 시간 추출 (.*?로 날짜 건너뜀)
    if(!result.meetingTime){
      const m = line.match(/(?:미팅|집합|모임|집결|가이드\s*미팅).*?(\d{1,2}:\d{2})(?!\d)/);
      if(m){
        const raw = m[1];
        const h = parseInt(raw.split(':')[0], 10);
        const mm = raw.split(':')[1];
        const ampm = h < 12 ? '오전' : '오후';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        result.meetingTime = `${ampm} ${String(h12).padStart(2,'0')}:${mm}`;
      }
    }
    // 방안A: 미팅장소 — 집결 키워드 + 날짜 포함 셀에서 공항명 이후 텍스트 추출
    if(!result.meetingPlace){
      const airportNames = '인천국제공항|인천 국제공항|인천공항|김포공항|김해국제공항|김해 국제공항|김해공항|제주국제공항|제주 국제공항|제주공항|청주공항|대구공항|광주공항|무안공항';
      const m = line.match(new RegExp('(?:미팅|집합|모임|집결|가이드\\s*미팅).*?((?:' + airportNames + ')[가-힣A-Za-z0-9\\s\\-·/()]+)'));
      if(m) result.meetingPlace = m[1].trim().slice(0,60);
    }
    // 미팅장소 추출
    if(!result.meetingPlace){
      const m = line.match(/(?:미팅장소|집합장소|집합위치|만남위치|집결장소|가이드\s*미팅)[:\s　]+([가-힣A-Za-z0-9\s\-·]+)/);
      if(m) result.meetingPlace = m[1].trim().slice(0,60);
    }
    if(!result.meetingPlace){
      const airportPat = /(?:인천국제공항|인천 국제공항|인천공항|김포공항|김해국제공항|김해 국제공항|김해공항|제주국제공항|제주 국제공항|제주공항|청주공항|대구공항|광주공항|무안공항)/;
      if(airportPat.test(line) && line.length < 80) result.meetingPlace = line.trim().slice(0,60);
    }
    if(!result.meetingPlace){
      const m = line.match(/(?:터미널|카운터|게이트|청사)\s*([A-Z]?\d*[A-Z]?)/i);
      if(m && line.length < 80) result.meetingPlace = line.trim().slice(0,60);
    }
    // 호텔명 추출 (1일차 우선 처리는 후처리에서)
    // [FIX] "[H] 노쿠호텔 오사카 (T.xxx)" 패턴 — 정규화 후 ()가 제거되므로 T./슬래시도 종결자로 처리
    if(!result.hotelName){
      const mH = line.match(/^\[H\]\s*([가-힣A-Za-z0-9\s\-·]+?)(?:\s+T\.\s*\d|\s*\/|\s*[\(\（]|$)/);
      if(mH && mH[1].trim().length > 1) result.hotelName = mH[1].trim().slice(0,50);
    }
    // [FIX] "호텔: 평성관(전화)" 패턴 — 호텔명이 호텔 뒤에 오는 코론 형태 우선 처리
    if(!result.hotelName){
      // 패턴A: "호텔: 평성관(전화번호)" or "호텔: 노보리벳츠 미야비테이 (전화번호)"
      const mA = line.match(/호텔\s*:\s*([가-힣A-Za-z0-9\s\-·\.]+?)(?:\s*[\(\（][\d\-]+[\)\）]|$)/);
      if(mA && mA[1].trim().length > 1){
        // [FIX] normalizeText 후 괄호 제거로 전화번호가 붙어오는 경우 제거
        let name = mA[1].trim().replace(/[\s\-]*[A-Za-z]?\.?[\s\-]*[\d]{3,}[\d\-\s]*$/, '').trim();
        name = name.replace(/\s+[A-Za-z]{1,3}\.?\s*$/, '').trim();
        if(name.length > 1) result.hotelName = name.slice(0,50);
      }
    }
    if(!result.hotelName){
      // 패턴B: "호텔명" 키워드 이후 값
      const mB = line.match(/(?:호텔명|hotel\s*name)[:\s　]*([가-힣A-Za-z0-9\s\-·]+)/i);
      if(mB) result.hotelName = mB[1].trim().slice(0,50);
    }
    if(!result.hotelName){
      // 패턴C: 기존 패턴 (호텔/hotel 키워드 + 뒤에 호텔류 단어로 끝나는 것)
      // [FIX] "호텔로", "호텔식", "호텔 조식" 등 기능어 오탐 방지 — 호텔 뒤 조사/기능어 제외
      const mC = line.match(/(?<!로|식|에|의|에서|에게|부터|까지)\b(?:호텔|hotel)\s*(?:명|이름)?[:\s　]*([가-힣A-Za-z0-9\s\-·]+(?:호텔|hotel|inn|resort|palace))/i);
      if(mC) result.hotelName = mC[1].trim().slice(0,50);
    }
    // 호텔 전화 추출
    if(!result.hotelPhone){
      const m = line.match(/(?:호텔\s*(?:전화|연락처|TEL|tel))[:\s　]*([+\d\-\s()]{7,25})/);
      if(m) result.hotelPhone = m[1].trim();
    }
    // [FIX] "호텔: 평성관(0138-59-2335)" 형식에서 전화번호 추출
    if(!result.hotelPhone){
      const mHotelColon = line.match(/호텔\s*:\s*[가-힣A-Za-z0-9\s\-·\.]+?[\(\（]([\d\-]{7,20})[\)\）]/);
      if(mHotelColon) result.hotelPhone = mHotelColon[1].trim();
    }
    if(!result.hotelPhone){
      const m = line.match(/(?:\+81|0\d{1,4}[-)\s]?\d{2,4}[-\s]?\d{3,4})/);
      if(m && /호텔|Hotel|宿泊/i.test(line)) result.hotelPhone = m[0].trim();
    }
    // [추가] 1일차 구간 진입/종료 감지 (1일차·Day1·제1일·첫째날 등 다양한 표기 포함)
    if(/^[\s\[]*(?:1일차?|day\s*1|1日目|first\s*day|첫째\s*날|제\s*1\s*일)/i.test(line)) { inFirstDay = true; }
    if(/^[\s\[]*(?:[2-9]\d*일차?|day\s*[2-9]|[2-9]日目|둘째\s*날|제\s*[2-9]\s*일)/i.test(line)) { inFirstDay = false; }

    // [추가] 항공편 코드 추적 — [A-Z0-9]{2}\d{3,4} : '7C','OZ','KE' 등 숫자+대문자 코드 모두 포함
    // normalizeText 후 탭→공백이므로 \b 대신 앞뒤 비코드문자 경계 사용
    const anyFlightMatch = line.match(/(?<![A-Z0-9])([A-Z0-9]{2}\d{3,4})(?!\d)/);
    if(anyFlightMatch) lastSeenFlight = anyFlightMatch[1];

    // [추가] 출국편: 1일차 구간 첫 항공편 (기존 패턴 실패 시 보완)
    if(!result.flightOut && inFirstDay && anyFlightMatch) {
      result.flightOut = anyFlightMatch[1].toUpperCase();
    }

    // [추가] 귀국편: 해산/인천도착 키워드 행 직전 항공편 (기존 패턴 실패 시 보완)
    // '해산물' 오탐 방지: 해산(?!물) 부정 전방탐색 사용
    if(!result.flightIn && /해산(?!물)|인천.{0,15}도착|김포.{0,15}도착/.test(line) && lastSeenFlight) {
      result.flightIn = lastSeenFlight.toUpperCase();
    }
    // [FIX] 제1일 여부 추적 — 패턴B(제1일 다음행 M/D) 사용
    _prev1il = /^제\s*1\s*일|^1일차/.test(line);
    // FROM: 다음 줄 여행사명 처리용 플래그
    _prevFromEmpty = /^FROM\s*:\s*$/i.test(line);
  }

  // 여행지 보완: 일본 주요 지명 키워드 스캔 (문서 기반만)
  if(!result.destination){
    const JP_DESTINATIONS = [
      '도쿄','오사카','교토','홋카이도','후쿠오카','오키나와','나고야','삿포로',
      '요나고','마쓰야마','히로시마','가고시마','나리타','간사이','오이타','벳푸',
      '유후인','기후','하코다테','센다이','니가타','나가사키','구마모토','도치기',
      '닛코','아키타','아오모리','모리오카','야마가타','후쿠시마','미야기','이와테',
      '시코쿠','규슈','주부','도호쿠','도호쿠'
    ];
    for(const dest of JP_DESTINATIONS){
      if(rawText.includes(dest)){ result.destination = dest; break; }
    }
  }

  // 기간 보완: "제N일" 패턴에서 총 일수 추론 (확정서 테이블 형식)
  if(!result.duration){
    const dayNums = [...rawText.matchAll(/제\s*([2-9])\s*일/g)].map(m => parseInt(m[1],10));
    if(dayNums.length > 0){
      const maxDay = Math.max(...dayNums);
      if(maxDay >= 2 && maxDay <= 14){
        result.duration = `${maxDay-1}박${maxDay}일`;
      }
    }
  }

  // 여러 호텔 중 1일차 기준 호텔 선택 처리
  result.hotelName = extractFirstDayHotel(text) || result.hotelName;

  return result;
}

/* ── 1일차 기준 호텔 추출 ───────────────────────────── */
// 1일차 구간에서만 탐색 — 못 찾으면 빈값 반환(수동입력 유도)
// fallback 전체 스캔 제거: 틀린 값보다 빈값이 안전함
function extractFirstDayHotel(text){
  const lines = text.split('\n');
  let in1stDay = false;
  let hotelFound = '';

  for(let i=0; i<lines.length; i++){
    const line = lines[i];

    // 1일차 구간 진입 감지: 제1일, 1일차, Day1, first day 등
    if(!in1stDay && /(?:제\s*1\s*일|1일차?|day\s*1|1日目|first\s*day)/i.test(line)){
      in1stDay = true;
    }
    // 2일차 이상 도달 시 탐색 즉시 종료 → 빈값 반환
    if(in1stDay && /(?:제\s*[2-9]\s*일|[2-9]일차?|day\s*[2-9]|[2-9]日目)/i.test(line)){
      break;
    }

    if(in1stDay){
      // 우선순위0: "[H] 노쿠호텔 오사카 (T.xxx)" PDF 확정서 마커 패턴
      // 정규화 후 ()가 제거되므로 T./슬래시도 종결자로 사용
      const mH0 = line.match(/^\[H\]\s+([가-힣A-Za-z0-9\s\-·]+?)(?:\s+T\.\s*\d|\s*\/|\s*\(|$)/);
      if(mH0 && mH0[1].trim().length > 1){
        hotelFound = mH0[1].trim().slice(0,50);
        break;
      }
      // 우선순위1: "HOTEL: 힐튼 후쿠오카..." 영문 패턴
      const mH = line.match(/HOTEL\s*:\s*([가-힣A-Za-z0-9\s\-·\.]+)/i);
      if(mH && mH[1].trim().length > 1){
        let name = mH[1].trim();
        name = name.replace(/https?:\/\/\S+.*/i, '').trim(); // URL 제거
        name = name.replace(/또는\s*동급.*/,'').trim();       // "또는 동급..." 제거
        name = name.replace(/트윈.*/,'').trim();              // "트윈..." 제거
        if(name.length > 1){ hotelFound = name.slice(0,50); break; }
      }
      // 우선순위2: "호텔: 평성관(전화)" 한글 패턴
      const mA = line.match(/호텔\s*:\s*([가-힣A-Za-z0-9\s\-·\.]+?)(?:\s*[\(\（][\d\-]+[\)\）]|$)/);
      if(mA && mA[1].trim().length > 1){
        // [FIX] normalizeText 후 괄호 제거로 전화번호가 붙어오는 경우 제거
        let name = mA[1].trim().replace(/[\s\-]*[A-Za-z]?\.?[\s\-]*[\d]{3,}[\d\-\s]*$/, '').trim();
        name = name.replace(/\s+[A-Za-z]{1,3}\.?\s*$/, '').trim();
        if(name.length > 1){ hotelFound = name.slice(0,50); break; }
      }
      // 우선순위3: 호텔명 키워드
      const mB = line.match(/(?:호텔명|숙박|숙소)\s*[:\s]\s*([가-힣A-Za-z0-9\s\-·]+)/);
      if(mB && mB[1].trim().length > 1){
        hotelFound = mB[1].trim().slice(0,50);
        break;
      }
    }
  }

  // 1일차 범위 밖에서는 탐색하지 않음 — 빈값이면 수동 입력 유도
  return hotelFound;
}

/* ── STEP3: 여행정보 정규화 및 검증 ─────────────────── */
function normalizeTravelInfo(rawInfo){
  const info = {...rawInfo};
  // depDate 정규화 (M.D 형식 표준화 — 이미 "." 포함 시 중복 삽입 방지)
  if(info.depDate){
    let d = info.depDate.trim();
    // "M월 D일" → "M.D"
    d = d.replace(/(\d{1,2})월\s*(\d{1,2})일?/, '$1.$2');
    // "/" "-" → "." (단, 이미 "." 있는 경우 포함)
    d = d.replace(/[\/\-]/g, '.');
    // ".." 중복 제거
    d = d.replace(/\.{2,}/g, '.');
    info.depDate = d;
  }
  // duration 정규화
  if(info.duration) info.duration = normalizeDuration(info.duration);
  // 필드 길이 제한
  Object.keys(info).forEach(k => {
    if(typeof info[k] === 'string') info[k] = info[k].trim();
  });
  // 검증: 핵심 필드 2개 이상 있으면 travelFound=true
  const coreFields = ['depDate','destination','duration','flightOut','meetingTime'];
  const foundCount = coreFields.filter(f => info[f] && info[f].length > 0).length;
  return { info, travelFound: foundCount >= 2 };
}

/* ── STEP4: 기존 폼에 자동 채움 ─────────────────────── */
function autofillTravelForm(info){
  const fieldIds = ['depDate','destination','duration','agency','flightOut','flightIn','meetingTime','meetingPlace','hotelName','hotelPhone','extraMemo','weatherMin','weatherMax','weatherNotice'];
  const filled = [];
  const skipped = [];
  fieldIds.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    const val = info[id] || '';
    // BUG-03 FIX: 추출값이 있어도 기존 입력값이 있으면 덮어쓰지 않음
    const existing = el.value.trim();
    if(val && !existing){
      el.value = val;
      filled.push(id);
    } else if(val && existing){
      skipped.push(id); // 기존값 유지 — 진단 로그에 기록됨
    } else {
      skipped.push(id);
    }
  });
  // state 동기화
  normalizeTravelInfoFromForm();
  buildGroupPreview();
  return { filled, skipped };
}

/* ── STEP5: 고객명단 정규화 (기존 구조와 호환) ──────── */
function normalizeContacts(rawContacts){
  return rawContacts.map(c => ({
    id: c.id || uid('draft'),
    name: (c.name && c.name !== '이름 미확인') ? c.name.trim() : '이름 미확인',
    phone: c.phone || '',
    selected: true,
    duplicate: c.duplicate || false,
    nameUnconfirmed: c.nameUnconfirmed !== undefined ? c.nameUnconfirmed : (!c.name || c.name === '이름 미확인'),
    extraPhones: c.extraPhones || [],
    source: c.source || 'auto',
    note: c.note || ''
  }));
}

/* ── 자동 인식 결과 칩 렌더링 ──────────────────────────── */
function renderAutofillChips(fieldRow, filledFields, warnings){
  fieldRow.innerHTML = '';

  const fieldLabels = {
    depDate:'출발일',
    destination:'여행지',
    duration:'기간',
    agency:'여행사',
    flightOut:'출국편',
    flightIn:'귀국편',
    meetingTime:'미팅시간',
    meetingPlace:'미팅장소',
    hotelName:'호텔명',
    hotelPhone:'호텔전화',
    extraMemo:'메모'
  };

  (filledFields || []).forEach(f => {
    const chip = document.createElement('span');
    chip.className = 'autofill-field-chip';
    chip.textContent = fieldLabels[f] || f;
    fieldRow.appendChild(chip);
  });

}

/* ── 추출 상태 UI 갱신 (파일별 누적) ─────────────────── */
function updateExtractionStatus(result){
  const banner = document.getElementById('autoFillBanner');
  const list   = document.getElementById('autoResultList');

  const typeMap = {
    travel_only:  { label:'✈️ 확정서 전용', cls:'travel' },
    contacts_only:{ label:'👥 고객명단 전용', cls:'contacts' },
    mixed:        { label:'📋 확정서+명단', cls:'mixed' },
    unknown:      { label:'❓ 인식 불가', cls:'unknown' }
  };

  const typeInfo = typeMap[result.docType] || typeMap.unknown;

  const parts = [];
  if(result.travelFound) parts.push('여행정보 ✓');
  else if(result.docType !== 'contacts_only') parts.push('여행정보 없음');
  if(result.contactsFound) parts.push(`명단 ${result.contactCount||0}명`);
  else if(result.docType !== 'travel_only') parts.push('명단 없음');
  if(result.docType === 'unknown') parts.push('형식 인식 불가');

  // 채워진 필드 칩 HTML
  const fieldLabels = {
    depDate:'출발일', destination:'여행지', duration:'기간', agency:'여행사',
    flightOut:'출국편', flightIn:'귀국편', meetingTime:'미팅시간',
    meetingPlace:'미팅장소', hotelName:'호텔명', hotelPhone:'호텔전화', extraMemo:'메모'
  };
  const chipsHtml = (result.filledFields||[]).map(f =>
    `<span class="autofill-field-chip">${fieldLabels[f]||f}</span>`
  ).join('');

  const fileName = escapeHtml(result.fileName || '파일');

  const item = document.createElement('div');
  item.className = 'auto-result-item';
  item.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="font-size:11px;color:var(--muted);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${fileName}">${fileName}</span>
      <span class="doc-type-chip ${typeInfo.cls}" style="font-size:11px">${typeInfo.label}</span>
      <span style="font-size:11px;color:var(--muted)">${parts.join(' · ')}</span>
    </div>
    ${chipsHtml ? `<div class="autofill-field-row">${chipsHtml}</div>` : ''}`;

  list.appendChild(item);
  banner.classList.add('show');
}

/* ── 진단 로그 기록 및 토글 ──────────────────────────── */

/* ── 텍스트 기반 Excel 파서 (여행정보 추출용 raw 텍스트 반환) ── */
async function extractTextFromExcel(file){
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type:'array', cellText:false, cellDates:true });
  function cellStr(v){
    if(v == null) return '';
    // Date/time 객체 처리 (Excel time 타입 셀 → 한국어 오전/오후 HH:MM)
    if(v instanceof Date){
      const h = v.getHours(), m = v.getMinutes();
      // 날짜 부분이 1899-12-30(Excel time only)이면 시간만 추출
      const isTimeOnly = v.getFullYear() <= 1900;
      if(isTimeOnly || (h > 0 || m > 0)){
        const ampm = h < 12 ? '오전' : '오후';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${ampm} ${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      }
    }
    const s = String(v);
    if(/^[\d.]+e\+?\d+$/i.test(s)){ try{ return String(Math.round(Number(s))); }catch(e){} }
    return s;
  }
  // 모든 시트 텍스트 수집 (일정표/확정서 포함 — 여행정보 추출 위해)
  let travelText = '';
  let contactText = '';
  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'', raw:false });
    const isScheduleSheet = ['확정서','일정표','schedule','itinerary'].some(k => sheetName.toLowerCase().includes(k));
    const sheetStr = rows.map(r => r.map(cellStr).join('\t')).join('\n');
    if(isScheduleSheet) travelText += sheetStr + '\n';
    else { travelText += sheetStr + '\n'; contactText += sheetStr + '\n'; }
  });
  return { travelText, contactText: contactText || travelText };
}

/* ── PDF 파서 (여행정보용 텍스트 반환) ─────────────────── */
async function extractTextFromPdf(file){
  // BUG-01 FIX: 진입 시점에 pdfjsLib 로드 및 워커 설정 재보장
  if(typeof pdfjsLib === 'undefined'){
    throw new Error('pdf.js 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
  }
  if(!pdfjsLib.GlobalWorkerOptions.workerSrc){
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  }
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let full = '';
  for(let i=1; i<=pdf.numPages; i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // 항목 사이 공백 유지, 줄바꿈 패턴 보존
    const pageText = content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('');
    full += `--- PAGE ${i} ---\n${pageText}\n`;
  }
  return { travelText: full, contactText: full };
}

/* ── Word 파서 (여행정보용 텍스트 반환) ─────────────────── */
async function extractTextFromWord(file){
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  const text = result.value || '';
  return { travelText: text, contactText: text };
}

/* ── PDF 파일 (기존 명단 추출용 유지 — 호환성) ─────────── */
async function parsePdfFile(file){
  const { contactText } = await extractTextFromPdf(file);
  return extractContactsFromText(contactText, 'pdf');
}

/* ── Word 파일 (기존 명단 추출용 유지 — 호환성) ─────────── */
async function parseWordFile(file){
  const { contactText } = await extractTextFromWord(file);
  return extractContactsFromText(contactText, 'word');
}

function mergeDraftContacts(newContacts){
  // BUG-02 FIX: phone 없는 항목은 Map 키 충돌로 유실되므로 별도 배열로 관리
  const phoneMap = new Map(
    state.extractedContactsDraft.filter(c => c.phone).map(c => [c.phone, c])
  );
  const noPhoneItems = state.extractedContactsDraft.filter(c => !c.phone);

  newContacts.forEach(item => {
    if(!item.phone){
      // 번호 없는 항목은 항상 별도 추가 (수동 입력 유도용)
      noPhoneItems.push(item);
    } else if(phoneMap.has(item.phone)){
      const existing = phoneMap.get(item.phone);
      existing.duplicate = true;
      existing.note = [existing.note, '중복 번호'].filter(Boolean).join(' · ');
    } else {
      phoneMap.set(item.phone, item);
    }
  });
  state.extractedContactsDraft = [...phoneMap.values(), ...noPhoneItems];
  _totalExtracted += newContacts.filter(c => c.phone).length; // 파일별 유효 번호 누적 합산
  saveState();
  renderDraftList();
}

/* ── 직접 추가 엔진 ─────────────────────────────── */
function handleDirectAdd(){
  const nameEl  = document.getElementById('inputName');
  const phoneEl = document.getElementById('inputPhone');
  const rawName  = nameEl.value.trim();
  const rawPhone = phoneEl.value.trim();

  // 번호 정규화 (숫자만 추출 후 010 검증)
  const phone = normalizePhone(rawPhone);

  if(!rawPhone){ showToast('전화번호를 입력해주세요', 'error'); phoneEl.focus(); return; }
  if(!phone){    showToast('010으로 시작하는 11자리 번호를 입력해주세요', 'error'); phoneEl.focus(); return; }

  // 중복 체크
  if(state.extractedContactsDraft.some(x => x.phone === phone)){
    showToast('⚠️ 이미 추가된 번호입니다', 'error');
    phoneEl.select();
    return;
  }

  const name = rawName || '이름 미확인';
  const item = {
    id: uid('draft'),
    name,
    phone,
    selected: true,
    duplicate: false,
    nameUnconfirmed: !rawName,
    extraPhones: [],
    source: 'manual',
    note: !rawName ? '이름 검수 필요' : ''
  };

  state.extractedContactsDraft.unshift(item);
  saveState();
  renderDraftList();

  // 입력창 초기화 + 이름칸으로 포커싱 (연속 입력 최적화)
  nameEl.value  = '';
  phoneEl.value = '';
  nameEl.focus();

  showToast(`${escapeHtml(name)} 추가 완료 ✓`, 'success');
  document.getElementById('sourceStatus').textContent = `직접 입력 · 총 ${state.extractedContactsDraft.length}명`;
}

/* ── 파일 업로드 핸들러 — 자동 인식 엔진 메인 진입점 ── */
async function handleFileUpload(file, kind){
  if(!file) return;
  const t0 = Date.now();
  const statusEl = document.getElementById('sourceStatus');
  statusEl.textContent = `${file.name} 분석 중...`;

  // 진단 결과 누적 객체
  const diagResult = {
    fileName: file.name, fileType: kind,
    docType:'unknown', travelScore:0, contactScore:0, phoneMatches:0,
    travelFound:false, contactsFound:false, contactCount:0,
    templateId: null, templateConfidence: 0,
    filledFields:[], warnings:[], failureLines:[], elapsed:0
  };

  try{
    // ── 1. 파일 형식별 텍스트 추출 ──
    let travelText = '', contactText = '';
    let parseResult = null;

    if(kind === 'excel'){
      parseResult = await parseExcelFile(file);
      travelText = parseResult.rawText || '';
      // contactText는 parseResult.contacts 이미 파싱된 상태
    } else if(kind === 'pdf'){
      const extracted = await extractTextFromPdf(file);
      travelText = extracted.travelText;
      contactText = extracted.contactText;
    } else if(kind === 'word'){
      const extracted = await extractTextFromWord(file);
      travelText = extracted.travelText;
      contactText = extracted.contactText;
    }

    // ── 2. 문서 유형 판별 ──
    const typeResult = detectTravelDocumentType(travelText || contactText, kind);
    diagResult.docType      = typeResult.docType;
    diagResult.travelScore  = typeResult.travelScore;
    diagResult.contactScore = typeResult.contactScore;
    diagResult.phoneMatches = typeResult.phoneMatches;

    // ── 2.5 템플릿 식별 (전체 문서 대상 — 연락처 전용 포함) ──
    const templateResult = await extractTravelInfoByTemplate(travelText || contactText).catch(e => {
      console.warn('[JGSAS] 템플릿 엔진 오류:', e);
      return null;
    });
    if(templateResult){
      diagResult.templateId         = templateResult.templateId;
      diagResult.templateConfidence = templateResult.confidence;
    }

    // ── 3. 여행정보 추출 (travel_only / mixed) ──
    if(typeResult.docType === 'travel_only' || typeResult.docType === 'mixed'){
      let rawInfo = null;
      if(templateResult && templateResult.result !== null){
        // 템플릿 엔진 추출 결과 사용
        rawInfo = templateResult.result;
        console.info('[JGSAS] 템플릿 엔진 추출 적용:', templateResult.templateId);
      } else {
        // L3/L4: 기존 하드코딩 extractTravelInfo fallback
        console.warn('[JGSAS] 기존 하드코딩 extractTravelInfo fallback 사용');
        rawInfo = extractTravelInfo(travelText || contactText);
        if(!diagResult.templateId) diagResult.templateId = 'fallback-hardcoded';
      }
      const { info, travelFound } = normalizeTravelInfo(rawInfo);
      diagResult.travelFound = travelFound;
      if(travelFound){
        const { filled, skipped } = autofillTravelForm(info);
        diagResult.filledFields = filled;
        if(skipped.length) diagResult.warnings.push(`미추출 필드: ${skipped.slice(0,4).join(',')}`);
      } else {
        diagResult.warnings.push('여행정보 없음 — 핵심 필드 2개 미만');
      }
    }

    // ── 4. 고객명단 추출 ──
    const shouldExtractContacts = typeResult.docType !== 'unknown';
    if(shouldExtractContacts){
      let contacts = [];
      let failures = [];
      if(kind === 'excel' && parseResult){
        contacts = parseResult.contacts || [];
        failures = parseResult.failures || [];
      } else if(kind === 'pdf' || kind === 'word'){
        const contactResult = extractContactsFromText(contactText, kind);
        contacts = contactResult.contacts || [];
        failures = contactResult.failures || [];
      }
      const normalized = normalizeContacts(contacts);
      const validContacts = normalized.filter(c => c.phone);
      diagResult.contactsFound = validContacts.length > 0;
      diagResult.contactCount  = validContacts.length;
      diagResult.failureLines  = failures;

      if(validContacts.length > 0){
        mergeDraftContacts(normalized);
        statusEl.textContent = `${file.name} · 여행정보+명단 추출 완료 (${validContacts.length}명)`;
        showToast(`✅ 자동 인식 완료 · ${validContacts.length}명`, 'success');
      } else if(typeResult.docType !== 'travel_only'){
        diagResult.warnings.push('고객명단 없음 — 유효 번호 0개');
        statusEl.textContent = `${file.name} · 명단 추출 실패`;
      }
    }

    // ── 5. unknown 처리 ──
    if(typeResult.docType === 'unknown'){
      statusEl.textContent = `${file.name} · 문서 형식 인식 불가`;
      showToast('문서 형식을 인식하지 못했습니다. 직접 입력해 주세요.', 'error');
    }

    // ── 6. 여행정보만 성공한 경우 상태 업데이트 ──
    if(typeResult.docType === 'travel_only' && diagResult.travelFound){
      statusEl.textContent = `${file.name} · 여행정보 자동 채움 완료`;
      showToast('✈️ 여행정보를 자동으로 채웠습니다', 'success');
    }

    // ── 7. 혼합 문서 부분 성공 ──
    if(typeResult.docType === 'mixed'){
      if(diagResult.travelFound && diagResult.contactsFound){
        showToast('📋 여행정보 + 명단 모두 추출 완료', 'success');
      } else if(diagResult.travelFound){
        showToast('✈️ 여행정보 추출 성공 (명단 없음)', 'info');
      } else if(diagResult.contactsFound){
        showToast(`👥 명단 ${diagResult.contactCount}명 추출 (여행정보 미추출)`, 'info');
      }
    }

  }catch(err){
    console.error('[자동 인식 엔진 오류]', err);
    diagResult.warnings.push(`오류: ${err.message}`);
    statusEl.textContent = `${file.name} · 분석 실패`;
    showToast(`파일 분석 실패: ${err.message}`, 'error');
    // 진단 로그에는 오류 기록
  }finally{
    diagResult.elapsed = Date.now() - t0;
    updateExtractionStatus(diagResult);
  }
}


function clearDrafts(){ state.extractedContactsDraft = []; _totalExtracted = 0; saveState(); renderDraftList(); showToast('임시 명단을 비웠습니다','info'); }
function resetExtract(){
  // 여행기본정보 초기화
  const fields = ['depDate','destination','duration','agency','flightOut','flightIn',
                  'meetingTime','meetingPlace','hotelName','hotelPhone',
                  'weatherMin','weatherMax','weatherNotice','extraMemo'];
  fields.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  buildGroupPreview();
  // 임시명단 초기화
  state.extractedContactsDraft = []; _totalExtracted = 0; saveState(); renderDraftList();
  // 자동인식결과 배너 초기화
  const banner = document.getElementById('autoFillBanner');
  if(banner) banner.classList.remove('show');
  // 입력소스 카드 상태 초기화
  document.getElementById('sourceStatus').textContent = '대기 중';
  // 자동인식 누적 결과 목록 초기화
  const resultList = document.getElementById('autoResultList');
  if(resultList) resultList.innerHTML = '';
  showToast('여행정보 + 명단을 초기화했습니다', 'info');
}

/* ── 여행정보 초기화 (v4g 추가) — 명단·그룹 데이터 불변 ── */
function resetTravelInfo(){
  const fields = ['depDate','destination','duration','agency','flightOut','flightIn',
                  'meetingTime','meetingPlace','hotelName','hotelPhone',
                  'weatherMin','weatherMax','weatherNotice','extraMemo'];
  fields.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  buildGroupPreview(); // state 동기화 + 미리보기 갱신 + saveState 호출
  showToast('여행 정보를 초기화했습니다', 'info');
}

function openContactEditor(id=null){
  currentEditDraftId = id;
  const item = state.extractedContactsDraft.find(x => x.id === id);
  document.getElementById('contactEditorTitle').textContent = item ? '연락처 수정' : '직접 입력 추가';
  document.getElementById('editName').value = item?.name === '이름 미확인' ? '' : (item?.name || '');
  document.getElementById('editPhone').value = item?.phone || '';
  document.getElementById('editMemo').value = item?.note || '';
  document.getElementById('deleteContactEditorBtn').style.display = item ? 'inline-flex' : 'none';
  document.getElementById('contactEditorModal').classList.add('show');
}
function closeContactEditor(){ document.getElementById('contactEditorModal').classList.remove('show'); currentEditDraftId = null; }
function saveContactEditor(){
  const name = document.getElementById('editName').value.trim() || '이름 미확인';
  const phone = normalizePhone(document.getElementById('editPhone').value.trim());
  const note = document.getElementById('editMemo').value.trim();
  if(!phone){ showToast('010 11자리 번호만 저장할 수 있습니다','error'); return; }
  if(currentEditDraftId){
    const idx = state.extractedContactsDraft.findIndex(x => x.id === currentEditDraftId);
    if(idx >= 0){
      state.extractedContactsDraft[idx] = {...state.extractedContactsDraft[idx], name, phone, note, nameUnconfirmed: name === '이름 미확인'};
    }
  } else {
    if(state.extractedContactsDraft.some(x => x.phone === phone)){ showToast('이미 같은 번호가 있습니다','error'); return; }
    state.extractedContactsDraft.unshift({ id:uid('draft'), name, phone, selected:true, duplicate:false, nameUnconfirmed:name==='이름 미확인', extraPhones:[], source:'manual', note });
  }
  saveState(); renderDraftList(); closeContactEditor(); showToast('저장했습니다','success');
}
function deleteContactEditor(){
  if(!currentEditDraftId) return;
  state.extractedContactsDraft = state.extractedContactsDraft.filter(x => x.id !== currentEditDraftId);
  saveState(); renderDraftList(); closeContactEditor(); showToast('삭제했습니다','info');
}

function renderDraftList(){
  const list = document.getElementById('draftList');
  const empty = document.getElementById('draftEmpty');
  const drafts = state.extractedContactsDraft;
  const total = drafts.length;

  // total-count 실시간 업데이트 (하위 호환: 요소 없으면 무시)
  const totalCountEl = document.getElementById('total-count');
  if(totalCountEl) totalCountEl.textContent = total;
  // 상단 우측 "전체 N명" (파란색)
  document.getElementById('draftCount').textContent = `${total}명`;
  // status-line 내 "전체 N명"
  const draftCountSub = document.getElementById('draftCountSub');
  if(draftCountSub) draftCountSub.textContent = `${total}명`;

  const duplicateCount = drafts.filter(x => x.duplicate).length;
  const unconfirmedCount = drafts.filter(x => x.nameUnconfirmed).length;
  document.getElementById('draftMeta').textContent = `중복 ${duplicateCount} · 이름미확인 ${unconfirmedCount}`;
  const selectedWithPhone = getSelectedDrafts().filter(x => x.phone).length;
  document.getElementById('selectedCountChip').textContent = `선택 ${selectedWithPhone}명`;
  // 인라인 상태요약 업데이트
  const inlineDraftCount    = document.getElementById('draftCountInline');
  const inlineDupCount      = document.getElementById('dupCountInline');
  const inlineSelectedCount = document.getElementById('selectedCountInline');
  if(inlineDraftCount)    inlineDraftCount.textContent    = `${total}명`;
  if(inlineDupCount)      inlineDupCount.textContent      = duplicateCount;
  if(inlineSelectedCount) inlineSelectedCount.textContent = `${selectedWithPhone}명`;
  document.getElementById('selectAllDraft').checked = drafts.length > 0 && drafts.every(x => x.selected);
  if(!drafts.length){ list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  // ── A방식 패치: phone 있는 항목과 없는 항목 분리 (state 변경 없음) ──
  const phoneItems   = drafts.filter(x => x.phone);
  const noPhoneItems = drafts.filter(x => !x.phone);
  // phone 있는 항목: 기존 카드 렌더링 그대로 유지
  const phoneHTML = phoneItems.map(item => `
    <div class="contact-item ${item.selected ? 'selected' : ''} ${item.duplicate ? 'duplicate' : ''}">
      <input class="checkbox" type="checkbox" ${item.selected ? 'checked' : ''} data-id="${escapeHtml(item.id)}" data-action="toggle">
      <div>
        <div class="contact-name">${escapeHtml(item.name)}</div>
        <div class="contact-phone">${escapeHtml(item.phone)}</div>
        <div class="contact-meta">
          ${item.duplicate ? '<span class="chip warn">중복 위험</span>' : ''}
          ${item.nameUnconfirmed ? '<span class="chip red">이름 미확인</span>' : ''}
          ${item.extraPhones?.length ? `<span class="chip">보조번호 ${item.extraPhones.length}</span>` : ''}
          ${item.note ? `<span class="chip">${escapeHtml(item.note)}</span>` : ''}
        </div>
      </div>
      <div class="member-actions">
        <button class="mini-btn" data-id="${escapeHtml(item.id)}" data-action="edit">수정</button>
        <button class="mini-btn" data-id="${escapeHtml(item.id)}" data-action="delete" style="background:rgba(248,113,113,.15);color:#f87171;border-color:rgba(248,113,113,.3)">삭제</button>
      </div>
    </div>`).join('');
  // phone 없는 항목: 맨 하단 묶음 표시 (표시 전용 — data-action 없음)
  let noPhoneHTML = '';
  if(noPhoneItems.length > 0){
    const label = noPhoneItems.length === 1
      ? escapeHtml(noPhoneItems[0].name)
      : `${escapeHtml(noPhoneItems[0].name)} 외 ${noPhoneItems.length - 1}명`;
    noPhoneHTML = `
    <div class="contact-item" style="opacity:0.6;cursor:default;">
      <div>
        <div class="contact-name">${label}</div>
        <div class="contact-phone" style="color:var(--text-muted,#888)">번호 없음</div>
        <div class="contact-meta">
          <span class="chip">번호 없음 · 직접 입력 필요</span>
          <span class="chip">전체 ${noPhoneItems.length}명 포함</span>
        </div>
      </div>
    </div>`;
  }
  list.innerHTML = phoneHTML + noPhoneHTML;
  // 이벤트 위임 (한 번만 바인딩)
  list.onclick = e => {
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if(action === 'edit') openContactEditor(id);
    else if(action === 'delete') deleteDraftItem(id);
  };
  list.onchange = e => {
    const cb = e.target.closest('[data-action="toggle"]');
    if(cb) toggleDraftSelection(cb.dataset.id, cb.checked);
  };
}

function deleteDraftItem(id){
  state.extractedContactsDraft = state.extractedContactsDraft.filter(x => x.id !== id);
  saveState();
  renderDraftList();
  showToast('삭제했습니다', 'info');
}

function toggleDraftSelection(id, checked){
  const item = state.extractedContactsDraft.find(x => x.id === id); if(!item) return;
  item.selected = checked; saveState(); renderDraftList();
}
function toggleAllDraft(checked){ state.extractedContactsDraft.forEach(x => x.selected = checked); saveState(); renderDraftList(); }

function buildGroupTitle(info){ return `${info.depDate || ''}${info.destination || ''}${normalizeDuration(info.duration || '') || ''}`; }
function buildGroupKey(info){ return `${info.depDate || ''}/${info.destination || ''}/${normalizeDuration(info.duration || '') || ''}/${info.agency || ''}`; }
function duplicateRiskInGroup(contacts){ const phones = new Set(); let risk=0; contacts.forEach(c=>{ if(phones.has(c.phone)) risk++; phones.add(c.phone); }); return risk; }

// BUG-03 FIX: 두 함수의 중복 로직을 내부 헬퍼로 분리
// saveGroupFromDrafts / saveGroupAndGoSms 의 유일한 차이 = 마지막 switchTab 호출 여부
function _doSaveGroup(){
  normalizeTravelInfoFromForm();
  const info = state.currentTravelInfo;
  if(!info.depDate || !info.destination || !info.duration || !info.agency){
    showToast('출발일, 여행지, 기간, 여행사는 그룹 저장에 필요합니다', 'error'); return null;
  }
  // A방식 패치: phone 없는 항목은 저장 대상에서 명시적 제외
  const selected = getSelectedDrafts().filter(x => x.phone && x.name);
  if(!selected.length){ showToast('선택된 인원이 없습니다', 'error'); return null; }
  const newGroupKey = buildGroupKey(info);
  const dupIdx = state.savedGroups.findIndex(g => g.groupKey === newGroupKey);
  if(dupIdx >= 0){
    // 동일 그룹키 존재 시 자동 덮어쓰기 (팝업 없이 처리)
    state.savedGroups.splice(dupIdx, 1);
  }
  const group = {
    id: uid('group'),
    groupKey: newGroupKey,
    title: buildGroupTitle(info),
    travelInfo: {...info, duration: normalizeDuration(info.duration)},
    contacts: selected.map(x => ({...x})),
    createdAt: todayIso(),
    updatedAt: todayIso(),
    savedAt: dateLabel()
  };
  state.savedGroups.unshift(group);
  state.selectedGroupId = group.id;
  saveState();
  renderManagePage();
  renderSmsArea();
  showToast(`그룹 저장 완료 · ${selected.length}명`, 'success');
  return group;
}

function saveGroupFromDrafts(){ _doSaveGroup(); }

function saveGroupAndGoSms(){
  normalizeTravelInfoFromForm();
  const info = state.currentTravelInfo;
  // 필수 입력 검증 (extraMemo 제외, 13개)
  const requiredFields = [
    {key:'depDate',      label:'출발일'},
    {key:'destination',  label:'여행지'},
    {key:'duration',     label:'여행 기간'},
    {key:'agency',       label:'여행사'},
    {key:'flightOut',    label:'출국편'},
    {key:'flightIn',     label:'귀국편'},
    {key:'meetingTime',  label:'미팅 시간'},
    {key:'meetingPlace', label:'미팅 장소'},
    {key:'hotelName',    label:'호텔명'},
    {key:'hotelPhone',   label:'호텔 전화'},
    {key:'weatherMin',   label:'최저기온'},
    {key:'weatherMax',   label:'최고기온'},
    {key:'weatherNotice',label:'날씨 안내'},
  ];
  const missingFields = requiredFields.filter(f => !info[f.key]);
  if(missingFields.length){
    const listHtml = missingFields.map(f => `<div style="padding:4px 0;font-size:13px;color:#ffd3d3">• ${f.label}</div>`).join('');
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = `<div style="background:#1e1e2e;border-radius:16px;padding:28px 24px;max-width:300px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.5)">
      <div style="color:#f87171;font-size:16px;font-weight:900;margin-bottom:14px">아래 항목을 입력해주세요</div>
      <div style="text-align:left;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:10px 14px;margin-bottom:18px">${listHtml}</div>
      <button style="background:#4f8ef7;color:#fff;border:none;border-radius:10px;padding:10px 32px;font-size:15px;font-weight:700;cursor:pointer" onclick="this.closest('div[style*=fixed]').remove()">확인</button>
    </div>`;
    document.body.appendChild(overlay);
    return;
  }
  if(_doSaveGroup()) switchTab('sms');
}

function saveGroupAndGoKakao(){
  if(!_doSaveGroup()) return;
  switchTab('sms');
  if(buildQueue()){ openKakaoForCurrent(); }
}

function resolveTags(raw, context={}){
  const group = context.group || findGroup(state.selectedGroupId) || state.savedGroups[0] || null;
  const info = group?.travelInfo || state.currentTravelInfo || {};
  const firstName = context.contact?.name || group?.contacts?.[0]?.name || '이름';

  // 날씨 정보: group.travelInfo 우선, 없으면 현재 입력폼
  const wMin    = info.weatherMin    || (document.getElementById('weatherMin')?.value || '').trim();
  const wMax    = info.weatherMax    || (document.getElementById('weatherMax')?.value || '').trim();
  const wNotice = info.weatherNotice || (document.getElementById('weatherNotice')?.value || '').trim();

  const rep = {
    '{이름}': firstName,
    '{출발일}': info.depDate || '{출발일}',
    '{출발일요일}': depDayOfWeek(info.depDate) || '{출발일요일}',
    '{여행지}': info.destination || '{여행지}',
    '{기간}': normalizeDuration(info.duration) || '{기간}',
    '{여행사}': info.agency || '{여행사}',
    '{출국편}': info.flightOut || '{출국편}',
    '{귀국편}': info.flightIn || '{귀국편}',
    '{미팅시간}': info.meetingTime || '{미팅시간}',
    '{미팅장소}': info.meetingPlace || '{미팅장소}',
    '{호텔명}': info.hotelName || '{호텔명}',
    '{호텔전화}': info.hotelPhone || '{호텔전화}',
    '{가이드}': state.guideProfile.name || '{가이드}',
    '{가이드연락처}': formatPhone(state.guideProfile.phone) || '{가이드연락처}',
    '{추가메모}': info.extraMemo || '',
    // 레거시 날씨 태그 유지
    '{최저기온}': wMin,
    '{최고기온}': wMax,
    '{날씨}': wNotice,
    // 신규 날씨 태그
    '{기온최저}': wMin,
    '{기온최고}': wMax,
    '{날씨안내}': wNotice
  };

  let result = TAGS.reduce((acc, tag) => acc.split(tag).join(rep[tag] ?? tag), raw);

  // 날씨 값이 없으면 해당 줄 제거 (줄 전체가 날씨 태그만인 경우)
  const emptyWeatherPattern = /^[^\S\r\n]*(?:최저\s*\{기온최저\}[^\S\r\n]*\/[^\S\r\n]*최고\s*\{기온최고\}|최저\s*도[^\S\r\n]*\/[^\S\r\n]*최고\s*도|\{날씨안내\}|\{기온최저\}|\{기온최고\})[^\S\r\n]*$/gm;
  if(!wMin && !wMax) result = result.replace(/^[^\S\r\n]*.{0,10}최저.{0,3}최고.{0,20}$\n?/gm, '');
  if(!wNotice) result = result.replace(/^[^\S\r\n]*\{날씨안내\}[^\S\r\n]*$\n?/gm, '');

  return result;
}

function updateTemplateSelect(){
  const sel = document.getElementById('smsTemplateSelect');
  const templates = getAllTemplates();
  sel.innerHTML = templates.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}${t.locked ? ' · 기본원본' : ''}</option>`).join('');
  if(!findTemplate(sel.value)) sel.value = getDefaultTemplate().id;
}

function currentSmsTemplate(){ return findTemplate(document.getElementById('smsTemplateSelect').value) || getDefaultTemplate(); }

function renderSmsArea(){
  updateTemplateSelect();
  const group = findGroup(state.selectedGroupId) || state.savedGroups[0] || null;
  if(group && !state.selectedGroupId) state.selectedGroupId = group.id;
  document.getElementById('smsTargetCount').textContent = `${group?.contacts?.length || 0}명`;
  document.getElementById('smsGroupSummary').textContent = group ? `${group.title} / ${group.travelInfo.agency || '-'} / ${group.contacts.length}명` : '저장된 그룹이 없습니다.';
  const preview = resolveTags(currentSmsTemplate().content, { group });
  document.getElementById('smsPreview').value = preview;
  document.getElementById('charInfo').textContent = `${preview.length}자 · ${preview.length <= 90 ? 'SMS' : 'MMS 가능성'}`;
}

function loadLatestGroup(){
  if(!state.savedGroups.length){ showToast('저장된 그룹이 없습니다','error'); return; }
  state.selectedGroupId = state.savedGroups[0].id; saveState(); renderSmsArea(); showToast('최근 그룹을 불러왔습니다','success');
}

function copyCurrentMessage(){
  const msg = document.getElementById('smsPreview').value;
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(msg)
      .then(()=>showToast('문자 내용을 복사했습니다','success'))
      .catch(()=>fallbackCopy(msg));
  } else {
    fallbackCopy(msg);
  }
}
function fallbackCopy(text){
  try{
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(ok ? '문자 내용을 복사했습니다' : '복사에 실패했습니다', ok ? 'success' : 'error');
  }catch(e){ showToast('복사에 실패했습니다','error'); }
}

function buildQueue(){
  const group = findGroup(state.selectedGroupId) || state.savedGroups[0];
  if(!group){ showToast('발송할 그룹이 없습니다','error'); return false; }
  // BUG-05 FIX: 이미 발송 성공 처리된 연락처는 큐에서 제외
  const alreadySent = new Set(
    state.sendLogs
      .filter(l => l.groupId === group.id && l.status === 'success')
      .map(l => l.contactId)
  );
  const ids = group.contacts.filter(c => !alreadySent.has(c.id)).map(c => c.id);
  if(!ids.length){
    showToast('이 그룹은 전원 발송이 이미 완료되었습니다','info'); return false;
  }
  currentQueue = { groupId: group.id, templateId: currentSmsTemplate().id, ids, index:0 };
  renderQueue();
  return true;
}

function renderQueue(){
  const group = findGroup(currentQueue.groupId);
  const container = document.getElementById('queueCurrent');
  const hasQueue = group && currentQueue.index >= 0 && currentQueue.index < currentQueue.ids.length;
  const sendBtn = document.getElementById('sendCurrentBtn');
  const sentBtn = document.getElementById('markCurrentSentBtn');
  const failBtn = document.getElementById('markCurrentFailBtn');
  const pendingBtn = document.getElementById('markCurrentPendingBtn');

  if(!hasQueue){
    container.className = 'empty';
    container.textContent = '발송을 시작하면 현재 대상이 표시됩니다.';
    document.getElementById('queueInfo').textContent = currentQueue.ids.length ? '완료' : '대기';
    [sendBtn,sentBtn,failBtn,pendingBtn].forEach(b=>b.disabled=true);
    return;
  }

  const contact = group.contacts.find(c => c.id === currentQueue.ids[currentQueue.index]);
  // BUG-06 FIX: 삭제된 템플릿 ID 참조 시 기본 템플릿으로 fallback
  const tpl = findTemplate(currentQueue.templateId) || getDefaultTemplate();
  const msg = resolveTags(tpl.content, { group, contact });
  const doneCount = currentQueue.index;
  const totalCount = currentQueue.ids.length;
  document.getElementById('queueInfo').textContent = `완료 ${doneCount} / ${totalCount}명`;
  const sentIds = currentQueue.ids.slice(0, doneCount);
  const sentListHtml = sentIds.map(id => {
    const c = group.contacts.find(x => x.id === id);
    if(!c) return '';
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)">
      <span style="color:var(--accent2);font-size:14px">✅</span>
      <span style="font-size:13px;font-weight:700">${escapeHtml(c.name)}</span>
      <span style="font-size:12px;color:var(--muted);font-family:'Space Mono',monospace">${escapeHtml(c.phone)}</span>
    </div>`;
  }).join('');
  container.className = '';
  container.innerHTML = `
    <div class="contact-item selected" style="margin-bottom:8px">
      <div style="display:none"></div>
      <div>
        <div class="contact-name">${escapeHtml(contact.name)}</div>
        <div class="contact-phone">${escapeHtml(contact.phone)}</div>
        <div class="contact-meta"><span class="chip blue">현재 대상 · ${currentQueue.index + 1}번째</span></div>
      </div>
      <div></div>
    </div>
    ${sentListHtml ? `<div style="margin-top:4px;padding:8px 10px;border-radius:12px;background:rgba(52,211,153,.05);border:1px solid rgba(52,211,153,.15)">
      <div style="font-size:11px;color:var(--accent2);font-weight:800;margin-bottom:4px">완료 ${doneCount}명</div>
      ${sentListHtml}
    </div>` : ''}`;
  [sendBtn,sentBtn,failBtn,pendingBtn].forEach(b=>b.disabled=false);
}

function openSmsForCurrent(){
  const group = findGroup(currentQueue.groupId); if(!group) return;
  const contact = group.contacts.find(c => c.id === currentQueue.ids[currentQueue.index]); if(!contact) return;
  // BUG-06 FIX: 삭제된 템플릿 ID 참조 시 기본 템플릿으로 fallback
  const tpl = findTemplate(currentQueue.templateId) || getDefaultTemplate();
  const editedContent = document.getElementById('smsPreview')?.value || tpl.content;
  const msg = resolveTags(editedContent, { group, contact });
  // BUG-01 FIX: 삼성 갤럭시 메시지 앱은 sms: body 파라미터를 무시하는 경우 있음
  // SMS 앱 열기 전 클립보드에 미리 복사하여 붙여넣기 대비
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(msg).catch(()=>{});
  }
  const a = document.createElement('a');
  a.href = `sms:${contact.phone}?body=${encodeURIComponent(msg)}`;
  a.style.display = 'none';
  document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(), 200);
  showToast('SMS 앱을 열었습니다. 발송을 마친 뒤 "다음문자"를 눌러 주세요', 'info');
}

function openKakaoForCurrent(){
  const group = findGroup(currentQueue.groupId); if(!group) return;
  const contact = group.contacts.find(c => c.id === currentQueue.ids[currentQueue.index]); if(!contact) return;
  const tpl = findTemplate(currentQueue.templateId) || getDefaultTemplate();
  const msg = resolveTags(tpl.content, { group, contact });
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(msg).catch(()=>{});
  }
  const phone = contact.phone.replace(/-/g,'');
  const a = document.createElement('a');
  a.href = `intent://talk/chat?phone=${phone}#Intent;package=com.kakao.talk;scheme=kakaotalk;end`;
  a.style.display = 'none';
  document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(), 200);
  showToast('💬 카카오톡 열림 · 내용을 붙여넣기 하세요', 'info');
}

function exportGroupVcf(groupId){
  const group = findGroup(groupId || state.selectedGroupId) || state.savedGroups[0];
  if(!group){ showToast('저장된 그룹이 없습니다','error'); return; }
  const info = group.travelInfo || {};
  const rawDate = info.depDate || '';
  const dateMatch = rawDate.match(/(\d{1,2})[.\-\/](\d{1,2})/);
  const fmtDate = dateMatch ? `${dateMatch[1]}.${dateMatch[2]}` : (rawDate || '');
  const rawDur = info.duration || '';
  const durMatch = rawDur.match(/(\d+)일/) || rawDur.match(/(\d+)$/);
  const fmtDur = durMatch ? `${durMatch[1]}일` : (rawDur || '');
  const vcards = group.contacts.map(contact => {
    const phone = contact.phone.replace(/-/g,'');
    const fn = `${contact.name}${fmtDate}${info.destination || ''}${fmtDur}/${info.agency || ''}`;
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${fn}\nTEL;TYPE=CELL:${phone}\nEND:VCARD`;
  }).join('\n');
  const blob = new Blob([vcards], {type:'text/vcard'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${group.title || '연락처그룹'}.vcf`;
  a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 300);
  showToast(`${group.contacts.length}명 연락처 그룹 저장 중...`, 'success');
  // VCF 저장 로그 기록 → 관리탭에서 확인 가능
  if(!Array.isArray(state.vcfLogs)) state.vcfLogs = [];
  state.vcfLogs.push({
    id: uid('vcf'),
    groupId: group.id,
    groupTitle: group.title || '그룹',
    count: group.contacts.length,
    savedAt: todayIso()
  });
  if(state.vcfLogs.length > 50) state.vcfLogs = state.vcfLogs.slice(-50);
  saveState();
  renderManagePage();
}

function saveContactToPhone(contactId, groupId){
  const group = findGroup(groupId);
  const contact = group?.contacts.find(c => c.id === contactId);
  if(!contact){ showToast('연락처를 찾을 수 없습니다','error'); return; }
  const phone = contact.phone.replace(/-/g,'');
  const a = document.createElement('a');
  a.href = `intent://contacts/add?phone=${phone}&name=${encodeURIComponent(contact.name)}#Intent;scheme=content;package=com.android.contacts;end`;
  a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(()=>a.remove(), 200);
  showToast(`${contact.name} 연락처 앱 열림`, 'success');
}

function openKakaoForContact(groupId, contactId){
  const group = findGroup(groupId);
  const contact = group?.contacts.find(c => c.id === contactId);
  if(!contact) return;
  const cleanPhone = contact.phone.replace(/-/g,'');
  const a = document.createElement('a');
  a.href = `intent://talk/chat?phone=${cleanPhone}#Intent;package=com.kakao.talk;scheme=kakaotalk;end`;
  a.style.display = 'none';
  document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(), 200);
  showToast('💬 카카오톡 열림', 'info');
}

function logSendStatus(status){
  const group = findGroup(currentQueue.groupId); if(!group) return;
  const contact = group.contacts.find(c => c.id === currentQueue.ids[currentQueue.index]); if(!contact) return;
  state.sendLogs.push({
    id: uid('sendlog'),
    groupId: group.id,
    contactId: contact.id,
    phone: contact.phone,
    name: contact.name,
    status,
    templateId: currentQueue.templateId,
    sentAt: todayIso(),
    duplicateRisk: state.sendLogs.some(log => log.groupId === group.id && log.contactId === contact.id && log.status === 'success')
  });
  saveState();
}

function advanceQueue(status){
  logSendStatus(status);
  currentQueue.index += 1;
  if(currentQueue.index >= currentQueue.ids.length){
    const group = findGroup(currentQueue.groupId);
    showToast(`${group?.title || '그룹'} 발송 큐 처리 완료`, 'success');
    currentQueue.index = -1;
    renderManagePage();
    renderQueue();
    return;
  }
  renderQueue();
  openSmsForCurrent();
}

function markAllManualSent(){
  const group = findGroup(state.selectedGroupId) || state.savedGroups[0];
  if(!group){ showToast('그룹이 없습니다','error'); return; }
  const templateId = currentSmsTemplate().id;
  // BUG-04 FIX: 이미 success 처리된 연락처는 중복 push 방지
  let addedCount = 0;
  group.contacts.forEach(contact => {
    const existing = latestSendStatus(group.id, contact.id);
    if(existing && existing.status === 'success') return;
    state.sendLogs.push({ id:uid('sendlog'), groupId:group.id, contactId:contact.id, phone:contact.phone, name:contact.name, status:'success', templateId, sentAt:todayIso(), duplicateRisk:false });
    addedCount++;
  });
  saveState(); renderManagePage();
  showToast(addedCount > 0 ? `${addedCount}명 발송 완료 처리` : '이미 전원 처리 완료', 'success');
}

function latestSendStatus(groupId, contactId){
  const logs = state.sendLogs.filter(x => x.groupId === groupId && x.contactId === contactId).sort((a,b)=>new Date(b.sentAt)-new Date(a.sentAt));
  return logs[0] || null;
}
function isDuplicateSendRisk(groupId, contactId){
  return state.sendLogs.filter(x => x.groupId === groupId && x.contactId === contactId && x.status === 'success').length >= 2;
}
function latestHappyCallStatus(groupId, contactId){
  const logs = state.happyCallLogs.filter(x => x.groupId === groupId && x.contactId === contactId).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  return logs[0] || null;
}
function setHappyCall(groupId, contactId, done){
  const group = findGroup(groupId); const contact = group?.contacts.find(c=>c.id===contactId); if(!group || !contact) return;
  state.happyCallLogs.push({ id:uid('happy'), groupId, contactId, name:contact.name, phone:contact.phone, done, updatedAt:todayIso() });
  saveState(); renderManagePage();
}
function deleteGroup(groupId){
  const g = findGroup(groupId);
  if(!g) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#1e1e2e;border-radius:16px;padding:24px 20px;max-width:290px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.5)">
      <div style="font-size:15px;font-weight:800;color:var(--text1);margin-bottom:8px">"${escapeHtml(g.title)}"</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:20px;line-height:1.5">그룹을 삭제하시겠습니까?<br>발송·해피콜 기록도 함께 삭제됩니다.</div>
      <div style="display:flex;gap:8px">
        <button id="_dgCancel" style="flex:1;padding:11px;border-radius:10px;border:none;background:var(--surface3);color:var(--text2);font-size:14px;font-weight:700;cursor:pointer">취소</button>
        <button id="_dgConfirm" style="flex:1;padding:11px;border-radius:10px;border:none;background:#f87171;color:#fff;font-size:14px;font-weight:700;cursor:pointer">삭제</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#_dgCancel').addEventListener('click', ()=> overlay.remove());
  overlay.querySelector('#_dgConfirm').addEventListener('click', ()=>{
    state.savedGroups = state.savedGroups.filter(x => x.id !== groupId);
    state.sendLogs = state.sendLogs.filter(l => l.groupId !== groupId);
    state.happyCallLogs = state.happyCallLogs.filter(l => l.groupId !== groupId);
    if(state.selectedGroupId === groupId) state.selectedGroupId = state.savedGroups[0]?.id || null;
    saveState(); renderManagePage(); renderSmsArea();
    overlay.remove();
    showToast('그룹을 삭제했습니다', 'info');
  });
}
function selectGroup(groupId){ state.selectedGroupId = groupId; saveState(); renderManagePage(); renderSmsArea(); showToast('문자 탭 대상 그룹을 변경했습니다','success'); }

function selectDeleteContacts(groupId){
  const group = findGroup(groupId);
  if(!group) return;
  const overlay = document.createElement('div');
  overlay.id = 'selectDeleteOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  const checkedIds = new Set();
  const rows = group.contacts.map(c => `
    <label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);cursor:pointer">
      <input type="checkbox" data-id="${escapeHtml(c.id)}" style="width:18px;height:18px;accent-color:#4f8ef7">
      <span style="flex:1;font-size:14px;color:var(--text1)">${escapeHtml(c.name)}</span>
      <span style="font-size:12px;color:var(--text2);font-family:monospace">${escapeHtml(c.phone)}</span>
    </label>`).join('');
  overlay.innerHTML = `
    <div style="background:#1e1e2e;border-radius:20px 20px 0 0;padding:20px 18px 32px;width:100%;max-height:70vh;overflow-y:auto;box-shadow:0 -4px 32px rgba(0,0,0,.4)">
      <div style="font-size:15px;font-weight:800;color:var(--text1);margin-bottom:14px">삭제할 연락처 선택 — ${escapeHtml(group.title)}</div>
      <div id="sdContactList">${rows}</div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button onclick="document.getElementById('selectDeleteOverlay').remove()" style="flex:1;padding:12px;border-radius:10px;border:none;background:var(--surface3);color:var(--text2);font-size:14px;font-weight:700;cursor:pointer">취소</button>
        <button id="sdConfirmBtn" style="flex:1;padding:12px;border-radius:10px;border:none;background:#f87171;color:#fff;font-size:14px;font-weight:700;cursor:pointer">선택 삭제</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('sdConfirmBtn').addEventListener('click', function(){
    const checked = overlay.querySelectorAll('input[type=checkbox]:checked');
    const ids = Array.from(checked).map(el => el.dataset.id);
    if(!ids.length){ showToast('삭제할 연락처를 선택하세요','error'); return; }
    const g = findGroup(groupId);
    if(!g) return;
    g.contacts = g.contacts.filter(c => !ids.includes(c.id));
    saveState(); renderManagePage(); renderSmsArea();
    overlay.remove();
    showToast(`${ids.length}명을 삭제했습니다`, 'info');
  });
}

/* ── 그룹카드 접기/펼치기 토글 ── */
function toggleGroupCard(groupId){
  const card = document.getElementById(`gcard-${groupId}`);
  if(card) card.classList.toggle('collapsed');
}

/* ── 인라인 선택삭제 모드 ── */
function enterSelDeleteMode(groupId){
  const group = findGroup(groupId);
  if(!group) return;
  const card = document.getElementById(`gcard-${groupId}`);
  if(!card) return;

  // 이미 선택삭제 모드면 무시
  if(card.querySelector('.sel-delete-bar')) return;

  // 카드 펼치기
  card.classList.remove('collapsed');

  // contact-card-grid 내 각 카드에 체크박스 추가
  const grid = card.querySelector('.contact-card-grid');
  if(!grid) return;
  const contactCards = grid.querySelectorAll('.contact-card');
  contactCards.forEach((el, i) => {
    const contactId = group.contacts[i]?.id;
    if(!contactId) return;
    // onclick 임시 해제 (상세모달 방지)
    el.dataset.origOnclick = el.getAttribute('onclick') || '';
    el.removeAttribute('onclick');
    el.style.position = 'relative';
    // 체크박스 삽입
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.cid = contactId;
    cb.style.cssText = 'position:absolute;top:8px;right:8px;width:18px;height:18px;accent-color:#f87171;cursor:pointer;z-index:2';
    cb.addEventListener('click', e => e.stopPropagation());
    el.appendChild(cb);
    el.style.cursor = 'default';
  });

  // 하단 확인/취소 바 추가
  const bar = document.createElement('div');
  bar.className = 'sel-delete-bar';
  bar.style.cssText = 'display:flex;gap:8px;margin-top:12px';
  bar.innerHTML = `
    <button style="flex:1;padding:10px;border-radius:10px;border:none;background:var(--surface3);color:var(--text2);font-size:13px;font-weight:700;cursor:pointer" id="selCancelBtn-${groupId}">취소</button>
    <button style="flex:1;padding:10px;border-radius:10px;border:none;background:#f87171;color:#fff;font-size:13px;font-weight:700;cursor:pointer" id="selConfirmBtn-${groupId}">선택 삭제</button>`;
  card.appendChild(bar);

  // 취소
  document.getElementById(`selCancelBtn-${groupId}`).addEventListener('click', ()=>{
    renderManagePage();
  });

  // 확인 삭제
  document.getElementById(`selConfirmBtn-${groupId}`).addEventListener('click', ()=>{
    const checked = grid.querySelectorAll('input[type=checkbox]:checked');
    const ids = Array.from(checked).map(el => el.dataset.cid);
    if(!ids.length){ showToast('삭제할 연락처를 선택하세요','error'); return; }
    const g = findGroup(groupId);
    if(!g) return;
    g.contacts = g.contacts.filter(c => !ids.includes(c.id));
    saveState(); renderManagePage(); renderSmsArea();
    showToast(`${ids.length}명을 삭제했습니다`, 'info');
  });
}

function selectDeleteContacts(groupId){ enterSelDeleteMode(groupId); }

/* ── KPI 클릭 → 명단 상세 오버레이 ── */
function _buildGroupListHtml(){
  if(!state.savedGroups.length)
    return '<div style="padding:20px 0;text-align:center;color:var(--text2)">저장된 그룹이 없습니다</div>';
  return state.savedGroups.map(g => `
    <div style="display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.07)">
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700;color:var(--text1)">${escapeHtml(g.title)}${state.selectedGroupId===g.id?' <span style="font-size:11px;color:#4f8ef7">[현재]</span>':''}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:2px">${escapeHtml(g.travelInfo.depDate||'-')} / ${escapeHtml(g.travelInfo.destination||'-')} · ${g.contacts.length}명</div>
      </div>
      <button data-delid="${escapeHtml(g.id)}" style="flex-shrink:0;padding:6px 12px;border-radius:8px;border:none;background:rgba(248,113,113,.18);color:#f87171;font-size:12px;font-weight:700;cursor:pointer">삭제</button>
    </div>`).join('');
}

function _bindGroupListDeleteBtns(overlay){
  overlay.querySelectorAll('button[data-delid]').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const gid = btn.dataset.delid;
      const g = state.savedGroups.find(x => x.id === gid);
      if(!g) return;
      const cfm = document.createElement('div');
      cfm.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:center;justify-content:center';
      cfm.innerHTML = `
        <div style="background:#1e1e2e;border-radius:16px;padding:24px 20px;max-width:290px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.5)">
          <div style="font-size:15px;font-weight:800;color:var(--text1);margin-bottom:8px">"${escapeHtml(g.title)}"</div>
          <div style="font-size:13px;color:var(--text2);margin-bottom:20px;line-height:1.5">그룹을 삭제하시겠습니까?<br>발송·해피콜 기록도 함께 삭제됩니다.</div>
          <div style="display:flex;gap:8px">
            <button id="_cfmCancel" style="flex:1;padding:11px;border-radius:10px;border:none;background:var(--surface3);color:var(--text2);font-size:14px;font-weight:700;cursor:pointer">취소</button>
            <button id="_cfmOk" style="flex:1;padding:11px;border-radius:10px;border:none;background:#f87171;color:#fff;font-size:14px;font-weight:700;cursor:pointer">삭제</button>
          </div>
        </div>`;
      document.body.appendChild(cfm);
      cfm.querySelector('#_cfmCancel').addEventListener('click', ()=> cfm.remove());
      cfm.querySelector('#_cfmOk').addEventListener('click', ()=>{
        state.savedGroups = state.savedGroups.filter(x => x.id !== gid);
        state.sendLogs = state.sendLogs.filter(l => l.groupId !== gid);
        state.happyCallLogs = state.happyCallLogs.filter(l => l.groupId !== gid);
        if(state.selectedGroupId === gid) state.selectedGroupId = state.savedGroups[0]?.id || null;
        saveState(); renderManagePage(); renderSmsArea();
        cfm.remove();
        showToast('그룹을 삭제했습니다', 'info');
        const inner = overlay.querySelector('#_kpiGroupList');
        if(inner) inner.innerHTML = _buildGroupListHtml();
        const titleEl = overlay.querySelector('#_kpiGroupTitle');
        if(titleEl) titleEl.textContent = '전체 그룹 (' + state.savedGroups.length + ')';
        _bindGroupListDeleteBtns(overlay);
      });
    });
  });
}

function _bindGroupListEvents(overlay){
  const closeBtn = overlay.querySelector('#_kpiGroupClose');
  if(closeBtn) closeBtn.addEventListener('click', ()=> overlay.remove());
  _bindGroupListDeleteBtns(overlay);
}

function showKpiDetail(type){
  const targetId = state.selectedGroupId || state.savedGroups[0]?.id || null;
  const group = targetId ? state.savedGroups.find(g => g.id === targetId) : null;

  let title = '';
  let rows = [];

  if(type === 'groups'){
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
    overlay.innerHTML = `
      <div style="background:#1e1e2e;border-radius:20px 20px 0 0;padding:20px 18px 32px;width:100%;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 -4px 32px rgba(0,0,0,.4)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-shrink:0">
          <span id="_kpiGroupTitle" style="font-size:15px;font-weight:800;color:var(--text1)">전체 그룹 (${state.savedGroups.length})</span>
          <button id="_kpiGroupClose" style="background:none;border:none;color:var(--text2);font-size:22px;cursor:pointer;line-height:1">✕</button>
        </div>
        <div id="_kpiGroupList" style="overflow-y:auto;flex:1">${_buildGroupListHtml()}</div>
      </div>`;
    _bindGroupListEvents(overlay);
    overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    return;
  } else if(type === 'success'){
    if(!group){ showToast('선택된 그룹이 없습니다','error'); return; }
    title = `발송 성공 — ${group.title}`;
    rows = group.contacts
      .filter(c => latestSendStatus(group.id, c.id)?.status === 'success')
      .map(c => ({ name: c.name, sub: c.phone, badge: '발송✓' }));
    if(!rows.length) rows = [{ name:'발송 성공 인원 없음', sub:'', badge:'' }];
  } else if(type === 'pending'){
    if(!group){ showToast('선택된 그룹이 없습니다','error'); return; }
    title = `미발송 — ${group.title}`;
    rows = group.contacts
      .filter(c => { const s = latestSendStatus(group.id, c.id); return !s || s.status !== 'success'; })
      .map(c => ({ name: c.name, sub: c.phone, badge: '미발송' }));
    if(!rows.length) rows = [{ name:'미발송 인원 없음', sub:'', badge:'' }];
  } else if(type === 'happy'){
    if(!group){ showToast('선택된 그룹이 없습니다','error'); return; }
    const done = group.contacts.filter(c => latestHappyCallStatus(group.id, c.id)?.done);
    const todo = group.contacts.filter(c => !latestHappyCallStatus(group.id, c.id)?.done);
    title = `해피콜 현황 — ${group.title}`;
    rows = [
      { name:`✅ 완료 ${done.length}명`, sub: done.map(c=>c.name).join(', ') || '-', badge:'' },
      { name:`⏳ 미완료 ${todo.length}명`, sub: todo.map(c=>c.name).join(', ') || '-', badge:'' }
    ];
  } else if(type === 'vcf'){
    // 연락처 저장: 그룹 목록 + 저장 버튼 + 이력을 전용 팝업으로 처리
    window._deleteVcfLog = function(id) {
      state.vcfLogs = state.vcfLogs.filter(function(l){ return l.id !== id; });
      saveState();
      var row = document.getElementById('_vcfLog_' + id);
      if(row) row.remove();
      if(!state.vcfLogs.length){
        var c = document.getElementById('_vcfHistContainer');
        if(c) c.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:8px 0">이력 없음</div>';
      }
    };
    window._clearAllVcfLogs = function() {
      var cfm = document.createElement('div');
      cfm.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10001;display:flex;align-items:center;justify-content:center';
      cfm.innerHTML = '<div style="background:#1e1e2e;border-radius:16px;padding:24px 20px;width:80%;max-width:300px;text-align:center">'
        + '<div style="font-size:15px;font-weight:700;color:var(--text1);margin-bottom:8px">저장 이력 전체 삭제</div>'
        + '<div style="font-size:13px;color:var(--text2);margin-bottom:20px">저장 이력을 모두 삭제할까요?</div>'
        + '<div style="display:flex;gap:10px">'
        + '<button id="_cfmCancelBtn" style="flex:1;padding:10px;border-radius:10px;border:none;background:rgba(255,255,255,.1);color:var(--text2);font-size:14px;font-weight:700;cursor:pointer">취소</button>'
        + '<button id="_cfmDelAllBtn" style="flex:1;padding:10px;border-radius:10px;border:none;background:rgba(248,113,113,.3);color:#f87171;font-size:14px;font-weight:700;cursor:pointer">삭제</button>'
        + '</div></div>';
      cfm.querySelector('#_cfmCancelBtn').onclick = function(){ cfm.remove(); };
      cfm.querySelector('#_cfmDelAllBtn').onclick = function() {
        state.vcfLogs = [];
        saveState();
        cfm.remove();
        var c = document.getElementById('_vcfHistContainer');
        if(c){ c.innerHTML = ''; c.previousElementSibling && c.previousElementSibling.remove(); }
      };
      document.body.appendChild(cfm);
    };
    const logs = Array.isArray(state.vcfLogs) ? [...state.vcfLogs].reverse() : [];
    const vcfGroups = state.savedGroups.filter(g => Array.isArray(g.contacts) && g.contacts.length > 0);
    const groupListHtml = vcfGroups.length ? vcfGroups.map(g => {
      const lastLog = logs.find(l => l.groupId === g.id);
      const lastStr = lastLog ? (() => { const d = new Date(lastLog.savedAt); return isNaN(d) ? lastLog.savedAt : `최근 ${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })() : '저장 이력 없음';
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)">
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(g.title||'그룹')}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:2px">${g.contacts.length}명 · ${escapeHtml(lastStr)}</div>
        </div>
        <button onclick="exportGroupVcf('${g.id}')" style="flex-shrink:0;padding:6px 14px;border-radius:10px;border:none;background:rgba(52,211,153,.2);color:#34d399;font-size:12px;font-weight:700;cursor:pointer">저장</button>
        <button onclick="document.getElementById('_vcfOverlay')?.remove();deleteGroup('${g.id}')" style="flex-shrink:0;padding:6px 14px;border-radius:10px;border:none;background:rgba(248,113,113,.15);color:#f87171;font-size:12px;font-weight:700;cursor:pointer">삭제</button>
      </div>`;
    }).join('') : '<div style="padding:16px 0;color:var(--text2);font-size:13px">저장된 그룹이 없습니다.</div>';
    const histHtml = logs.length ? logs.slice(0,10).map(l => {
      const d = new Date(l.savedAt);
      const dateStr = isNaN(d) ? l.savedAt : `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      return `<div id="_vcfLog_${l.id}" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">
        <div style="flex:1;min-width:0;font-size:13px;color:var(--text2)">${escapeHtml(l.groupTitle||'그룹')} · ${l.count}명</div>
        <span style="font-size:11px;color:var(--muted);margin-right:4px">${dateStr}</span>
        <button onclick="window._deleteVcfLog('${l.id}')" style="flex-shrink:0;padding:3px 9px;border-radius:7px;border:none;background:rgba(248,113,113,.15);color:#f87171;font-size:11px;font-weight:700;cursor:pointer">삭제</button>
      </div>`;
    }).join('') : '<div style="font-size:12px;color:var(--muted);padding:8px 0">이력 없음</div>';
    const vcfOverlay = document.createElement('div');
    vcfOverlay.id = '_vcfOverlay';
    vcfOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
    vcfOverlay.innerHTML = `
      <div style="background:#1e1e2e;border-radius:20px 20px 0 0;padding:20px 18px 32px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 -4px 32px rgba(0,0,0,.4)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-shrink:0">
          <span style="font-size:15px;font-weight:800;color:var(--text1)">연락처 저장</span>
          <button onclick="this.closest('div[style*=fixed]').remove()" style="background:none;border:none;color:var(--text2);font-size:22px;cursor:pointer;line-height:1">✕</button>
        </div>
        <div style="overflow-y:auto;flex:1">
          <div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:6px;letter-spacing:.5px">그룹 선택 후 저장</div>
          ${groupListHtml}
          ${logs.length ? `<div style="display:flex;align-items:center;justify-content:space-between;margin:16px 0 6px">
            <span style="font-size:11px;font-weight:800;color:var(--muted);letter-spacing:.5px">저장 이력 (최근 10건)</span>
            <button onclick="window._clearAllVcfLogs()" style="padding:3px 10px;border-radius:7px;border:none;background:rgba(248,113,113,.15);color:#f87171;font-size:11px;font-weight:700;cursor:pointer">전체 삭제</button>
          </div>
          <div id="_vcfHistContainer">${histHtml}</div>` : '<div id="_vcfHistContainer"></div>'}
        </div>
      </div>`;
    vcfOverlay.addEventListener('click', e => { if(e.target === vcfOverlay) vcfOverlay.remove(); });
    document.body.appendChild(vcfOverlay);
    return;
  }

  const listHtml = rows.map(r => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)">
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.name)}</div>
        ${r.sub ? `<div style="font-size:12px;color:var(--text2);margin-top:2px;word-break:break-all">${escapeHtml(r.sub)}</div>` : ''}
      </div>
      ${r.badge ? `<span style="font-size:11px;padding:3px 8px;border-radius:8px;background:rgba(52,211,153,.15);color:#34d399;flex-shrink:0">${escapeHtml(r.badge)}</span>` : ''}
    </div>`).join('');

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#1e1e2e;border-radius:20px 20px 0 0;padding:20px 18px 32px;width:100%;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 -4px 32px rgba(0,0,0,.4)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-shrink:0">
        <span style="font-size:15px;font-weight:800;color:var(--text1)">${escapeHtml(title)}</span>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:none;border:none;color:var(--text2);font-size:22px;cursor:pointer;line-height:1">✕</button>
      </div>
      <div style="overflow-y:auto;flex:1">${listHtml}</div>
    </div>`;
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function getGroupStats(groupId){
  const group = state.savedGroups.find(g => g.id === groupId);
  if(!group) return {total:0, success:0, pending:0, fail:0, happyDone:0, happyTodo:0};
  const total = group.contacts.length;
  let success=0, pending=0, fail=0;
  group.contacts.forEach(c=>{
    const log = latestSendStatus(group.id, c.id);
    if(!log) pending++;
    else if(log.status === 'success') success++;
    else if(log.status === 'fail') fail++;
    else pending++;
  });
  let happyDone=0, happyTodo=0;
  group.contacts.forEach(c=>{
    const call = latestHappyCallStatus(group.id, c.id);
    if(call?.done) happyDone++;
    else happyTodo++;
  });
  return {total, success, pending, fail, happyDone, happyTodo};
}

function renderManagePage(){
  const search = document.getElementById('manageSearch').value.trim().toLowerCase();
  const filter = document.getElementById('manageFilter').value;
  const wrap = document.getElementById('manageGroups');
  const empty = document.getElementById('manageEmpty');
  document.getElementById('kpiGroups').textContent = state.savedGroups.length;
  const _kpiTargetId = state.selectedGroupId || state.savedGroups[0]?.id || null;
  const _kpiStats = getGroupStats(_kpiTargetId);
  document.getElementById('kpiSuccess').textContent = _kpiStats.success;
  document.getElementById('kpiPending').textContent = _kpiStats.pending;
  document.getElementById('kpiHappy').textContent = _kpiStats.happyDone;
  document.getElementById('kpiVcf').textContent = Array.isArray(state.vcfLogs) ? state.vcfLogs.length : 0;

  const groups = state.savedGroups.filter(group => {
    const hay = `${group.title} ${group.travelInfo.agency || ''} ${group.contacts.map(c=>`${c.name} ${c.phone}`).join(' ')}`.toLowerCase();
    if(search && !hay.includes(search)) return false;
    return true;
  });

  if(!groups.length){ wrap.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  wrap.innerHTML = groups.map(group => {
    const duplicateRisk = duplicateRiskInGroup(group.contacts);
    const selected = state.selectedGroupId === group.id;
    const gStats = getGroupStats(group.id);
    return `
      <div class="group-card" id="gcard-${group.id}">
        <div class="group-head">
          <div style="flex:1;min-width:0">
            <div class="group-title">${escapeHtml(group.title)} ${selected ? '<span class="chip blue">현재 발송 그룹</span>' : ''}</div>
            <div class="group-sub">${escapeHtml(group.travelInfo.depDate || '-')} / ${escapeHtml(group.travelInfo.destination || '-')} / ${escapeHtml(group.travelInfo.duration || '-')} / ${escapeHtml(group.travelInfo.agency || '-')} · ${group.contacts.length}명<br>문자 ${gStats.success}/${gStats.total} · 해피콜 ${gStats.happyDone}/${gStats.total}</div>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
            <button class="mini-btn" onclick="enterSelDeleteMode('${group.id}')">선택삭제</button>
            <button class="mini-btn" onclick="deleteGroup('${group.id}')">삭제</button>
            <button class="group-toggle-btn" onclick="toggleGroupCard('${group.id}')" title="접기/펼치기">▼</button>
          </div>
        </div>
        ${duplicateRisk ? `<div class="warn-box" style="margin-bottom:8px">중복 번호 ${duplicateRisk}건이 그룹 내부에 있습니다. 발송 전 다시 확인해 주세요.</div>` : ''}
        <div class="contact-card-grid">
        ${group.contacts.map(contact => {
          const send  = latestSendStatus(group.id, contact.id);
          const happy = latestHappyCallStatus(group.id, contact.id);
          const sentOk  = send?.status === 'success';
          const sentFail= send?.status === 'fail';
          const dupRisk = isDuplicateSendRisk(group.id, contact.id);
          const cardCls = dupRisk ? 'card-dup' : sentOk ? 'card-sent' : sentFail ? 'card-fail' : '';
          const sendBadge  = send ? (sentOk ? '<span class="chip green">발송✓</span>' : sentFail ? '<span class="chip red">실패</span>' : '<span class="chip warn">미발송</span>') : '<span class="chip">기록없음</span>';
          const happyBadge = happy?.done ? '<span class="chip green">해피✓</span>' : '<span class="chip warn">해피미완</span>';
          const dupBadge   = dupRisk ? '<span class="chip red">중복경고</span>' : '';
          return `<div class="contact-card ${cardCls}" onclick="openDetailModal('${group.id}','${contact.id}')">
            <div class="cc-name">${escapeHtml(contact.name)}</div>
            <div class="cc-phone">${escapeHtml(contact.phone)}</div>
            <div class="cc-badges">${sendBadge}${happyBadge}${dupBadge}</div>
          </div>`;
        }).join('')}
        </div>
      </div>`;
  }).join('');
}

/* ── 컨택트 상세 모달 ──────────────────────────────── */
function openDetailModal(groupId, contactId){
  const group   = findGroup(groupId);
  const contact = group?.contacts.find(c => c.id === contactId);
  if(!group || !contact) return;

  const send  = latestSendStatus(groupId, contactId);
  const happy = latestHappyCallStatus(groupId, contactId);
  const dupRisk = isDuplicateSendRisk(groupId, contactId);

  const sendLabel  = send ? ({'success':'발송 성공 ✓','fail':'발송 실패','pending':'미발송'}[send.status] || '-') : '기록 없음';
  const happyLabel = happy ? (happy.done ? '완료 ✓' : '미완료') : '기록 없음';
  const sentAt     = send?.sentAt ? new Date(send.sentAt).toLocaleString('ko-KR') : '-';

  document.getElementById('detailModalName').textContent = contact.name;

  document.getElementById('detailModalBody').innerHTML = `
    <div class="modal-row"><span class="modal-label">전화번호</span><span class="modal-value" style="font-family:'Space Mono',monospace">${escapeHtml(contact.phone)}</span></div>
    <div class="modal-row"><span class="modal-label">그룹</span><span class="modal-value">${escapeHtml(group.title)}</span></div>
    <div class="modal-row"><span class="modal-label">여행사</span><span class="modal-value">${escapeHtml(group.travelInfo.agency || '-')}</span></div>
    <div class="modal-row"><span class="modal-label">출발일</span><span class="modal-value">${escapeHtml(group.travelInfo.depDate || '-')} (${depDayOfWeek(group.travelInfo.depDate) || '-'})</span></div>
    <div class="modal-row"><span class="modal-label">여행지</span><span class="modal-value">${escapeHtml(group.travelInfo.destination || '-')} · ${escapeHtml(group.travelInfo.duration || '-')}</span></div>
    <div class="modal-row"><span class="modal-label">문자 발송</span><span class="modal-value">${sendLabel}</span></div>
    <div class="modal-row"><span class="modal-label">발송 시각</span><span class="modal-value">${sentAt}</span></div>
    <div class="modal-row"><span class="modal-label">해피콜</span><span class="modal-value">${happyLabel}</span></div>
    ${dupRisk ? '<div class="modal-row"><span class="modal-label" style="color:var(--danger)">⚠️ 중복 발송 경고</span><span class="modal-value" style="color:var(--danger)">2회 이상 발송</span></div>' : ''}
    ${contact.note ? `<div class="modal-row"><span class="modal-label">메모</span><span class="modal-value">${escapeHtml(contact.note)}</span></div>` : ''}
  `;

  document.getElementById('detailModalActions').innerHTML = `
    <a class="btn btn-success" href="tel:${contact.phone}" style="flex:1;text-decoration:none;text-align:center">해피콜전화</a>
    <button class="btn btn-success" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px" onclick="setHappyCall('${groupId}','${contactId}',true);closeDetailModal()">
      <span style="display:inline-block;width:20px;height:20px;border-radius:5px;border:2px solid #fff;background:${happy?.done ? '#4ade80' : 'transparent'};line-height:16px;text-align:center;font-size:14px">${happy?.done ? '✓' : ''}</span>
    </button>
    <button class="btn btn-ghost"   style="flex:1" onclick="setHappyCall('${groupId}','${contactId}',false);closeDetailModal()">해피콜 보류</button>
  `;

  document.getElementById('contactDetailModal').classList.add('show');
}
function closeDetailModal(){ document.getElementById('contactDetailModal').classList.remove('show'); }
function handleDetailModalBg(e){ if(e.target.id === 'contactDetailModal') closeDetailModal(); }

function copyDefaultTemplate(){
  const copy = {
    ...deepClone(DEFAULT_TEMPLATE),
    id: uid('tpl'),
    kind: 'user',
    locked: false,
    name: `출발안내 복사본 ${state.userTemplates.filter(t => t.name.startsWith('출발안내 복사본')).length + 1}`,
    updatedAt: todayIso(),
    createdAt: todayIso()
  };
  state.userTemplates.unshift(copy);
  saveState();
  renderTemplatePage();
  showToast('기본 템플릿 복사본을 만들었습니다','success');
}
function resetDefaultTemplate(){
  if(!confirm('기본 출발안내를 원본으로 초기화하시겠습니까?')) return;
  state.defaultTemplates = [deepClone(DEFAULT_TEMPLATE)];
  saveState(); renderTemplatePage(); updateTemplateSelect(); renderSmsArea();
  showToast('기본 출발안내를 원본으로 복구했습니다', 'info');
}
function openTemplateEditor(id=null){
  currentEditTemplateId = id;
  const tpl = id ? findTemplate(id) : null;
  document.getElementById('templateEditorTitle').textContent = tpl ? '템플릿 편집' : '새 템플릿';
  document.getElementById('templateName').value = tpl?.name || '';
  document.getElementById('templateType').value = tpl?.type || '사용자';
  document.getElementById('templateContent').value = tpl?.content || '';
  document.getElementById('deleteTemplateBtn').style.display = tpl && !tpl.locked ? 'inline-flex' : 'none';
  document.getElementById('templateEditorModal').classList.add('show');
}
function closeTemplateEditor(){ document.getElementById('templateEditorModal').classList.remove('show'); currentEditTemplateId = null; }
function saveTemplateEditor(){
  const name = document.getElementById('templateName').value.trim();
  const type = document.getElementById('templateType').value;
  const content = document.getElementById('templateContent').value;
  if(!name || !content.trim()){ showToast('이름과 내용을 입력해주세요','error'); return; }
  if(currentEditTemplateId){
    if(currentEditTemplateId === DEFAULT_TEMPLATE.id){
      const d = state.defaultTemplates[0];
      d.name = name; d.type = type; d.content = content; d.updatedAt = todayIso();
    } else {
      const tpl = state.userTemplates.find(t => t.id === currentEditTemplateId);
      if(!tpl){ showToast('템플릿을 찾을 수 없습니다','error'); return; }
      tpl.name = name; tpl.type = type; tpl.content = content; tpl.updatedAt = todayIso();
    }
  } else {
    state.userTemplates.unshift({ id:uid('tpl'), kind:'user', locked:false, type, name, content, createdAt:todayIso(), updatedAt:todayIso() });
  }
  saveState(); renderTemplatePage(); updateTemplateSelect(); renderSmsArea(); closeTemplateEditor(); showToast('템플릿을 저장했습니다','success');
}
function deleteTemplateEditor(){
  if(!currentEditTemplateId) return;
  state.userTemplates = state.userTemplates.filter(t => t.id !== currentEditTemplateId);
  saveState(); renderTemplatePage(); updateTemplateSelect(); renderSmsArea(); closeTemplateEditor(); showToast('삭제했습니다','info');
}
function insertTagToEditor(tag){
  const ta = document.getElementById('templateContent');
  const start = ta.selectionStart || 0;
  const end = ta.selectionEnd || 0;
  ta.value = ta.value.slice(0,start) + tag + ta.value.slice(end);
  ta.focus(); ta.selectionStart = ta.selectionEnd = start + tag.length;
}

function renderTemplatePage(){
  const list = document.getElementById('templateList');
  const all = getAllTemplates();
  list.innerHTML = all.map(t => `
    <div class="template-card">
      <div class="template-head">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <div class="template-name">${escapeHtml(t.name)}</div>
            ${t.locked ? `<button class="mini-btn tpl-reset-btn" style="color:var(--warn);border-color:rgba(251,191,36,.3);background:rgba(251,191,36,.08)">원문 초기화</button>` : ''}
          </div>
          <div class="contact-meta">
            ${t.locked ? `<span class="chip blue tpl-expand-btn" onclick="toggleTplPreview('${escapeHtml(t.id)}')" id="tpl-chip-${escapeHtml(t.id)}">기본 원문 ▼</span>` : '<span class="chip green">사용자 템플릿</span>'}
            <span class="chip">${escapeHtml(t.type || '사용자')}</span>
          </div>
        </div>
        <div class="member-actions" style="flex-direction:row;gap:5px;align-items:center">
          ${t.locked
            ? `<button class="mini-btn tpl-edit-btn" data-id="${escapeHtml(t.id)}">편집</button>
               <button class="mini-btn tpl-copy-btn">복사</button>`
            : `<button class="mini-btn tpl-edit-btn" data-id="${escapeHtml(t.id)}">편집</button>`}
        </div>
      </div>
      <div class="template-preview" id="tpl-preview-${escapeHtml(t.id)}">${escapeHtml(resolveTags(t.content))}</div>
    </div>`).join('');
  // 이벤트 위임
  list.querySelectorAll('.tpl-copy-btn').forEach(btn => btn.addEventListener('click', copyDefaultTemplate));
  list.querySelectorAll('.tpl-reset-btn').forEach(btn => btn.addEventListener('click', resetDefaultTemplate));
  list.querySelectorAll('.tpl-edit-btn').forEach(btn => btn.addEventListener('click', () => openTemplateEditor(btn.dataset.id)));
}

function toggleTplPreview(id){
  const preview = document.getElementById('tpl-preview-' + id);
  const chip    = document.getElementById('tpl-chip-' + id);
  if(!preview || !chip) return;
  const expanded = preview.classList.toggle('expanded');
  chip.textContent = '기본 원문 ' + (expanded ? '▲' : '▼');
}

function hydrateUI(){
  bindGuideProfile();
  bindTravelInfoToForm();
  buildGroupPreview();
  renderDraftList();
  renderTemplatePage();
  renderManagePage();
  renderSmsArea();
  document.getElementById('versionBadge').textContent = `v${APP_META.appVersion}`;
}

function initTagButtons(){
  const html = TAGS.map(tag => `<button type="button" class="tag-btn" onclick="insertTagToEditor('${tag.replace(/'/g, "\\'")}')">${tag}</button>`).join('');
  document.getElementById('tagButtons').innerHTML = html;
}

function formatMeetingTime(val){
  const v = val.trim();
  if(!v) return v;
  // 이미 변환된 형식이면 그대로
  if(/^(오전|오후)/.test(v)) return v;
  if(/:/.test(v)) return v;
  // 숫자 4자리(HHMM) 또는 3자리(HMM) 처리
  const digits = v.replace(/\D/g, '');
  if(digits.length === 3 || digits.length === 4){
    const h = digits.length === 4 ? parseInt(digits.slice(0,2),10) : parseInt(digits.slice(0,1),10);
    const m = digits.length === 4 ? digits.slice(2) : digits.slice(1);
    if(h >= 0 && h <= 23 && parseInt(m,10) <= 59){
      const ampm = h < 12 ? '오전' : '오후';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${ampm} ${String(h12).padStart(2,'0')}:${m}`;
    }
  }
  return v;
}

function bindEvents(){
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  ['depDate','destination','duration','agency','flightOut','flightIn','meetingTime','meetingPlace','hotelName','hotelPhone','extraMemo','weatherMin','weatherMax','weatherNotice'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', buildGroupPreview);
  });
  // 미팅시간 입력 완료(blur) 시 자동 포맷 변환
  const meetingTimeEl = document.getElementById('meetingTime');
  if(meetingTimeEl){
    meetingTimeEl.addEventListener('blur', function(){
      const converted = formatMeetingTime(this.value);
      if(converted !== this.value){
        this.value = converted;
        buildGroupPreview();
      }
    });
  }
  document.getElementById('guideName').addEventListener('input', syncGuideProfile);
  document.getElementById('guidePhone').addEventListener('input', syncGuideProfile);
  document.getElementById('excelInput').addEventListener('change', async e => {
    const input = e.target;
    const file = input.files && input.files[0];
    if(file) await handleFileUpload(file, 'excel');
    input.value = '';
  });

  document.getElementById('pdfInput').addEventListener('change', async e => {
    const input = e.target;
    const file = input.files && input.files[0];
    if(file) await handleFileUpload(file, 'pdf');
    input.value = '';
  });

  document.getElementById('wordInput').addEventListener('change', async e => {
    const input = e.target;
    const file = input.files && input.files[0];
    if(file) await handleFileUpload(file, 'word');
    input.value = '';
  });
  document.getElementById('directAddBtn').addEventListener('click', handleDirectAdd);
  // 번호 칸에서 Enter → 직접 추가 실행
  document.getElementById('inputPhone').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); handleDirectAdd(); }
  });
  // 이름 칸에서 Enter → 번호 칸으로 포커스 이동
  document.getElementById('inputName').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); document.getElementById('inputPhone').focus(); }
  });
  document.getElementById('resetExtractBtn').addEventListener('click', resetExtract);
  document.getElementById('resetTravelInfoBtn').addEventListener('click', resetTravelInfo);
  document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
    const selected = getSelectedDrafts();
    if(!selected.length){ showToast('선택된 인원이 없습니다','error'); return; }
    const selectedIds = new Set(selected.map(x => x.id));
    state.extractedContactsDraft = state.extractedContactsDraft.filter(x => !selectedIds.has(x.id));
    saveState(); renderDraftList(); showToast(`${selected.length}명을 삭제했습니다`,'info');
  });
  document.getElementById('saveAndSendBtn').addEventListener('click', saveGroupAndGoSms);
  document.getElementById('selectAllDraft').addEventListener('change', e => toggleAllDraft(e.target.checked));
  document.getElementById('closeContactEditorBtn').addEventListener('click', closeContactEditor);
  document.getElementById('saveContactEditorBtn').addEventListener('click', saveContactEditor);
  document.getElementById('deleteContactEditorBtn').addEventListener('click', deleteContactEditor);
  document.getElementById('loadLatestGroupBtn').addEventListener('click', loadLatestGroup);
  document.getElementById('copyMessageBtn').addEventListener('click', copyCurrentMessage);
  document.getElementById('smsTemplateSelect').addEventListener('change', renderSmsArea);
  document.getElementById('smsPreview').addEventListener('input', () => {
    const v = document.getElementById('smsPreview').value;
    document.getElementById('charInfo').textContent = `${v.length}자 · ${v.length <= 90 ? 'SMS' : 'MMS 가능성'}`;
  });
  document.getElementById('startSendBtn').addEventListener('click', () => { if(buildQueue()){ openSmsForCurrent(); } });
  document.getElementById('sendCurrentBtn').addEventListener('click', openSmsForCurrent);
  document.getElementById('markCurrentSentBtn').addEventListener('click', ()=>advanceQueue('success'));
  document.getElementById('markCurrentFailBtn').addEventListener('click', ()=>advanceQueue('fail'));
  document.getElementById('markCurrentPendingBtn').addEventListener('click', ()=>advanceQueue('pending'));
  
  document.getElementById('manageSearch').addEventListener('input', renderManagePage);
  document.getElementById('manageFilter').addEventListener('change', function(){
    const filter = this.value;
    renderManagePage();
    if(filter === 'moveGroup'){
      // 검색된 첫 번째 그룹을 현재 발송 그룹으로 이동
      const search = document.getElementById('manageSearch').value.trim().toLowerCase();
      const matched = state.savedGroups.filter(group => {
        if(!search) return true;
        const hay = `${group.title} ${group.travelInfo.agency || ''} ${group.contacts.map(c=>`${c.name} ${c.phone}`).join(' ')}`.toLowerCase();
        return hay.includes(search);
      });
      if(matched.length){
        state.selectedGroupId = matched[0].id;
        saveState(); renderManagePage(); renderSmsArea();
        showToast(`"${matched[0].title}" 을 현재 발송 그룹으로 이동했습니다`, 'success');
      } else {
        showToast('검색 결과가 없습니다', 'error');
      }
      this.value = 'all';
    } else if(filter === 'deleteGroup'){
      // 검색된 첫 번째 그룹의 명단 전체를 한번에 삭제
      const search = document.getElementById('manageSearch').value.trim().toLowerCase();
      const matched = state.savedGroups.filter(group => {
        if(!search) return true;
        const hay = `${group.title} ${group.travelInfo.agency || ''} ${group.contacts.map(c=>`${c.name} ${c.phone}`).join(' ')}`.toLowerCase();
        return hay.includes(search);
      });
      if(matched.length){
        const target = matched[0];
        const _cfm2 = document.createElement('div');
        _cfm2.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center';
        _cfm2.innerHTML = `
          <div style="background:#1e1e2e;border-radius:16px;padding:24px 20px;max-width:290px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.5)">
            <div style="font-size:15px;font-weight:800;color:var(--text1);margin-bottom:8px">"${escapeHtml(target.title)}"</div>
            <div style="font-size:13px;color:var(--text2);margin-bottom:20px;line-height:1.5">명단 ${target.contacts.length}명을 전체 삭제하시겠습니까?<br>이 작업은 되돌릴 수 없습니다.</div>
            <div style="display:flex;gap:8px">
              <button id="_cfm2Cancel" style="flex:1;padding:11px;border-radius:10px;border:none;background:var(--surface3);color:var(--text2);font-size:14px;font-weight:700;cursor:pointer">취소</button>
              <button id="_cfm2Ok" style="flex:1;padding:11px;border-radius:10px;border:none;background:#f87171;color:#fff;font-size:14px;font-weight:700;cursor:pointer">삭제</button>
            </div>
          </div>`;
        document.body.appendChild(_cfm2);
        _cfm2.querySelector('#_cfm2Cancel').addEventListener('click', ()=> _cfm2.remove());
        _cfm2.querySelector('#_cfm2Ok').addEventListener('click', ()=>{
          target.contacts = [];
          saveState(); renderManagePage(); renderSmsArea();
          showToast(`"${target.title}" 명단 전체 삭제 완료`, 'info');
          _cfm2.remove();
        });
      } else {
        showToast('검색 결과가 없습니다', 'error');
      }
      this.value = 'all';
    }
  });
  // exportGroupVcfBtn 제거됨 — KPI 연락처저장 팝업에서 처리
  document.getElementById('newTemplateBtn').addEventListener('click', ()=>openTemplateEditor(null));
  document.getElementById('closeTemplateEditorBtn').addEventListener('click', closeTemplateEditor);
  document.getElementById('saveTemplateBtn').addEventListener('click', saveTemplateEditor);
  document.getElementById('deleteTemplateBtn').addEventListener('click', deleteTemplateEditor);
  document.getElementById('contactEditorModal').addEventListener('click', e => { if(e.target.id === 'contactEditorModal') closeContactEditor(); });
  document.getElementById('templateEditorModal').addEventListener('click', e => { if(e.target.id === 'templateEditorModal') closeTemplateEditor(); });
}

// pdf.js 워커 전역 초기화 (매번 재설정 방지)
if(typeof pdfjsLib !== 'undefined'){
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

/* ── CDN 로드 실패 감지 (GitHub Pages / 모바일 네트워크 대비) ──
   xlsx/pdf.js 는 동기 script 태그이므로 즉시 점검.
   mammoth 는 동적 삽입(비동기)이므로 2초 후 별도 점검.
─────────────────────────────────────────────────────────────── */
(function checkLibraries(){
  const missing = [];
  if(typeof XLSX === 'undefined')      missing.push('xlsx.js (Excel 업로드 불가)');
  if(typeof pdfjsLib === 'undefined')  missing.push('pdf.js (PDF 업로드 불가)');
  if(missing.length){
    requestAnimationFrame(() => {
      showToast('⚠️ 라이브러리 로드 실패 — 네트워크를 확인 후 새로고침 해주세요', 'error');
      console.warn('[JGSAS] CDN 로드 실패:', missing.join(', '));
    });
  }
  // mammoth는 동적 스크립트 삽입 방식이므로 로드 완료까지 대기 후 점검
  setTimeout(function(){
    if(typeof mammoth === 'undefined'){
      showToast('⚠️ Word 라이브러리 로드 실패 — 새로고침 해주세요', 'error');
      console.warn('[JGSAS] CDN 로드 실패: mammoth.js (Word 업로드 불가)');
    }
  }, 2000);
})();

loadState();
initTagButtons();
bindEvents();
hydrateUI();
// 템플릿 사전 로드 — 첫 파일 업로드 전 캐시 (실패해도 앱 동작 보장)
loadExtractionTemplates();

/* ── 뒤로가기 SPA 지원 (v4e 추가) ─────────────────────
   최초 로드 시 현재 탭(schedule)을 history 기준점으로 등록.
   탭 이동마다 pushState로 스택 쌓고,
   popstate 발생 시 state.tab으로 탭 복원.
─────────────────────────────────────────────────────── */
(function initHistoryNav(){
  const TABS = ['schedule','sms','manage','template'];
  // 초기 상태 등록 (replaceState — 스택 추가 없이 현재 항목 교체)
  history.replaceState({ tab: 'schedule' }, '', '');

  window.addEventListener('popstate', function(e){
    const tab = e.state && TABS.includes(e.state.tab) ? e.state.tab : 'schedule';
    // fromHistory=true 전달 → switchTab 내부에서 pushState 재호출 방지
    switchTab(tab, true);
  });
})();

/* ── [추가] 헤더 숨김/표시 토글 ─────────────────────── */
(function(){
  const STORAGE_KEY = 'jgsas_header_hidden';
  const header = document.querySelector('header.header');
  const tabs   = document.querySelector('nav.tabs');
  const restoreBtn = document.getElementById('headerRestoreBtn');

  function applyState(hidden){
    if(hidden){
      header.classList.add('header-hidden');
      tabs.style.top = '0';
      restoreBtn.classList.add('visible');
    } else {
      header.classList.remove('header-hidden');
      tabs.style.top = '';
      restoreBtn.classList.remove('visible');
    }
  }

  // 저장된 상태 복원
  applyState(localStorage.getItem(STORAGE_KEY) === '1');

  window.toggleHeader = function(){
    const hidden = !header.classList.contains('header-hidden');
    localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
    applyState(hidden);
  };
})();
