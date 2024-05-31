import { Sequelize, Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

export interface SessionModel extends Model<InferAttributes<SessionModel>, InferCreationAttributes<SessionModel>> {
  id: CreationOptional<string>;
  token: string;
  expires: Date;
  data: object;
}

export { Sequelize };
export {sequelize} from './sequelize.js';
export * from './user.js';
export * from './userMembership.js'
export * from './session.js'
export * from './record.js'
export * from './rootMemberOf.js'
export * from './rootConformsTo.js'
export * from './rootType.js'
export * from './crateMember.js'
export * from './crateType.js'
export * from './log.js'
