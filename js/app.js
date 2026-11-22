let state = { queue: [], currentIndex: 0, score: 0, history: [] };

function setupGame(mode) {
    const selLang = document.getElementById('lang-select').value;
    const selGrade = document.getElementById('class-select').value;
    const selPage = document.getElementById('page-select').value;
    const mix = document.getElementById('mix-mode-toggle').checked;

    let filtered = allVocabs.filter(v => {
        const matchLang = v.lang === selLang;
        const matchGrade = (selGrade === "") || (String(v.grade) === String(selGrade));
        const matchPage = (selPage === "") || (String(v.page) === String(selPage));
        return matchLang && matchGrade && matchPage;
    });

    if (filtered.length === 0) {
        alert("Keine Vokabeln für diese Auswahl gefunden!");
        return;
    }

    state.queue = filtered.sort(() => Math.random() - 0.5).map(v => {
        const swap = mix && Math.random() > 0.5;
        return {
            q: swap ? v.foreign : v.ger,
            a: swap ? v.ger : v.foreign,
            dir: swap ? "Deutsch" : v.lang,
            orig: v
        };
    });

    state.currentIndex = 0;
    state.score = 0;
    state.history = [];

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('score-display').classList.remove('hidden');
    updateUI();
}

function updateUI() {
    const curr = state.queue[state.currentIndex];
    document.getElementById('dir-label').innerText = `Übersetze ins ${curr.dir}`;
    document.getElementById('q-text').innerText = curr.q;

    const hA = document.getElementById('hint-area'), hB = document.getElementById('h-box'), hBtn = document.getElementById('h-btn');
    if (curr.orig.hint) {
        hA.classList.remove('hidden');
        hB.innerText = curr.orig.hint;
        if (curr.orig.showInstant) { hB.classList.remove('hidden'); hBtn.classList.add('hidden'); }
        else { hB.classList.add('hidden'); hBtn.classList.remove('hidden'); }
    } else {
        hA.classList.add('hidden');
    }

    const inputEl = document.getElementById('user-input');
    inputEl.value = "";
    inputEl.readOnly = false;
    document.getElementById('feedback-area').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('check-btn').classList.remove('hidden');
    document.getElementById('score-display').innerText = `${state.currentIndex + 1}/${state.queue.length}`;
    document.getElementById('progress-bar').style.width = `${(state.currentIndex / state.queue.length) * 100}%`;
    setTimeout(() => inputEl.focus(), 100);
}

