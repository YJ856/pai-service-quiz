pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
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
                echo 'Installing npm dependencies...'
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                echo 'Running linter...'
                sh 'npm run lint:check'
            }
        }

        stage('Build') {
            steps {
                echo 'Building NestJS application...'
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo 'Building Docker image...'
                    // Build once with BUILD_NUMBER tag
                    sh "docker build -t songhyunkwang/pai-service-quiz:${BUILD_NUMBER} ."
                    // Add latest tag to the same image
                    sh "docker tag songhyunkwang/pai-service-quiz:${BUILD_NUMBER} songhyunkwang/pai-service-quiz:latest"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo 'Pushing Docker image to Docker Hub...'
                    // Login to Docker Hub and push images
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        sh "docker push songhyunkwang/pai-service-quiz:${BUILD_NUMBER}"
                        sh "docker push songhyunkwang/pai-service-quiz:latest"
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Docker image pushed: songhyunkwang/pai-service-quiz:${BUILD_NUMBER}"
        }
        failure {
            echo 'Pipeline failed!'
        }
        always {
            // Cleanup: remove Docker images to save space
            sh "docker rmi songhyunkwang/pai-service-quiz:${BUILD_NUMBER} || true"
            sh "docker rmi songhyunkwang/pai-service-quiz:latest || true"
            // Remove dangling images (untagged <none> images)
            sh "docker image prune -f || true"
            cleanWs()
        }
    }
}
