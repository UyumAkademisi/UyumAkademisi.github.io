import type { ModuleId } from "./content";

export const PLAN_STORAGE_KEY = "uyum-study-plan-v1";
export const PLAN_WEEKS = 5;
export const PLAN_DAYS = PLAN_WEEKS * 7;
export type StudyDay = {
  day: number;
  title: string;
  goal: string;
  lessonId?: string;
  examMode?: ModuleId;
  blocks: { title: string; minutes: number }[];
};

const learn = (day: number, title: string, lessonId: string, goal: string): StudyDay => ({
  day, title, lessonId, goal,
  blocks: [{ title: "Konu anlatımı ve kaynak", minutes: 25 }, { title: "Açıklamalı sorular", minutes: 15 }, { title: "Önceki konuyu tekrar", minutes: 5 }],
});
const review = (day: number, title: string, lessonId: string, goal: string): StudyDay => ({
  day, title, lessonId, goal,
  blocks: [{ title: "Yanlışların gerekçesi", minutes: 20 }, { title: "Eksik konu ve kaynak", minutes: 20 }, { title: "Kritik ayrımlar", minutes: 5 }],
});
const exam = (day: number, examMode: ModuleId): StudyDay => ({
  day, title: `${examMode === "mod1" ? "Modül 1" : "Modül 2"} süreli deneme`, examMode,
  goal: "50 soruyu 45 dakikada çöz. Yanlış incelemesini takip eden tekrar oturumuna bırak; boş ve işaretli sorularını kontrol et.",
  blocks: [{ title: "50 soruluk süreli deneme", minutes: 45 }],
});