function checkAnswer() {
    const curr = state.queue[state.currentIndex];
    const raw = document.getElementById('user-input').value.trim();

    const simplify = s => s.toLowerCase()
        .replace(/[.,!?;:]/g, "")
        .replace(/\b0(\d)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();

    const stripAccents = s => simplify(s)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const options = curr.a.split(/[;/]/).map(o => o.trim());

    const isExactMatch = options.some(o => simplify(o) === simplify(raw));
    const isAccentTolerantMatch = options.some(o => stripAccents(o) === stripAccents(raw));

    const isCorrect = isExactMatch || isAccentTolerantMatch;
    const isPerfect = options.includes(raw);

    document.getElementById('user-input').readOnly = true;
    const fA = document.getElementById('feedback-area');
    const fT = document.getElementById('feedback-text');
    const cD = document.getElementById('correct-display');

    fA.classList.remove('hidden');
    cD.querySelector('span').innerText = curr.a;

    if (isCorrect) {
        state.score++;
        if (typeof triggerCatSuccess === "function") triggerCatSuccess();

        if (isPerfect) {
            fT.innerText = "Perfekt! 🌟";
            fA.className = "mb-6 p-4 rounded-xl text-center text-sm bg-green-50 text-green-700 border-2 border-green-200";
            cD.classList.add('hidden');
        } else if (!isExactMatch && isAccentTolerantMatch) {
            fT.innerText = "Richtig! (Achte auf die Akzente/Sonderzeichen)";
            fA.className = "mb-6 p-4 rounded-xl text-center text-sm bg-yellow-50 text-yellow-700 border-2 border-yellow-200";
            cD.classList.remove('hidden');
        } else {
            fT.innerText = "Richtig! (Andere Bedeutung/Schreibweise möglich)";
            fA.className = "mb-6 p-4 rounded-xl text-center text-sm bg-yellow-50 text-yellow-700 border-2 border-yellow-200";
            cD.classList.remove('hidden');
        }
    } else {
        if (typeof triggerCatError === "function") triggerCatError();
        fT.innerText = "Leider falsch.";
        fA.className = "mb-6 p-4 rounded-xl text-center text-sm bg-red-50 text-red-700 border-2 border-red-200";
        cD.classList.remove('hidden');
    }

    state.history.push({ q: curr.q, a: curr.a, u: raw, c: isCorrect });
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    document.getElementById('next-btn').focus();
}

function nextQuestion() {
    state.currentIndex++;
    if (state.currentIndex >= state.queue.length) {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('res-pct').innerText = Math.round((state.score / state.history.length) * 100) + "%";
        document.getElementById('history-list').innerHTML = state.history.map(h =>
            `<div class="p-2 border rounded ${h.c ? 'bg-green-50' : 'bg-red-50'} text-xs font-bold">${h.q} -> ${h.c ? '✓' : '✗ ' + (h.u || '-')} <span class="block font-normal text-slate-500">${h.a}</span></div>`
        ).join('');
    } else {
        updateUI();
    }
}

function openPrintModal() { document.getElementById('print-modal').classList.remove('hidden'); }
function closePrintModal() { document.getElementById('print-modal').classList.add('hidden'); }
function toggleHint() { document.getElementById('h-box').classList.remove('hidden'); document.getElementById('h-btn').classList.add('hidden'); }

function generatePrint(mode) {
    closePrintModal();
    const selLang = document.getElementById('lang-select').value;
    const selGrade = document.getElementById('class-select').value;
    const selPage = document.getElementById('print-page-select').value;

    let list = allVocabs.filter(v =>
        v.lang === selLang &&
        (selGrade === "" || String(v.grade) === String(selGrade)) &&
        (selPage === "" || String(v.page) === String(selPage))
    );
    list.sort(() => Math.random() - 0.5);

    const table = (title, hide, isSol = false) => {
        let h = `<h1 style="font-size:20pt;margin-bottom:10px">${title} (${selLang} ${selGrade ? 'Kl. ' + selGrade : ''} - S. ${selPage || 'Alle'})</h1><table><thead><tr><th>Deutsch</th><th>${selLang}</th><th>S.</th></tr></thead><tbody>`;
        list.forEach(v => {
            let g = v.ger, f = v.foreign;
            if (!isSol) {
                if (hide === 'ger') g = "";
                if (hide === 'eng') f = "";
                if (hide === 'random') { if (Math.random() > 0.5) g = ""; else f = ""; }
            }
            h += `<tr><td>${g}</td><td>${f}</td><td>${v.page}</td></tr>`;
        });
        return h + "</tbody></table>";
    };

    const div = document.createElement('div');
    div.id = 'print-section';
    if (mode === 'all') div.innerHTML = table("Vokabel-Übersicht", "none", false);
    else div.innerHTML = table("Vokabeltest", mode, false) + '<div style="page-break-before:always"></div>' + table("Lösungen", "none", true);

    document.body.appendChild(div);
    setTimeout(() => { window.print(); div.remove(); }, 500);
}

// --- INITIALISIERUNG & EVENT LISTENER ---
loadData();
if (typeof updateCatUI === "function") updateCatUI();

document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const adminModal = document.getElementById('admin-modal');
        const printModal = document.getElementById('print-modal');
        if (!adminModal.classList.contains('hidden') || !printModal.classList.contains('hidden')) return;

        const startScreen = document.getElementById('start-screen');
        const gameScreen = document.getElementById('game-screen');
        const resultScreen = document.getElementById('result-screen');

        if (!startScreen.classList.contains('hidden')) {
            const btn = document.getElementById('btn-all');
            if (btn && !btn.disabled) setupGame('all');
        } else if (!gameScreen.classList.contains('hidden')) {
            const cb = document.getElementById('check-btn');
            const nb = document.getElementById('next-btn');
            if (!cb.classList.contains('hidden')) checkAnswer();
            else if (!nb.classList.contains('hidden')) nextQuestion();
        } else if (!resultScreen.classList.contains('hidden')) {
            location.reload();
        }
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Error:', err));
    });
}