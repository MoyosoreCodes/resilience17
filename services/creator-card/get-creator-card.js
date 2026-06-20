const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const serializeCreatorCard = require('../utils/serialize-creator-card');
const CreatorCardErrorCodes = require('./error-codes');

const STATUS_DRAFT = 'draft';
const ACCESS_TYPE_PRIVATE = 'private';

const getSpec = `root {
  slug string<trim>
  access_code? string<trim>
}`;

const parsedGetSpec = validator.parse(getSpec);

async function getCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedGetSpec);
  let result;

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug } });

    if (!card) {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, CreatorCardErrorCodes.CARD_NOT_FOUND);
    }

    if (card.status === STATUS_DRAFT) {
      throwAppError(CreatorCardMessages.CARD_IS_DRAFT, CreatorCardErrorCodes.CARD_IS_DRAFT);
    }

    if (card.access_type === ACCESS_TYPE_PRIVATE) {
      if (!data.access_code) {
        throwAppError(
          CreatorCardMessages.PRIVATE_CARD_ACCESS_REQUIRED,
          CreatorCardErrorCodes.PRIVATE_CARD_ACCESS_REQUIRED
        );
      }

      if (data.access_code !== card.access_code) {
        throwAppError(
          CreatorCardMessages.INVALID_ACCESS_CODE,
          CreatorCardErrorCodes.INVALID_ACCESS_CODE
        );
      }
    }

    result = serializeCreatorCard(card, { includeAccessCode: false });
  } catch (error) {
    appLogger.errorX(error, 'get-creator-card-error');
    throw error;
  }

  return result;
}

module.exports = getCreatorCard;
