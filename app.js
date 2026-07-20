/* =============================================
   ASKER ŞAFAK HARİTASI - UYGULAMA
   Kanun Maddelerine Uyumlu Hesaplama
   7179 Sayılı Askeralma Kanunu - Madde 27
   Takvim Bazlı Dinamik Gün Hesaplama
   ============================================= */

var currentProfile = null;
var geoData = null;
var currentModalCity = null;

document.addEventListener('DOMContentLoaded', function () {
    console.log("✅ app.js yüklendi");

    renderProfileList();

    document.getElementById('newProfileBtn').addEventListener('click', showCreateScreen);
    document.getElementById('cancelCreate').addEventListener('click', showProfileScreen);
    document.getElementById('createBtn').addEventListener('click', createProfile);

    document.getElementById('switchBtn').addEventListener('click', switchProfile);
    document.getElementById('resetBtn').addEventListener('click', deleteCurrentProfile);
    document.getElementById('mClose').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', function (e) {
        if (e.target.id === 'modal') closeModal();
    });
    document.getElementById('favBtn').addEventListener('click', toggleFavorite);

    document.getElementById('addCezaBtn').addEventListener('click', showCezaModal);
    document.getElementById('cezaClose').addEventListener('click', closeCezaModal);
    document.getElementById('cancelCeza').addEventListener('click', closeCezaModal);
    document.getElementById('saveCezaBtn').addEventListener('click', saveCeza);
    document.getElementById('cezaModal').addEventListener('click', function (e) {
        if (e.target.id === 'cezaModal') closeCezaModal();
    });

    document.getElementById('editIzinBtn').addEventListener('click', showIzinModal);
    document.getElementById('izinClose').addEventListener('click', closeIzinModal);
    document.getElementById('cancelIzin').addEventListener('click', closeIzinModal);
    document.getElementById('saveIzinBtn').addEventListener('click', saveIzin);
    document.getElementById('izinModal').addEventListener('click', function (e) {
        if (e.target.id === 'izinModal') closeIzinModal();
    });

    document.querySelectorAll('input[name="duration"]').forEach(function (r) {
        r.addEventListener('change', function () {
            toggleDurationGroups();
            updateIzinInfoText();
        });
    });

    document.querySelectorAll('input[name="saglikDurum"]').forEach(function (r) {
        r.addEventListener('change', function () {
            var detay = document.getElementById('saglikDetay');
            if (this.value === 'var') {
                detay.style.display = 'block';
            } else {
                detay.style.display = 'none';
                document.getElementById('saglikGun').value = '0';
                document.getElementById('saglikSayilan').value = '0';
            }
        });
    });

    var katilisInput = document.getElementById('katilisDate');
    if (katilisInput) {
        katilisInput.addEventListener('change', updateGecKatilisInfo);
    }

    document.querySelectorAll('input[name="yolAcemilik"]').forEach(function (r) {
        r.addEventListener('change', updateGecKatilisInfo);
    });

    document.getElementById('startDate').addEventListener('change', function () {
        updateIzinInfoText();
        updateGecKatilisInfo();
    });

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    document.getElementById('startDate').value = yyyy + '-' + mm + '-' + dd;

    toggleDurationGroups();
    updateIzinInfoText();

    var lastActive = localStorage.getItem('safak_active_profile');
    if (lastActive) {
        var profiles = getAllProfiles();
        var p = profiles.find(function (x) { return x.id === lastActive; });
        if (p) { loadProfile(p); }
    }
});

// ===== TAKVİM BAZLI SÜRE HESAPLAMA =====
function calculateRealDuration(startDateStr, months) {
    var start = new Date(startDateStr + 'T00:00:00');
    var end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return Math.round((end - start) / 86400000);
}

function calculateEndDate(startDateStr, months) {
    var start = new Date(startDateStr + 'T00:00:00');
    var end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return end;
}

// ===== İZİN HAKKI =====
function getTotalIzinHakki(months, tur) {
    if (months === 6) return 6;
    // Uzun dönem
    if (tur === 'tk') return 28;      // Takım Komutanı
    return 30;                         // Meslekçi (varsayılan)
}

function getMonths(profile) {
    if (profile.durationType) return profile.durationType;
    if (profile.duration === 180) return 6;
    if (profile.duration === 365) return 12;
    return 6;
}

// ===== FORM GRUPLARI =====
function toggleDurationGroups() {
    var checked = document.querySelector('input[name="duration"]:checked');
    if (!checked) return;
    var months = parseInt(checked.value);

    var mehilGroup = document.getElementById('mehilGroup');
    var dagitimGroup = document.getElementById('dagitimGroup');
    var yolAcemilikGroup = document.getElementById('yolAcemilikGroup');
    var yolTerhisGroup = document.getElementById('yolTerhisGroup');
    var turGroup = document.getElementById('turGroup');

    if (months === 12) {
        // UZUN DÖNEM: sadece tür ve acemilik yol
        if (turGroup) turGroup.style.display = '';
        if (mehilGroup) mehilGroup.style.display = 'none';
        if (dagitimGroup) dagitimGroup.style.display = 'none';
        if (yolAcemilikGroup) yolAcemilikGroup.style.display = '';
        if (yolTerhisGroup) yolTerhisGroup.style.display = 'none';
    } else {
        // KISA DÖNEM: tür yok, dağıtım+yol var
        if (turGroup) turGroup.style.display = 'none';
        if (mehilGroup) mehilGroup.style.display = 'none';
        if (dagitimGroup) dagitimGroup.style.display = '';
        if (yolAcemilikGroup) yolAcemilikGroup.style.display = '';
        if (yolTerhisGroup) yolTerhisGroup.style.display = '';
    }
}

function updateIzinInfoText() {
    var checked = document.querySelector('input[name="duration"]:checked');
    if (!checked) return;
    var months = parseInt(checked.value);
    var text = document.getElementById('izinInfoText');
    if (!text) return;

    var startDate = document.getElementById('startDate').value;
    var realDays = '';
    if (startDate) {
        var days = calculateRealDuration(startDate, months);
        realDays = ' (Seçilen tarihe göre: <b>' + days + ' gün</b>)';
    }

    if (months === 6) {
        text.innerHTML = '📖 <b>Madde 27:</b> 6 ay için ayda 1 gün = <b>Toplam 6 gün</b> izin hakkı. Dağıtım izni bu haktan düşülür.' + realDays;
    } else {
        text.innerHTML = '📖 Uzun dönemde izin hakkı görev türüne göre değişir. Meslekçi: <b>30 gün</b>, Takım Komutanı: <b>28 gün</b>. Kullanılmayan izinler şafaktan düşer.' + realDays;
    }
}

