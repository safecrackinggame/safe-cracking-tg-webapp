Telegram.WebApp.ready();
Telegram.WebApp.expand();

// --- DOM Elements ---
const totalCoinsDisplay = document.getElementById('total-coins-display');
const gamesPlayedDisplay = document.getElementById('games-played-display');
const bestTimeDisplay = document.getElementById('best-time-display');
const timerDisplay = document.getElementById('timer-display');
const messageDisplay = document.getElementById('message-display');
const hintsContainer = document.getElementById('hints-container');
const guessInputContainer = document.getElementById('guess-input-container');
const guessButton = document.getElementById('guess-button');
const newGameButton = document.getElementById('new-game-button');
const solutionDisplay = document.getElementById('solution-display');
const difficultySelector = document.getElementById('difficulty-selector');
const languageSelector = document.getElementById('language-selector');
const hintModalOverlay = document.getElementById('hint-modal-overlay');
const modalMessage = document.getElementById('modal-message');
const modalConfirmButton = document.getElementById('modal-confirm-button');
const modalCancelButton = document.getElementById('modal-cancel-button');
const rewardRangeDisplay = document.getElementById('reward-range-display');
const coinRecoveryModalOverlay = document.getElementById('coin-recovery-modal-overlay');
const recoveryModalMessage = document.getElementById('recovery-modal-message');
const recoveryCountdown = document.getElementById('recovery-countdown');
const recoveryOkButton = document.getElementById('recovery-ok-button');
const logoImage = document.getElementById('logo-image');
const imageOverlay = document.getElementById('image-overlay');
const gameImage = document.getElementById('game-image');

// --- Audio Elements ---
const audioOpen = new Audio('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/sounds/open.mp3');
const audioError = new Audio('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/sounds/error.mp3');
const audioClick = new Audio('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/sounds/click_sound.mp3');
const audioAlarm = new Audio('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/sounds/alarm.mp3');
const audioAlarm2 = new Audio('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/sounds/alarm2.mp3');
const audioOpenCrazy = new Audio('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/sounds/opencrazy.mp3');
const audioOpenHard = new Audio('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/sounds/openhard.mp3');
const audioOpenNormal = new Audio('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/sounds/opennormal.mp3');

// --- Game State Variables ---
let totalCoins = 0;
const INITIAL_COINS = 100;
let stats = {
    NORMAL: { gamesPlayed: 0, bestTime: Infinity },
    HARD: { gamesPlayed: 0, bestTime: Infinity },
    CRAZY: { gamesPlayed: 0, bestTime: Infinity }
};
let currentDifficultyKey = 'NORMAL';
let currentHintCost = 0;
let hintsBoughtThisGame = 0;
let revealedDigits = new Map();
let lockedDigits = new Map();
let timerInterval;
let startTime;
let currentElapsedTime = 0;
let isGameInProgress = false;
let activeHintIndex = -1;
let coinRecoveryTimer = null;
let coinRecoveryCountdownSeconds = 0;
let isDarkMode = localStorage.getItem('isDarkMode') === 'true';
let isSoundEnabled = localStorage.getItem('isSoundEnabled') !== null ? localStorage.getItem('isSoundEnabled') === 'true' : true;
let battleData = null;

let socket = null;
let gameLogic;

// --- Localization Variables ---
let translations = {};
const supportedLanguages = {
    'en': 'English',
    'ru': 'Русский',
    'es': 'Español',
    'pt': 'Português',
    'de': 'Deutsch',
    'fr': 'Français',
    'it': 'Italiano',
    'ar': 'العربية',
    'uk': 'Українська',
    'id': 'Bahasa Indonesia'
};
let currentLanguage = 'en';

// --- Hint Rules and Difficulty ---
const HintRule = {
    ONE_CORRECT_ONE_PLACE: { correctDigits: 1, correctPositions: 1, translationKey: 'hint_rule_1_1' },
    TWO_CORRECT_ONE_PLACE: { correctDigits: 2, correctPositions: 1, translationKey: 'hint_rule_2_1' },
    TWO_CORRECT_ZERO_PLACE: { correctDigits: 2, correctPositions: 0, translationKey: 'hint_rule_2_0' },
    THREE_CORRECT_TWO_PLACE: { correctDigits: 3, correctPositions: 2, translationKey: 'hint_rule_3_2' }
};

