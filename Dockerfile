FROM --platform=$TARGETPLATFORM node:22-alpine AS api-installer
WORKDIR /srv
COPY . /srv/
RUN apk add postgresql-client ca-certificates make python3 g++ bash
RUN npm install

FROM --platform=$TARGETPLATFORM node:22-alpine
LABEL image_name="oni"
WORKDIR /srv
RUN apk add postgresql-client ca-certificates bash
COPY --from=api-installer /srv/ /srv/
CMD [ "npm", "run", "prod" ]
