import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('duration, optional mission, and return without contribution',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'5 min',exact:true}).click();
 await expect(page.getByRole('heading',{name:'The little green pause'})).toBeVisible();
 await page.getByRole('button',{name:'30 min',exact:true}).click();
 await expect(page.getByRole('heading',{name:'The garden & good-deed loop'})).toBeVisible();
 await page.getByRole('switch').click();
 await page.getByRole('button',{name:'Let’s step outside'}).click();
 await expect(page.getByRole('heading',{name:'The world can have your attention.'})).toBeVisible();
 await page.getByRole('button',{name:'I’m back',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Small actions add up.'})).toBeVisible();
 await expect(page.locator('.impact-stat').nth(1).locator('strong')).toHaveText('1');
});

test('live AI, human confirmation, persistence, and SQLite backup',async({page,request})=>{
 test.skip(process.env.SKIP_LIVE_AI==='1','CI tests deterministic workflows; live inference is evaluated separately.');
 await page.goto('/');
 await page.getByRole('button',{name:'Let’s step outside'}).click();
 await page.getByRole('button',{name:'I’m back',exact:true}).click();
 await page.getByLabel('Your observation').fill('The east entrance has no steps and the gate is open. The path is clear, but there is no shade.');
 await page.getByRole('button',{name:'Make it useful'}).click();
 await expect(page.getByRole('heading',{name:'Does this look right?'})).toBeVisible({timeout:80000});
 await expect(page.locator('.ai-tag')).toContainText('Live local AI');
 await expect(page.getByLabel('Step-free access')).toHaveValue('yes');
 await expect(page.getByRole('combobox',{name:'Shade',exact:true})).toHaveValue('no');
 await page.getByLabel('I checked this against my observation.').check();
 const save=page.waitForResponse(r=>r.url().endsWith('/api/reports')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Confirm observation'}).click();
 await expect(page.getByRole('heading',{name:'You left more than footsteps.'})).toBeVisible();
 expect((await save).status()).toBe(201);
 await page.getByRole('link',{name:'See your little impact'}).click();
 await expect(page.locator('.impact-stat').first().locator('strong')).toHaveText('1');
 await page.reload();
 await expect(page.locator('.observation')).toHaveCount(1);
 const backup=await request.get('/api/reports');
 expect((await backup.json()).reports.some(r=>r.note.includes('east entrance'))).toBeTruthy();
});

test('recorded example works with no backend and is excluded from real contribution totals',async({page})=>{
 await page.route('**/api/**',route=>route.fulfill({status:404,body:'not available'}));
 await page.goto('/');
 await page.getByRole('button',{name:'Let’s step outside'}).click();
 await page.getByRole('button',{name:'I’m back',exact:true}).click();
 await page.getByRole('button',{name:'Try an example'}).click();
 await page.getByRole('button',{name:'Make it useful'}).click();
 await expect(page.locator('.ai-tag')).toHaveText('Recorded AI example');
 await page.getByLabel('I checked this against my observation.').check();
 await page.getByRole('button',{name:'Confirm observation'}).click();
 await expect(page.getByText('Example contribution · not a real field observation.')).toBeVisible();
 await page.getByRole('link',{name:'See your little impact'}).click();
 await expect(page.locator('.impact-stat').first().locator('strong')).toHaveText('0');
});

test('manual contribution accepts uncertainty and exports real data',async({page})=>{
 await page.goto('/#impact');
 await page.getByRole('button',{name:'Add an observation',exact:true}).click();
 await page.locator('[data-add-place="water"]').click();
 await page.getByLabel('Your observation').fill('I could not tell if the tap works.');
 await page.getByRole('button',{name:'Or structure it yourself'}).click();
 await expect(page.getByLabel('What you found')).toHaveValue('uncertain');
 await page.getByLabel('I checked this against my observation.').check();
 await page.getByRole('button',{name:'Confirm observation'}).click();
 await page.getByRole('link',{name:'See your little impact'}).click();
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export your contribution'}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('outside15-observations.json');
 const exported=JSON.parse(await readFile(await download.path(),'utf8'));
 expect(exported.reports.some(r=>r.note==='I could not tell if the tap works.'&&r.status==='uncertain')).toBeTruthy();
});

test('a recent blocked footpath changes the 30-minute suggestion',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>localStorage.setItem('outside15-reports',JSON.stringify([{id:'route-test',place_id:'footpath',amenity:'footpath',status:'unusable',source:'manual',summary:'Footpath blocked.',confirmed:true,created_at:new Date().toISOString()}])));
 await page.reload();
 await page.getByRole('button',{name:'30 min',exact:true}).click();
 await expect(page.getByRole('heading',{name:'The park-side pause & wander'})).toBeVisible();
 await expect(page.locator('.route-warning')).toContainText('market footpath reported blocked');
});

test('real personal spot handles text safely and labels records with the spot',async({page})=>{
 await page.goto('/');
 await page.locator('.location-select').click();
 await page.getByLabel('An outdoor place you know').fill('My <garden> & park');
 await page.getByLabel('Neighbourhood (optional)').fill('My neighbourhood');
 await page.getByRole('button',{name:'Use my outdoor spot'}).click();
 await expect(page.locator('.own-spot-art h2')).toHaveText('My <garden> & park');
 await expect(page.locator('.outing-card h2')).toContainText('My <garden> & park');
 await page.getByRole('button',{name:'Let’s step outside'}).click();
 await page.getByRole('button',{name:'I’m back',exact:true}).click();
 await expect(page.locator('.report-top')).toContainText('My <garden> & park');
 await page.getByLabel('Your observation').fill('The gate is open.');
 await page.getByRole('button',{name:'Or structure it yourself'}).click();
 await page.getByLabel('I checked this against my observation.').check();
 await page.getByRole('button',{name:'Confirm observation'}).click();
 await page.getByRole('link',{name:'See your little impact'}).click();
 await expect(page.locator('.observation h3')).toContainText('My <garden> & park');
});

test('mobile layout, dialog keyboard focus, and no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'How it works'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('link',{name:'Neighbourhood',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('server rejects cross-origin writes and unconfirmed reports',async({request})=>{
 const cross=await request.post('/api/reports',{headers:{Origin:'https://untrusted.example'},data:{confirmed:true}});
 expect(cross.status()).toBe(403);
 const unconfirmed=await request.post('/api/reports',{data:{confirmed:false}});
 expect(unconfirmed.status()).toBe(400);
});
