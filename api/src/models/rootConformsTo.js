"use strict";

module.exports = function (sequelize, DataTypes) {
  let rootMemberOf = sequelize.define("rootMemberOf", {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    memberOf: {
      type: DataTypes.STRING,
      allowNull: false
    },
    crateId: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
  rootMemberOf.associate = function (models) {
    rootMemberOf.belongsTo(models.record);
  };

  return rootMemberOf;
};
