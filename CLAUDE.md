# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 마지막 업데이트: 2026-05-08 | 버전: v2.6

---

## 빌드 및 개발 환경

빌드 도구, 번들러, 패키지 매니저, 테스트 프레임워크가 **없다.** 순수 HTML+CSS+JS이며 GitHub Pages로 정적 파일을 그대로 서빙한다.

```bash
# 로컬 확인 (브라우저에서 직접 열기)
# file:// 로 열면 mammoth.js CDN 로드가 실패하므로 반드시 HTTP 서버 사용
python -m http.server 8080   # 또는 npx serve .

# 배포 (GitHub Pages 자동 배포)
git add . && git commit -m "feat: ..." && git push
# → https://langbowoo.github.io/JGSAS/ 에 즉시 반영
```

---

## 프로젝트 개요

**JGSAS** (Japan Guide SMS Automation System)
일본 패키지 여행 전문 가이드(15년 경력)의 업무 자동화를 위한 모바일 PWA 앱.
여행사 명단 파일에서 고객 연락처를 자동 추출해 문자 발송, 연락처 저장, 해피콜 관리까지 원스톱으로 처리한다.

**사용자**: 아내 (IT 왕초보, 스마트폰 단독 사용)
**개발자**: 랭보우 (바이브코딩 기반, Claude Code 활용)

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 구조 | HTML + 분리된 CSS/JS 파일 (`assets/` 폴더) |
| 플랫폼 | Mobile PWA (iOS Safari / Android Chrome) |
| 배포 | GitHub Pages (git push → 자동 배포) |
| 저장소 | localStorage (서버 없음, 완전 클라이언트) |
| 외부 라이브러리 | xlsx.js 0.18.5, pdf.js 3.4.120, mammoth.js 1.11.0 (모두 CDN) |
| 폰트 | Noto Sans KR, Space Mono (Google Fonts) |

---

## 앱 구조

### 파일 구성
```
/
├── index.html              ← HTML 구조 (346줄) — CDN 로드 + assets 참조
├── templates.json          ← 템플릿 기반 추출 엔진 패턴 정의 (v2.0 신규)
├── assets/
│   ├── css/
│   │   └── app.css         ← 전체 CSS 스타일 (195줄)
│   └── js/
│       ├── core.js         ← 상수·상태 초기화·localStorage 입출력 (154줄)
│       ├── main.js         ← 핵심 로직 전체 (~2910줄)
│       └── pin.js          ← PIN 잠금 시스템 (205줄)
├── index_backup.html       ← 백업본
├── README.md               ← GitHub 표시용
└── CLAUDE.md               ← 이 파일
```
> **총 코드량**: ~3,810줄
> **manifest.json / sw.js**: PWA 홈화면 설치용 — 아직 미추가 (TODO)

### 탭 구성 (4개)
1. **여행일정** (`schedule`) — 파일 업로드(Excel/PDF/Word), 여행 기본정보 자동인식, 연락처 추출
2. **문자** (`sms`) — SMS 템플릿 선택, 발송 큐, 수신자 선택
3. **관리** (`manage`) — 그룹별 연락처 카드, VCF 저장, 발송 상태 관리
4. **템플릿** (`template`) — SMS 템플릿 CRUD, 기본 템플릿 복사

### 주요 UI 컴포넌트
- **PIN 잠금 화면** (`#pinLockScreen`) — 4자리 암호, SHA-256 해시 저장, 3회 실패 시 30분 잠금, 24시간 세션 유지
- **헤더** (`header.header`) — 앱명 + 버전배지 + 가이드 정보 + 숨기기 버튼
- **헤더 복원 버튼** (`#headerRestoreBtn`) — 헤더 숨김 시 화면 최상단 고정 노출
- **탭 네비게이션** (`nav.tabs`) — sticky, 헤더 높이에 따라 top 값 동적 조정

---

## 핵심 기능 및 로직

### 연락처 추출 엔진 (v3)
- Excel: XLSX 라이브러리로 시트 파싱 → 이름/전화번호 컬럼 자동 탐지
- PDF: pdf.js로 텍스트 추출 → 정규식으로 이름·전화번호 패턴 매칭
- Word: mammoth.js로 텍스트 변환 → 동일 패턴 적용
- 문서 유형 판별: `travel_only` / `contacts_only` / `mixed` / `unknown`
- 여행정보 + 고객명단 분리 추출 → 폼 자동 채움
- 추출 후 추가 파일 업로드 가능 + 스마트 병합 지원

