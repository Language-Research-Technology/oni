#!/usr/bin/env bash

ORG=moisbo

if [ "$#" != 1 ] ; then
    echo "Please provide a version number for these containers: e.g. 0.1.0"
    exit -1
fi
VERSION="${1}"

read -p '>> Build the code? [y|N] ' resp
if [ "$resp" == "y" ] ; then
     echo '>> Building the API code'
     docker build --rm -t ${ORG}/oni-api:latest -f Dockerfile.api-build .
     echo

     echo '>> Building the UI code'
     docker build --rm -t ${ORG}/oni-ui:latest -f Dockerfile.ui-build .
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

     docker rmi $(docker images | grep none | awk '{print $3}')
     echo "Building API container"
     docker tag ${ORG}/oni-api:latest ${ORG}/oni-api:${VERSION}

     echo "Building UI container"
     docker tag ${ORG}/oni-ui:latest ${ORG}/oni-ui:${VERSION}

     echo
fi

read -p '>> Push the containers to docker hub? [y|N] ' resp
if [ "$resp" == "y" ] ; then
     echo "Pushing built containers to docker hub"
     docker login
     docker push ${ORG}/oni-api:latest
     docker push ${ORG}/oni-api:${VERSION}
     docker push ${ORG}/oni-ui:latest
     docker push ${ORG}/oni-ui:${VERSION}
fi
