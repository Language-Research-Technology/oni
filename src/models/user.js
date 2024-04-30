"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

/** 
 * @typedef {import('sequelize').Model} Model
 * 
 * @typedef {object} UserModel
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} provider
 * @property {string} providerId
 * @property {string} providerUsername
 * @property {string} apiToken
 * @property {boolean} locked
 * 
 * 
 */
/**
 * @type {import('sequelize').ModelStatic<Model & UserModel>}
 */
export const User = sequelize.define("user",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    providerId: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    providerUsername: {
      type: DataTypes.STRING
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    organization: {
      type: DataTypes.STRING
    },
    accessToken: {
      type: DataTypes.TEXT
    },
    accessTokenExpiresAt: {
      type: DataTypes.DATE
    },
    refreshToken: {
      type: DataTypes.TEXT
    },
    apiToken: {
      type: DataTypes.TEXT
    },
    locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    upload: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    administrator: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);
