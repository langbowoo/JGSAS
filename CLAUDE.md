# CLAUDE.md — JGSAS

> 마지막 업데이트: 2026-05-11 | 버전: v2.8

---

## 프로젝트 개요

**JGSAS** (Japan Guide SMS Automation System) — 일본 패키지 여행 가이드 업무 자동화 모바일 PWA.
여행사 명단 파일에서 고객 연락처 자동 추출 → 문자 발송 → 폰저장(VCF) 원스톱 처리.

- **사용자**: 아내 (IT 왕초보, 스마트폰 단독 사용)
- **배포**: GitHub Pages — `https://langbowoo.github.io/JGSAS/`
- **저장소**: `github.com/langbowoo/JGSAS` / 브랜치: main
- **git 설정**: username `langbowoo` / email `jungil6633@gmail.com`

---

## 기술 스택

- **구조**: 순수 HTML + CSS + JS (빌드 도구 없음, GitHub Pages 정적 서빙)
- **저장소**: localStorage 전용 (서버·DB·API 없음)
- **외부 라이브러리**: xlsx.js 0.18.5 / pdf.js 3.4.120 / mammoth.js 1.11.0 (모두 cdnjs CDN)
- **플랫폼**: Mobile PWA (Android Chrome 기준)

---

## 파일 구조

```
/
├── index.html          ← HTML 구조 + CDN 로드
├── templates.json      ← 여행사별 추출 패턴 정의
├── assets/
│   ├── css/app.css     ← 전체 스타일 (CSS 변수 포함)
│   └── js/
│       ├── core.js     ← 상수·상태·localStorage 입출력
│       ├── main.js     ← 핵심 로직 전체
│       └── pin.js      ← PIN 잠금 시스템
└── CLAUDE.md
```

**탭 구성**: 여행일정(`schedule`) / 문자(`sms`) / 관리(`manage`) / 템플릿(`template`)

---

## 핵심 로직 요약

### 연락처 추출 (5계층 fallback)
1. `templates.json` 패턴 매칭 (여행사별 특화)
2. `classifyDocument()` — `mixed` / `contacts_only` / `travel_only` 판별
3. `extractContactsFromExcel()` — 헤더 기반 컬럼 탐지
4. `extractContactsFromText()` — 정규식 직접 스캔
5. 빈 결과 시 사용자 알림

### 주요 함수 위치
- **상태 입출력**: `loadState()` / `saveState()` → `core.js`
- **이벤트 등록**: `bindEvents()` → `main.js`
- **UI 렌더링**: `hydrateUI()` → `main.js` (상태 변경 후 반드시 호출)
- **탭 전환**: `switchTab(tabName, fromHistory?)` → `main.js`
- **초기화 순서**: `loadState()` → `initTagButtons()` → `bindEvents()` → `hydrateUI()` → `initHistoryNav()`
- **VCF 저장**: `saveContactToPhoneSingle(contact, groupId)` → `main.js`
- **발송 큐**: `currentQueue = { groupId, templateId, ids[], index }` / `renderQueue()` → `main.js`

### localStorage 키
- `departureNoticeAppData_v3` — 전체 앱 상태
- `jgsas_pin_state` — PIN 상태
- `jgsas_header_hidden` — 헤더 숨김 상태

### SMS 태그 치환
`TAGS` 배열 (`core.js`) — `{이름}` `{출발일}` `{여행지}` `{기간}` `{여행사}` `{출국편}` `{귀국편}` `{미팅시간}` `{미팅장소}` `{날씨안내}` `{호텔명}` `{호텔전화}` `{가이드}` `{가이드연락처}` `{기본수화물}` 등

---

## 절대 규칙

1. **파일 구조 유지** — 추가 파일 분리 시 반드시 논의
2. **서버 연동 없음** — localStorage만 사용
3. **CDN 라이브러리** — 동적 삽입 금지, cdnjs 동기 로드만
4. **모바일 최우선** — Android Chrome 기준, 터치 최적화
5. **상태 접근** — `loadState()` / `saveState()` 경유, 직접 localStorage 접근 금지
6. **CSS 변수** — `app.css` `:root` 블록에서만 수정

---

## 배포 명령

```bash
git add . && git commit -m "feat: ..." && git push
```

---

## 에이전트 원칙

| 작업 유형 | 순서 |
|-----------|------|
| 일반 수정 | 작업 → verify-agent → doc-updater |
| 대형 기능 | planner → 작업 → code-reviewer → verify-agent → doc-updater |
| 라이브러리 교체 | planner 필수 |

**doc-updater 필수 동작**: 버전 업 시 아래 두 곳을 반드시 동시에 수정한다.
1. `CLAUDE.md` 상단 `버전: vX.Y`
2. `assets/js/core.js` `APP_META.appVersion: 'X.Y'`

---

## 버전 히스토리 (최근 3개)

| 버전 | 주요 변경 |
|------|-----------|
| v2.6 | 발송 큐 카운터·완료 목록 버그 수정 (doneCount/totalCount/sentListHtml 누적 기준 전환) |
| v2.7 | 관리탭 연락처 카드 버튼 UI 개편: 저장✓ 배지 제거, 해피콜 버튼 초록 스타일 통일, 해피콜 클릭 시 state.happyCallLogs 저장(그룹별·인원별) + tel: 전화, 완료 시 두 버튼 모두 .cc-btn-done 비활성 스타일, 그룹 삭제 시 happyCallLogs 정리 |
| v2.8 | 출발일 포맷 "5월14일(목)" 형식 통일(formatDepDateKorean 신설), 가이드 번호 오추출 방지 강화(GUIDE_SKIP_KEYWORDS·STOPWORDS 확장), 항공편 정규식 숫자+문자 혼합 코드 인식([A-Z0-9]{2}), PHONE_HEADERS 확장, autofillTravelForm·parseExcelFile 버그 수정 |
