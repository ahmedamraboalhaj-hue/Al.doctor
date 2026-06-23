// Single Page Application (SPA) Controller - "منصة الدكتور في اللغة العربية"
// ملاحظة: التسجيل/الدخول بقوا متصلين بقاعدة بيانات Firestore (نفس قاعدة بيانات الداشبورد)
// بدل التخزين الوهمي في localStorage. يعتمد الملف ده على:
//   - firebase-config.js  (بيوفر window.db)
//   - grade-mapping.js    (بيوفر buildGradeOptions / isSecondaryGrade)

document.addEventListener('DOMContentLoaded', () => {
    initIntroSplash();
    initTheme();
    initRouting();
    initSearch();
    initForms();
    initForgotPassword();
    populateRegisterGradeSelect();
    initAuthHeader();
    loadHomeCourses();
});

// ================= Intro Splash Screen (Gateway) =================
function initIntroSplash() {
    const splash = document.getElementById('intro-splash');
    if (!splash) return;

    document.body.classList.add('intro-active');

    // Let the entrance animation play, then reveal the platform
    const MIN_DISPLAY_TIME = 2400; // ms

    const hideSplash = () => {
        splash.classList.add('intro-hidden');
        document.body.classList.remove('intro-active');
        setTimeout(() => splash.remove(), 800);
    };

    setTimeout(hideSplash, MIN_DISPLAY_TIME);

    // Allow tapping/clicking the splash to skip it
    splash.addEventListener('click', hideSplash);
}

// ================= Theme Switcher Management =================
function initTheme() {
    const themeCheckbox = document.getElementById('checkbox');
    const savedTheme = localStorage.getItem('theme') || 'light';

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeCheckbox) themeCheckbox.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (themeCheckbox) themeCheckbox.checked = false;
        }
        // الـ toggle الجديد — CSS بيتحكم في الشكل تلقائياً عبر [data-theme="dark"]
    };

    applyTheme(savedTheme);

    // زرار الهيدر الجديد
    const headerThemeBtn = document.getElementById('header-theme-btn');
    if (headerThemeBtn) {
        headerThemeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const newTheme = current === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    // checkbox legacy
    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', () => {
            const newTheme = themeCheckbox.checked ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    // القايمة القديمة لو موجودة
    const themeRow = document.getElementById('hb-theme-toggle');
    if (themeRow) {
        themeRow.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const newTheme = current === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
}

// ================= SPA Routing and Page Swapping =================
const routes = {
    '#home': 'home-view',
    '#login': 'login-view',
    '#register': 'register-view'
};

function initRouting() {
    // Listen to hash changes in URL
    window.addEventListener('hashchange', handleRouteChange);

    // Initial route handling
    handleRouteChange();
}

function handleRouteChange() {
    const hash = window.location.hash || '#home';
    const activeSectionId = routes[hash] || 'home-view';

    // Swap active views
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
        if (section.id === activeSectionId) {
            section.classList.add('active');
        }
    });

    // Update Header active button states
    updateHeaderActiveStates(hash);

    // Smooth scroll back to top of the view
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateHeaderActiveStates(hash) {
    const loginLink = document.getElementById('nav-login-btn');
    const registerLink = document.getElementById('nav-register-btn');

    // Reset styles
    loginLink.classList.remove('active-nav-link');
    registerLink.classList.remove('active-nav-btn');

    if (hash === '#login') {
        loginLink.classList.add('active-nav-link');
    } else if (hash === '#register') {
        registerLink.classList.add('active-nav-btn');
    }
}

