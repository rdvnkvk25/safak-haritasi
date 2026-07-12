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

    // Profil ekranı butonları
    document.getElementById('newProfileBtn').addEventListener('click', showCreateScreen);
    document.getElementById('cancelCreate').addEventListener('click', showProfileScreen);
    document.getElementById('createBtn').addEventListener('click', createProfile);

    // Ana ekran butonları
    document.getElementById('switchBtn').addEventListener('click', switchProfile);
    document.getElementById('resetBtn').addEventListener('click', deleteCurrentProfile);
    document.getElementById('mClose').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', function (e) {
        if (e.target.id === 'modal') closeModal();
    });
    document.getElementById('favBtn').addEventListener('click', toggleFavorite);

    // Ceza modal butonları
    document.getElementById('addCezaBtn').addEventListener('click', showCezaModal);
    document.getElementById('cezaClose').addEventListener('click', closeCezaModal);
    document.getElementById('cancelCeza').addEventListener('click', closeCezaModal);
    document.getElementById('saveCezaBtn').addEventListener('click', saveCeza);
    document.getElementById('cezaModal').addEventListener('click', function (e) {
        if (e.target.id === 'cezaModal') closeCezaModal();
    });

    // İzin güncelleme modal butonları
    document.getElementById('editIzinBtn').addEventListener('click', showIzinModal);
    document.getElementById('izinClose').addEventListener('click', closeIzinModal);
    document.getElementById('cancelIzin').addEventListener('click', closeIzinModal);
    document.getElementById('saveIzinBtn').addEventListener('click', saveIzin);
    document.getElementById('izinModal').addEventListener('click', function (e) {
        if (e.target.id === 'izinModal') closeIzinModal();
    });

    // Süre değişince grupları göster/gizle
    document.querySelectorAll('input[name="duration"]').forEach(function (r) {
        r.addEventListener('change', function () {
            toggleDurationGroups();
            updateIzinInfoText();
        });
    });

    // Sağlık durumu değişince detay göster/gizle
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

    // Katılış tarihi değişince geç katılış hesapla
    var katilisInput = document.getElementById('katilisDate');
    if (katilisInput) {
        katilisInput.addEventListener('change', updateGecKatilisInfo);
    }

    // Acemilik yol izni değişince geç katılış güncelle
    document.querySelectorAll('input[name="yolAcemilik"]').forEach(function (r) {
        r.addEventListener('change', updateGecKatilisInfo);
    });

    // Sevk tarihi değişince güncelle
    document.getElementById('startDate').addEventListener('change', function () {
        updateIzinInfoText();
        updateGecKatilisInfo();
    });

    // Bugünün tarihi
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    document.getElementById('startDate').value = yyyy + '-' + mm + '-' + dd;

    // Sayfa yüklendiğinde doğru grupları göster
    toggleDurationGroups();
    updateIzinInfoText();

    // Otomatik son aktif profili aç
    var lastActive = localStorage.getItem('safak_active_profile');
    if (lastActive) {
        var profiles = getAllProfiles();
        var p = profiles.find(function (x) { return x.id === lastActive; });
        if (p) {
            loadProfile(p);
        }
    }
});

// ===== TAKVİM BAZLI SÜRE HESAPLAMA =====
function calculateRealDuration(startDateStr, months) {
    var start = new Date(startDateStr + 'T00:00:00');
    var end = new Date(start);
    end.setMonth(end.getMonth() + months);
    var diffTime = end - start;
    return Math.round(diffTime / 86400000);
}

function calculateEndDate(startDateStr, months) {
    var start = new Date(startDateStr + 'T00:00:00');
    var end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return end;
}

// ===== İZİN HAKKI HESABI (Madde 27) =====
function getTotalIzinHakki(months) {
    if (months === 6) return 6;
    return 18;
}

function getMonths(profile) {
    if (profile.durationType) return profile.durationType;
    if (profile.duration === 180) return 6;
    if (profile.duration === 365) return 12;
    return 6;
}

// ===== SÜREYE GÖRE FORM GRUPLARI =====
function toggleDurationGroups() {
    var checked = document.querySelector('input[name="duration"]:checked');
    if (!checked) return;
    var months = parseInt(checked.value);

    var mehilGroup = document.getElementById('mehilGroup');
    var dagitimGroup = document.getElementById('dagitimGroup');
    var yolAcemilikGroup = document.getElementById('yolAcemilikGroup');
    var yolTerhisGroup = document.getElementById('yolTerhisGroup');

    if (months === 12) {
        if (mehilGroup) mehilGroup.style.display = '';
        if (dagitimGroup) dagitimGroup.style.display = '';
        if (yolAcemilikGroup) yolAcemilikGroup.style.display = '';
        if (yolTerhisGroup) yolTerhisGroup.style.display = '';
    } else {
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
        text.innerHTML = '📖 <b>Madde 27:</b> 6 ay için ayda 1 gün = <b>Toplam 6 gün</b> izin hakkı. Dağıtım izni bu haktan düşülür. Kullanılmayan izinler terhisi öne çeker.' + realDays;
    } else {
        text.innerHTML = '📖 <b>Madde 27:</b> İlk 6 ay ayda 1 gün (6) + Son 6 ay ayda 2 gün (12) = <b>Toplam 18 gün</b> izin hakkı. Dağıtım izni bu haktan düşülür. Kullanılmayan izinler terhisi öne çeker.' + realDays;
    }
}

// ===== GEÇ KATILIŞ HESAPLAMA =====
function updateGecKatilisInfo() {
    var infoDiv = document.getElementById('gecKatilisInfo');
    if (!infoDiv) return;

    var sevkStr = document.getElementById('startDate').value;
    var katilisStr = document.getElementById('katilisDate').value;

    if (!sevkStr || !katilisStr) {
        infoDiv.style.display = 'none';
        return;
    }

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
        infoDiv.innerHTML = '⚠️ <b>' + gecGun + ' gün</b> geç katılış tespit edildi!<br>' +
            'Beklenen katılış: <b>' + formatDate(beklenen) + '</b><br>' +
            'Fiili katılış: <b>' + formatDate(katilis) + '</b><br>' +
            'Bu süre askerliğinize eklenecektir.';
    } else {
        infoDiv.className = 'gec-info gec-ok';
        infoDiv.innerHTML = '✅ Zamanında katılış. Geç katılış yok.';
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

function saveAllProfiles(profiles) {
    localStorage.setItem('safak_profiles', JSON.stringify(profiles));
}

function saveCurrentProfile() {
    if (!currentProfile) return;
    var profiles = getAllProfiles();
    var idx = profiles.findIndex(function (p) { return p.id === currentProfile.id; });
    if (idx !== -1) {
        profiles[idx] = currentProfile;
    } else {
        profiles.push(currentProfile);
    }
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
        card.innerHTML =
            '<div class="p-avatar">' + initial + '</div>' +
            '<div class="p-info">' +
                '<div class="p-name">' + p.name + '</div>' +
                '<div class="p-details">' + (months === 12 ? 'Uzun Dönem' : 'Kısa Dönem') + ' · ' + formatDate(new Date(p.startDate)) + '</div>' +
            '</div>' +
            '<div class="p-remaining">' +
                '<span class="num">' + info.remaining + '</span>' +
                '<span class="lbl">GÜN</span>' +
            '</div>' +
            '<button class="p-del" data-id="' + p.id + '" title="Sil">✕</button>';

        (function (profile) {
            card.addEventListener('click', function (e) {
                if (e.target.classList.contains('p-del')) return;
                loadProfile(profile);
            });
        })(p);

        (function (profile) {
            card.querySelector('.p-del').addEventListener('click', function (e) {
                e.stopPropagation();
                if (confirm(profile.name + ' profilini silmek istediğinize emin misiniz?')) {
                    deleteProfile(profile.id);
                }
            });
        })(p);

        list.appendChild(card);
    });
}

