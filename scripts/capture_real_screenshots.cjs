const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.resolve(__dirname, '../public/tutorial-images');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2, // High-res retina
    },
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5179/ ...');
  await page.goto('http://localhost:5179/', { waitUntil: 'networkidle2' });
  await sleep(2000);

  // Helper to execute store commands safely
  const evalStore = async (fnStr) => {
    await page.evaluate((fnBody) => {
      const store = window.useStudioStore;
      if (store) {
        new Function('store', fnBody)(store);
      }
    }, fnStr);
    await sleep(700);
  };

  // Seed sample project to vault if none exists
  await evalStore(`
    store.getState().saveCurrentProjectToVault();
  `);

  console.log('1. Capturing Home Gallery / Dashboard...');
  await evalStore(`
    store.getState().setActiveModal(null);
    store.getState().setActiveView('gallery');
  `);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_home_dashboard.png') });

  console.log('2. Capturing Project Folders Page...');
  await evalStore(`
    store.getState().setActiveModal(null);
    store.getState().setActiveView('folders');
  `);
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_project_folders.png') });

  console.log('3. Capturing Team Workspace Page...');
  await evalStore(`
    store.getState().setActiveModal(null);
    store.getState().setActiveView('team');
  `);
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_team_workspace.png') });

  console.log('4. Capturing Team Workspace (Brand Kit Tab)...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const bkTab = tabs.find(b => b.textContent && b.textContent.includes('Brand Kit'));
    if (bkTab) bkTab.click();
  });
  await sleep(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_team_brand_kit.png') });

  console.log('5. Capturing Studio Editor Overview...');
  await evalStore(`
    store.getState().setActiveModal(null);
    store.getState().setActiveView('editor');
    store.getState().setActiveLeftTab('templates');
  `);
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_editor_overview.png') });

  console.log('6. Capturing Studio Editor - Elements / Shapes Tab...');
  await evalStore(`
    store.getState().setActiveLeftTab('elements');
  `);
  await sleep(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_editor_elements_tab.png') });

  console.log('7. Capturing Studio Editor - Font Combinations Tab...');
  await evalStore(`
    store.getState().setActiveLeftTab('font-combinations');
  `);
  await sleep(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_editor_font_combinations.png') });

  console.log('8. Capturing Studio Editor - Selected Element Inspector...');
  await page.evaluate(() => {
    const state = window.useStudioStore.getState();
    const slide = state.slides[state.activeSlideIndex];
    if (slide && slide.elements.length > 0) {
      state.setSelectedElementId(slide.elements[0].id);
    }
  });
  await sleep(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_editor_inspector.png') });

  console.log('9. Capturing Instagram Simulator Modal...');
  await evalStore(`
    store.getState().setActiveModal('preview');
  `);
  await sleep(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_instagram_simulator.png') });

  console.log('10. Capturing Export Modal...');
  await evalStore(`
    store.getState().setActiveModal('export');
  `);
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_export_modal.png') });

  console.log('11. Capturing Settings & Hotkeys Modal...');
  await evalStore(`
    store.getState().setActiveModal('settings');
  `);
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_settings_hotkeys.png') });

  console.log('12. Capturing Theme Builder Page...');
  await evalStore(`
    store.getState().setActiveModal(null);
    store.getState().setActiveView('theme-builder');
  `);
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_theme_builder.png') });

  console.log('13. Capturing Script Editor Modal...');
  await evalStore(`
    store.getState().setActiveView('editor');
    store.getState().setActiveModal('script');
  `);
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_script_editor.png') });

  console.log('14. Capturing Global Branding Modal...');
  await evalStore(`
    store.getState().setActiveView('editor');
    store.getState().setActiveModal('branding');
  `);
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14_global_branding.png') });

  console.log('15. Capturing Share Project to Team Modal...');
  await evalStore(`
    store.getState().setActiveView('editor');
    store.getState().setActiveModal('team');
  `);
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15_share_team.png') });

  console.log('Successfully captured all 15 real application screenshots!');
  await browser.close();
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
