import {EN} from './locale-en';
import type {Lang} from './showcase-copy';
export const LANGUAGE_KEY = 'dlcj-language-v1';
/** Explicit URL language wins; storage is optional and never blocks navigation. */
export function getLang(): Lang {
  if (typeof window === 'undefined') return 'zh';
  const query = new URLSearchParams(window.location.search).get('lang');
  if (query === 'en' || query === 'zh') return query;
  try { return window.localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh'; }
  catch { return 'zh'; }
}
export function persistLanguage(lang: Lang): void {
  try { window.localStorage.setItem(LANGUAGE_KEY, lang); } catch { /* URL remains authoritative. */ }
}
export function localizedHref(path: string, lang: Lang = getLang()): string {
  const url = new URL(path, 'https://local.invalid');
  url.searchParams.set('lang', lang);
  return url.pathname + url.search + url.hash;
}
export function languageHref(lang: Lang): string {
  return localizedHref(window.location.pathname + window.location.search + window.location.hash, lang);
}
/** Translate application copy only; user content is substituted without rewriting it. */
export function t(source: string, values: unknown[] = [], lang: Lang = getLang()): string {
  const key = source.replace(/\s+/g, ' ').trim();
  let output = lang === 'en' ? EN[key] ?? source : source;
  if (lang === 'en' && output !== source) {
    if (/^\s/.test(source) && !/^\s/.test(output)) output = ' ' + output;
    if (/\s$/.test(source) && !/\s$/.test(output)) output += ' ';
  }
  return output.replace(/\{(\d+)\}/g, (_match, index: string) => String(values[Number(index)] ?? ''));
}
export function displayDesignName(name: string): string {
  return ['白瓷 · 湖蓝', '曜石 · 珊瑚红', '森林 · 亚麻'].includes(name) ? t(name) : name;
}
