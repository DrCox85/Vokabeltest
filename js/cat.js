let catState = {
    energy: parseInt(localStorage.getItem('catEnergy')) || 50,
    streak: 0,
    level: parseInt(localStorage.getItem('catLevel')) || 1
};

function updateCatUI() {
    const bar = document.getElementById('cat-energy-bar');
    const lvl = document.getElementById('cat-level');
    if (bar) bar.style.width = catState.energy + "%";
    if (lvl) lvl.innerText = `Lvl ${catState.level}`;

    localStorage.setItem('catEnergy', catState.energy);
    localStorage.setItem('catLevel', catState.level);
}

function petCat() {
    const bubble = document.getElementById('cat-bubble');
    if (!bubble) return;
    bubble.classList.remove('hidden');
    setTimeout(() => bubble.classList.add('hidden'), 1200);
}

function triggerCatSuccess() {
    const cat = document.getElementById('cat-sprite');
    const status = document.getElementById('cat-status');

    catState.streak++;
    if (catState.streak % 5 === 0) {
        catState.level++;
        if (status) status.innerText = "Level Up! 🌟";
    } else {
        if (status) status.innerText = "Lecker! 🐟";
    }

    spawnFlyingFood(() => {
        if (cat) cat.className = "cookie-sleeping cat-jump";
        setTimeout(() => {
            if (cat) cat.className = "cookie-sleeping";
            if (status) status.innerText = "Cookie schläft...";
        }, 900);
    });

    catState.energy = Math.min(100, catState.energy + 5);
    updateCatUI();
}

function triggerCatError() {
    const cat = document.getElementById('cat-sprite');
    const status = document.getElementById('cat-status');

    catState.streak = 0;
    if (cat) cat.className = "cookie-sleeping cat-sad";
    if (status) status.innerText = "Och nee...";

    setTimeout(() => {
        if (cat) cat.className = "cookie-sleeping";
        if (status) status.innerText = "Weiter geht's!";
    }, 1000);
}

function spawnFlyingFood(onComplete) {
    const container = document.getElementById('food-spawn-point');
    if (!container) {
        if (onComplete) onComplete();
        return;
    }

    const food = document.createElement('div');
    food.className = 'flying-food';
    food.innerText = '🐟';

    food.style.left = '50%';
    food.style.bottom = '5px';
    food.style.transform = 'translate(-50%, 0) scale(0.5)';
    food.style.opacity = '1';

    container.appendChild(food);

    requestAnimationFrame(() => {
        setTimeout(() => {
            food.style.bottom = '55px';
            food.style.transform = 'translate(-50%, 0) scale(1.2)';
            food.style.opacity = '0';
        }, 50);
    });

    setTimeout(() => {
        food.remove();
        if (onComplete) onComplete();
    }, 600);
}