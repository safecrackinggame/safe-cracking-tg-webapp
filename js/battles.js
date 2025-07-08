let isDarkMode = localStorage.getItem('isDarkMode') === 'true';
let isSoundEnabled = localStorage.getItem('isSoundEnabled') !== null ? localStorage.getItem('isSoundEnabled') === 'true' : true;

updateTheme();
updateSoundIcon();

const difficultySelector = document.getElementById('difficulty-selector');
const languageSelector = document.getElementById('language-selector');

function populateDifficultySelector() {
    if (difficultySelector) {
        difficultySelector.innerHTML = '';
        const difficulties = ['Normal', 'Hard', 'Crazy'];
        difficulties.forEach(difficulty => {
            const option = document.createElement('option');
            option.value = difficulty;
            option.textContent = difficulty;
            difficultySelector.appendChild(option);
        });
        difficultySelector.value = 'Normal';
    }
}

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
let currentLanguage = localStorage.getItem('currentLanguage') || Telegram.WebApp.initDataUnsafe?.user?.language_code || 'en';

function populateLanguageSelector() {
    if (languageSelector) {
        languageSelector.innerHTML = '';
        for (const langCode in supportedLanguages) {
            const option = document.createElement('option');
            option.value = langCode;
            option.textContent = supportedLanguages[langCode];
            languageSelector.appendChild(option);
        }
        languageSelector.value = currentLanguage;
    }
}

difficultySelector?.addEventListener('change', (event) => {
    console.log(`[Difficulty Selector] Changed to: ${event.target.value}`);
});

languageSelector?.addEventListener('change', (event) => {
    currentLanguage = event.target.value;
    localStorage.setItem('currentLanguage', currentLanguage);
    console.log(`[Language Selector] Changed to: ${event.target.value}`);
});

document.addEventListener('DOMContentLoaded', () => {
    populateDifficultySelector();
    populateLanguageSelector();

    const modal = document.getElementById('modal');
    const createBattleBtn = document.getElementById('create-battle-btn');
    const createBtn = document.getElementById('create-btn');
    const gameCountInput = document.getElementById('game-count');
    const participantsInput = document.getElementById('participants');
    const scgStakeInput = document.getElementById('scg-stake');
    const scgStakeLabel = document.getElementById('scg-stake-label');

    function updateSCG() {
        APIGetCoins(Telegram.WebApp.initData)
        .then(totalCoins => {
            console.log('[API] GetCoins:', totalCoins, 'updateSCG');
            scgStakeLabel.textContent = `Ставка SCG (Max ${totalCoins}):`;
        });
    }

    window.addEventListener('storage', () => {
        updateSCG();
        validateForm();
    });

    createBattleBtn.addEventListener('click', () => {
        updateSCG();
        modal.style.display = 'flex';
    });

    function validateForm() {
        const gameCount = parseInt(gameCountInput.value) || 1;
        const participants = parseInt(participantsInput.value) || 2;
        const scgStake = parseInt(scgStakeInput.value) || 0;

        APIGetCoins(Telegram.WebApp.initData)
        .then(totalCoins => {
            console.log('[API] GetCoins:', totalCoins, 'validateForm');
            scgStakeLabel.textContent = `Ставка SCG (Max ${totalCoins}):`;

            const isValid = gameCount >= 1 && gameCount <= 10 &&
                       participants >= 2 && participants <= 10 &&
                       scgStake > 0 && scgStake <= totalCoins;

            createBtn.disabled = !isValid;
        });
    }

    [gameCountInput, participantsInput, scgStakeInput].forEach(input => {
        input.addEventListener('input', validateForm);
    });

    createBtn.addEventListener('click', () => {
        if (createBtn.disabled) {
            return;
        }

        const scgStake = parseInt(scgStakeInput.value);

        APICreateBattle(
            Telegram.WebApp.initData,
            scgStake,
            document.getElementById('battle-type').value,
            document.getElementById('difficulty').value,
            parseInt(gameCountInput.value),
            document.getElementById('hints').value,
            parseInt(participantsInput.value)
        )
        .then(data => {
            console.log('[API] battle create response:', data);

            if (data && data.success) {
                const battleId = data.battleId;
                const user = Telegram.WebApp.initDataUnsafe.user;
                if (!user || !user.id) {
                    Telegram.WebApp.showPopup({
                        title: "Ошибка",
                        message: "Не удалось получить ваши данные. Пожалуйста, авторизуйтесь в Telegram.",
                        buttons: [{ id: 'ok', type: 'ok', text: "OK" }]
                    });
                    return;
                }

                console.log("[Battle Created] Battle ID:", battleId);
                modal.style.display = 'none';
                window.location.href = `./battle.html?battleId=${battleId}`;
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    updateSCG();
    validateForm();
});
