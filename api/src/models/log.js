"use strict";

module.exports = function (sequelize, DataTypes) {
  let Log = sequelize.define(
    "log",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      level: {
        type: DataTypes.ENUM("info", "warn", "error"),
        defaultValue: "info",
        allowNull: false,
      },
      owner: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      text: {
        type: DataTypes.TEXT,
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
          fields: ["level"],
        },
      ],
    }
  );
  Log.associate = function (models) {};

  return Log;
};
