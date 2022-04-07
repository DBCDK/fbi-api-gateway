#!groovy​

def app
def imageName="bibliotekdk-next-api"
def imageLabel=BUILD_NUMBER

pipeline {
    agent {
        label 'devel10-head'
    }
    environment {
        GITLAB_ID = "702"
        DOCKER_TAG = "${imageLabel}"
        IMAGE = "${imageName}${env.BRANCH_NAME != 'master' ? "-${env.BRANCH_NAME.toLowerCase()}" : ''}:${imageLabel}"
        DOCKER_COMPOSE_NAME = "compose-${IMAGE}"
        GITLAB_PRIVATE_TOKEN = credentials("metascrum-gitlab-api-token")
        REPOSITORY = "https://docker-frontend.artifacts.dbccloud.dk"
    }
    stages {

        stage('Build image') {
            steps { script {
                // Work around bug https://issues.jenkins-ci.org/browse/JENKINS-44609 , https://issues.jenkins-ci.org/browse/JENKINS-44789
                sh "docker build -t ${IMAGE} --pull --no-cache ."
                app = docker.image("${IMAGE}")
            } }
        }
        stage('Integration test') {
            steps {
                script {
                    ansiColor("xterm") {
                        sh "echo Integrating..."
                        // sh "docker-compose -f docker-compose-cypress.yml -p ${DOCKER_COMPOSE_NAME} build"
                        // sh "IMAGE=${IMAGE} docker-compose -f docker-compose-cypress.yml -p ${DOCKER_COMPOSE_NAME} run e2e"
                    }
                }
            }
        }
        stage('Push to Artifactory') {
           when {
               branch "master"
           }
            steps {
                script {
                    if (currentBuild.resultIsBetterOrEqualTo('SUCCESS')) {
                        docker.withRegistry("${REPOSITORY}", 'docker') {
                            app.push()
                            app.push("latest")
                        }
                    }
                } }
        }
        stage("Update staging version number") {
			agent {
				docker {
					label 'devel10-head'
					image "https://docker-dbc.artifacts.dbccloud.dk/build-env:latest"
					alwaysPull true
				}
			}
			when {
				branch "master"
			}
			steps {
				dir("deploy") {
					sh """#!/usr/bin/env bash
						set-new-version configuration.yaml ${env.GITLAB_PRIVATE_TOKEN} ${env.GITLAB_ID} ${env.DOCKER_TAG} -b staging
					"""
				}
			}
		}
    }
    post {
        always {
               sh """
                    echo Clean up
                    #docker-compose -f docker-compose-cypress.yml -p ${DOCKER_COMPOSE_NAME} down -v
                    docker rmi $IMAGE
                """
        }  
        failure {
            script {
                if ("${env.BRANCH_NAME}" == 'master') {
                    slackSend(channel: 'fe-drift',
                            color: 'warning',
                            message: "${env.JOB_NAME} #${env.BUILD_NUMBER} failed and needs attention: ${env.BUILD_URL}",
                            tokenCredentialId: 'slack-global-integration-token')
                }
            }
        }
        success {
            script {
                if ("${env.BRANCH_NAME}" == 'master') {
                    slackSend(channel: 'fe-drift',
                            color: 'good',
                            message: "${env.JOB_NAME} #${env.BUILD_NUMBER} completed, and pushed ${IMAGE} to artifactory.",
                            tokenCredentialId: 'slack-global-integration-token')

                }
            }
        }
        fixed {
            slackSend(channel: 'fe-drift',
                    color: 'good',
                    message: "${env.JOB_NAME} #${env.BUILD_NUMBER} back to normal: ${env.BUILD_URL}",
                    tokenCredentialId: 'slack-global-integration-token')

        }
    }
}
