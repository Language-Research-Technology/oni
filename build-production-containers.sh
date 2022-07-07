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
      -t arkisto/oni-api:latest \
      -t arkisto/oni-api:${VERSION} \
      -f Dockerfile.api-build .
    docker buildx build --load \
      -t arkisto/oni-api:latest \
      -t arkisto/oni-api:${VERSION} \
      -f Dockerfile.api-build .
    echo

    echo '>> Building the UI code'
    docker buildx build --platform linux/amd64,linux/arm64 \
      --rm \
      -t arkisto/oni-ui:latest \
      -t arkisto/oni-ui:${VERSION} \
      -f Dockerfile.ui-build .
    docker buildx build --load \
      -t arkisto/oni-ui:latest \
      -t arkisto/oni-ui:${VERSION} \
      -f Dockerfile.ui-build .
     echo
fi

read -p '>> Tag the containers? [y|N] ' resp
if [ "$resp" == "y" ] ; then
    cd api
    npm version --no-git-tag-version ${VERSION}
    cd ../ui
    npm version --no-git-tag-version ${VERSION}
    cd ..
    git tag v${VERSION}
    git commit -a -m "tag and bump version"

    echo
fi

read -p '>> Push the containers to docker hub? [y|N] ' resp
if [ "$resp" == "y" ] ; then
    docker login
    echo "Pushing built containers to docker hub"

    docker buildx build --platform=linux/amd64,linux/arm64 \
      --push \
      --rm \
      -t arkisto/oni-api:latest \
      -t arkisto/oni-api:${VERSION} \
      -f Dockerfile.api-build .
    docker buildx build --platform=linux/amd64,linux/arm64 \
      --push \
      --rm \
      -t arkisto/oni-ui:latest \
      -t arkisto/oni-ui:${VERSION} \
      -f Dockerfile.ui-build .

fi

read -p '>> Remove local container copies? [y|N] ' resp
if [ "$resp" == "y" ] ; then
    docker rmi arkisto/oni-api:latest
    docker rmi arkisto/oni-api:${VERSION}
    docker rmi arkisto/oni-ui:latest
    docker rmi arkisto/oni-ui:${VERSION}
fi
