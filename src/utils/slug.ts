/**
 * Business Booking Slug and URL utility functions
 */

export function generateSlug(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // remove leading/trailing hyphens
    .substring(0, 50); // limit length
}

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 50) return false;
  // Slugs must only contain lowercase letters, numbers, and single hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

export function formatBookingUrl(baseUrl: string, slug: string): string {
  if (!slug) return '';
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://example.com';
  const cleanBase = (baseUrl || origin).replace(/\/+$/, '');
  return `${cleanBase}/book/${slug}`;
}

export function formatWhatsAppShareUrl(businessName: string, bookingUrl: string): string {
  const message = `Hello! You can now book your appointments online with *${businessName}* at this link:\n${bookingUrl}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

export function formatSocialShareUrl(platform: 'twitter' | 'facebook' | 'linkedin' | 'email', businessName: string, bookingUrl: string): string {
  const text = `Book your appointments online with ${businessName}:`;
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(bookingUrl)}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bookingUrl)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(bookingUrl)}`;
    case 'email':
      return `mailto:?subject=${encodeURIComponent(`Book an appointment with ${businessName}`)}&body=${encodeURIComponent(`You can book your appointment directly here: ${bookingUrl}`)}`;
    default:
      return bookingUrl;
  }
}
