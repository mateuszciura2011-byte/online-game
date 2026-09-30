import {expect,test} from '@playwright/test';

test('map and settings choices have readable dark surfaces and keep selection working',async({page})=>{
  await page.goto('/');
  const checkChoices=async()=>{
    const choices=await page.locator('select:visible option').evaluateAll(options=>options.map(option=>{
      const style=getComputedStyle(option);return {background:style.backgroundColor,color:style.color};
    }));
    expect(choices.length).toBeGreaterThan(0);
    for(const choice of choices){
      // A transparent option falls back to the white native popup seen in the report.
      expect(choice.background).not.toBe('rgba(0, 0, 0, 0)');
      const rgb=choice.background.match(/\d+/g)!.map(Number);
      expect(Math.max(...rgb.slice(0,3))).toBeLessThan(100);
      const text=choice.color.match(/\d+/g)!.map(Number);
      expect(Math.min(...text.slice(0,3))).toBeGreaterThan(150);
    }
  };
  await checkChoices();
  const map=page.locator('#training-map');
  const value=await map.locator('option').last().getAttribute('value');
  await map.selectOption(value!);await expect(map).toHaveValue(value!);
  await map.click();await page.screenshot({path:'test-results/map-dropdown-theme.png'});await page.keyboard.press('Escape');
  await page.locator('[data-page="settings"]').click();await checkChoices();
});