// ===== GEÇ KATILIŞ =====
function updateGecKatilisInfo() {
    var infoDiv = document.getElementById('gecKatilisInfo');
    if (!infoDiv) return;
    var sevkStr = document.getElementById('startDate').value;
    var katilisStr = document.getElementById('katilisDate').value;
    if (!sevkStr || !katilisStr) { infoDiv.style.display = 'none'; return; }
    var yolChecked = document.querySelector('input[name="yolAcemilik"]:checked');
    var yol = yolChecked ? parseInt(yolChecked.value) : 0;
    var sevk = new Date(sevkStr + 'T00:00:00');
    var katilis = new Date(katilisStr + 'T00:00:00');
    var beklenen = new Date(sevk);
    beklenen.setDate(beklenen.getDate() + yol);
    var gecGun = Math.max(0, Math.floor((katilis - beklenen) / 86400000));
    infoDiv.style.display = 'block';
    if (gecGun > 0) {
        infoDiv.className = 'gec-info gec-late';
        infoDiv.innerHTML = '⚠️ <b>' + gecGun + ' gün</b> geç katılış!<br>Beklenen: <b>' + formatDate(beklenen) + '</b><br>Katılış: <b>' + formatDate(katilis) + '</b>';
    } else {
        infoDiv.className = 'gec-info gec-ok';
        infoDiv.innerHTML = '✅ Zamanında katılış.';
    }
}

function calculateGecGun(profile) {
    if (!profile.katilisDate) return 0;
    var sevk = new Date(profile.startDate + 'T00:00:00');
    var katilis = new Date(profile.katilisDate + 'T00:00:00');
    var yol = profile.yolAcemilik || profile.yol || 0;
    var beklenen = new Date(sevk);
    beklenen.setDate(beklenen.getDate() + yol);
    return Math.max(0, Math.floor((katilis - beklenen) / 86400000));
}

// ===== PROFİL YÖNETİMİ =====
function getAllProfiles() {
    var raw = localStorage.getItem('safak_profiles');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
}
function saveAllProfiles(profiles) { localStorage.setItem('safak_profiles', JSON.stringify(profiles)); }
function saveCurrentProfile() {
    if (!currentProfile) return;
    var profiles = getAllProfiles();
    var idx = profiles.findIndex(function (p) { return p.id === currentProfile.id; });
    if (idx !== -1) { profiles[idx] = currentProfile; } else { profiles.push(currentProfile); }
    saveAllProfiles(profiles);
}

function renderProfileList() {
    var profiles = getAllProfiles();
    var list = document.getElementById('profileList');
    list.innerHTML = '';
    if (profiles.length === 0) {
        list.innerHTML = '<div class="no-profile">Henüz profil oluşturulmamış.<br>Aşağıdaki butondan başla!</div>';
        return;
    }
    profiles.forEach(function (p) {
        var info = calculateInfo(p);
        var initial = p.name.charAt(0).toUpperCase();
        var months = getMonths(p);
        var card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = '<div class="p-avatar">' + initial + '</div><div class="p-info"><div class="p-name">' + p.name + '</div><div class="p-details">' + (months === 12 ? 'Uzun Dönem' : 'Kısa Dönem') + ' · ' + formatDate(new Date(p.startDate)) + '</div></div><div class="p-remaining"><span class="num">' + info.remaining + '</span><span class="lbl">GÜN</span></div><button class="p-del" title="Sil">✕</button>';
        (function (profile) { card.addEventListener('click', function (e) { if (e.target.classList.contains('p-del')) return; loadProfile(profile); }); })(p);
        (function (profile) { card.querySelector('.p-del').addEventListener('click', function (e) { e.stopPropagation(); if (confirm(profile.name + ' silinsin mi?')) deleteProfile(profile.id); }); })(p);
        list.appendChild(card);
    });
}

function deleteProfile(id) {
    var profiles = getAllProfiles().filter(function (p) { return p.id !== id; });
    saveAllProfiles(profiles);
    if (currentProfile && currentProfile.id === id) { currentProfile = null; localStorage.removeItem('safak_active_profile'); }
    renderProfileList();
}
function deleteCurrentProfile() {
    if (!currentProfile) return;
    if (!confirm(currentProfile.name + ' silinsin mi?')) return;
    deleteProfile(currentProfile.id);
    showProfileScreen();
}

