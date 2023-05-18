FROM --platform=$TARGETPLATFORM node:16 AS api-builder
LABEL maintainer="Moises Sacal <moisbo@gmail.com>" image_name="oniapi"
WORKDIR /srv
COPY api/ /srv/
RUN npm install
RUN npm run build:production

FROM --platform=$TARGETPLATFORM node:16 AS api-module-install
WORKDIR /srv
COPY --from=api-builder /srv/dist/ /srv/
COPY --from=api-builder /srv/src/ /srv/src/
COPY --from=api-builder /srv/package.json /srv/package.json
COPY scripts/wait-for-postgres.sh /srv/wait-for-postgres.sh
RUN npm install

FROM --platform=$TARGETPLATFORM node:16-slim
WORKDIR /srv
RUN apt-get update && apt-get install -y postgresql-client ca-certificates
COPY --from=api-module-install /srv/ /srv/
CMD [ "/srv/wait-for-postgres.sh", "node", "./server.bundle.js" ]  
