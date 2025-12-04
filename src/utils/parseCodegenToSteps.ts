export function parseCodegenToSteps(script: string, lang: "python" | "javascript" = "javascript"): any[] {
  const lines = script.split(/\r?\n/);
  const steps: any[] = [];
  const push = (s: any) => steps.push(s);
  const re = {
    js: {
      goto: /await\s+page\.goto\((['"])(.+?)\1\)/,
      click: /await\s+page\.click\((['"])(.+?)\1\)/,
      fill: /await\s+page\.fill\((['"])(.+?)\1\s*,\s*(['"])(.+?)\3\)/,
      waitForSelector: /await\s+page\.waitForSelector\((['"])(.+?)\1\)/,
      textContent: /await\s+page\.textContent\((['"])(.+?)\1\)/,
      hover: /await\s+page\.hover\((['"])(.+?)\1\)/,
      press: /await\s+page\.press\((['"])(.+?)\1\s*,\s*(['"])(.+?)\3\)/,
      locatorClick: /await\s+page\.locator\((['"])(.+?)\1\)\.click\(\)/,
      getByRoleClick: /await\s+page\.getByRole\((['"])(.+?)\1,\s*\{\s*name:\s*(['"])(.+?)\3[^}]*\}\)\.click\(\)/,
      getByTextClick: /await\s+page\.getByText\((['"])(.+?)\1\)\.click\(\)/,
    },
    py: {
      goto: /page\.goto\((['"])(.+?)\1\)/,
      click: /page\.click\((['"])(.+?)\1\)/,
      fill: /page\.fill\((['"])(.+?)\1\s*,\s*(['"])(.+?)\3\)/,
      waitForSelector: /page\.wait_for_selector\((['"])(.+?)\1\)/,
      textContent: /page\.text_content\((['"])(.+?)\1\)/,
      hover: /page\.hover\((['"])(.+?)\1\)/,
      press: /page\.press\((['"])(.+?)\1\s*,\s*(['"])(.+?)\3\)/,
      locatorClick: /page\.locator\((['"])(.+?)\1\)\.click\(\)/,
      getByRoleClick: /page\.get_by_role\((['"])(.+?)\1,\s*name=(['"])(.+?)\3[^)]*\)\.click\(\)/,
      getByTextClick: /page\.get_by_text\((['"])(.+?)\1\)\.click\(\)/,
    },
  };
  const R = lang === "python" ? re.py : re.js;
  for (const line of lines) {
    let m;
    if ((m = R.goto.exec(line))) { push({ action: "goto", url: m[2] }); continue; }
    if ((m = R.waitForSelector.exec(line))) { push({ action: "wait_for_selector", selector: m[2] }); continue; }
    if ((m = R.click.exec(line))) { push({ action: "click", selector: m[2] }); continue; }
    if ((m = R.fill.exec(line))) { push({ action: "fill", selector: m[2], value: m[4] }); continue; }
    if ((m = R.textContent.exec(line))) { push({ action: "evaluate_text", selector: m[2] }); continue; }
    if ((m = R.hover.exec(line))) { push({ action: "wait_for_selector", selector: m[2] }); push({ action: "hover", selector: m[2] }); continue; }
    if ((m = R.press.exec(line))) { push({ action: "press", selector: m[2], value: m[4] }); continue; }
    if ((m = R.locatorClick.exec(line))) { push({ action: "click", selector: m[2] }); continue; }
    if ((m = R.getByRoleClick.exec(line))) { const role = m[2]; const name = m[4]; push({ action: "by_role_click", role, name }); continue; }
    if ((m = R.getByTextClick.exec(line))) { const text = m[2]; push({ action: "by_text_click", text }); continue; }
  }
  return steps;
}
