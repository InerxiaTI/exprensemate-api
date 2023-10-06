#!/bin/bash

# Starting...

# Define variables
IMAGE_NAME="expensemate-i"
CONTAINER_NAME="${IMAGE_NAME}-con"

echo $IMAGE_NAME
echo $CONTAINER_NAME

# Stop container $CONTAINER_NAME
docker stop $CONTAINER_NAME 2>&1 | grep -q "No such"
if [[ $? -eq 0 ]]; then
  echo "Error trying stop container $CONTAINER_NAME maybe container does not exist"
else
  echo "$CONTAINER_NAME has been stopped. Good job!"
fi

# Remove container $CONTAINER_NAME
docker rm $CONTAINER_NAME 2>&1 | grep -q "No such"
if [[ $? -eq 0 ]]; then
  echo "Error trying remove container $CONTAINER_NAME maybe container does not exist"
else
  echo "$CONTAINER_NAME has been removed. Good job!"
fi

# Remove image $IMAGE_NAME
docker rmi $IMAGE_NAME 2>&1 | grep -q "No such"
if [[ $? -eq 0 ]]; then
  echo "Error trying remove image $IMAGE_NAME maybe image does not exist"
else
  echo "$IMAGE_NAME has been removed. Good job!"
fi

# Build image $IMAGE_NAME
docker build --tag $IMAGE_NAME .

# Run container $CONTAINER_NAME
# docker run --name $CONTAINER_NAME -d -p 3001:3000 $IMAGE_NAME:latest