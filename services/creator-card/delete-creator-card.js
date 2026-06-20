const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const serializeCreatorCard = require('../utils/serialize-creator-card');
const CreatorCardErrorCodes = require('./error-codes');

const deleteSpec = `root {
  slug string<trim>
  creator_reference string<trim|length:20>
}`;

const parsedDeleteSpec = validator.parse(deleteSpec);

async function deleteCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedDeleteSpec);
  let result;

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug } });

    if (!card) {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, CreatorCardErrorCodes.CARD_NOT_FOUND);
    }

    await CreatorCard.deleteOne({ query: { slug: data.slug } });

    const deletedCard = { ...card, deleted: Date.now() };

    result = serializeCreatorCard(deletedCard, { includeAccessCode: true });
  } catch (error) {
    appLogger.errorX(error, 'delete-creator-card-error');
    throw error;
  }

  return result;
}

module.exports = deleteCreatorCard;
