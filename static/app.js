const $ = id => document.getElementById(id);

async function get(url) {
    const response = await fetch(url);
    if (!response.ok) throw Error(response.status);
    return response.json();
}

async function refresh() {
    try {
        const [status, readings, alerts] = await Promise.all([
            get('/api/status'),
            get('/api/readings'),
            get('/api/alerts')
        ]);

        const latest = status.latest;

        if (latest) {
            // Dashboard values
            $('tds').textContent = latest.tds;
            $('turbidity').textContent = latest.turbidity;
            $('vibration').textContent = latest.vibration;
            $('acoustic').textContent = latest.acoustic;

            // Sensor Data page
            $('sensorTds').textContent = latest.tds;
            $('sensorTurbidity').textContent = latest.turbidity;
            $('sensorVibration').textContent = latest.vibration;
            $('sensorAcoustic').textContent = latest.acoustic;

            // Condition assessment
            $('leak').textContent = latest.leak_status;
            $('water').textContent = latest.water_status;

            $('leak').style.color =
                latest.leak_status === 'NORMAL' ? '#31d69a' : '#ffb45e';

            $('water').style.color =
                latest.water_status === 'NORMAL' ? '#31d69a' : '#ffb45e';

            $('leakText').textContent =
                latest.leak_status === 'NORMAL'
                ? 'No suspected leak in this test reading.'
                : 'Abnormal vibration/acoustic signal. Inspect pipeline.';

            $('waterText').textContent =
                latest.water_status === 'NORMAL'
                ? 'Within configured demo thresholds.'
                : 'TDS/turbidity threshold crossed. Further testing required.';

            $('updated').textContent = latest.created_at;
            $('statusUpdated').textContent = latest.created_at;
        }

        // Reading history
        const historyRows = readings.slice().reverse();

        $('rows').innerHTML = historyRows.map(item => `
            <tr>
                <td>${item.created_at}</td>
                <td>${item.tds}</td>
                <td>${item.turbidity}</td>
                <td>${item.vibration}</td>
                <td>${item.acoustic}</td>
                <td>${item.leak_status}</td>
                <td>${item.water_status}</td>
            </tr>
        `).join('');

        // Alerts page and dashboard alert panel
        const alertHTML = alerts.length
            ? alerts.map(item => `
                <div class="state">
                    ⚠ <b>${item.category}</b>
                    <p>${item.message}</p>
                    <small>${item.created_at}</small>
                </div>
            `).join('')
            : 'No alerts recorded yet.';

        $('alertsList').innerHTML = alertHTML;
        $('alerts').innerHTML = alertHTML;

        // Draw both charts
        draw('chart', readings);
        draw('sensorChart', readings);

        $('statusMessage').textContent =
            'Backend connected. Readings retrieved successfully.';

    } catch (error) {
        $('msg').textContent = 'Backend unavailable. Start app.py.';
        $('statusMessage').textContent = 'Unable to connect to backend.';
    }
}

function draw(canvasId, data) {
    const canvas = $(canvasId);

    if (!canvas || canvas.clientWidth === 0) return;

    const context = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const height = 160;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);

    // Grid
    context.strokeStyle = '#263d51';

    for (let y = 15; y < height; y += 40) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
    }

    if (data.length < 2) return;

    // TDS and turbidity trend lines
    [
        ['tds', '#38a9ff', 700],
        ['turbidity', '#ae8cff', 10]
    ].forEach(([key, color, max]) => {

        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = 2;

        data.forEach((reading, index) => {
            const x = 5 + index * (width - 10) / (data.length - 1);
            const y = height - 10 -
                Math.min(Number(reading[key]), max) / max * (height - 25);

            if (index === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        });

        context.stroke();
    });
}

// Simulate test scenarios
async function sim(scenario) {
    $('msg').textContent = 'Sending sample data to Flask...';

    try {
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scenario })
        });

        if (!response.ok) throw Error(response.status);

        $('msg').textContent =
            'Test data received and saved to SQLite.';

        await refresh();

    } catch (error) {
        $('msg').textContent =
            'Backend unavailable. Start app.py.';
    }
}

// Refresh hidden-page chart when its navigation section opens
window.addEventListener('aquatrack:viewchange', refresh);

// Initial loading and periodic refresh
refresh();

setInterval(() => {
    refresh();
}, 5000);

window.addEventListener('resize', refresh);

