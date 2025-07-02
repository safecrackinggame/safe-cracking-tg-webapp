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

let unlockedDifficulties = {
    NORMAL: true,
    HARD: false,
    CRAZY: false
};
const UNLOCK_COSTS = {
    HARD: 225,
    CRAZY: 1125
};

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

class ResetGameResult {
    constructor(secretCode, hints, hintRules, codeLength, maxGuessAttempts) {
        this.secretCode = secretCode;
        this.hints = hints;
        this.hintRules = hintRules;
        this.codeLength = codeLength;
        this.maxGuessAttempts = maxGuessAttempts;
    }
}

class GuessResult {
    constructor(isWin, isGameOver, reward, attemptsLeft, correctlyPlacedDigits = null) {
        this.isWin = isWin;
        this.isGameOver = isGameOver;
        this.reward = reward;
        this.attemptsLeft = attemptsLeft;
        this.correctlyPlacedDigits = correctlyPlacedDigits;
    }
}

class GameLogic {
    constructor(difficulty = Difficulty.NORMAL) {
        this.setDifficulty(difficulty);
    }

    setDifficulty(newDifficulty) {
        this.difficulty = newDifficulty;
        this.codeLength = newDifficulty.codeLength;
        this.numberOfHints = newDifficulty.numberOfHints;
        this.maxGuessAttempts = newDifficulty.attempts;
        this.currentGuess = Array(this.codeLength).fill('0');
        console.log(`[GameLogic] Difficulty set to: ${newDifficulty.displayNameKey}, codeLength: ${this.codeLength}, attempts: ${this.maxGuessAttempts}`);
        this.resetGameLogicState();
    }

    getCodeLength() {
        return this.difficulty.codeLength;
    }

    getAttemptsLeft() {
        return this.maxGuessAttempts - this.currentGuessAttempt;
    }

    resetGameLogicState() {
        this.currentGuessAttempt = 0;
        this.currentGuess = Array(this.codeLength).fill('0');
        console.log(`[GameLogic] Game logic state reset. Code length: ${this.codeLength}, Current guess: ${this.currentGuess.join('')}`);
    }

    getSecretCode() {
        return this.secretCode;
    }

    getReward() {
        const { min, max } = this.difficulty.rewardRange;
        const reward = getRandomInt(min, max);
        console.log(`[GameLogic] Calculated reward: ${reward} (Range: ${min}-${max}) for difficulty ${translate(this.difficulty.displayNameKey)}`);
        return reward;
    }

    getHintCost() {
        const { min, max } = this.difficulty.hintCostRange;
        return getRandomInt(min, max);
    }

    generateSecretCodeInternal() {
        const digits = Array.from({ length: 10 }, (_, i) => i.toString());
        digits.sort(() => Math.random() - 0.5);
        return digits.slice(0, this.codeLength).join('');
    }

    resetGame() {
        this.resetGameLogicState();
        let hintsResult = null;
        let totalPuzzleGenerationAttempts = 0;
        const maxPuzzleGenerationAttempts = 1000;
        while (hintsResult === null && totalPuzzleGenerationAttempts < maxPuzzleGenerationAttempts) {
            const candidateSecret = this.generateSecretCodeInternal();
            hintsResult = this.generateHints(candidateSecret);

            if (hintsResult !== null) {
                this.secretCode = candidateSecret;
                this.currentHints = hintsResult.first;
                this.currentHintRules = hintsResult.second;
                console.log(`[GameLogic] Puzzle successfully generated in ${totalPuzzleGenerationAttempts + 1} attempts. Code: ${this.secretCode}`);
                break;
            }
            totalPuzzleGenerationAttempts++;
            console.warn(`[GameLogic] Puzzle generation attempt ${totalPuzzleGenerationAttempts}: Failed to generate unique hints for code ${candidateSecret}`);
        }

        if (hintsResult === null) {
            console.error(`[GameLogic] Critical Error: Failed to generate unique hints after ${maxPuzzleGenerationAttempts} total attempts.`);
            return new ResetGameResult("", [], [], this.difficulty.codeLength, this.difficulty.attempts);
        }

        return new ResetGameResult(this.secretCode, this.currentHints, this.currentHintRules, this.difficulty.codeLength, this.difficulty.attempts);
    }

