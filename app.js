// Single Page Application (SPA) Controller - "منصة الدكتور في اللغة العربية"

document.addEventListener('DOMContentLoaded', () => {
    initIntroSplash();
    initTheme();
    initRouting();
    initSearch();
    initForms();
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

    // Apply saved theme on startup
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeCheckbox.checked = true;
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeCheckbox.checked = false;
    }

    // Toggle theme on change
    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
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

    searchToggle.addEventListener('click', () => {
        searchOverlay.classList.add('active');
        const input = searchOverlay.querySelector('input');
        if (input) setTimeout(() => input.focus(), 100);
    });

    searchClose.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
    });

    // Close when clicking outside modal content
    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
            searchOverlay.classList.remove('active');
        }
    });

    // Support escape key to close search
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            searchOverlay.classList.remove('active');
        }
    });
}

// ================= Authentication & Mock DB Integration =================
// Simple mockup storage in LocalStorage for testing
const MOCK_DB = {
    getStudents: () => JSON.parse(localStorage.getItem('students_db')) || [],
    saveStudent: (student) => {
        const db = MOCK_DB.getStudents();
        db.push(student);
        localStorage.setItem('students_db', JSON.stringify(db));
    }
};

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

// Submit Handler for Login
function handleLoginSubmit(e) {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const loginByCode = document.getElementById('login-by-code').checked;

    if (!EGYPT_PHONE_REGEX.test(phone)) {
        alert('برجاء إدخال رقم هاتف مصري صحيح مكون من 11 رقماً (مثال: 01012345678)');
        return;
    }

    const students = MOCK_DB.getStudents();
    const student = students.find(s => s.phone === phone);

    if (!student) {
        alert('هذا الحساب غير مسجل لدينا. برجاء إنشاء حساب جديد.');
        return;
    }

    if (loginByCode) {
        // If login by code is enabled, validate code login simulation
        alert(`تم إرسال كود تسجيل الدخول إلى الرقم ${phone}.\nتم تسجيل الدخول بنجاح لمحاكاة العرض!`);
    } else {
        // Normal password check
        if (student.password !== password) {
            alert('كلمة المرور غير صحيحة. برجاء إعادة المحاولة.');
            return;
        }
    }

    // Save session
    localStorage.setItem('current_student_session', JSON.stringify(student));
    alert(`أهلاً بك مجدداً، ${student.fname} ${student.lname} 🎉\nتم تسجيل دخولك بنجاح.`);
    
    // Reset form and go home
    document.getElementById('login-form').reset();
    window.location.hash = '#home';
}

// Submit Handler for Registration
function handleRegisterSubmit(e) {
    e.preventDefault();
    
    const fname = document.getElementById('reg-fname').value.trim();
    const sname = document.getElementById('reg-sname').value.trim();
    const tname = document.getElementById('reg-tname').value.trim();
    const lname = document.getElementById('reg-lname').value.trim();
    
    const phone = document.getElementById('reg-phone').value.trim();
    const fatherPhone = document.getElementById('reg-father-phone').value.trim();
    const motherPhone = document.getElementById('reg-mother-phone').value.trim();
    
    const school = document.getElementById('reg-school').value.trim();
    const parentJob = document.getElementById('reg-parent-job').value.trim();
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
    if (!EGYPT_PHONE_REGEX.test(motherPhone)) {
        alert('برجاء إدخال رقم هاتف الأم بشكل صحيح (11 رقماً)');
        return;
    }
    if (password.length < 6) {
        alert('يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام');
        return;
    }

    // Check if phone already registered
    const students = MOCK_DB.getStudents();
    const exists = students.some(s => s.phone === phone);
    if (exists) {
        alert('هذا الرقم مسجل بالفعل. برجاء الانتقال لصفحة تسجيل الدخول.');
        window.location.hash = '#login';
        return;
    }

    // Create student document
    const newStudent = {
        fname,
        sname,
        tname,
        lname,
        fullName: `${fname} ${sname} ${tname} ${lname}`,
        phone,
        fatherPhone,
        motherPhone,
        school,
        parentJob,
        gov,
        gender,
        password,
        registeredAt: new Date().toISOString()
    };

    // Save to Database
    MOCK_DB.saveStudent(newStudent);

    // Save active session
    localStorage.setItem('current_student_session', JSON.stringify(newStudent));

    alert(`تهانينا يا ${fname}! تم إنشاء حسابك بنجاح.\nسيتم التواصل معك لتفعيل الحساب.`);
    
    // Reset form and go home
    document.getElementById('register-form').reset();
    window.location.hash = '#home';
}
