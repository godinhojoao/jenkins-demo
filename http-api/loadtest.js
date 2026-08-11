// k6 load test — run by the Jenkins "Load test" stage after deploy.
//
// k6 exits non-zero when a threshold is breached, so a slow or failing app
// fails the pipeline stage → triggers the rollback in post { failure }.
//
// Target URL comes from BASE_URL (set by the Jenkinsfile); falls back to the
// locally published port so you can also run it by hand:
//   docker run --rm -i --network host grafana/k6 run - < loadtest.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8091';

export const options = {
  vus: 10,             // 10 virtual users hitting it concurrently
  duration: '20s',     // for 20 seconds
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // <1% of requests may fail
    http_req_duration: ['p(95)<500'],   // 95th-percentile latency under 500ms
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is ok':    (r) => r.json('status') === 'ok',
  });
  sleep(1);
}
