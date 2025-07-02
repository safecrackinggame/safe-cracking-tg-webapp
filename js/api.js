async function APIInitUser(initData, coins) {
    const url = 'https://scg.rain.dp.ua/api/user/init';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: initData,
                totalCoins: coins,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Request error:', error);
    }
}

async function APIGetCoins(initData) {
    const url = 'https://scg.rain.dp.ua/api/user/get/coins';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: initData,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        return data.result;
    } catch (error) {
        console.error('Request error:', error);
        return 0;
    }
}

async function APISetCoins(initData, coins) {
    const url = 'https://scg.rain.dp.ua/api/user/set/coins';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: initData,
                totalCoins: coins,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Request error:', error);
        return 0;
    }
}

async function APIAddCoins(initData, coins) {
    const url = 'https://scg.rain.dp.ua/api/user/addcoins';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: initData,
                coins: coins,
            }),
        });

        if (!response.ok) {
            console.error('[API] APIAddCoins error:', response.status);
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[API] APIAddCoins Request error:', error);
        return 0;
    }
}

async function APIStats(initData) {
    const url = 'https://scg.rain.dp.ua/api/stats';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: initData,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error('[API] Stats Request error:', error);
        return 0;
    }
}

async function APICreateBattle(initData, stake, battleType, difficulty, gameCount, hints) {
    const url = 'https://scg.rain.dp.ua/api/battle/create';
    console.log('[API] battle create');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: initData,
                stake: stake,
                battleType: battleType,
                difficulty: difficulty,
                gameCount: gameCount,
                hints: hints,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[API] battle create Request error:', error);
        return 0;
    }
}

async function APIGetBattle(initData, battleId) {
    const url = 'https://scg.rain.dp.ua/api/battle/get';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: initData,
                battleId: battleId,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Request error:', error);
        return 0;
    }
}