    generateHints(answer) {
        console.log(`[GameLogic.generateHints] Generating hints for code length: ${this.codeLength}, answer: ${answer}`);
        const hints = [];
        const rules = [];
        const answerDigits = answer.split('').map(Number);
        const allDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        const checkHint = (guess, secret, rule) => {
            let correctPlaceCount = 0;
            let correctDigitsCount = 0;
            let secretCopy = secret.slice();

            let guessNoCorrectPlace = [];
            let secretNoCorrectPlace = [];
            for (let i = 0; i < guess.length; i++) {
                if (guess[i] === secret[i]) {
                    correctPlaceCount++;
                } else {
                    guessNoCorrectPlace.push(guess[i]);
                    secretNoCorrectPlace.push(secret[i]);
                }
            }

            for (let i = 0; i < guessNoCorrectPlace.length; i++) {
                const indexInSecret = secretNoCorrectPlace.indexOf(guessNoCorrectPlace[i]);
                if (indexInSecret !== -1) {
                    correctDigitsCount++;
                    secretNoCorrectPlace.splice(indexInSecret, 1);
                }
            }

            const totalCorrectDigits = correctPlaceCount + correctDigitsCount;
            return totalCorrectDigits === rule.correctDigits && correctPlaceCount === rule.correctPositions;
        };

        const tryGenerateHint = (rule, attempts = 1000) => {
            for (let i = 0; i < attempts; i++) {
                const candidateHintDigits = [];
                const availableDigits = allDigits.slice();

                for (let j = 0; j < this.codeLength; j++) {
                    const randomIndex = Math.floor(Math.random() * availableDigits.length);
                    candidateHintDigits.push(availableDigits[randomIndex]);
                    availableDigits.splice(randomIndex, 1);
                }
                const candidateHint = candidateHintDigits.join('');
                if (checkHint(candidateHint.split('').map(Number), answerDigits, rule)) {
                    if (candidateHint !== answer && !hints.includes(candidateHint)) {
                        return candidateHint;
                    }
                }
            }
            return null;
        };

        const currentDifficultyHintRules = [...this.difficulty.hintRules];
        currentDifficultyHintRules.sort(() => Math.random() - 0.5);
        for (const rule of currentDifficultyHintRules) {
            if (hints.length >= this.numberOfHints) break;
            const generatedHint = tryGenerateHint(rule);
            if (generatedHint) {
                hints.push(generatedHint);
                rules.push(rule);
            }
        }

        while (hints.length < this.numberOfHints) {
            const randomHintDigits = [];
            for(let i = 0; i < this.codeLength; i++) {
                randomHintDigits.push(Math.floor(Math.random() * 10));
            }
            const newHint = randomHintDigits.join('');
            if (newHint !== answer && !hints.includes(newHint)) {
                hints.push(newHint);
                rules.push(HintRule.ONE_CORRECT_ONE_PLACE);
            }
        }

        if (!this.checkUniqueSolution(hints, rules, answer)) {
            console.warn("[GameLogic.generateHints] Failed unique solution check for generated hints. Retrying puzzle generation.");
            return null;
        }

        return { first: hints, second: rules };
    }

    checkUniqueSolution(hints, rules, answer) {
        const allPossibleCodes = [];
        const digits = Array.from({ length: 10 }, (_, i) => i.toString());
        const self = this;
        function generatePermutationsRecursive(currentCode, availableDigits) {
            if (currentCode.length === self.codeLength) {
                allPossibleCodes.push(currentCode);
                return;
            }
            for (let i = 0; i < availableDigits.length; i++) {
                const digit = availableDigits[i];
                const nextAvailableDigits = availableDigits.slice();
                nextAvailableDigits.splice(i, 1);
                generatePermutationsRecursive(currentCode + digit, nextAvailableDigits);
            }
        }
        generatePermutationsRecursive("", digits);
        const matchingCodes = [];

        for (const candidate of allPossibleCodes) {
            let allHintsMatch = true;
            for (let i = 0; i < hints.length; i++) {
                const hint = hints[i];
                const rule = rules[i];

                const hintMatchResult = this.checkGuessAgainstRule(hint, candidate, rule);
                if (!hintMatchResult) {
                    allHintsMatch = false;
                    break;
                }
            }
            if (allHintsMatch) {
                matchingCodes.push(candidate);
            }
        }
        console.log(`[GameLogic] Unique solution check for code ${answer}: Found ${matchingCodes.length} matching codes. Correct: ${matchingCodes.includes(answer)}`);
        return matchingCodes.length === 1 && matchingCodes[0] === answer;
    }

    checkGuessAgainstRule(hint, candidateCode, rule) {
        let correctPlaceCount = 0;
        const candidateCodeArr = candidateCode.split('').map(Number);
        const hintArr = hint.split('').map(Number);

        let secretCopy = candidateCodeArr.slice();
        let guessCopy = hintArr.slice();
        for (let i = 0; i < this.codeLength; i++) {
            if (guessCopy[i] === secretCopy[i]) {
                correctPlaceCount++;
                guessCopy[i] = -1;
                secretCopy[i] = -2;
            }
        }

        let correctDigitsNotPlace = 0;
        for (let i = 0; i < this.codeLength; i++) {
            if (guessCopy[i] !== -1) {
                const indexInSecret = secretCopy.indexOf(guessCopy[i]);
                if (indexInSecret !== -1) {
                    correctDigitsNotPlace++;
                    secretCopy[indexInSecret] = -2;
                }
            }
        }

        const totalCorrectDigits = correctPlaceCount + correctDigitsNotPlace;
        return totalCorrectDigits === rule.correctDigits && correctPlaceCount === rule.correctPositions;
    }

    calculateCorrectlyPlacedDigits(guess, secret) {
        const correctlyPlacedIndices = [];
        for (let i = 0; i < secret.length; i++) {
            if (guess[i] === secret[i]) {
                correctlyPlacedIndices.push(i);
            }
        }
        return correctlyPlacedIndices;
    }

    makeGuess(guessArray) {
        this.currentGuessAttempt++;
        const guessString = guessArray.join('');

        let correctlyPlacedIndices = null;

        if (guessString === this.secretCode) {
            const reward = this.getReward();
            return new GuessResult(
                true,
                true,
                reward,
                this.maxGuessAttempts - this.currentGuessAttempt,
                correctlyPlacedIndices
            );
        } else {
            correctlyPlacedIndices = this.calculateCorrectlyPlacedDigits(guessArray, this.secretCode.split(''));
            if (this.currentGuessAttempt < this.maxGuessAttempts) {
                return new GuessResult(
                    false,
                    false,
                    0,
                    this.maxGuessAttempts - this.currentGuessAttempt,
                    correctlyPlacedIndices
                );
            } else {
                return new GuessResult(
                    false,
                    true,
                    0,
                    0,
                    correctlyPlacedIndices
                );
            }
        }
    }

    getHintsAndRules() {
        return { first: this.currentHints, second: this.currentHintRules };
    }
}

let gameLogic;

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
    localStorage.setItem('unlockedDifficulties', JSON.stringify(unlockedDifficulties));
    localStorage.setItem('currentLanguage', currentLanguage);
    localStorage.setItem('isDarkMode', isDarkMode);
    localStorage.setItem('isSoundEnabled', isSoundEnabled);
    console.log("[Save] Game data saved.");
}