const Difficulty = {
    NORMAL: {
        displayNameKey: "difficulty_normal",
        codeLength: 3,
        numberOfHints: 3,
        attempts: 5,
        rewardRange: { min: 20, max: 100 },
        hintCostRange: { min: 9, max: 45 },
        recoveryTime: 5,
        recoveryAmount: 100,
        hintRules: [
            HintRule.ONE_CORRECT_ONE_PLACE,
            HintRule.TWO_CORRECT_ONE_PLACE,
            HintRule.TWO_CORRECT_ZERO_PLACE
        ]
    },
    HARD: {
        displayNameKey: "difficulty_hard",
        codeLength: 3,
        numberOfHints: 3,
        attempts: 5,
        rewardRange: { min: 100, max: 500 },
        hintCostRange: { min: 45, max: 225 },
        hintRules: [
            HintRule.ONE_CORRECT_ONE_PLACE,
            HintRule.TWO_CORRECT_ONE_PLACE,
            HintRule.TWO_CORRECT_ZERO_PLACE
        ]
    },
    CRAZY: {
        displayNameKey: "difficulty_crazy",
        codeLength: 4,
        numberOfHints: 4,
        attempts: 5,
        rewardRange: { min: 500, max: 2500 },
        hintCostRange: { min: 225, max: 1125 },
        hintRules: [
            HintRule.ONE_CORRECT_ONE_PLACE,
            HintRule.TWO_CORRECT_ONE_PLACE,
            HintRule.TWO_CORRECT_ZERO_PLACE,
            HintRule.THREE_CORRECT_TWO_PLACE
        ]
    }
};

async function loadTranslations(langCode) {
    try {
        const response = await fetch(`./locales/${langCode}.json`);
        if (!response.ok) {
            console.warn(`[Localization] Translations for ${langCode} not found, falling back to 'en'.`);
            if (langCode !== 'en') {
                return await loadTranslations('en');
            }
            throw new Error(`Failed to load translations for ${langCode}`);
        }
        translations = await response.json();
        currentLanguage = langCode;
        console.log(`[Localization] Loaded translations for: ${langCode}`);
        applyTranslations();
        saveGameData();
    } catch (error) {
        console.error(`[Localization] Error loading translations for ${langCode}:`, error);
        if (langCode !== 'en' && Object.keys(translations).length === 0) {
            console.log("[Localization] Falling back to English due to error.");
            await loadTranslations('en');
        }
    }
}

function translate(key, params = {}) {
    let translated = translations[key] || key;
    for (const paramKey in params) {
        if (Object.prototype.hasOwnProperty.call(params, paramKey)) {
            translated = translated.replace(`{${paramKey}}`, params[paramKey]);
        }
    }
    return translated;
}

function applyTranslations() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.dataset.translate;
        let params = {};
        try {
            if (element.dataset.translateParams) {
                params = JSON.parse(element.dataset.translateParams);
            }
        } catch (e) {
            console.error("Error parsing data-translate-params for key:", key, e);
        }
        element.textContent = translate(key, params);
    });

    populateDifficultySelector();

    if (!hintModalOverlay.classList.contains('hidden')) {
        modalMessage.textContent = translate('hint_cost_message', { cost: currentHintCost });
        modalConfirmButton.textContent = translate('buy_button');
    }
    if (!coinRecoveryModalOverlay.classList.contains('hidden')) {
        recoveryOkButton.textContent = translate('ok_button');
    }
}

function saveGameData() {
    APISetCoins(Telegram.WebApp.initData, totalCoins)
    .then(data => {
        console.log('[API] SetCoins (battle saveGameData):', data);
    });

    const serializableStats = JSON.parse(JSON.stringify(stats));
    for (const diffKey in serializableStats) {
        if (serializableStats[diffKey].bestTime === Infinity) {
            serializableStats[diffKey].bestTime = null;
        }
    }
    localStorage.setItem('stats', JSON.stringify(serializableStats));
    localStorage.setItem('currentDifficultyKey', currentDifficultyKey);
    localStorage.setItem('currentLanguage', currentLanguage);
    localStorage.setItem('isDarkMode', isDarkMode);
    localStorage.setItem('isSoundEnabled', isSoundEnabled);
    console.log("[Save] Game data saved.");
}

