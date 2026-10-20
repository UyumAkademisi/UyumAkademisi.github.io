import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../app/study-plan.ts", import.meta.url), "utf8");
const exported = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exported });
const { studyPlan, parseCompletedDays } = exported;
const chapters = JSON.parse(readFileSync(new URL("../app/academic-content.json", import.meta.url), "utf8"));

test("35 consecutive sessions each total exactly 45 minutes and cover all 14 lessons", () => {
  assert.equal(studyPlan.length, 35);
  studyPlan.forEach((day, index) => {
    assert.equal(day.day, index + 1);
    assert.equal(day.blocks.reduce((sum, block) => sum + block.minutes, 0), 45);
    assert.ok(day.goal && day.title);
    assert.ok(day.lessonId || day.examMode);
    if (day.lessonId) assert.ok(chapters[day.lessonId]);
  });
  assert.equal(new Set(studyPlan.map(day => day.lessonId).filter(Boolean)).size, 14);
  for (const mode of ["mod1", "mod2"]) assert.equal(studyPlan.filter(day => day.examMode === mode).length, 3);
});

test("Completion state tolerates malformed storage and rejects invalid or duplicate days", () => {
  for (const raw of [null, "oops", "{}", "null"]) assert.equal(parseCompletedDays(raw).length, 0);
  assert.equal(JSON.stringify(parseCompletedDays('[1,1,2,28,35,36,0,-1,1.5,"3",null]')), "[1,2,28,35]");
});

test("The main source is a local PDF and the reader is loaded only on demand", () => {
  const pdf = readFileSync(new URL("../public/masak-rehber-temmuz-2026.pdf", import.meta.url));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  const app = readFileSync(new URL("../app/MasakPrepApp.tsx", import.meta.url), "utf8");
  assert.match(app, /lazy\(\(\) => import\("\.\/PdfReader"\)\.catch/);
  assert.match(app, /PLAN_STORAGE_KEY, "uyum-guide-page-v1"/);
  const reader = readFileSync(new URL("../app/PdfReader.tsx", import.meta.url), "utf8");
  assert.match(reader, /pdf\.worker\.min\.mjs/);
  assert.match(reader, /disableRange: true/);
});
