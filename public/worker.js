document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startCamera');
    const video = document.getElementById('camera');
    const pointer = document.getElementById('pointer');
    let ws;

    startButton.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false
            });

            video.srcObject = stream;
            video.style.display = 'block';
            startButton.style.display = 'none';

            ws = new WebSocket(`wss://${location.host}`);
            ws.addEventListener('open', () => {
                console.log('WebSocket connected as worker');
                ws.send(JSON.stringify({ type: 'register', role: 'worker' }));
            });

            ws.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'pointer') {
                    const rect = video.getBoundingClientRect();
                    pointer.style.left = `${data.x * rect.width}px`;
                    pointer.style.top = `${data.y * rect.height}px`;
                    pointer.style.display = 'block';

                    setTimeout(() => {
                        pointer.style.display = 'none';
                    }, 500);
                }
            });
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert(`Camera access denied: ${error.message}`);
        }
    });
});