function deleteProfile(id) {
    var profiles = getAllProfiles();
    profiles = profiles.filter(function (p) { return p.id !== id; });
    saveAllProfiles(profiles);

    if (currentProfile && currentProfile.id === id) {
        currentProfile = null;
        localStorage.removeItem('safak_active_profile');
    }

    renderProfileList();
}

function deleteCurrentProfile() {
    if (!currentProfile) return;
    if (!confirm(currentProfile.name + ' profilini silmek istediğinize emin misiniz?')) return;
    deleteProfile(currentProfile.id);
    showProfileScreen();
}

// ===== EKRAN GEÇİŞLERİ =====
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
    var usedIzinEl = document.getElementById('usedIzin');
    if (usedIzinEl) usedIzinEl.value = '0';
    var mazeretEl = document.getElementById('mazeretIzin');
    if (mazeretEl) mazeretEl.value = '0';
    var saglikGunEl = document.getElementById('saglikGun');
    if (saglikGunEl) saglikGunEl.value = '0';
    var saglikSayilanEl = document.getElementById('saglikSayilan');
    if (saglikSayilanEl) saglikSayilanEl.value = '0';
    var saglikDetay = document.getElementById('saglikDetay');
    if (saglikDetay) saglikDetay.style.display = 'none';
    var saglikYok = document.querySelector('input[name="saglikDurum"][value="yok"]');
    if (saglikYok) saglikYok.checked = true;
    var katilisEl = document.getElementById('katilisDate');
    if (katilisEl) katilisEl.value = '';
    var gecInfo = document.getElementById('gecKatilisInfo');
    if (gecInfo) gecInfo.style.display = 'none';
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

function switchProfile() {
    showProfileScreen();
}

