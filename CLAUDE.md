# CLAUDE.md — JGSAS 프로젝트 컨텍스트

> 마지막 업데이트: 2026-04-09 | 버전: v1.0

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
| 구조 | 단일 HTML 파일 (`index.html`) — 분리 없음 |
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
├── index.html          ← 앱 전체 (CSS + HTML + JS 단일 파일, ~3,500줄)
├── index_backup.html   ← 백업본
├── README.md           ← GitHub 표시용
├── CLAUDE.md           ← 이 파일
├── manifest.json       ← PWA 설정 (추가 예정)
└── sw.js               ← Service Worker (추가 예정)
```

### 탭 구성 (4개)
1. **여행일정** (`schedule`) — 파일 업로드(Excel/PDF/Word), 여행 기본정보 자동인식, 연락처 추출
2. **문자** (`sms`) — SMS 템플릿 선택, 발송 큐, 수신자 선택
3. **관리** (`manage`) — 그룹별 연락처 카드, VCF 저장, 발송 상태 관리
4. **템플릿** (`template`) — SMS 템플릿 CRUD, 기본 템플릿 복사

### 주요 UI 컴포넌트
- **PIN 잠금 화면** (`#pinLockScreen`) — 4자리 암호, 5회 실패 시 잠금
- **헤더** (`header.header`) — 앱명 + 버전배지 + 가이드 정보 + 숨기기 버튼
- **헤더 복원 버튼** (`#headerRestoreBtn`) — 헤더 숨김 시 화면 최상단 고정 노출
- **탭 네비게이션** (`nav.tabs`) — sticky, 헤더 높이에 따라 top 값 동적 조정

---

## 핵심 기능 및 로직

### 연락처 추출 엔진
- Excel: XLSX 라이브러리로 시트 파싱 → 이름/전화번호 컬럼 자동 탐지
- PDF: pdf.js로 텍스트 추출 → 정규식으로 이름·전화번호 패턴 매칭
- Word: mammoth.js로 텍스트 변환 → 동일 패턴 적용
- 여행사명, 출발일(패턴 B 포함) 자동 인식

### SMS 발송 흐름
1. 그룹 선택 → 수신자 체크 → 템플릿 선택 → 미리보기 → 발송
2. 발송 상태: 미발송 / 발송완료(green) / 실패(red)
3. 발송 이력 localStorage 저장

### 데이터 저장 (localStorage)
- `jgsas_state` — 전체 앱 상태 (그룹, 연락처, 여행정보 등)
- `jgsas_templates` — SMS 템플릿 목록
- `jgsas_guide` — 가이드 이름·전화번호
- `jgsas_header_hidden` — 헤더 숨김 상태
- `jgsas_pin` — PIN 암호 (해시 없이 문자열, 주의)

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

---

## 개발 원칙 및 주의사항

### 절대 규칙
1. **단일 파일 유지** — HTML/CSS/JS 분리 절대 금지. `index.html` 하나로만 운영.
2. **서버 연동 없음** — localStorage만 사용. DB, API 추가 절대 금지.
3. **CDN 라이브러리** — xlsx, pdf.js, mammoth는 cdnjs 동기 로드. 동적 삽입 금지.
4. **모바일 최우선** — iOS Safari 기준으로 UI 검증. 터치 인터랙션 최적화.
5. **PWA 호환** — `apple-mobile-web-app-capable`, `viewport-fit=cover` 유지.

### 코드 수정 시 주의
- CSS 변수는 `:root` 블록에서만 수정
- `loadState()` / `saveState()` 로 localStorage 입출력 일원화됨
- `bindEvents()` 에서 이벤트 리스너 일괄 등록 — 중복 등록 주의
- `hydrateUI()` 로 초기 UI 렌더링 — 상태 변경 후 반드시 호출 확인
- 탭 전환: `switchTab(tabName, fromHistory?)` 함수 사용

### 배포
- **GitHub Pages** — git push → 자동 배포
- 저장소: `github.com/langbowoo/JGSAS`
- 배포 URL: `https://langbowoo.github.io/JGSAS/`
- 브랜치: main
- git 설정: username `수고38` / email `jungil6633@gmail.com`

---

## 미해결 과제 / TODO

- [ ] PWA manifest.json + sw.js 추가 (홈화면 설치 시 주소표시줄 제거 목적)
- [x] PIN 암호 보안 강화 (SHA-256 해시 저장으로 변경 완료)
- [x] 여행일정 탭: 추출리셋 시 상단 입력소스 카드 정보도 함께 초기화
- [x] 여행일정 탭: 자동인식 결과 "미추출 필드: ..." 노란 경고박스 삭제
- [x] 여행일정 탭: Excel 버튼을 Word 자리(큰 버튼)로 이동 — 기능 전체 이식
- [x] 여행일정 탭: 추출 후 추가 파일 업로드 가능 + 스마트 병합
- [x] 템플릿 페이지: 상단 "보호 규칙..." 안내 문구 전체 삭제
- [x] 템플릿 페이지: "기본 원본 + 사용자 정의" 탭 버튼 → 한 줄 안내 문구로 교체
- [x] 템플릿 페이지: 출발안내 "본 원문" 탭 클릭 시 원문 전체 펼쳐보기
- [x] 템플릿 페이지: 기본 출발안내 원문 수정 가능 + 원문 초기화 버튼 추가
- [x] 템플릿 페이지: 문자보내기 클릭 시 기본 원문 자동 적용 + 수정 가능
- [x] 템플릿 페이지: "기본 출발안내 복사본 만들기" 버튼 삭제 (복사 버튼은 유지)

---

## 에이전트 활용 원칙

| 작업 유형 | 사용 에이전트 |
|-----------|--------------|
| 일반 수정 (CSS, 텍스트, 로직) | 작업 후 verify-agent + doc-updater |
| 대형 기능 추가 | 시작 전 planner → 완료 후 code-reviewer + verify-agent + doc-updater |
| 라이브러리 교체 | 반드시 planner 먼저 |
