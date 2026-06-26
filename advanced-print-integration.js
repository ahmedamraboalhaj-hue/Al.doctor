/**
 * نظام الطباعة المتقدم المدمج مع Dashboard
 * Advanced Print System Integrated with Dashboard
 * 
 * هذا الملف يقوم بـ:
 * 1. جلب البيانات من جداول dashboard.html
 * 2. فصل الطلاب الناجحين والراسبين والغائبين
 * 3. فتح نافذة طباعة احترافية بجميع النتائج
 */

/**
 * دالة الطباعة المحسنة لنتائج الاختبارات
 * Replace window.print() with this advanced function
 */
function printQuizResults() {
  // جلب البيانات من المتغيرات العامة
  const quiz = window._currentQuiz;
  const attempts = window._currentQuizAttempts;
  
  if (!quiz || !attempts) {
    alert('⚠️ لم يتم تحميل بيانات الاختبار. يرجى اختيار اختبار أولاً.');
    return;
  }

  // تجميع البيانات حسب الحالة
  const allStudents = filterUsersByGradeAndType(getUsers(), quiz.grade, 'center') || [];
  
  // الطلاب الناجحون
  const passedStudents = attempts
    .filter(a => a.score >= (quiz.totalPoints * (quiz.passingGrade / 100)))
    .sort((x, y) => y.score - x.score)
    .map((a, index) => ({
      rank: index + 1,
      name: a.studentName,
      rollNo: a.studentCode || a.studentId,
      score: a.score,
      total: quiz.totalPoints,
      percentage: Math.round(a.percentage),
      grade: getGradeFromPercentage(a.percentage),
      elapsedTime: a.elapsedTime,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      status: 'نجح'
    }));

  // الطلاب الراسبون
  const failedStudents = attempts
    .filter(a => a.score < (quiz.totalPoints * (quiz.passingGrade / 100)))
    .sort((x, y) => y.score - x.score)
    .map((a, index) => ({
      rank: index + 1,
      name: a.studentName,
      rollNo: a.studentCode || a.studentId,
      score: a.score,
      total: quiz.totalPoints,
      percentage: Math.round(a.percentage),
      grade: getGradeFromPercentage(a.percentage),
      elapsedTime: a.elapsedTime,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      status: 'رسب'
    }));

  // الطلاب الغائبون
  const absentStudents = allStudents
    .filter(s => !attempts.find(a => String(a.studentId) === String(s.id)))
    .map((s, index) => ({
      rank: index + 1,
      name: s.name,
      rollNo: s.qrCode || s.id,
      reason: 'غياب',
      phone: s.phone,
      grade: s.grade,
      status: 'غائب'
    }));

  // الطلاب الذين بدأوا ولم ينهوا
  const incompleteStudents = attempts
    .filter(a => a.status === 'submitted' && a.score === 0) // لم يجب على جميع الأسئلة
    .map((a, index) => ({
      rank: index + 1,
      name: a.studentName,
      rollNo: a.studentCode || a.studentId,
      reason: 'بدأ ولم ينهِ',
      elapsedTime: a.elapsedTime,
      status: 'ناقص'
    }));

  // إعداد كائن البيانات الكامل
  const testData = {
    testName: quiz.title || 'اختبار بدون اسم',
    testDate: new Date().toLocaleDateString('ar-EG'),
    testGrade: gradeLabel(quiz.grade) || 'صف غير محدد',
    testDuration: (quiz.duration || 60) + ' دقيقة',
    totalPoints: quiz.totalPoints || 100,
    passingGrade: quiz.passingGrade || 50,
    passedStudents: passedStudents,
    failedStudents: failedStudents,
    absentStudents: absentStudents,
    incompleteStudents: incompleteStudents
  };

  // فتح نافذة الطباعة مع البيانات
  openAdvancedPrintWindow(testData);
}

/**
 * فتح نافذة الطباعة المتقدمة
 */
function openAdvancedPrintWindow(testData) {
  const printWindow = window.open('', 'PrintResults', 'width=1200,height=800');
  
  if (!printWindow) {
    alert('⚠️ تم حظر النوافذ المنبثقة. يرجى السماح بفتح النوافذ في متصفحك.');
    return;
  }

  // بناء محتوى HTML الطباعة
  const htmlContent = buildPrintHTML(testData);
  
  // كتابة المحتوى في النافذة
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // انتظر تحميل المحتوى ثم فتح معاينة الطباعة
  setTimeout(() => {
    printWindow.focus();
    // اختياري: فتح معاينة الطباعة تلقائياً
    // printWindow.print();
  }, 500);
}

/**
 * بناء HTML صفحة الطباعة
 */
