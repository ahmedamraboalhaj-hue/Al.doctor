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
    initAiPopup();
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

    // ── نقل الصفحة لأعلى الفورم الجديد (الصورة + العنوان) ──
    // بنستخدم 'auto' (instant) مش 'smooth' عشان منضمن إن السكروول يحصل فوراً
    // قبل ما يبدأ أي transition/animation على القسم الجديد، وبنأكد إنه يتم
    // بعد ما المتصفح يخلص الـ layout الخاص بالقسم (display:none -> block)
    // عن طريق requestAnimationFrame مرتين (frame واحد مش كفاية في بعض المتصفحات).
    const scrollToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0; // fallback لبعض المتصفحات القديمة
    };

    scrollToTop();
    requestAnimationFrame(() => {
        requestAnimationFrame(scrollToTop);
    });
}

function updateHeaderActiveStates(hash) {
    const loginLink = document.getElementById('nav-login-btn');
    const registerLink = document.getElementById('nav-register-btn');

    // Reset styles
    if (loginLink) loginLink.classList.remove('active-nav-link');
    if (registerLink) registerLink.classList.remove('active-nav-btn');

    if (hash === '#login') {
        if (loginLink) loginLink.classList.add('active-nav-link');
    } else if (hash === '#register') {
        if (registerLink) registerLink.classList.add('active-nav-btn');
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

// بيتأكد إن قاعدة البيانات (window.db) جاهزة، ولو لسه بتتحمّل بينتظر لحد 4 ثواني
// قبل ما يعتبرها فاشلة. ده بيحل مشكلة "تعليق/فشل" تسجيل الدخول لو المستخدم
// ضغط submit بسرعة قبل ما Firebase يخلص التهيئة.
function waitForDb(timeoutMs = 4000) {
    return new Promise((resolve) => {
        if (window.db) { resolve(true); return; }
        const start = Date.now();
        const interval = setInterval(() => {
            if (window.db) {
                clearInterval(interval);
                resolve(true);
            } else if (Date.now() - start >= timeoutMs) {
                clearInterval(interval);
                resolve(false);
            }
        }, 100);
    });
}

async function ensureDb() {
    const ok = await waitForDb();
    if (!ok) {
        return false;
    }
    return true;
}

async function findStudentByPhone(phone) {
    const doc = await window.db.collection(STUDENTS_COLLECTION).doc(phone).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

function saveSession(student) {
    const data = JSON.stringify(student);
    localStorage.setItem('alamin_current', data);
    localStorage.setItem('alamin_session', data); // backward compat
    initAuthHeader();
}

function getCurrentSession() {
    try {
        return JSON.parse(localStorage.getItem('alamin_current') || localStorage.getItem('alamin_session') || 'null');
    } catch (err) {
        return null;
    }
}

function logoutUser() {
    localStorage.removeItem('alamin_current');
    localStorage.removeItem('alamin_session');
    initAuthHeader();
    navigateTo('#home');
}
window.logoutUser = logoutUser;

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
    const guestLinks = document.getElementById('hb-guest-links');
    const userLinks = document.getElementById('hb-user-links');
    const hbUserName = document.getElementById('hb-user-name');
    const user = getCurrentSession();

    if (!guestLinks || !userLinks) return;

    if (!user) {
        guestLinks.style.display = '';
        userLinks.style.display = 'none';
        return;
    }

    // مسجل دخول
    guestLinks.style.display = 'none';
    userLinks.style.display = '';

    const displayName = getDisplayName(user);
    if (hbUserName) {
        hbUserName.textContent = displayName.split(' ').slice(0, 2).join(' ') || 'حسابي';
    }

    // لو أدمن يوجه للداشبورد
    const profileLink = document.getElementById('nav-profile-btn');
    if (profileLink) {
        profileLink.href = user.role === 'admin' ? 'dashboard.html' : 'profile.html';
    }
}

async function fetchPlatformCourses() {
    let courses = [];
    let firebaseReadOk = false;
    if (window.db) {
        try {
            const doc = await window.db.collection('platform_data').doc('courses_list').get();
            firebaseReadOk = true;
            if (doc.exists) {
                const data = doc.data() || {};
                courses = Array.isArray(data.items) ? data.items :
                    (Array.isArray(data.courses) ? data.courses :
                        (Array.isArray(data.list) ? data.list : []));
                courses = sanitizePublishedCourses(courses);
                if (courses.length) {
                    localStorage.setItem('alamin_courses', JSON.stringify(courses));
                } else {
                    localStorage.removeItem('alamin_courses');
                }
            } else {
                localStorage.removeItem('alamin_courses');
            }
        } catch (err) {
            console.warn('Courses load failed, using local cache:', err);
        }
    }

    if (!courses.length && !firebaseReadOk) {
        try {
            courses = JSON.parse(localStorage.getItem('alamin_courses') || '[]');
            courses = sanitizePublishedCourses(courses);
        } catch (err) {
            courses = [];
        }
    }
    return courses;
}

const LEGACY_SEED_COURSE_TITLES = new Set([
    'المراجعة النهائية الصف الأول الثانوي',
    'المراجعة النهائية الصف الثاني الثانوي',
    'مراجعة التربية الدينية الصف الثالث'
]);

function sanitizePublishedCourses(courses) {
    if (!Array.isArray(courses)) return [];
    const clean = courses.filter(course => !LEGACY_SEED_COURSE_TITLES.has(course && course.title));
    if (clean.length !== courses.length) {
        localStorage.setItem('alamin_courses', JSON.stringify(clean));
    }
    return clean;
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
    const priceLabel = `${course.price || 0} ج.م`;
    const badgeHtml = isPaid
        ? `مدفوع <span class="course-badge-price">${escapeHTML(priceLabel)}</span>`
        : 'كورس مجاني';
    const thumb = course.thumbnail || course.thumb || 'صورة الواجهه.jpeg';
    const objectPosition = `${course.thumbnailX || 50}% ${course.thumbnailY || 35}%`;
    const desc = course.desc || course.description || 'محتوى تعليمي منظم يساعدك تذاكر وتراجع وتتابع تقدمك بسهولة.';
    const courseUrl = `lessons.html?course=${encodeURIComponent(course.id)}`;

    return `
        <div class="course-card">
            <a class="course-image-container" href="${courseUrl}" aria-label="فتح ${escapeHTML(course.title || 'الكورس')}">
                <img src="${escapeHTML(thumb)}" alt="${escapeHTML(course.title || 'كورس')}" class="course-img" style="object-position:${objectPosition}">
                <span class="course-badge ${isPaid ? 'paid' : 'free'}">${badgeHtml}</span>
            </a>
            <div class="course-info">
                <h3 class="course-title">${escapeHTML(course.title || 'كورس جديد')}</h3>
                <p class="course-desc">${escapeHTML(desc)}</p>
                <div class="course-stats">
                    <span><i class="fas fa-play-circle"></i> ${lessonCount || 'بدون'} محاضرة</span>
                    <span><i class="fas fa-clock"></i> ${escapeHTML(getCourseDurationLabel(course))}</span>
                </div>
                <button class="btn-course-action" onclick="openCourse('${escapeHTML(normalizeCourseId(course.id))}')">
                    الدخول للكورس <i class="fas fa-arrow-left"></i>
                </button>
            </div>
        </div>
    `;
}

async function loadHomeCourses() {
    const grid = document.querySelector('#home-view .courses-grid');
    if (!grid) return;

    // ── 1. عرض الكاش الفوري بدون أي تأخير ──
    let cached = [];
    try { cached = sanitizePublishedCourses(JSON.parse(localStorage.getItem('alamin_courses') || '[]')); } catch (e) { }

    if (cached.length) {
        grid.innerHTML = cached.map(renderCourseCard).join('');
    } else {
        grid.innerHTML = `
            <div class="courses-skeleton-row">
                ${[1, 2, 3].map(() => `
                <div class="course-card skeleton-card">
                    <div class="course-image-container skeleton-img"></div>
                    <div class="course-info">
                        <div class="skeleton-line" style="width:65%;height:20px;margin-bottom:12px;"></div>
                        <div class="skeleton-line" style="width:100%;height:14px;margin-bottom:8px;"></div>
                        <div class="skeleton-line" style="width:80%;height:14px;margin-bottom:24px;"></div>
                        <div class="skeleton-line" style="width:100%;height:48px;border-radius:14px;"></div>
                    </div>
                </div>`).join('')}
            </div>
        `;
    }

    // ── 2. انتظر حتى يكون Firebase جاهزاً (max 8 ثواني) ──
    const dbReady = await waitForDb(8000);
    if (!dbReady || !window.db) {
        // Firebase غير متاح — استخدم الكاش
        if (!cached.length) {
            grid.innerHTML = `<div class="courses-empty"><i class="fas fa-book-open"></i><strong>لا توجد كورسات منشورة حالياً</strong></div>`;
        }
        return;
    }

    // ── 3. اجلب من Firebase (المصدر الموثوق دائماً) ──
    try {
        const doc = await window.db.collection('platform_data').doc('courses_list').get();
        if (doc.exists) {
            const data = doc.data() || {};
            let fresh = Array.isArray(data.items) ? data.items :
                (Array.isArray(data.courses) ? data.courses :
                    (Array.isArray(data.list) ? data.list : []));
            fresh = sanitizePublishedCourses(fresh);
            if (fresh.length) {
                localStorage.setItem('alamin_courses', JSON.stringify(fresh));
                grid.innerHTML = fresh.map(renderCourseCard).join('');
                // تحديث عداد الكورسات في الـ ticker
                const ticker = document.getElementById('tickerCourses');
                if (ticker) ticker.textContent = fresh.length;
                return;
            }
        }
        // Firebase موجود لكن فاضي أو courses فاضية
        localStorage.removeItem('alamin_courses');
        grid.innerHTML = `<div class="courses-empty"><i class="fas fa-book-open"></i><strong>لا توجد كورسات منشورة حالياً</strong><span>أضف أول كورس من لوحة التحكم وسيظهر هنا فوراً.</span></div>`;
        const ticker = document.getElementById('tickerCourses');
        if (ticker) ticker.textContent = '0';
    } catch (err) {
        console.warn('[loadHomeCourses] Firebase error:', err.code, err.message);
        // Firebase فشل — استخدم الكاش
        if (cached.length) {
            grid.innerHTML = cached.map(renderCourseCard).join('');
        } else {
            grid.innerHTML = `<div class="courses-empty"><i class="fas fa-book-open"></i><strong>لا توجد كورسات منشورة حالياً</strong></div>`;
        }
    }
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

// ================= Robust Hash Navigation Helper =================
// بيضمن إن الانتقال يحصل ويتم السكروول لأعلى الفورم حتى لو المستخدم
// ضغط على رابط بيوجّه لنفس الـ hash الحالي (اللي مكنش بيعمل hashchange أصلاً)
function navigateTo(hash) {
    if (window.location.hash === hash) {
        // الهاش نفسه — مفيش hashchange هيحصل، فننفذ التغيير يدوياً
        handleRouteChange();
    } else {
        window.location.hash = hash;
    }
}
window.navigateTo = navigateTo;

function initForms() {
    // Form navigation helper links
    const goToRegister = document.getElementById('go-to-register');
    if (goToRegister) {
        goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('#register');
        });
    }

    const goToLogin = document.getElementById('go-to-login');
    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('#login');
        });
    }

    // أي رابط تاني في الصفحة بيوجّه لـ #login أو #register (هيدر، أزرار الصفوف، CTA...)
    // بنوصّله بالـ navigateTo عشان يشتغل دايماً حتى لو كان نفس الهاش الحالي
    document.querySelectorAll('a[href="#login"], a[href="#register"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
        });
    });

    // فحص لحظي لتطابق كلمة المرور وتأكيدها أثناء الكتابة
    const pwInp = document.getElementById('reg-password');
    const pwConfirmInp = document.getElementById('reg-password-confirm');
    if (pwInp && pwConfirmInp) {
        const checkMatch = () => {
            if (!pwConfirmInp.value) {
                clearFieldError('reg-password-confirm', 'err-password-confirm');
                return;
            }
            if (pwInp.value !== pwConfirmInp.value) {
                addInlineErr('err-password-confirm', '❌ كلمة المرور وتأكيدها غير متطابقتين');
            } else {
                clearFieldError('reg-password-confirm', 'err-password-confirm');
            }
        };
        pwInp.addEventListener('input', checkMatch);
        pwConfirmInp.addEventListener('input', checkMatch);
    }
}

