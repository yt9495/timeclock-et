# 출퇴근 기록 시스템 설치 가이드 / Time Clock Setup Guide

미국 동부시간(America/New_York) 기준 · 직원 10명 규모 · Google Sheets + Apps Script
Eastern Time based · for ~10 employees · Google Sheets + Apps Script

---

## 🔒 왜 위조가 불가능한가 / Why it can't be faked

| 항목 | 설명 |
|---|---|
| 시각 생성 위치 | 직원 기기가 아니라 **Google 서버**에서 `new Date()`로 생성 |
| 시간대 처리 | `America/New_York` 고정. 서머타임(EDT/EST) 자동 전환 |
| 수동 입력 | 불가능. 화면에 시간 입력 칸 자체가 없음 |
| 기기 시계 변경 | 무의미. 화면 시계는 참고용이고 기록값과 무관 |
| 시트 접근 권한 | 직원은 시트에 접근 불가. 웹앱이 관리자 권한으로 대신 기록 |
| 보정 이력 | 관리자 보정 시 사유가 '비고' 칸에 강제 기록됨 |

Timestamps come from Google's servers, not from the employee's device. There is no field to type a time into. Changing a phone or PC clock has no effect on what gets recorded.

---

## 1단계 · 구글 시트 만들기 / Step 1 — Create the spreadsheet

