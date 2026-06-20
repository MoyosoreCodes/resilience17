const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const serializeCreatorCard = require('../utils/serialize-creator-card');
const generateUniqueSlug = require('../utils/generate-unique-slug');
const CreatorCardErrorCodes = require('./error-codes');

const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;
const ACCESS_CODE_PATTERN = /^[A-Za-z0-9]{6}$/;
const ACCESS_TYPE_PRIVATE = 'private';
const ACCESS_TYPE_PUBLIC = 'public';

const createSpec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|minLength:5|maxLength:50>
  creator_reference string<trim|length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6>
}`;

const parsedCreateSpec = validator.parse(createSpec);

async function createCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedCreateSpec);
  let result;

  try {
    (data.links || []).forEach((link) => {
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        throwAppError(CreatorCardMessages.INVALID_LINK_URL, ERROR_CODE.VALIDATIONERR);
      }
    });

    if (data.service_rates) {
      data.service_rates.rates.forEach((rate) => {
        if (!Number.isInteger(rate.amount)) {
          throwAppError(CreatorCardMessages.INVALID_RATE_AMOUNT, ERROR_CODE.VALIDATIONERR);
        }
      });
    }

    const accessType = data.access_type || ACCESS_TYPE_PUBLIC;

    if (accessType === ACCESS_TYPE_PRIVATE && !data.access_code) {
      throwAppError(
        CreatorCardMessages.ACCESS_CODE_REQUIRED_PRIVATE,
        CreatorCardErrorCodes.ACCESS_CODE_REQUIRED_PRIVATE
      );
    }

    if (accessType !== ACCESS_TYPE_PRIVATE && data.access_code) {
      throwAppError(
        CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED_PUBLIC,
        CreatorCardErrorCodes.ACCESS_CODE_NOT_ALLOWED_PUBLIC
      );
    }

    if (data.access_code && !ACCESS_CODE_PATTERN.test(data.access_code)) {
      throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT, ERROR_CODE.VALIDATIONERR);
    }

    let slug;
    if (data.slug) {
      if (!SLUG_PATTERN.test(data.slug)) {
        throwAppError(CreatorCardMessages.INVALID_SLUG_FORMAT, ERROR_CODE.VALIDATIONERR);
      }

      const existing = await CreatorCard.findOne({ query: { slug: data.slug } });
      if (existing) {
        throwAppError(CreatorCardMessages.SLUG_TAKEN, CreatorCardErrorCodes.SLUG_TAKEN);
      }

      slug = data.slug;
    } else {
      slug = await generateUniqueSlug(data.title);
    }

    const card = {
      title: data.title,
      slug,
      creator_reference: data.creator_reference,
      links: Array.isArray(data.links) ? data.links : [],
      status: data.status,
      access_type: accessType,
    };

    if (data.description !== undefined) {
      card.description = data.description;
    }

    if (data.service_rates !== undefined) {
      card.service_rates = data.service_rates;
    }

    if (accessType === ACCESS_TYPE_PRIVATE) {
      card.access_code = data.access_code;
    }

    const createdCard = await CreatorCard.create(card);

    result = serializeCreatorCard(createdCard, { includeAccessCode: true });
  } catch (error) {
    appLogger.errorX(error, 'create-creator-card-error');
    throw error;
  }

  return result;
}

module.exports = createCreatorCard;