// Egyptian Phone number validation regex
const EGYPT_PHONE_REGEX = /^(010|011|012|015)[0-9]{8}$/;

let isLoginSubmitting = false;

// Submit Handler for Login — backend كامل مأخوذ من login.html
async function handleLoginSubmit(e) {
    e.preventDefault();

    // ── منع الضغطات المتكررة أثناء تسجيل الدخول ──
    if (isLoginSubmitting) return;
    isLoginSubmitting = true;
    setButtonLoading('login-submit-btn', true);

    try {
        clearAllLoginErrors();

        const phoneInp = document.getElementById('login-phone');
        const passInp = document.getElementById('login-password');
        const codeChk = document.getElementById('login-by-code');

        const phone = (phoneInp ? phoneInp.value.trim() : '');
        const pass = (passInp ? passInp.value : '');
        const loginByCode = codeChk ? codeChk.checked : false;

        const dbReady = await ensureDb();
        if (!dbReady) {
            showFormAlert('❌ تعذّر الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت وحاول مرة أخرى.', 'error', 'login-form-alert');
            return;
        }

        // ── وضع الكود ──
        if (loginByCode) {
            const code = pass.toUpperCase();
            if (!code) {
                addInlineErr('err-login-password', '⚠️ من فضلك ادخل الكود الخاص بك');
                passInp?.focus();
                return;
            }

            try {
                // 1) centerStudents
                const centerSnap = await withTimeout(
                    window.db.collection('centerStudents').where('centerCode', '==', code).limit(1).get(),
                    10000, 'login-timeout'
                );
                if (!centerSnap.empty) {
                    const doc = centerSnap.docs[0];
                    const user = { ...doc.data(), id: doc.id, role: 'student', type: 'center', centerCode: code };
                    saveSession(user);
                    showFormAlert('✅ أهلاً بيك يا ' + (user.name || user.fullName || 'طالب') + '! تم تسجيل الدخول.', 'success', 'login-form-alert');
                    setTimeout(() => { navigateTo('#home'); initAuthHeader(); }, 900);
                    return;
                }
                // 2) students doc id
                const docSnap = await withTimeout(
                    window.db.collection('students').doc(code).get(), 10000, 'login-timeout'
                );
                if (docSnap.exists) {
                    const user = { ...docSnap.data(), id: code, role: 'student' };
                    saveSession(user);
                    showFormAlert('✅ أهلاً بيك يا ' + (user.name || 'طالب') + '! تم تسجيل الدخول.', 'success', 'login-form-alert');
                    setTimeout(() => { navigateTo('#home'); initAuthHeader(); }, 900);
                    return;
                }
                // 3) qrCode field
                const qrSnap = await withTimeout(
                    window.db.collection('students').where('qrCode', '==', code).limit(1).get(),
                    10000, 'login-timeout'
                );
                if (!qrSnap.empty) {
                    const doc = qrSnap.docs[0];
                    const user = { ...doc.data(), id: doc.id, role: 'student' };
                    saveSession(user);
                    showFormAlert('✅ أهلاً بيك يا ' + (user.name || 'طالب') + '! تم تسجيل الدخول.', 'success', 'login-form-alert');
                    setTimeout(() => { navigateTo('#home'); initAuthHeader(); }, 900);
                    return;
                }
                addInlineErr('err-login-password', '❌ الكود غير صحيح أو غير مسجل — تأكد من الكود وحاول تاني');
                showFormAlert('❌ الكود غير صحيح أو غير مسجل.', 'error', 'login-form-alert');
            } catch (err) {
                console.error(err);
                showFormAlert('❌ حدث خطأ في الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت وحاول مرة أخرى.', 'error', 'login-form-alert');
            }
            return;
        }

        // ── وضع رقم + كلمة مرور ──
        let firstErrorField = null;
        if (!phone) {
            addInlineErr('err-login-phone', '⚠️ من فضلك ادخل رقم الموبايل');
            firstErrorField = 'login-phone';
        } else if (!/^[0-9]{11}$/.test(phone) && !(phone === '2026')) {
            addInlineErr('err-login-phone', '⚠️ رقم الهاتف يجب أن يكون 11 رقماً بالظبط');
            firstErrorField = 'login-phone';
        }
        if (!pass) {
            addInlineErr('err-login-password', '⚠️ من فضلك ادخل كلمة السر');
            if (!firstErrorField) firstErrorField = 'login-password';
        }
        if (firstErrorField) {
            const el = document.getElementById(firstErrorField);
            if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            return;
        }

        // أدمن
        if (phone === '2026' && pass === '2027') {
            const admin = { id: 0, name: 'الأستاذ الدكتور', phone: '01000000000', role: 'admin' };
            saveSession(admin);
            showFormAlert('✅ مرحباً بك يا أستاذ الدكتور! جاري الانتقال للوحة التحكم...', 'success', 'login-form-alert');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
            return;
        }

        try {
            // Firestore
            const snapshot = await withTimeout(
                window.db.collection('students').where('phone', '==', phone).where('password', '==', pass).get(),
                10000, 'login-timeout'
            );
            if (!snapshot.empty) {
                const userDoc = snapshot.docs[0];
                const user = { ...userDoc.data(), id: userDoc.id, role: 'student' };
                saveSession(user);
                const greetName = user.firstName || (user.name || '').split(' ')[0] || 'طالب';
                showFormAlert('✅ مرحباً بك يا ' + greetName + '! تم تسجيل الدخول بنجاح.', 'success', 'login-form-alert');
                document.getElementById('login-form')?.reset();
                setTimeout(() => { navigateTo('#home'); initAuthHeader(); }, 900);
            } else {
                // localStorage fallback
                const users = JSON.parse(localStorage.getItem('alamin_users') || '[]');
                const user = users.find(u => u.phone === phone && u.password === pass);
                if (user) {
                    user.role = 'student';
                    saveSession(user);
                    const greetName2 = user.firstName || (user.name || '').split(' ')[0] || 'طالب';
                    showFormAlert('✅ مرحباً بك يا ' + greetName2 + '! تم تسجيل الدخول بنجاح.', 'success', 'login-form-alert');
                    setTimeout(() => { navigateTo('#home'); initAuthHeader(); }, 900);
                } else {
                    addInlineErr('err-login-password', '❌ رقم الموبايل أو كلمة المرور غلط');
                    showFormAlert('❌ رقم الموبايل أو كلمة المرور غلط!', 'error', 'login-form-alert');
                }
            }
        } catch (err) {
            console.error(err);
            showFormAlert('❌ حدث خطأ في الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت وحاول مرة أخرى.', 'error', 'login-form-alert');
        }
    } catch (err) {
        console.error('Unexpected login error:', err);
        showFormAlert('❌ حدث خطأ غير متوقع. برجاء المحاولة مرة أخرى.', 'error', 'login-form-alert');
    } finally {
        isLoginSubmitting = false;
        setButtonLoading('login-submit-btn', false);
    }
}

