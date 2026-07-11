/* =============================================
   ASKER ŞAFAK HARİTASI - UYGULAMA
   Çoklu Profil + İzin + Ceza Sistemi
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

// ===== İZİN HAKKI HESABI =====
function getTotalIzinHakki(duration) {
    if (duration === 180) return 6;
    return 6 + 12; // 18 gün
}

// ===== SÜREYE GÖRE FORM GRUPLARI =====
function toggleDurationGroups() {
    var checked = document.querySelector('input[name="duration"]:checked');
    if (!checked) return;
    var duration = parseInt(checked.value);

    var mehilGroup = document.getElementById('mehilGroup');
    var dagitimGroup = document.getElementById('dagitimGroup');

    if (duration === 365) {
        // UZUN DÖNEM: Mehil göster, dağıtım gizle
        if (mehilGroup) mehilGroup.style.display = '';
        if (dagitimGroup) dagitimGroup.style.display = 'none';
    } else {
        // KISA DÖNEM: Dağıtım göster, mehil gizle
        if (mehilGroup) mehilGroup.style.display = 'none';
        if (dagitimGroup) dagitimGroup.style.display = '';
    }
}

function updateIzinInfoText() {
    var checked = document.querySelector('input[name="duration"]:checked');
    if (!checked) return;
    var duration = parseInt(checked.value);
    var text = document.getElementById('izinInfoText');
    if (!text) return;
    if (duration === 180) {
        text.innerHTML = '💡 İzin hakkı: 6 ay için ayda 1 gün = <b>Toplam 6 gün</b>. Kullanmadığın günler şafaktan düşülür.';
    } else {
        text.innerHTML = '💡 İzin hakkı: İlk 6 ay ayda 1 gün (6 gün) + Son 6 ay ayda 2 gün (12 gün) = <b>Toplam 18 gün</b>. Kullanmadığın günler şafaktan düşülür.';
    }
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

        var card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML =
            '<div class="p-avatar">' + initial + '</div>' +
            '<div class="p-info">' +
                '<div class="p-name">' + p.name + '</div>' +
                '<div class="p-details">' + (p.duration === 365 ? 'Uzun Dönem' : 'Kısa Dönem') + ' · ' + formatDate(new Date(p.startDate)) + '</div>' +
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
    var duration = parseInt(document.querySelector('input[name="duration"]:checked').value);
    var usedIzin = parseInt(document.getElementById('usedIzin').value) || 0;

    // Yol izni her zaman alınır
    var yol = parseInt(document.querySelector('input[name="yol"]:checked').value);

    // Dağıtım izni: Sadece kısa dönemde sorulur
    // dagitim = 0 → kullanılmadı (3 gün şafaktan düşülür)
    // dagitim = 1 → kullanıldı (etki yok)
    var dagitim = 0;
    if (duration === 180) {
        var dagitimVal = parseInt(document.querySelector('input[name="dagitim"]:checked').value);
        // Radio'da value=0 "kullanılmadı", value=3 "kullanıldı" olarak ayarlı
        // Biz bunu 0=kullanılmadı, 1=kullanıldı olarak kaydedeceğiz
        dagitim = (dagitimVal === 3) ? 1 : 0;
    }

    // Mehil izni: Sadece uzun dönemde sorulur
    var mehil = 0;
    if (duration === 365) {
        var mehilChecked = document.querySelector('input[name="mehil"]:checked');
        mehil = mehilChecked ? parseInt(mehilChecked.value) : 1;
    }

    if (!name) {
        alert('Lütfen ad soyad girin!');
        return;
    }

    if (!startDateVal) {
        alert('Lütfen başlangıç tarihi seçin!');
        return;
    }

    var maxIzin = getTotalIzinHakki(duration);
    if (usedIzin < 0) usedIzin = 0;
    if (usedIzin > maxIzin) {
        alert('Kullanılan izin, hak edilen izinden (' + maxIzin + ' gün) fazla olamaz!');
        return;
    }

    var profile = {
        id: 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: name,
        startDate: startDateVal,
        duration: duration,
        dagitim: dagitim,       // 0 = kullanılmadı, 1 = kullanıldı (sadece kısa dönem)
        yol: yol,
        mehil: mehil,           // 1 = kullanıldı, 0 = kullanılmadı (sadece uzun dönem)
        usedIzin: usedIzin,
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
    if (!profile.cezalar) profile.cezalar = [];
    if (!profile.favorites) profile.favorites = [];

    currentProfile = profile;
    localStorage.setItem('safak_active_profile', profile.id);

    document.getElementById('userNameHeader').textContent = '🎖️ ' + profile.name.toUpperCase();
    document.getElementById('userDurationHeader').textContent =
        (profile.duration === 365 ? 'UZUN DÖNEM (12 AY)' : 'KISA DÖNEM (6 AY)') + ' · ' + profile.duration + ' GÜN';
    document.getElementById('totalDaysLabel').textContent = profile.duration;

    showMainScreen();
}

// ===== HESAPLAMALAR =====
function calculateInfo(profile) {
    if (typeof profile.usedIzin === 'undefined') profile.usedIzin = 0;
    if (typeof profile.mehil === 'undefined') profile.mehil = 1;
    if (!profile.cezalar) profile.cezalar = [];

    var startDate = new Date(profile.startDate + 'T00:00:00');
    var now = new Date();
    now.setHours(0, 0, 0, 0);

    // Toplam ceza
    var totalCeza = profile.cezalar.reduce(function (sum, c) { return sum + c.gun; }, 0);

    // İzin hesabı
    var totalIzinHakki = getTotalIzinHakki(profile.duration);
    var usedIzin = profile.usedIzin || 0;
    var unusedIzin = Math.max(0, totalIzinHakki - usedIzin);

    // === HESAPLAMA MANTIĞI ===
    var dagitimEkle = 0;
    var yolIndirim = 0;
    var mehilAktif = false;

    if (profile.duration === 365) {
        // === UZUN DÖNEM (12 AY) ===
        if (profile.mehil === 1) {
            mehilAktif = true;
        } else {
            yolIndirim = profile.yol || 0;
        }
    } else {
        // === KISA DÖNEM (6 AY) ===
        // Yol izni her zaman düşülür
        yolIndirim = profile.yol || 0;

        // Dağıtım izni:
        // Kullanıldıysa → 3 gün şafağa EKLENİR (askerlik uzar)
        // Kullanılmadıysa → etki yok
        var dagitimKullanildi = (profile.dagitim === 1 || profile.dagitim === 3);
        if (dagitimKullanildi) {
            dagitimEkle = 3;
        }
    }

    var totalIndirim = unusedIzin + yolIndirim;

    // Efektif toplam gün
    var effectiveTotal = profile.duration + totalCeza + dagitimEkle - totalIndirim;
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
        effectiveTotal: effectiveTotal,
        waitDays: waitDays,
        currentPlate: currentPlate,
        inPlatePhase: inPlatePhase,
        inWaitPhase: inWaitPhase,
        notStarted: notStarted,
        finished: finished,
        totalCeza: totalCeza,
        totalIzinHakki: totalIzinHakki,
        usedIzin: usedIzin,
        unusedIzin: unusedIzin,
        yolIndirim: yolIndirim,
        dagitimEkle: dagitimEkle,
        totalIndirim: totalIndirim,
        mehilAktif: mehilAktif
    };
}

function getInfo() {
    return calculateInfo(currentProfile);
}

// ===== GÜNCELLEME =====
function update() {
    if (!currentProfile) return;

    var I = getInfo();

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

    // Extra bilgiler
    var dagitimBox = document.getElementById('dagitimBox');
    var yolBox = document.getElementById('yolBox');
    var mehilBox = document.getElementById('mehilBox');

    if (currentProfile.duration === 365) {
        // UZUN DÖNEM: Dağıtım kutusu her zaman gizli
        dagitimBox.style.display = 'none';

        if (I.mehilAktif) {
            // Mehil aktif: yol da gizli, mehil göster
            yolBox.style.display = 'none';
            mehilBox.style.display = '';
            document.getElementById('extraMehil').textContent = 'Askerlikten sayılır ✓';
        } else {
            // Mehil yok: yol göster, mehil gizle
            yolBox.style.display = '';
            mehilBox.style.display = 'none';
            document.getElementById('extraYol').textContent = '-' + I.yolIndirim + ' gün ✂️';
        }
    } else {
        // KISA DÖNEM: Dağıtım ve yol göster, mehil gizle
        dagitimBox.style.display = '';
        yolBox.style.display = '';
        mehilBox.style.display = 'none';

        // Dağıtım kutusu yazısı
        var dagitimKullanildi = (currentProfile.dagitim === 1 || currentProfile.dagitim === 3);
        document.getElementById('extraDagitim').textContent =
            dagitimKullanildi ? 'Kullanıldı ✓' : '-3 gün ✂️';

        document.getElementById('extraYol').textContent = '-' + I.yolIndirim + ' gün ✂️';
    }
            // Dağıtım kutusu rengini güncelle
    if (dagitimKullanildi) {
        dagitimBox.classList.remove('positive');
        dagitimBox.classList.add('negative');
    } else {
        dagitimBox.classList.remove('negative');
        dagitimBox.classList.add('positive');
    }

    document.getElementById('extraIzin').textContent =
        I.unusedIzin > 0 ? '-' + I.unusedIzin + ' gün ✂️' : I.usedIzin + '/' + I.totalIzinHakki + ' ✓';
    document.getElementById('extraCeza').textContent = '+' + I.totalCeza + ' gün';
    document.getElementById('cezaBoxWrapper').classList.toggle('has-ceza', I.totalCeza > 0);

    // Özet satırı
    var summaryText = 'Askerlik: <b>' + currentProfile.duration + '</b> gün';
    if (I.dagitimEkle > 0) summaryText += ' <span class="plus">+ ' + I.dagitimEkle + ' dağıtım</span>';
    if (I.totalCeza > 0) summaryText += ' <span class="plus">+ ' + I.totalCeza + ' ceza</span>';
    if (I.totalIndirim > 0) summaryText += ' <span class="neg">− ' + I.totalIndirim + ' izin/yol</span>';
    summaryText += ' = <b>' + I.effectiveTotal + ' gün</b> efektif askerlik';
    if (I.mehilAktif) {
        summaryText += '<br><small style="color:#60a5fa">🏠 Mehil izni askerlikten sayıldı, dağıtım ve yol izni dahil</small>';
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
    document.getElementById('cezaGun').value = '6';
    document.getElementById('cezaSebep').value = '';
    document.getElementById('cezaModal').classList.add('active');
}

function closeCezaModal() {
    document.getElementById('cezaModal').classList.remove('active');
}

function saveCeza() {
    var gun = parseInt(document.getElementById('cezaGun').value);
    var sebep = document.getElementById('cezaSebep').value.trim();

    if (isNaN(gun) || gun < 6) {
        alert('Ceza en az 6 gün olmalıdır!');
        return;
    }

    var ceza = {
        gun: gun,
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
                '<div class="ci-days">' + ceza.gun + ' GÜN</div>' +
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

    var totalHakki = getTotalIzinHakki(currentProfile.duration);
    document.getElementById('izinInfoLabel').innerHTML =
        'Toplam izin hakkın: <b>' + totalHakki + ' gün</b><br>' +
        'Kullanmadığın günler şafaktan düşülür.';

    var input = document.getElementById('editUsedIzin');
    input.value = currentProfile.usedIzin || 0;
    input.max = totalHakki;

    updateIzinPreview();
    input.oninput = updateIzinPreview;

    document.getElementById('izinModal').classList.add('active');
}

function closeIzinModal() {
    document.getElementById('izinModal').classList.remove('active');
}

function updateIzinPreview() {
    var val = parseInt(document.getElementById('editUsedIzin').value) || 0;
    var totalHakki = getTotalIzinHakki(currentProfile.duration);
    var kullanilmayan = Math.max(0, totalHakki - val);

    document.getElementById('izinPreview').innerHTML =
        '<div class="prev-row"><span>Toplam Hak:</span><span class="val">' + totalHakki + ' gün</span></div>' +
        '<div class="prev-row"><span>Kullanılan:</span><span class="val">' + val + ' gün</span></div>' +
        '<div class="prev-row"><span>Kullanılmayan (şafaktan düşülecek):</span><span class="val neg">-' + kullanilmayan + ' gün</span></div>';
}

function saveIzin() {
    var val = parseInt(document.getElementById('editUsedIzin').value) || 0;
    var totalHakki = getTotalIzinHakki(currentProfile.duration);

    if (val < 0) {
        alert('İzin sayısı 0\'dan küçük olamaz!');
        return;
    }
    if (val > totalHakki) {
        alert('Kullanılan izin, hak edilen izinden (' + totalHakki + ' gün) fazla olamaz!');
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

            path.addEventListener('click', function () {
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
    currentModalCity = { city: city, plate: plateNum };

    document.getElementById('mPlate').textContent = city.p;
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

    updateFavButton(plateNum);
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function formatDate(d) {
    var months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}