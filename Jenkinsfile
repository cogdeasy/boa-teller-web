// Branch Technology shared pipeline - boa-teller-web
pipeline {
  agent { label 'linux-node' }
  tools { nodejs 'node-8.11' }
  options {
    buildDiscarder(logRotator(numToKeepStr: '20'))
    timeout(time: 20, unit: 'MINUTES')
  }
  environment {
    CHROME_BIN = '/usr/bin/chromium-browser'
    NPM_CONFIG_REGISTRY = 'https://artifactory.bofa.com/api/npm/npm-virtual/'
  }
  stages {
    stage('Install') {
      steps { sh 'npm install' }
    }
    stage('Lint') {
      steps { sh 'npm run lint || true' }
    }
    stage('Unit tests') {
      steps { sh 'npm test' }
    }
    stage('Build') {
      steps { sh 'npm run build' }
    }
    stage('Package') {
      when { branch 'main' }
      steps {
        sh 'tar -czf boa-teller-web-${BUILD_NUMBER}.tgz -C dist .'
        archiveArtifacts artifacts: 'boa-teller-web-*.tgz', fingerprint: true
      }
    }
  }
  post {
    failure {
      mail to: 'branch-tech@bofa.com', subject: "boa-teller-web #${BUILD_NUMBER} failed", body: "${BUILD_URL}"
    }
  }
}
