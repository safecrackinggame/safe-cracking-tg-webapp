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
