# ⏱ Time Clock ET — 출퇴근 기록 시스템

미국 동부시간(`America/New_York`) 기준으로 동작하는 **위조 불가능한 출퇴근 기록 시스템**입니다.
Google Sheets + Apps Script 기반이며 서버 비용이 전혀 들지 않습니다.

A tamper-resistant time clock for small teams, running on **US Eastern Time**.
Built entirely on Google Sheets + Apps Script — no server, no cost.

<p>
  <img alt="Apps Script" src="https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white">
  <img alt="Timezone" src="https://img.shields.io/badge/timezone-America%2FNew__York-informational">
  <img alt="i18n" src="https://img.shields.io/badge/i18n-한국어%20%2F%20English-success">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-lightgrey">
</p>

---

## 왜 이 시스템인가 / Why

직원이 시간을 **임의로 적을 수 없는 것**이 이 프로젝트의 핵심 요구사항입니다.

The core requirement: employees must not be able to write their own times.

| 위협 / Threat | 대응 / Mitigation |
|---|---|
| 직원이 시간을 손으로 입력 | 입력 칸 자체가 없음. 버튼 클릭만 가능 |
| 기기 시계를 조작 | 시각은 **Google 서버**에서 생성. 기기 시계는 화면 표시용일 뿐 |
| 시간대 혼선 / 서머타임 | `America/New_York` 고정. EST↔EDT 자동 전환 |
| 기록을 직접 수정 | 직원은 시트 접근 권한 없음. 웹앱이 소유자 권한으로 대신 기록 |
| 중복·순서 오류 출퇴근 | 서버가 상태를 검증해 거부 (`ALREADY_IN` / `NOT_IN`) |
| 동시 클릭 충돌 | `LockService`로 직렬화 |
| 관리자 임의 보정 | 보정 시 **사유 입력 필수**, 원본 로그에 감사 기록으로 남음 |

---

## 주요 기능 / Features

**직원 화면 / Employee**

- 실시간 동부시간 시계 (서버와 60초마다 동기화)
- 이름 선택 → **출근 / 퇴근** 원터치 기록
- 하루 여러 번 출퇴근 가능 (점심 외출 등) → 근무시간 자동 합산
- 현재 상태에 따라 버튼 자동 잠금
- **한국어 / English 토글** — 선택은 기기에 저장됨
- 휴대폰 홈 화면에 추가하면 앱처럼 사용 가능

**관리자 화면 / Admin**

- PIN 로그인
- **오늘 현황** — 근무중 / 퇴근 / 미출근, 출퇴근 시각, 누적 근무시간, 지각(분)
- **기간별 집계** — 직원별 총 근무시간·초과근무·지각일수·미퇴근일수 + 일자별 상세
- 직원 추가 / 비활성화 (퇴사자 처리 시 기록은 보존)
- 월간 리포트 시트 자동 생성
- 1분마다 자동 갱신

---

## 저장소 구조 / Repository layout

```
.
├── src/
│   ├── Code.gs      # Apps Script 백엔드 (서버 타임스탬프, 집계, 관리자 API)
│   ├── Index.html   # 직원용 출퇴근 화면
│   └── Admin.html   # 관리자 대시보드
├── docs/
│   └── SETUP.md     # 단계별 설치 가이드 (한/영)
├── appsscript.json  # Apps Script 매니페스트 (clasp 사용 시)
└── README.md
```

---

## 빠른 시작 / Quick start

1. [sheets.new](https://sheets.new) 로 새 스프레드시트 생성
2. **확장 프로그램 → Apps Script**
3. `src/Code.gs` 내용을 `Code.gs`에 붙여넣기
4. HTML 파일 2개를 각각 **`Index`**, **`Admin`** 이름으로 추가하고 내용 붙여넣기
5. 함수 목록에서 `setup` 실행 → 권한 승인
6. `Employees` 탭에 직원 명단 입력, `Settings` 탭에서 **`ADMIN_PIN` 변경**
7. **배포 → 새 배포 → 웹 앱**
   - 실행 계정: **나 (Me)**
   - 액세스: **링크가 있는 모든 사용자** (Workspace라면 조직 내 사용자 권장)

전체 절차와 스크린샷 수준의 상세 설명은 **[docs/SETUP.md](docs/SETUP.md)** 를 참고하세요.

### 배포 후 공유할 링크

| 대상 | URL |
|---|---|
| 직원 | `{배포URL}` |
| 관리자 | `{배포URL}?page=admin` |

> ⚠️ **배포 URL은 이 저장소에 커밋하지 마세요.** 공개 저장소이므로 URL이 노출되면 외부인이 출퇴근 기록을 남길 수 있습니다. 링크는 사내 메신저나 이메일로만 공유하세요.
>
> ⚠️ **Never commit your deployment URL.** This repo is public — a leaked URL would let outsiders punch the clock.

---

## clasp로 배포하기 / Deploy with clasp (선택)

```bash
npm install -g @google/clasp
clasp login
clasp create --type sheets --title "Time Clock ET" --rootDir ./src
clasp push
```

`.clasp.json` 은 스크립트 ID를 담고 있으므로 `.gitignore`에 포함되어 있습니다.

---

## 설정값 / Configuration

스프레드시트의 `Settings` 탭에서 코드 수정 없이 변경할 수 있습니다.

| 키 | 기본값 | 설명 |
|---|---|---|
| `ADMIN_PIN` | `1234` | 관리자 PIN — **반드시 변경** |
| `WORK_START` | `09:00` | 지각 판정 기준 시각 (ET) |
| `WORK_END` | `18:00` | 기준 퇴근 시각 |
| `STANDARD_HOURS` | `8` | 1일 소정 근무시간 (초과분은 OT로 집계) |
| `COMPANY_NAME` | `My Company` | 회사명 |

시간대를 다른 지역으로 바꾸려면 `src/Code.gs` 상단의 `TZ` 상수 한 줄만 수정하면 됩니다.

---

## 알려진 한계 / Known limitations

- **대리 출근(buddy punching)** — 이름 선택 방식이라 동료가 대신 찍는 것은 막지 못합니다.
  보완 방법: 사무실 공용 기기 1대에서만 접속하게 하거나, 개인별 PIN 단계를 추가하세요.
- **퇴근 미기록** — 그날은 근무시간 0으로 남고 `미퇴근`으로 표시됩니다. 시간이 무한 누적되지 않도록 의도한 동작이며, 관리자가 `adminCorrect()`로 사유와 함께 보정합니다.
- **오프라인** — 인터넷 연결이 필요합니다. 서버 시각을 신뢰하기 위한 구조적 제약입니다.

---

## 법적 고지 / Legal notice

미국 FLSA 기준 근태 기록은 **최소 2년** 보관이 요구되며, 주(州)별로 더 긴 기간이나 추가 요건이 있을 수 있습니다. `TimeLog` 시트의 원본 기록은 삭제하지 마시고 분기별로 사본을 백업하세요.

이 소프트웨어와 문서는 일반적인 정보 제공용이며 **법률 자문이 아닙니다.** 실제 도입 전 노무 담당자나 변호사에게 확인하시기 바랍니다.

Recordkeeping requirements vary by state. This project is provided as general information, **not legal advice.**

---

## 라이선스 / License

MIT — [LICENSE](LICENSE) 참고
