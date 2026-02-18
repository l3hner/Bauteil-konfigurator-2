const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { reject(err); });
  });
}

async function main() {
  const baseUrl = 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/';
  const files = ['Montserrat-Bold.ttf', 'Montserrat-SemiBold.ttf'];
  for (const f of files) {
    const dest = path.join(fontsDir, f);
    console.log('Downloading', f, '...');
    await download(baseUrl + f, dest);
    const stat = fs.statSync(dest);
    console.log(f, 'downloaded:', stat.size, 'bytes');
  }
  console.log('Done.');
}
main().catch(console.error);
