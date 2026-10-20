import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const contentPath = new URL("../app/content.ts", import.meta.url);
const source = readFileSync(contentPath, "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const exported = {};
vm.runInNewContext(javascript, { exports: exported, require: createRequire(contentPath) });
const { questions, lessons, examRules, academicLessonById, mnemonics, recallDrills } = exported;

test("Question bank remains complete, unambiguous in structure and weighted-exam ready", () => {
  assert.ok(questions.length >= 120);
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  for (const q of questions) {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.answer >= 0 && q.answer < 4);
    assert.ok(q.explanation && q.sourceRef && q.trapNote);
  }
  for (const id of ["mod1", "mod2"]) {
    const moduleLessons = lessons.filter(l => l.moduleId === id);
    assert.equal(moduleLessons.reduce((sum,l) => sum+l.officialQuestionCount,0), 50);
    assert.ok(questions.filter(q => q.moduleId === id).length >= 60);
    for (const lesson of moduleLessons) {
      assert.ok(questions.filter(q => q.topicId === lesson.id).length >= lesson.officialQuestionCount, lesson.id);
    }
  }
});

test("October 2026 thresholds and FAST are dated and distinguished from historical values", () => {
  assert.equal(examRules.legislationCheckedAt, "15 Ekim 2026");
  const kyc = academicLessonById["musterinin-taninmasi"].lecture.map(s => s.body).join("\n");
  assert.match(kyc, /370\.000 TL/);
  assert.match(kyc, /30\.000 TL/);
  assert.match(kyc, /7 Ekim 2026/);
  assert.match(kyc, /SMS OTP/);
  const fintech = academicLessonById["fintek-riskleri"].lecture.map(s => s.body).join("\n");
  assert.match(fintech, /300\.000 TL/);
  assert.match(fintech, /günlük müşteri limiti değildir/);
  assert.match(fintech, /30\.000 TL altında da/);
  assert.match(fintech, /alıcının|Alıcının/);
  assert.match(fintech, /teyidini zorunlu tutmaz/);
  assert.doesNotMatch(source, /günlük (?:limit |limiti )?250\.000|günde 250\.000|15\.000 TL|185\.000 TL/);
});

test("Correct answers and explanations do not reuse invalid scope or three-module examples", () => {
  const correct = questions.map(q => `${q.options[q.answer]} ${q.explanation}`).join("\n");
  assert.doesNotMatch(correct, /sadece gerçek kişiler içindir|işlemi yapmak zorundadır|48, 72 ve 70/);
  assert.match(correct, /ticaret siciline kayıtlı tüzel kişiler/);
  assert.match(correct, /yeniden değerlenmiş maktu/iu);
  assert.match(correct, /md\. 13\/2-3/);
  assert.match(academicLessonById["uyum-yonetimi"].lecture[9].body, /48 ve 84/);
  const legacy = JSON.stringify({ mnemonics, recallDrills });
  assert.doesNotMatch(legacy, /günde 250\.000|15 binde|5 yıl aksarsa/);
});

test("Source records and paragraph bodies stay consistent after amendments", () => {
  for(const chapter of Object.values(academicLessonById)) {
    for(const section of chapter.lecture) assert.equal(section.body, section.paragraphs.join("\n\n"));
    assert.equal(new Set(chapter.sources.map(s=>s.url)).size, chapter.sources.length);
  }
  assert.ok(academicLessonById["musterinin-taninmasi"].sources.some(s=>s.url.endsWith("20261007-9.pdf")));
  assert.ok(academicLessonById["musterinin-taninmasi"].sources.some(s=>s.title.includes("Tebliğ 33") && s.pending === false));
  assert.ok(academicLessonById["islem-ertelemesi"].sources.some(s=>s.title.includes("Tebliğ 34")));
});

test("Expanded exam lessons preserve note anchors and have sourced substantive additions", () => {
  const baseline = JSON.parse(readFileSync(new URL("../app/academic-content.json", import.meta.url), "utf8"));
  const expansions = JSON.parse(readFileSync(new URL("../app/lesson-expansions.json", import.meta.url), "utf8"));
  for (const [id, expansion] of Object.entries(expansions)) {
    const chapter = academicLessonById[id];
    assert.ok(chapter, id);
    assert.equal(chapter.lecture.length, baseline[id].lecture.length);
    assert.ok(chapter.wordCount > baseline[id].wordCount + 800, id);
    assert.equal(chapter.wordCount, chapter.lecture.reduce((sum, s) => sum + s.body.trim().split(/\s+/u).length, 0));
    assert.ok(expansion.sections.length >= 6);
    for (const addition of expansion.sections) {
      assert.ok(chapter.lecture.some(s => s.title === addition.title), addition.title);
      assert.ok(addition.sourceTrace);
      assert.ok(addition.paragraphs.length >= 2);
      assert.ok(addition.paragraphs.every(p => p.length > 180));
    }
    baseline[id].lecture.forEach((section, index) => {
      assert.equal(chapter.lecture[index].title, section.title);
      section.paragraphs.forEach((paragraph, p) => assert.equal(chapter.lecture[index].paragraphs[p], paragraph));
    });
    for (const source of expansion.sources) assert.ok(chapter.sources.some(s => s.url === source.url));
  }
  assert.match(academicLessonById["musterinin-taninmasi"].lecture.map(s => s.body).join("\n"), /yüzde 30|yüzde 60/);
  assert.match(academicLessonById.sib.lecture.map(s => s.body).join("\n"), /Yalnız sözlü bildirim/);
});

test("Actual exam picker respects each SPL topic quota and returns 50 unique questions", () => {
  const app = readFileSync(new URL("../app/MasakPrepApp.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("app.tsx", app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const node = ast.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === "pickExamQuestions");
  assert.ok(node);
  const code = ts.transpileModule(node.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { questions, lessons, examRules, getQuestionsForModule: exported.getQuestionsForModule, shuffle: items => [...items].reverse(), shuffleQuestionOptions: q => q };
  vm.createContext(context);
  vm.runInContext(code, context);
  for (const id of ["mod1", "mod2"]) {
    const picked = context.pickExamQuestions(id);
    assert.equal(picked.length, 50);
    assert.equal(new Set(picked.map(q=>q.id)).size, 50);
    for (const lesson of lessons.filter(l=>l.moduleId===id)) {
      assert.equal(picked.filter(q=>q.topicId===lesson.id).length, lesson.officialQuestionCount, lesson.id);
    }
  }
  assert.equal(context.pickExamQuestions("mixed").length, 50);
});
