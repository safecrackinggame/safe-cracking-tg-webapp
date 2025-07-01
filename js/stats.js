document.addEventListener('DOMContentLoaded', async () => {
    alert('Hello');

    const initData = Telegram.WebApp.initData;
    if (!initData) {
        return 'Not running inside Telegram';
    }
});
