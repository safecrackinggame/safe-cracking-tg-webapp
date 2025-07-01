document.addEventListener('DOMContentLoaded', async () => {
    const initData = Telegram.WebApp.initData;
    if (!initData) {
        return 'Not running inside Telegram';
    }

    const data = await APIStats(Telegram.WebApp.initData);
    console.log('[API] Stats:', data);
});
