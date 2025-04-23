#!/usr/bin/env bash


if [ "$#" != 1 ] ; then
    echo "Please provide a version number for these containers: e.g. 0.1.0"
    exit -1
fi
VERSION="${1}"

read -p '>> Build the code? [y|N] ' resp
if [ "$resp" == "y" ] ; then
    # Use buildx to build multiplatform containers
    docker buildx create --use
    echo '>> Building the API code'
    docker buildx build --platform linux/amd64,linux/arm64 \
      --rm \
      -t rrkive/oni:latest \
      -t rrkive/oni:${VERSION} \
      -f Dockerfile .
    docker buildx build --load \
      -t rrkive/oni:latest \
      -t rrkive/oni:${VERSION} \
      -f Dockerfile .
    echo

fi

read -p '>> Tag the containers? [y|N] ' resp
if [ "$resp" == "y" ] ; then
    cd api
    npm version --no-git-tag-version ${VERSION}
    cd ..
    git tag v${VERSION}
    git commit -a -m "tag and bump version"

    echo
fi

read -p '>> Push the containers to docker hub? [y|N] ' resp
if [ "$resp" == "y" ] ; then
    docker login
    echo "Pushing oni containers to docker hub"
    docker buildx build --platform=linux/amd64,linux/arm64 \
      --push \
      --rm \
      -t rrkive/oni:latest \
      -t rrkive/oni:${VERSION} \
      -f Dockerfile .
fi

read -p '>> Build and Push the containers to docker hub as a test? [y|N] ' resp
if [ "$resp" == "y" ] ; then
    docker login
    # Use buildx to build multiplatform containers
    docker buildx create --use
    echo '>> Building the API code'
    docker buildx build --platform linux/amd64,linux/arm64 \
      --rm \
      -t rrkive/oni:${VERSION} \
      -f Dockerfile .
    docker buildx build --load \
      -t rrkive/oni:${VERSION} \
      -f Dockerfile .
    echo
    echo "Pushing oni containers to docker hub"
    docker buildx build --platform=linux/amd64,linux/arm64 \
      --push \
      --rm \
      -t rrkive/oni:${VERSION} \
      -f Dockerfile .
fi

read -p '>> Remove local container copies? [y|N] ' resp
if [ "$resp" == "y" ] ; then
    docker rmi rrkive/oni:latest
    docker rmi rrkive/oni:${VERSION}
fi