async function initUser() {
    // Create user on server with Local Storage data.
    // If the user exists on server, then Local Storage data is ignored
    console.log("Init user on server...");

    const initData = Telegram.WebApp.initData;
    if (!initData) {
        return 'Not running inside Telegram';
    }

    // stats = localStorage.getItem('stats');

    const data = await APIInitUser(
        Telegram.WebApp.initData,
        localStorage.getItem('totalCoins')
    );
    console.log('[API] Init user:', data);

    return '';
}

async function loadBattleGameData() {
    console.log("[Load] Loading game data...");

    const urlParams = new URLSearchParams(window.location.search);
    const battleId = urlParams.get('battleId');
    if (!battleId) {
        return "[Load] Wrong Battle ID";
    }

    const data = await APIGetBattle(Telegram.WebApp.initData, battleId);
    console.log('[API] Get Battle:', data);
    if (!data || !data.success) {
        return "[Load] Wrong Battle ID";
    }
    battleData = data.battle;
    battleData.participants = new Map();

    const savedStats = localStorage.getItem('stats');
    if (savedStats) {
        try {
            stats = JSON.parse(savedStats);
            for (const diffKey in stats) {
                if (stats[diffKey].bestTime === null) {
                    stats[diffKey].bestTime = Infinity;
                }
                if (typeof stats[diffKey].gamesPlayed === 'undefined') stats[diffKey].gamesPlayed = 0;
                if (typeof stats[diffKey].bestTime === 'undefined') stats[diffKey].bestTime = Infinity;
            }
        } catch (e) {
            console.error("[Load] Error parsing saved stats, resetting.", e);
            stats = {
                NORMAL: { gamesPlayed: 0, bestTime: Infinity },
                HARD: { gamesPlayed: 0, bestTime: Infinity },
                CRAZY: { gamesPlayed: 0, bestTime: Infinity }
            };
        }
    } else {
        console.log("[Load] No saved stats found, initializing new stats.");
        stats = {
            NORMAL: { gamesPlayed: 0, bestTime: Infinity },
            HARD: { gamesPlayed: 0, bestTime: Infinity },
            CRAZY: { gamesPlayed: 0, bestTime: Infinity }
        };
    }

    const savedLanguage = localStorage.getItem('currentLanguage');
    const telegramLanguage = Telegram.WebApp.initDataUnsafe?.user?.language_code;
    const browserLanguage = navigator.language.split('-')[0];
    if (savedLanguage && supportedLanguages[savedLanguage]) {
        currentLanguage = savedLanguage;
    } else if (telegramLanguage && supportedLanguages[telegramLanguage]) {
        currentLanguage = telegramLanguage;
    } else if (browserLanguage && supportedLanguages[browserLanguage]) {
        currentLanguage = browserLanguage;
    } else {
        currentLanguage = 'en';
    }
    languageSelector.value = currentLanguage;

    isDarkMode = localStorage.getItem('isDarkMode') === 'true';
    isSoundEnabled = localStorage.getItem('isSoundEnabled') !== null ? localStorage.getItem('isSoundEnabled') === 'true' : true;

    totalCoins = await APIGetCoins(Telegram.WebApp.initData);
    console.log('[API] GetCoins:', totalCoins);

    currentDifficultyKey = battleData.difficulty.toUpperCase();
    if (!Difficulty[currentDifficultyKey]) {
        currentDifficultyKey = 'NORMAL';
    }

    gameLogic = new GameLogic(Difficulty[currentDifficultyKey]);

    console.log("[Load] Game data loaded: Total Coins:", totalCoins, "Stats:", stats, "Current Difficulty:", currentDifficultyKey, "Language:", currentLanguage, "Dark Mode:", isDarkMode, "Sound Enabled:", isSoundEnabled);
    return '';
}

