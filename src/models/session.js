"use strict";
import { sequelize, DataTypes } from "./sequelize.js";

export const Session = /**@type {typeof sequelize.define<import("./index.js").SessionModel>}*/(sequelize.define)(
  "session",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["token"],
      },
    ],
  }
);
