"use strict";

module.exports = function (sequelize, DataTypes) {
  let UserMembership = sequelize.define("userMembership", {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      group: {
        type: DataTypes.STRING,
        allowNull: false,
      }
    },
    {
      timestamps: false,
    }
  );

  UserMembership.associate = function (models) {
    UserMembership.belongsTo(models.user);
  };

  return UserMembership;
};
