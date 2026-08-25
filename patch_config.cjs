const fs = require('fs');
let code = fs.readFileSync('src/views/ConfiguracoesView.tsx', 'utf8');

const importTarget = "import { PageHeader } from '../components/layout';";
const importReplacement = "import { PageHeader } from '../components/layout';\nimport { GoogleDriveSyncCard } from '../components/configuracoes/GoogleDriveSyncCard';";

const triggerTarget = `<TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-secondary/50 rounded-xl mb-6">`;
const triggerReplacement = `<TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto p-1 bg-secondary/50 rounded-xl mb-6">\n          <TabsTrigger value="drive" className="py-2.5 flex items-center gap-2 text-xs md:text-sm">\n            <AlertCircle className="w-4 h-4" />\n            <span>Drive & Sync</span>\n          </TabsTrigger>`;

const contentTarget = "{/* TAB 1: SEGURANÇA & PIN */}";
const contentReplacement = `{/* TAB 0: DRIVE & SYNC */}
        <TabsContent value="drive" className="space-y-6">
          <GoogleDriveSyncCard />
        </TabsContent>

        {/* TAB 1: SEGURANÇA & PIN */}`;

code = code.replace(importTarget, importReplacement);
code = code.replace(triggerTarget, triggerReplacement);
code = code.replace(contentTarget, contentReplacement);

fs.writeFileSync('src/views/ConfiguracoesView.tsx', code);
console.log("ConfiguracoesView patched!");
