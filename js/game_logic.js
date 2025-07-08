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
