"use strict";

module.exports = function (sequelize, DataTypes) {
  let rootConformsTo = sequelize.define("rootConformsTo", {
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
    });
  rootConformsTo.associate = function (models) {
    rootConformsTo.belongsTo(models.record);
  };

  return rootConformsTo;
};
