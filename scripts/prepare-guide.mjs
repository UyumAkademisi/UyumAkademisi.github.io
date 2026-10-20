import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";

const target = new URL("../public/masak-rehber-temmuz-2026.pdf", import.meta.url);
const temporary = new URL("../public/masak-rehber-temmuz-2026.pdf.download", import.meta.url);
const source = "https://spl.com.tr/wp-content/uploads/2026/07/Masak_Rehber.pdf";
const expectedHash = "607cb8141b2ef2b220b811981d3ff43e689da42046268bb4ee8da489fe52aca2";
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

try {
  let existing;
  try { existing = await readFile(target); } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (existing && hash(existing) === expectedHash) {
    console.log("Ana kaynak PDF doğrulandı; yerel kopya kullanılıyor.");
  } else {
    // Pin the original edition so an upstream replacement cannot silently change lessons.
    const response = await fetch(source, { signal: AbortSignal.timeout(90000) });
    if (!response.ok) throw new Error(`SPL PDF indirme hatası: HTTP ${response.status}`);
    if (Number(response.headers.get("content-length")) > 25_000_000) throw new Error("PDF beklenen boyutu aşıyor.");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 25_000_000 || bytes.subarray(0, 5).toString() !== "%PDF-" || hash(bytes) !== expectedHash) {
      throw new Error("PDF sürümü doğrulanamadı. Kaynak değişmiş olabilir; yayın öncesinde içerik kontrolü gerekir.");
    }
    await mkdir(new URL("../public/", import.meta.url), { recursive: true });
    await writeFile(temporary, bytes);
    await rename(temporary, target);
    console.log("Temmuz 2026 ana kaynak PDF indirildi ve SHA-256 doğrulaması geçti.");
  }
} catch (error) {
  await rm(temporary, { force: true }).catch(() => undefined);
  console.error(error.message);
  process.exitCode = 1;
}