// ================= Submit Button Loading State Helpers =================
// بيتحكم في حالة التحميل لأي زرار submit: تعطيل + سبينر + منع الضغط المتكرر
function setButtonLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('is-loading');
    } else {
        btn.disabled = false;
        btn.classList.remove('is-loading');
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
    [['reg-fullname', 'err-fullname'],
    ['reg-phone', 'err-phone'], ['reg-father-phone', 'err-father-phone'],
    ['reg-recovery-phone', 'err-recovery-phone'], ['reg-school', 'err-school'],
    ['reg-grade', 'err-grade'], ['reg-track', 'err-track'],
    ['reg-gov', 'err-gov'], ['reg-gender', 'err-gender'],
    ['reg-password', 'err-password'], ['reg-password-confirm', 'err-password-confirm']
    ].forEach(([f, e]) => clearFieldError(f, e));
    clearFormAlert('reg-form-alert');
}
function clearAllLoginErrors() {
    [['login-phone', 'err-login-phone'], ['login-password', 'err-login-password']]
        .forEach(([f, e]) => clearFieldError(f, e));
    clearFormAlert('login-form-alert');
}
function showFormAlert(message, type, alertId) {
    const a = document.getElementById(alertId || 'reg-form-alert');
    if (!a) return;
    a.textContent = message;
    a.className = 'form-alert form-alert-' + (type || 'error');
    a.style.display = 'block';
    a.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function clearFormAlert(alertId) {
    const a = document.getElementById(alertId || 'reg-form-alert');
    if (a) { a.style.display = 'none'; a.textContent = ''; a.className = 'form-alert'; }
}
function addInlineErr(errId, message) {
    const fieldMap = {
        'err-fullname': 'reg-fullname', 'err-phone': 'reg-phone',
        'err-father-phone': 'reg-father-phone', 'err-recovery-phone': 'reg-recovery-phone',
        'err-school': 'reg-school', 'err-grade': 'reg-grade', 'err-track': 'reg-track',
        'err-gov': 'reg-gov', 'err-gender': 'reg-gender',
        'err-password': 'reg-password', 'err-password-confirm': 'reg-password-confirm',
        'err-login-phone': 'login-phone', 'err-login-password': 'login-password'
    };
    const e = document.getElementById(errId);
    if (e) { e.textContent = message; e.style.display = 'block'; }
    const inp = document.getElementById(fieldMap[errId]);
    if (inp) inp.classList.add('input-error');
}

// بيضيف timeout لأي Firestore promise عشان منعلقش لو النت بطيء أو الاتصال ضايع
function withTimeout(promise, ms, timeoutMessage) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(timeoutMessage || 'Timeout')), ms);
        promise.then(
            (val) => { clearTimeout(timer); resolve(val); },
            (err) => { clearTimeout(timer); reject(err); }
        );
    });
}

