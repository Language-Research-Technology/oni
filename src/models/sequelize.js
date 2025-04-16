"use strict";

import { Sequelize, DataTypes } from "sequelize";

console.log('Loading sequelize..');
console.log(`username: ${process.env.DB_USER},
  password: ${process.env.DB_PASSWORD},
  host: ${process.env.DB_HOST},
  port: ${parseInt(process.env.DB_PORT)},
  dialect: 'postgres',
  database: ${process.env.DB_DATABASE}`)
const sequelize = new Sequelize({
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  dialect: 'postgres',
  database: process.env.DB_DATABASE,
  // logging: false,
  logging: console.log,
  pool: {
    max: 20,
    min: 10,
    acquire: 30000,
    idle: 10000,
  },
});
export { Sequelize, sequelize, DataTypes }
