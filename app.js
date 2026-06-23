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
        // تحديث واجهة الزرار في الهيدر
        const htbIcon  = document.getElementById('htb-icon');
        const htbLabel = document.getElementById('htb-label');
        if (htbIcon)  htbIcon.innerHTML   = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        if (htbLabel) htbLabel.textContent = theme === 'dark' ? 'ليلي' : 'نهاري';
        // دعم القديم
        const oldLabel = document.getElementById('hb-theme-label');
        const oldIcon  = document.getElementById('hb-theme-icon');
        if (oldLabel) oldLabel.textContent = theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري';
        if (oldIcon)  oldIcon.innerHTML    = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
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
        alert('✅ أهلاً بك يا أدمن!');
        window.location.href = 'dashboard.html'; return;
    }

    try {
        // Firestore
        const snapshot = await window.db.collection('students')
            .where('phone', '==', phone).where('password', '==', pass).get();
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const user = { ...userDoc.data(), id: userDoc.id, role: 'student' };
            saveSession(user);
            alert('✅ أهلاً بيك يا ' + (user.name || user.firstName || 'طالب') + '! تم تسجيل الدخول.');
            document.getElementById('login-form') && document.getElementById('login-form').reset();
            window.location.hash = '#home'; initAuthHeader();
        } else {
            // localStorage fallback
            const users = JSON.parse(localStorage.getItem('alamin_users') || '[]');
            const user  = users.find(u => u.phone === phone && u.password === pass);
            if (user) {
                user.role = 'student';
                saveSession(user);
                alert('✅ أهلاً بيك يا ' + (user.firstName || 'طالب') + '! تم تسجيل الدخول.');
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

// Submit Handler for Registration
async function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!ensureDb()) return;

    const fname = document.getElementById('reg-fname').value.trim();
    const sname = document.getElementById('reg-sname').value.trim();
    const tname = document.getElementById('reg-tname').value.trim();
    const lname = document.getElementById('reg-lname').value.trim();

    const phone = document.getElementById('reg-phone').value.trim();
    const fatherPhone = document.getElementById('reg-father-phone').value.trim();
    const recoveryPhone = document.getElementById('reg-recovery-phone').value.trim();

    const school = document.getElementById('reg-school').value.trim();
    const grade = document.getElementById('reg-grade').value;
    const track = document.getElementById('reg-track').value;
    const gov = document.getElementById('reg-gov').value;
    const gender = document.getElementById('reg-gender').value;
    const password = document.getElementById('reg-password').value.trim();

    // Validations
    if (!EGYPT_PHONE_REGEX.test(phone)) {
        alert('برجاء إدخال رقم هاتف الطالب بشكل صحيح (11 رقماً)');
        return;
    }
    if (!EGYPT_PHONE_REGEX.test(fatherPhone)) {
        alert('برجاء إدخال رقم هاتف الأب بشكل صحيح (11 رقماً)');
        return;
    }
    if (!EGYPT_PHONE_REGEX.test(recoveryPhone)) {
        alert('برجاء إدخال رقم هاتف صحيح لاستعادة الحساب (11 رقماً)');
        return;
    }
    if (!grade) {
        alert('برجاء اختيار الصف الدراسي');
        return;
    }
    const isSecondary = typeof isSecondaryGrade === 'function'
        ? isSecondaryGrade(grade)
        : ['1', '2', '3'].includes(grade);
    if (isSecondary && !track) {
        alert('برجاء تحديد الشعبة: علمي ولا أدبي؟');
        return;
    }
    if (password.length < 6) {
        alert('يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام');
        return;
    }

    let existing;
    try {
        existing = await findStudentByPhone(phone);
    } catch (err) {
        console.error('Registration lookup failed:', err);
        alert('حدث خطأ أثناء الاتصال بقاعدة البيانات. حاول مرة أخرى.');
        return;
    }

    if (existing) {
        alert('هذا الرقم مسجل بالفعل. برجاء الانتقال لصفحة تسجيل الدخول.');
        window.location.hash = '#login';
        return;
    }

    // Build student document - متوافق مع الحقول اللي بيستخدمها الداشبورد
    const fullName = `${fname} ${sname} ${tname} ${lname}`.replace(/\s+/g, ' ').trim();
    const newStudent = {
        firstName: fname,
        secondName: sname,
        thirdName: tname,
        lastName: lname,
        name: fullName,
        fullName,
        phone,
        fatherPhone,
        recoveryPhone,
        school,
        grade,
        track: isSecondary ? track : null,
        gov,
        gender,
        password,
        studentType: 'outside', // طالب اتسجل من المنصة مباشرة (مش طالب سنتر)
        role: 'student',
        status: 'pending', // هيتفعّل بعد التواصل من فريق المنصة
        enrolledCourses: [],
        qrCode: phone,
        joinDate: new Date().toLocaleDateString('ar-EG'),
        registeredAt: new Date().toISOString()
    };

    try {
        await window.db.collection(STUDENTS_COLLECTION).doc(phone).set(newStudent);
    } catch (err) {
        console.error('Registration save failed:', err);
        alert('حدث خطأ أثناء حفظ بياناتك. حاول مرة أخرى.');
        return;
    }

    // Save active session
    saveSession({ id: phone, ...newStudent });

    alert(`تهانينا يا ${fname}! تم إنشاء حسابك بنجاح.\nسيتم التواصل معك لتفعيل الحساب.`);

    // Reset form and go home
    document.getElementById('register-form').reset();
    handleGradeChange();
    window.location.hash = '#home';
    initAuthHeader();
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
