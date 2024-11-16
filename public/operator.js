document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket(`wss://${location.host}`);

    ws.addEventListener('open', () => {
        console.log('WebSocket connected as operator');
        ws.send(JSON.stringify({ type: 'register', role: 'operator' }));
    });

    const video = document.getElementById('camera');
    video.addEventListener('click', (event) => {
        const rect = video.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width; // Normalize x
        const y = (event.clientY - rect.top) / rect.height; // Normalize y

        ws.send(JSON.stringify({ type: 'pointer', role: 'operator', x, y }));
    });
});
