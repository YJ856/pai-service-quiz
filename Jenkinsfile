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
  - name: git
    image: alpine/git:latest
    command:
    - cat
    tty: true
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

        stage('Update GitOps Repository') {
            steps {
                container('git') {
                    script {
                        echo "Updating GitOps repository with new image tag: ${IMAGE_TAG}"

                        withCredentials([usernamePassword(credentialsId: 'github-credentials',
                                                          usernameVariable: 'GIT_USERNAME',
                                                          passwordVariable: 'GIT_PASSWORD')]) {
                            sh """
                                git config --global user.email "jenkins@pai.com"
                                git config --global user.name "Jenkins CI"

                                # Clone gitops repo
                                git clone https://\${GIT_USERNAME}:\${GIT_PASSWORD}@github.com/YJ856/pai-gitops.git
                                cd pai-gitops

                                # Update image tag in deployment file
                                sed -i 's|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${IMAGE_TAG}|g' k8s/base/quiz-service-deploy.yaml

                                # Commit and push
                                git add k8s/base/quiz-service-deploy.yaml
                                git commit -m "Update quiz-service image to ${IMAGE_TAG}" || echo "No changes to commit"
                                git push origin master
                            """
                        }
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
    }
}
