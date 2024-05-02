FROM --platform=$TARGETPLATFORM node:22-alpine
LABEL image_name="oni-api"
WORKDIR /srv
#RUN apt-get update && apt-get install -y postgresql-client ca-certificates python3 python3-dev build-essential
RUN apk add --no-cache postgresql-client ca-certificates make python3 g++ bash