function resetGame() {
    console.log("[Game Reset] Resetting game...");

    stopTimer();
    currentElapsedTime = 0;
    hintsBoughtThisGame = 0;
    revealedDigits.clear();
    lockedDigits.clear();
    currentHintCost = 0;

    gameLogic.setDifficulty(Difficulty[currentDifficultyKey]);
    createGuessInputs(gameLogic.codeLength);

    const requiredStake = battleData.stake;
    if (totalCoins < requiredStake) {
        console.error("[Game Reset] Not enough coins. Game not started.");
        showMessage(translate('insufficient_stake_message', { requiredStake: requiredStake, totalCoins: totalCoins }), 'red');

        isGameInProgress = false;
        solutionDisplay.textContent = '';
        guessButton.disabled = true;
        newGameButton.classList.add('hidden');
        stopTimer();
        timerDisplay.textContent = formatTime(0);
        Telegram.WebApp.setHeaderColor('secondary_bg_color');

        const tempGameLogic = new GameLogic(Difficulty[currentDifficultyKey]);
        const tempResetResult = tempGameLogic.resetGame();
        displayHints(tempResetResult.hints, tempResetResult.hintRules);

        saveGameData();
        updateUI();
        return;
    }

    isGameInProgress = true;
    const resetResult = gameLogic.resetGame();
    if (resetResult.secretCode === "") {
        showMessage(translate('puzzle_generation_failed'), 'red');

        isGameInProgress = false;
        solutionDisplay.textContent = '';
        guessButton.disabled = true;

        console.error("[Game Reset] Failed to generate unique puzzle. Game not started.");
        saveGameData();
        updateUI();
        return;
    }

    showMessage(translate('guess_code_message', { codeLength: gameLogic.codeLength }) + ' ' + translate('attempts_left_message', { attemptsLeft: gameLogic.getAttemptsLeft() }), 'default');
    solutionDisplay.textContent = '';
    newGameButton.classList.add('hidden');

    displayHints(gameLogic.currentHints, gameLogic.currentHintRules);
    startTimer();
    Telegram.WebApp.setHeaderColor('secondary_bg_color');

    console.log("[Game Reset] Game reset complete. New secret code:", gameLogic.getSecretCode());
    saveGameData();
    updateUI();
}

function checkGuess() {
    const guessArray = Array.from(guessInputContainer.querySelectorAll('.digit-display')).map(el => el.textContent);
    const guessResult = gameLogic.makeGuess(guessArray);

    if (guessResult.isWin) {
        isGameInProgress = false;
        solutionDisplay.textContent = '';
        guessButton.disabled = true;
        stopTimer();

        const earnedCoins = guessResult.reward;
        totalCoins += earnedCoins;
        stats[currentDifficultyKey].gamesPlayed++;
        if (currentElapsedTime < stats[currentDifficultyKey].bestTime) {
            stats[currentDifficultyKey].bestTime = currentElapsedTime;
        }

        updateUI();
        saveGameData();

        playSound(currentDifficultyKey === 'NORMAL' ? audioOpenNormal : currentDifficultyKey === 'HARD' ? audioOpenHard : audioOpenCrazy);
        showMessage(translate('safe_cracked_win', {earnedCoins: earnedCoins}), 'green');

        newGameButton.classList.remove('hidden');
        showImageWithDelay(`https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/assets/open${currentDifficultyKey === 'NORMAL' ? '1' : currentDifficultyKey === 'HARD' ? '' : '2'}.webp`, 2000)
            .then(() => {
                Telegram.WebApp.showPopup({
                    title: translate('victory_title'),
                    message: `${translate('safe_cracked_win', {earnedCoins: earnedCoins})}\n${translate('your_time')}: ${formatTime(currentElapsedTime)}\n${translate('best_time')}: ${formatTime(stats[currentDifficultyKey].bestTime)}`,
                    buttons: [{ id: 'ok', type: 'ok', text: translate('great_button') }]
                });
                Telegram.WebApp.setHeaderColor('accent_text_color');
            });
    } else if (guessResult.isGameOver) {
        isGameInProgress = false;
        stopTimer();
        solutionDisplay.textContent = '';
        guessButton.disabled = true;

        stats[currentDifficultyKey].gamesPlayed++;
        updateUI();
        saveGameData();

        playSound(audioAlarm);
        showMessage(translate('game_over_message', {secretCode: gameLogic.getSecretCode()}), 'red');

        newGameButton.classList.remove('hidden');
        showImageWithDelay('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/assets/alarm.webp', 2000);
        setTimeout(() => {
            playSound(audioAlarm2);
            Telegram.WebApp.showPopup({
                title: translate('defeat_title'),
                message: translate('game_over_message', {secretCode: gameLogic.getSecretCode()}),
                buttons: [{ id: 'ok', type: 'ok', text: translate('understood_button') }]
            });
            Telegram.WebApp.setHeaderColor('destructive_text_color');
        }, 2000);
    } else {
        playSound(audioError);
        showMessage(translate('incorrect_guess_message', {attemptsLeft: guessResult.attemptsLeft}), 'orange');
        if (currentDifficultyKey === 'NORMAL') {
            guessResult.correctlyPlacedDigits.forEach(index => {
                lockedDigits.set(index, gameLogic.currentGuess[index]);
            });
        }
        updateUI();
        saveGameData();
    }
}

