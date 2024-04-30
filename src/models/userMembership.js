"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

export const UserMembership = sequelize.define("userMembership",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    group: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    timestamps: false
  }
);