#!/usr/bin/env node
/**
 * AXIS Design System Registry 빌드 스크립트
 *
 * shadcn/ui 호환 레지스트리 생성
 * 각 컴포넌트별 registry-item.json 생성
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PACKAGES = [
  {
    name: 'axis-ui-react',
    prefix: '',
    path: 'packages/axis-ui-react',
    srcDir: 'src',
    outputDir: 'registry/r'
  },
  {
    name: 'axis-agentic-ui',
    prefix: 'agentic-',
    path: 'packages/axis-agentic-ui',
    srcDir: 'src',
    outputDir: 'registry/r'
  }
];

// 배포 대상 디렉토리
const DEPLOY_DIRS = [
  'public/r',           // 루트 레벨 (로컬 테스트용)
  'apps/web/public/r'   // Next.js 앱 (Cloudflare Pages 배포용)
];

async function readComponentSource(packagePath, componentName) {
  const componentDir = path.join(ROOT, packagePath, 'src', componentName);
  const indexPath = path.join(componentDir, 'index.tsx');

  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    return content;
  } catch (error) {
    console.warn(`  경고: ${componentName}/index.tsx 읽기 실패`);
    return null;
  }
}

async function buildPackageRegistry(pkg) {
  console.log(`\n📦 ${pkg.name} 레지스트리 빌드...`);

  const registryPath = path.join(ROOT, pkg.path, 'registry', 'registry.json');
  const outputDir = path.join(ROOT, pkg.path, pkg.outputDir);

  // 출력 디렉토리 생성
  await fs.mkdir(outputDir, { recursive: true });

  // registry.json 읽기
  const registryContent = await fs.readFile(registryPath, 'utf-8');
  const registry = JSON.parse(registryContent);

  const items = [];

  for (const item of registry.items) {
    console.log(`  - ${item.name}`);

    // 컴포넌트 소스 읽기
    const source = await readComponentSource(pkg.path, item.name);

    if (!source) continue;

    // registry-item 생성
    const registryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: `${pkg.prefix}${item.name}`,
      type: item.type,
      title: item.title,
      description: item.description,
      dependencies: item.dependencies || [],
      registryDependencies: item.registryDependencies || [],
      files: [
        {
          path: item.files[0].path,
          type: item.files[0].type,
          content: source
        }
      ]
    };

    // 개별 registry-item.json 저장
    const itemPath = path.join(outputDir, `${pkg.prefix}${item.name}.json`);
    await fs.writeFile(itemPath, JSON.stringify(registryItem, null, 2));

    items.push({
      name: `${pkg.prefix}${item.name}`,
      type: item.type,
      title: item.title,
      description: item.description
    });
  }

  // 패키지 인덱스 생성
  const indexPath = path.join(outputDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify({
    name: registry.name,
    homepage: registry.homepage,
    items
  }, null, 2));

  console.log(`  ✅ ${items.length}개 컴포넌트 빌드 완료`);

  return items;
}

async function buildMergedRegistry() {
  console.log('\n📋 통합 레지스트리 빌드...');

  const allItems = [];
  const registryItems = [];

  // 먼저 모든 컴포넌트 데이터 수집
  for (const pkg of PACKAGES) {
    const registryPath = path.join(ROOT, pkg.path, 'registry', 'registry.json');
    const registryContent = await fs.readFile(registryPath, 'utf-8');
    const registry = JSON.parse(registryContent);

    for (const item of registry.items) {
      const source = await readComponentSource(pkg.path, item.name);
      if (!source) continue;

      const itemName = `${pkg.prefix}${item.name}`;

      // registry-item 생성
      const registryItem = {
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        name: itemName,
        type: item.type,
        title: item.title,
        description: item.description,
        dependencies: item.dependencies || [],
        registryDependencies: item.registryDependencies || [],
        files: [
          {
            path: item.files[0].path,
            type: item.files[0].type,
            content: source
          }
        ]
      };

      registryItems.push({ name: itemName, data: registryItem });

      allItems.push({
        name: itemName,
        type: item.type,
        title: item.title,
        description: item.description
      });
    }
  }

  // 통합 registry.json 데이터
  const mergedRegistry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "axis",
    homepage: "https://axis.minu.best",
    items: allItems
  };

  // 모든 배포 디렉토리에 저장
  for (const deployDir of DEPLOY_DIRS) {
    const outputDir = path.join(ROOT, deployDir);
    await fs.mkdir(outputDir, { recursive: true });

    // 개별 컴포넌트 파일 저장
    for (const item of registryItems) {
      const itemPath = path.join(outputDir, `${item.name}.json`);
      await fs.writeFile(itemPath, JSON.stringify(item.data, null, 2));
    }

    // registry.json 저장
    const registryPath = path.join(outputDir, 'registry.json');
    await fs.writeFile(registryPath, JSON.stringify(mergedRegistry, null, 2));

    console.log(`  📁 ${deployDir}/`);
  }

  console.log(`  ✅ ${allItems.length}개 컴포넌트 × ${DEPLOY_DIRS.length}개 디렉토리 배포 완료`);
}

async function main() {
  console.log('🎨 AXIS Design System Registry 빌드 시작\n');
  console.log('=' .repeat(50));

  // 각 패키지별 빌드
  for (const pkg of PACKAGES) {
    await buildPackageRegistry(pkg);
  }

  // 통합 레지스트리 빌드
  await buildMergedRegistry();

  console.log('\n' + '='.repeat(50));
  console.log('✅ 레지스트리 빌드 완료!');
  console.log('\n사용법:');
  console.log('  Claude Code에서: "Show me the components in the axis registry"');
  console.log('  CLI에서: npx shadcn add @axis/button');
}

main().catch(console.error);
