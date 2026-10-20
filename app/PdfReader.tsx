"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { accountStorageKey } from "./account-storage";
import academicData from "./academic-content.json";
import { lessons } from "./content";

export const PDF_POSITION_KEY = "uyum-guide-page-v1";
const PDF_URL = "masak-rehber-temmuz-2026.pdf";
const ORIGINAL_URL = "https://spl.com.tr/wp-content/uploads/2026/07/Masak_Rehber.pdf";

export default function PdfReader({ initialPage }: { initialPage?: number }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(initialPage ?? 17);
  const [input, setInput] = useState(String(initialPage ?? 17));
  const [nativeView, setNativeView] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(600);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [pageText, setPageText] = useState("");
  const [rendering, setRendering] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let task: ReturnType<typeof import("pdfjs-dist")["getDocument"]> | undefined;
    setLoading(true); setError("");
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      if (disposed) return;
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("../node_modules/pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
      task = pdfjs.getDocument({ url: new URL(PDF_URL, window.location.href).href, disableRange: true, disableStream: true, useWasm: false });
      const pdf = await task.promise;
      if (disposed) return;
      let saved = initialPage ?? 17;
      if (initialPage === undefined) {
        try { saved = Number(localStorage.getItem(accountStorageKey(PDF_POSITION_KEY))) || 17; } catch { /* Reading remains available without storage. */ }
      }
      const valid = Math.max(1, Math.min(pdf.numPages, Math.trunc(saved)));
      try { localStorage.setItem(accountStorageKey(PDF_POSITION_KEY), String(valid)); } catch { /* Storage is optional. */ }
      setPage(valid); setInput(String(valid)); setDocument(pdf); setLoading(false);
    })().catch(() => { if (!disposed) { setError("PDF yüklenemedi. Bağlantını kontrol edip tekrar dene veya özgün kaynağı aç."); setLoading(false); } });
    return () => { disposed = true; void task?.destroy(); };
  }, [initialPage, retry]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(Math.max(240, entries[0].contentRect.width - 24)));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!document || !canvas.current) return;
    let cancelled = false;
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | undefined;
    setRendering(true); setError(""); setPageText("");
    (async () => {
      const pdfPage = await document.getPage(page);
      if (cancelled || !canvas.current) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: Math.min(width, 1000) / base.width * zoom });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      const target = canvas.current;
      target.width = Math.ceil(viewport.width * outputScale); target.height = Math.ceil(viewport.height * outputScale);
      target.style.width = `${viewport.width}px`; target.style.height = `${viewport.height}px`;
      renderTask = pdfPage.render({ canvas: target, viewport, transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0] });
      await renderTask.promise;
      if (cancelled) return;
      setRendering(false);
      const text = await pdfPage.getTextContent();
      if (!cancelled) setPageText(text.items.map(item => "str" in item ? item.str : "").join(" "));
    })().catch(error => { if (!cancelled && error?.name !== "RenderingCancelledException") { setError("Bu sayfa görüntülenemedi. Başka bir sayfa seçebilir veya PDF’yi indirebilirsin."); setRendering(false); } });
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [document, page, zoom, width]);
  function navigate(value: number) {
    if (!document || !Number.isFinite(value)) { setInput(String(page)); return; }
    const next = Math.max(1, Math.min(document.numPages, Math.trunc(value)));
    setPage(next); setInput(String(next));
    try { localStorage.setItem(accountStorageKey(PDF_POSITION_KEY), String(next)); } catch { /* Storage is optional. */ }
  }
  return <section className="pdf-reader">
    <header className="pdf-heading"><h1>MASAK sınavı çalışma notları</h1><p>Temmuz 2026 · {document ? `${document.numPages} sayfa` : "Resmî kaynak"}</p><p className="hint-text">Bu sürüm sonraki mevzuat değişikliklerini içermez. Güncel değişiklikleri ders notlarıyla birlikte değerlendir.</p></header>
    <div className="pdf-toolbar" aria-label="PDF kontrolleri">
      <button className="reader-icon" type="button" title="Önceki sayfa" aria-label="Önceki sayfa" disabled={!document || page <= 1} onClick={() => navigate(page - 1)}><ChevronLeft size={20} /></button>
      <form onSubmit={event => { event.preventDefault(); navigate(Number(input)); }}><label>Sayfa <input aria-label="PDF sayfası" type="number" min={1} max={document?.numPages ?? 348} value={input} onChange={event => setInput(event.target.value)} onBlur={() => navigate(Number(input))} disabled={!document} /></label><span>/ {document?.numPages ?? "…"}</span></form>
      <button className="reader-icon" type="button" title="Sonraki sayfa" aria-label="Sonraki sayfa" disabled={!document || page >= document.numPages} onClick={() => navigate(page + 1)}><ChevronRight size={20} /></button>
      <div className="pdf-zoom"><button className="reader-icon" type="button" title="Uzaklaştır" aria-label="Uzaklaştır" disabled={zoom <= 0.75} onClick={() => setZoom(value => Math.max(0.75, value - 0.25))}><ZoomOut size={19} /></button><output aria-label="Yakınlaştırma">{Math.round(zoom * 100)}%</output><button className="reader-icon" type="button" title="Yakınlaştır" aria-label="Yakınlaştır" disabled={zoom >= 2} onClick={() => setZoom(value => Math.min(2, value + 0.25))}><ZoomIn size={19} /></button></div>
      <a className="reader-icon" href={PDF_URL} download title="PDF’yi indir" aria-label="PDF’yi indir"><Download size={19} /></a>
      <a className="reader-icon" href={ORIGINAL_URL} target="_blank" rel="noopener noreferrer" title="SPL’deki özgün PDF" aria-label="SPL’deki özgün PDF"><ExternalLink size={19} /></a>
    </div>
    <label className="pdf-topic">Konuya git<select aria-label="PDF konusu" defaultValue="" disabled={!document} onChange={event => { if (event.target.value) navigate(Number(event.target.value)); }}><option value="">Konu seç</option>{lessons.map(lesson => <option key={lesson.id} value={academicData[lesson.id as keyof typeof academicData].lecture[0].pdfRange[0]}>{lesson.title}</option>)}</select></label>
    {loading && <p role="status">Ana kaynak yükleniyor…</p>}
    {error && <div role="alert"><p>{error}</p><div className="plan-actions"><button type="button" className="button ghost" onClick={() => { setNativeView(false); setDocument(null); setRetry(value => value + 1); }}><RotateCw size={17} /> Tekrar dene</button><button type="button" className="button ghost" onClick={() => setNativeView(true)}>Tarayıcıda göster</button><a className="button ghost" href={`${PDF_URL}#page=${page}`} target="_blank" rel="noopener noreferrer">PDF’yi doğrudan aç</a></div></div>}
    {nativeView && <iframe className="pdf-native" title="MASAK rehberi — tarayıcı görünümü" src={`${PDF_URL}#page=${page}`} />}
    <div className="pdf-surface" ref={container} aria-busy={loading || rendering} hidden={nativeView}>
      <canvas ref={canvas} role="img" aria-label={`MASAK çalışma notları, sayfa ${page}`} hidden={loading || !!error} />
    </div>
    {!loading && !error && <p role="status" className="hint-text">{rendering ? "Sayfa hazırlanıyor…" : `Sayfa ${page} / ${document?.numPages}`}</p>}
    {pageText && <details className="pdf-text"><summary>Sayfa metni</summary><p>{pageText}</p></details>}
  </section>;
}