// ===== EKRANLAR =====
function showProfileScreen() {
    document.getElementById('profileScreen').classList.add('active');
    document.getElementById('createScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.remove('active');
    currentProfile = null;
    localStorage.removeItem('safak_active_profile');
    renderProfileList();
}
function showCreateScreen() {
    document.getElementById('profileScreen').classList.remove('active');
    document.getElementById('createScreen').classList.add('active');
    document.getElementById('mainScreen').classList.remove('active');
    document.getElementById('fullName').value = '';
    var el;
    el = document.getElementById('usedIzin'); if (el) el.value = '0';
    el = document.getElementById('mazeretIzin'); if (el) el.value = '0';
    el = document.getElementById('saglikGun'); if (el) el.value = '0';
    el = document.getElementById('saglikSayilan'); if (el) el.value = '0';
    el = document.getElementById('saglikDetay'); if (el) el.style.display = 'none';
    el = document.querySelector('input[name="saglikDurum"][value="yok"]'); if (el) el.checked = true;
    el = document.getElementById('katilisDate'); if (el) el.value = '';
    el = document.getElementById('gecKatilisInfo'); if (el) el.style.display = 'none';
    toggleDurationGroups();
    updateIzinInfoText();
}
function showMainScreen() {
    document.getElementById('profileScreen').classList.remove('active');
    document.getElementById('createScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
    loadMap();
    update();
}
function switchProfile() { showProfileScreen(); }

// ===== PROFİL OLUŞTUR =====
function createProfile() {
    var name = document.getElementById('fullName').value.trim();
    var startDateVal = document.getElementById('startDate').value;
    var months = parseInt(document.querySelector('input[name="duration"]:checked').value);
    var usedIzin = parseInt(document.getElementById('usedIzin').value) || 0;
    var mazeretIzin = parseInt(document.getElementById('mazeretIzin').value) || 0;
    var yolAcemilik = parseInt(document.querySelector('input[name="yolAcemilik"]:checked').value);
    var yolTerhis = parseInt(document.querySelector('input[name="yolTerhis"]:checked').value);
    var dagitimGun = parseInt(document.querySelector('input[name="dagitim"]:checked').value);
    var mehil = 0;
    var tur = 'meslekci';
    if (months === 12) {
        var turChecked = document.querySelector('input[name="tur"]:checked');
        tur = turChecked ? turChecked.value : 'meslekci';
    }
    if (months === 12) { var mc = document.querySelector('input[name="mehil"]:checked'); mehil = mc ? parseInt(mc.value) : 1; }
    var saglikDurum = document.querySelector('input[name="saglikDurum"]:checked').value;
    var saglikGun = 0, saglikSayilan = 0;
    if (saglikDurum === 'var') { saglikGun = parseInt(document.getElementById('saglikGun').value) || 0; saglikSayilan = parseInt(document.getElementById('saglikSayilan').value) || 0; }
    var katilisDate = document.getElementById('katilisDate').value || null;

    if (!name) { alert('Lütfen ad soyad girin!'); return; }
    if (!startDateVal) { alert('Lütfen sevk tarihi seçin!'); return; }
    var totalIzinHakki = getTotalIzinHakki(months, tur);
    if (dagitimGun + usedIzin > totalIzinHakki) { alert('Toplam izin hakkı (' + totalIzinHakki + ') aşılamaz!'); return; }
    if (usedIzin < 0) usedIzin = 0;
    if (mazeretIzin < 0) mazeretIzin = 0;
    if (saglikSayilan > saglikGun) { alert('Hizmetten sayılan süre rapor süresinden fazla olamaz!'); return; }

    var profile = {
        id: 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: name,
        startDate: startDateVal,
        durationType: months,
        duration: calculateRealDuration(startDateVal, months),
        tur: tur,                    // ← YENİ
        dagitimGun: dagitimGun,
        yolAcemilik: yolAcemilik,
        yolTerhis: yolTerhis,
        mehil: mehil,
        usedIzin: usedIzin,
        mazeretIzin: mazeretIzin,
        saglikGun: saglikGun,
        saglikSayilan: saglikSayilan,
        katilisDate: katilisDate,
        cezalar: [],
        favorites: []
    };
    var profiles = getAllProfiles();
    profiles.push(profile);
    saveAllProfiles(profiles);
    loadProfile(profile);
}

function loadProfile(profile) {
    if (typeof profile.usedIzin === 'undefined') profile.usedIzin = 0;
    if (typeof profile.dagitimGun === 'undefined') { profile.dagitimGun = (profile.dagitim === 1 || profile.dagitim === 3) ? 3 : 0; }
    if (typeof profile.yolAcemilik === 'undefined') profile.yolAcemilik = profile.yol || 1;
    if (typeof profile.yolTerhis === 'undefined') profile.yolTerhis = profile.yol || 1;
    if (typeof profile.mazeretIzin === 'undefined') profile.mazeretIzin = 0;
    if (typeof profile.saglikGun === 'undefined') profile.saglikGun = 0;
    if (typeof profile.saglikSayilan === 'undefined') profile.saglikSayilan = 0;
    if (typeof profile.mehil === 'undefined') profile.mehil = 1;
    if (typeof profile.katilisDate === 'undefined') profile.katilisDate = null;
    if (typeof profile.tur === 'undefined') profile.tur = 'meslekci';
    if (!profile.cezalar) profile.cezalar = [];
    if (!profile.favorites) profile.favorites = [];
    if (!profile.durationType) {
        profile.durationType = (profile.duration === 365) ? 12 : 6;
        profile.duration = calculateRealDuration(profile.startDate, profile.durationType);
    }
    currentProfile = profile;
    localStorage.setItem('safak_active_profile', profile.id);
    var months = getMonths(profile);
    document.getElementById('userNameHeader').textContent = '🎖️ ' + profile.name.toUpperCase();
    document.getElementById('userDurationHeader').textContent = (months === 12 ? 'UZUN DÖNEM (12 AY)' : 'KISA DÖNEM (6 AY)') + ' · ' + profile.duration + ' GÜN';
    document.getElementById('totalDaysLabel').textContent = profile.duration;
    showMainScreen();
}

// ===== HESAPLAMALAR =====
function calculateInfo(profile) {
    if (typeof profile.usedIzin === 'undefined') profile.usedIzin = 0;
    if (typeof profile.dagitimGun === 'undefined') { profile.dagitimGun = (profile.dagitim === 1 || profile.dagitim === 3) ? 3 : 0; }
    if (typeof profile.yolAcemilik === 'undefined') profile.yolAcemilik = profile.yol || 1;
    if (typeof profile.yolTerhis === 'undefined') profile.yolTerhis = profile.yol || 1;
    if (typeof profile.mazeretIzin === 'undefined') profile.mazeretIzin = 0;
    if (typeof profile.saglikGun === 'undefined') profile.saglikGun = 0;
    if (typeof profile.saglikSayilan === 'undefined') profile.saglikSayilan = 0;
    if (typeof profile.mehil === 'undefined') profile.mehil = 1;
    if (typeof profile.katilisDate === 'undefined') profile.katilisDate = null;
    if (!profile.cezalar) profile.cezalar = [];

    var months = getMonths(profile);
    var startDate = new Date(profile.startDate + 'T00:00:00');
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var baseDuration = calculateRealDuration(profile.startDate, months);
    var totalCeza = (months === 12) ? 0 : profile.cezalar.reduce(function (s, c) { return s + c.gun; }, 0);
    var tur = profile.tur || 'meslekci';
    var totalIzinHakki = getTotalIzinHakki(months, tur);
    var usedIzin = profile.usedIzin || 0;

    var dagitimGun = (months === 12) ? 0 : (profile.dagitimGun || 0);

    var toplamKullanilan = Math.min(dagitimGun + usedIzin, totalIzinHakki);
    var unusedIzin = Math.max(0, totalIzinHakki - toplamKullanilan);
    var yolAcemilik = profile.yolAcemilik || profile.yol || 0;
    var yolTerhis = (months === 12) ? 0 : (profile.yolTerhis || profile.yol || 0);
    var yolIndirim = yolTerhis;
    var mehilAktif = false; 
    var saglikEklenen = Math.max(0, (profile.saglikGun || 0) - (profile.saglikSayilan || 0));
    var gecGun = calculateGecGun(profile);
    var totalIndirim = unusedIzin + yolIndirim;
    var totalEklenen = totalCeza + saglikEklenen + gecGun;
    var effectiveTotal = Math.max(1, baseDuration - totalIndirim + totalEklenen);
    var end = new Date(startDate); end.setDate(end.getDate() + effectiveTotal);
    var elapsed = Math.floor((now - startDate) / 86400000);
    var remaining = Math.max(0, effectiveTotal - elapsed);
    var completed = Math.min(Math.max(elapsed, 0), effectiveTotal);
    var pct = Math.min(100, Math.round((completed / effectiveTotal) * 100));
    var waitDays = Math.max(0, effectiveTotal - 81);
    var plateStartDate = new Date(startDate); plateStartDate.setDate(plateStartDate.getDate() + waitDays);
    var currentPlate = 81 - Math.max(0, elapsed - waitDays);
    return {
        startDate: startDate, now: now, end: end, plateStartDate: plateStartDate,
        elapsed: elapsed, remaining: remaining, completed: completed, pct: pct,
        baseDuration: baseDuration, effectiveTotal: effectiveTotal, waitDays: waitDays, currentPlate: currentPlate,
        inPlatePhase: elapsed >= waitDays && remaining > 0, inWaitPhase: elapsed >= 0 && elapsed < waitDays,
        notStarted: elapsed < 0, finished: remaining <= 0, months: months,tur: tur,
        totalIzinHakki: totalIzinHakki, dagitimGun: dagitimGun, usedIzin: usedIzin,
        toplamKullanilan: toplamKullanilan, unusedIzin: unusedIzin,
        yolAcemilik: yolAcemilik, yolTerhis: yolTerhis, yolIndirim: yolIndirim, mehilAktif: mehilAktif,
        saglikGun: profile.saglikGun || 0, saglikSayilan: profile.saglikSayilan || 0, saglikEklenen: saglikEklenen,
        mazeretIzin: profile.mazeretIzin || 0, gecGun: gecGun, totalCeza: totalCeza,
        totalIndirim: totalIndirim, totalEklenen: totalEklenen
    };
}

function getInfo() { return calculateInfo(currentProfile); }

// ===== GÜNCELLEME =====
function update() {
    if (!currentProfile) return;
    var I = getInfo();
    var atarsa = Math.max(0, I.remaining - 1);
    document.getElementById('atarsaDays').textContent = I.remaining > 0 ? atarsa : '🏠';
    document.getElementById('remDays').textContent = I.remaining;
    if (I.inPlatePhase && I.currentPlate > 0) { document.getElementById('plateDays').textContent = I.currentPlate; }
    else if (I.finished) { document.getElementById('plateDays').textContent = '🏠'; }
    else if (I.inWaitPhase) { document.getElementById('plateDays').textContent = (I.waitDays - I.elapsed) + ' →'; }
    else { document.getElementById('plateDays').textContent = '–'; }
    document.getElementById('progFill').style.width = I.pct + '%';
    document.getElementById('compDays').textContent = I.completed;
    document.getElementById('totalDaysLabel').textContent = I.baseDuration;
    document.getElementById('pctDone').textContent = I.pct;
    document.getElementById('dStart').textContent = formatDate(I.startDate);
    document.getElementById('dToday').textContent = formatDate(I.now);
    document.getElementById('dPlateStart').textContent = formatDate(I.plateStartDate);
    document.getElementById('dEnd').textContent = formatDate(I.end);
    var p1 = document.getElementById('phase1'), p2 = document.getElementById('phase2');
    p1.style.flex = I.waitDays; p2.style.flex = 81;
    document.getElementById('phase1Label').textContent = '📅 Bekleme (' + I.effectiveTotal + '→82)';
    p1.classList.toggle('active-phase', I.inWaitPhase);
    p2.classList.toggle('active-phase', I.inPlatePhase);

    // İzin hakkı (her zaman göster)
    document.getElementById('extraIzinHakki').textContent = I.totalIzinHakki + ' gün';

    // Dağıtım izni (sadece kısa dönem)
    var dagitimBox = document.getElementById('dagitimBox');
    if (I.months === 12) {
        dagitimBox.style.display = 'none';
    } else {
        dagitimBox.style.display = '';
        document.getElementById('extraDagitim').textContent = I.dagitimGun > 0 ? I.dagitimGun + ' gün' : 'Yok';
    }

    // Normal izin
    document.getElementById('extraNormalIzin').textContent = I.usedIzin + '/' + Math.max(0, I.totalIzinHakki - I.dagitimGun) + ' gün';

    // Kullanılmayan izin
    document.getElementById('extraUnusedIzin').textContent = I.unusedIzin > 0 ? '-' + I.unusedIzin + ' gün ✂️' : '0 gün ✓';

    // Yol izinleri
    var yolAcemilikBox = document.getElementById('yolAcemilikBox');
    var yolTerhisBox = document.getElementById('yolTerhisBox');
    var mehilBox = document.getElementById('mehilBox');
    mehilBox.style.display = 'none';
    document.getElementById('extraYolAcemilik').textContent = I.yolAcemilik + ' gün';

    if (I.months === 12) {
        // Uzun dönem: sadece acemilik yol
        yolAcemilikBox.style.display = '';
        yolTerhisBox.style.display = 'none';
    } else {
        // Kısa dönem: ikisi de var
        yolAcemilikBox.style.display = '';
        yolTerhisBox.style.display = '';
        document.getElementById('extraYolTerhis').textContent = '-' + I.yolTerhis + ' gün ✂️';
    }

    // Mazeret izni
    var mazeretBox = document.getElementById('mazeretBox');
    if (I.mazeretIzin > 0) { mazeretBox.style.display = ''; document.getElementById('extraMazeret').textContent = I.mazeretIzin + ' gün (bilgi)'; }
    else { mazeretBox.style.display = 'none'; }

    // Sağlık raporu
    var saglikBox = document.getElementById('saglikBox');
    if (I.saglikGun > 0) {
        saglikBox.style.display = '';
        if (I.saglikEklenen > 0) { document.getElementById('extraSaglik').textContent = '+' + I.saglikEklenen + ' gün eklendi'; saglikBox.classList.remove('info-box'); saglikBox.classList.add('negative'); }
        else { document.getElementById('extraSaglik').textContent = I.saglikGun + ' gün (hizmetten)'; saglikBox.classList.remove('negative'); saglikBox.classList.add('info-box'); }
    } else { saglikBox.style.display = 'none'; }

    // Geç katılış
    var gecBox = document.getElementById('gecBox');
    if (I.gecGun > 0) { gecBox.style.display = ''; document.getElementById('extraGec').textContent = '+' + I.gecGun + ' gün'; }
    else { gecBox.style.display = 'none'; }

    // Ceza (sadece kısa dönem)
    var cezaBox = document.getElementById('cezaBoxWrapper');
    if (I.months === 12) {
        cezaBox.style.display = 'none';
    } else {
        cezaBox.style.display = '';
        document.getElementById('extraCeza').textContent = '+' + I.totalCeza + ' gün';
        cezaBox.classList.toggle('has-ceza', I.totalCeza > 0);
    }

    // Özet satırı
    var sp = [];
    var turStr = '';
    if (I.months === 12) {
        turStr = ' - ' + (I.tur === 'tk' ? 'T.K.' : 'Meslekçi');
    }
    sp.push('Askerlik: <b>' + I.baseDuration + '</b> gün (' + I.months + ' ay' + turStr + ')');

    if (I.totalCeza > 0) sp.push('<span class="neg">+ ' + I.totalCeza + ' ceza</span>');
    if (I.saglikEklenen > 0) sp.push('<span class="neg">+ ' + I.saglikEklenen + ' sağlık</span>');
    if (I.gecGun > 0) sp.push('<span class="neg">+ ' + I.gecGun + ' geç katılış</span>');
    if (I.unusedIzin > 0) sp.push('<span class="plus">− ' + I.unusedIzin + ' izin</span>');
    if (I.yolIndirim > 0) sp.push('<span class="plus">− ' + I.yolTerhis + ' terhis yol</span>');
    sp.push('= <b>' + I.effectiveTotal + ' gün</b> efektif');
    var st = sp.join(' ');
    if (I.dagitimGun > 0) st += '<br><small style="color:#fcd34d">🎫 Dağıtım ' + I.dagitimGun + ' gün (izinden düşüldü)</small>';
    if (I.mazeretIzin > 0) st += '<br><small style="color:#a78bfa">🏥 Mazeret ' + I.mazeretIzin + ' gün</small>';
    if (I.gecGun > 0) st += '<br><small style="color:#fca5a5">⏰ Geç katılış ' + I.gecGun + ' gün</small>';
    document.getElementById('extrasSummary').innerHTML = st;

    // Ceza geçmişi başlığı ve listesi (sadece kısa dönem)
    var cezaTitles = document.querySelectorAll('.hist-title');
    var cezaList = document.getElementById('cezaList');
    cezaTitles.forEach(function (t) {
        if (t.textContent.indexOf('CEZA') !== -1) {
            t.style.display = (I.months === 12) ? 'none' : '';
        }
    });
    if (cezaList) cezaList.style.display = (I.months === 12) ? 'none' : '';

    updateTodayCard(I); updateMapColors(I); renderHistory(I); renderFavorites(); updateMapFavorites(); renderCezalar();
}

function updateTodayCard(I) {
    var tc = document.getElementById('todayCard');
    if (I.finished) { tc.className = 'today gold'; tc.innerHTML = '<div class="celeb"><div style="font-size:3.5rem">🎉🎖️🏠</div><h1>TERHİS OLDUN!</h1><p>Hoş geldin sivil hayat! 🇹🇷</p></div>'; }
    else if (I.notStarted) { tc.className = 'today gray'; tc.innerHTML = '<div class="today-hdr"><span>⏰ HENÜZ BAŞLAMADI</span></div><div class="today-body"><div class="big-num" style="color:#94a3b8">' + Math.abs(I.elapsed) + '</div><div class="big-label" style="color:#64748b">GÜN SONRA</div></div>'; }
    else if (I.inWaitPhase) { tc.className = 'today amber'; tc.innerHTML = '<div class="today-hdr"><span style="color:#fcd34d">📅 BEKLEME</span></div><div class="today-body"><div class="big-num">' + I.remaining + '</div><div class="big-label">GÜN KALDI</div><div class="big-sub">İl sayacına <b>' + (I.waitDays - I.elapsed) + '</b> gün · ' + (I.elapsed + 1) + '. gün</div></div>'; }
    else if (I.inPlatePhase && I.currentPlate > 0) {
        var city = findCity(I.currentPlate);
        if (city) { tc.className = 'today green'; tc.innerHTML = '<div class="today-hdr"><span style="color:#86efac">🗺️ BUGÜNÜN İLİ</span></div><div class="today-body"><div class="plate">' + city.p + '</div><div class="cname" style="color:#bbf7d0">' + city.n + '</div><div class="cquote" style="color:#86efac">"' + city.q + '"</div><div style="margin-top:12px;font-size:.8rem;color:#4ade80">Terhise <b>' + I.remaining + '</b> gün · ' + (I.elapsed + 1) + '. gün</div></div>'; }
    }
}

function findCity(plateNum) {
    for (var i = 0; i < CITIES.length; i++) { if (parseInt(CITIES[i].p) === plateNum) return CITIES[i]; }
    return null;
}

// ===== CEZA =====
function showCezaModal() { document.getElementById('cezaGun').value = '1'; document.getElementById('cezaSebep').value = ''; document.getElementById('cezaModal').classList.add('active'); }
function closeCezaModal() { document.getElementById('cezaModal').classList.remove('active'); }
function saveCeza() {
    var gun = parseInt(document.getElementById('cezaGun').value);
    var sebep = document.getElementById('cezaSebep').value.trim();
    var tur = document.querySelector('input[name="cezaTur"]:checked').value;
    if (isNaN(gun) || gun < 1) { alert('Ceza en az 1 gün!'); return; }
    var turLabel = tur === 'oda' ? 'Oda hapsi' : tur === 'gozetim' ? 'Gözetim altında' : 'Diğer';
    currentProfile.cezalar.push({ gun: gun, tur: turLabel, sebep: sebep || 'Belirtilmedi', tarih: new Date().toISOString() });
    saveCurrentProfile(); closeCezaModal(); update();
}
function deleteCeza(index) { if (!confirm('Ceza silinsin mi?')) return; currentProfile.cezalar.splice(index, 1); saveCurrentProfile(); update(); }
function renderCezalar() {
    var list = document.getElementById('cezaList'); list.innerHTML = '';
    if (!currentProfile.cezalar || currentProfile.cezalar.length === 0) { list.innerHTML = '<p class="empty-msg">Henüz ceza yok 🙏</p>'; return; }
    currentProfile.cezalar.slice().reverse().forEach(function (ceza, revIdx) {
        var realIdx = currentProfile.cezalar.length - 1 - revIdx;
        var item = document.createElement('div'); item.className = 'ceza-item';
        item.innerHTML = '<div class="ci-icon">⚠️</div><div class="ci-info"><div class="ci-days">' + ceza.gun + ' GÜN — ' + (ceza.tur || '') + '</div><div class="ci-reason">' + ceza.sebep + '</div><div class="ci-date">' + formatDate(new Date(ceza.tarih)) + '</div></div><button class="ci-del">✕</button>';
        (function (idx) { item.querySelector('.ci-del').addEventListener('click', function () { deleteCeza(idx); }); })(realIdx);
        list.appendChild(item);
    });
}

// ===== İZİN GÜNCELLEME =====
function showIzinModal() {
    if (!currentProfile) return;

    var months = getMonths(currentProfile);
    var tur = currentProfile.tur || 'meslekci';
    var totalHakki = getTotalIzinHakki(months, tur);
    var dagitimGun = (months === 12) ? 0 : (currentProfile.dagitimGun || 0);
    var kalanHak = Math.max(0, totalHakki - dagitimGun);

    var infoText = 'Toplam: <b>' + totalHakki + '</b>';
    if (months === 12) {
        infoText += ' (' + (tur === 'tk' ? 'T.K.' : 'Meslekçi') + ')';
    } else {
        infoText += ' · Dağıtım: <b>' + dagitimGun + '</b>';
    }
    infoText += ' · Kalan: <b>' + kalanHak + '</b>';

    document.getElementById('izinInfoLabel').innerHTML = infoText;
    var input = document.getElementById('editUsedIzin'); input.value = currentProfile.usedIzin || 0; input.max = kalanHak;
    updateIzinPreview(); input.oninput = updateIzinPreview;
    document.getElementById('izinModal').classList.add('active');
}
function closeIzinModal() { document.getElementById('izinModal').classList.remove('active'); }
function updateIzinPreview() {
    var val = parseInt(document.getElementById('editUsedIzin').value) || 0;
    var months = getMonths(currentProfile);
    var tur = currentProfile.tur || 'meslekci';
    var totalHakki = getTotalIzinHakki(months, tur);
    var dagitimGun = (months === 12) ? 0 : (currentProfile.dagitimGun || 0);
    var kullanilmayan = Math.max(0, totalHakki - dagitimGun - val);

    var html = '<div class="prev-row"><span>Toplam Hak:</span><span class="val">' + totalHakki + '</span></div>';

    if (months === 12) {
        // Uzun dönem: tür bilgisi göster, dağıtım gösterme
        html += '<div class="prev-row"><span>Görev:</span><span class="val">' + (tur === 'tk' ? 'T.K.' : 'Meslekçi') + '</span></div>';
    } else {
        // Kısa dönem: dağıtım göster
        html += '<div class="prev-row"><span>Dağıtım:</span><span class="val">' + dagitimGun + '</span></div>';
    }

    html += '<div class="prev-row"><span>Normal İzin:</span><span class="val">' + val + '</span></div>';
    html += '<div class="prev-row"><span>Kullanılmayan:</span><span class="val neg">-' + kullanilmayan + '</span></div>';

    document.getElementById('izinPreview').innerHTML = html;
}
function saveIzin() {
    var val = parseInt(document.getElementById('editUsedIzin').value) || 0;
    var months = getMonths(currentProfile);
    var tur = currentProfile.tur || 'meslekci';
    var dagitimGun = (months === 12) ? 0 : (currentProfile.dagitimGun || 0);
    var kalanHak = Math.max(0, getTotalIzinHakki(months, tur) - dagitimGun);
    if (val < 0 || val > kalanHak) { alert('Geçersiz değer!'); return; }
    currentProfile.usedIzin = val; saveCurrentProfile(); closeIzinModal(); update();
}

// ===== FAVORİLER =====
function toggleFavorite() {
    if (!currentModalCity || !currentProfile) return;
    var plateNum = currentModalCity.plate;
    if (!currentProfile.favorites) currentProfile.favorites = [];
    var idx = currentProfile.favorites.indexOf(plateNum);
    if (idx === -1) { currentProfile.favorites.push(plateNum); } else { currentProfile.favorites.splice(idx, 1); }
    saveCurrentProfile(); updateFavButton(plateNum); renderFavorites(); updateMapColors(getInfo()); updateMapFavorites();
}
function updateFavButton(plateNum) {
    var btn = document.getElementById('favBtn'), icon = document.getElementById('favIcon');
    var isFav = currentProfile.favorites && currentProfile.favorites.indexOf(plateNum) !== -1;
    btn.classList.toggle('active', isFav); icon.textContent = isFav ? '★' : '☆';
}
function renderFavorites() {
    var list = document.getElementById('favList'), count = document.getElementById('favCount');
    var favs = currentProfile.favorites || []; count.textContent = favs.length;
    if (favs.length === 0) { list.innerHTML = '<p class="empty-msg">Henüz favori il yok.</p>'; return; }
    list.innerHTML = '';
    favs.slice().sort(function (a, b) { return a - b; }).forEach(function (plateNum) {
        var city = findCity(plateNum); if (!city) return;
        var item = document.createElement('div'); item.className = 'fav-item';
        item.innerHTML = '<button class="fx">✕</button><div class="fp">' + city.p + '</div><div class="fn">' + city.n + '</div><div class="fq">"' + city.q + '"</div>';
        (function (c, p) { item.addEventListener('click', function (e) { if (e.target.classList.contains('fx')) return; var I = getInfo(); openModal(c, p, I.waitDays + (81 - p) + 1, I); }); })(city, plateNum);
        (function (p) { item.querySelector('.fx').addEventListener('click', function (e) { e.stopPropagation(); var idx = currentProfile.favorites.indexOf(p); if (idx !== -1) { currentProfile.favorites.splice(idx, 1);
        saveCurrentProfile(); renderFavorites(); updateMapColors(getInfo()); updateMapFavorites(); } }); })(plateNum);
        list.appendChild(item);
    });
}
function updateMapFavorites() {
    document.querySelectorAll('#mapSvg .fav-star').forEach(function (s) { s.remove(); });
    var svg = document.getElementById('mapSvg'); if (!svg || !currentProfile.favorites) return;
    currentProfile.favorites.forEach(function (plateNum) {
        var path = svg.querySelector('path[data-plate="' + plateNum.toString().padStart(2, '0') + '"]'); if (!path) return;
        var bbox = path.getBBox();
        var star = document.createElementNS("http://www.w3.org/2000/svg", "text");
        star.setAttribute("x", bbox.x + bbox.width / 2); star.setAttribute("y", bbox.y - 3);
        star.setAttribute("text-anchor", "middle"); star.setAttribute("font-size", "11"); star.setAttribute("class", "fav-star");
        star.textContent = "★"; svg.appendChild(star);
    });
}

// ===== HARİTA =====
function loadMap() {
    if (geoData) { buildMap(); updateMapColors(getInfo()); return; }
    fetch('turkey.json').then(function (r) { if (!r.ok) throw new Error('!'); return r.json(); }).then(function (data) { geoData = data; buildMap(); updateMapColors(getInfo()); })
    .catch(function () { document.getElementById('mapWrap').innerHTML = '<div class="map-error"><h3>⚠️ Harita yüklenemedi</h3></div>'; });
}
function buildMap() {
    var features = geoData.features || geoData;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    features.forEach(function (f) { getCoords(f.geometry).forEach(function (p) { p.forEach(function (pt) { if (pt[0] < minX) minX = pt[0]; if (pt[0] > maxX) maxX = pt[0]; if (pt[1] < minY) minY = pt[1]; if (pt[1] > maxY) maxY = pt[1]; }); }); });
    var W = 1000, H = 450, sc = Math.min(W / (maxX - minX), H / (maxY - minY));
    function px(lon) { return (lon - minX) * sc; } function py(lat) { return H - (lat - minY) * sc; }
    var svg = '<svg id="mapSvg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">', labels = [];
    features.forEach(function (f) {
        var name = (f.properties.name || f.properties.NAME_1 || f.properties.name_tr || f.properties.NAME || '').toLowerCase().trim().replace(/i̇/g, 'i');
        var plate = CITY_NAME_TO_PLATE[name]; if (!plate) return;
        var coords = getCoords(f.geometry), d = '', cx = 0, cy = 0, cnt = 0;
        coords.forEach(function (poly) { var first = true; poly.forEach(function (pt) { var x = px(pt[0]), y = py(pt[1]); d += (first ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' '; first = false; cx += x; cy += y; cnt++; }); d += 'Z '; });
        cx /= cnt; cy /= cnt;
        svg += '<path data-plate="' + plate + '" d="' + d + '" class="remaining"/>';
        labels.push({ plate: plate, x: cx, y: cy });
    });
    labels.forEach(function (l) { svg += '<text x="' + l.x.toFixed(1) + '" y="' + l.y.toFixed(1) + '" text-anchor="middle" dominant-baseline="middle" font-family="Bebas Neue" font-size="9" fill="rgba(255,255,255,0.9)" pointer-events="none">' + l.plate + '</text>'; });
    svg += '</svg>';
    document.getElementById('mapWrap').innerHTML = svg;
    attachMapEvents(); updateMapFavorites();
}
function getCoords(g) {
    if (!g) return [];
    if (g.type === 'Polygon') return g.coordinates;
    if (g.type === 'MultiPolygon') { var r = []; g.coordinates.forEach(function (p) { p.forEach(function (ring) { r.push(ring); }); }); return r; }
    return [];
}
function attachMapEvents() {
    var tooltip = document.getElementById('tooltip');
    document.querySelectorAll('#mapSvg path').forEach(function (path) {
        path.addEventListener('mouseenter', function () {
            var city = findCity(parseInt(path.getAttribute('data-plate'))); if (!city) return;
            var I = getInfo(), pn = parseInt(path.getAttribute('data-plate'));
            document.getElementById('ttPlate').textContent = city.p;
            document.getElementById('ttName').textContent = city.n;
            document.getElementById('ttQuote').textContent = '"' + city.q + '"';
            var st = I.finished ? '✅' : !I.inPlatePhase ? '⏳' : pn > I.currentPlate ? '✅' : pn === I.currentPlate ? '📍' : '⏳';
            document.getElementById('ttStatus').textContent = (I.waitDays + (81 - pn) + 1) + '. gün · ' + st;
            tooltip.style.display = 'block';
        });
        path.addEventListener('mousemove', function (e) { tooltip.style.left = Math.min(e.clientX + 15, window.innerWidth - 290) + 'px'; tooltip.style.top = (e.clientY - 10) + 'px'; });
        path.addEventListener('mouseleave', function () { tooltip.style.display = 'none'; });
        path.addEventListener('click', function (e) {
            e.stopPropagation(); tooltip.style.display = 'none';
            var city = findCity(parseInt(path.getAttribute('data-plate'))); if (!city) return;
            var I = getInfo(), pn = parseInt(path.getAttribute('data-plate'));
            openModal(city, pn, I.waitDays + (81 - pn) + 1, I);
        });
    });
}
function updateMapColors(I) {
    var favs = [];

    if (currentProfile && currentProfile.favorites) {
        favs = currentProfile.favorites.map(function (x) {
            return parseInt(x);
        });
    }

    document.querySelectorAll('#mapSvg path').forEach(function (path) {
        var plate = parseInt(path.getAttribute('data-plate'));

        path.classList.remove('completed', 'current', 'remaining', 'favorite');

        if (!I.inPlatePhase && !I.finished) {
            path.classList.add('remaining');
        } else if (I.finished || plate > I.currentPlate) {
            path.classList.add('completed');
        } else if (plate === I.currentPlate) {
            path.classList.add('current');
        } else {
            path.classList.add('remaining');
        }

        // Favori il ise mor boya
        if (favs.indexOf(plate) !== -1) {
            path.classList.add('favorite');
        }
    });
}
function renderHistory(I) {
    var list = document.getElementById('histList'); list.innerHTML = '';
    if (!I.inPlatePhase && !I.finished) { list.innerHTML = '<p class="empty-msg">İl sayacı henüz başlamadı.</p>'; return; }

    var startPlate = I.finished ? 1 : I.currentPlate;

    for (var plate = startPlate; plate <= 81; plate++) {
        var city = findCity(plate); if (!city) continue;
        var armyDay = I.waitDays + (81 - plate) + 1, d = new Date(I.startDate); d.setDate(d.getDate() + (armyDay - 1));
        var st = (I.finished || plate > I.currentPlate) ? '✅' : plate === I.currentPlate ? '📍' : '';
        var item = document.createElement('div'); item.className = 'hist-item';
        item.innerHTML = '<div class="hp">' + city.p + '</div><div class="hi"><div class="hc">' + st + ' ' + city.n + '</div><div class="hq">"' + city.q + '"</div></div><div><div class="hdl">' + armyDay + '. Gün</div><div class="hd">' + formatDate(d) + '</div></div>';
        (function (c, p, a, info) { item.addEventListener('click', function () { openModal(c, p, a, info); }); })(city, plate, armyDay, I);
        list.appendChild(item);
    }
}

// ===== MODAL & FULLSCREEN BİLGİ KARTI =====
function openModal(city, plateNum, armyDay, info) {
    // Fullscreen modda → bilgi kartı göster
    if (document.body.classList.contains('map-fullscreen')) {
        showFsInfo(city, plateNum, armyDay, info);
        return;
    }
    // Normal mod → modal göster
    currentModalCity = { city: city, plate: plateNum };
    document.getElementById('mPlate').textContent = city.p;
    document.getElementById('mPlate').style.color = (plateNum === info.currentPlate && !info.finished) ? '#fbbf24' : '#4ade80';
    document.getElementById('mName').textContent = city.n;
    document.getElementById('mQuote').textContent = '"' + city.q + '"';
    var d = new Date(info.startDate); d.setDate(d.getDate() + (armyDay - 1));
    document.getElementById('mDay').textContent = armyDay + '. Gün / ' + info.effectiveTotal + ' · ' + formatDate(d);
    var s = document.getElementById('mStatus'), mb = document.querySelector('#modal .modal-box');
    mb.classList.remove('status-completed', 'status-current', 'status-waiting');
    if (info.finished || plateNum > info.currentPlate) { s.textContent = '✅ Tamamlandı'; s.className = 'ms done'; mb.classList.add('status-completed'); }
    else if (plateNum === info.currentPlate) { s.textContent = '📍 Bugün'; s.className = 'ms now'; mb.classList.add('status-current'); }
    else { s.textContent = '⏳ Bekliyor'; s.className = 'ms wait'; mb.classList.add('status-waiting'); }
    updateFavButton(plateNum);
    document.getElementById('modal').classList.add('active');
}

function showFsInfo(city, plateNum, armyDay, info) {
    var fsInfo = document.getElementById('mapFsInfo');
    if (!fsInfo) return;
    fsInfo.style.display = 'block';
    document.getElementById('fsiPlate').textContent = city.p;
    document.getElementById('fsiName').textContent = city.n;
    document.getElementById('fsiQuote').textContent = '"' + city.q + '"';
    var d = new Date(info.startDate); d.setDate(d.getDate() + (armyDay - 1));
    document.getElementById('fsiDay').textContent = armyDay + '. Gün · ' + formatDate(d);
    var statusEl = document.getElementById('fsiStatus');
    fsInfo.classList.remove('status-completed', 'status-current', 'status-waiting', 'active');
    if (info.finished || plateNum > info.currentPlate) { statusEl.textContent = '✅ Tamamlandı'; fsInfo.classList.add('status-completed'); }
    else if (plateNum === info.currentPlate) { statusEl.textContent = '📍 Bugün'; fsInfo.classList.add('status-current'); }
    else { statusEl.textContent = '⏳ Bekliyor'; fsInfo.classList.add('status-waiting'); }
    fsInfo.classList.add('active');
}

function hideFsInfo() {
    var fsInfo = document.getElementById('mapFsInfo');
    if (fsInfo) {
        fsInfo.classList.remove('active', 'status-completed', 'status-current', 'status-waiting');
        fsInfo.style.display = 'none';
    }
}

function closeModal() { document.getElementById('modal').classList.remove('active'); }

function formatDate(d) {
    var months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// ===== HARİTA TAM EKRAN =====
function toggleMapFullscreen() {
    document.body.classList.toggle('map-fullscreen');
    if (document.body.classList.contains('map-fullscreen')) {
        applyFullscreenOrientation();
        window.addEventListener('resize', applyFullscreenOrientation);
        window.addEventListener('orientationchange', applyFullscreenOrientation);
    } else {
        removeFullscreenOrientation();
        window.removeEventListener('resize', applyFullscreenOrientation);
        window.removeEventListener('orientationchange', applyFullscreenOrientation);
    }
}

function closeMapFullscreen() {
    hideFsInfo();
    document.body.classList.remove('map-fullscreen');
    removeFullscreenOrientation();
    window.removeEventListener('resize', applyFullscreenOrientation);
    window.removeEventListener('orientationchange', applyFullscreenOrientation);
}

function applyFullscreenOrientation() {
    var ms = document.getElementById('mapSection'); if (!ms) return;
    if (window.innerHeight > window.innerWidth) {
        ms.style.cssText = 'position:fixed;width:' + window.innerHeight + 'px;height:' + window.innerWidth + 'px;top:50%;left:50%;transform:translate(-50%,-50%) rotate(90deg);z-index:990;background:#0a0e1a;padding:10px;margin:0;border-radius:0;display:flex;flex-direction:column;';
    } else {
        ms.style.cssText = 'position:fixed;width:100vw;height:100vh;top:0;left:0;transform:none;z-index:990;background:#0a0e1a;padding:10px;margin:0;border-radius:0;display:flex;flex-direction:column;';
    }
}

function removeFullscreenOrientation() {
    var ms = document.getElementById('mapSection'); if (ms) ms.style.cssText = '';
}

document.getElementById('mapFsBtn').addEventListener('click', function (e) { e.stopPropagation(); toggleMapFullscreen(); });
document.getElementById('mapFsClose').addEventListener('click', function (e) { e.stopPropagation(); closeMapFullscreen(); });

document.getElementById('mapWrap').addEventListener('click', function (e) {
    if (e.target.tagName !== 'path' && e.target.tagName !== 'text' && e.target.tagName !== 'svg') {
        var fsInfo = document.getElementById('mapFsInfo');
        if (fsInfo && fsInfo.classList.contains('active')) { hideFsInfo(); return; }
        toggleMapFullscreen();
    }
});

document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMapFullscreen(); });

// ===== PROFİL AKTARMA =====
function encodeProfile(p) { try { return btoa(unescape(encodeURIComponent(JSON.stringify(p)))); } catch (e) { return null; } }
function decodeProfile(c) { try { return JSON.parse(decodeURIComponent(escape(atob(c.trim())))); } catch (e) { return null; } }

function showExportModal() {
    var profiles = getAllProfiles(); if (profiles.length === 0) { alert('Profil yok!'); return; }
    var select = document.getElementById('exportSelect');
    select.innerHTML = '<option value="all">📦 Tümü (' + profiles.length + ')</option>';
    profiles.forEach(function (p, i) { select.innerHTML += '<option value="' + i + '">' + p.name + '</option>'; });
    updateExportCode(); select.onchange = updateExportCode;
    document.getElementById('exportModal').classList.add('active');
}
function updateExportCode() {
    var profiles = getAllProfiles(), val = document.getElementById('exportSelect').value;
    document.getElementById('exportCode').value = encodeProfile(val === 'all' ? profiles : [profiles[parseInt(val)]]) || 'Hata!';
}
function closeExportModal() { document.getElementById('exportModal').classList.remove('active'); }
function copyExportCode() {
    var el = document.getElementById('exportCode'), btn = document.getElementById('copyCodeBtn');
    if (navigator.clipboard) { navigator.clipboard.writeText(el.value).then(function () { btn.textContent = '✅ KOPYALANDI!'; setTimeout(function () { btn.textContent = '📋 KOPYALA'; }, 2000); }); }
    else { el.select(); document.execCommand('copy'); btn.textContent = '✅ KOPYALANDI!'; setTimeout(function () { btn.textContent = '📋 KOPYALA'; }, 2000); }
}

function showImportModal() { document.getElementById('importCode').value = ''; document.getElementById('importPreview').style.display = 'none'; document.getElementById('importModal').classList.add('active'); document.getElementById('importCode').oninput = previewImport; }
function closeImportModal() { document.getElementById('importModal').classList.remove('active'); }
function previewImport() {
    var code = document.getElementById('importCode').value.trim(), preview = document.getElementById('importPreview');
    if (!code) { preview.style.display = 'none'; return; }
    var decoded = decodeProfile(code);
    if (!decoded) { preview.style.display = 'block'; preview.innerHTML = '<div style="color:#fca5a5;text-align:center">❌ Geçersiz kod!</div>'; return; }
    var profiles = Array.isArray(decoded) ? decoded : [decoded];
    var html = '<div class="ip-title">✅ ' + profiles.length + ' Profil</div>';
    profiles.forEach(function (p) { html += '<div class="ip-row"><span class="ip-label">' + (p.name || '?') + '</span><span class="ip-value">' + (p.startDate || '-') + '</span></div>'; });
    preview.style.display = 'block'; preview.innerHTML = html;
}
function importProfile2() {
    var decoded = decodeProfile(document.getElementById('importCode').value.trim());
    if (!decoded) { alert('Geçersiz kod!'); return; }
    var profiles = Array.isArray(decoded) ? decoded : [decoded], existing = getAllProfiles(), count = 0;
    profiles.forEach(function (p) {
        p.id = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) + '_imp';
        if (!p.durationType) { p.durationType = (p.duration === 365) ? 12 : 6; }
        if (typeof p.dagitimGun === 'undefined') p.dagitimGun = (p.dagitim === 1 || p.dagitim === 3) ? 3 : 0;
        if (typeof p.yolAcemilik === 'undefined') p.yolAcemilik = p.yol || 1;
        if (typeof p.yolTerhis === 'undefined') p.yolTerhis = p.yol || 1;
        if (typeof p.usedIzin === 'undefined') p.usedIzin = 0;
        if (!p.cezalar) p.cezalar = []; if (!p.favorites) p.favorites = [];
        existing.push(p); count++;
    });
    saveAllProfiles(existing); closeImportModal(); renderProfileList(); alert('✅ ' + count + ' profil aktarıldı!');
}

// Event Listeners
document.getElementById('exportBtn').addEventListener('click', showExportModal);
document.getElementById('importBtn').addEventListener('click', showImportModal);
document.getElementById('exportClose').addEventListener('click', closeExportModal);
document.getElementById('cancelExport').addEventListener('click', closeExportModal);
document.getElementById('exportModal').addEventListener('click', function (e) { if (e.target.id === 'exportModal') closeExportModal(); });
document.getElementById('copyCodeBtn').addEventListener('click', copyExportCode);
document.getElementById('importClose').addEventListener('click', closeImportModal);
document.getElementById('cancelImport').addEventListener('click', closeImportModal);
document.getElementById('importModal').addEventListener('click', function (e) { if (e.target.id === 'importModal') closeImportModal(); });
document.getElementById('importProfileBtn').addEventListener('click', importProfile2);

// Fullscreen bilgi kartı kapatma
var fsiCloseBtn = document.getElementById('fsiClose');
var mapFsInfoEl = document.getElementById('mapFsInfo');
if (fsiCloseBtn) { fsiCloseBtn.addEventListener('click', function (e) { e.stopPropagation(); hideFsInfo(); }); }
if (mapFsInfoEl) { mapFsInfoEl.addEventListener('click', function (e) { e.stopPropagation(); hideFsInfo(); }); }

// Global: kart açıkken herhangi bir yere basınca kapat
document.addEventListener('click', function (e) {
    var fsInfo = document.getElementById('mapFsInfo');
    if (!fsInfo || !fsInfo.classList.contains('active')) return;
    if (e.target.tagName === 'path') return;
    hideFsInfo();
});