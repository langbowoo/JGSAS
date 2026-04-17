const APP_META = {
  appName: 'JGSAS',
  appVersion: '1.5',
  schemaVersion: 2,
  lastUpdated: '2026-03-14',
  githubCheckUrl: '',
  githubReleaseNote: 'v1.4: structuredClone 호환성 보강, 기본 PIN 우회 방지, 날짜 요일 계산 보정, 파일 재업로드 개선, 탭 히스토리 중복 방지, 자동인식 UI 안전 렌더링'
};

const DEFAULT_DEPARTURE_TEMPLATE = `안녕하세요! {이름}님 😊\n{출발일}({출발일요일}) {여행지} {기간} 여행을 안내하게 된 가이드 {가이드}입니다.\n안전하고 즐거운 여행을 위해 아래 안내사항을 꼭 정독해 주세요.\n대표자분께만 안내 문자를 드리오니 일행분들과 꼭 공유해 주시기 바랍니다.\n\n📍 공항 미팅 안내\n· 일시: {출발일}({출발일요일})  {미팅시간} {미팅장소}\n· 피켓명: {여행사} ✅\n\n✈️ 항공 정보\n· 출국: {출국편}(한국 출발)\n· 귀국: {귀국편}(현지 출발)\n· 수하물: 1인당 15kg (무료 위탁 기준)\n\n🌤️ 현지 날씨 및 준비물\n· 기온: {최저기온} ~ {최고기온}도\n· 날씨: {날씨}\n· 전압: 110V 돼지코 어댑터 필수\n· 환전: 엔화 현금 (작은 상점들은 현금만 가능)\n· 카드: 해외 결제 가능한 VISA, Master 등 비상용 카드\n· 기타: 선크림, 선글라스, 모자, 개인 상비약 💊\n· 샴푸·린스·칫솔·헤어 드라이기 등은 호텔에 비치됨\n· 온천 이용 시 별도 준비물 없음\n· 다이슨 드라이기 등 고전력 기기는 작동하지 않습니다\n\n📋 입국 서류: 가이드가 준비하여 공항 미팅 시 나눠드립니다. 별도 준비 불필요!\n\n🏨 호텔 정보\n· 호텔명: {호텔명}\n· 연락처: {호텔전화}\n\n⚠️ 중요 주의사항 (필독!)\n1. 한국에서 가져가시는 과일·육포 등 농수산물은 일본 세관 통과 불가 🚫\n2. 최근 일본 입국시 세관에서 금 제품및 고가의 반입 품목에 대한 조사가 매우 엄격히 시행 중입니다. 금목걸이·팔찌 등 고가 귀금속은 집에 두고 오시길 추천드립니다.\n3. 외부 음식: 현지 호텔 식당은 외부 식음료 반입 금지 🚫\n4. 보조배터리 및 전자담배 기내반입 절차  https://bit.ly/4llTm5G\n\n내일 해피콜로  연락드리겠습니다. 설레는 여행 준비 되세요! 🌸\n가이드 {가이드} {가이드연락처}`;

const DEFAULT_TEMPLATE = {
  id: 'default-departure-notice',
  kind: 'default',
  locked: true,
  type: '출발안내',
  name: '출발안내',
  content: DEFAULT_DEPARTURE_TEMPLATE,
  createdAt: APP_META.lastUpdated,
  updatedAt: APP_META.lastUpdated
};

const STORAGE_KEY = 'departureNoticeAppData_v3';
const LEGACY_KEYS = ['tourAppData', 'guideName', 'guidePhone', 'guideGroups'];
const TAGS = ['{이름}','{출발일}','{출발일요일}','{여행지}','{기간}','{여행사}','{출국편}','{미팅시간}','{미팅장소}','{귀국편}','{최저기온}','{최고기온}','{날씨}','{기온최저}','{기온최고}','{날씨안내}','{호텔명}','{호텔전화}','{가이드}','{가이드연락처}','{추가메모}'];
const STOPWORDS = new Set(['보호자','고객','손님','성인','소아','유아','룸조인','기사','인솔자','호텔','TEL','PHONE','연락처','항공','미팅','예약','대표','비상','안내','담당','팀장','팀원','선생','원장','부장','과장','차장','이사','대리','주임','실장','센터','여행','투어','번호','휴대폰','핸드폰','전화','문자','출발','도착','일정','가이드']);

let state = createInitialState();
let currentEditDraftId = null;
let currentEditTemplateId = null;
let currentQueue = { groupId:null, templateId:null, ids:[], index:-1 };
let _totalExtracted = 0; // 최초 추출된 전체인원 고정 카운트

function createInitialState(){
  return {
    appMeta: {...APP_META},
    defaultTemplates: [deepClone(DEFAULT_TEMPLATE)],
    userTemplates: [],
    currentTravelInfo: {
      depDate:'', destination:'', duration:'', agency:'', flightOut:'', flightIn:'',
      meetingTime:'', meetingPlace:'', hotelName:'', hotelPhone:'', extraMemo:'',
      weatherMin:'', weatherMax:'', weatherNotice:''
    },
    extractedContactsDraft: [],
    savedGroups: [],
    sendLogs: [],
    vcfLogs: [],
    happyCallLogs: [],
    guideProfile: { name:'', phone:'' },
    selectedGroupId: null
  };
}

