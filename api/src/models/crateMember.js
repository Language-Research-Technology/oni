"use strict";

module.exports = function (sequelize, DataTypes) {
  let RecordCrateMember = sequelize.define("recordCrateMember",
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
  RecordCrateMember.associate = function (models) {
    RecordCrateMember.belongsTo(models.record, {foreignKey: 'recordId'});
  };

  return RecordCrateMember;
};
