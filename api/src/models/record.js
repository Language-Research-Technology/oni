"use strict";

module.exports = function (sequelize, DataTypes) {
  let Record = sequelize.define("record", {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      crateId: {
        type: DataTypes.TEXT,
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
      objectRoot: {
        type: DataTypes.TEXT
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
    Record.hasMany(models.recordCrateType, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});
    Record.hasMany(models.recordCrateMember, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});
    Record.hasMany(models.rootType, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});
    Record.hasMany(models.rootMemberOf, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});
    Record.hasMany(models.rootConformsTo, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});
  };

  return Record;
};