function buildPrintHTML(data) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير نتائج الاختبار</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Tajawal', 'Arial', sans-serif;
            background: white;
            padding: 20px;
            color: #333;
            line-height: 1.5;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 30px;
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #0284c7;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }

        .school-name {
            font-size: 26px;
            font-weight: 900;
            color: #0284c7;
            margin-bottom: 5px;
        }

        .test-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            background: #f8f9fa;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-right: 4px solid #0284c7;
        }

        .info-item {
            font-size: 14px;
        }

        .info-label {
            font-weight: 700;
            color: #0284c7;
            margin-bottom: 3px;
        }

        .info-value {
            font-size: 15px;
            font-weight: 700;
            color: #333;
        }

        .section-title {
            font-size: 20px;
            font-weight: 900;
            color: #0284c7;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #0284c7;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-icon {
            font-size: 24px;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }

        .stat-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-right: 4px solid #0284c7;
            text-align: center;
        }

        .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 700;
        }

        .stat-value {
            font-size: 28px;
            font-weight: 900;
            color: #0284c7;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        thead {
            background: #0284c7;
            color: white;
        }

        th {
            padding: 12px;
            text-align: right;
            font-weight: 700;
            font-size: 13px;
            border: none;
        }

        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 13px;
        }

        tbody tr:hover {
            background: #f8f9fa;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .rank {
            font-weight: 700;
            color: #0284c7;
            text-align: center;
            width: 30px;
        }

        .grade {
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            text-align: center;
            font-size: 12px;
        }

        .grade-a {
            background: #c8e6c9;
            color: #1b5e20;
        }

        .grade-b {
            background: #fff3e0;
            color: #e65100;
        }

        .grade-c {
            background: #fce4ec;
            color: #c2185b;
        }

        .grade-d {
            background: #ffebee;
            color: #c62828;
        }

        .grade-f {
            background: #ffcdd2;
            color: #b71c1c;
        }

        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 12px;
            text-align: center;
        }

        .status-passed {
            background: #c8e6c9;
            color: #1b5e20;
        }

        .status-failed {
            background: #ffcdd2;
            color: #c62828;
        }

        .status-absent {
            background: #ffe0b2;
            color: #e65100;
        }

        .status-incomplete {
            background: #fff3e0;
            color: #e67e22;
        }

        .no-data {
            text-align: center;
            padding: 30px;
            color: #999;
            font-size: 14px;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 12px;
            color: #666;
        }

        .footer-item {
            display: flex;
            justify-content: space-between;
        }

        .footer-label {
            font-weight: 700;
        }

        @media print {
            body {
                padding: 0;
            }
            .container {
                box-shadow: none;
                padding: 20px;
            }
            .header {
                page-break-after: avoid;
            }
            table {
                page-break-inside: avoid;
            }
            .section-title {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">📚</div>
            <div class="school-name">الدكتور في اللغة العربية</div>
            <p style="color: #666; margin-top: 5px;">تقرير نتائج الاختبار الشامل</p>
        </div>

        <!-- Test Information -->
        <div class="test-info">
            <div class="info-item">
                <div class="info-label">📖 اسم الاختبار</div>
                <div class="info-value">${data.testName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">📅 التاريخ</div>
                <div class="info-value">${data.testDate}</div>
            </div>
            <div class="info-item">
                <div class="info-label">🏫 الصف الدراسي</div>
                <div class="info-value">${data.testGrade}</div>
            </div>
            <div class="info-item">
                <div class="info-label">⏱️ المدة الزمنية</div>
                <div class="info-value">${data.testDuration}</div>
            </div>
        </div>

        <!-- PASSED SECTION -->
        <div style="margin-bottom: 40px;">
            <div class="section-title">
                <span class="section-icon">✅</span>
                <span>الطلاب الناجحون (${data.passedStudents.length})</span>
            </div>

            ${data.passedStudents.length > 0 ? `
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-label">العدد</div>
                    <div class="stat-value">${data.passedStudents.length}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">متوسط الدرجات</div>
                    <div class="stat-value">${(data.passedStudents.reduce((a, b) => a + b.score, 0) / data.passedStudents.length).toFixed(1)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">أعلى درجة</div>
                    <div class="stat-value">${Math.max(...data.passedStudents.map(s => s.score))}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">أقل درجة</div>
                    <div class="stat-value">${Math.min(...data.passedStudents.map(s => s.score))}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>اسم الطالب</th>
                        <th>الرقم الجلسة</th>
                        <th>الدرجة</th>
                        <th>النسبة %</th>
                        <th>التقدير</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.passedStudents.map(s => `
                    <tr>
                        <td class="rank">${s.rank}</td>
                        <td>${s.name}</td>
                        <td>${s.rollNo}</td>
                        <td style="font-weight: 700; color: #0284c7;">${s.score}/${data.totalPoints}</td>
                        <td style="font-weight: 700;">${s.percentage}%</td>
                        <td><span class="grade grade-${s.grade.toLowerCase()}">${s.grade}</span></td>
                        <td><span class="status status-passed">✅ نجح</span></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<div class="no-data">لا توجد طلاب ناجحين</div>'}
        </div>

        <!-- FAILED SECTION -->
        ${data.failedStudents.length > 0 ? `
        <div style="margin-bottom: 40px;">
            <div class="section-title">
                <span class="section-icon">❌</span>
                <span>الطلاب الراسبون (${data.failedStudents.length})</span>
            </div>

            <div class="stats">
                <div class="stat-box">
                    <div class="stat-label">العدد</div>
                    <div class="stat-value">${data.failedStudents.length}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">متوسط الدرجات</div>
                    <div class="stat-value">${(data.failedStudents.reduce((a, b) => a + b.score, 0) / data.failedStudents.length).toFixed(1)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">أعلى درجة</div>
                    <div class="stat-value">${Math.max(...data.failedStudents.map(s => s.score))}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">أقل درجة</div>
                    <div class="stat-value">${Math.min(...data.failedStudents.map(s => s.score))}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>اسم الطالب</th>
                        <th>الرقم الجلسة</th>
                        <th>الدرجة</th>
                        <th>النسبة %</th>
                        <th>التقدير</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.failedStudents.map(s => `
                    <tr>
                        <td class="rank">${s.rank}</td>
                        <td>${s.name}</td>
                        <td>${s.rollNo}</td>
                        <td style="font-weight: 700; color: #dc2626;">${s.score}/${data.totalPoints}</td>
                        <td style="font-weight: 700;">${s.percentage}%</td>
                        <td><span class="grade grade-${s.grade.toLowerCase()}">${s.grade}</span></td>
                        <td><span class="status status-failed">❌ رسب</span></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- ABSENT SECTION -->
        ${data.absentStudents.length > 0 ? `
        <div style="margin-bottom: 40px;">
            <div class="section-title">
                <span class="section-icon">⛔</span>
                <span>الطلاب الغائبون (${data.absentStudents.length})</span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>اسم الطالب</th>
                        <th>الرقم الجلسة</th>
                        <th>الهاتف</th>
                        <th>السبب</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.absentStudents.map(s => `
                    <tr>
                        <td class="rank">${s.rank}</td>
                        <td>${s.name}</td>
                        <td>${s.rollNo}</td>
                        <td>${s.phone || '-'}</td>
                        <td>${s.reason}</td>
                        <td><span class="status status-absent">⛔ غائب</span></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- SUMMARY SECTION -->
        <div style="margin-bottom: 40px;">
            <div class="section-title">
                <span class="section-icon">📊</span>
                <span>الملخص الإحصائي</span>
            </div>

            <table style="max-width: 500px;">
                <tbody>
                    <tr>
                        <td style="font-weight: 700; width: 50%;">إجمالي الطلاب المتوقع حضورهم</td>
                        <td style="text-align: center; font-weight: 700; color: #0284c7;">${data.passedStudents.length + data.failedStudents.length + data.absentStudents.length}</td>
                    </tr>
                    <tr style="background: #c8e6c9;">
                        <td style="font-weight: 700;">✅ الطلاب الناجحون</td>
                        <td style="text-align: center; font-weight: 700; color: #1b5e20;">${data.passedStudents.length}</td>
                    </tr>
                    <tr style="background: #ffcdd2;">
                        <td style="font-weight: 700;">❌ الطلاب الراسبون</td>
                        <td style="text-align: center; font-weight: 700; color: #c62828;">${data.failedStudents.length}</td>
                    </tr>
                    <tr style="background: #ffe0b2;">
                        <td style="font-weight: 700;">⛔ الطلاب الغائبون</td>
                        <td style="text-align: center; font-weight: 700; color: #e65100;">${data.absentStudents.length}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700;">📈 معدل الحضور</td>
                        <td style="text-align: center; font-weight: 700; color: #0284c7;">${((data.passedStudents.length + data.failedStudents.length) / (data.passedStudents.length + data.failedStudents.length + data.absentStudents.length) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700;">📊 متوسط الدرجات الكلي</td>
                        <td style="text-align: center; font-weight: 700; color: #0284c7;">${((data.passedStudents.concat(data.failedStudents).reduce((a, b) => a + b.score, 0) / (data.passedStudents.length + data.failedStudents.length))).toFixed(1)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-item">
                <span class="footer-label">تاريخ الطباعة:</span>
                <span>${new Date().toLocaleDateString('ar-EG')}</span>
            </div>
            <div class="footer-item">
                <span class="footer-label">الوقت:</span>
                <span>${new Date().toLocaleTimeString('ar-EG')}</span>
            </div>
        </div>
    </div>

    <script>
        // فتح معاينة الطباعة تلقائياً
        window.onload = function() {
            // يمكن إزالة التعليق التالي لفتح الطباعة تلقائياً
            // window.print();
        };
    </script>
</body>
</html>
  `;
}

/**
 * دالة مساعدة لتحديد التقدير بناءً على النسبة المئوية
 */
function getGradeFromPercentage(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * دالة مساعدة لتحويل رقم الصف إلى اسم
 * (هذه الدالة موجودة في dashboard.html بالفعل، لكن نضيفها للتأكد)
 */
function gradeLabel(grade) {
  const labels = {
    '1': 'الصف الأول الثانوي',
    '2': 'الصف الثاني الثانوي',
    '3': 'الصف الثالث الثانوي'
  };
  return labels[String(grade)] || 'صف غير محدد';
}

console.log('✅ نظام الطباعة المتقدم تم تحميله بنجاح');
