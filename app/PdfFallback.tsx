"use client";

export default function PdfFallback({ initialPage = 17 }: { initialPage?: number }) {
  const url = `masak-rehber-temmuz-2026.pdf#page=${initialPage}`;
  return <section className="pdf-reader">
    <h1 className="page-title">Ana kaynak PDF</h1>
    <p role="status">Gelişmiş okuyucu yüklenemedi. PDF tarayıcı görünümünde açılıyor.</p>
    <p><a className="button ghost" href={url} target="_blank" rel="noopener noreferrer">PDF’yi doğrudan aç</a></p>
    <iframe className="pdf-native" title="MASAK rehberi — tarayıcı görünümü" src={url} />
    <p className="hint-text">Temmuz 2026 rehberi, sonraki mevzuat değişikliklerini içermez.</p>
  </section>;
}