function tryBuyHint(digitIndex) {
    if (hintsBoughtThisGame >= 2) {
        showMessage(translate('hint_max_limit_message'), 'red');
        return;
    }

    if (revealedDigits.has(digitIndex)) {
        showMessage(translate('digit_already_revealed'), 'orange');
        return;
    }
    if (lockedDigits.has(digitIndex)) {
        showMessage(translate('digit_already_locked'), 'orange');
        return;
    }

    // Цена подсказки зависит от ставки батла (45% от scgStake)
    currentHintCost = Math.floor(battleData.stake * 0.45);
    activeHintIndex = digitIndex;

    const hintsEnabled = battleData.hints === 'off' ? false : true;
    if (!hintsEnabled) {
        showMessage(translate('hints_disabled_message'), 'orange');
        return;
    }

    modalMessage.textContent = translate('hint_cost_message', { cost: currentHintCost });
    modalConfirmButton.textContent = translate('buy_button');
    modalConfirmButton.onclick = () => confirmBuyHint();
    hintModalOverlay.classList.remove('hidden');
}

function confirmBuyHint() {
    hintModalOverlay.classList.add('hidden');

    if (totalCoins >= currentHintCost) {
        totalCoins -= currentHintCost;

        hintsBoughtThisGame++;
        const digit = gameLogic.getSecretCode()[activeHintIndex];
        revealedDigits.set(activeHintIndex, digit);
        lockedDigits.set(activeHintIndex, digit);

        gameLogic.currentGuess[activeHintIndex] = digit;

        showMessage(translate('hint_bought_success', {coinsLeft: formatLargeNumber(totalCoins)}), 'blue');
        currentHintCost = 0;
        updateUI();
        saveGameData();
        activeHintIndex = -1;
    } else {
        if (currentDifficultyKey === 'NORMAL') {
            startCoinRecovery();
        } else {
            clearInterval(coinRecoveryTimer);
            coinRecoveryModalOverlay.classList.remove('hidden');
            recoveryModalMessage.textContent = translate('not_enough_coins_other');
            recoveryCountdown.textContent = '';
            recoveryOkButton.classList.remove('hidden');
        }
    }
}

function startCoinRecovery() {
    const difficulty = Difficulty[currentDifficultyKey];
    const recoveryTime = difficulty.recoveryTime;
    const recoveryAmount = difficulty.recoveryAmount;

    clearInterval(coinRecoveryTimer);

    coinRecoveryCountdownSeconds = recoveryTime;

    coinRecoveryModalOverlay.classList.remove('hidden');
    recoveryOkButton.classList.add('hidden');

    recoveryModalMessage.textContent = translate('not_enough_coins_normal', {seconds: coinRecoveryCountdownSeconds});
    updateCoinRecoveryCountdown();

    coinRecoveryTimer = setInterval(() => {
        coinRecoveryCountdownSeconds--;
        updateCoinRecoveryCountdown();

        if (coinRecoveryCountdownSeconds <= 0) {
            clearInterval(coinRecoveryTimer);
            totalCoins = recoveryAmount;
            saveGameData();
            updateUI();
            recoveryModalMessage.textContent = translate('coins_recovered_message', {amount: recoveryAmount, totalCoins: formatLargeNumber(totalCoins)});
            recoveryCountdown.textContent = '';
            recoveryOkButton.classList.remove('hidden');
        }
    }, 1000);
}

function updateCoinRecoveryCountdown() {
    recoveryCountdown.textContent = coinRecoveryCountdownSeconds > 0 ? formatTime(coinRecoveryCountdownSeconds) : '';
}

recoveryOkButton.addEventListener('click', () => {
    coinRecoveryModalOverlay.classList.add('hidden');
    showMessage(translate('game_start_message'), 'gray');
});

function showMessage(msg, type) {
    messageDisplay.textContent = msg;
    messageDisplay.className = 'text-md italic mb-6';
    if (type === 'red') {
        messageDisplay.classList.add('text-red-600');
    } else if (type === 'green') {
        messageDisplay.classList.add('text-green-600');
    } else if (type === 'orange') {
        messageDisplay.classList.add('text-orange-600');
    } else if (type === 'blue') {
        messageDisplay.classList.add('text-blue-600');
    } else {
        messageDisplay.classList.add('text-gray-600');
    }
}

