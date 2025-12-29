// Generate build information
import { writeFileSync } from 'fs';

const buildInfo = {
  version: process.env.npm_package_version,
  buildDate: new Date().toISOString(),
  buildTimestamp: Date.now()
};

writeFileSync(
  'public/build-info.json',
  JSON.stringify(buildInfo, null, 2)
);

console.log('✅ Build info generated:', buildInfo);
