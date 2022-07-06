# Oni

- [Oni](#oni)
  - [Start developing](#start-developing)
  - [Running the tests](#running-the-tests)
  - [Tech](#tech)
    - [Frontend - VueJS and friends](#frontend---vuejs-and-friends)
    - [Backend - Restify and sequelize](#backend---restify-and-sequelize)
  - [Repo layout](#repo-layout)
  - [Documentation](#documentation)

Oni consists of a VueJS SPA (ui) and restify JS backend (api). This repo structure is shared with
[Describo Online](https://github.com/Arkisto-Platform/describo-online) and the
[Nyingarn Workspace](https://github.com/CoEDL/nyingarn-workspace). Look there for more code.

## Start developing

To get started developing copy `configuration/example-configuration.json` to
`configuration/development-configuration.json` and edit as required.

```
> docker-compose up
```

This will start the UI, API and db containers. It will automatically run `npm install` in both ui
and api folders so you don't need to.

Saving UI and API code triggers auto reload.

## Running the tests

-   Find the api container ID : `dps | grep api | awk '{print $1}'`
-   Exec into the container: `docker exec -it ${CONTAINER ID} bash`
-   Run the Jest Testing environment: `npm run test:watch`

When you save a test file the tests will re-run automatically. Saving a changed code file (ie not a
test file) does not re-run the tests.

## Tech

### Frontend - VueJS and friends

-   [VueJS 3](https://v3.vuejs.org/guide/introduction.html)
-   [Vue-router](https://next.router.vuejs.org/)
-   [Vuex (state management)](https://next.vuex.vuejs.org/)
-   [Font Awesome Icons](https://fontawesome.com/v5.15/icons?d=gallery&p=2&m=free)
-   [Element Plus UI Controls](https://element-plus.org/en-US/component/border.html)
-   [TailwindCSS - bootstrap on steroids](https://tailwindcss.com/docs)

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
- ui: the Vue SPA
    -   public: icons and other static things
    -   src
        -   assets: css and stuff - there should be very little in here as this is visible globally.
            If you can't do it with tailwind then add scoped css or scss in components as required.
        -   components: your components structure as you like
        -   routes: SPA route code
        -   store: SPA state management
- configuration: application configuration
- scripts: script helpers to run the code
- production: production configuration - compose file and nginx code
- build-production-containers.sh: script to build the containers, tag and push to docker hub -
    REQUIRES WORK : COMMENTED OUT FOR NOW



## Documentation

[Documentation](./docs)
