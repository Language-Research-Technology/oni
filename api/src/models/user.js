"use strict";

module.exports = function (sequelize, DataTypes) {
  let User = sequelize.define("user", {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerId: {
        type: DataTypes.STRING
      },
      providerUsername: {
        type: DataTypes.STRING
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accessToken: {
        type: DataTypes.STRING
      },
      apiToken: {
        type: DataTypes.STRING,
      },
      locked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        default: false,
      },
      upload: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        default: false,
      },
      administrator: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );
  User.associate = function (models) {
    User.hasOne(models.session, { onDelete: "CASCADE" });
    // User.belongsToMany(models.group, {
    //     through: models.group_user,
    // });
    // User.belongsToMany(models.role, {
    //     through: models.user_role,
    // });
  };

  return User;
};
