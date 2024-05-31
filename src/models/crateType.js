"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

export const RecordCrateType = sequelize.define("recordCrateType",
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
