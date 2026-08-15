---
name: Hubble Workspace
description: Hubble.md의 원형 UI를 유지한 공개 편집 가능 Markdown workspace
colors:
  background: "#ffffff"
  foreground: "#1c1917"
  muted: "#f5f5f4"
  border: "#e7e5e4"
typography:
  ui: "system-ui"
  code: "Lilex"
spacing:
  unit: "4px"
---

# Design Direction

Upstream Hubble의 shared UI와 theme token을 그대로 재사용한다. 별도 브랜드 재설계보다 Markdown 탐색과 읽기에 집중한다.

## Components
- Toolbar: 현재 파일 경로, 새 문서 버튼, 저장 상태
- Sidebar: Markdown tree, alpha/recent sort
- Editor: Hubble rich Markdown editor, `editable=true`
- Empty state: volume이 비어 있음을 명확히 표시

## Do
- Hubble와 시각·상호작용 일관성을 유지한다.
- 공개 편집 가능 상태와 저장 결과를 UI에서 명시한다.
- 키보드 탐색과 접근성을 보존한다.

## Don't
- 쓰기처럼 보이는 `+`, upload, delete UI를 노출하지 않는다.
- HTML App이나 외부 script를 실행하지 않는다.
- Artifact Garden 콘텐츠를 암묵적으로 연결하지 않는다.