function createGuessInputs(length) {
    guessInputContainer.innerHTML = '';
    if (isGameInProgress && (!gameLogic.currentGuess || gameLogic.currentGuess.length !== length)) {
        gameLogic.currentGuess = Array(length).fill('0');
    } else if (!isGameInProgress) {
        gameLogic.currentGuess = Array(length).fill('0');
    }

    for (let i = 0; i < length; i++) {
        const picker = document.createElement('div');
        picker.className = 'digit-picker';

        const upButton = document.createElement('button');
        upButton.className = 'arrow-button up-arrow';
        upButton.textContent = '▲';
        upButton.dataset.index = i;
        upButton.onclick = (e) => {
            const idx = parseInt(e.target.dataset.index);
            if (isGameInProgress && !lockedDigits.has(idx)) {
                playSound(audioClick);
                let currentVal = parseInt(gameLogic.currentGuess[idx]);
                gameLogic.currentGuess[idx] = ((currentVal + 1) % 10).toString();
                updateGuessInputsDisplay();
            }
        };
        const digitDisplay = document.createElement('span');
        digitDisplay.className = 'digit-display';
        digitDisplay.textContent = revealedDigits.has(i) ? revealedDigits.get(i) : gameLogic.currentGuess[i];
        digitDisplay.dataset.index = i;
        digitDisplay.onclick = (e) => {
            const idx = parseInt(e.target.dataset.index);
            if (isGameInProgress && !lockedDigits.has(idx)) {
                playSound(audioClick);
                let currentVal = parseInt(gameLogic.currentGuess[idx]);
                gameLogic.currentGuess[idx] = ((currentVal + 1) % 10).toString();
                updateGuessInputsDisplay();
            }
        };
        const downButton = document.createElement('button');
        downButton.className = 'arrow-button down-arrow';
        downButton.textContent = '▼';
        downButton.dataset.index = i;
        downButton.onclick = (e) => {
            const idx = parseInt(e.target.dataset.index);
            if (isGameInProgress && !lockedDigits.has(idx)) {
                playSound(audioClick);
                let currentVal = parseInt(gameLogic.currentGuess[idx]);
                gameLogic.currentGuess[idx] = ((currentVal - 1 + 10) % 10).toString();
                updateGuessInputsDisplay();
            }
        };
        const hintButton = document.createElement('button');
        hintButton.className = 'hint-button';
        hintButton.textContent = '?';
        hintButton.dataset.digitIndex = i;
        hintButton.onclick = () => {
            if (isGameInProgress) {
                tryBuyHint(i);
            }
        };

        picker.appendChild(upButton);
        picker.appendChild(digitDisplay);
        picker.appendChild(downButton);
        picker.appendChild(hintButton);
        guessInputContainer.appendChild(picker);
    }
    updateUI();
}

function updateGuessInputsDisplay() {
    const digitDisplays = guessInputContainer.querySelectorAll('.digit-display');
    digitDisplays.forEach((display, index) => {
        const currentVal = gameLogic.currentGuess[index];
        if (revealedDigits.has(index)) {
            display.textContent = revealedDigits.get(index);
            display.classList.add('correct');
        } else if (lockedDigits.has(index)) {
            display.textContent = lockedDigits.get(index);
            display.classList.add('correct');
        } else {
            display.textContent = currentVal;
            display.classList.remove('correct');
        }
    });
    updateUI();
}

