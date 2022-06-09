#!/usr/bin/env bash

if [ "$#" != 1 ] ; then
    echo "Please provide a version number for these containers: e.g. 0.1.0"
    exit -1
fi
VERSION="${1}"

read -p '>> Build the code? [y|N] ' resp
if [ "$resp" == "y" ] ; then
     echo '>> Building the API code'
     docker build --rm -t arkisto/oni-api:latest -f Dockerfile.api-build .
     echo

     echo '>> Building the UI code'
     cd ui
     npm run build
     docker run -it --rm \
         -v $PWD:/srv/ui \
         -w /srv/ui node:16 bash -l -c "npm run build"
     cd -
     echo
fi

read -p '>> Build the containers? [y|N] ' resp
if [ "$resp" == "y" ] ; then
     cd api
     npm version --no-git-tag-version ${VERSION}
     cd ../ui
     npm version --no-git-tag-version ${VERSION}
     cd ..
     git tag v${VERSION}
     git commit -a -m "tag and bump version"

     echo "Building API container"
     docker tag arkisto/oni-api:latest arkisto/oni-api:${VERSION}
     docker rmi $(docker images | grep none | awk '{print $3}')

     echo "Building UI container"
     docker build --rm -t arkisto/oni-ui:latest -f Dockerfile.ui-build .
     docker tag arkisto/oni-ui:latest arkisto/oni-ui:${VERSION}

     docker rmi $(docker images | grep none | awk '{print $3}')
     echo
fi

read -p '>> Push the containers to docker hub? [y|N] ' resp
if [ "$resp" == "y" ] ; then
#     echo "Pushing built containers to docker hub"
#     docker login
#     docker push arkisto/oni-api:latest
#     docker push arkisto/oni-api:${VERSION}
#     docker push arkisto/oni-ui:latest
#     docker push arkisto/oni-ui:${VERSION}
fi
