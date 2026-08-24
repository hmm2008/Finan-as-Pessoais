import { auth } from '../lib/firebase';

const BANNED_PATTERNS = [
  /millennium/i,
  /conta\s*(à\s*)?ordem/i,
  /fundo\s*oportunidades/i,
  /oportunidades/i,
  /s&p\s*500/i,
  /ações\s*s&p/i
];

export function isBannedDemoRecord(item: any): boolean {
  if (!item) return false;
  const targetObj = item.data ? item.data : item;
  
  const fields = [
    targetObj.name,
    targetObj.title,
    targetObj.description,
    targetObj.category,
    targetObj.institution,
    targetObj.subType,
    targetObj.label
  ].filter(Boolean).map(s => String(s));

  return fields.some(text => BANNED_PATTERNS.some(pattern => pattern.test(text)));
}

export async function purgeDemoRecordsFromLocalAndFirebase() {
  return { purgedLocal: 0, purgedFirebase: 0 };
}

purgeDemoRecordsFromLocalAndFirebase().catch(() => {});
