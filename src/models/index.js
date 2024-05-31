"use strict";

import { Sequelize, sequelize } from './sequelize.js';
export { Sequelize, sequelize };
export * from './user.js';
export * from './userMembership.js';
export * from './session.js';
export * from './record.js';
export * from './rootMemberOf.js';
export * from './rootConformsTo.js';
export * from './rootType.js';
export * from './crateMember.js';
export * from './crateType.js';
export * from './log.js';

// Apply associations
const models = sequelize.models;
models.user.hasOne(models.session, { onDelete: "CASCADE" });
models.user.hasMany(models.userMembership, { onDelete: "CASCADE" });
// User.belongsToMany(models.group, {
//     through: models.group_user,
// });
// User.belongsToMany(models.role, {
//     through: models.user_role,
// });

models.userMembership.belongsTo(models.user);
models.session.belongsTo(models.user);

models.record.hasMany(models.recordCrateType, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});
models.record.hasMany(models.recordCrateMember, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});
models.record.hasMany(models.rootType, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});
models.record.hasMany(models.rootMemberOf, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});
models.record.hasMany(models.rootConformsTo, {onDelete: "CASCADE", hooks: true, foreignKey: 'recordId'});

models.rootMemberOf.belongsTo(models.record, {foreignKey: 'recordId'});
models.rootConformsTo.belongsTo(models.record, {foreignKey: 'recordId'});
models.rootType.belongsTo(models.record, {foreignKey: 'recordId'});
models.recordCrateMember.belongsTo(models.record, {foreignKey: 'recordId'});
models.recordCrateType.belongsTo(models.record, {foreignKey: 'recordId'});

//models.sequelize = sequelize;
//models.Sequelize = Sequelize;
export default models;