// ================= Search Overlay / Modal Toggle =================
function initSearch() {
    const searchToggle = document.getElementById('search-toggle');
    const searchClose = document.getElementById('search-close');
    const searchOverlay = document.getElementById('search-overlay');

    if (searchToggle && searchOverlay) {
        searchToggle.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            const input = searchOverlay.querySelector('input');
            if (input) setTimeout(() => input.focus(), 100);
        });
    }

    if (searchClose && searchOverlay) {
        searchClose.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
        });
    }

    if (searchOverlay) {
        // Close when clicking outside modal content
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                searchOverlay.classList.remove('active');
            }
        });
    }

    // Support escape key to close search / forgot-password overlays
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (searchOverlay && searchOverlay.classList.contains('active')) {
            searchOverlay.classList.remove('active');
        }
        const fpOverlay = document.getElementById('forgot-password-overlay');
        if (fpOverlay && fpOverlay.classList.contains('active')) {
            fpOverlay.classList.remove('active');
        }
    });
}

// ================= Forgot Password Modal Toggle =================
function initForgotPassword() {
    const link = document.getElementById('forgot-password-link');
    const closeBtn = document.getElementById('forgot-password-close');
    const overlay = document.getElementById('forgot-password-overlay');
    if (!link || !overlay) return;

    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forgot-password-form').reset();
        const alertBox = document.getElementById('forgot-modal-alert');
        alertBox.className = 'forgot-modal-alert';
        alertBox.textContent = '';
        overlay.classList.add('active');
    });

    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });
}

// ================= Grade Select (Register Form) =================
function populateRegisterGradeSelect() {
    const select = document.getElementById('reg-grade');
    if (!select) return;
    if (typeof buildGradeOptions === 'function') {
        // buildGradeOptions(false) => بدون خيار "كل الصفوف"، مع خيار افتراضي فاضي
        select.innerHTML = '<option value="" disabled selected>اختر الصف الدراسي</option>' + buildGradeOptions(false).replace('<option value="">اختر الصف الدراسي</option>', '');
    }
}

// لما الطالب يغيّر الصف في فورم التسجيل: لو ثانوي (1 أو 2 أو 3) أظهر سؤال الشعبة
function handleGradeChange() {
    const grade = document.getElementById('reg-grade').value;
    const trackRow = document.getElementById('reg-track-row');
    const trackSelect = document.getElementById('reg-track');
    const isSecondary = typeof isSecondaryGrade === 'function'
        ? isSecondaryGrade(grade)
        : ['1', '2', '3'].includes(grade);

    if (isSecondary) {
        trackRow.style.display = '';
        trackSelect.setAttribute('required', 'required');
    } else {
        trackRow.style.display = 'none';
        trackSelect.removeAttribute('required');
        trackSelect.value = '';
    }
}
window.handleGradeChange = handleGradeChange;

// ================= Authentication - Firestore Data Layer =================
// كل طلاب المنصة بيتسجلوا في نفس مجموعة Firestore اللي بيستخدمها الداشبورد: collection('students')
// document id = رقم هاتف الطالب (عشان يسهل البحث عند تسجيل الدخول/استعادة كلمة السر)
const STUDENTS_COLLECTION = 'students';

function ensureDb() {
    if (!window.db) {
        alert('تعذّر الاتصال بقاعدة البيانات حالياً. برجاء التأكد من اتصال الإنترنت والمحاولة مرة أخرى.');
        return false;
    }
    return true;
}

async function findStudentByPhone(phone) {
    const doc = await window.db.collection(STUDENTS_COLLECTION).doc(phone).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

function saveSession(student) {
    localStorage.setItem('alamin_current', JSON.stringify(student));
    initAuthHeader();
}

function getCurrentSession() {
    try {
        return JSON.parse(localStorage.getItem('alamin_current') || 'null');
    } catch (err) {
        return null;
    }
}

function getDisplayName(user) {
    if (!user) return '';
    return user.fullName || user.name ||
        [user.firstName || user.fname, user.lastName || user.lname].filter(Boolean).join(' ') ||
        user.phone || 'طالب';
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[ch]));
}

