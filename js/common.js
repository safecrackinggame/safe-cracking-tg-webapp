function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('isDarkMode', isDarkMode);
    updateTheme();
}

function updateTheme() {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.querySelector('.game-container').classList.toggle('dark-mode', isDarkMode);

    const themeSunIcon = document.getElementById('theme-sun-icon');
    const themeMoonIcon = document.getElementById('theme-moon-icon');
    if (themeSunIcon && themeMoonIcon) {
        themeSunIcon.classList.toggle('hidden', !isDarkMode);
        themeMoonIcon.classList.toggle('hidden', isDarkMode);
    }

    const battleModeLabel = document.querySelector('.battle-mode-label');
    if (battleModeLabel) {
        battleModeLabel.style.color = isDarkMode ? '#f59e0b' : '#4a5568';
    }
}

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('isSoundEnabled', isSoundEnabled);
    updateSoundIcon();
}

function updateSoundIcon() {
    const soundOnIcon = document.getElementById('sound-on-icon');
    const soundOffIcon = document.getElementById('sound-off-icon');
    if (soundOnIcon && soundOffIcon) {
        soundOnIcon.classList.toggle('hidden', !isSoundEnabled);
        soundOffIcon.classList.toggle('hidden', isSoundEnabled);
    }
}

function playSound(audio) {
    if (isSoundEnabled) {
        audio.currentTime = 0;
        audio.play().catch(error => console.warn('[Audio] Play failed:', error));
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(seconds) {
    if (seconds === Infinity) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatLargeNumber(num) {
    const absNum = Math.abs(num);
    if (absNum < 1000) {
        return num.toString();
    }

    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "K" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "Q" },
        { value: 1e18, symbol: "Qi" },
    ];

    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let item = lookup.slice().reverse().find(function(item) {
        return absNum >= item.value;
    });

    if (item) {
        let scaledNum = (num / item.value).toFixed(2);
        return scaledNum.replace(rx, "$1") + item.symbol;
    }
    return num.toString();
}

const themeToggleBtn = document.getElementById('theme-toggle-btn');
if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

const soundToggleBtn = document.getElementById('sound-toggle-btn');
if (soundToggleBtn) soundToggleBtn.addEventListener('click', toggleSound);
