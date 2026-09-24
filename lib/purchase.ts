import {t as ui, getLang, displayDesignName} from '@/lib/i18n';
// 需求摘要（询价草案）的唯一生成逻辑：纯函数，不发起任何提交。
// 复制、下载都只是把本机生成的文本/文件交给用户，不代表已经发送给商家。
import { PARTS, PALETTE, PART_NAMES, type Design, type Material, type Part } from './design';
export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 999;
export const NOTE_MAX = 300;
export const MATERIAL_NAMES: Record<Material, string> = {
    grain: ui("细纹皮革"),
    smooth: ui("光面皮革"),
    suede: ui("绒面质感"),
};
export type QuantityResult = {
    ok: true;
    value: number;
} | {
    ok: false;
    message: string;
};
/** 数量必须是有效正整数，并有合理上限。 */
export function parseQuantity(raw: string): QuantityResult {
    const trimmed = raw.trim();
    if (!trimmed)
        return { ok: false, message: ui("请填写数量。") };
    if (!/^\d+$/.test(trimmed))
        return { ok: false, message: ui("数量请填写整数（例如 1）。") };
    const value = Number(trimmed);
    if (value < QUANTITY_MIN)
        return { ok: false, message: ui("数量至少为 {0} 件。", [QUANTITY_MIN]) };
    if (value > QUANTITY_MAX)
        return { ok: false, message: ui("数量请控制在 {0} 件以内；更大批量请联系客服单独沟通。", [QUANTITY_MAX]) };
    return { ok: true, value };
}
export function colorName(hex: string): string {
    return ui(PALETTE.find(color => color.hex.toLowerCase() === hex.toLowerCase())?.name ?? "自定义色");
}
export type ArtCounts = {
    images: number;
    texts: number;
    strokes: number;
};
export type PartSummary = {
    part: Part;
    name: string;
    material: string;
    color: string;
    colorHex: string;
    perforated: boolean;
    edge: string;
    edgeName: string;
    thread: string;
    threadName: string;
    art: ArtCounts;
    artTexts: string[];
};
export type DesignSummary = {
    parts: PartSummary[];
    label: {
        enabled: boolean;
        text: string;
        color: string;
        colorName: string;
        ink: string;
        inkName: string;
        hasImage: boolean;
    };
    totals: ArtCounts;
    artTexts: string[];
};
const counts = (art: Design['parts'][Part]['art']): ArtCounts => ({
    images: art.filter(item => item.kind === 'image').length,
    texts: art.filter(item => item.kind === 'text').length,
    strokes: art.filter(item => item.kind === 'stroke' && !item.erase).length,
});
/** 完整列出 6 个部位与侧标，不遗漏独立包角和自定义图案。 */
export function summarizeDesign(design: Design): DesignSummary {
    const parts: PartSummary[] = PARTS.map(part => {
        const surface = design.parts[part];
        return {
            part,
            name: ui(PART_NAMES[part]),
            material: MATERIAL_NAMES[surface.material],
            color: colorName(surface.color),
            colorHex: surface.color.toUpperCase(),
            perforated: surface.perforated,
            edge: surface.edge.toUpperCase(),
            edgeName: colorName(surface.edge),
            thread: surface.thread.toUpperCase(),
            threadName: colorName(surface.thread),
            art: counts(surface.art),
            artTexts: surface.art.filter(item => item.kind === 'text' && item.text).map(item => item.text as string),
        };
    });
    const totals = parts.reduce<ArtCounts>((sum, row) => ({ images: sum.images + row.art.images, texts: sum.texts + row.art.texts, strokes: sum.strokes + row.art.strokes }), { images: 0, texts: 0, strokes: 0 });
    return {
        parts,
        label: {
            enabled: design.label.enabled,
            text: design.label.text,
            color: design.label.color.toUpperCase(),
            colorName: colorName(design.label.color),
            ink: design.label.ink.toUpperCase(),
            inkName: colorName(design.label.ink),
            hasImage: Boolean(design.label.image),
        },
        totals,
        artTexts: parts.flatMap(row => row.artTexts),
    };
}
/** 短签名：把摘要与当前设计绑定，设计一改签名就变。 */
export function designSignature(design: Design): string {
    const source = JSON.stringify(design);
    let hash = 0x811c9dc5;
    for (let index = 0; index < source.length; index += 1) {
        hash ^= source.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(-6);
}
export type InquiryDraft = {
    quantity: number;
    note: string;
};
function validateInquiry(draft: InquiryDraft) {
    if (!Number.isSafeInteger(draft.quantity) || draft.quantity < QUANTITY_MIN || draft.quantity > QUANTITY_MAX) {
        throw new Error(ui("请填写 {0}–{1} 之间的整数数量。", [QUANTITY_MIN, QUANTITY_MAX]));
    }
    if (draft.note.length > NOTE_MAX)
        throw new Error(ui("备注最多 {0} 字。", [NOTE_MAX]));
}
/** A change marker, not a security token or an order number. Includes quantity and notes. */
export function inquiryContentKey(design: Design, quantity: string, note: string): string {
    const parsed = parseQuantity(quantity);
    const content = JSON.stringify({ design, quantity: parsed.ok ? parsed.value : quantity, note: note.trim() });
    let a = 0x811c9dc5, b = 0x9e3779b9;
    for (let index = 0; index < content.length; index++) {
        const char = content.charCodeAt(index);
        a = Math.imul(a ^ char, 0x01000193);
        b = Math.imul(b ^ char, 0x85ebca6b);
    }
    return [a, b].map(value => (value >>> 0).toString(16).padStart(8, '0')).join('').toUpperCase();
}
const artLine = (art: ArtCounts): string => {
    const bits = [ui("图片 {0}", [art.images]), ui("文字 {0}", [art.texts]), ui("笔迹 {0}", [art.strokes])];
    return bits.join(' · ');
};
const stamp = (when: Date): string => {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())} ${pad(when.getHours())}:${pad(when.getMinutes())}`;
};
const MERCHANT_LINE = ui("鼎立车眷");
export function buildInquiryText(design: Design, draft: InquiryDraft, when: Date): string {
    validateInquiry(draft);
    const summary = summarizeDesign(design);
    const signature = designSignature(design);
    const note = draft.note.trim();
    const lines: string[] = [
        ui("{0} 定制需求（本地方案编号 DLCJ-{1}）", [MERCHANT_LINE, signature]),
        ui("生成时间：{0} · 由客户在本机生成，尚未发送给商家", [stamp(when)]),
        '',
        ui("设计名称：{0}", [displayDesignName(design.name)]),
        ui("数量：{0} 件", [draft.quantity]),
        ui("备注：{0}", [note || ui("（无）")]),
        '',
        ui("【部位方案】"),
    ];
    for (const row of summary.parts) {
        lines.push(ui("· {0}：{1}｜颜色 {2} {3}｜打孔 {4}｜封边油 {5} {6}｜缝线 {7} {8}｜图案 {9}{10}", [row.name, row.material, row.color, row.colorHex, row.perforated ? ui("开") : ui("关"), row.edgeName, row.edge, row.threadName, row.thread, artLine(row.art), row.artTexts.length ? ui("｜文字：{0}", [row.artTexts.join('、')]) : '']));
    }
    lines.push('', ui("【侧标】"));
    if (summary.label.enabled) {
        lines.push(ui("窄边布标：启用｜底色 {0} {1}｜文字色 {2} {3}｜文字「{4}」｜标签图片 {5}", [summary.label.colorName, summary.label.color, summary.label.inkName, summary.label.ink, summary.label.text || ui("未填写"), summary.label.hasImage ? ui("有（原图在方案文件中）") : ui("无")]));
    }
    else {
        lines.push(ui("窄边布标：未启用"));
    }
    lines.push('', ui("【图案内容】"));
    lines.push(ui("合计：图片 {0} 张 · 文字 {1} 处 · 手绘笔迹 {2} 段", [summary.totals.images, summary.totals.texts, summary.totals.strokes]));
    lines.push(summary.artTexts.length ? ui("文字内容：{0}", [summary.artTexts.join('、')]) : ui("文字内容：无"));
    lines.push(ui("图片与笔迹的完整原图保存在随附的 .json 方案文件中，本摘要不包含完整图案内容。"));
    lines.push('', ui("【请商家确认】材料与实物色卡、图案可制作性（工艺）、价格与加价规则、起订量、制作交期、运费与售后规则。"), ui("【说明】本方案编号 DLCJ-{0} 是本机识别号，不是商家订单号；生成与复制均不代表已下单、已付款或商家已收到。", [signature]));
    return lines.join('\n');
}
/** 完整方案文件：保留图片/笔迹原图，供商家制作与存档。 */
export function buildInquiryJson(design: Design, draft: InquiryDraft, when: Date): string {
    validateInquiry(draft);
    const signature = designSignature(design);
    return JSON.stringify({
        type: 'dlcj-inquiry-draft',
        version: 1,
        signature: `DLCJ-${signature}`,
        generatedAt: when.toISOString(),
        sent: false,
        note: ui("本文件由客户在本机生成，尚未发送给商家；图片与笔迹原图完整保存在 design 字段内。"),
        request: { quantity: draft.quantity, note: draft.note.trim() },
        summary: summarizeDesign(design),
        design,
    }, null, 2);
}
export function inquiryFileName(design: Design, when: Date, extension: string): string {
    const safe = (displayDesignName(design.name) || ui("定制方案")).replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 40);
    const pad = (value: number) => String(value).padStart(2, '0');
    return ui("{0}-需求-{1}{2}{3}-{4}.{5}", [safe, when.getFullYear(), pad(when.getMonth() + 1), pad(when.getDate()), designSignature(design), extension]);
}
/** 咨询面板顶部展示的可读摘要行，避免用户只看到一大段文本。 */
export function summaryHighlights(design: Design): string[] {
    const summary = summarizeDesign(design);
    const body = summary.parts[0];
    const corners = summary.parts.filter(row => row.part.startsWith('corner'));
    const trim = summary.parts.find(row => row.part === 'trim')!;
    const cornerColors = new Set(corners.map(row => row.colorHex));
    return [
        ui("主体：{0}｜{1}｜打孔{2}", [body.material, body.color, body.perforated ? ui("开") : ui("关")]),
        ui("四个包角：{0}｜打孔{1}", [cornerColors.size > 1 ? ui("{0} 种颜色", [cornerColors.size]) : corners[0].color, corners.every(row => row.perforated) ? ui("全部开") : corners.some(row => row.perforated) ? ui("部分开") : ui("全关")]),
        ui("抽纸口饰边：{0}｜封边 {1}", [trim.color, trim.edgeName]),
        ui("图案：图片 {0} · 文字 {1} · 笔迹 {2}", [summary.totals.images, summary.totals.texts, summary.totals.strokes]),
        ui("侧标：{0}", [summary.label.enabled ? ui("{0}｜文字「{1}」", [summary.label.colorName, summary.label.text || ui("未填写")]) : ui("未启用")]),
    ];
}
