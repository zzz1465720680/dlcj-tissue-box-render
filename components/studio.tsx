import {t as ui, getLang, displayDesignName, localizedHref, languageHref} from '@/lib/i18n';
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProductView, { ProductHandle } from './product-view';
import ArtEditor, { imageFile } from './art-editor';
import ConsultPanel from './consult-panel';
import { useInquiryDraft } from '@/hooks/use-inquiry-draft';
import { saveLocalDesign, listLocalDesigns, getLocalDesign } from '@/lib/local-designs';
import { initialDesign, preset, PRESETS, cloneDesign, PALETTE, Part, PART_NAMES, PARTS, Design, Surface } from '@/lib/design';
import { designSchema } from '@/lib/schema';
import { loadDraft, saveDraft } from '@/lib/draft';
import { Box, Rotate3D, Check, Layers, Bookmark, Undo2, Redo2, RotateCcw, Plus, Minus, Maximize2, ChevronRight, ArrowUpRight, Download, FolderOpen, ImagePlus, Tag, Scissors, Palette, PenLine, LoaderCircle, FileUp, Eye, SplitSquareHorizontal, X, MessageSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {ArrowLeft} from './site-icons';
type Saved = {
    id: string;
    name: string;
    date: string;
};
const materials = [{ id: 'grain', name: ui("细纹皮革"), desc: ui("细腻纹理 · 柔和光泽") }, { id: 'smooth', name: ui("光面皮革"), desc: ui("平滑表面 · 清晰反光") }, { id: 'suede', name: ui("绒面质感"), desc: ui("细密绒感 · 柔哑表面") }] as const;
function historyReplace(url: string) { window.history.replaceState(null, "", url); }
function download(data: Blob | string, name: string) { const url = typeof data === 'string' ? data : URL.createObjectURL(data), a = document.createElement('a'); a.href = url; a.download = name; a.click(); if (typeof data !== 'string')
    setTimeout(() => URL.revokeObjectURL(url), 5000); }
function ColorPicker({ value, onChange, label = ui("皮料颜色") }: {
    value: string;
    onChange: (v: string) => void;
    label?: string;
}) { return <><div className="section-title">{label}<span>{ui(PALETTE.find(c => c.hex === value)?.name ?? value.toUpperCase())}</span></div><div className="swatches">{PALETTE.map(c => <button key={c.hex} title={ui(c.name)} aria-label={`${label}：${ui(c.name)}`} aria-pressed={value === c.hex} className={value === c.hex ? 'selected' : ''} style={{ background: c.hex }} onClick={() => onChange(c.hex)}>{value === c.hex && <Check size={17}/>}</button>)}</div><label className="custom-color"><span>{ui("自定义颜色")}</span><input aria-label={ui("自定义{0}", [label])} type="color" value={value} onChange={e => onChange(e.target.value)}/><span>{value.toUpperCase()}</span></label></>; }
export default function Studio({ lightPreview = false }: {
    lightPreview?: boolean;
}) {
    const inquiry = useInquiryDraft();
    const lang = getLang();
    const [saveState, setSaveState] = useState<'loading'|'saving'|'saved'|'error'>('loading');
    const [pendingHref, setPendingHref] = useState(localizedHref('/'));
    const [nameDraft, setNameDraft] = useState('');
    const [lightMode, setLightMode] = useState(lightPreview);
    const [design, setDesign] = useState<Design>(initialDesign), [selected, setSelected] = useState<Part | 'label'>('body'), [section, setSection] = useState('material'), [linked, setLinked] = useState(true), [allEdges, setAllEdges] = useState(true), [showTissue, setShowTissue] = useState(false), [rotating, setRotating] = useState(false), [compare, setCompare] = useState(false), [view, setView] = useState('hero'), [dialog, setDialog] = useState<null | 'save' | 'library' | 'export' | 'reference' | 'reset' | 'consult' | 'preset' | 'leave'>(null), [pendingPreset, setPendingPreset] = useState<{
        index: number;
        name: string;
    } | null>(null), [busy, setBusy] = useState(false), [saved, setSaved] = useState<Saved[]>([]), [loadError, setLoadError] = useState(''), [saveId, setSaveId] = useState(''), [historyTick, setHistoryTick] = useState(0);
    const handle = useRef<ProductHandle | null>(null), history = useRef<Design[]>([]), future = useRef<Design[]>([]), latest = useRef(design), importer = useRef<HTMLInputElement>(null), labelUpload = useRef<HTMLInputElement>(null);
    latest.current = design;
    const part: Part = selected === 'label' ? 'body' : selected;
    const surface = design.parts[part];
    const commit = useCallback((next: Design) => { history.current.push(cloneDesign(latest.current)); if (history.current.length > 40)
        history.current.shift(); future.current = []; latest.current = next; setDesign(next); setCompare(false); setSaveId(''); setHistoryTick(n => n + 1); }, []);
    const change = (patch: Partial<Surface>, all = false) => { const next = cloneDesign(design); const keys = all ? PARTS : selected.startsWith('corner') && linked ? PARTS.filter(p => p.startsWith('corner')) : [part]; for (const key of keys)
        next.parts[key] = { ...next.parts[key], ...patch }; commit(next); };
    const sameDesign = (a: Design, b: Design) => JSON.stringify(a) === JSON.stringify(b);
    const applyPreset = (index: number, base: Design) => {
        const next = preset(index);
        if (!sameDesign(base, next)) commit(next);
        toast.success(ui('已应用「{0}」，可撤销恢复。', [displayDesignName(PRESETS[index].name)]));
    };
    const activePreset = PRESETS.findIndex((_, index) => {
        const reference = preset(index);
        return JSON.stringify(design.parts) === JSON.stringify(reference.parts)
            && JSON.stringify(design.label) === JSON.stringify(reference.label);
    });
    // 换预设会整份替换当前设计，因此先确认：无改动或已是该搭配时直接应用，否则弹窗让用户选择，且仍可撤销。
    const requestPreset = (index: number) => { if (sameDesign(design, initialDesign()) || sameDesign(design, preset(index)))
        applyPreset(index, design);
    else {
        setPendingPreset({ index, name: PRESETS[index].name });
        setDialog('preset');
    } };
    const undo = () => { const d = history.current.pop(); if (d) {
        future.current.push(cloneDesign(design));
        latest.current = d;
        setDesign(d);
        setCompare(false);
        setSaveId('');
        setHistoryTick(n => n + 1);
    } };
    const redo = () => { const d = future.current.pop(); if (d) {
        history.current.push(cloneDesign(design));
        latest.current = d;
        setDesign(d);
        setCompare(false);
        setSaveId('');
        setHistoryTick(n => n + 1);
    } };
    const select = (p: string) => { if (p === 'label') {
        setSelected('label');
        setView('short');
        handle.current?.view('short');
    }
    else if (p in PART_NAMES)
        setSelected(p as Part); };
    const setCamera = (name: string) => { setView(name); setRotating(false); handle.current?.view(name); };
    const [draftReady, setDraftReady] = useState(false), [modelReady, setModelReady] = useState(false);
    const [exportPreview, setExportPreview] = useState<{
        url: string;
        name: string;
    } | null>(null);
    const [jsonDownload, setJsonDownload] = useState('');
    useEffect(() => { setExportPreview(null); setJsonDownload(''); }, [design]);
    // Restore first; URL presets are applied even when browser storage is unavailable.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            let restored: Design | null = null;
            try {
                const draft = await loadDraft();
                const checked = designSchema.safeParse(draft);
                if (checked.success) restored = checked.data;
                if (!restored) {
                    try {
                        const old = localStorage.getItem('dlcj-draft-v1');
                        if (old) { const parsed = designSchema.safeParse(JSON.parse(old)); if (parsed.success) restored = parsed.data; }
                    } catch { /* A missing legacy draft must not block editing. */ }
                }
            } catch { if (!cancelled) toast.error(ui('无法读取临时草稿，可从“本机方案”重新打开。')); }
            if (cancelled) return;
            if (restored) { latest.current = restored; setDesign(restored); }
            const url = new URL(window.location.href);
            const index = PRESETS.findIndex(p => p.id === url.searchParams.get('preset'));
            if (index >= 0) {
                const base = restored ?? initialDesign();
                if (restored && !sameDesign(base, initialDesign()) && !sameDesign(base, preset(index))) {
                    setPendingPreset({index, name: PRESETS[index].name}); setDialog('preset');
                } else applyPreset(index, base);
            }
            // A consumed preset must not be re-applied on refresh or language change.
            if (url.searchParams.has('preset')) {
                url.searchParams.delete('preset');
                historyReplace(url.pathname + url.search + url.hash);
            }
            setDraftReady(true);
        })();
        return () => { cancelled = true; };
    }, []);
    useEffect(() => {
        if (!draftReady) return;
        let active = true;
        setSaveState('saving');
        const timer = setTimeout(() => {
            saveDraft(design).then(() => { if (active) setSaveState('saved'); }).catch(() => {
                if (active) { setSaveState('error'); toast.error(ui('临时草稿未能保存，请下载方案文件或保存到本机。'), {id: 'draft-error'}); }
            });
        }, 350);
        return () => { active = false; clearTimeout(timer); };
    }, [design, draftReady]);
    useEffect(() => {
        const flush = () => { if (draftReady) void saveDraft(latest.current).catch(() => {}); };
        const hide = () => { if (document.hidden) flush(); };
        const warn = (e: BeforeUnloadEvent) => {
            if (draftReady && saveState !== 'saved') { e.preventDefault(); e.returnValue = ''; }
        };
        document.addEventListener('visibilitychange', hide);
        window.addEventListener('pagehide', flush);
        window.addEventListener('beforeunload', warn);
        return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', warn); };
    }, [draftReady, saveState]);
    const returnToShowcase = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        const href = e.currentTarget.href;
        if (!draftReady) { window.location.assign(href); return; }
        try {
            await saveDraft(latest.current);
            setSaveState('saved');
            // Allow React to remove the unsaved-change listener before navigation.
            setTimeout(() => window.location.assign(href), 0);
        } catch { setPendingHref(href); setDialog('leave'); }
    };
    useEffect(() => { const cb = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
    } }; window.addEventListener('keydown', cb); return () => window.removeEventListener('keydown', cb); }, [design]);
    useEffect(() => { const context = (document as any).modelContext; if (!context?.registerTool)
        return; const lifecycle = new AbortController(); const tools = [{ name: 'read_tissue_design', description: 'Read the current visible tissue box design and selected materials.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => ({ design: latest.current }) }, { name: 'configure_tissue_parts', description: 'Configure the specified tissue-box parts in the visible editor. Does not save or submit the design.', inputSchema: { type: 'object', properties: { parts: { type: 'array', items: { type: 'string', enum: PARTS }, minItems: 1 }, color: { type: 'string' }, perforated: { type: 'boolean' }, material: { type: 'string', enum: ['grain', 'smooth', 'suede'] } }, required: ['parts'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input: any) => { if (!input || !Array.isArray(input.parts) || !input.parts.length || input.parts.some((p: string) => !PARTS.includes(p as Part)) || input.color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(input.color) || input.perforated !== undefined && typeof input.perforated !== 'boolean' || input.material !== undefined && !['grain', 'smooth', 'suede'].includes(input.material))
                throw new Error('Invalid part configuration'); const next = cloneDesign(latest.current); for (const p of input.parts as Part[]) {
                if (input.color !== undefined)
                    next.parts[p].color = input.color;
                if (input.perforated !== undefined)
                    next.parts[p].perforated = input.perforated;
                if (input.material !== undefined)
                    next.parts[p].material = input.material;
            } commit(next); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return { updated: input.parts }; } }]; for (const t of tools) {
        try {
            Promise.resolve(context.registerTool(t, { signal: lifecycle.signal })).catch(() => { });
        }
        catch { }
    } return () => lifecycle.abort(); }, [commit]);
    const save = async () => { setBusy(true); try {
        const typedName = nameDraft.trim();
        const next = {...design, name: typedName === displayDesignName(design.name) ? design.name : typedName || design.name};
        const saved = await saveLocalDesign(next);
        if (next.name !== design.name) commit(next);
        setSaveId(saved.id);
        toast.success(ui("已保存在此浏览器，可在“本机方案”中重新打开。"));
    }
    catch (e) {
        toast.error((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    const library = async () => { setDialog('library'); setBusy(true); setLoadError(''); try {
        setSaved(await listLocalDesigns());
    }
    catch (e) {
        setLoadError((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    const openDesign = async (id: string) => { setBusy(true); try {
        const value = await getLocalDesign(id);
        commit(value);
        setSaveId(id);
        setDialog(null);
        toast.success(ui("本机方案已打开。"));
    }
    catch (e) {
        toast.error((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    const exportSheet = async () => { if (!handle.current || busy)
        return null; setBusy(true); try {
        const views = await handle.current.captureViews(design);
        const canvas = document.createElement('canvas');
        canvas.width = 1800;
        canvas.height = 1440;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#f0f2ec';
        ctx.fillRect(0, 0, 1800, 1440);
        ctx.fillStyle = '#263d33';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(ui("鼎立车眷 / ") + displayDesignName(design.name), 65, 80);
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#727e6b';
        ctx.fillText(ui("定制方案效果预览 · 尺寸和工艺以实物确认为准"), 65, 123);
        for (let i = 0; i < views.length; i++) {
            const im = await new Promise<HTMLImageElement>(r => { const m = new Image(); m.onload = () => r(m); m.src = views[i]; });
            const x = 65 + (i % 3) * 560, y = 170 + Math.floor(i / 3) * 545;
            const ratio = Math.min(535 / im.width, 470 / im.height);
            ctx.drawImage(im, x + (535 - im.width * ratio) / 2, y + (470 - im.height * ratio) / 2, im.width * ratio, im.height * ratio);
            ctx.fillStyle = '#263d33';
            ctx.font = '24px sans-serif';
            ctx.fillText([ui("整体"), ui("顶部"), ui("长侧面"), ui("窄侧面"), ui("底部")][i], x + 15, y + 505);
        }
        ctx.font = '22px sans-serif';
        ctx.fillText(ui("主体 ") + ui(PALETTE.find(c => c.hex === design.parts.body.color)?.name ?? design.parts.body.color), 1190, 790);
        ctx.fillText(ui("皮料 ") + materials.find(m => m.id === design.parts.body.material)?.name, 1190, 835);
        ctx.fillText(ui("打孔 ") + (design.parts.body.perforated ? ui("开启") : ui("关闭")), 1190, 880);
        ctx.fillText(ui("侧标 ") + (design.label.enabled ? design.label.text : ui("无")), 1190, 925);
        const image = canvas.toDataURL('image/png');
        const filename = design.name + ui("-多角度效果图.png");
        setExportPreview({ url: image, name: filename });
        download(image, filename);
        toast.success(ui("效果图已生成，请确认浏览器下载。"), { duration: 2200 });
        return { url: image, name: filename };
    }
    catch (error) {
        console.error('PNG export failed', error);
        toast.error(ui("效果图导出失败，请重试。"));
        return null;
    }
    finally {
        setBusy(false);
    } };
    return <main className="studio" lang={lang === 'en' ? 'en' : 'zh-CN'}><Toaster position="bottom-center"/>
    <header className="studio-topbar">
      <a className="studio-back" href={localizedHref('/')} onClick={returnToShowcase}><ArrowLeft size={18}/><span>{ui('返回首页')}</span></a>
      <a className="studio-wordmark" href={localizedHref('/')} onClick={returnToShowcase}><img src="/brand/dc-logo.svg" width="30" height="27" alt="DC"/><span>{ui('鼎立车眷')}<small>{ui('定制工坊')}</small></span></a>
      <div className="studio-actions">
        <div className="language-switch" role="group" aria-label={ui('选择语言')}><a lang="zh-CN" href={languageHref('zh')} onClick={returnToShowcase} aria-current={lang === 'zh' ? 'true' : undefined}>中文</a><a lang="en" href={languageHref('en')} onClick={returnToShowcase} aria-current={lang === 'en' ? 'true' : undefined}>EN</a></div>
        <button className="studio-action" disabled={!draftReady} onClick={library}><FolderOpen size={16}/><span>{ui('本机方案')}</span></button>
        <button className="studio-action" disabled={!draftReady} onClick={() => {setNameDraft(displayDesignName(design.name)); setSaveId(''); setDialog('save');}}><Bookmark size={16}/><span>{ui('保存设计')}</span></button>
        <button className="button dark studio-review" disabled={!draftReady} onClick={() => setDialog('consult')}><MessageSquare size={16}/><span>{ui('确认方案 · 咨询')}</span></button>
      </div>
    </header>
    <section className="studio-presets" aria-labelledby="presets-title">
      <div className="studio-presets-heading"><div><span className="eyebrow">01 / COLOURWAYS</span><h2 id="presets-title">{ui('从灵感开始')}</h2></div><span className="draft-status" data-state={saveState} role="status">{ui(saveState === 'loading' ? '正在恢复草稿…' : saveState === 'saving' ? '正在保存…' : saveState === 'saved' ? '草稿已保存' : '草稿未保存')}</span></div>
      <div className="studio-preset-grid">{PRESETS.map(({id, name}, index) => <button data-preset={id} key={id} disabled={!draftReady} aria-pressed={activePreset === index} onClick={() => requestPreset(index)}><img src={'/presets/'+id+'.webp'} alt={displayDesignName(name)} width="120" height="90"/><span><small>0{index+1}</small><strong>{displayDesignName(name)}</strong></span>{activePreset === index ? <Check size={16}/> : <ArrowUpRight size={16}/>}</button>)}</div>
      <p>{ui('预设缩略图不随编辑变化；当前方案请看下方预览与摘要。')}</p>
    </section>
    <div className="workspace" aria-busy={!draftReady}><section className="stage"><div className="stage-heading"><div className="eyebrow">02 / DESIGN PREVIEW</div><h1>{compare ? ui("初始搭配") : displayDesignName(design.name)}</h1><p>{ui('搭配预览')}</p></div><div className="stage-top-tools"><button className="icon-button" aria-label={ui("撤销")} disabled={!draftReady || !history.current.length} onClick={undo}><Undo2 size={17}/></button><button className="icon-button" aria-label={ui("重做")} disabled={!draftReady || !future.current.length} onClick={redo}><Redo2 size={17}/></button><span /><button className="icon-button" aria-label={ui("恢复初始搭配")} disabled={!draftReady} onClick={() => setDialog('reset')}><RotateCcw size={16}/></button></div>{lightMode ? <div className="product-canvas light-preview"><figure className="model-preview"><img src={activePreset >= 0 ? "/presets/"+PRESETS[activePreset].id+".webp" : "/showcase/hero-studio-840.webp"} alt={ui("纸巾盒款式参考，图片不随所选配色变化")} width="840" height="473"/><figcaption>{ui(activePreset >= 0 ? '预设搭配 · 静态参考' : '自定义搭配 · 静态图仅供参考')}</figcaption></figure></div> : <ProductView design={compare ? initialDesign() : design} selected={selected} onSelect={p => {if (draftReady) select(p);}} onReady={h => { handle.current = h; h.view(view); setModelReady(true); }} onUnavailable={() => { handle.current = null; setModelReady(false); }} showTissue={showTissue} rotating={rotating && !window.matchMedia("(prefers-reduced-motion: reduce)").matches}/>}<div className="stage-badge"><span className="tiny-square"/>{compare ? ui("初始搭配") : displayDesignName(design.name)}</div>{!lightMode && <><div className="side-tools"><button className="icon-button" aria-label={ui("放大模型")} disabled={!modelReady} onClick={() => handle.current?.zoom(.88)}><Plus size={18}/></button><button className="icon-button" aria-label={ui("缩小模型")} disabled={!modelReady} onClick={() => handle.current?.zoom(1.14)}><Minus size={18}/></button><span /><button className={rotating ? 'icon-button active' : 'icon-button'} aria-label={ui("自动旋转")} disabled={!modelReady} aria-pressed={rotating} onClick={() => setRotating(!rotating)}><Rotate3D size={18}/></button><button className="icon-button" aria-label={ui("重置视角")} disabled={!modelReady} onClick={() => setCamera('hero')}><Maximize2 size={17}/></button></div><div className="view-controls">{[['hero', ui("整体")], ['top', ui("顶部")], ['long', ui("长侧")], ['short', ui("窄侧")], ['bottom', ui("底部")], ['grain', ui("皮纹")]].map(([k, n]) => <button key={k} className={view === k ? 'active' : ''} disabled={!modelReady} onClick={() => setCamera(k)}>{n}</button>)}</div></>}<div className="stage-options"><button className="text-button" aria-pressed={lightMode} onClick={() => { handle.current = null; setModelReady(false); setLightMode(!lightMode); }}><Eye size={14}/>{lightMode ? ui("打开 3D 预览") : ui("使用轻量预览")}</button>{!lightMode && <><label><Switch size="sm" aria-label={ui("显示纸巾")} disabled={!modelReady} checked={showTissue} onCheckedChange={setShowTissue}/>{ui("显示纸巾")}</label><button className={compare ? 'text-button active' : 'text-button'} disabled={!modelReady} onClick={() => setCompare(!compare)}><SplitSquareHorizontal size={14}/>{compare ? ui("返回本机方案") : ui("对比初始")}</button></>}<button className="text-button" onClick={() => setDialog('reference')}><Eye size={14}/>{ui("实物参考")}</button></div><div className="stage-bottom"><span><Rotate3D size={16}/> {lightMode ? ui('静态参考不随自定义修改变化；文件保留实际方案。') : !modelReady ? ui('3D 预览暂未就绪，可继续编辑并下载方案。') : view === 'grain' ? ui("侧光查看细纹 · 滚轮调整距离") : ui("拖动旋转 · 点击部位定制")}</span><span>{ui("建模参考尺寸 16 × 10.5 × 约 6 cm")}</span></div></section><aside className="inspector" inert={!draftReady}><div className="panel-heading"><span className="eyebrow">MAKE IT YOURS</span><h2>{ui("设计你的纸巾盒")}</h2></div><div className="part-buttons">{[['body', ui("主体"), Layers], ['corner0', ui("四角"), Box], ['trim', ui("口沿"), Scissors], ['label', ui("侧标"), Tag]].map(([p, name, Icon]) => { const I = Icon as typeof Layers; return <button key={String(p)} className={selected === p || p === 'corner0' && selected.startsWith('corner') ? 'active' : ''} onClick={() => select(String(p))}><I size={17}/>{String(name)}</button>; })}</div>{selected.startsWith('corner') && <div className="corner-controls"><div className="switch-line"><span>{ui("四角同步")}</span><Switch aria-label={ui("四角同步")} size="sm" checked={linked} onCheckedChange={setLinked}/></div><div className="corner-numbers">{[0, 1, 2, 3].map(n => <button aria-label={ui("选择包角 {0}", [n + 1])} className={selected === 'corner' + n ? 'active' : ''} key={n} onClick={() => setSelected(('corner' + n) as Part)}>0{n + 1}</button>)}</div></div>}
    {selected === 'label' ? <div className="label-controls"><div className="control-section switch-line"><div><strong>{ui("窄边布标")}</strong><p>{ui("小小的标记，专属于你")}</p></div><Switch aria-label={ui("启用侧标")} checked={design.label.enabled} onCheckedChange={enabled => commit({ ...design, label: { ...design.label, enabled } })}/></div>{design.label.enabled && <><div className="control-section"><label className="section-title" htmlFor="labelText">{ui("标签文字 ")}<span>{ui("最多 12 字")}</span></label><Input id="labelText" value={design.label.text} maxLength={12} onChange={e => commit({ ...design, label: { ...design.label, text: e.target.value, image: undefined } })}/><button className="upload-label" onClick={() => labelUpload.current?.click()}><ImagePlus size={16}/>{ui("用图片作为标签")}</button><input type="file" accept="image/png,image/jpeg,image/webp" hidden ref={labelUpload} onChange={async (e) => { const f = e.target.files?.[0]; if (f)
        try {
            const image = await imageFile(f);
            commit({ ...design, label: { ...design.label, image } });
        }
        catch (err) {
            toast.error((err as Error).message);
        } e.target.value = ''; }}/>{design.label.image && <button className="text-button" onClick={() => commit({ ...design, label: { ...design.label, image: undefined } })}>{ui("移除标签图片")}</button>}</div><div className="control-section"><ColorPicker label={ui("标签底色")} value={design.label.color} onChange={color => commit({ ...design, label: { ...design.label, color } })}/></div><div className="control-section"><label className="small-color-row">{ui("文字颜色")}<input aria-label={ui("标签文字颜色")} type="color" value={design.label.ink} onChange={e => commit({ ...design, label: { ...design.label, ink: e.target.value } })}/></label></div></>}</div> : <Tabs className="config-tabs" value={section} onValueChange={setSection}><TabsList className="tab-list" variant="line"><TabsTrigger value="material"><Palette size={15}/>{ui("材质配色")}</TabsTrigger><TabsTrigger value="details"><Scissors size={15}/>{ui("工艺细节")}</TabsTrigger><TabsTrigger value="art"><PenLine size={15}/>{ui("图案创作")}</TabsTrigger></TabsList><TabsContent value="material"><div className="control-section"><div className="section-title">{ui("材质")}<span>{ui(PART_NAMES[part])}</span></div><div className="material-grid">{materials.map(m => <button key={m.id} className={surface.material === m.id ? 'selected' : ''} aria-label={m.name} onClick={() => change({ material: m.id })}><span className={'material-sample ' + m.id} style={{ backgroundColor: surface.color }}/>{m.name}{surface.material === m.id && <span className="material-check"><Check size={11}/></span>}</button>)}</div><p className="material-description">{materials.find(m => m.id === surface.material)?.desc}</p></div><div className="control-section"><ColorPicker value={surface.color} onChange={color => change({ color })}/></div><div className="control-section switch-line"><div><strong>{ui("皮料打孔")}</strong><p>{ui("使用现有固定孔径与间距")}</p></div><Switch aria-label={ui("皮料打孔")} checked={surface.perforated} onCheckedChange={perforated => change({ perforated })}/></div><button className="next-section" onClick={() => setSection('details')}>{ui("搭配封边与缝线")}<ChevronRight size={17}/></button></TabsContent><TabsContent value="details"><div className="control-section switch-line"><div><strong>{ui("统一封边与线色")}</strong><p>{ui("关闭后只修改当前部位")}</p></div><Switch aria-label={ui("统一封边与线色")} checked={allEdges} onCheckedChange={setAllEdges}/></div><div className="control-section"><ColorPicker value={surface.edge} label={ui("封边油颜色")} onChange={edge => change({ edge }, allEdges)}/></div><div className="control-section"><ColorPicker value={surface.thread} label={ui("缝线颜色")} onChange={thread => change({ thread }, allEdges)}/></div></TabsContent><TabsContent value="art"><div className="art-intro"><strong>{ui(PART_NAMES[part])}{ui(" · 展开创作")}</strong><span>{ui("图案随皮料折合，在预览中查看效果。")}</span></div><ArtEditor part={part} surface={surface} onChange={art => change({ art })}/></TabsContent></Tabs>}
    <div className="inspector-footer"><button className="button dark consult-entry" onClick={() => setDialog('consult')}><MessageSquare size={16}/>{ui("确认方案 · 咨询这款")}</button><button className="button export-button" onClick={() => setDialog('export')}><Download size={16}/>{ui(" 导出我的方案")}</button><p>{ui("屏幕效果供搭配参考；尺寸 16 × 10.5 × 约 6 cm 为建模参考，成品以实物确认为准。")}</p></div></aside></div><input ref={importer} type="file" accept="application/json,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f)
        try {
            if (f.size > 12000000)
                throw new Error();
            const raw = JSON.parse(await f.text());
            commit(designSchema.parse(raw.design ?? raw));
            setDialog(null);
            toast.success(ui("方案已导入。"));
        }
        catch {
            toast.error(ui("无法读取方案，请选择本站导出的设计文件。"));
        } e.target.value = ''; }}/>
    <Dialog open={dialog !== null} onOpenChange={open => { if (!open)
        setDialog(null); }}><DialogContent className={dialog === 'reference' ? 'reference-dialog' : dialog === 'consult' ? 'consult-dialog' : 'studio-dialog'}><DialogTitle>{dialog === 'leave' ? ui('离开前保留你的设计') : dialog === 'save' ? ui("保存这份专属设计") : dialog === 'library' ? ui("本机方案") : dialog === 'export' ? ui("带走你的设计") : dialog === 'reset' ? ui("恢复初始搭配？") : dialog === 'consult' ? ui("确认方案 · 咨询这款") : dialog === 'preset' ? ui("要应用这个推荐配色吗？") : ui("实物参考与建模说明")}</DialogTitle><DialogDescription>{dialog === 'leave' ? ui('草稿未能保存。请先下载方案备份；直接离开可能丢失最后的修改。') : dialog === 'save' ? ui("保存到此浏览器；下载方案文件可在其他设备重新导入。") : dialog === 'library' ? ui("方案只保存在此浏览器。换设备或清理浏览器前，请下载方案文件备份。") : dialog === 'export' ? ui("效果图用于分享，方案文件保留全部可编辑内容。") : dialog === 'reset' ? ui("当前操作可以通过“撤销”找回。") : dialog === 'consult' ? ui("核对搭配、填写数量，再把方案发给商家确认报价。") : dialog === 'preset' ? ui("应用后会更新本机草稿，可在本次编辑中点“撤销”恢复。需要长期保留原方案，请先导出。") : ui("白色成品与展开裁片的实物参考；3D 模型按实物建立，尺寸为参考值，成品规格以实物确认为准。")}</DialogDescription>{dialog === 'leave' && <div className="leave-actions"><button className="button dark" onClick={() => download(new Blob([JSON.stringify({design}, null, 2)], {type:'application/json'}), design.name+'.json')}><Download size={16}/>{ui('下载备份')}</button><button className="button" onClick={() => setDialog(null)}>{ui('继续编辑')}</button><button className="text-button" onClick={() => {setSaveState('saved'); setTimeout(() => window.location.assign(pendingHref), 0);}}>{ui('仍然离开')}</button></div>}{dialog === 'save' && <><label className="field-label" htmlFor="designName">{ui("设计名称")}</label><Input id="designName" value={nameDraft} maxLength={60} onChange={e => {setNameDraft(e.target.value); setSaveId('');}}/>{saveId ? <div className="saved-success"><Check size={22}/><strong>{ui("已保存")}</strong><span>{ui("在“本机方案”中随时继续编辑。")}</span></div> : <button className="button dark" disabled={busy || !nameDraft.trim()} onClick={save}>{busy ? <LoaderCircle className="spin" size={17}/> : <Bookmark size={17}/>}{ui("保存到本机")}</button>}<button className="text-button" onClick={() => download(new Blob([JSON.stringify({ design }, null, 2)], { type: 'application/json' }), design.name + '.json')}>{ui("也可以下载可编辑方案文件")}</button></>}{dialog === 'library' && <><button className="button" onClick={() => importer.current?.click()}><FileUp size={16}/>{ui("导入方案文件")}</button>{busy ? <div className="loading-row"><LoaderCircle className="spin"/>{ui("正在读取…")}</div> : loadError ? <p className="empty-inline">{loadError}</p> : saved.length === 0 ? <p className="empty-inline">{ui("还没有保存的设计。完成搭配后，点右上角“保存设计”。")}</p> : <div className="saved-list">{saved.map(s => <button key={s.id} onClick={() => openDesign(s.id)}><Bookmark size={18}/><span><strong>{displayDesignName(s.name)}</strong><small>{new Date(s.date).toLocaleString(lang === 'en' ? 'en-GB' : 'zh-CN')}</small></span><ChevronRight size={17}/></button>)}</div>}</>}{dialog === 'export' && <> {!modelReady && <p className="consult-note">{ui("3D 预览尚未载入：仍可下载可编辑方案文件，也可以在“确认方案 · 咨询这款”中复制需求文字。")}</p>}<button className="export-option" disabled={busy || !modelReady} onClick={exportSheet}><Download size={24}/><span><strong>{ui("多角度效果图")}</strong><small>{ui("整体、顶部、底部与两个方向侧面")}</small></span>{busy ? <LoaderCircle className="spin" size={17}/> : <ChevronRight size={17}/>}</button><button className="export-option" onClick={() => { const content = JSON.stringify({ design, notes: ui("比例模型；制作前需确认实测尺寸、裁片和工艺。") }, null, 2); setJsonDownload('data:application/json;charset=utf-8,' + encodeURIComponent(content)); download(new Blob([content], { type: 'application/json' }), design.name + '.json'); toast.success(ui("方案文件已导出。")); }}><Layers size={24}/><span><strong>{ui("可编辑方案文件")}</strong><small>{ui("保留材质、颜色、图案原图与笔迹")}</small></span><ChevronRight size={17}/></button>{jsonDownload && <a className="button" href={jsonDownload} download={design.name + '.json'}>{ui("下载 JSON 方案文件")}</a>}{exportPreview && <div className="export-preview"><a href={exportPreview.url} download={exportPreview.name}><img src={exportPreview.url} alt={ui("当前方案多角度效果图")}/><span>{ui("下载 PNG 效果图")}</span></a></div>}</>}{dialog === 'reference' && <div className="reference-images"><figure><img src="/references/white.jpg" alt={ui("白色皮革纸巾盒，带打孔包角和绿色封边")}/><figcaption>{ui("成品参考")}</figcaption></figure><figure><img src="/references/pattern.jpg" alt={ui("一张主体皮料和四个包角的展开裁片")}/><figcaption>{ui("一张主体 · 四个包角")}</figcaption></figure></div>}{dialog === 'consult' && <ConsultPanel design={design} modelReady={modelReady} onExportPng={exportSheet} input={inquiry.input} onInput={inquiry.setInput} inputReady={inquiry.ready} storageFailed={inquiry.storageFailed}/>}{dialog === 'preset' && pendingPreset && <div className="dialog-actions preset-actions"><button className="button" onClick={() => { setPendingPreset(null); setDialog(null); }}>{ui("保留我现在的设计")}</button><button className="button dark" onClick={() => { applyPreset(pendingPreset.index, design); setPendingPreset(null); setDialog(null); }}>{ui("应用「")}{displayDesignName(pendingPreset.name)}{ui("」（可撤销）")}</button></div>}{dialog === 'reset' && <div className="dialog-actions"><button className="button" onClick={() => setDialog(null)}>{ui("继续当前设计")}</button><button className="button dark" onClick={() => { commit(initialDesign()); setDialog(null); setCamera('hero'); }}>{ui("恢复初始搭配")}</button></div>}</DialogContent></Dialog></main>;
}
