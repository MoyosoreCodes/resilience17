function serializeCreatorCard(card, options = {}) {
  const { includeAccessCode = false } = options;

  const links = Array.isArray(card.links)
    ? card.links.map((link) => ({ title: link.title, url: link.url }))
    : [];

  let serviceRates = null;
  if (card.service_rates && Array.isArray(card.service_rates.rates)) {
    serviceRates = {
      currency: card.service_rates.currency,
      rates: card.service_rates.rates.map((rate) => ({
        name: rate.name,
        description: rate.description ?? null,
        amount: rate.amount,
      })),
    };
  }

  const serialized = {
    id: card._id,
    title: card.title,
    description: card.description ?? null,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links,
    service_rates: serviceRates,
    status: card.status,
    access_type: card.access_type,
  };

  if (includeAccessCode) {
    serialized.access_code = card.access_code ?? null;
  }

  serialized.created = card.created;
  serialized.updated = card.updated;
  serialized.deleted = card.deleted ? card.deleted : null;

  return serialized;
}

module.exports = serializeCreatorCard;
