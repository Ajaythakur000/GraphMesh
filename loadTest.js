const http = require('http');

const payload = JSON.stringify({
    routers: [
        { id: 1, x: 100, y: 100, z: 0.0, baseRadius: 100, channel: 0, band: 1 },
        { id: 2, x: 150, y: 150, z: 0.0, baseRadius: 100, channel: 0, band: 1 }
    ],
    walls: [
        { id: 1, startX: 120, startY: 80, endX: 120, endY: 200, material: 1 }
    ]
});

const sendRequest = () => {
    return new Promise((resolve) => {
        const start = performance.now();
        const req = http.request('http://localhost:3000/api/compute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    time: performance.now() - start,
                    data: data
                });
            });
        });
        req.on('error', (e) => {
            resolve({
                status: 500,
                time: performance.now() - start,
                error: e.code === 'ECONNREFUSED' ? 'ECONNREFUSED: Server is not running on port 3000' : e.message
            });
        });
        req.write(payload);
        req.end();
    });
};

const runTest = async (concurrency) => {
    console.log(`\nStarting test with ${concurrency} concurrent requests...`);
    const promises = [];
    for (let i = 0; i < concurrency; i++) {
        promises.push(sendRequest());
    }
    
    const startAll = performance.now();
    const results = await Promise.all(promises);
    const endAll = performance.now();
    
    const successes = results.filter(r => r.status === 200).length;
    const failures = results.filter(r => r.status !== 200).length;
    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    
    console.log(`Results for ${concurrency} requests:`);
    console.log(`- Success: ${successes}`);
    console.log(`- Failures: ${failures}`);
    console.log(`- Average Time per request: ${avgTime.toFixed(2)}ms`);
    console.log(`- Total Time for all: ${(endAll - startAll).toFixed(2)}ms`);
    
    if (failures > 0) {
        console.log(`- Sample Failure Error:`, results.find(r => r.status !== 200));
    }
};

(async () => {
    try {
        await runTest(1);
        await new Promise(r => setTimeout(r, 1000));
        await runTest(10);
        await new Promise(r => setTimeout(r, 1000));
        await runTest(50);
        await new Promise(r => setTimeout(r, 1000));
        await runTest(100);
    } catch (e) {
        console.error(e);
    }
})();
