import {t as ui, getLang, displayDesignName} from '@/lib/i18n';
import type { Design } from './design';
import { designSchema } from './schema';
export type SavedDesign = {
    id: string;
    name: string;
    date: string;
    design: Design;
};
function openStore(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dlcj-local-library', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('designs', { keyPath: 'id' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(ui("浏览器未允许本机保存，请下载方案文件。")));
    });
}
async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await openStore();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('designs', mode);
        const request = action(tx.objectStore('designs'));
        tx.oncomplete = () => { db.close(); resolve(request.result); };
        tx.onerror = tx.onabort = () => { db.close(); reject(new Error(ui("未能保存或读取本机方案，请下载文件备份后重试。"))); };
    });
}
export async function saveLocalDesign(design: Design): Promise<SavedDesign> {
    const value = designSchema.parse(design);
    const record: SavedDesign = { id: crypto.randomUUID(), name: value.name, date: new Date().toISOString(), design: value };
    await transaction('readwrite', store => store.add(record));
    return record;
}
export async function listLocalDesigns(): Promise<SavedDesign[]> {
    const records = await transaction<SavedDesign[]>('readonly', store => store.getAll());
    return records.sort((a, b) => b.date.localeCompare(a.date));
}
export async function getLocalDesign(id: string): Promise<Design> {
    const record = await transaction<SavedDesign | undefined>('readonly', store => store.get(id));
    if (!record)
        throw new Error(ui("没有找到这份本机方案。"));
    return designSchema.parse(record.design);
}
