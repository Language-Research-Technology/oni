"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

export const RootConformsTo = sequelize.define("rootConformsTo",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    conformsTo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    crateId: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    timestamps: false,
  }
);
