// scripts/refresh_xptv.js
const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '..', 'box', 'xptv_raw.json'); // 這是新格式來源檔，自己改路徑
const OUTPUT_PATH = path.join(__dirname, '..', 'box', 'all.json');     // 輸出檔

function slugifyName(name) {
  // 1. 全轉小寫
  let s = name.toLowerCase();

  // 2. 把非字母數字的字元都轉成底線
  s = s.replace(/[^a-z0-9]+/g, '_');

  // 3. 去除前後底線
  s = s.replace(/^_+|_+$/g, '');

  // 4. 保底，如果整個被清空，就給一個通用 key
  if (!s) s = 'site';

  return s;
}

function shortHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  // 轉成正數 + 36 進位，縮短一點
  return Math.abs(hash).toString(36);
}

function generateKeys(sites) {
  const used = new Set();

  return sites.map((site, index) => {
    const base = slugifyName(site.name || `site_${index}`);
    let key = base;
    let attempt = 1;

    // 防重複，如果已存在就加短 hash 或遞增 suffix
    while (used.has(key)) {
      key = `${base}_${shortHash(base + '_' + attempt)}`;
      attempt++;
    }

    used.add(key);
    return {
      key,
      ...site,
    };
  });
}

function main() {
  // 讀新格式檔案
  const raw = fs.readFileSync(INPUT_PATH, 'utf8');
  const json = JSON.parse(raw);

  const rawSites = Array.isArray(json.sites) ? json.sites : [];

  // 補預設欄位
  const withDefaults = rawSites.map((s) => ({
    // 原本就有的欄位優先
    name: s.name,
    type: s.type ?? 1,
    api: s.api,

    // 預設值
    searchable: s.searchable ?? 1,
    quickSearch: s.quickSearch ?? 1,
    filterable: s.filterable ?? 1,
  }));

  // 產生不重複、無特殊字元的 key
  const finalSites = generateKeys(withDefaults);

  const outputJson = {
    sites: finalSites,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputJson, null, 2), 'utf8');
  console.log(`Successfully synced and saved to ${OUTPUT_PATH}`);
}

main();