export const studyPlan: StudyDay[] = [
  learn(1, "MASAK ve önleyici sistem", "masak-gorevleri", "Yükümlü, MASAK ve adli makamların görevlerini ayır. AML, TF ve mali istihbarat kavramlarını öğren."),
  learn(2, "Uluslararası standartlar", "uluslararasi-standartlar", "FATF, Egmont ve MİB modellerini; teknik uyum ile etkililik farkını öğren."),
  learn(3, "Ulusal koordinasyon", "ulusal-koordinasyon", "Ulusal risk değerlendirmesini, strateji belgelerini ve koordinasyonun görevini bağla."),
  learn(4, "Aklama: suç ve aşamalar", "aklama", "Öncül suç, suç geliri ve aklama ilişkisini kur; aşamaları hukuki unsurlarla karıştırma."),
  learn(5, "Aklama: yöntem ve göstergeler", "aklama", "Paravan şirket, işlem zinciri ve ticaret üzerinden aklama göstergelerini gerekçeleriyle çalış."),
  learn(6, "Terörizmin finansmanı", "terorizmin-finansmani", "Fonun kaynağı ile kullanım amacını ayır; aklama ile TF arasındaki farkı açıkla."),
  review(7, "İlk hafta: temel ayrımlar", "terorizmin-finansmani", "İlk altı günün yanlışlarını incele. Aklama–TF, analiz–yargılama ve risk–şüphe ayrımlarını tekrar et."),
  learn(8, "KİSYF ve yaptırımlar", "kisyf", "Yaptırımın amacı, karar mekanizması ve dondurma uygulamasını; el koyma ve müsadereden ayır."),
  learn(9, "ŞİB: şüphe ve kapsam", "sib", "Şüphe eşiğini, tutardan bağımsızlığı ve teşebbüs aşamasını çalış."),
  learn(10, "ŞİB: süreç, süre ve gizlilik", "sib", "Dahili bildirim, yetkili değerlendirme, genel süre, aciliyet ve ek bildirimi birbirine bağla."),
  learn(11, "İşlem ertelemesi", "islem-ertelemesi", "ŞİB ile erteleme talebini ayır. Sürenin başlangıcını, yetkili makamı ve sürenin bitişini çalış."),
  learn(12, "Fintek ve transfer riskleri", "fintek-riskleri", "Elektronik ve kripto transferlerde bilgi, teyit ve risk kurallarını ayrı değerlendir."),
  review(13, "Modül 1 tekrar", "sib", "ŞİB, TF, aklama ve erteleme yanlışlarına öncelik ver; diğer Modül 1 başlıklarını da kontrol et."),
  exam(14, "mod1"),
  learn(15, "KYC: kimlik ve temsil", "musterinin-taninmasi", "Önce 14. gün denemesinin yanlışlarına bak. Kimlik tespiti halleri, müşteri türleri ve temsili öğren."),
  learn(16, "KYC: gerçek faydalanıcı", "musterinin-taninmasi", "Ortaklık zinciri, nihai kontrol, üçüncü tarafa güven ve destek hizmeti ayrımını çalış."),
  learn(17, "KYC: risk ve ek tedbirler", "musterinin-taninmasi", "PEP, riskli ülkeler, muhabirlik, basitleştirme ve sıkılaştırmayı şartlarıyla öğren."),
  learn(18, "Uzaktan kimlik tespiti", "uzaktan-kimlik", "Gerçek kişi ve tüzel kişi kapsamını, doğrulama yöntemlerini ve sektörel koşulları ayır."),
  learn(19, "Uyum programı ve sorumluluk", "uyum-yonetimi", "Program bileşenlerini, yönetim kurulu ile uyum görevlisinin görevlerini ve organizasyon gruplarını çalış."),
  learn(20, "Uyum: uygulama ve denetim", "uyum-yonetimi", "Risk yönetimi, izleme-kontrol, eğitim, iç denetim, finansal grup ve lisans süreçlerini bağla."),
  learn(21, "Yükümlülük denetimi ve yaptırımlar", "denetim-idari-ceza", "İhlal, yetkili makam ve sonucu eşleştir; idari/adli ayrımı ile yıl bazlı tutarlara dikkat et."),
  learn(22, "Diğer yükümlülükler", "diger-yukumlulukler", "Bilgi-belge, muhafaza-ibraz ve elektronik tebligatı; süre başlangıçlarıyla çalış."),
  review(23, "Modül 2 tekrar", "musterinin-taninmasi", "KYC ve uyum yönetimi ağırlıklı tekrar yap; uzaktan kimlik, denetim ve diğer yükümlülükleri kontrol et."),
  exam(24, "mod2"),
  review(25, "İki modülün yanlış analizi", "musterinin-taninmasi", "14 ve 24. gün sonuçlarını İlerleme ekranından incele. Yanlışın bilgi, kavram ayrımı veya süre hatası olduğunu belirle."),
  exam(26, "mod1"),
  exam(27, "mod2"),
  review(28, "Dördüncü hafta değerlendirmesi", "uyum-yonetimi", "Son iki denemenin yanlışlarını incele. Beşinci haftada öncelik vereceğin eksikleri belirle; süreleri ve yetkileri kaynak üzerinden kontrol et."),
  review(29, "KYC: son eksikleri tamamlama", "musterinin-taninmasi", "Kimlik, temsil, gerçek faydalanıcı, üçüncü tarafa güven ve PEP sorularında yanlış yaptığın kuralların şartlarını tekrar et."),
  review(30, "ŞİB ve erteleme: kritik ayrımlar", "sib", "Genel bildirim süresi, aciliyet, gizlilik ve erteleme arasındaki farkları çalış. Gerektiğinde İşlem Ertelemesi dersine de dön."),
  review(31, "Uyum ve denetim: görev ve süreler", "uyum-yonetimi", "Yönetim kurulu, uyum görevlisi ve denetimin görevlerini eşleştir; yaptırımlarla ilgili yanlışlarını da kaynakta kontrol et."),
  exam(32, "mod1"),
  review(33, "Modül 1: son deneme analizi", "sib", "32. gün denemesinin yanlış ve boşlarını incele. Aklama, TF, ŞİB ve erteleme eksiklerini ilgili derslerden tamamla."),
  exam(34, "mod2"),
  review(35, "Son değerlendirme ve sınav hazırlığı", "musterinin-taninmasi", "34. günün yanlışlarını incele, iki modül sonuçlarını birlikte değerlendir. Süreleri, yetkileri ve istisnaları tekrar et; eksikler sürüyorsa ek çalışma günü ayır."),
];

export function parseCompletedDays(raw: string | null): number[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value) ? [...new Set(value.filter((day): day is number => Number.isInteger(day) && day >= 1 && day <= PLAN_DAYS))] : [];
  } catch { return []; }
}
