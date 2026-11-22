const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS2PoCLYeVUTmqthOrhjVJ6f22cGQo0xMcvOv_OFBXTqHAHg9TqmW_yVgxM5FI-j5VxVnnqXatI07X-/pub?output=csv';

// HIER DEINE GOOGLE APPS SCRIPT WEB-APP URL FÜR DAS ADMIN-MENÜ EINTRAGEN:
const ADMIN_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwgCpDNwwoVAEc0SB4X7iY2EyO7Jd7QHWBLSazjw1jQFHK39fUBc1oMaGBry_8UITlK/exec';

let allVocabs = [];

async function loadData() {
    const indicator = document.getElementById('mode-indicator');
    const cachedData = localStorage.getItem('cachedVocabs');

    if (cachedData) {
        processData(cachedData);
        if (indicator) indicator.innerText = "Suche nach Updates...";
    }

    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error();
        const csv = await response.text();

        if (csv !== cachedData) {
            localStorage.setItem('cachedVocabs', csv);
            processData(csv);
            if (indicator) indicator.innerText = "Daten aktuell! (Online)";
        } else {
            if (indicator) indicator.innerText = "Online (Aktuell)";
        }
    } catch (e) {
        if (indicator) {
            indicator.innerText = cachedData ? "Offline-Modus (Cache geladen)" : "Kein Internet & kein Cache!";
        }
    }
}

function processData(csv) {
    const lines = csv.split(/\r?\n/).filter(l => l.trim() !== "");
    allVocabs = lines.slice(1).map(line => {
        const row = line.match(/(".*?"|[^",;]+)(?=\s*[;,]|\s*$)/g);
        if (row && row.length >= 2) {
            return {
                foreign: row[0].replace(/^"|"$/g, '').trim(),
                ger: row[1].replace(/^"|"$/g, '').trim(),
                page: row[2]?.replace(/^"|"$/g, '').trim() || "0",
                hint: row[3]?.replace(/^"|"$/g, '').trim() || "",
                showInstant: row[4]?.trim().toLowerCase() === 'x',
                lang: row[5]?.replace(/^"|"$/g, '').trim() || "Englisch",
                grade: row[6]?.replace(/^"|"$/g, '').trim() || "6"
            };
        }
        return null;
    }).filter(v => v);

    initFilters();

    const btn = document.getElementById('btn-all');
    if (btn) {
        btn.disabled = false;
        btn.classList.replace('bg-slate-300', 'bg-blue-600');
    }
}

// --- FILTER-STEUERUNG (SPRACHE -> KLASSE -> SEITE) ---
function initFilters() {
    const langs = [...new Set(allVocabs.map(v => v.lang))].sort();
    const lS = document.getElementById('lang-select');
    if (!lS) return;

    const prevLang = lS.value;
    lS.innerHTML = langs.map(l => `<option value="${l}">${l}</option>`).join('');
    if (langs.includes(prevLang)) lS.value = prevLang;

    updateClassAndPageFilters();
}

function updateClassAndPageFilters() {
    const selLang = document.getElementById('lang-select').value;
    const filteredByLang = allVocabs.filter(v => v.lang === selLang);

    const grades = [...new Set(filteredByLang.map(v => v.grade))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const cS = document.getElementById('class-select');
    if (!cS) return;

    const prevGrade = cS.value;
    cS.innerHTML = '<option value="">Alle Klassen</option>' +
                   grades.map(g => `<option value="${g}">Klasse ${g}</option>`).join('');
    if (grades.includes(prevGrade)) cS.value = prevGrade;

    updatePageFilterOnly();
}

function updatePageFilterOnly() {
    const selLang = document.getElementById('lang-select').value;
    const selGrade = document.getElementById('class-select').value;

    const filtered = allVocabs.filter(v =>
        v.lang === selLang && (selGrade === "" || String(v.grade) === String(selGrade))
    );

    const pages = [...new Set(filtered.map(v => v.page))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const mS = document.getElementById('page-select');
    const pS = document.getElementById('print-page-select');

    const optionsHTML = '<option value="">Alle Seiten</option>' +
                        pages.map(p => `<option value="${p}">Seite ${p}</option>`).join('');

    if (mS) mS.innerHTML = optionsHTML;
    if (pS) pS.innerHTML = optionsHTML;
}

// --- ADMIN-MENÜ FUNKTIONEN ---
function openAdminModal() {
    const currentLang = document.getElementById('lang-select')?.value || "Englisch";
    const currentGrade = document.getElementById('class-select')?.value || "6";

    document.getElementById('adm-lang').value = currentLang;
    if (currentGrade !== "") document.getElementById('adm-grade').value = currentGrade;

    document.getElementById('adm-status').classList.add('hidden');
    document.getElementById('admin-modal').classList.remove('hidden');
    document.getElementById('adm-foreign').focus();
}

function closeAdminModal() {
    document.getElementById('admin-modal').classList.add('hidden');
}

async function saveNewVocab() {
    const foreign = document.getElementById('adm-foreign').value.trim();
    const ger = document.getElementById('adm-ger').value.trim();
    const page = document.getElementById('adm-page').value.trim() || "0";
    const hint = document.getElementById('adm-hint').value.trim();
    const showInstant = document.getElementById('adm-instant').checked;
    const lang = document.getElementById('adm-lang').value.trim() || "Englisch";
    const grade = document.getElementById('adm-grade').value.trim() || "6";

    const statusEl = document.getElementById('adm-status');
    const saveBtn = document.getElementById('adm-save-btn');

    if (!foreign || !ger) {
        statusEl.innerText = "Bitte mindestens Fremdsprache & Deutsch ausfüllen!";
        statusEl.className = "text-xs font-bold text-center text-red-600";
        statusEl.classList.remove('hidden');
        return;
    }

    const newEntry = { foreign, ger, page, hint, showInstant, lang, grade };

    allVocabs.push(newEntry);
    initFilters();

    saveBtn.disabled = true;
    saveBtn.innerText = "Speichere...";

    if (ADMIN_SCRIPT_URL && ADMIN_SCRIPT_URL.startsWith('http')) {
        try {
            await fetch(ADMIN_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry)
            });
            statusEl.innerText = "Gespeichert & an Google Sheet gesendet! ✓";
            statusEl.className = "text-xs font-bold text-center text-green-600";
        } catch (err) {
            statusEl.innerText = "Lokal gespeichert (Offline - Sheet-Sync fehlgeschlagen)";
            statusEl.className = "text-xs font-bold text-center text-amber-600";
        }
    } else {
        statusEl.innerText = "Lokal gespeichert! (Für Sheet-Sync noch Script-URL eintragen)";
        statusEl.className = "text-xs font-bold text-center text-amber-600";
    }

    statusEl.classList.remove('hidden');
    saveBtn.disabled = false;
    saveBtn.innerText = "Speichern";

    document.getElementById('adm-foreign').value = "";
    document.getElementById('adm-ger').value = "";
    document.getElementById('adm-hint').value = "";
    document.getElementById('adm-instant').checked = false;
    document.getElementById('adm-foreign').focus();
}