1. [sheets.new](https://sheets.new) 접속 → 새 스프레드시트 생성
2. 이름을 `출퇴근 기록 / Time Clock` 으로 변경
3. 상단 메뉴 **확장 프로그램 → Apps Script** 클릭

---

## 2단계 · 코드 붙여넣기 / Step 2 — Paste the code

Apps Script 편집기에서:

1. 기본 `Code.gs` 내용을 전부 지우고 → **`Code.gs`** 파일 내용을 붙여넣기
2. 왼쪽 **파일 + → HTML** 클릭 → 이름 `Index` → **`Index.html`** 내용 붙여넣기
3. 다시 **파일 + → HTML** 클릭 → 이름 `Admin` → **`Admin.html`** 내용 붙여넣기
4. 💾 저장 (Ctrl+S / ⌘S)

> ⚠️ HTML 파일 이름은 반드시 `Index`, `Admin` 이어야 합니다 (확장자는 자동으로 붙습니다).
> File names must be exactly `Index` and `Admin`.

**프로젝트 시간대 설정 / Set project timezone**
왼쪽 ⚙️ **프로젝트 설정** → 시간대를 `(GMT-05:00) 미국 동부 시간` 으로 지정

---

## 3단계 · 초기 설정 실행 / Step 3 — Run setup

1. Apps Script 편집기 상단 함수 목록에서 **`setup`** 선택 → **실행**
2. 권한 승인 창 → 본인 구글 계정 선택
3. "이 앱은 확인되지 않았습니다" → **고급 → (프로젝트명)(으)로 이동** → **허용**

시트에 `Employees` · `TimeLog` · `Settings` 3개 탭이 자동 생성됩니다.

---

## 4단계 · 직원 명단 입력 / Step 4 — Enter employees

`Employees` 탭에서 샘플 3명을 지우고 실제 직원 10명을 입력하세요.

| 이름 (Name) | 표시명 EN | 사번 | 활성 |
|---|---|---|---|
| 홍길동 | Gildong Hong | E001 | TRUE |
| 김철수 | Chulsoo Kim | E002 | TRUE |

- **활성**을 `FALSE`로 바꾸면 퇴사자 처리 (기록은 그대로 보존)
- Set **Active** to `FALSE` to retire an employee; past records stay intact.

`Settings` 탭에서 아래 값을 회사 정책에 맞게 수정하세요:

| 키 | 기본값 | 의미 |
|---|---|---|
| `ADMIN_PIN` | 1234 | **반드시 변경하세요** |
| `WORK_START` | 09:00 | 지각 판정 기준 시각 (ET) |
| `WORK_END` | 18:00 | 기준 퇴근 시각 |
| `STANDARD_HOURS` | 8 | 1일 소정 근무시간 |
| `COMPANY_NAME` | My Company | 회사명 |

---

## 5단계 · 웹앱 배포 / Step 5 — Deploy

1. Apps Script 우측 상단 **배포 → 새 배포**
2. ⚙️ 유형 선택 → **웹 앱**
3. 설정:
   - 설명: `v1`
   - **다음 사용자로 실행 : 나 (Execute as: Me)** ← 필수
   - **액세스 권한이 있는 사용자 : 링크가 있는 모든 사용자 (Anyone with the link)**
4. **배포** → 웹앱 URL 복사

> 회사 구글 워크스페이스를 쓴다면 "액세스 권한"을 **조직 내 사용자**로 두는 편이 더 안전합니다.
> On Google Workspace, restricting access to your organization is safer.

---

## 6단계 · 링크 배포 / Step 6 — Share the links

| 대상 | 링크 |
|---|---|
| 직원 (출퇴근 찍기) | `배포URL` |
| 관리자 (대시보드) | `배포URL?page=admin` |

직원에게는 첫 링크만 공유하세요. 관리자 링크는 PIN으로 보호됩니다.

**휴대폰 홈 화면에 추가 / Add to phone home screen**
- iPhone: Safari → 공유 → 홈 화면에 추가
- Android: Chrome → ⋮ → 홈 화면에 추가

---

## 사용 방법 / How to use

### 직원 화면 / Employee screen
1. 우측 상단 **한국어 / EN** 토글로 언어 선택 (선택은 기기에 저장됨)
2. 이름 선택 (다음부터 자동 기억)
3. **출근** 또는 **퇴근** 버튼 클릭 → 서버 시각이 즉시 기록됨
4. 점심 외출 등 하루 여러 번 출/퇴근 가능. 근무시간은 자동 합산

버튼은 상태에 따라 자동 비활성화됩니다 — 출근 중이면 '출근' 버튼이 잠기고, 출근 전이면 '퇴근' 버튼이 잠깁니다. 중복·순서 오류가 원천 차단됩니다.

### 관리자 화면 / Admin screen
- **오늘 현황** : 근무중 / 퇴근 / 미출근, 출근·퇴근 시각, 누적 근무시간, 지각 분
- **기간별 집계** : 날짜 범위 + 직원 필터 → 직원별 합계(근무일·총 근무시간·초과·지각일수·미퇴근일수) + 일자별 상세
- **직원 관리** : 신규 직원 추가
- 1분마다 오늘 현황 자동 갱신

### 월간 리포트 / Monthly report
시트 메뉴 **⏱ 출퇴근 / Time Clock → 이번 달 리포트 생성** 클릭 시
`Report_YYYY-MM` 탭이 생성됩니다. 그대로 인쇄하거나 급여 계산에 사용하세요.

---

## 예외 상황 처리 / Edge cases

**퇴근 찍는 걸 잊은 경우 / Forgot to clock out**
그날은 근무시간이 0으로 남고 `미퇴근 / no clock-out` 으로 표시됩니다.
(시간이 무한정 누적되지 않도록 설계됨)

관리자가 보정하려면 Apps Script 편집기에서 `adminCorrect` 함수를 실행하거나,
`TimeLog` 시트에 직접 행을 추가하고 **비고 칸에 사유를 반드시 기록**하세요.

```
adminCorrect('PIN', '홍길동', '2026-08-03', 'OUT', '18:00', '퇴근 버튼 누락 - 본인 확인함')
```

**직원이 다른 사람 이름으로 찍는 경우 / Buddy punching**
이 시스템은 이름 선택 방식이라 대리 출근을 막지 못합니다. 필요하다면:
- 사무실 공용 태블릿 1대에서만 찍게 하고 (링크를 그 기기에만 배포)
- 또는 개인별 PIN 입력 단계 추가 (요청 시 코드 추가해 드립니다)

---

## 데이터 보관 / Data retention

- 원본 기록은 `TimeLog` 시트에 영구 보존되며 삭제하지 마세요
- 미국 연방 FLSA 기준 근태 기록은 **최소 2년** 보관이 요구됩니다 (주별로 더 길 수 있음)
- 정기 백업: 시트 메뉴 **파일 → 사본 만들기** 를 분기마다 실행 권장

> 근로시간 기록·급여 관련 법적 요건은 주(州)마다 다릅니다. 이 문서는 참고용이며 법률 자문이 아닙니다. 실제 적용 전 노무 담당자나 변호사에게 확인하세요.
> Recordkeeping requirements vary by state. This is general information, not legal advice.

---

## 비용 / Cost

전부 무료입니다. Google Apps Script 무료 한도(일 20,000회 실행)는 직원 10명 기준 사용량의 수십 배 여유가 있습니다.
