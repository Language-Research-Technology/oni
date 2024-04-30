"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

export const RootMemberOf = sequelize.define("rootMemberOf",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    memberOf: {
      type: DataTypes.TEXT,
      allowNull: true
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
