"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

export const Record = sequelize.define("record",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    crateId: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    license: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    objectRoot: {
      type: DataTypes.TEXT
    },
    locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);
