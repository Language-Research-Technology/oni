"use strict";

module.exports = function (sequelize, DataTypes) {
  let Record = sequelize.define("record", {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      arcpId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      diskPath: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      license: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      locked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        default: false,
      }
    },
    {
      timestamps: true,
    });
  Record.associate = function (models) {
    Record.hasMany(models.recordCrateType, { onDelete: "CASCADE" });
    Record.hasMany(models.recordCrateMember, { onDelete: "CASCADE" });
    Record.hasMany(models.rootType, { onDelete: "CASCADE" });
    Record.hasMany(models.rootMemberOf, { onDelete: "CASCADE" });
    Record.hasMany(models.rootConformsTo, { onDelete: "CASCADE" });
  };

  return Record;
};
