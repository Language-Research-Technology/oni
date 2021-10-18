"use strict";

module.exports = function (sequelize, DataTypes) {
    let Record = sequelize.define(
        "record",
        {
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
                type: DataTypes.STRING,
                allowNull: true,
            },
            description: {
                type: DataTypes.STRING,
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
        }
    );
    Record.associate = function (models) {
        Record.hasOne(models.session, {onDelete: "CASCADE"});
        // Data.belongsToMany(models.group, {
        //     through: models.group_user,
        // });
        // Data.belongsToMany(models.role, {
        //     through: models.user_role,
        // });
    };

    return Record;
};
