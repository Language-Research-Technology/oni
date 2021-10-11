"use strict";

module.exports = function (sequelize, DataTypes) {
    let Session = sequelize.define(
        "session",
        {
            id: {
                primaryKey: true,
                type: DataTypes.UUID,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            token: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            expires: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            data: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            timestamps: true,
            indexes: [
                {
                    fields: ["token"],
                },
            ],
        }
    );
    Session.associate = function (models) {
        Session.belongsTo(models.user);
    };

    return Session;
};