function updateUI() {
    totalCoinsDisplay.textContent = formatLargeNumber(totalCoins);
    const currentStats = stats[currentDifficultyKey];
    gamesPlayedDisplay.textContent = currentStats.gamesPlayed;
    bestTimeDisplay.textContent = formatTime(currentStats.bestTime);
    updateRewardRangeDisplay();

    const battleId = battleData.uid;
    const requiredStake = battleData.stake;

    if (totalCoins >= requiredStake && isGameInProgress) {
        guessButton.disabled = false;
        guessButton.classList.remove('bg-gray-400');
        guessButton.classList.add('bg-green-500', 'hover:bg-green-600');
    } else {
        guessButton.disabled = true;
        guessButton.classList.add('bg-gray-400');
        guessButton.classList.remove('bg-green-500', 'hover:bg-green-600');
    }

    guessInputContainer.querySelectorAll('.digit-picker').forEach((picker, index) => {
        const upButton = picker.querySelector('.up-arrow');
        const downButton = picker.querySelector('.down-arrow');
        const hintButton = picker.querySelector('.hint-button');
        const digitDisplay = picker.querySelector('.digit-display');

        const isDigitLockedOrRevealed = revealedDigits.has(index) || lockedDigits.has(index);

        upButton.disabled = !isGameInProgress || isDigitLockedOrRevealed || totalCoins < requiredStake;
        downButton.disabled = !isGameInProgress || isDigitLockedOrRevealed || totalCoins < requiredStake;
        digitDisplay.style.cursor = (!isGameInProgress || isDigitLockedOrRevealed || totalCoins < requiredStake) ? 'default' : 'pointer';

        const hintsEnabled = battleData.hints === 'off' ? false : true;
        hintButton.disabled = !isGameInProgress || hintsBoughtThisGame >= 2 || isDigitLockedOrRevealed || !hintsEnabled || totalCoins < requiredStake;

        if (isDigitLockedOrRevealed) {
            digitDisplay.textContent = revealedDigits.has(index) ? revealedDigits.get(index) : lockedDigits.get(index);
            digitDisplay.classList.add('correct');
            hintButton.classList.add('revealed');
            hintButton.textContent = digitDisplay.textContent;
        } else {
            digitDisplay.textContent = gameLogic.currentGuess[index];
            digitDisplay.classList.remove('correct');
            hintButton.classList.remove('revealed');
            hintButton.textContent = '?';
        }
    });

    // Отображение ссылки для приглашения
    const inviteLink = `https://t.me/Safe_Cracking_bot/game?startapp=battle_${battleId}`;
    const battleModeLabel = document.querySelector('.battle-mode-label');
    if (battleModeLabel) {
        const linkElement = document.createElement('p');
        linkElement.innerHTML = `<span id="invite-link-text" class="text-blue-500 underline cursor-pointer" onclick="copyInviteLink('${inviteLink}')">${translate('invite_link_label')}</span>`;
        linkElement.className = 'text-sm text-gray-600 dark:text-gray-300 mt-2';
        if (!document.getElementById('invite-link-display')) {
            battleModeLabel.parentNode.insertBefore(linkElement, battleModeLabel.nextSibling);
            linkElement.id = 'invite-link-display';
        } else {
            document.getElementById('invite-link-display').innerHTML = linkElement.innerHTML;
        }
    }

    updateTheme();
    updateSoundIcon();
    logoImage.classList.toggle('hidden', !isGameInProgress);
}

// Новая функция для копирования ссылки
function copyInviteLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        const linkText = document.getElementById('invite-link-text');
        const originalText = linkText.textContent;
        linkText.textContent = translate('link_copied_label');
        setTimeout(() => {
            linkText.textContent = originalText;
        }, 2000); // Восстанавливаем текст через 2 секунды
    }).catch(err => {
        console.error('[Copy] Failed to copy link:', err);
    });
}

function displayHints(hints, rules) {
    console.log("[Hints] Displaying hints:", hints, rules);
    hintsContainer.innerHTML = `<p class="text-base font-semibold mb-2 text-gray-700 dark:text-gray-300">${translate('hints_title')}</p>`;

    if (hints.length > 0) {
        hints.forEach((hint, index) => {
            const ruleTranslationKey = (rules[index] && rules[index].translationKey) ? rules[index].translationKey : 'common_rule_description';
            const ruleDescription = translate(ruleTranslationKey);

            const hintItem = document.createElement('p');
            hintItem.className = 'hint-item';
            hintItem.textContent = `${hint} — ${ruleDescription}`;
            hintsContainer.appendChild(hintItem);
        });
    } else {
        hintsContainer.innerHTML += `<p class="hint-item">${translate('no_hints_available')}</p>`;
    }
}

