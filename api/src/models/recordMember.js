"use strict";

module.exports = function (sequelize, DataTypes) {
  let RecordMember = sequelize.define(
    "recordMember",
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
      timestamps: true,
    }
  );
  RecordMember.associate = function (models) {
    RecordMember.belongsTo(models.record);
  };

  return RecordMember;
};
