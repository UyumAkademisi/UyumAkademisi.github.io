"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, Play } from "lucide-react";
import { PLAN_DAYS, PLAN_WEEKS, PLAN_STORAGE_KEY, parseCompletedDays, studyPlan, type StudyDay } from "./study-plan";
import { accountStorageKey } from "./account-storage";
import type { ModuleId } from "./content";

export default function StudyPlan({ onStudy, onSource, onExam }: {
  onStudy: (id: string) => void;
  onSource: (id: string) => void;
  onExam: (mode: ModuleId) => void;
}) {
  const [completed, setCompleted] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try { setCompleted(parseCompletedDays(localStorage.getItem(accountStorageKey(PLAN_STORAGE_KEY)))); }
    catch { setError("Plan kaydı okunamadı. Tarayıcı depolama iznini kontrol et."); }
    setReady(true);
  }, []);
  const next = studyPlan.find(day => !completed.includes(day.day));
  function toggle(day: number) {
    const updated = completed.includes(day) ? completed.filter(item => item !== day) : [...completed, day];
    try {
      localStorage.setItem(accountStorageKey(PLAN_STORAGE_KEY), JSON.stringify(updated));
      setCompleted(updated); setError("");
    } catch { setError("Tamamlama kaydedilemedi. Tarayıcı depolama iznini kontrol et."); }
  }
  function actions(day: StudyDay) {
    return <div className="plan-actions">
      {day.lessonId && <>
        <button type="button" className="button primary" onClick={() => onStudy(day.lessonId!)}><BookOpen size={17} /> Dersi aç</button>
        <button type="button" className="button ghost" onClick={() => onSource(day.lessonId!)}><FileText size={17} /> PDF’de oku</button>
      </>}
      {day.examMode && <button type="button" className="button primary" onClick={() => onExam(day.examMode!)}><Play size={17} /> Denemeyi başlat</button>}
    </div>;
  }
  return <section className="study-plan">
    <header className="plan-summary">
      <div><h2>{PLAN_WEEKS} hafta · Günde 45 dakika</h2><p>{PLAN_DAYS} oturum · Toplam 26 saat 15 dakika · {completed.length}/{PLAN_DAYS} tamamlandı</p></div>
      <progress aria-label="Ders planı ilerlemesi" max={PLAN_DAYS} value={completed.length} />
    </header>
    {error && <p role="alert">{error}</p>}
    {ready && next && <section className="plan-next" aria-label="Sıradaki oturum">
      <p className="eyebrow">Sıradaki oturum · Gün {next.day}</p><h3>{next.title}</h3><p>{next.goal}</p>{actions(next)}
    </section>}
    {ready && !next && <p role="status">{PLAN_DAYS} oturumu tamamladın. Son denemelerini ve eksik konularını İlerleme bölümünden kontrol et.</p>}
    {Array.from({ length: PLAN_WEEKS }, (_, week) => <details className="plan-week" key={week} open>
      <summary>{week + 1}. Hafta <span>{studyPlan.slice(week * 7, week * 7 + 7).filter(day => completed.includes(day.day)).length}/7 oturum</span></summary>
      {studyPlan.slice(week * 7, week * 7 + 7).map(day => <article className={`plan-day ${completed.includes(day.day) ? "is-complete" : ""}`} key={day.day}>
        <div className="plan-day-heading"><h3><span>Gün {day.day}</span> {day.title}</h3><label><input type="checkbox" checked={completed.includes(day.day)} disabled={!ready} onChange={() => toggle(day.day)} />Tamamlandı</label></div>
        <p>{day.goal}</p>
        <ol className="plan-blocks">{day.blocks.map(block => <li key={block.title}><strong>{block.minutes} dk</strong> {block.title}</li>)}</ol>
        {actions(day)}
      </article>)}
    </details>)}
    <p className="hint-text">Bu plan başarı garantisi değildir. Tekrarlanan soru havuzundaki puanlar hazırlığı tek başına ölçmez; eksik konular için ek oturum gerekebilir. PDF, Temmuz 2026 sürümüdür; sonraki değişiklikler ders notlarından ayrıca kontrol edilmelidir.</p>
  </section>;
}
