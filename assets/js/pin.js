/* ── 암호 잠금 시스템 ──────────────────────────────────
   - 4자리 숫자 PIN
   - 인증 후 24시간 유지 (재접속 시 입력 생략)
   - 3회 오류 시 30분 잠금
   - 앱 내부에서 암호 변경 가능
─────────────────────────────────────────────────────── */
const PIN_DEFAULT = '0000'; // 초기 기본 암호
const PIN_MAX_FAIL = 3;
const PIN_LOCK_MINUTES = 30;
const PIN_STORAGE_KEY = 'jgsas_pin_state';
const PIN_SESSION_HOURS = 24; // 인증 유지 시간

let pinCurrent = '';
let pinChangeStep = 0; // 0:비활성 1:현재암호확인 2:새암호입력 3:새암호확인
let pinNewCode = '';

function pinGetState(){
  try{ return JSON.parse(localStorage.getItem(PIN_STORAGE_KEY)) || {}; }
  catch(e){ return {}; }
}
function pinSetState(obj){
  localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(obj));
}
function pinGetCode(){
  const s = pinGetState();
  return s.userPin || PIN_DEFAULT;
}
async function pinHash(plain){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function pinUpdateDots(){
  for(let i=0;i<4;i++){
    document.getElementById('pd'+i).classList.toggle('filled', i < pinCurrent.length);
  }
}

function pinInput(num){
  const lockMsg = document.getElementById('pinLockMsg');
  const s = pinGetState();
  if(s.lockedUntil && Date.now() < s.lockedUntil){
    const remain = Math.ceil((s.lockedUntil - Date.now()) / 60000);
    lockMsg.textContent = `⛔ ${remain}분 후 다시 시도하세요`;
    return;
  }
  if(pinCurrent.length >= 4) return;
  pinCurrent += num;
  pinUpdateDots();
  if(pinCurrent.length === 4){
    if(pinChangeStep > 0){
      setTimeout(() => pinChangeHandle(), 150);
    } else {
      setTimeout(() => pinCheck(s), 150);
    }
  }
}

function pinDelete(){
  if(pinCurrent.length > 0){
    pinCurrent = pinCurrent.slice(0,-1);
    pinUpdateDots();
    document.getElementById('pinError').textContent = '';
  }
}

async function pinCheck(s){
  const isDefault = !s.userPin;
  let matched = false;

  if(isDefault){
    matched = pinCurrent === PIN_DEFAULT;
  } else {
    // 마이그레이션: 평문 4자리 PIN → SHA-256 해시로 자동 변환
    let storedHash = s.userPin;
    if(/^\d{4}$/.test(storedHash)){
      storedHash = await pinHash(storedHash);
      s = { ...s, userPin: storedHash };
      pinSetState(s);
    }
    const inputHash = await pinHash(pinCurrent);
    matched = inputHash === storedHash;
  }

  pinCurrent = '';
  pinUpdateDots();

  if(matched){
    if(isDefault){
      pinSetState({ ...s, failCount:0, lockedUntil:null });
      pinChangeStep = 2;
      pinNewCode = '';
      document.getElementById('pinError').textContent = '';
      document.getElementById('pinLockMsg').textContent = '초기 암호입니다. 새 암호를 설정해 주세요.';
      document.getElementById('pin-sub-text').textContent = '새 암호 4자리를 입력하세요';
    } else {
      const unlockedUntil = Date.now() + PIN_SESSION_HOURS * 60 * 60 * 1000;
      pinSetState({ ...s, failCount:0, lockedUntil:null, unlockedUntil, userPin: s.userPin });
      document.getElementById('pinLockScreen').classList.add('hide');
    }
  } else {
    const failCount = (s.failCount || 0) + 1;
    if(failCount >= PIN_MAX_FAIL){
      const lockedUntil = Date.now() + PIN_LOCK_MINUTES * 60 * 1000;
      pinSetState({ ...s, failCount, lockedUntil });
      document.getElementById('pinError').textContent = '';
      document.getElementById('pinLockMsg').textContent = `⛔ ${PIN_LOCK_MINUTES}분 잠금`;
    } else {
      pinSetState({ ...s, failCount });
      document.getElementById('pinError').textContent = `암호가 틀렸습니다 (${failCount}/${PIN_MAX_FAIL})`;
      document.getElementById('pinLockMsg').textContent = '';
    }
  }
}

/* ── 암호 변경 흐름 ── */
function openPinChange(){
  pinChangeStep = 1;
  pinCurrent = '';
  pinNewCode = '';
  pinUpdateDots();
  document.getElementById('pinError').textContent = '';
  document.getElementById('pinLockMsg').textContent = '';
  document.getElementById('pinLockScreen').classList.remove('hide');
  document.getElementById('pin-sub-text').textContent = '현재 암호를 입력하세요';
}

async function pinChangeHandle(){
  if(pinChangeStep === 1){
    // 현재 암호 확인 (해시 비교)
    const s = pinGetState();
    let storedHash = s.userPin;
    let correct = false;
    if(!storedHash){
      correct = pinCurrent === PIN_DEFAULT;
    } else {
      if(/^\d{4}$/.test(storedHash)){
        storedHash = await pinHash(storedHash);
        pinSetState({ ...s, userPin: storedHash });
      }
      correct = (await pinHash(pinCurrent)) === storedHash;
    }
    if(correct){
      pinChangeStep = 2;
      pinCurrent = '';
      pinUpdateDots();
      document.getElementById('pin-sub-text').textContent = '새 암호 4자리를 입력하세요';
      document.getElementById('pinError').textContent = '';
    } else {
      document.getElementById('pinError').textContent = '현재 암호가 틀렸습니다';
      pinCurrent = '';
      pinUpdateDots();
    }
  } else if(pinChangeStep === 2){
    pinNewCode = pinCurrent;
    pinChangeStep = 3;
    pinCurrent = '';
    pinUpdateDots();
    document.getElementById('pin-sub-text').textContent = '새 암호를 한 번 더 입력하세요';
    document.getElementById('pinError').textContent = '';
  } else if(pinChangeStep === 3){
    if(pinCurrent === pinNewCode){
      const s = pinGetState();
      const unlockedUntil = Date.now() + PIN_SESSION_HOURS * 60 * 60 * 1000;
      const hashedPin = await pinHash(pinNewCode);
      pinSetState({ ...s, userPin: hashedPin, failCount:0, lockedUntil:null, unlockedUntil });
      pinChangeStep = 0;
      pinCurrent = '';
      pinNewCode = '';
      pinUpdateDots();
      document.getElementById('pinLockScreen').classList.add('hide');
      document.getElementById('pin-sub-text').textContent = '4자리 암호를 입력하세요';
      setTimeout(() => showToast('암호가 변경되었습니다', 'success'), 100);
    } else {
      document.getElementById('pinError').textContent = '암호가 일치하지 않습니다. 다시 입력하세요';
      pinChangeStep = 2;
      pinCurrent = '';
      pinNewCode = '';
      pinUpdateDots();
      document.getElementById('pin-sub-text').textContent = '새 암호 4자리를 입력하세요';
    }
  }
}

// 잠금 화면 초기 상태 확인
(function initPin(){
  const s = pinGetState();

  // 기본 PIN 상태이면 항상 잠금화면 유지
  if(!s.userPin){
    document.getElementById('pinLockScreen').classList.remove('hide');
    return;
  }

  // 24시간 세션 유효하면 바로 앱 진입
  if(s.unlockedUntil && Date.now() < s.unlockedUntil){
    document.getElementById('pinLockScreen').classList.add('hide');
    return;
  }
  // 잠금 상태 확인
  if(s.lockedUntil && Date.now() < s.lockedUntil){
    const remain = Math.ceil((s.lockedUntil - Date.now()) / 60000);
    document.getElementById('pinLockMsg').textContent = `⛔ ${remain}분 후 다시 시도하세요`;
  }
})();
