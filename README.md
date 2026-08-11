# jenkins-demo

A small Express API with a Jenkins pipeline that tests, builds, deploys, and
load-tests it, and rolls back automatically if something fails. The code lives on
a public GitHub repo. Jenkins runs on a Raspberry Pi and polls GitHub for new
commits.

## Layout

```
http-api/         the app and its pipeline
  app.js          one /health route
  test/           the test for that route
  Dockerfile      multi-stage build (test stage + runtime stage)
  docker-compose.yml   runs the app (project "http-api", port 8091)
  loadtest.js     k6 load test with pass/fail thresholds
  Jenkinsfile     the pipeline

jenkins-server/   the Jenkins server (Docker)
  Dockerfile      Jenkins + Docker CLI + JCasC and Job DSL plugins
  docker-compose.yml   runs Jenkins on port 8090
  jenkins.yaml    creates the jenkins-demo job on startup (JCasC)
```

Ports are 8090 for the Jenkins UI and 8091 for the app, to avoid clashing with
other things on the Pi.

## Pipeline

The stages in `http-api/Jenkinsfile` are: Test (build fails if a test fails),
Build (image tagged by commit), Deploy (`docker compose up -d`), Verify (health
check), and Load test (k6). If anything fails after Deploy, it redeploys the last
good image.

## Examples

Success: all stages pass and the app is deployed.

![Pipeline success](pipeline-success-example.png)

Test error: a failing test stops the pipeline, so nothing is deployed.

![Test error](pipeline-test-error-example.png)

Load test error: the app deployed but failed the load test, so it rolled back.

![Load test error](pipeline-load-test-error-example.png)

## Run it

1. Push this folder to a public GitHub repo named `jenkins-demo`:

   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/godinhojoao/jenkins-demo.git
   git push -u origin main
   ```

   If your username differs, update the `url(...)` in `jenkins-server/jenkins.yaml`.

2. Start Jenkins on the Pi:

   ```bash
   cd jenkins-server
   docker compose up -d --build
   docker compose logs jenkins
   ```

   Open http://server.local:8090, unlock it with the password from the logs,
   install the suggested plugins, and create a user. Jenkins creates the
   `jenkins-demo` job by itself from `jenkins.yaml`.

3. Push a commit. Jenkins polls GitHub every 2 minutes and runs the pipeline.
   When it passes, the app is at http://server.local:8091/health.

## Triggering

GitHub can't reach a Pi on a local network (no public IP, and no VPN like
Tailscale by choice), so the job polls GitHub every 2 minutes instead of using a
webhook. With a public IP or a VPS you could use a GitHub webhook for instant
builds.

## GitHub access

A public repo needs no credentials, so there are no secrets in this project.
You'd only need a token if you make the repo private. In that case create a
GitHub personal access token (Settings, Developer settings, fine-grained tokens)
with read access to the repo, add it in Jenkins under Credentials as a
username/token pair, and reference it in the job's Git settings. Use a token, not
your password, since GitHub no longer accepts passwords over HTTPS.

## Updating

If you change `jenkins-server/jenkins.yaml` (the job config), restart Jenkins so
it reloads:

```bash
cd jenkins-server
docker compose restart jenkins
```

If you change `http-api/Jenkinsfile` (the pipeline), you don't restart anything.
Just commit and push. Jenkins pulls the latest Jenkinsfile from GitHub on the
next build.

## Reset

Run inside `jenkins-server/` or `http-api/` to remove containers, volumes, and
images (this deletes data):

```bash
docker compose down -v --rmi all --remove-orphans
```

## Agents

This runs on a single node: the same Jenkins container is the controller (UI,
scheduling, config) and also runs the pipeline steps (`agent any`). I kept it
this way because it's a homelab with one machine and my own code.

You could instead run builds on separate agents. The real advantages are:

- Security: builds run away from the controller, so they can't reach its config
  and credentials. This matters most for untrusted code (like public pull
  requests).
- Scale: spread many builds across several machines and run them in parallel.
- Clean environments: use a fresh, disposable container per build.
- Different platforms: build on another OS or CPU architecture.

An agent can be almost anything that runs Java and connects back to the
controller: another physical machine, a VM, a VPS, a cloud instance, or just
another container on the same host. To use one, define it in `jenkins.yaml` and
point the pipeline at it with `agent { label '...' }` instead of `agent any`.
Since this pipeline uses Docker, the agent also needs access to a Docker daemon.
