import {useEffect, useState} from 'react';
import {ArrowUpRight, ChevronRight, Check} from '@/components/site-icons';
import {SHOWCASE_COPY} from '@/lib/showcase-copy';
import {getLang, localizedHref, languageHref} from '@/lib/i18n';
import {merchantFacts} from '@/lib/merchant-config';
import ContactOptions from '@/components/contact-options';

export default function Home() {
  const lang = getLang(), en = lang === 'en', copy = SHOWCASE_COPY[lang], facts = merchantFacts(lang);
  const [active, setActive] = useState('collection');
  const nav = [
    ['collection', en ? 'Collection' : '产品'], ['colorways', en ? 'Colourways' : '配色'],
    ['details', en ? 'Details' : '细节'], ['how-to-buy', en ? 'How it works' : '流程'],
  ];
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, {rootMargin: '-15% 0px -55% 0px', threshold: 0});
    nav.forEach(([id]) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);
  const studio = localizedHref('/customize');
  const steps = en ? [
    ['Choose a starting point', 'Begin with a colourway, then make it yours.'],
    ['Refine the details', 'Adjust materials, colours, stitching and artwork in the studio.'],
    ['Review & ask the maker', 'Export your design and send it for a quote. Confirm before purchasing.'],
  ] : [
    ['先选喜欢的配色', '从三款推荐搭配开始，每个部位都能继续调整。'],
    ['再打磨你的细节', '选择材质、封边与缝线，也可以加入自己的图案。'],
    ['确认方案，联系商家', '把方案发给商家，确认材料、报价和交期后再购买。'],
  ];
  return <div className="landing" lang={en ? 'en' : 'zh-CN'}>
    <a className="landing-skip" href="#collection">{copy.skipLink}</a>
    <header className="landing-header">
      <div className="landing-nav shell">
        <a href={localizedHref('/')} className="landing-brand" aria-label={en ? 'Dingli home' : '鼎立车眷首页'}>
          <img src="/brand/dc-logo.svg" width="40" height="36" alt="DC"/>
          <span>{en ? 'DINGLI' : '鼎立车眷'}<small>THE PERSONAL COLLECTION</small></span>
        </a>
        <nav className="landing-links" aria-label={copy.navLabel}>{nav.map(([id, name]) => <a key={id} href={'#'+id} onClick={() => setActive(id)} aria-current={active === id ? 'location' : undefined}>{name}</a>)}</nav>
        <div className="landing-nav-end">
          <div className="language-switch" role="group" aria-label={copy.langToggle.label}>
            <a href={languageHref('zh')} aria-current={!en ? 'true' : undefined} lang="zh-CN">中文</a>
            <a href={languageHref('en')} aria-current={en ? 'true' : undefined} lang="en">EN</a>
          </div>
          <a className="landing-cta compact" href={studio}>{en ? 'Customize' : '开始定制'}<ArrowUpRight size={15}/></a>
        </div>
      </div>
    </header>
    <main>
      <section id="collection" className="landing-hero shell" aria-labelledby="hero-title">
        <div className="hero-editorial">
          <p className="landing-kicker"><span/>{en ? 'CAR TISSUE BOX · MADE PERSONAL' : '车载纸巾盒 · 自由定制'}</p>
          <h1 id="hero-title">{en ? <>Everyday objects.<br/><em>Your own way.</em></> : <>日常小物，<br/><em>也有你的模样。</em></>}</h1>
          <p className="hero-intro">{en ? 'A colour you love. A detail that feels like you. Design a tissue box that belongs in your everyday.' : '喜欢的颜色，讲究的细节。\n从一款纸巾盒开始，把日常变成自己的样子。'}</p>
          <div className="hero-cta-row"><a className="landing-cta" href={studio}>{en ? 'Design your tissue box' : '设计我的纸巾盒'}<ArrowUpRight size={18}/></a><a className="landing-text-link" href="#colorways">{en ? 'Explore colourways' : '先看看三款配色'}<ChevronRight size={17}/></a></div>
          <div className="hero-proof"><span><Check size={14}/>{en ? 'No account needed' : '无需注册'}</span><span><Check size={14}/>{en ? 'Saved on your device' : '方案本机保存'}</span></div>
        </div>
        <figure className="hero-product">
          <div className="hero-product-label"><span>01 / THE COLLECTION</span><span>{en ? 'STYLE REFERENCE' : '款式参考'}</span></div>
          <img src="/showcase/hero-studio-1672.webp" srcSet="/showcase/hero-studio-840.webp 840w, /showcase/hero-studio-1672.webp 1672w" sizes="(max-width: 900px) 100vw, 60vw" width="1672" height="941" fetchPriority="high" alt={copy.collection.heroAlt}/>
          <figcaption><span>{en ? 'A fresh accent. A quieter everyday.' : '一抹清新，恰到好处。'}</span><span className="hero-colour"><i/>{en ? 'Green accent' : '清新绿'}</span></figcaption>
        </figure>
      </section>
      <div className="landing-path"><div className="shell">{steps.map(([title], i) => <a href={i === 0 ? '#colorways' : i === 1 ? studio : '#how-to-buy'} key={title}><span className="path-number">0{i+1}</span><span>{title}</span><ArrowUpRight size={16}/></a>)}</div></div>

      <section id="colorways" className="landing-section shell" aria-labelledby="colour-title">
        <div className="landing-section-title"><div><p className="landing-kicker">01 — {en ? 'FIND YOUR COLOUR' : '从配色开始'}</p><h2 id="colour-title">{en ? 'Three starting points.\nEndless personal touches.' : '先选一款喜欢的，\n其余的，慢慢定。'}</h2></div><p>{en ? 'Each colourway opens directly in the studio. Change any detail, or keep it just as it is.' : '点选即可带入定制工坊。\n每个部位都能改，也可以保留这份恰好。'}</p></div>
        <ul className="colourway-cards">{copy.colorways.items.map((item, i) => <li key={item.id}><a className={'colourway-card colourway-'+i} href={localizedHref('/customize?preset='+item.id)}>
          <div className="colourway-image"><span className="colourway-number">0{i+1}</span><img src={'/presets/'+item.id+'.webp'} alt={item.alt} width="360" height="270" loading="lazy" decoding="async"/></div>
          <div className="colourway-content"><div className="colourway-swatches" aria-hidden="true">{[['#ecebe5','#3e9dbe'],['#273137','#eb5968'],['#365d52','#d5cbb6']][i].map(colour => <i key={colour} style={{background:colour}}/>)}</div><h3>{item.name}</h3><p>{item.description}</p><span className="colourway-action">{en ? 'Make it yours' : '用这款开始定制'}<ArrowUpRight size={17}/></span></div>
        </a></li>)}</ul>
        <div className="colourway-footnote"><span>{en ? 'Preset reference images. Your changes appear in the studio preview.' : '图片为预设参考；修改后的效果，请在定制工坊查看。'}</span><a href={localizedHref('/customize?preview=light')}>{en ? 'Slow connection? Use light preview' : '手机慢网？使用轻量预览'}<ChevronRight size={14}/></a></div>
      </section>

      <section id="details" className="landing-details" aria-labelledby="detail-title"><div className="shell detail-layout">
        <div className="detail-image"><img src="/showcase/craft-detail-1086.webp" srcSet="/showcase/craft-detail-600.webp 600w, /showcase/craft-detail-1086.webp 1086w" sizes="(max-width: 900px) 100vw, 55vw" width="1086" height="1086" alt={copy.details.craftAlt} loading="lazy" decoding="async"/><span>{en ? 'TEXTURE / STITCH / EDGE' : '皮纹 / 缝线 / 封边'}</span></div>
        <div className="detail-editorial"><p className="landing-kicker">02 — {en ? 'THE SMALL DETAILS' : '把细节留给自己'}</p><h2 id="detail-title">{en ? 'Not just a colour.\nA considered detail.' : '不止换个颜色，\n是每一处都合心意。'}</h2><p>{en ? 'Let a contrast edge define the shape. Pair the corners, tune the thread, or add a personal mark.' : '让一道撞色勾勒轮廓，让四个包角彼此呼应。\n从封边、缝线，到一枚自己的小小标记。'}</p>
          <div className="detail-points"><span><b>06</b>{en ? 'Customizable parts' : '可定制部位'}</span><span><b>3D</b>{en ? 'Interactive preview' : '交互搭配预览'}</span><span><b>+ YOU</b>{en ? 'Images, text & drawing' : '图片、文字与手绘'}</span></div>
          <a className="landing-cta light" href={studio}>{en ? 'Explore the details' : '进入工坊，试试搭配'}<ArrowUpRight size={18}/></a><small>{en ? 'Preview options express your preferences. Confirm materials and production with the maker.' : '预览用于表达设计喜好；材料供应与可制作工艺需由商家确认。'}</small>
        </div>
      </div></section>

      <section id="how-to-buy" className="landing-section shell" aria-labelledby="steps-title">
        <div className="landing-section-title"><div><p className="landing-kicker">03 — {en ? 'FROM IDEA TO ENQUIRY' : '从喜欢，到手边'}</p><h2 id="steps-title">{en ? 'A clear path to\nyour personal design.' : '定制不复杂，\n三步就清楚。'}</h2></div><p>{en ? 'Design here. Confirm with the maker.\nThis site does not take payments.' : '在这里完成搭配，与商家确认购买。\n本站不直接下单，也不在线收款。'}</p></div>
        <ol className="workflow-cards">{steps.map(([title, body], i) => <li key={title}><span>0{i+1}</span><h3>{title}</h3><p>{body}</p></li>)}</ol>
        <details className="landing-accordion technical-details"><summary>{en ? 'Customization, saving & product details' : '定制范围、保存方式与产品说明'}<span>+</span></summary><div className="technical-grid">{[[copy.info.rangeTitle, copy.info.range],[copy.info.confirmedTitle, copy.info.confirmed],[copy.info.pendingTitle,facts.pending],[copy.info.careTitle,copy.info.care]].map(([title, items]) => <article key={title as string}><h3>{title as string}</h3><ul>{(items as readonly string[]).map(item => <li key={item}>{item}</li>)}</ul></article>)}</div></details>
        <div className="help-layout"><div><p className="landing-kicker">{en ? 'A FEW ANSWERS' : '你可能还想知道'}</p><h2>{en ? 'Before you decide.' : '放心选，问清楚。'}</h2><div className="landing-faq">{copy.faq.items.map(item => <details className="landing-accordion" key={item.q}><summary>{item.q}<span>+</span></summary><p>{item.a}</p></details>)}</div></div><section id="contact" className="landing-contact" aria-labelledby="contact-title"><p className="landing-kicker">{en ? 'TALK TO THE MAKER' : '联系商家'}</p><h2 id="contact-title">{en ? 'Let’s make it yours.' : '聊聊你的想法。'}</h2><p>{en ? 'Share your design, quantity and preferences. Confirm materials, a quote and timing before purchasing.' : '带上方案、数量与需求。\n确认好材料、报价和时间，再把喜欢带回家。'}</p><ContactOptions lang={lang}/></section></div>
      </section>
    </main>
    <footer className="landing-footer"><div className="shell"><div><strong>{en ? 'DINGLI' : '鼎立车眷'}</strong><span>EVERYDAY, YOUR WAY.</span></div><p>{copy.footer.note}</p><a href={studio}>{en ? 'Create your design' : '开始我的定制'}<ArrowUpRight size={15}/></a></div></footer>
  </div>;
}
