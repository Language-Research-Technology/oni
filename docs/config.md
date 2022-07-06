## (WIP) Configuration Documentation

## For development

Create a .env file at the repo level

Example:
```
TERM=xterm-256color
NODE_ENV=development
LOG_LEVEL=debug
DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASSWORD=
DB_DATABASE=oni
ONI_CONFIG_PATH=/Users/moises/Library/Mobile Documents/com~apple~CloudDocs/source/github/Language-Research-Technology/oni/configuration/development-configuration.json
API_HOST=http://localhost:8080
```

### Start a docker environment with only the development mode and a node app

At the repo level:
```shell
docker-compose -f docker-compose.api.dev.yml up
```
to start over do:
```shell
docker-compose down -v
```

This will allow you to run nodemon separately and able to start and stop if you like

In the api directory:
```shell
cd api
```
run
```shell
DOTENV_CONFIG_PATH=../.env npm run dev
```
the above will run with nodemon. If you save a file nodemon will restart or manually by entering `rs`
