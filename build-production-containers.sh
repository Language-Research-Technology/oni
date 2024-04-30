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
      -t rrkive/oni-api:latest \
      -t rrkive/oni-api:${VERSION} \
      -f Dockerfile .
    docker buildx build --load \
      -t rrkive/oni-api:latest \
      -t rrkive/oni-api:${VERSION} \
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

    echo "Pushing oni-api containers to docker hub"
    docker image push rrkive/oni-api:latest
    docker image push rrkive/oni-api:${VERSION}
fi

read -p '>> Remove local container copies? [y|N] ' resp
if [ "$resp" == "y" ] ; then
    docker rmi rrkive/oni-api:latest
    docker rmi rrkive/oni-api:${VERSION}
fi
