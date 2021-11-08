"use strict";

module.exports = function (sequelize, DataTypes) {
  let RecordType = sequelize.define("rootType", {
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
  });
  RecordType.associate = function (models) {
    RecordType.belongsTo(models.record);
  };

  return RecordType;
};
