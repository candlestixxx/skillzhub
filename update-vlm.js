const fs = require('fs');

let content = fs.readFileSync('src/lib/services/vlm-processor.ts', 'utf8');

// Add Zod validation to the parse step
content = content.replace(
    'import { pipeline } from "stream/promises";',
    'import { pipeline } from "stream/promises";\nimport { VLMLabelsSchema } from "../schemas";'
);

content = content.replace(
    '        if (jsonMatch) {\n            return JSON.parse(jsonMatch[0]);\n        }',
    '        if (jsonMatch) {\n            const parsed = JSON.parse(jsonMatch[0]);\n            return VLMLabelsSchema.parse(parsed);\n        }'
);

fs.writeFileSync('src/lib/services/vlm-processor.ts', content);