function loadGameData() {
    console.log("[Load] Loading game data...");

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

    const urlParams = new URLSearchParams(window.location.search);
    const battleId = urlParams.get('battleId');
    if (battleId) {
        APIGetBattle(Telegram.WebApp.initData, battleId)
        .then(data => {
            console.log('[API] Get Battle:', data);
        });

        const battleData = JSON.parse(localStorage.getItem(`battle_${battleId}`));

        if (battleData && battleData.difficulty) {
            currentDifficultyKey = battleData.difficulty.toUpperCase(); // Ensure consistency with Difficulty object keys
        }
        // Get hints enabled status and stake from battle data
        const hintsEnabled = battleData && battleData.hints === 'off' ? false : true;
        localStorage.setItem(`battle_${battleId}_hintsEnabled`, hintsEnabled);
    }
    if (!Difficulty[currentDifficultyKey]) currentDifficultyKey = 'NORMAL';

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

    gameLogic = new GameLogic(Difficulty[currentDifficultyKey]);

    console.log("[Load] Game data loaded: Total Coins:", totalCoins, "Stats:", stats, "Current Difficulty:", currentDifficultyKey, "Language:", currentLanguage, "Dark Mode:", isDarkMode, "Sound Enabled:", isSoundEnabled);
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

    const urlParams = new URLSearchParams(window.location.search);
    const battleId = urlParams.get('battleId');
    let battleData = null;
    if (battleId) {
        battleData = JSON.parse(localStorage.getItem(`battle_${battleId}`));
    }
    const requiredStake = battleData ? battleData.scgStake : 0;

    if (totalCoins >= requiredStake) {
        isGameInProgress = true;
        const resetResult = gameLogic.resetGame();
        if (resetResult.secretCode === "") {
            showMessage(translate('puzzle_generation_failed'), 'red');
            solutionDisplay.textContent = '';
            guessButton.disabled = true;
            isGameInProgress = false;
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
    } else {
        isGameInProgress = false;
        showMessage(translate('insufficient_stake_message', { requiredStake: requiredStake, totalCoins: totalCoins }), 'red');
        solutionDisplay.textContent = '';
        newGameButton.classList.add('hidden');

        const tempGameLogic = new GameLogic(Difficulty[currentDifficultyKey]);
        const tempResetResult = tempGameLogic.resetGame();
        displayHints(tempResetResult.hints, tempResetResult.hintRules);

        stopTimer();
        timerDisplay.textContent = formatTime(0);
        Telegram.WebApp.setHeaderColor('secondary_bg_color');
    }

    updateUI();
    saveGameData();
    console.log("[Game Reset] Game reset complete. New secret code:", gameLogic.getSecretCode());
}

function checkGuess() {
    const guessArray = Array.from(guessInputContainer.querySelectorAll('.digit-display')).map(el => el.textContent);
    const guessResult = gameLogic.makeGuess(guessArray);

    if (guessResult.isWin) {
        stopTimer();
        isGameInProgress = false;
        const earnedCoins = guessResult.reward;
        totalCoins += earnedCoins;
        stats[currentDifficultyKey].gamesPlayed++;
        if (currentElapsedTime < stats[currentDifficultyKey].bestTime) {
            stats[currentDifficultyKey].bestTime = currentElapsedTime;
        }

        if (!unlockedDifficulties.HARD && totalCoins >= UNLOCK_COSTS.HARD) {
            unlockedDifficulties.HARD = true;
            Telegram.WebApp.showPopup({
                title: translate('new_level_unlocked'),
                message: translate('unlocked_level_message', {levelName: translate(Difficulty.HARD.displayNameKey)}),
                buttons: [{ id: 'ok', type: 'ok', text: translate('hooray_button') }]
            });
            populateDifficultySelector();
        }
        if (!unlockedDifficulties.CRAZY && totalCoins >= UNLOCK_COSTS.CRAZY) {
            unlockedDifficulties.CRAZY = true;
            Telegram.WebApp.showPopup({
                title: translate('new_level_unlocked'),
                message: translate('unlocked_level_message', {levelName: translate(Difficulty.CRAZY.displayNameKey)}),
                buttons: [{ id: 'ok', type: 'ok', text: translate('hooray_button') }]
            });
            populateDifficultySelector();
        }

        updateUI();
        saveGameData();

        playSound(currentDifficultyKey === 'NORMAL' ? audioOpenNormal : currentDifficultyKey === 'HARD' ? audioOpenHard : audioOpenCrazy);
        showMessage(translate('safe_cracked_win', {earnedCoins: earnedCoins}), 'green');
        solutionDisplay.textContent = '';
        guessButton.disabled = true;
        newGameButton.classList.remove('hidden');
        showImageWithDelay(`https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/assets/open${currentDifficultyKey === 'NORMAL' ? '1' : currentDifficultyKey === 'HARD' ? '' : '2'}.webp`, 2000);
        setTimeout(() => {
            Telegram.WebApp.showPopup({
                title: translate('victory_title'),
                message: `${translate('safe_cracked_win', {earnedCoins: earnedCoins})}\n${translate('your_time')}: ${formatTime(currentElapsedTime)}\n${translate('best_time')}: ${formatTime(stats[currentDifficultyKey].bestTime)}`,
                buttons: [{ id: 'ok', type: 'ok', text: translate('great_button') }]
            });
            Telegram.WebApp.setHeaderColor('accent_text_color');
        }, 2000);
    } else if (guessResult.isGameOver) {
        stopTimer();
        isGameInProgress = false;

        stats[currentDifficultyKey].gamesPlayed++;
        updateUI();
        saveGameData();

        playSound(audioAlarm);
        showMessage(translate('game_over_message', {secretCode: gameLogic.getSecretCode()}), 'red');
        solutionDisplay.textContent = '';
        guessButton.disabled = true;
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
    const urlParams = new URLSearchParams(window.location.search);
    const battleId = urlParams.get('battleId');
    let battleData = null;
    if (battleId) {
        battleData = JSON.parse(localStorage.getItem(`battle_${battleId}`));
    }
    if (battleData && battleData.scgStake) {
        currentHintCost = Math.floor(battleData.scgStake * 0.45);
    } else {
        currentHintCost = gameLogic.getHintCost(); // Fallback на случай, если нет данных батла
    }

    activeHintIndex = digitIndex;

    const hintsEnabled = battleId ? (localStorage.getItem(`battle_${battleId}_hintsEnabled`) === 'true') : true;
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
            if (isGameInProgress && unlockedDifficulties[currentDifficultyKey] && !lockedDigits.has(idx)) {
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
            if (isGameInProgress && unlockedDifficulties[currentDifficultyKey] && !lockedDigits.has(idx)) {
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
            if (isGameInProgress && unlockedDifficulties[currentDifficultyKey] && !lockedDigits.has(idx)) {
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
            if (isGameInProgress && unlockedDifficulties[currentDifficultyKey]) {
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

    const urlParams = new URLSearchParams(window.location.search);
    const battleId = urlParams.get('battleId');
    let battleData = null;
    if (battleId) {
        battleData = JSON.parse(localStorage.getItem(`battle_${battleId}`));
    }
    const requiredStake = battleData ? battleData.scgStake : 0;

    if (totalCoins >= requiredStake && isGameInProgress) {
        guessButton.disabled = false;
        guessButton.classList.remove('bg-gray-400');
        guessButton.classList.add('bg-green-500', 'hover:bg-green-600');
    } else {
        guessButton.disabled = true;
        guessButton.classList.add('bg-gray-400');
        guessButton.classList.remove('bg-green-500', 'hover:bg-green-600');
    }

    const hintsEnabled = battleId ? (localStorage.getItem(`battle_${battleId}_hintsEnabled`) === 'true') : true;

    guessInputContainer.querySelectorAll('.digit-picker').forEach((picker, index) => {
        const upButton = picker.querySelector('.up-arrow');
        const downButton = picker.querySelector('.down-arrow');
        const hintButton = picker.querySelector('.hint-button');
        const digitDisplay = picker.querySelector('.digit-display');

        const isDigitLockedOrRevealed = revealedDigits.has(index) || lockedDigits.has(index);

        upButton.disabled = !isGameInProgress || isDigitLockedOrRevealed || totalCoins < requiredStake;
        downButton.disabled = !isGameInProgress || isDigitLockedOrRevealed || totalCoins < requiredStake;
        digitDisplay.style.cursor = (!isGameInProgress || isDigitLockedOrRevealed || totalCoins < requiredStake) ? 'default' : 'pointer';

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

    // Отображение участников батла
    if (battleData && battleData.participants) {
        const participantsDisplay = document.createElement('p');
        participantsDisplay.textContent = translate('participants_label') + ":<br>" + battleData.participants.map(id => `User ${id}`).join('<br>');
        participantsDisplay.className = 'text-sm text-gray-600 dark:text-gray-300 mb-2';
        if (!document.getElementById('participants-display')) {
            document.querySelector('.game-container').insertBefore(participantsDisplay, hintModalOverlay);
            participantsDisplay.id = 'participants-display';
        } else {
            document.getElementById('participants-display').textContent = participantsDisplay.textContent;
        }
    }

    // Отображение ссылки для приглашения
    if (battleData && battleId) {
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
    const isCurrentDifficultyUnlockedState = unlockedDifficulties[currentDifficultyKey];

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
    gameImage.src = src;
    imageOverlay.classList.remove('hidden');
    setTimeout(() => {
        imageOverlay.classList.add('hidden');
    }, duration + 2000); // Добавляем 2 секунды задержки
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
        gameLogic.setDifficulty(Difficulty[currentDifficultyKey]);
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
        if (Object.prototype.hasOwnProperty.call(Difficulty, key) &&
            typeof Difficulty[key] === 'object' &&
            Difficulty[key] !== null &&
            Difficulty[key].displayNameKey) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = translate(Difficulty[key].displayNameKey);
            difficultySelector.appendChild(option);
        } else {
            console.warn(`[Difficulty Selector] Skipping invalid difficulty key: ${key}`);
        }
    }
    // Set the difficulty selector to the value from battleData
    const urlParams = new URLSearchParams(window.location.search);
    const battleId = urlParams.get('battleId');
    if (battleId) {
        const battleData = JSON.parse(localStorage.getItem(`battle_${battleId}`));
        if (battleData && battleData.difficulty) {
            currentDifficultyKey = battleData.difficulty.toUpperCase();
            difficultySelector.value = currentDifficultyKey;
        }
    }
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

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DOM Loaded] DOM content fully loaded.");

    console.log("[DOM Loaded] Starting a new game.");
    playSound(audioOpen);
    showImageWithDelay('https://github.com/safecrackinggame/safe-cracking-tg-webapp/raw/main/design/assets/start.webp', 5000);
    setTimeout(() => {
        resetGame();
    }, 7000); // 5000 (изображение) + 2000 (задержка)

    totalCoins = await APIGetCoins(Telegram.WebApp.initData);
    console.log('[API] GetCoins:', totalCoins);

    loadGameData();
    populateLanguageSelector();
    populateDifficultySelector();

    // Ожидаем завершения загрузки переводов
    try {
        await loadTranslations(currentLanguage);
    } catch (error) {
        console.error("[DOM Loaded] Failed to load translations, falling back to English:", error);
        await loadTranslations('en'); // Fallback на случай ошибки
    }

    if (totalCoins >= UNLOCK_COSTS.HARD) {
        unlockedDifficulties.HARD = true;
    }
    if (totalCoins >= UNLOCK_COSTS.CRAZY) {
        unlockedDifficulties.CRAZY = true;
    }
});
