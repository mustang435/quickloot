import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['en', 'fr'];
export const defaultLocale = 'en';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first, then header, then default
  let locale = defaultLocale;
  
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE');
    if (localeCookie && locales.includes(localeCookie.value)) {
      locale = localeCookie.value;
    } else {
      const headersList = await headers();
      const acceptLanguage = headersList.get('accept-language') || '';
      if (acceptLanguage.toLowerCase().includes('fr')) {
        locale = 'fr';
      }
    }
  } catch (e) {
    // Use default locale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