function startTimer() {
    clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(() => {
        currentElapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = formatTime(currentElapsedTime);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function showImageWithDelay(src, duration) {
    return new Promise(resolve => {
        gameImage.src = src;
        imageOverlay.classList.remove('hidden');

        setTimeout(() => {
            imageOverlay.classList.add('hidden');
            resolve(); 
        }, duration);
    });
}

function showImage(src, duration) {
    gameImage.src = src;
    imageOverlay.classList.remove('hidden');
    setTimeout(() => {
        imageOverlay.classList.add('hidden');
    }, duration);
}

guessButton.addEventListener('click', checkGuess);
newGameButton.addEventListener('click', resetGame);
modalCancelButton.addEventListener('click', () => {
    hintModalOverlay.classList.add('hidden');
    activeHintIndex = -1;
});

difficultySelector.addEventListener('change', (event) => {
    // Заблокировано, ничего не делаем
});

languageSelector.addEventListener('change', async (event) => {
    const selectedLang = event.target.value;
    if (supportedLanguages[selectedLang]) {
        await loadTranslations(selectedLang);
        applyTranslations();

        // gameLogic.setDifficulty(Difficulty[currentDifficultyKey]);

        resetGame();
        console.log(`[Language Selector] Language changed to: ${supportedLanguages[selectedLang]}`);
    } else {
        console.error(`[Language Selector] Unsupported language selected: ${selectedLang}`);
    }
});

function populateDifficultySelector() {
    console.log("[Difficulty Selector] Populating difficulty selector...");

    difficultySelector.innerHTML = '';
    for (const key in Difficulty) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = translate(Difficulty[key].displayNameKey);
        difficultySelector.appendChild(option);
    }
    difficultySelector.value = currentDifficultyKey;

    difficultySelector.disabled = true; // Ensure it remains locked

    updateRewardRangeDisplay();

    console.log("[Difficulty Selector] Selector value set to:", currentDifficultyKey);
}

function populateLanguageSelector() {
    console.log("[Language Selector] Populating language selector...");
    languageSelector.innerHTML = '';
    for (const langCode in supportedLanguages) {
        const option = document.createElement('option');
        option.value = langCode;
        option.textContent = supportedLanguages[langCode];
        languageSelector.appendChild(option);
    }
    languageSelector.value = currentLanguage;
    console.log("[Language Selector] Selector value set to:", currentLanguage);
}

function updateRewardRangeDisplay() {
    rewardRangeDisplay.textContent = '';
}

function initSocket() {
    socket = io("https://scg.rain.dp.ua");

    socket.on('connect', () => {
        console.log('[Socket] Connected to server. ID:', socket.id);

        const userInfo = Telegram.WebApp.initDataUnsafe.user;
        const user_name = userInfo.first_name;

        socket.emit('user_joined', {
            initData: Telegram.WebApp.initData,
            battle_id: battleData.uid,
            user_name: user_name
        });
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from server.');
    });

    socket.on('user_joined', (data) => {
        console.log('[Socket] User joined:', data);

        const newSid = data.new_sid

        battleData.participants = new Map(Object.entries(data.users));
        updateUsersList();

        const usersCount = battleData.participants.size;
        const participantsCount = battleData.participants_count;
        if (usersCount == participantsCount) {
            console.log('All users joined');
            stopGame();
            countdown();
            // resetGame();
        }
    });

    socket.on('user_disconnected', (sid) => {
        console.log('[Socket] User disconnected:', sid);
        battleData.participants.delete(sid);
        updateUsersList();
    });
}

function updateUsersList() {
    const users = [...battleData.participants.values()];
    const usersCount = battleData.participants.size;
    const participantsCount = battleData.participants_count;
    const connectedUsersDiv = document.getElementById('battle_users_connected');
    connectedUsersDiv.innerHTML = translate('joined_users') + ` ${usersCount}/${participantsCount}:<br>` + users.map(username => `${username}`).join(', ');

    const participantsDisplay = document.getElementById('participants-display');
    participantsDisplay.innerHTML = users.map(username => `${username}`).join('<br>');
}

function countdown() {
    console.log('countdown');
}

function stopGame() {
    isGameInProgress = false;
    stopTimer();
    solutionDisplay.textContent = '';
    guessButton.disabled = true;
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DOM Loaded] DOM content loaded. Starting a new game.");

    playSound(audioOpen);
    showImageWithDelay('./design/assets/start.webp', 5000)
        .then(() => {
            resetGame();
            initSocket();
        });

    let err = await initUser();
    if (err) {
        console.error(err);
        alert(err);
        return;
    }

    err = await loadBattleGameData();
    if (err) {
        console.error(err);
        alert(err);
        return;
    }

    populateLanguageSelector();
    populateDifficultySelector();
    await loadTranslations(currentLanguage);
});
