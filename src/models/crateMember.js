"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

export const RecordCrateMember = sequelize.define("recordCrateMember",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    hasMember: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    }
  },
  {
    timestamps: false,
  }
);
