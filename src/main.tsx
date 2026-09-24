import {Component, lazy, Suspense, useEffect, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../pages/Home';
import {SHOWCASE_COPY} from '../lib/showcase-copy';
import {getLang, persistLanguage, localizedHref, t} from '../lib/i18n';
import '../styles/globals.css';
import '../styles/showcase.css';
import '../styles/redesign.css';

const Studio = lazy(() => import('../components/studio'));
class StudioBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() {
    if (!this.state.failed) return this.props.children;
    const en = getLang() === 'en';
    return <main className="studio-failure" role="alert"><h1>{en ? 'The studio could not load' : '定制工坊暂时没有打开'}</h1><p>{en ? 'Please check your connection and reload. Previously saved designs remain on this device.' : '请检查网络后重新打开；此前成功保存的本机方案仍保留在此浏览器中。'}</p><nav><a className="button dark" href={localizedHref('/customize')}>{en ? 'Try again' : '重新打开'}</a><a href={localizedHref('/')}>{t('返回首页')}</a></nav></main>;
  }
}
function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const lang = getLang();
  useEffect(() => {
    persistLanguage(lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = path === '/customize'
      ? (lang === 'en' ? 'Custom Studio · DINGLI' : '纸巾盒定制工坊 · 鼎立车眷')
      : SHOWCASE_COPY[lang].meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', SHOWCASE_COPY[lang].meta.description);
  }, [path, lang]);
  if (path === '/') return <Home/>;
  if (path === '/customize') return <StudioBoundary><Suspense fallback={<main className="page-loading" role="status">{t('正在准备你的方案…')}</main>}><Studio lightPreview={params.get('preview') === 'light'}/></Suspense></StudioBoundary>;
  return <main className="page-loading"><h1>{lang === 'en' ? 'Page not found' : '没有找到这个页面'}</h1><a className="button dark" href={localizedHref('/')}>{t('返回首页')}</a></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