let isRegisterSubmitting = false;

// Submit Handler for Registration
async function handleRegisterSubmit(e) {
    e.preventDefault();

    // ── منع الضغطات المتكررة أثناء إرسال الطلب ──
    if (isRegisterSubmitting) return;
    isRegisterSubmitting = true;
    setButtonLoading('register-submit-btn', true);

    try {
        clearAllRegisterErrors();

        const dbReady = await ensureDb();
        if (!dbReady) {
            showFormAlert('❌ تعذّر الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت وحاول مرة أخرى.', 'error', 'reg-form-alert');
            return;
        }

        const fullName = (document.getElementById('reg-fullname')?.value || '').trim().replace(/\s+/g, ' ');

        const phone = (document.getElementById('reg-phone')?.value || '').trim();
        const fatherPhone = (document.getElementById('reg-father-phone')?.value || '').trim();
        const recoveryPhone = (document.getElementById('reg-recovery-phone')?.value || '').trim();

        const school = (document.getElementById('reg-school')?.value || '').trim();
        const grade = document.getElementById('reg-grade')?.value || '';
        const track = document.getElementById('reg-track')?.value || '';
        const gov = document.getElementById('reg-gov')?.value || '';
        const gender = document.getElementById('reg-gender')?.value || '';
        const password = (document.getElementById('reg-password')?.value || '').trim();
        const passwordConfirm = (document.getElementById('reg-password-confirm')?.value || '').trim();

        // ─── Inline Validations ────────────────────────────────────
        let firstErrorField = null;
        function markErr(fid, eid, msg) {
            addInlineErr(eid, msg);
            if (!firstErrorField) firstErrorField = fid;
        }

        // الاسم الثلاثي: لازم 3 كلمات على الأقل (الاسم الأول + الثاني + الثالث)
        const nameParts = fullName ? fullName.split(' ').filter(Boolean) : [];
        if (!fullName) {
            markErr('reg-fullname', 'err-fullname', '⚠️ الاسم الثلاثي مطلوب');
        } else if (nameParts.length < 3) {
            markErr('reg-fullname', 'err-fullname', '⚠️ من فضلك ادخل الاسم الثلاثي كاملاً (الاسم الأول والثاني والثالث)');
        }

        if (!EGYPT_PHONE_REGEX.test(phone)) {
            markErr('reg-phone', 'err-phone', '⚠️ رقم هاتف الطالب يجب أن يكون 11 رقماً ويبدأ بـ 010/011/012/015');
        }
        if (!EGYPT_PHONE_REGEX.test(fatherPhone)) {
            markErr('reg-father-phone', 'err-father-phone', '⚠️ رقم هاتف ولي الأمر يجب أن يكون 11 رقماً ويبدأ بـ 010/011/012/015');
        }
        if (!EGYPT_PHONE_REGEX.test(recoveryPhone)) {
            markErr('reg-recovery-phone', 'err-recovery-phone', '⚠️ رقم الاسترداد يجب أن يكون 11 رقماً ويبدأ بـ 010/011/012/015');
        }
        if (!school) {
            markErr('reg-school', 'err-school', '⚠️ اسم المدرسة مطلوب');
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
        if (!gov) {
            markErr('reg-gov', 'err-gov', '⚠️ برجاء اختيار المحافظة');
        }
        if (!gender) {
            markErr('reg-gender', 'err-gender', '⚠️ برجاء اختيار النوع');
        }
        if (password.length < 6) {
            markErr('reg-password', 'err-password', '⚠️ كلمة المرور يجب ألا تقل عن 6 خانات');
        } else if (!passwordConfirm) {
            markErr('reg-password-confirm', 'err-password-confirm', '⚠️ من فضلك أكّد كلمة المرور');
        } else if (password !== passwordConfirm) {
            markErr('reg-password-confirm', 'err-password-confirm', '❌ كلمة المرور وتأكيدها غير متطابقتين');
        }

        if (firstErrorField) {
            const el = document.getElementById(firstErrorField);
            if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            showFormAlert('⚠️ يوجد بعض الأخطاء في البيانات المدخلة، برجاء مراجعتها وتصحيحها أعلاه.', 'error', 'reg-form-alert');
            return;
        }

        // ─── Check duplicate phone ─────────────────────────────────
        let existing;
        try {
            existing = await withTimeout(findStudentByPhone(phone), 10000, 'duplicate-check-timeout');
        } catch (err) {
            console.error('Registration lookup failed:', err);
            showFormAlert('❌ حدث خطأ أثناء الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت وحاول مرة أخرى.', 'error', 'reg-form-alert');
            return;
        }

        if (existing) {
            addInlineErr('err-phone', '❌ هذا الرقم مسجل بالفعل — جاري تحويلك لصفحة تسجيل الدخول');
            document.getElementById('reg-phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showFormAlert('❌ هذا الرقم مسجل بالفعل. جاري تحويلك لصفحة تسجيل الدخول...', 'error', 'reg-form-alert');
            setTimeout(() => { navigateTo('#login'); }, 1500);
            return;
        }

        // ─── Build student document ────────────────────────────────
        const firstNameForGreeting = nameParts[0] || fullName;
        const newStudent = {
            name: fullName, fullName,
            phone, fatherPhone, recoveryPhone,
            school, grade, track: isSecondary ? track : null, gov, gender, password,
            studentType: 'outside', role: 'student', status: 'pending',
            enrolledCourses: [], qrCode: phone,
            joinDate: new Date().toLocaleDateString('ar-EG'),
            registeredAt: new Date().toISOString()
        };

        try {
            await withTimeout(
                window.db.collection(STUDENTS_COLLECTION).doc(phone).set(newStudent),
                12000,
                'save-timeout'
            );
        } catch (err) {
            console.error('Registration save failed:', err);
            showFormAlert('❌ حدث خطأ أثناء حفظ بياناتك. تأكد من اتصال الإنترنت وحاول مرة أخرى.', 'error', 'reg-form-alert');
            return;
        }

        // ─── Auto Login: تسجيل دخول المستخدم تلقائيًا فور إنشاء الحساب ──
        saveSession({ id: phone, ...newStudent });

        showFormAlert(`✅ تم إنشاء حسابك بنجاح يا ${firstNameForGreeting}! جاري تسجيل دخولك...`, 'success', 'reg-form-alert');

        // إعادة تحميل البيانات اللازمة (الكورسات، حالة الهيدر...) بعد الدخول التلقائي
        try {
            await loadHomeCourses();
        } catch (err) {
            console.warn('loadHomeCourses after auto-login failed:', err);
        }
        initAuthHeader();

        setTimeout(() => {
            document.getElementById('register-form')?.reset();
            handleGradeChange();
            // دخول مباشر إلى المنصة بدون المطالبة بتسجيل الدخول مرة أخرى
            navigateTo('#home');
        }, 1200);
    } catch (err) {
        // أي خطأ غير متوقع لم تتم معالجته فوق
        console.error('Unexpected register error:', err);
        showFormAlert('❌ حدث خطأ غير متوقع. برجاء المحاولة مرة أخرى.', 'error', 'reg-form-alert');
    } finally {
        isRegisterSubmitting = false;
        setButtonLoading('register-submit-btn', false);
    }
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

// ================= Banners Smooth Scroll Helper =================
function scrollToCourses(e) {
    e.preventDefault();
    const coursesSection = document.querySelector('.courses-section');
    if (coursesSection) {
        coursesSection.scrollIntoView({ behavior: 'smooth' });
    }
}
window.scrollToCourses = scrollToCourses;

// ================= AI Recommendation Popup =================
function initAiPopup() {
    const overlay = document.getElementById('ai-popup-overlay');
    const closeBtn = document.getElementById('ai-popup-close');
    const actionBtn = overlay?.querySelector('.ai-popup-btn');
    if (!overlay || !closeBtn) return;

    let popupInterval = null;

    const showPopup = () => {
        // Show only if the user is on home section and not already in search or forgot password overlays
        const activeSection = document.querySelector('.view-section.active');
        const searchActive = document.getElementById('search-overlay')?.classList.contains('active');
        const fpActive = document.getElementById('forgot-password-overlay')?.classList.contains('active');

        if (activeSection && activeSection.id === 'home-view' && !searchActive && !fpActive) {
            overlay.classList.add('active');
        }
    };

    const hidePopup = () => {
        overlay.classList.remove('active');
    };

    // Show after 5 seconds initially
    setTimeout(showPopup, 5000);

    // Close on X click
    closeBtn.addEventListener('click', hidePopup);

    // Close on action button click
    if (actionBtn) {
        actionBtn.addEventListener('click', hidePopup);
    }

    // Close on clicking outside the card
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hidePopup();
    });

    // Periodically show every 60 seconds (if not already active)
    popupInterval = setInterval(() => {
        if (!overlay.classList.contains('active')) {
            showPopup();
        }
    }, 60000);

    // Store interval ID in window in case we need to clear it
    window.aiPopupInterval = popupInterval;
}
