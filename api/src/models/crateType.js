"use strict";

module.exports = function (sequelize, DataTypes) {
  let RecordCrateType = sequelize.define("recordCrateType", {
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
    });
  RecordCrateType.associate = function (models) {
    RecordCrateType.belongsTo(models.record, {foreignKey: 'recordId'});
  };

  return RecordCrateType;
};
