import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import en from '../../messages/en.json';
import hi from '../../messages/hi.json';
import gu from '../../messages/gu.json';

const messages = { en, hi, gu } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as 'en' | 'hi' | 'gu')) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: messages[locale as keyof typeof messages],
  };
});
