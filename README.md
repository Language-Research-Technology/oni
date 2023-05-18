# Oni

- [Oni](#oni)
  - [Start developing](#start-developing)
  - [Running the tests](#running-the-tests)
  - [Tech](#tech)
    - [Backend - Restify and sequelize](#backend---restify-and-sequelize)
  - [Repo layout](#repo-layout)
  - [Documentation](#documentation)

## Start developing

To get started developing copy `configuration/example-configuration.json` to
`configuration/development-configuration.json` and edit as required.

```
> docker-compose up
```

This will start the API and db containers. It will automatically run `npm install` in api folders so you don't need to.

Saving API code triggers auto reload.

## Running the tests

-   Find the api container ID : `dps | grep api | awk '{print $1}'`
-   Exec into the container: `docker exec -it ${CONTAINER ID} bash`
-   Run the Jest Testing environment: `npm run test:watch`

When you save a test file the tests will re-run automatically. Saving a changed code file (ie not a
test file) does not re-run the tests.

## Tech

### Backend - Restify and sequelize

-   [Restify](http://restify.com/docs/home/)
-   [Sequelize ORM](https://sequelize.org/master/)

## Repo layout

- api: the api source code
    -   src:
        -   routes: route handlers - return responses, throw http exceptions here
        -   controllers: handlers that do things - interact with the db here
        -   models: the database models
        -   services: services used code like loggers and config loaders
- configuration: application configuration
- scripts: script helpers to run the code
- production: production configuration - compose file and nginx code
- build-production-containers.sh: script to build the containers, tag and push to docker hub

## Documentation

[Documentation](./docs)
