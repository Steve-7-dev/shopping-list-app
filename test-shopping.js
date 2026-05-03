const { chromium } = require('playwright');

const URL = 'http://localhost:8787/shopping-list.html';
const PASS = '\x1b[32m✔\x1b[0m';
const FAIL = '\x1b[31m✘\x1b[0m';
const HEAD = '\x1b[36m●\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ${PASS} ${label}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${label}`);
    failed++;
  }
}

async function clearStorage(page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function addItem(page, text) {
  await page.fill('#itemInput', text);
  await page.click('button:has-text("추가")');
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(URL);
  await clearStorage(page);

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [1] 초기 상태 확인`);
  {
    const emptyMsg = await page.locator('text=아직 아이템이 없습니다').isVisible();
    assert(emptyMsg, '빈 리스트 안내 문구 표시');

    const summary = await page.locator('#summary').textContent();
    assert(summary.trim() === '', '요약 문구 비어 있음');

    const clearBtn = await page.locator('#clearBtn').isVisible();
    assert(!clearBtn, '"완료된 항목 삭제" 버튼 숨김');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [2] 아이템 추가 — 버튼 클릭`);
  {
    await addItem(page, '우유');
    const items = await page.locator('li .item-text').allTextContents();
    assert(items.includes('우유'), '"우유" 아이템 추가됨');

    const inputVal = await page.inputValue('#itemInput');
    assert(inputVal === '', '추가 후 입력창 초기화');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [3] 아이템 추가 — Enter 키`);
  {
    await page.fill('#itemInput', '계란');
    await page.press('#itemInput', 'Enter');
    const items = await page.locator('li .item-text').allTextContents();
    assert(items.includes('계란'), '"계란" 아이템 Enter로 추가됨');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [4] 여러 아이템 추가 및 순서 확인 (최신순)`);
  {
    await addItem(page, '빵');
    const items = await page.locator('li .item-text').allTextContents();
    assert(items[0] === '빵', '새 아이템이 맨 위에 추가됨');
    assert(items.length >= 3, '총 3개 이상 아이템 존재');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [5] 빈 입력 추가 방지`);
  {
    const countBefore = await page.locator('li .item-text').count();
    await page.fill('#itemInput', '   ');
    await page.click('button:has-text("추가")');
    const countAfter = await page.locator('li .item-text').count();
    assert(countBefore === countAfter, '공백만 입력 시 아이템 추가 안 됨');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [6] 요약 문구 업데이트`);
  {
    const summary = await page.locator('#summary').textContent();
    assert(summary.includes('개 중'), '요약 문구에 개수 표시됨');
    assert(summary.includes('0개 완료'), '완료 0개 표시됨');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [7] 체크(완료) 기능`);
  {
    const firstCheckbox = page.locator('li input[type="checkbox"]').first();
    await firstCheckbox.check();

    const firstLi = page.locator('li').first();
    const hasCheckedClass = await firstLi.evaluate(el => el.classList.contains('checked'));
    assert(hasCheckedClass, '체크된 아이템에 .checked 클래스 추가');

    const firstText = page.locator('li.checked .item-text').first();
    const isVisible = await firstText.isVisible();
    assert(isVisible, '체크된 아이템 취소선 텍스트 표시');

    const summary = await page.locator('#summary').textContent();
    assert(summary.includes('1개 완료'), '요약 문구 "1개 완료" 업데이트');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [8] 체크 해제 (토글)`);
  {
    const firstCheckbox = page.locator('li input[type="checkbox"]').first();
    await firstCheckbox.uncheck();

    const firstLi = page.locator('li').first();
    const hasCheckedClass = await firstLi.evaluate(el => el.classList.contains('checked'));
    assert(!hasCheckedClass, '체크 해제 시 .checked 클래스 제거');

    const summary = await page.locator('#summary').textContent();
    assert(summary.includes('0개 완료'), '요약 문구 "0개 완료"로 복귀');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [9] "완료된 항목 삭제" 버튼 표시/숨김`);
  {
    const clearBtnBefore = await page.locator('#clearBtn').isVisible();
    assert(!clearBtnBefore, '완료 항목 없을 때 버튼 숨김');

    await page.locator('li input[type="checkbox"]').first().check();
    const clearBtnAfter = await page.locator('#clearBtn').isVisible();
    assert(clearBtnAfter, '완료 항목 있을 때 버튼 표시');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [10] 개별 아이템 삭제`);
  {
    const countBefore = await page.locator('li .item-text').count();
    await page.locator('li button.delete-btn').nth(1).click();
    const countAfter = await page.locator('li .item-text').count();
    assert(countAfter === countBefore - 1, '삭제 버튼 클릭 시 아이템 1개 제거');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [11] 완료된 항목 일괄 삭제`);
  {
    const checkedBefore = await page.locator('li.checked').count();
    const totalBefore = await page.locator('li .item-text').count();
    assert(checkedBefore > 0, '일괄 삭제 전 체크된 항목 존재');

    await page.locator('#clearBtn').click();

    const checkedAfter = await page.locator('li.checked').count();
    const totalAfter = await page.locator('li .item-text').count();
    assert(checkedAfter === 0, '일괄 삭제 후 체크된 항목 0개');
    assert(totalAfter === totalBefore - checkedBefore, '미완료 항목은 유지됨');

    const clearBtnVisible = await page.locator('#clearBtn').isVisible();
    assert(!clearBtnVisible, '완료 항목 없으면 버튼 다시 숨김');
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [12] localStorage 데이터 영속성`);
  {
    const itemsBefore = await page.locator('li .item-text').allTextContents();
    await page.reload();
    const itemsAfter = await page.locator('li .item-text').allTextContents();
    assert(
      JSON.stringify(itemsBefore) === JSON.stringify(itemsAfter),
      '페이지 새로고침 후 데이터 유지'
    );
  }

  // ─────────────────────────────────────────────
  console.log(`\n${HEAD} [13] 모든 아이템 삭제 시 빈 상태 복귀`);
  {
    while (true) {
      const delBtn = page.locator('li button.delete-btn').first();
      const exists = await delBtn.count();
      if (!exists) break;
      await delBtn.click();
    }
    const emptyMsg = await page.locator('text=아직 아이템이 없습니다').isVisible();
    assert(emptyMsg, '모두 삭제 후 빈 리스트 안내 문구 표시');

    const clearBtnVisible = await page.locator('#clearBtn').isVisible();
    assert(!clearBtnVisible, '"완료된 항목 삭제" 버튼 숨김');
  }

  // ─────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  const total = passed + failed;
  console.log(`결과: ${passed}/${total} 통과 ${failed > 0 ? `| \x1b[31m${failed}개 실패\x1b[0m` : '| \x1b[32m전체 통과\x1b[0m'}`);
  console.log('─'.repeat(50) + '\n');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();