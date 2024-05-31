"use strict";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

/**
 * @class
 * @extends { Model<import('sequelize').InferAttributes<Test>, import('sequelize').InferCreationAttributes<Test>> }
 * @property {string} recordType
 */
class Test extends Model {
}

Test.init({
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
}, {
  sequelize,
  timestamps: false,
});

const test = new Test();
