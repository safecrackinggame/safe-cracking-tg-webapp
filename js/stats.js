function displayData(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; 

    data.result.forEach(user => {
        const row = document.createElement('tr');

        const createdDate = new Date(user.dt_created).toLocaleString('ru-RU');
        const updatedDate = new Date(user.dt_updated).toLocaleString('ru-RU');

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.telegram_id}</td>
            <td>${user.coins.toLocaleString('ru-RU')}</td>
            <td>${createdDate}</td>
            <td>${updatedDate}</td>
        `;

        tableBody.appendChild(row);
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
