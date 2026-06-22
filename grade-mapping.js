// ============================================================
// خريطة الصفوف الدراسية - منصة الدكتور في اللغة العربية
// ملاحظة: المنصة بقت مخصصة بس لمرحلة الإعدادي والثانوي
// (تم حذف صفوف المرحلة الابتدائية بالكامل)
// dashboard.html فيه fallback داخلي لو الملف ده اتأخر
// أو محصلش تحميل، فمفيش مشكلة لو اتشال أو حصل فيه خطأ.
// ============================================================

const GRADE_LABELS = {
  '1': 'أولى ثانوي',
  '2': 'ثانية ثانوي',
  '3': 'ثالثة ثانوي',
  'prep3': 'ثالثة إعدادي',
  'prep2': 'ثانية إعدادي',
  'prep1': 'أولى إعدادي',
  'all': 'كل الصفوف'
};

const GRADE_ORDER = ['prep1','prep2','prep3','1','2','3'];

// الصفوف اللي بيُطلب فيها تحديد الشعبة (علمي / أدبي)
const SECONDARY_GRADES = ['1','2','3'];

window.gradeLabel = function (g) {
  return GRADE_LABELS[g] || g;
};

window.gradeClass = function (g) {
  if (['prep1','prep2','prep3'].includes(g)) return 'grade-prep';
  return { 1: 'grade1', '1': 'grade1', 2: 'grade2', '2': 'grade2', 3: 'grade3', '3': 'grade3' }[g] || 'grade1';
};

window.isSecondaryGrade = function (g) {
  return SECONDARY_GRADES.includes(String(g));
};

window.normalizeGrade = function (g) {
  if (!g) return 'all';
  const s = String(g).trim();
  return GRADE_ORDER.includes(s) ? s : s;
};

window.buildGradeOptions = function (includeAll = true) {
  let html = includeAll ? `<option value="all">${GRADE_LABELS.all}</option>` : '';
  GRADE_ORDER.forEach(g => {
    html += `<option value="${g}">${GRADE_LABELS[g]}</option>`;
  });
  return html;
};
