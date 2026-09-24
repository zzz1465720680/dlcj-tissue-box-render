import {lazy, Suspense, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../pages/Home';
import {SHOWCASE_COPY, resolveLang} from '../lib/showcase-copy';
import '../styles/globals.css';
import '../styles/showcase.css';

const Studio = lazy(() => import('../components/studio'));
function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const lang = resolveLang(params.get('lang'));
  useEffect(() => {
    document.documentElement.lang = path === '/' && lang === 'en' ? 'en' : 'zh-CN';
    document.title = path === '/customize' ? '纸巾盒定制工坊 · 鼎立车眷' : SHOWCASE_COPY[lang].meta.title;
  }, [path, lang]);
  if (path === '/') return <Home/>;
  if (path === '/customize') return <Suspense fallback={<main className="page-loading" role="status">正在打开定制工坊…</main>}><Studio lightPreview={params.get('preview') === 'light'}/></Suspense>;
  return <main className="page-loading"><h1>没有找到这个页面</h1><a href="/">返回纸巾盒首页</a></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
