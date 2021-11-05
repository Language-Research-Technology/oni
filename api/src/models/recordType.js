"use strict";

module.exports = function (sequelize, DataTypes) {
  let RecordType = sequelize.define("recordType", {
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
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      timestamps: true,
    });
  RecordType.associate = function (models) {
    RecordType.belongsTo(models.record);
  };

  return RecordType;
};
