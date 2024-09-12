"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

export const File = sequelize.define("file",
  {
    path: {
      primaryKey: true,
      type: DataTypes.TEXT,
      allowNull: false
    },
    logicalPath: {
      type: DataTypes.TEXT
    },
    crateId: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    size: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    crc32: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    timestamps: false,
  }
);
