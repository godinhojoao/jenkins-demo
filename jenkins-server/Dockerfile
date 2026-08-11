# Jenkins with the Docker CLI + Compose plugin, so pipelines can build and deploy.
# jdk21: Java 17 support in Jenkins ends 2026-03-31; LTS runs on Java 21.
FROM jenkins/jenkins:lts-jdk21
USER root
RUN apt-get update && apt-get install -y ca-certificates curl gnupg \
 && install -m 0755 -d /etc/apt/keyrings \
 && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
 && echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
      > /etc/apt/sources.list.d/docker.list \
 && apt-get update && apt-get install -y docker-ce-cli docker-compose-plugin \
 && rm -rf /var/lib/apt/lists/*
USER jenkins
# Plugins for "job as code": JCasC + Job DSL, plus pipeline + git.
RUN jenkins-plugin-cli --plugins \
      configuration-as-code \
      job-dsl \
      workflow-aggregator \
      git
