const test = require('node:test');
const assert = require('node:assert');
const app = require('../app');

test('GET /health returns 200 and status ok', async () => {
  const server = app.listen(0);            // start on a random free port
  const { port } = server.address();
  try {
    const res = await fetch(`http://localhost:${port}/health`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
  } finally {
    server.close();
  }
});
