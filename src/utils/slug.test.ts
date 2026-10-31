import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSlug,
  isValidSlug,
  formatBookingUrl,
  formatWhatsAppShareUrl,
  formatSocialShareUrl,
} from './slug';

test('generateSlug converts business name to URL friendly slug', () => {
  assert.equal(generateSlug('Baba Alabi Salon'), 'baba-alabi-salon');
  assert.equal(generateSlug('Hair & Beauty Lounge! #1'), 'hair-beauty-lounge-1');
  assert.equal(generateSlug('  Café & Spa Elegance  '), 'cafe-spa-elegance');
  assert.equal(generateSlug('---Special---Slug---'), 'special-slug');
  assert.equal(generateSlug(''), '');
});

test('isValidSlug validates proper slug structure', () => {
  assert.equal(isValidSlug('baba-alabi-salon'), true);
  assert.equal(isValidSlug('salon123'), true);
  assert.equal(isValidSlug('my-great-shop'), true);

  // Invalid slugs
  assert.equal(isValidSlug('ab'), false); // too short (< 3 chars)
  assert.equal(isValidSlug('-invalid-start'), false);
  assert.equal(isValidSlug('invalid-end-'), false);
  assert.equal(isValidSlug('invalid--double-hyphen'), false);
  assert.equal(isValidSlug('Invalid_Capital'), false);
  assert.equal(isValidSlug('spaces not allowed'), false);
});

test('formatBookingUrl constructs full booking URL', () => {
  assert.equal(
    formatBookingUrl('https://ais-dev-preview.app', 'baba-alabi-salon'),
    'https://ais-dev-preview.app/book/baba-alabi-salon'
  );
  assert.equal(
    formatBookingUrl('https://ais-dev-preview.app/', 'baba-alabi-salon'),
    'https://ais-dev-preview.app/book/baba-alabi-salon'
  );
  assert.equal(formatBookingUrl('', ''), '');
});

test('formatWhatsAppShareUrl formats valid WhatsApp share intent', () => {
  const url = formatWhatsAppShareUrl('Baba Alabi Salon', 'https://example.com/book/baba-alabi-salon');
  assert.match(url, /^https:\/\/api\.whatsapp\.com\/send\?text=/);
  assert.equal(url.includes(encodeURIComponent('Baba Alabi Salon')), true);
  assert.equal(url.includes(encodeURIComponent('https://example.com/book/baba-alabi-salon')), true);
});

test('formatSocialShareUrl generates correct platform links', () => {
  const bookingUrl = 'https://example.com/book/baba-alabi-salon';
  const name = 'Baba Alabi Salon';

  const twitter = formatSocialShareUrl('twitter', name, bookingUrl);
  assert.match(twitter, /^https:\/\/twitter\.com\/intent\/tweet/);

  const fb = formatSocialShareUrl('facebook', name, bookingUrl);
  assert.match(fb, /^https:\/\/www\.facebook\.com\/sharer/);

  const linkedin = formatSocialShareUrl('linkedin', name, bookingUrl);
  assert.match(linkedin, /^https:\/\/www\.linkedin\.com\/sharing/);

  const email = formatSocialShareUrl('email', name, bookingUrl);
  assert.match(email, /^mailto:\?/);
});
