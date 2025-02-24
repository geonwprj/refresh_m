#!/usr/bin/env node

const fs = require('fs');
// 如果你使用 Node.js 18+，可直接使用內建 fetch，否則請安裝 node-fetch
const fetch = require('node-fetch');

(async () => {
  try {
    // 替換成你的 JSON URL
    const url = 'https://raw.liucn.cc/box/m.json';
    const response = await fetch(url);
    let content = await response.text();

    // 移除每行以 '//' 開頭的註解行
    content = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');

    // 解析 JSON 並做修改處理，例如加入 lastUpdated 欄位
    let jsonData = JSON.parse(content);
    jsonData.lastUpdated = new Date().toISOString();

    // 轉回字串，設定適當縮排
    const cleanedJSON = JSON.stringify(jsonData, null, 2);

    // 將清理後的 JSON 寫入 docs/cleaned.json (假設 docs 資料夾為 GitHub Pages 發佈來源)
    fs.writeFileSync('box/m.json', cleanedJSON);

    console.log('Cleaned JSON saved successfully!');
  } catch (error) {
    console.error('Error processing JSON:', error);
    process.exit(1);
  }
})();