function initAuthHeader() {
    const loginLink = document.getElementById('nav-login-btn');
    const registerLink = document.getElementById('nav-register-btn');
    const user = getCurrentSession();
    if (!loginLink || !registerLink) return;

    if (!user) {
        loginLink.href = '#login';
        loginLink.className = 'nav-login-link';
        loginLink.innerHTML = '<i class="fas fa-accessibility"></i><span>سجل دخولك</span>';
        registerLink.style.display = '';
        return;
    }

    const displayName = getDisplayName(user);
    const initial = (displayName || 'ط').trim().charAt(0);
    loginLink.href = user.role === 'admin' ? 'dashboard.html' : 'profile.html';
    loginLink.className = 'nav-user-chip';
    loginLink.innerHTML = `
        <span class="nav-user-avatar">${escapeHTML(initial)}</span>
        <span class="nav-user-meta">
            <strong>${escapeHTML(displayName.split(' ').slice(0, 2).join(' '))}</strong>
            <small>${user.role === 'admin' ? 'لوحة التحكم' : 'حسابي'}</small>
        </span>
    `;
    registerLink.style.display = 'none';
}

async function fetchPlatformCourses() {
    let courses = [];
    if (window.db) {
        try {
            const doc = await window.db.collection('platform_data').doc('courses_list').get();
            if (doc.exists) {
                const data = doc.data() || {};
                courses = Array.isArray(data.items) ? data.items :
                    (Array.isArray(data.courses) ? data.courses :
                    (Array.isArray(data.list) ? data.list : []));
                if (courses.length) {
                    localStorage.setItem('alamin_courses', JSON.stringify(courses));
                }
            }
        } catch (err) {
            console.warn('Courses load failed, using local cache:', err);
        }
    }

    if (!courses.length) {
        try {
            courses = JSON.parse(localStorage.getItem('alamin_courses') || '[]');
        } catch (err) {
            courses = [];
        }
    }
    return courses;
}

