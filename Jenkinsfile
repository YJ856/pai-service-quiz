pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: agent
  namespace: jenkins
spec:
  serviceAccountName: jenkins
  containers:
  - name: node
    image: node:22-alpine
    command:
    - cat
    tty: true
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command:
    - /busybox/cat
    tty: true
    volumeMounts:
    - name: docker-config
      mountPath: /kaniko/.docker
  volumes:
  - name: docker-config
    secret:
      secretName: dockerhub-regcred
      items:
      - key: .dockerconfigjson
        path: config.json
"""
        }
    }

    environment {
        IMAGE_NAME = 'songhyunkwang/pai-service-quiz'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                container('node') {
                    echo 'Installing npm dependencies...'
                    sh 'npm ci'
                }
            }
        }

        stage('Lint') {
            steps {
                container('node') {
                    echo 'Running linter...'
                    sh 'npm run lint:check'
                }
            }
        }

        stage('Build') {
            steps {
                container('node') {
                    echo 'Building NestJS application...'
                    sh 'npm run build'
                }
            }
        }

        stage('Test') {
            steps {
                container('node') {
                    echo 'Running tests...'
                    sh 'npm test'
                }
            }
        }

        stage('Build and Push with Kaniko') {
            steps {
                container('kaniko') {
                    script {
                        echo "Building and pushing image: ${IMAGE_NAME}:${IMAGE_TAG}"

                        sh """
                            /kaniko/executor \
                              --context=\${WORKSPACE} \
                              --dockerfile=\${WORKSPACE}/Dockerfile \
                              --destination=${IMAGE_NAME}:${IMAGE_TAG} \
                              --destination=${IMAGE_NAME}:latest \
                              --cache=true \
                              --cache-ttl=24h \
                              --compressed-caching=false
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Docker image pushed: ${IMAGE_NAME}:${IMAGE_TAG}"
            echo "Docker image pushed: ${IMAGE_NAME}:latest"
        }
        failure {
            echo 'Pipeline failed!'
        }
        always {
            cleanWs()
        }
    }
}
