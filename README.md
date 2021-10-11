# Oni

The Oni application.

Oni consists of a VueJS SPA (ui) and restify JS backend (api).

## Start developing

```
> docker-compose up
```

This will start the UI, API and db containers. It will automatically run `npm install` in both ui
and api folders so you don't need to.

To get started developing copy `configuration/example-configuration.json` to
`configuration/development-configuration.json` and edit as required.

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

-   api: the api source code
    -   src:
        -   routes: route handlers - return responses, throw http exceptions here
        -   lib: handlers that do things - interact with the db here
        -   models: the database models
        -   common: commonly used code like loggers and config loaders
-   ui: the Vue SPA
    -   public: icons and other static things
    -   src
        -   assets: css and stuff - there should be very little in here as this is visible globally.
            If you can't do it with tailwind then add scoped css or scss in components as required.
        -   components: your components structure as you like
        -   routes: SPA route code
        -   store: SPA state management
-   configuration: application configuration
-   scripts: script helpers to run the code
-   production: production configuration - compose file and nginx code
-   build-production-containers.sh: script to build the containers, tag and push to docker hub -
    REQUIRES WORK : COMMENTED OUT FOR NOW