function normalizeCourseId(id) {
    return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function getCourseLessonCount(course) {
    return Array.isArray(course.lessons) ? course.lessons.length : 0;
}

function getCourseDurationLabel(course) {
    const lessons = course.lessons || [];
    const minutes = lessons.reduce((sum, lesson) => {
        const segments = lesson.segments || [];
        const segmentMinutes = segments.reduce((inner, seg) => {
            const raw = String(seg.duration || '').trim();
            const match = raw.match(/(\d+)\s*:?/);
            return inner + (match ? Number(match[1]) : 0);
        }, 0);
        return sum + segmentMinutes;
    }, 0);
    if (!minutes) return 'متاح الآن';
    if (minutes >= 60) return `${Math.round(minutes / 60)} ساعات`;
    return `${minutes} دقيقة`;
}

function renderCourseCard(course) {
    const lessonCount = getCourseLessonCount(course);
    const isPaid = course.type === 'paid';
    const badge = isPaid ? `${course.price || 0} ج.م` : 'كورس مجاني';
    const thumb = course.thumbnail || course.thumb || 'صورة الواجهه.jpeg';
    const objectPosition = `${course.thumbnailX || 50}% ${course.thumbnailY || 35}%`;
    const desc = course.desc || course.description || 'محتوى تعليمي منظم يساعدك تذاكر وتراجع وتتابع تقدمك بسهولة.';
    const courseUrl = `lessons.html?course=${encodeURIComponent(course.id)}`;

    return `
        <div class="course-card">
            <a class="course-image-container" href="${courseUrl}" aria-label="فتح ${escapeHTML(course.title || 'الكورس')}">
                <img src="${escapeHTML(thumb)}" alt="${escapeHTML(course.title || 'كورس')}" class="course-img" style="object-position:${objectPosition}">
                <span class="course-badge ${isPaid ? 'paid' : 'free'}">${escapeHTML(badge)}</span>
            </a>
            <div class="course-info">
                <h3 class="course-title">${escapeHTML(course.title || 'كورس جديد')}</h3>
                <p class="course-desc">${escapeHTML(desc)}</p>
                <div class="course-stats">
                    <span><i class="fas fa-play-circle"></i> ${lessonCount || 'بدون'} محاضرة</span>
                    <span><i class="fas fa-clock"></i> ${escapeHTML(getCourseDurationLabel(course))}</span>
                </div>
                <button class="btn-course-action" onclick="openCourse('${escapeHTML(normalizeCourseId(course.id))}')">
                    افتح الكورس <i class="fas fa-arrow-left"></i>
                </button>
            </div>
        </div>
    `;
}

async function loadHomeCourses() {
    const grid = document.querySelector('#home-view .courses-grid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="courses-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>جاري تحميل الكورسات...</span>
        </div>
    `;

    const courses = await fetchPlatformCourses();
    if (!courses.length) {
        grid.innerHTML = `
            <div class="courses-empty">
                <i class="fas fa-book-open"></i>
                <strong>لا توجد كورسات منشورة حالياً</strong>
                <span>أضف أول كورس من لوحة التحكم وسيظهر هنا فوراً.</span>
            </div>
        `;
        return;
    }
    grid.innerHTML = courses.map(renderCourseCard).join('');
}

function openCourse(courseId) {
    const user = getCurrentSession();
    if (!user) {
        window.location.hash = '#login';
        alert('سجل دخولك أولاً عشان تفتح محتوى الكورس.');
        return;
    }
    window.location.href = `lessons.html?course=${encodeURIComponent(courseId)}`;
}
window.openCourse = openCourse;

function initForms() {
    // Form navigation helper links
    document.getElementById('go-to-register').addEventListener('click', (e) => {
        window.location.hash = '#register';
    });

    document.getElementById('go-to-login').addEventListener('click', (e) => {
        window.location.hash = '#login';
    });
}

// Egyptian Phone number validation regex
const EGYPT_PHONE_REGEX = /^(010|011|012|015)[0-9]{8}$/;

// Submit Handler for Login — backend كامل مأخوذ من login.html
async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!ensureDb()) return;

    const phoneInp = document.getElementById('login-phone');
    const passInp  = document.getElementById('login-password');
    const codeChk  = document.getElementById('login-by-code');

    const phone = (phoneInp ? phoneInp.value.trim() : '');
    const pass  = (passInp  ? passInp.value         : '');
    const loginByCode = codeChk ? codeChk.checked : false;

    // ── وضع الكود ──
    if (loginByCode) {
        const code = pass.toUpperCase();
        if (!code) { alert('❌ من فضلك ادخل الكود الخاص بك'); return; }

        try {
            // 1) centerStudents
            const centerSnap = await window.db.collection('centerStudents')
                .where('centerCode', '==', code).limit(1).get();
            if (!centerSnap.empty) {
                const doc  = centerSnap.docs[0];
                const user = { ...doc.data(), id: doc.id, role: 'student', type: 'center', centerCode: code };
                saveSession(user);
                alert('✅ أهلاً بيك يا ' + (user.name || user.fullName || 'طالب') + '! تم تسجيل الدخول.');
                window.location.hash = '#home'; initAuthHeader(); return;
            }
            // 2) students doc id
            const docSnap = await window.db.collection('students').doc(code).get();
            if (docSnap.exists) {
                const user = { ...docSnap.data(), id: code, role: 'student' };
                saveSession(user);
                alert('✅ أهلاً بيك يا ' + (user.name || 'طالب') + '! تم تسجيل الدخول.');
                window.location.hash = '#home'; initAuthHeader(); return;
            }
            // 3) qrCode field
            const qrSnap = await window.db.collection('students')
                .where('qrCode', '==', code).limit(1).get();
            if (!qrSnap.empty) {
                const doc  = qrSnap.docs[0];
                const user = { ...doc.data(), id: doc.id, role: 'student' };
                saveSession(user);
                alert('✅ أهلاً بيك يا ' + (user.name || 'طالب') + '! تم تسجيل الدخول.');
                window.location.hash = '#home'; initAuthHeader(); return;
            }
            alert('❌ الكود غير صحيح أو غير مسجل — تأكد من الكود وحاول تاني');
        } catch (err) {
            console.error(err);
            alert('❌ حدث خطأ في الاتصال بقاعدة البيانات');
        }
        return;
    }

    // ── وضع رقم + كلمة مرور ──
    if (!phone || !pass) { alert('❌ من فضلك ادخل رقم الموبايل وكلمة المرور'); return; }

    // أدمن
    if (phone === '2026' && pass === '2027') {
        const admin = { id: 0, name: 'الأستاذ الدكتور', phone: '01000000000', role: 'admin' };
        saveSession(admin);
        alert('✅ مرحباً بك يا أستاذ الدكتور! جاري الانتقال للوحة التحكم...');
        window.location.href = 'dashboard.html'; return;
    }

    // التحقق من رقم الهاتف (11 رقم)
    if (!/^[0-9]{11}$/.test(phone)) {
        const phoneInp2 = document.getElementById('login-phone');
        if (phoneInp2) { phoneInp2.style.borderBottomColor = '#ef4444'; phoneInp2.focus(); }
        alert('⚠️ رقم الهاتف يجب أن يكون 11 رقماً بالظبط');
        return;
    }

    try {
        // Firestore
        const snapshot = await window.db.collection('students')
            .where('phone', '==', phone).where('password', '==', pass).get();
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const user = { ...userDoc.data(), id: userDoc.id, role: 'student' };
            saveSession(user);
            const greetName = user.firstName || (user.name||'').split(' ')[0] || 'طالب';
            alert('✅ مرحباً بك يا ' + greetName + '! تم تسجيل الدخول بنجاح.');
            document.getElementById('login-form') && document.getElementById('login-form').reset();
            window.location.hash = '#home'; initAuthHeader();
        } else {
            // localStorage fallback
            const users = JSON.parse(localStorage.getItem('alamin_users') || '[]');
            const user  = users.find(u => u.phone === phone && u.password === pass);
            if (user) {
                user.role = 'student';
                saveSession(user);
                const greetName2 = user.firstName || (user.name||'').split(' ')[0] || 'طالب';
                alert('✅ مرحباً بك يا ' + greetName2 + '! تم تسجيل الدخول بنجاح.');
                window.location.hash = '#home'; initAuthHeader();
            } else {
                alert('❌ رقم الموبايل أو كلمة المرور غلط!');
            }
        }
    } catch (err) {
        console.error(err);
        alert('❌ حدث خطأ في الاتصال بقاعدة البيانات');
    }
}

// ================= Inline Field Error Helpers =================
function showFieldError(fieldId, errId, message) {
    const input = document.getElementById(fieldId);
    const errEl = document.getElementById(errId);
    if (input) { input.classList.add('input-error'); }
    if (errEl) { errEl.textContent = message; errEl.style.display = 'block'; }
    if (input && !document.querySelector('.input-error:focus')) {
        input.focus(); input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
function clearFieldError(fieldId, errId) {
    const input = document.getElementById(fieldId);
    const errEl = document.getElementById(errId);
    if (input) input.classList.remove('input-error');
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
}
function clearAllRegisterErrors() {
    [['reg-fname','err-fname'],['reg-sname','err-sname'],
     ['reg-tname','err-tname'],['reg-lname','err-lname'],
     ['reg-phone','err-phone'],['reg-father-phone','err-father-phone'],
     ['reg-recovery-phone','err-recovery-phone'],['reg-grade','err-grade'],
     ['reg-track','err-track'],['reg-password','err-password']
    ].forEach(([f,e]) => clearFieldError(f, e));
    const a = document.getElementById('reg-form-alert');
    if (a) { a.style.display = 'none'; a.textContent = ''; }
}
function showFormAlert(message, type) {
    const a = document.getElementById('reg-form-alert');
    if (!a) return;
    a.textContent = message;
    a.className = 'form-alert form-alert-' + (type || 'error');
    a.style.display = 'block';
    a.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function addInlineErr(errId, message) {
    const fieldMap = {
        'err-fname':'reg-fname','err-sname':'reg-sname','err-tname':'reg-tname',
        'err-lname':'reg-lname','err-phone':'reg-phone',
        'err-father-phone':'reg-father-phone','err-recovery-phone':'reg-recovery-phone',
        'err-grade':'reg-grade','err-track':'reg-track','err-password':'reg-password'
    };
    const e = document.getElementById(errId);
    if (e) { e.textContent = message; e.style.display = 'block'; }
    const inp = document.getElementById(fieldMap[errId]);
    if (inp) inp.classList.add('input-error');
}

// Submit Handler for Registration
async function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!ensureDb()) return;

    clearAllRegisterErrors();

    const fname = (document.getElementById('reg-fname')?.value || '').trim();
    const sname = (document.getElementById('reg-sname')?.value || '').trim();
    const tname = (document.getElementById('reg-tname')?.value || '').trim();
    const lname = (document.getElementById('reg-lname')?.value || '').trim();

    const phone         = (document.getElementById('reg-phone')?.value || '').trim();
    const fatherPhone   = (document.getElementById('reg-father-phone')?.value || '').trim();
    const recoveryPhone = (document.getElementById('reg-recovery-phone')?.value || '').trim();

    const school   = (document.getElementById('reg-school')?.value || '').trim();
    const grade    = document.getElementById('reg-grade')?.value || '';
    const track    = document.getElementById('reg-track')?.value || '';
    const gov      = document.getElementById('reg-gov')?.value || '';
    const gender   = document.getElementById('reg-gender')?.value || '';
    const password = (document.getElementById('reg-password')?.value || '').trim();

    // ─── Inline Validations ────────────────────────────────────
    let firstErrorField = null;
    function markErr(fid, eid, msg) {
        addInlineErr(eid, msg);
        if (!firstErrorField) firstErrorField = fid;
    }

    if (!fname)  markErr('reg-fname', 'err-fname', '⚠️ الاسم الأول مطلوب');
    if (!sname)  markErr('reg-sname', 'err-sname', '⚠️ الاسم الثاني مطلوب');
    if (!tname)  markErr('reg-tname', 'err-tname', '⚠️ الاسم الثالث مطلوب');

    if (!EGYPT_PHONE_REGEX.test(phone)) {
        markErr('reg-phone', 'err-phone', '⚠️ رقم هاتف الطالب يجب أن يكون 11 رقماً ويبدأ بـ 010/011/012/015');
    }
    if (!EGYPT_PHONE_REGEX.test(fatherPhone)) {
        markErr('reg-father-phone', 'err-father-phone', '⚠️ رقم هاتف ولي الأمر يجب أن يكون 11 رقماً');
    }
    if (!EGYPT_PHONE_REGEX.test(recoveryPhone)) {
        markErr('reg-recovery-phone', 'err-recovery-phone', '⚠️ رقم الاسترداد يجب أن يكون 11 رقماً');
    }
    if (!grade) {
        markErr('reg-grade', 'err-grade', '⚠️ برجاء اختيار الصف الدراسي');
    }

    const isSecondary = typeof isSecondaryGrade === 'function'
        ? isSecondaryGrade(grade)
        : ['1', '2', '3'].includes(grade);

    if (isSecondary && !track) {
        markErr('reg-track', 'err-track', '⚠️ برجاء تحديد الشعبة: علمي ولا أدبي؟');
    }
    if (password.length < 6) {
        markErr('reg-password', 'err-password', '⚠️ كلمة المرور يجب ألا تقل عن 6 خانات');
    }

    if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
    }

    // ─── Check duplicate phone ─────────────────────────────────
    let existing;
    try {
        existing = await findStudentByPhone(phone);
    } catch (err) {
        console.error('Registration lookup failed:', err);
        showFormAlert('❌ حدث خطأ أثناء الاتصال بقاعدة البيانات. حاول مرة أخرى.', 'error');
        return;
    }

    if (existing) {
        addInlineErr('err-phone', '❌ هذا الرقم مسجل بالفعل — انتقل لصفحة تسجيل الدخول');
        document.getElementById('reg-phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { window.location.hash = '#login'; }, 1500);
        return;
    }

    // ─── Build student document ────────────────────────────────
    const fullName = `${fname} ${sname} ${tname} ${lname}`.replace(/\s+/g, ' ').trim();
    const newStudent = {
        firstName: fname, secondName: sname, thirdName: tname, lastName: lname,
        name: fullName, fullName, phone, fatherPhone, recoveryPhone,
        school, grade, track: isSecondary ? track : null, gov, gender, password,
        studentType: 'outside', role: 'student', status: 'pending',
        enrolledCourses: [], qrCode: phone,
        joinDate: new Date().toLocaleDateString('ar-EG'),
        registeredAt: new Date().toISOString()
    };

    try {
        await window.db.collection(STUDENTS_COLLECTION).doc(phone).set(newStudent);
    } catch (err) {
        console.error('Registration save failed:', err);
        showFormAlert('❌ حدث خطأ أثناء حفظ بياناتك. حاول مرة أخرى.', 'error');
        return;
    }

    saveSession({ id: phone, ...newStudent });
    showFormAlert(`✅ تهانينا يا ${fname}! تم إرسال طلب إنشاء الحساب بنجاح. سيتم التواصل معك لتفعيل الحساب.`, 'success');

    setTimeout(() => {
        document.getElementById('register-form').reset();
        handleGradeChange();
        window.location.hash = '#home';
        initAuthHeader();
    }, 2500);
}

// Submit Handler for Forgot Password
async function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    if (!ensureDb()) return;

    const alertBox = document.getElementById('forgot-modal-alert');
    const showAlert = (msg, type) => {
        alertBox.textContent = msg;
        alertBox.className = 'forgot-modal-alert ' + (type === 'ok' ? 'ok' : 'err');
    };

    const phone = document.getElementById('fp-phone').value.trim();
    const recoveryPhone = document.getElementById('fp-recovery-phone').value.trim();
    const newPassword = document.getElementById('fp-new-password').value.trim();
    const confirmPassword = document.getElementById('fp-confirm-password').value.trim();

    if (!EGYPT_PHONE_REGEX.test(phone) || !EGYPT_PHONE_REGEX.test(recoveryPhone)) {
        showAlert('❌ برجاء إدخال أرقام هواتف مصرية صحيحة (11 رقماً لكل رقم)', 'err');
        return;
    }
    if (newPassword.length < 6) {
        showAlert('❌ كلمة المرور الجديدة 6 أحرف على الأقل', 'err');
        return;
    }
    if (newPassword !== confirmPassword) {
        showAlert('❌ كلمة المرور الجديدة وتأكيدها غير متطابقتين', 'err');
        return;
    }

    let student;
    try {
        student = await findStudentByPhone(phone);
    } catch (err) {
        console.error('Forgot-password lookup failed:', err);
        showAlert('❌ حدث خطأ أثناء الاتصال بقاعدة البيانات. حاول مرة أخرى.', 'err');
        return;
    }

    if (!student || String(student.recoveryPhone || '') !== recoveryPhone) {
        showAlert('❌ رقم الهاتف أو رقم استعادة الحساب غير مطابقين لبياناتنا.', 'err');
        return;
    }

    try {
        await window.db.collection(STUDENTS_COLLECTION).doc(phone).update({ password: newPassword });
    } catch (err) {
        console.error('Password update failed:', err);
        showAlert('❌ حدث خطأ أثناء تحديث كلمة المرور. حاول مرة أخرى.', 'err');
        return;
    }

    showAlert('✅ تم تغيير كلمة المرور بنجاح! يمكنك تسجيل الدخول الآن.', 'ok');
    setTimeout(() => {
        document.getElementById('forgot-password-overlay').classList.remove('active');
        document.getElementById('forgot-password-form').reset();
    }, 1800);
}
window.handleForgotPasswordSubmit = handleForgotPasswordSubmit;
