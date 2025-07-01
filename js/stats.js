function displayData(data) {
    const container = document.getElementById('userCardsContainer');
    container.innerHTML = '';

    data.result.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';

        const createdDate = new Date(user.dt_created).toLocaleString('ru-RU');
        const updatedDate = new Date(user.dt_updated).toLocaleString('ru-RU');
        const formattedCoins = user.coins.toLocaleString('ru-RU');

        card.innerHTML = `
            <p><strong>ID:</strong>${user.id}</p>
            <p><strong>Telegram ID:</strong>${user.telegram_id}</p>
            <p><strong>Coins:</strong>${formattedCoins}</p>
            <p><strong>Дата создания:</strong>${createdDate}</p>
            <p><strong>Дата обновления:</strong>${updatedDate}</p>
        `;

        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const initData = Telegram.WebApp.initData;
    if (!initData) {
        return 'Not running inside Telegram';
    }

    const apiResponse = await APIStats(Telegram.WebApp.initData);
    console.log('[API] Stats:', apiResponse);

    if (!apiResponse.success) {
        console.log("ERROR: ", apiResponse);
    } else {
        displayData(apiResponse);
    }
});
