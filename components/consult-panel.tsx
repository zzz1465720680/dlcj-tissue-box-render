import {t as ui, getLang, displayDesignName} from '@/lib/i18n';
'use client';
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Check, ClipboardCopy, Download, FileJson, ImageDown, PenLine, Phone, Send, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { Design } from '@/lib/design';
import { MERCHANT_CONFIG, activeContactChannels, merchantFacts } from '@/lib/merchant-config';
import { copyText } from '@/lib/clipboard';
import type { InquiryInput } from '@/hooks/use-inquiry-draft';
import { buildInquiryJson, buildInquiryText, designSignature, inquiryContentKey, inquiryFileName, NOTE_MAX, parseQuantity, QUANTITY_MAX, summarizeDesign, summaryHighlights, } from '@/lib/purchase';
import { Input } from '@/components/ui/input';
import ContactOptions from './contact-options';
function download(data: Blob, name: string) {
    const url = URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return url;
}
const QUANTITY_MIN_HINT = `1 – ${QUANTITY_MAX}`;
const artLine = (art: {
    images: number;
    texts: number;
    strokes: number;
}) => ui("图案 图片 {0} · 文字 {1} · 笔迹 {2}", [art.images, art.texts, art.strokes]);
/** 方案确认 / 询价：只在本机生成与导出，不做任何提交。 */
export default function ConsultPanel({ design, modelReady, onExportPng, input, onInput, inputReady, storageFailed }: {
    design: Design;
    modelReady: boolean;
    onExportPng: () => Promise<{
        url: string;
        name: string;
    } | null>;
    input: InquiryInput;
    onInput: Dispatch<SetStateAction<InquiryInput>>;
    inputReady: boolean;
    storageFailed: boolean;
}) {
    const { quantity, note, lastCopiedKey } = input;
    const generatedAt = useMemo(() => new Date(), [design, quantity, note]);
    const [manualCopy, setManualCopy] = useState(false);
    const [downloaded, setDownloaded] = useState('');
    const [pngBusy, setPngBusy] = useState(false);
    const [preview, setPreview] = useState<{
        url: string;
        name: string;
        key: string;
    } | null>(null);
    const [fileDownload, setFileDownload] = useState<{
        url: string;
        name: string;
        key: string;
    } | null>(null);
    useEffect(() => () => { if (fileDownload)
        URL.revokeObjectURL(fileDownload.url); }, [fileDownload]);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const summary = useMemo(() => summarizeDesign(design), [design]);
    const highlights = useMemo(() => summaryHighlights(design), [design]);
    const validation = parseQuantity(quantity);
    const quantityValue = validation.ok ? validation.value : 0;
    const text = useMemo(() => (quantityValue > 0 ? buildInquiryText(design, { quantity: quantityValue, note }, generatedAt) : ''), [design, generatedAt, note, quantityValue]);
    const signature = useMemo(() => designSignature(design), [design]);
    const contentKey = useMemo(() => inquiryContentKey(design, quantity, note), [design, quantity, note]);
    const valid = inputReady && validation.ok;
    const copy = async () => {
        if (!valid)
            return;
        if (await copyText(text)) {
            setManualCopy(false);
            onInput(previous => ({ ...previous, lastCopiedKey: contentKey }));
            toast.success(ui("需求已复制，请发给商家确认。"), { duration: 2200 });
        }
        else {
            setManualCopy(true);
            requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.select(); });
            toast.error(ui("未能自动复制，请长按文字或使用 Ctrl / ⌘ + C。"));
        }
    };
    const stale = Boolean(lastCopiedKey) && lastCopiedKey !== contentKey;
    const channels = activeContactChannels();
    const facts = merchantFacts(getLang());
    return (<div className="consult-panel">
      <section className="consult-block">
        <h3>{ui("你的搭配")}<span>{ui("方案参考码 DLCJ-")}{signature}</span></h3>
        <ul className="consult-highlights">
          {highlights.map(line => <li key={line}><Check size={14}/>{line}</li>)}
        </ul>
        <details className="consult-detail-list"><summary>{ui("查看全部部位、图案与侧标")}</summary>
        <ul className="consult-parts">
          {summary.parts.map(row => (<li key={row.part}>
              <strong>{row.name}</strong>
              <span>{row.material}｜{row.color} {row.colorHex}{ui("｜打孔 ")}{row.perforated ? ui("开") : ui("关")}</span>
              <span>{ui("封边油 ")}{row.edgeName} {row.edge}{ui("｜缝线 ")}{row.threadName} {row.thread}</span>
              <span>{artLine(row.art)}{row.artTexts.length ? ui("｜文字：{0}", [row.artTexts.join('、')]) : ''}</span>
            </li>))}
          <li>
            <strong>{ui("窄边布标")}</strong>
            {summary.label.enabled
            ? <>
                  <span>{ui("底色 ")}{summary.label.colorName} {summary.label.color}{ui("｜文字色 ")}{summary.label.inkName} {summary.label.ink}</span>
                  <span>{ui("文字「")}{summary.label.text || ui("未填写")}{ui("」｜标签图片 ")}{summary.label.hasImage ? ui("有（原图在方案文件中）") : ui("无")}</span>
                </>
            : <span>{ui("未启用")}</span>}
          </li>
        </ul></details>
        <p className="consult-note">{ui(" 图片与笔迹的完整原图保存在下方“方案文件（JSON）”里，文字摘要不包含完整图案内容。 ")}</p>
      </section>

      <section className="consult-block">
        <h3>{ui("数量与需求")}</h3>
        <div className="consult-fields">
          <label htmlFor="consultQuantity">{ui("定制数量")}<span>{QUANTITY_MIN_HINT}{ui(" 件")}</span></label>
          <Input id="consultQuantity" inputMode="numeric" value={quantity} maxLength={32} disabled={!inputReady} onChange={event => { const quantity = event.target.value; onInput(previous => ({ ...previous, quantity })); }} aria-invalid={!validation.ok} aria-describedby="consultQuantityError"/>
          <p className="consult-field-note" id="consultQuantityError" data-invalid={!validation.ok}>
            {!inputReady ? ui("正在恢复本机需求…") : validation.ok ? ui("按 {0} 件询价，起订量和批量价格另行确认。", [validation.value]) : validation.message}
          </p>
          <label htmlFor="consultNote">{ui("需求备注")}<span>{ui("最多 ")}{NOTE_MAX}{ui(" 字 · ")}{note.length}/{NOTE_MAX}</span></label>
          <textarea id="consultNote" className="consult-textarea consult-note-input" rows={3} maxLength={NOTE_MAX} value={note} disabled={!inputReady} onChange={event => { const note = event.target.value; onInput(previous => ({ ...previous, note })); }} placeholder={ui("例如：希望图案小一些；需要在某月前做好；想要实物色卡。")}/>
          <p className="consult-note">{storageFailed ? ui("当前页面会保留填写内容，但浏览器未能保存到本机。离开前请复制或下载需求。") : ui("数量和备注会保存在本机，返回修改配色后仍可继续。")}</p>
        </div>
      </section>

      <section className="consult-block">
        <h3>{ui("需求文字")}<span>{ui("可复制给商家")}</span></h3>
        <textarea ref={textarea} className="consult-textarea consult-output" readOnly value={text} rows={9} aria-label={ui("可复制给商家的需求文字")} onFocus={event => event.currentTarget.select()}/>
        {manualCopy && <p className="consult-warn" role="status">{ui("未能自动复制。请长按上面的文字选择复制，或使用 Ctrl / ⌘ + C。")}</p>}
        {stale && <p className="consult-warn" role="status">{ui("方案、数量或备注已修改，请重新复制或下载，避免发出旧需求。")}</p>}
        <div className="consult-actions">
          <button className="button dark" onClick={copy} disabled={!valid}><ClipboardCopy size={16}/>{ui("复制需求文字")}</button>
          <button className="button" disabled={!valid} onClick={() => { if (!valid)
        return; const name = inquiryFileName(design, generatedAt, 'txt'); const url = download(new Blob([text], { type: 'text/plain;charset=utf-8' }), name); setFileDownload({ url, name, key: contentKey }); setDownloaded(ui("需求文件已生成，请确认浏览器下载，也可点击下方链接再次保存。")); }}><Download size={16}/>{ui("下载需求文字")}</button>
        </div>
      </section>

      <section className="consult-block">
        <h3>{ui("方案文件")}<span>{ui("用于沟通与确认")}</span></h3>
        <div className="consult-actions">
          <button className="button" disabled={!valid} onClick={() => {
            if (!inputReady || !validation.ok)
                return;
            const name = inquiryFileName(design, generatedAt, 'json');
            const url = download(new Blob([buildInquiryJson(design, { quantity: validation.value, note }, generatedAt)], { type: 'application/json' }), name);
            setFileDownload({ url, name, key: contentKey });
            setDownloaded(ui("完整方案已生成，请确认浏览器下载，也可点击下方链接再次保存。"));
        }}><FileJson size={16}/>{ui("下载方案文件（JSON）")}</button>
          <button className="button" disabled={!valid || !modelReady || pngBusy} onClick={async () => {
            if (!valid || !modelReady || pngBusy)
                return;
            setPngBusy(true);
            setDownloaded('');
            try {
                const result = await onExportPng();
                if (result) {
                    setPreview({ ...result, key: signature });
                    setDownloaded(ui("效果图已生成并发起下载，也可通过下方预览再次保存。"));
                }
                else
                    setDownloaded(ui("效果图未生成，请重试；仍可下载方案文件或复制需求。"));
            }
            catch {
                setDownloaded(ui("效果图生成失败，请重试；仍可下载方案文件或复制需求。"));
            }
            finally {
                setPngBusy(false);
            }
        }}>
            <ImageDown size={16}/>{pngBusy ? ui("正在生成效果图…") : modelReady ? ui("生成多角度效果图（PNG）") : ui("3D 未载入，暂不能生成效果图")}
          </button>
        </div>
        {downloaded && <p className="consult-note" role="status">{downloaded}{ui(" 文件尚未发送给商家。")}</p>}
        {fileDownload && fileDownload.key === contentKey && <a className="button consult-download-link" href={fileDownload.url} download={fileDownload.name}>{ui("再次保存")}{fileDownload.name.endsWith('.json') ? ui("完整方案") : ui("需求文字")}</a>}
        {preview && preview.key === signature && <div className="export-preview"><a href={preview.url} download={preview.name}><img src={preview.url} alt={ui("当前方案多角度效果图")}/><span>{ui("保存效果图")}</span></a></div>}
      </section>

      <section className="consult-block">
        <h3>{ui("下一步：联系商家确认购买")}</h3>
        <ol className="consult-steps">
          <li><Send size={14}/>{ui("把上面的需求文字（或方案文件）发给商家账号，说明数量与期望。")}</li>
          <li><Phone size={14}/>{ui("与商家确认材料实物色卡、图案可制作性、价格、交期与运费。")}</li>
          <li><PenLine size={14}/>{ui("确认无误后，按商家给出的付款方式完成购买；本页不收款、不下单。")}</li>
        </ol>
        {channels.length > 0 ? <ContactOptions lang={getLang()} /> : <p className="consult-warn">{getLang() === "en" ? "Send your design to the maker you contacted. Nothing is sent automatically." : MERCHANT_CONFIG.contact.pendingNote}</p>}
      </section>

      <details className="consult-block consult-pending">
        <summary>{ui("购买前需要确认什么？")}</summary>
        <ul>{facts.confirmed.concat(facts.pending).map(item => <li key={item}>{item}</li>)}</ul>
        <p className="consult-note">{ui(" 复制与下载只把方案保存在你自己的设备上，不会自动发给商家，也不代表已下单或已付款。 ")}</p>
      </details>
    </div>);
}
