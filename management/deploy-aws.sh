#!/bin/bash

ENVIRONMENT=$1

# AWS command opts
TASK_FAMILY="$ENVIRONMENT-orgid-explorer-cache"
SERVICE_NAME="$ENVIRONMENT-orgid-explorer-cache"
AWS_REGION="eu-west-1"

# container setup options
LATEST_TAG=`git describe --abbrev=0 --tags`

# container startup options
WT_CONFIG=$ENVIRONMENT

TASK_DEF="[{\"portMappings\": [{\"hostPort\": 0,\"protocol\": \"tcp\",\"containerPort\": 8008}],
   \"logConfiguration\": {
      \"logDriver\": \"awslogs\",
      \"options\": {
        \"awslogs-group\": \"shared-docker-cluster-t3\",
        \"awslogs-region\": \"$AWS_REGION\",
        \"awslogs-stream-prefix\": \"$ENVIRONMENT-orgid-explorer-cache\"
      }
    },
    \"environment\": [
      {
        \"name\": \"WT_CONFIG\",
        \"value\": \"$WT_CONFIG\"
      },
      {
        \"name\": \"DB_PASSWORD\",
        \"value\": \"$DB_PASSWORD\"
      }
    ],
    \"image\": \"docker.io/windingtree/orgid-explorer-cache:$LATEST_TAG\",
    \"name\": \"orgid-explorer-cache\",
    \"memoryReservation\": 64,
    \"cpu\": 128
  }]"

echo "Updating task definition"
aws ecs register-task-definition --region $AWS_REGION --family $TASK_FAMILY --container-definitions "$TASK_DEF" > /dev/null
echo "Updating service"
aws ecs update-service --region $AWS_REGION --cluster shared-docker-cluster-t3 --service "$SERVICE_NAME" --task-definition "$TASK_FAMILY" > /dev/null