function deepClone(obj){
  if(typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

function uid(prefix='id'){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
function todayIso(){ return new Date().toISOString(); }
function dateLabel(){ return new Date().toLocaleDateString('ko-KR'); }
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function showToast(msg,type='info'){ const el=document.getElementById('toast'); el.textContent=msg; el.className=`toast ${type} show`; clearTimeout(showToast._t); showToast._t=setTimeout(()=>el.className='toast',2200); }
function getDefaultTemplate(){ return state.defaultTemplates[0]; }
function getAllTemplates(){ ensureProtectedTemplate(); return [getDefaultTemplate(), ...state.userTemplates]; }
function findTemplate(id){ return getAllTemplates().find(t=>t.id===id); }
function getSelectedDrafts(){ return state.extractedContactsDraft.filter(x=>x.selected); }
function findGroup(id){ return state.savedGroups.find(g=>g.id===id); }

function ensureProtectedTemplate(){
  if (!state.defaultTemplates?.[0] || state.defaultTemplates[0].id !== DEFAULT_TEMPLATE.id) {
    state.defaultTemplates = [deepClone(DEFAULT_TEMPLATE)];
  }
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      state = migrateState(parsed);
    }else{
      state = migrateLegacyState();
    }
  }catch(err){
    console.warn('loadState failed', err);
    state = createInitialState();
  }
  ensureProtectedTemplate();
}

function migrateState(parsed){
  const base = createInitialState();
  const next = {...base, ...parsed};
  next.appMeta = {...base.appMeta, ...(parsed.appMeta||{})};
  next.defaultTemplates = Array.isArray(parsed.defaultTemplates) ? parsed.defaultTemplates : [deepClone(DEFAULT_TEMPLATE)];
  next.userTemplates = Array.isArray(parsed.userTemplates) ? parsed.userTemplates.filter(t=>t && t.id !== DEFAULT_TEMPLATE.id) : [];
  next.currentTravelInfo = {...base.currentTravelInfo, ...(parsed.currentTravelInfo||{})};
  next.extractedContactsDraft = Array.isArray(parsed.extractedContactsDraft) ? parsed.extractedContactsDraft : [];
  next.savedGroups = Array.isArray(parsed.savedGroups) ? parsed.savedGroups : [];
  next.sendLogs = Array.isArray(parsed.sendLogs) ? parsed.sendLogs : [];
  next.vcfLogs = Array.isArray(parsed.vcfLogs) ? parsed.vcfLogs : [];
  next.happyCallLogs = Array.isArray(parsed.happyCallLogs) ? parsed.happyCallLogs : [];
  next.guideProfile = {...base.guideProfile, ...(parsed.guideProfile||{})};
  next.selectedGroupId = parsed.selectedGroupId || null;
  next.appMeta.schemaVersion = APP_META.schemaVersion;
  return next;
}

function migrateLegacyState(){
  const base = createInitialState();
  try{
    const oldRaw = localStorage.getItem('tourAppData');
    if(oldRaw){
      const old = JSON.parse(oldRaw);
      base.guideProfile.name = old.guideName || localStorage.getItem('guideName') || '';
      base.guideProfile.phone = normalizePhone(old.guidePhone || localStorage.getItem('guidePhone') || '') || '';
      const groups = Array.isArray(old.savedGroups) ? old.savedGroups : JSON.parse(localStorage.getItem('guideGroups') || '[]');
      base.savedGroups = groups.map(g => ({
        id: String(g.id || uid('grp')),
        groupKey: g.label || [g.date,g.destination,g.duration,g.agency].filter(Boolean).join(''),
        title: [g.date,g.destination,g.duration].filter(Boolean).join('') || '이전 그룹',
        travelInfo: {
          depDate: g.date || '', destination: g.destination || '', duration: g.duration || '', agency: g.agency || '',
          flightOut:'', flightIn:'', meetingTime:'', meetingPlace:'', hotelName:'', hotelPhone:'', extraMemo:''
        },
        contacts: [{
          id: uid('contact'), name: g.name || '이름 미확인', phone: normalizePhone(g.phone) || '',
          selected: true, duplicate: false, nameUnconfirmed: !(g.name), note:'legacy import', extraPhones:[]
        }],
        createdAt: todayIso(), updatedAt: todayIso(), savedAt: g.savedAt || dateLabel()
      })).filter(g => g.contacts[0].phone);
      base.sendLogs = [];
    }
  }catch(err){ console.warn(err); }
  return base;
}

function saveState(){
  ensureProtectedTemplate();
  state.appMeta.lastUpdated = APP_META.lastUpdated;
  state.appMeta.appVersion = APP_META.appVersion;
  state.appMeta.schemaVersion = APP_META.schemaVersion;
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){
    if(e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'){
      // 오래된 sendLog 50개 초과분 제거 후 재시도
      if(state.sendLogs.length > 50) state.sendLogs = state.sendLogs.slice(-50);
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
      catch(e2){ console.warn('saveState: storage full', e2); showToast('저장 공간 부족 — 오래된 로그를 정리해주세요','error'); }
    } else { console.warn('saveState error', e); }
  }
}
