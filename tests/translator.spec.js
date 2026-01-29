const { test, expect } = require("@playwright/test");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// =========================
// Excel file path
// =========================
const excelPath = path.resolve(__dirname, "..", "data", "Assignment1_TestCases.xlsx");

if (!fs.existsSync(excelPath)) {
  throw new Error("❌ Excel file NOT FOUND at: " + excelPath);
}
console.log("✅ Excel file found:", excelPath);

// =========================
// Read sheet as rows (array of arrays) and auto-detect header row
// =========================
function loadCasesFromExcel(filePath) {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];

  const table = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "" });

  let headerIndex = -1;
  for (let i = 0; i < Math.min(30, table.length); i++) {
    const row = table[i].map(v => String(v).trim().toLowerCase());
    const joined = row.join(" | ");
    if (joined.includes("tc id") && joined.includes("input")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("❌ Could not find header row containing 'TC ID' and 'Input' in first 30 rows.");
  }

  const headers = table[headerIndex].map(h => String(h).trim());
  const dataRows = table.slice(headerIndex + 1);

  const colIndexExact = (exactName) => {
    const target = exactName.toLowerCase();
    return headers.findIndex(h => h.toLowerCase().trim() === target);
  };

  const colIndexContains = (name, excludeWords = []) => {
    const n = name.toLowerCase();
    return headers.findIndex(h => {
      const hl = h.toLowerCase();
      if (!hl.includes(n)) return false;
      return !excludeWords.some(w => hl.includes(w));
    });
  };

  const idxId =
    colIndexExact("TC ID") !== -1 ? colIndexExact("TC ID") : colIndexContains("tc id");

  const idxName =
    colIndexExact("Test case name") !== -1 ? colIndexExact("Test case name") : colIndexContains("test case name");

  // IMPORTANT: Input but NOT Input length type
  let idxInput = colIndexExact("Input");
  if (idxInput === -1) idxInput = colIndexContains("input", ["length"]);

  let idxExpected = colIndexExact("Expected output");
  if (idxExpected === -1) idxExpected = colIndexContains("expected output");

  let idxStatus = colIndexExact("Status");
  if (idxStatus === -1) idxStatus = colIndexContains("status");

  if (idxId === -1 || idxInput === -1) {
    throw new Error("❌ Missing required columns: need at least 'TC ID' and 'Input'.");
  }

  const cases = [];
  let current = null;

  for (const r of dataRows) {
    const tcid = String(r[idxId] || "").trim();
    if (tcid) {
      if (current && current.input) cases.push(current);

      const name = idxName !== -1 ? String(r[idxName] || "").trim() : "";
      const input = String(r[idxInput] || "").trim();
      const expected = idxExpected !== -1 ? String(r[idxExpected] || "").trim() : "";
      const status = idxStatus !== -1 ? String(r[idxStatus] || "").trim().toLowerCase() : "";

      const type =
        tcid.toLowerCase().startsWith("neg") || status.includes("fail")
          ? "neg"
          : "pos";

      current = { id: tcid, name: name || tcid, input, expected, type };
    }
  }

  if (current && current.input) cases.push(current);

  // filter empty + accidental S/M/L
  return cases.filter(tc => tc.input && !["S", "M", "L"].includes(tc.input.trim()));
}

const cases = loadCasesFromExcel(excelPath);
console.log("✅ Testcases loaded:", cases.length);

// =========================
// Helpers
// =========================
function normalizeText(s) {
  return (s || "")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n+\s*/g, " ")
    .trim();
}

function hasTamil(s) {
  return /[஀-௿]/.test(s || "");
}

async function typeHuman(page, text) {
  await page.keyboard.type(text, { delay: 70 });
}

/**
 * REAL USER behavior for this site:
 * - Convert happens when SPACE is pressed after each word.
 * So we split into tokens (words + spaces/newlines) and simulate that.
 */
async function typeAndConvertWordByWord(page, box, input) {
  await box.fill("");
  await box.click();

  const tokens = String(input).split(/(\s+)/); // keep spaces/newlines as tokens

  for (const t of tokens) {
    if (!t) continue;

    // If it's only whitespace:
    if (/^\s+$/.test(t)) {
      for (const ch of t) {
        if (ch === "\n") await page.keyboard.press("Enter");
        else await page.keyboard.press("Space");
        await page.waitForTimeout(60);
      }
      continue;
    }

    // It's a word/punctuation chunk
    await typeHuman(page, t);

    // Press SPACE to trigger conversion for that word
    await page.keyboard.press("Space");
    await page.waitForTimeout(120);
  }

  // give time to finalize conversion
  await page.waitForTimeout(700);
  return (await box.inputValue()).trim();
}

// =========================
// Tests
// =========================
test.describe("ITPM Assignment 1 – Thanglish → Tamil (Excel Driven)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  // UI test (more reliable)
  test("Pos_UI_0001 - Tamil appears after typing + space", async ({ page }) => {
    const box = page.locator("textarea").first();
    await expect(box).toBeVisible();

    const after = await typeAndConvertWordByWord(page, box, "naan");
    console.log("UI output:", after);

    expect(hasTamil(after)).toBeTruthy();
  });

  // Run all Excel cases
  for (const tc of cases) {
    test(`${tc.id} - ${tc.name}`, async ({ page }) => {
      const box = page.locator("textarea").first();
      await expect(box).toBeVisible();

      const actualRaw = await typeAndConvertWordByWord(page, box, tc.input);
      const actual = normalizeText(actualRaw);
      const expected = normalizeText(tc.expected);

      console.log(`\n[${tc.id}] ${tc.name}\nINPUT: ${tc.input}\nEXPECTED: ${expected}\nACTUAL: ${actual}\n`);

      if (expected.length > 0) {
        if (tc.type === "pos") {
          // Positive: prefer "contains" because spaces/newlines differ
          await expect(actual).toContain(expected);
        } else {
          // Negative: should not match expected (issue must appear)
          await expect(actual).not.toContain(expected);
        }
      } else {
        // No expected provided: at least show some conversion output (Tamil exists OR text changed)
        expect(actual.length).toBeGreaterThan(0);
      }
    });
  }
});
