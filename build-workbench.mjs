import {readFileSync,writeFileSync} from 'node:fs';
const files=['app.js','api.js','workspace.js','task-core.js','productivity.js','response-guide.js','polish.js','taste.js','reference-layout.js'];
writeFileSync(new URL('./public/studio/studio.bundle.js',import.meta.url),files.map(file=>readFileSync(new URL('./public/studio/'+file,import.meta.url),'utf8')).join('\n;\n'));
console.log('Workbench bundle rebuilt');
