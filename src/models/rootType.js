"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

export const RootType = sequelize.define("rootType",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    recordType: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    timestamps: false,
  }
);