**5계층 fallback 순서** (`handleFileUpload` 내부):
1. `templates.json` 패턴 매칭 (여행사별 특화 규칙)
2. 문서 유형 판별 (`classifyDocument`) → `mixed` / `contacts_only` / `travel_only`
3. Excel 헤더 기반 컬럼 탐지 (`extractContactsFromExcel`)
4. 정규식 직접 스캔 (`extractContactsFromText`)
5. 빈 결과 시 사용자 알림

**templates.json 구조**: 각 템플릿은 `id`, `name`, `priority`, `detect.keywords`, `detect.minMatches` 를 가짐. `inherits` 로 다른 템플릿을 확장 가능. `fields` 에서 각 여행정보 필드의 추출 패턴/변환 규칙을 정의.

### SMS 발송 흐름
1. 그룹 선택 → 수신자 체크 → 템플릿 선택 → 미리보기 → 발송
2. 발송 상태: 미발송 / 발송완료(green) / 실패(red)
3. 발송 이력 localStorage 저장

**SMS 태그 치환**: `TAGS` 배열(core.js:25)에 정의된 `{이름}`, `{출발일}`, `{출발일요일}`, `{여행지}`, `{기간}`, `{여행사}`, `{출국편}`, `{귀국편}`, `{미팅시간}`, `{미팅장소}`, `{최저기온}`, `{최고기온}`, `{날씨안내}`, `{호텔명}`, `{호텔전화}`, `{가이드}`, `{가이드연락처}`, `{추가메모}`, `{기본수화물}` 등. `{출발일요일}`은 `depDayOfWeek()` 함수로 런타임 계산.

**renderQueue 흐름**: `currentQueue = { groupId, templateId, ids[], index }` — `renderQueue()` 가 index를 순회하며 `#smsPreview` textarea를 갱신. "다음문자" 버튼은 index++.

### 데이터 저장 (localStorage)
- `departureNoticeAppData_v3` — 전체 앱 상태 (그룹·연락처·여행정보·템플릿·가이드 프로필 포함)
- `jgsas_header_hidden` — 헤더 숨김 상태 (`'1'` / `'0'`)
- `jgsas_pin_state` — PIN 상태 (SHA-256 해시 저장, 실패 횟수, 잠금 시각 등)

### VCF 저장 흐름 (v2.5 신설)
- `saveContactToPhoneSingle(contact, groupId)` — 단일 연락처를 VCF Blob으로 변환해 `<a download>` 트리거
- `phoneSaveLogs[contactId]` — 저장 일시 기록 (`state` 내 객체, `saveState()` 로 영속화)
- VCF `FN` 필드는 `sanitizeLine()` 으로 줄바꿈 문자 제거

### 뒤로가기 지원
- History API (`pushState` / `popstate`) 로 SPA 탭 이동 처리

---

## CSS 디자인 시스템

### 색상 변수 (CSS Custom Properties)
```css
--bg: #0f1117          /* 페이지 배경 */
--surface: #1a1d27     /* 카드 배경 */
--surface2: #22263a    /* 입력 필드 배경 */
--surface3: #11141c    /* 진한 배경 */
--accent: #4f8ef7      /* 파란색 (주요 액션) */
--accent2: #34d399     /* 초록색 (성공, 발송완료) */
--danger: #f87171      /* 빨간색 (삭제, 실패) */
--warn: #fbbf24        /* 노란색 (경고, 중복) */
--text: #f5f7ff        /* 기본 텍스트 */
--text2: #c0ccdc       /* 보조 텍스트 */
--muted: #8fa1b7       /* 흐린 텍스트 */
--border: #2e3348      /* 테두리 */
```

### 브레이크포인트
- 모바일: `max-width: 680px`
- 최대 너비: `820px` (중앙 정렬)

---

## 현재 버전 히스토리

