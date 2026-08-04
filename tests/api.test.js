import test from 'node:test';
import assert from 'node:assert/strict';
import server from '../server.js';

test('GET /api/hello 返回 JSON 包含 message 和 timestamp', async () => {
  const { promise, resolve } = Promise.withResolvers();

  server.once('listening', () => {
    const addr = server.address();
    const url = `http://localhost:${addr.port}/api/hello`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        assert.equal(data.message, 'Hello, World!');
        assert.ok(data.timestamp, 'timestamp 字段存在');
        // Validate ISO 8601 format
        const parsed = new Date(data.timestamp);
        assert.ok(!isNaN(parsed.getTime()), 'timestamp 是有效的 ISO 8601 时间');
        assert.equal(parsed.toISOString(), data.timestamp);
        resolve();
      })
      .catch(err => {
        resolve(err);
      });
  });

  server.listen(0); // Random available port
  const result = await promise;
  server.close();

  if (result instanceof Error) throw result;
});
