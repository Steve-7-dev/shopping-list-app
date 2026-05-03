# 쇼핑 리스트 앱

브라우저에서 바로 실행되는 한국어 쇼핑 리스트 웹 앱입니다.

## 기능

- 아이템 추가 (버튼 클릭 또는 Enter 키)
- 체크박스로 완료 표시 / 취소선 처리
- 개별 아이템 삭제
- 완료된 항목 일괄 삭제
- `localStorage`로 데이터 영속 저장

## 실행 방법

`shopping-list.html` 파일을 브라우저에서 열면 바로 사용할 수 있습니다.

## 테스트 실행

```bash
npm install playwright
node test-shopping.js
```

> 테스트 실행 전 `http://localhost:8787`에서 앱이 서빙되고 있어야 합니다.