| 버전 | 주요 변경 |
|------|-----------|
| v1.0 | 초기 버전 |
| v1.4 | 헤더 숨기기/복원, 뒤로가기 SPA 지원, mammoth.js CDN 로드 방식 수정 |
| v1.5 | UI 개선 및 기능 업데이트, PIN SHA-256 해시, 파일 분리(assets/), 추출엔진 v3 |
| v1.6 | mergeDraftContacts: _totalExtracted 누적 합산 방식으로 수정 (다중 파일 업로드 시 전체인원 정상 표시) |
| v1.7 | 명단추출 헤더 확장(한글이름), 가이드번호 오염 방지(Excel·텍스트 양쪽), PDF 여행정보 추출 보완(출발일·기간·호텔·여행사) |
| v1.8 | extractFirstDayHotel에 [H] 마커 패턴 추가 (PDF 확정서 호텔명 자동 추출) |
| v1.9 | PDF 추출 3종 버그 수정: normalizeText [H] 마커 보존, 제1일+날짜 동일줄 패턴, 제N일 기간 추론 |
| v2.0 | 템플릿 기반 추출 엔진 추가: templates.json + main.js 엔진 6종 함수 + handleFileUpload 연결 + 5계층 fallback |
| v2.1 | 전체인원 카운터 누적 불일치 수정: draftCountInline을 total(state.extractedContactsDraft.length) 기준으로 통일 |
| v2.2 | core.js APP_META appVersion '1.4' → '1.5' 버전 업 |
| v2.3 | renderQueue smsPreview 미갱신 수정: 다음문자 시 이름 고정 버그 해결 (현재 대상 contact 기준으로 textarea 업데이트) |
| v2.4 | 기본 수화물 필드 추가: 여행기본정보에 baggageKg 입력(숫자 전용, kg 자동 표시), 날씨안내 옆 같은 행 배치, 문자 템플릿 {기본수화물} 치환 지원 |
| v2.5 | 관리탭 UI/기능 전면 개편: 해피콜 시스템 제거 → 폰저장(VCF) 시스템 신설(phoneSaveLogs 상태, saveContactToPhoneSingle, 저장완료 모달·개별삭제), 연락처 카드 버튼 재편(해피콜 tel: + 폰저장 VCF blob), KPI "연락처저장"→"폰저장" 카운팅, VCF FN sanitizeLine 적용, CSS .cc-btn-row/.cc-btn/.cc-btn-save 신규 추가 |
| v2.6 | 발송 큐 카운터·완료 목록 버그 수정: doneCount/totalCount를 이전 세션 sendLogs 합산 기준으로 전환(이전 세션 완료자 누락 해소), totalCount를 group.contacts.length 기준으로 수정(전체 인원 정상 표시), sentListHtml을 prevSentContacts+sessionSentContacts 누적으로 변경 |

---

## 개발 원칙 및 주의사항

### 절대 규칙
1. **파일 구조 유지** — `index.html` + `templates.json` + `assets/css/app.css` + `assets/js/{core,main,pin}.js`. 추가 파일 분리 시 반드시 논의.
2. **서버 연동 없음** — localStorage만 사용. DB, API 추가 절대 금지.
3. **CDN 라이브러리** — xlsx, pdf.js, mammoth는 cdnjs 동기 로드. 동적 삽입 금지.
4. **모바일 최우선** — Android Chrome 기준으로 UI 검증. 터치 인터랙션 최적화.
5. **PWA 호환** — `apple-mobile-web-app-capable`, `viewport-fit=cover` 유지.

### 코드 수정 시 주의
- **CSS 변수**: `assets/css/app.css` 의 `:root` 블록에서만 수정
- **상태 입출력**: `loadState()` / `saveState()` (`assets/js/core.js`) — 직접 localStorage 접근 금지
- **이벤트 등록**: `bindEvents()` (`assets/js/main.js`) — 중복 등록 주의
- **UI 렌더링**: `hydrateUI()` (`assets/js/main.js`) — 상태 변경 후 반드시 호출 확인
- **탭 전환**: `switchTab(tabName, fromHistory?)` 함수 사용
- **상수/초기값**: `APP_META`, `DEFAULT_DEPARTURE_TEMPLATE`, `STORAGE_KEY` 는 `core.js` 에 위치
- **초기화 순서**: `loadState()` → `initTagButtons()` → `bindEvents()` → `hydrateUI()` → `initHistoryNav()`

### 배포
- **GitHub Pages** — git push → 자동 배포
- 저장소: `github.com/langbowoo/JGSAS`
- 배포 URL: `https://langbowoo.github.io/JGSAS/`
- 브랜치: main
- git 설정: username `langbowoo` / email `jungil6633@gmail.com`

---

## 에이전트 활용 원칙

| 작업 유형 | 사용 에이전트 |
|-----------|--------------|
| 일반 수정 (CSS, 텍스트, 로직) | 작업 후 verify-agent + doc-updater |
| 대형 기능 추가 | 시작 전 planner → 완료 후 code-reviewer + verify-agent + doc-updater |
| 라이브러리 교체 | 반드시 planner 먼저 |
