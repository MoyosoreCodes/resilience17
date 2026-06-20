const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creatorCards';

/**
 * @typedef {Object} CreatorCardModel
 * @property {String} _id - ULID identifier (serialized as `id` in API responses)
 * @property {String} title
 * @property {String} [description]
 * @property {String} slug - Unique public identifier
 * @property {String} creator_reference
 * @property {Array<{title:String, url:String}>} links
 * @property {{currency:String, rates:Array<{name:String, description?:String, amount:Number}>}} [service_rates]
 * @property {String} status - draft | published
 * @property {String} access_type - public | private
 * @property {String} [access_code]
 * @property {Number} created
 * @property {Number} updated
 * @property {Number} deleted - 0 unless soft-deleted
 */

const schemaConfig = {
  _id: { type: SchemaTypes.ULID },
  title: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String, index: true },
  links: { type: SchemaTypes.Array },
  service_rates: { type: SchemaTypes.Mixed },
  status: { type: SchemaTypes.String, index: true },
  access_type: { type: SchemaTypes.String, index: true },
  access_code: { type: SchemaTypes.String },
  created: { type: SchemaTypes.Number },
  updated: { type: SchemaTypes.Number },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

/** @type {CreatorCardModel} */
module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });
