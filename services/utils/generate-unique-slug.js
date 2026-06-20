/* eslint-disable no-await-in-loop */
const { randomBytes } = require('@app-core/randomness');
const CreatorCard = require('@app/repository/creator-card');

const SUFFIX_LENGTH = 6;
const MIN_SLUG_LENGTH = 5;

async function isSlugAvailable(slug) {
  const existing = await CreatorCard.findOne({ query: { slug } });
  return !existing;
}

async function generateUniqueSlug(title) {
  const base = String(title)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');

  let slug = base;
  let needsSuffix = base.length < MIN_SLUG_LENGTH || !(await isSlugAvailable(base));

  while (needsSuffix) {
    slug = `${base}-${randomBytes(SUFFIX_LENGTH)}`;
    needsSuffix = !(await isSlugAvailable(slug));
  }

  return slug;
}

module.exports = generateUniqueSlug;