// ===== PROFİL OLUŞTUR =====
function createProfile() {
    var name = document.getElementById('fullName').value.trim();
    var startDateVal = document.getElementById('startDate').value;
    var months = parseInt(document.querySelector('input[name="duration"]:checked').value);
    var usedIzin = parseInt(document.getElementById('usedIzin').value) || 0;
    var mazeretIzin = parseInt(document.getElementById('mazeretIzin').value) || 0;

    // Yol izinleri
    var yolAcemilik = parseInt(document.querySelector('input[name="yolAcemilik"]:checked').value);
    var yolTerhis = parseInt(document.querySelector('input[name="yolTerhis"]:checked').value);

    // Dağıtım izni
    var dagitimGun = parseInt(document.querySelector('input[name="dagitim"]:checked').value);

    // Mehil izni (sadece uzun dönem)
    var mehil = 0;
    if (months === 12) {
        var mehilChecked = document.querySelector('input[name="mehil"]:checked');
        mehil = mehilChecked ? parseInt(mehilChecked.value) : 1;
    }

    // Sağlık raporu
    var saglikDurum = document.querySelector('input[name="saglikDurum"]:checked').value;
    var saglikGun = 0;
    var saglikSayilan = 0;
    if (saglikDurum === 'var') {
        saglikGun = parseInt(document.getElementById('saglikGun').value) || 0;
        saglikSayilan = parseInt(document.getElementById('saglikSayilan').value) || 0;
    }

    // Geç katılış
    var katilisDate = document.getElementById('katilisDate').value || null;

    // Validasyonlar
    if (!name) {
        alert('Lütfen ad soyad girin!');
        return;
    }

    if (!startDateVal) {
        alert('Lütfen sevk tarihi seçin!');
        return;
    }

    var totalIzinHakki = getTotalIzinHakki(months);

    var toplamKullanilan = dagitimGun + usedIzin;
    if (toplamKullanilan > totalIzinHakki) {
        alert('Dağıtım izni (' + dagitimGun + ' gün) + Normal izin (' + usedIzin + ' gün) = ' + toplamKullanilan + ' gün\nToplam izin hakkınız (' + totalIzinHakki + ' gün) aşılamaz!');
        return;
    }

    if (usedIzin < 0) usedIzin = 0;
    if (mazeretIzin < 0) mazeretIzin = 0;

    if (saglikSayilan > saglikGun) {
        alert('Hizmetten sayılan süre, toplam rapor süresinden fazla olamaz!');
        return;
    }

    var realDuration = calculateRealDuration(startDateVal, months);

    var profile = {
        id: 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: name,
        startDate: startDateVal,
        durationType: months,
        duration: realDuration,
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
    // Eski profil uyumluluğu
    if (typeof profile.usedIzin === 'undefined') profile.usedIzin = 0;
    if (typeof profile.dagitimGun === 'undefined') {
        if (profile.dagitim === 1 || profile.dagitim === 3) {
            profile.dagitimGun = 3;
        } else {
            profile.dagitimGun = 0;
        }
    }
    if (typeof profile.yolAcemilik === 'undefined') {
        profile.yolAcemilik = profile.yol || 1;
    }
    if (typeof profile.yolTerhis === 'undefined') {
        profile.yolTerhis = profile.yol || 1;
    }
    if (typeof profile.mazeretIzin === 'undefined') profile.mazeretIzin = 0;
    if (typeof profile.saglikGun === 'undefined') profile.saglikGun = 0;
    if (typeof profile.saglikSayilan === 'undefined') profile.saglikSayilan = 0;
    if (typeof profile.mehil === 'undefined') profile.mehil = 1;
    if (typeof profile.katilisDate === 'undefined') profile.katilisDate = null;
    if (!profile.cezalar) profile.cezalar = [];
    if (!profile.favorites) profile.favorites = [];

    if (!profile.durationType) {
        if (profile.duration === 365) {
            profile.durationType = 12;
        } else {
            profile.durationType = 6;
        }
        profile.duration = calculateRealDuration(profile.startDate, profile.durationType);
        saveCurrentProfile();
    }

    currentProfile = profile;
    localStorage.setItem('safak_active_profile', profile.id);

    var months = getMonths(profile);
    var realDays = profile.duration;

    document.getElementById('userNameHeader').textContent = '🎖️ ' + profile.name.toUpperCase();
    document.getElementById('userDurationHeader').textContent =
        (months === 12 ? 'UZUN DÖNEM (12 AY)' : 'KISA DÖNEM (6 AY)') + ' · ' + realDays + ' GÜN';
    document.getElementById('totalDaysLabel').textContent = realDays;

    showMainScreen();
}

// ===== HESAPLAMALAR (Kanuna Uyumlu + Takvim Bazlı) =====
function calculateInfo(profile) {
    // Eski profil uyumluluğu
    if (typeof profile.usedIzin === 'undefined') profile.usedIzin = 0;
    if (typeof profile.dagitimGun === 'undefined') {
        if (profile.dagitim === 1 || profile.dagitim === 3) {
            profile.dagitimGun = 3;
        } else {
            profile.dagitimGun = 0;
        }
    }
    if (typeof profile.yolAcemilik === 'undefined') {
        profile.yolAcemilik = profile.yol || 1;
    }
    if (typeof profile.yolTerhis === 'undefined') {
        profile.yolTerhis = profile.yol || 1;
    }
    if (typeof profile.mazeretIzin === 'undefined') profile.mazeretIzin = 0;
    if (typeof profile.saglikGun === 'undefined') profile.saglikGun = 0;
    if (typeof profile.saglikSayilan === 'undefined') profile.saglikSayilan = 0;
    if (typeof profile.mehil === 'undefined') profile.mehil = 1;
    if (typeof profile.katilisDate === 'undefined') profile.katilisDate = null;
    if (!profile.cezalar) profile.cezalar = [];

    var months = getMonths(profile);
    var startDate = new Date(profile.startDate + 'T00:00:00');
    var now = new Date();
    now.setHours(0, 0, 0, 0);

    var baseDuration = calculateRealDuration(profile.startDate, months);

    // === TOPLAM CEZA ===
    var totalCeza = profile.cezalar.reduce(function (sum, c) { return sum + c.gun; }, 0);

    // === İZİN HESABI (Madde 27) ===
    var totalIzinHakki = getTotalIzinHakki(months);
    var dagitimGun = profile.dagitimGun || 0;
    var usedIzin = profile.usedIzin || 0;

    var toplamKullanilan = dagitimGun + usedIzin;
    if (toplamKullanilan > totalIzinHakki) toplamKullanilan = totalIzinHakki;

    var unusedIzin = Math.max(0, totalIzinHakki - toplamKullanilan);

    // === YOL İZNİ ===
    var yolAcemilik = profile.yolAcemilik || profile.yol || 0;
    var yolTerhis = profile.yolTerhis || profile.yol || 0;
    var yolIndirim = 0;
    var mehilAktif = false;

    if (months === 12) {
        if (profile.mehil === 1) {
            mehilAktif = true;
        } else {
            yolIndirim = yolTerhis;
        }
    } else {
        yolIndirim = yolTerhis;
    }

    // === SAĞLIK RAPORU ===
    var saglikGun = profile.saglikGun || 0;
    var saglikSayilan = profile.saglikSayilan || 0;
    var saglikEklenen = Math.max(0, saglikGun - saglikSayilan);

    // === MAZERET İZNİ ===
    var mazeretIzin = profile.mazeretIzin || 0;

    // === GEÇ KATILIŞ ===
    var gecGun = calculateGecGun(profile);

    // === EFEKTİF TOPLAM ===
    var totalIndirim = unusedIzin + yolIndirim;
    var totalEklenen = totalCeza + saglikEklenen + gecGun;
    var effectiveTotal = baseDuration - totalIndirim + totalEklenen;
    if (effectiveTotal < 1) effectiveTotal = 1;

    // Terhis tarihi
    var end = new Date(startDate);
    end.setDate(end.getDate() + effectiveTotal);

    // Geçen gün
    var elapsed = Math.floor((now - startDate) / 86400000);
    var remaining = Math.max(0, effectiveTotal - elapsed);
    var completed = Math.min(Math.max(elapsed, 0), effectiveTotal);
    var pct = Math.min(100, Math.round((completed / effectiveTotal) * 100));

    // İl sayacı
    var waitDays = Math.max(0, effectiveTotal - 81);
    var plateStartDate = new Date(startDate);
    plateStartDate.setDate(plateStartDate.getDate() + waitDays);

    var plateElapsed = Math.max(0, elapsed - waitDays);
    var currentPlate = 81 - plateElapsed;

    var inPlatePhase = elapsed >= waitDays && remaining > 0;
    var inWaitPhase = elapsed >= 0 && elapsed < waitDays;
    var notStarted = elapsed < 0;
    var finished = remaining <= 0;

    return {
        startDate: startDate,
        now: now,
        end: end,
        plateStartDate: plateStartDate,
        elapsed: elapsed,
        remaining: remaining,
        completed: completed,
        pct: pct,
        baseDuration: baseDuration,
        effectiveTotal: effectiveTotal,
        waitDays: waitDays,
        currentPlate: currentPlate,
        inPlatePhase: inPlatePhase,
        inWaitPhase: inWaitPhase,
        notStarted: notStarted,
        finished: finished,
        months: months,
        totalIzinHakki: totalIzinHakki,
        dagitimGun: dagitimGun,
        usedIzin: usedIzin,
        toplamKullanilan: toplamKullanilan,
        unusedIzin: unusedIzin,
        yolAcemilik: yolAcemilik,
        yolTerhis: yolTerhis,
        yolIndirim: yolIndirim,
        mehilAktif: mehilAktif,
        saglikGun: saglikGun,
        saglikSayilan: saglikSayilan,
        saglikEklenen: saglikEklenen,
        mazeretIzin: mazeretIzin,
        gecGun: gecGun,
        totalCeza: totalCeza,
        totalIndirim: totalIndirim,
        totalEklenen: totalEklenen
    };
}

function getInfo() {
    return calculateInfo(currentProfile);
}

// ===== GÜNCELLEME =====
function update() {
    if (!currentProfile) return;

    var I = getInfo();

    // Atarsa sayacı
    var atarsa = Math.max(0, I.remaining - 1);
    document.getElementById('atarsaDays').textContent = I.remaining > 0 ? atarsa : '🏠';

    document.getElementById('remDays').textContent = I.remaining;

    if (I.inPlatePhase && I.currentPlate > 0) {
        document.getElementById('plateDays').textContent = I.currentPlate;
    } else if (I.finished) {
        document.getElementById('plateDays').textContent = '🏠';
    } else if (I.inWaitPhase) {
        document.getElementById('plateDays').textContent = (I.waitDays - I.elapsed) + ' →';
    } else {
        document.getElementById('plateDays').textContent = '–';
    }

    document.getElementById('progFill').style.width = I.pct + '%';
    document.getElementById('compDays').textContent = I.completed;
    document.getElementById('totalDaysLabel').textContent = I.baseDuration;
    document.getElementById('pctDone').textContent = I.pct;

    document.getElementById('dStart').textContent = formatDate(I.startDate);
    document.getElementById('dToday').textContent = formatDate(I.now);
    document.getElementById('dPlateStart').textContent = formatDate(I.plateStartDate);
    document.getElementById('dEnd').textContent = formatDate(I.end);

    // Faz çubuğu
    var p1 = document.getElementById('phase1');
    var p2 = document.getElementById('phase2');
    p1.style.flex = I.waitDays;
    p2.style.flex = 81;
    document.getElementById('phase1Label').textContent = '📅 Bekleme (' + I.effectiveTotal + '→82)';
    p1.classList.toggle('active-phase', I.inWaitPhase);
    p2.classList.toggle('active-phase', I.inPlatePhase);

    // === EXTRA BİLGİ KUTULARI ===
    var dagitimBox = document.getElementById('dagitimBox');
    var mehilBox = document.getElementById('mehilBox');
    var mazeretBox = document.getElementById('mazeretBox');
    var saglikBox = document.getElementById('saglikBox');

    // İzin hakkı
    document.getElementById('extraIzinHakki').textContent = I.totalIzinHakki + ' gün';

    // Dağıtım izni
    if (I.dagitimGun > 0) {
        dagitimBox.style.display = '';
        document.getElementById('extraDagitim').textContent = I.dagitimGun + ' gün';
    } else {
        dagitimBox.style.display = '';
        document.getElementById('extraDagitim').textContent = 'Yok';
    }

    // Normal izin
    var kalanIzinHakki = Math.max(0, I.totalIzinHakki - I.dagitimGun);
    document.getElementById('extraNormalIzin').textContent = I.usedIzin + '/' + kalanIzinHakki + ' gün';

    // Kullanılmayan izin
    document.getElementById('extraUnusedIzin').textContent =
        I.unusedIzin > 0 ? '-' + I.unusedIzin + ' gün ✂️' : '0 gün ✓';

    // Yol izinleri
    var yolAcemilikBox = document.getElementById('yolAcemilikBox');
    var yolTerhisBox = document.getElementById('yolTerhisBox');

    document.getElementById('extraYolAcemilik').textContent = I.yolAcemilik + ' gün';

    if (I.months === 12 && I.mehilAktif) {
        yolTerhisBox.style.display = 'none';
        yolAcemilikBox.style.display = 'none';
        mehilBox.style.display = '';
        document.getElementById('extraMehil').textContent = 'Hizmetten sayılır ✓';
    } else {
        yolTerhisBox.style.display = '';
        yolAcemilikBox.style.display = '';
        mehilBox.style.display = 'none';
        document.getElementById('extraYolTerhis').textContent = '-' + I.yolTerhis + ' gün ✂️';
    }

    // Mazeret izni
    if (I.mazeretIzin > 0) {
        mazeretBox.style.display = '';
        document.getElementById('extraMazeret').textContent = I.mazeretIzin + ' gün (bilgi)';
    } else {
        mazeretBox.style.display = 'none';
    }

    // Sağlık raporu
    if (I.saglikGun > 0) {
        saglikBox.style.display = '';
        if (I.saglikEklenen > 0) {
            document.getElementById('extraSaglik').textContent = '+' + I.saglikEklenen + ' gün eklendi';
            saglikBox.classList.remove('info-box');
            saglikBox.classList.add('negative');
        } else {
            document.getElementById('extraSaglik').textContent = I.saglikGun + ' gün (hizmetten)';
            saglikBox.classList.remove('negative');
            saglikBox.classList.add('info-box');
        }
    } else {
        saglikBox.style.display = 'none';
    }

    // Geç katılış
    var gecBox = document.getElementById('gecBox');
    if (I.gecGun > 0) {
        gecBox.style.display = '';
        document.getElementById('extraGec').textContent = '+' + I.gecGun + ' gün';
    } else {
        gecBox.style.display = 'none';
    }

    // Ceza
    document.getElementById('extraCeza').textContent = '+' + I.totalCeza + ' gün';
    document.getElementById('cezaBoxWrapper').classList.toggle('has-ceza', I.totalCeza > 0);

    // === ÖZET SATIRI ===
    var summaryParts = [];
    summaryParts.push('Askerlik: <b>' + I.baseDuration + '</b> gün (' + I.months + ' ay)');

    if (I.totalCeza > 0) summaryParts.push('<span class="neg">+ ' + I.totalCeza + ' ceza</span>');
    if (I.saglikEklenen > 0) summaryParts.push('<span class="neg">+ ' + I.saglikEklenen + ' sağlık</span>');
    if (I.gecGun > 0) summaryParts.push('<span class="neg">+ ' + I.gecGun + ' geç katılış</span>');
    if (I.unusedIzin > 0) summaryParts.push('<span class="plus">− ' + I.unusedIzin + ' izin</span>');
    if (I.yolIndirim > 0) summaryParts.push('<span class="plus">− ' + I.yolTerhis + ' terhis yol</span>');

    summaryParts.push('= <b>' + I.effectiveTotal + ' gün</b> efektif');

    var summaryText = summaryParts.join(' ');

    if (I.dagitimGun > 0) {
        summaryText += '<br><small style="color:#fcd34d">🎫 Dağıtım ' + I.dagitimGun + ' gün (yıllık izinden düşüldü)</small>';
    }
    if (I.mehilAktif) {
        summaryText += '<br><small style="color:#60a5fa">🏠 Mehil izni hizmetten sayıldı</small>';
    }
    if (I.mazeretIzin > 0) {
        summaryText += '<br><small style="color:#a78bfa">🏥 Mazeret izni ' + I.mazeretIzin + ' gün (hizmetten, terhisi etkilemez)</small>';
    }
    if (I.gecGun > 0) {
        summaryText += '<br><small style="color:#fca5a5">⏰ Geç katılış ' + I.gecGun + ' gün (acemilik yol: ' + I.yolAcemilik + ' gün)</small>';
    }

    document.getElementById('extrasSummary').innerHTML = summaryText;

    updateTodayCard(I);
    updateMapColors(I);
    renderHistory(I);
    renderFavorites();
    updateMapFavorites();
    renderCezalar();
}

function updateTodayCard(I) {
    var tc = document.getElementById('todayCard');

    if (I.finished) {
        tc.className = 'today gold';
        tc.innerHTML = '<div class="celeb"><div style="font-size:3.5rem">🎉🎖️🏠</div><h1>TERHİS OLDUN!</h1><p>Vatani görevini şerefle tamamladın.</p><p style="margin-top:12px;color:#4ade80;font-weight:600">Hoş geldin sivil hayat! 🇹🇷</p></div>';
    } else if (I.notStarted) {
        tc.className = 'today gray';
        tc.innerHTML = '<div class="today-hdr"><span style="color:#94a3b8">⏰ HENÜZ BAŞLAMADI</span></div><div class="today-body"><div class="big-num" style="color:#94a3b8">' + Math.abs(I.elapsed) + '</div><div class="big-label" style="color:#64748b">GÜN SONRA BAŞLIYOR</div><div class="big-sub" style="color:#475569">Başlangıç: ' + formatDate(I.startDate) + '</div></div>';
    } else if (I.inWaitPhase) {
        var dtp = I.waitDays - I.elapsed;
        tc.className = 'today amber';
        tc.innerHTML = '<div class="today-hdr"><span style="color:#fcd34d">📅 BEKLEME DÖNEMİ</span></div><div class="today-body"><div class="big-num">' + I.remaining + '</div><div class="big-label">GÜN KALDI</div><div class="big-sub">İl sayacına <b>' + dtp + ' gün</b> kaldı · Askerliğin <b>' + (I.elapsed + 1) + '</b>. günü</div></div>';
    } else if (I.inPlatePhase && I.currentPlate > 0) {
        var city = findCity(I.currentPlate);
        if (city) {
            tc.className = 'today green';
            tc.innerHTML = '<div class="today-hdr"><span style="color:#86efac">🗺️ BUGÜNÜN İLİ</span></div><div class="today-body"><div class="plate">' + city.p + '</div><div class="cname" style="color:#bbf7d0">' + city.n + '</div><div class="cquote" style="color:#86efac">"' + city.q + '"</div><div style="margin-top:12px;font-size:.8rem;color:#4ade80">Terhise <b>' + I.remaining + '</b> gün kaldı · Askerliğin <b>' + (I.elapsed + 1) + '</b>. günü</div></div>';
        }
    }
}

function findCity(plateNum) {
    for (var i = 0; i < CITIES.length; i++) {
        if (parseInt(CITIES[i].p) === plateNum) return CITIES[i];
    }
    return null;
}

// ===== CEZA YÖNETİMİ =====
function showCezaModal() {
    document.getElementById('cezaGun').value = '1';
    document.getElementById('cezaSebep').value = '';
    document.getElementById('cezaModal').classList.add('active');
}

function closeCezaModal() {
    document.getElementById('cezaModal').classList.remove('active');
}

function saveCeza() {
    var gun = parseInt(document.getElementById('cezaGun').value);
    var sebep = document.getElementById('cezaSebep').value.trim();
    var tur = document.querySelector('input[name="cezaTur"]:checked').value;

    if (isNaN(gun) || gun < 1) {
        alert('Ceza en az 1 gün olmalıdır!');
        return;
    }

    var turLabel = 'Diğer';
    if (tur === 'oda') turLabel = 'Oda hapsi';
    else if (tur === 'gozetim') turLabel = 'Gözetim altında oda hapsi';

    var ceza = {
        gun: gun,
        tur: turLabel,
        sebep: sebep || 'Belirtilmedi',
        tarih: new Date().toISOString()
    };

    currentProfile.cezalar.push(ceza);
    saveCurrentProfile();
    closeCezaModal();
    update();
}

function deleteCeza(index) {
    if (!confirm('Bu cezayı silmek istediğinize emin misiniz?')) return;
    currentProfile.cezalar.splice(index, 1);
    saveCurrentProfile();
    update();
}

function renderCezalar() {
    var list = document.getElementById('cezaList');
    list.innerHTML = '';

    if (!currentProfile.cezalar || currentProfile.cezalar.length === 0) {
        list.innerHTML = '<p class="empty-msg">Henüz ceza eklenmemiş. Umarız hiç eklemek zorunda kalmazsın! 🙏</p>';
        return;
    }

    currentProfile.cezalar.slice().reverse().forEach(function (ceza, revIdx) {
        var realIdx = currentProfile.cezalar.length - 1 - revIdx;
        var tarih = new Date(ceza.tarih);

        var item = document.createElement('div');
        item.className = 'ceza-item';
        item.innerHTML =
            '<div class="ci-icon">⚠️</div>' +
            '<div class="ci-info">' +
                '<div class="ci-days">' + ceza.gun + ' GÜN' + (ceza.tur ? ' — ' + ceza.tur : '') + '</div>' +
                '<div class="ci-reason">' + ceza.sebep + '</div>' +
                '<div class="ci-date">' + formatDate(tarih) + '</div>' +
            '</div>' +
            '<button class="ci-del" data-idx="' + realIdx + '">✕</button>';

        (function (idx) {
            item.querySelector('.ci-del').addEventListener('click', function () {
                deleteCeza(idx);
            });
        })(realIdx);

        list.appendChild(item);
    });
}

// ===== İZİN GÜNCELLEME MODAL =====
function showIzinModal() {
    if (!currentProfile) return;

    var months = getMonths(currentProfile);
    var totalHakki = getTotalIzinHakki(months);
    var dagitimGun = currentProfile.dagitimGun || 0;
    var kalanHak = Math.max(0, totalHakki - dagitimGun);

    document.getElementById('izinInfoLabel').innerHTML =
        'Toplam izin hakkın: <b>' + totalHakki + ' gün</b><br>' +
        'Dağıtım izni: <b>' + dagitimGun + ' gün</b> (yıllık izinden düşüldü)<br>' +
        'Kalan izin hakkın: <b>' + kalanHak + ' gün</b>';

    var input = document.getElementById('editUsedIzin');
    input.value = currentProfile.usedIzin || 0;
    input.max = kalanHak;

    updateIzinPreview();
    input.oninput = updateIzinPreview;

    document.getElementById('izinModal').classList.add('active');
}

function closeIzinModal() {
    document.getElementById('izinModal').classList.remove('active');
}

function updateIzinPreview() {
    var val = parseInt(document.getElementById('editUsedIzin').value) || 0;
    var months = getMonths(currentProfile);
    var totalHakki = getTotalIzinHakki(months);
    var dagitimGun = currentProfile.dagitimGun || 0;
    var toplamKullanilan = dagitimGun + val;
    var kullanilmayan = Math.max(0, totalHakki - toplamKullanilan);

    document.getElementById('izinPreview').innerHTML =
        '<div class="prev-row"><span>Toplam İzin Hakkı:</span><span class="val">' + totalHakki + ' gün</span></div>' +
        '<div class="prev-row"><span>Dağıtım İzni:</span><span class="val">' + dagitimGun + ' gün</span></div>' +
        '<div class="prev-row"><span>Normal İzin:</span><span class="val">' + val + ' gün</span></div>' +
        '<div class="prev-row"><span>Toplam Kullanılan:</span><span class="val">' + toplamKullanilan + ' / ' + totalHakki + '</span></div>' +
        '<div class="prev-row"><span>Kullanılmayan (şafaktan düşülecek):</span><span class="val neg">-' + kullanilmayan + ' gün</span></div>';
}

function saveIzin() {
    var val = parseInt(document.getElementById('editUsedIzin').value) || 0;
    var months = getMonths(currentProfile);
    var totalHakki = getTotalIzinHakki(months);
    var dagitimGun = currentProfile.dagitimGun || 0;
    var kalanHak = Math.max(0, totalHakki - dagitimGun);

    if (val < 0) {
        alert('İzin sayısı 0\'dan küçük olamaz!');
        return;
    }
    if (val > kalanHak) {
        alert('Normal izin, kalan izin hakkından (' + kalanHak + ' gün) fazla olamaz!\n(Toplam ' + totalHakki + ' gün - Dağıtım ' + dagitimGun + ' gün = ' + kalanHak + ' gün)');
        return;
    }

    currentProfile.usedIzin = val;
    saveCurrentProfile();
    closeIzinModal();
    update();
}

// ===== FAVORİLER =====
function toggleFavorite() {
    if (!currentModalCity || !currentProfile) return;

    var plateNum = currentModalCity.plate;
    if (!currentProfile.favorites) currentProfile.favorites = [];

    var idx = currentProfile.favorites.indexOf(plateNum);
    if (idx === -1) {
        currentProfile.favorites.push(plateNum);
    } else {
        currentProfile.favorites.splice(idx, 1);
    }

    saveCurrentProfile();
    updateFavButton(plateNum);
    renderFavorites();
    updateMapFavorites();
}

function updateFavButton(plateNum) {
    var btn = document.getElementById('favBtn');
    var icon = document.getElementById('favIcon');
    var isFav = currentProfile.favorites && currentProfile.favorites.indexOf(plateNum) !== -1;

    if (isFav) {
        btn.classList.add('active');
        icon.textContent = '★';
    } else {
        btn.classList.remove('active');
        icon.textContent = '☆';
    }
}

function renderFavorites() {
    var list = document.getElementById('favList');
    var count = document.getElementById('favCount');
    var favs = currentProfile.favorites || [];

    count.textContent = favs.length;

    if (favs.length === 0) {
        list.innerHTML = '<p class="empty-msg">Henüz favori il eklemediniz. Bir ile tıklayıp ⭐ butonuna basarak favorilere ekleyebilirsiniz.</p>';
        return;
    }

    list.innerHTML = '';
    var sorted = favs.slice().sort(function (a, b) { return a - b; });

    sorted.forEach(function (plateNum) {
        var city = findCity(plateNum);
        if (!city) return;

        var item = document.createElement('div');
        item.className = 'fav-item';
        item.innerHTML =
            '<button class="fx" data-plate="' + plateNum + '">✕</button>' +
            '<div class="fp">' + city.p + '</div>' +
            '<div class="fn">' + city.n + '</div>' +
            '<div class="fq">"' + city.q + '"</div>';

        (function (c, p) {
            item.addEventListener('click', function (e) {
                if (e.target.classList.contains('fx')) return;
                var I = getInfo();
                var armyDay = I.waitDays + (81 - p) + 1;
                openModal(c, p, armyDay, I);
            });
        })(city, plateNum);

        (function (p) {
            item.querySelector('.fx').addEventListener('click', function (e) {
                e.stopPropagation();
                var idx = currentProfile.favorites.indexOf(p);
                if (idx !== -1) {
                    currentProfile.favorites.splice(idx, 1);
                    saveCurrentProfile();
                    renderFavorites();
                    updateMapFavorites();
                }
            });
        })(plateNum);

        list.appendChild(item);
    });
}

function updateMapFavorites() {
    var oldStars = document.querySelectorAll('#mapSvg .fav-star');
    oldStars.forEach(function (star) { star.remove(); });

    var svg = document.getElementById('mapSvg');
    if (!svg || !currentProfile.favorites) return;

    currentProfile.favorites.forEach(function (plateNum) {
        var plateStr = plateNum.toString().padStart(2, '0');
        var path = svg.querySelector('path[data-plate="' + plateStr + '"]');
        if (!path) return;

        var bbox = path.getBBox();
        var cx = bbox.x + bbox.width / 2;
        var cy = bbox.y - 3;

        var star = document.createElementNS("http://www.w3.org/2000/svg", "text");
        star.setAttribute("x", cx);
        star.setAttribute("y", cy);
        star.setAttribute("text-anchor", "middle");
        star.setAttribute("font-size", "11");
        star.setAttribute("class", "fav-star");
        star.textContent = "★";
        svg.appendChild(star);
    });
}

// ===== HARİTA =====
function loadMap() {
    if (geoData) {
        buildMap();
        updateMapColors(getInfo());
        return;
    }

    fetch('turkey.json')
        .then(function (response) {
            if (!response.ok) throw new Error('turkey.json bulunamadı!');
            return response.json();
        })
        .then(function (data) {
            geoData = data;
            buildMap();
            updateMapColors(getInfo());
        })
        .catch(function (err) {
            console.error("❌ Harita hatası:", err);
            document.getElementById('mapWrap').innerHTML =
                '<div class="map-error"><h3>⚠️ Harita yüklenemedi</h3><p>turkey.json dosyası bulunamadı.</p></div>';
        });
}

function buildMap() {
    var features = geoData.features || geoData;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    features.forEach(function (feature) {
        var coords = getCoords(feature.geometry);
        coords.forEach(function (poly) {
            poly.forEach(function (point) {
                if (point[0] < minX) minX = point[0];
                if (point[0] > maxX) maxX = point[0];
                if (point[1] < minY) minY = point[1];
                if (point[1] > maxY) maxY = point[1];
            });
        });
    });

    var mapWidth = 1000, mapHeight = 450;
    var scale = Math.min(mapWidth / (maxX - minX), mapHeight / (maxY - minY));

    function projectX(lon) { return (lon - minX) * scale; }
    function projectY(lat) { return mapHeight - (lat - minY) * scale; }

    var svgStr = '<svg id="mapSvg" viewBox="0 0 ' + mapWidth + ' ' + mapHeight + '" xmlns="http://www.w3.org/2000/svg">';
    var labelPositions = [];

    features.forEach(function (feature) {
        var props = feature.properties || {};
        var name = (props.name || props.NAME_1 || props.name_tr || props.NAME || '').toLowerCase().trim();
        name = name.replace(/i̇/g, 'i');
        var plate = CITY_NAME_TO_PLATE[name];
        if (!plate) return;

        var coords = getCoords(feature.geometry);
        var pathStr = '';
        var cx = 0, cy = 0, count = 0;

        coords.forEach(function (poly) {
            var first = true;
            poly.forEach(function (point) {
                var x = projectX(point[0]);
                var y = projectY(point[1]);
                pathStr += (first ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
                first = false;
                cx += x;
                cy += y;
                count++;
            });
            pathStr += 'Z ';
        });

        cx /= count;
        cy /= count;

        svgStr += '<path data-plate="' + plate + '" d="' + pathStr + '" class="remaining"/>';
        labelPositions.push({ plate: plate, x: cx, y: cy });
    });

    labelPositions.forEach(function (lp) {
        svgStr += '<text x="' + lp.x.toFixed(1) + '" y="' + lp.y.toFixed(1) + '" ' +
                  'text-anchor="middle" dominant-baseline="middle" ' +
                  'font-family="Bebas Neue, sans-serif" font-size="9" ' +
                  'fill="rgba(255,255,255,0.9)" pointer-events="none" ' +
                  'style="text-shadow: 0 1px 2px rgba(0,0,0,0.8);">' + lp.plate + '</text>';
    });

    svgStr += '</svg>';
    document.getElementById('mapWrap').innerHTML = svgStr;
    attachMapEvents();
    updateMapFavorites();
}

function getCoords(geometry) {
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return geometry.coordinates;
    if (geometry.type === 'MultiPolygon') {
        var result = [];
        geometry.coordinates.forEach(function (polygon) {
            polygon.forEach(function (ring) { result.push(ring); });
        });
        return result;
    }
    return [];
}

function attachMapEvents() {
    var tooltip = document.getElementById('tooltip');
    var paths = document.querySelectorAll('#mapSvg path');

    for (var i = 0; i < paths.length; i++) {
        (function (path) {
            path.addEventListener('mouseenter', function () {
                var pc = path.getAttribute('data-plate');
                var city = findCity(parseInt(pc));
                if (!city) return;
                var I = getInfo();
                var pn = parseInt(pc);

                document.getElementById('ttPlate').textContent = city.p;
                document.getElementById('ttName').textContent = city.n;
                document.getElementById('ttQuote').textContent = '"' + city.q + '"';

                var st = '';
                if (I.finished) st = '✅ Tamamlandı';
                else if (!I.inPlatePhase) st = '⏳ İl sayacı başlamadı';
                else if (pn > I.currentPlate) st = '✅ Tamamlandı';
                else if (pn === I.currentPlate) st = '📍 Bugün';
                else st = '⏳ Bekliyor';

                var armyDay = I.waitDays + (81 - pn) + 1;
                document.getElementById('ttStatus').textContent = 'Askerliğin ' + armyDay + '. günü · ' + st;
                tooltip.style.display = 'block';
            });

            path.addEventListener('mousemove', function (e) {
                tooltip.style.left = Math.min(e.clientX + 15, window.innerWidth - 290) + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
            });

            path.addEventListener('mouseleave', function () {
                tooltip.style.display = 'none';
            });

            path.addEventListener('click', function (e) {
                e.stopPropagation();
                var pc = path.getAttribute('data-plate');
                var city = findCity(parseInt(pc));
                if (!city) return;
                var I = getInfo();
                var pn = parseInt(pc);
                var armyDay = I.waitDays + (81 - pn) + 1;
                openModal(city, pn, armyDay, I);
            });
        })(paths[i]);
    }
}

function updateMapColors(I) {
    var paths = document.querySelectorAll('#mapSvg path');
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        var plate = parseInt(path.getAttribute('data-plate'));
        path.classList.remove('completed', 'current', 'remaining');

        if (!I.inPlatePhase && !I.finished) {
            path.classList.add('remaining');
        } else if (I.finished) {
            path.classList.add('completed');
        } else if (plate > I.currentPlate) {
            path.classList.add('completed');
        } else if (plate === I.currentPlate) {
            path.classList.add('current');
        } else {
            path.classList.add('remaining');
        }
    }
}

function renderHistory(I) {
    var list = document.getElementById('histList');
    list.innerHTML = '';

    if (!I.inPlatePhase && !I.finished) {
        list.innerHTML = '<p class="empty-msg">İl sayacı henüz başlamadı.</p>';
        return;
    }

    var showUntil = I.finished ? 1 : I.currentPlate;

    for (var plate = 81; plate >= showUntil; plate--) {
        var city = findCity(plate);
        if (!city) continue;

        var armyDay = I.waitDays + (81 - plate) + 1;
        var d = new Date(I.startDate);
        d.setDate(d.getDate() + (armyDay - 1));

        var statusText = '';
        if (I.finished || plate > I.currentPlate) statusText = '✅';
        else if (plate === I.currentPlate) statusText = '📍';

        var item = document.createElement('div');
        item.className = 'hist-item';
        item.innerHTML = '<div class="hp">' + city.p + '</div><div class="hi"><div class="hc">' + statusText + ' ' + city.n + '</div><div class="hq">"' + city.q + '"</div></div><div><div class="hdl">' + armyDay + '. Gün</div><div class="hd">' + formatDate(d) + '</div></div>';

        (function (c, p, a, info) {
            item.addEventListener('click', function () {
                openModal(c, p, a, info);
            });
        })(city, plate, armyDay, I);

        list.appendChild(item);
    }
}

function openModal(city, plateNum, armyDay, info) {
    if (document.body.classList.contains('map-fullscreen')) {
        showFsInfo(city, plateNum, armyDay, info);
        return;
    }

    currentModalCity = { city: city, plate: plateNum };

    document.getElementById('mPlate').textContent = city.p;
    if (plateNum === info.currentPlate && !info.finished) {
        document.getElementById('mPlate').style.color = '#fbbf24';
    } else {
        document.getElementById('mPlate').style.color = '#4ade80';
    }
    document.getElementById('mName').textContent = city.n;
    document.getElementById('mQuote').textContent = '"' + city.q + '"';

    var d = new Date(info.startDate);
    d.setDate(d.getDate() + (armyDay - 1));
    document.getElementById('mDay').textContent = armyDay + '. Gün / ' + info.effectiveTotal + ' · ' + formatDate(d);

    var s = document.getElementById('mStatus');
    if (info.finished || plateNum > info.currentPlate) {
        s.textContent = '✅ Tamamlandı';
        s.className = 'ms done';
    } else if (plateNum === info.currentPlate) {
        s.textContent = '📍 Bugün';
        s.className = 'ms now';
    } else {
        s.textContent = '⏳ Bekliyor';
        s.className = 'ms wait';
    }
        // Modal border rengini duruma göre ayarla
    var modalBox = document.querySelector('#modal .modal-box');
    if (info.finished || plateNum > info.currentPlate) {
        modalBox.style.borderColor = '#22c55e';
    } else if (plateNum === info.currentPlate) {
        modalBox.style.borderColor = '#f59e0b';
    } else {
        modalBox.style.borderColor = '#2d4a3e';
    }

    updateFavButton(plateNum);
    document.getElementById('modal').classList.add('active');
}
function showFsInfo(city, plateNum, armyDay, info) {
    var fsInfo = document.getElementById('mapFsInfo');

    document.getElementById('fsiPlate').textContent = city.p;
    document.getElementById('fsiName').textContent = city.n;
    document.getElementById('fsiQuote').textContent = '"' + city.q + '"';

    var d = new Date(info.startDate);
    d.setDate(d.getDate() + (armyDay - 1));
    document.getElementById('fsiDay').textContent = armyDay + '. Gün · ' + formatDate(d);

    var statusEl = document.getElementById('fsiStatus');
    fsInfo.classList.remove('status-completed', 'status-current', 'status-waiting');

    if (info.finished || plateNum > info.currentPlate) {
        statusEl.textContent = '✅ Tamamlandı';
        fsInfo.classList.add('status-completed');
    } else if (plateNum === info.currentPlate) {
        statusEl.textContent = '📍 Bugün';
        fsInfo.classList.add('status-current');
    } else {
        statusEl.textContent = '⏳ Bekliyor';
        fsInfo.classList.add('status-waiting');
    }

    fsInfo.classList.add('active');
}

function hideFsInfo() {
    document.getElementById('mapFsInfo').classList.remove('active');
}
function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function formatDate(d) {
    var months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// ===== HARİTA TAM EKRAN =====
function toggleMapFullscreen() {
    document.body.classList.toggle('map-fullscreen');
}

function closeMapFullscreen() {
    hideFsInfo();
    document.body.classList.remove('map-fullscreen');
}

document.getElementById('mapFsBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMapFullscreen();
});

document.getElementById('mapFsClose').addEventListener('click', function (e) {
    e.stopPropagation();
    closeMapFullscreen();
});

document.getElementById('mapWrap').addEventListener('click', function (e) {
    if (e.target.tagName !== 'path' && e.target.tagName !== 'text' && e.target.tagName !== 'svg') {
        toggleMapFullscreen();
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMapFullscreen();
});

// ===== PROFİL AKTARMA (DIŞA / İÇE) =====

function encodeProfile(profile) {
    try {
        var data = JSON.stringify(profile);
        return btoa(unescape(encodeURIComponent(data)));
    } catch (e) {
        console.error('Encode hatası:', e);
        return null;
    }
}

function decodeProfile(code) {
    try {
        var cleaned = code.trim();
        var data = decodeURIComponent(escape(atob(cleaned)));
        return JSON.parse(data);
    } catch (e) {
        console.error('Decode hatası:', e);
        return null;
    }
}

function showExportModal() {
    var profiles = getAllProfiles();
    if (profiles.length === 0) {
        alert('Dışa aktarılacak profil bulunamadı!');
        return;
    }

    var select = document.getElementById('exportSelect');
    select.innerHTML = '<option value="all">📦 Tüm Profiller (' + profiles.length + ')</option>';
    profiles.forEach(function (p, idx) {
        var months = getMonths(p);
        select.innerHTML += '<option value="' + idx + '">' + p.name + ' (' + (months === 12 ? 'Uzun' : 'Kısa') + ')</option>';
    });

    updateExportCode();
    select.onchange = updateExportCode;

    document.getElementById('exportModal').classList.add('active');
}

function updateExportCode() {
    var profiles = getAllProfiles();
    var select = document.getElementById('exportSelect');
    var val = select.value;
    var code = '';

    if (val === 'all') {
        code = encodeProfile(profiles);
    } else {
        var idx = parseInt(val);
        code = encodeProfile([profiles[idx]]);
    }

    document.getElementById('exportCode').value = code || 'Hata oluştu!';
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('active');
}

function copyExportCode() {
    var codeEl = document.getElementById('exportCode');
    var code = codeEl.value;
    var btn = document.getElementById('copyCodeBtn');

    if (!code || code === 'Hata oluştu!') {
        alert('Kopyalanacak kod bulunamadı!');
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () {
            showCopySuccess(btn);
        }).catch(function () {
            fallbackCopy(codeEl, btn);
        });
    } else {
        fallbackCopy(codeEl, btn);
    }
}

function fallbackCopy(textareaEl, btn) {
    textareaEl.select();
    textareaEl.setSelectionRange(0, 99999);
    try {
        document.execCommand('copy');
        showCopySuccess(btn);
    } catch (e) {
        alert('Kopyalama başarısız. Kodu manuel olarak seçip kopyalayın.');
    }
}

function showCopySuccess(btn) {
    var originalText = btn.textContent;
    btn.textContent = '✅ KOPYALANDI!';
    btn.classList.add('copy-success');
    setTimeout(function () {
        btn.textContent = originalText;
        btn.classList.remove('copy-success');
    }, 2000);
}

function showImportModal() {
    document.getElementById('importCode').value = '';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importModal').classList.add('active');

    document.getElementById('importCode').oninput = previewImport;
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('active');
}

function previewImport() {
    var code = document.getElementById('importCode').value.trim();
    var preview = document.getElementById('importPreview');

    if (!code) {
        preview.style.display = 'none';
        return;
    }

    var decoded = decodeProfile(code);
    if (!decoded) {
        preview.style.display = 'block';
        preview.innerHTML = '<div style="color:#fca5a5;text-align:center">❌ Geçersiz kod! Kodu kontrol edin.</div>';
        return;
    }

    var profiles = Array.isArray(decoded) ? decoded : [decoded];

    var html = '<div class="ip-title">✅ ' + profiles.length + ' Profil Bulundu</div>';

    profiles.forEach(function (p) {
        var months = p.durationType || (p.duration === 365 ? 12 : 6);
        var realDays = p.duration || calculateRealDuration(p.startDate, months);

        html += '<div class="ip-row"><span class="ip-label">Ad:</span><span class="ip-value">' + (p.name || 'Bilinmiyor') + '</span></div>';
        html += '<div class="ip-row"><span class="ip-label">Dönem:</span><span class="ip-value">' + (months === 12 ? 'Uzun (12 ay)' : 'Kısa (6 ay)') + '</span></div>';
        html += '<div class="ip-row"><span class="ip-label">Başlangıç:</span><span class="ip-value">' + (p.startDate || '-') + '</span></div>';
        html += '<div class="ip-row"><span class="ip-label">Süre:</span><span class="ip-value">' + realDays + ' gün</span></div>';
    });

    preview.style.display = 'block';
    preview.innerHTML = html;
}

function importProfile2() {
    var code = document.getElementById('importCode').value.trim();

    if (!code) {
        alert('Lütfen aktarım kodunu yapıştırın!');
        return;
    }

    var decoded = decodeProfile(code);
    if (!decoded) {
        alert('Geçersiz kod! Kodu kontrol edip tekrar deneyin.');
        return;
    }

    var profiles = Array.isArray(decoded) ? decoded : [decoded];
    var existingProfiles = getAllProfiles();
    var imported = 0;

    profiles.forEach(function (p) {
        p.id = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) + '_imp';

        if (!p.durationType) {
            p.durationType = (p.duration === 365) ? 12 : 6;
            p.duration = calculateRealDuration(p.startDate, p.durationType);
        }
        if (typeof p.dagitimGun === 'undefined') {
            if (p.dagitim === 1 || p.dagitim === 3) {
                p.dagitimGun = 3;
            } else {
                p.dagitimGun = 0;
            }
        }
        if (typeof p.yolAcemilik === 'undefined') {
            p.yolAcemilik = p.yol || 1;
        }
        if (typeof p.yolTerhis === 'undefined') {
            p.yolTerhis = p.yol || 1;
        }
        if (typeof p.usedIzin === 'undefined') p.usedIzin = 0;
        if (typeof p.mazeretIzin === 'undefined') p.mazeretIzin = 0;
        if (typeof p.saglikGun === 'undefined') p.saglikGun = 0;
        if (typeof p.saglikSayilan === 'undefined') p.saglikSayilan = 0;
        if (typeof p.mehil === 'undefined') p.mehil = 1;
        if (typeof p.katilisDate === 'undefined') p.katilisDate = null;
        if (!p.cezalar) p.cezalar = [];
        if (!p.favorites) p.favorites = [];

        existingProfiles.push(p);
        imported++;
    });

    saveAllProfiles(existingProfiles);
    closeImportModal();
    renderProfileList();

    alert('✅ ' + imported + ' profil başarıyla aktarıldı!');
}

// Profil aktarma event listeners
document.getElementById('exportBtn').addEventListener('click', showExportModal);
document.getElementById('importBtn').addEventListener('click', showImportModal);

document.getElementById('exportClose').addEventListener('click', closeExportModal);
document.getElementById('cancelExport').addEventListener('click', closeExportModal);
document.getElementById('exportModal').addEventListener('click', function (e) {
    if (e.target.id === 'exportModal') closeExportModal();
});
document.getElementById('copyCodeBtn').addEventListener('click', copyExportCode);

document.getElementById('importClose').addEventListener('click', closeImportModal);
document.getElementById('cancelImport').addEventListener('click', closeImportModal);
document.getElementById('importModal').addEventListener('click', function (e) {
    if (e.target.id === 'importModal') closeImportModal();
});
document.getElementById('importProfileBtn').addEventListener('click', importProfile2);
document.getElementById('fsiClose').addEventListener('click', function (e) {
    e.stopPropagation();
    hideFsInfo();
});