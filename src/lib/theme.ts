import { appConfig } from "./config";

/**
 * Convert hex color to OKLCh CSS string.
 * Hex → sRGB → Linear RGB → OKLab → OKLCh
 */
function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // sRGB to linear
  const toLinear = (v: number) =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  // Linear RGB to OKLab
  const l_ = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  );
  const m_ = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  );
  const s_ = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  );

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  // OKLab to OKLCh
  const C = Math.sqrt(a * a + bLab * bLab);
  let H = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return {
    l: Math.round(L * 1000) / 1000,
    c: Math.round(C * 1000) / 1000,
    h: Math.round(H * 1000) / 1000,
  };
}

function oklchString(l: number, c: number, h: number): string {
  return `oklch(${l} ${c} ${h})`;
}

function getForeground(lightness: number): string {
  return lightness > 0.7 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)";
}

export function getThemeCssVars(): { light: string; dark: string } {
  const primary = hexToOklch(appConfig.theme.primaryColor);
  const secondary = appConfig.theme.secondaryColor
    ? hexToOklch(appConfig.theme.secondaryColor)
    : null;

  // Dark mode: bump lightness
  const darkPrimaryL = Math.min(0.85, primary.l + 0.25);
  const darkSecondaryL = secondary ? Math.min(0.85, secondary.l + 0.25) : null;

  const lp = oklchString(primary.l, primary.c, primary.h);
  const lpFg = getForeground(primary.l);
  const dp = oklchString(darkPrimaryL, primary.c, primary.h);
  const dpFg = getForeground(darkPrimaryL);

  const ls = secondary
    ? oklchString(secondary.l, secondary.c, secondary.h)
    : "oklch(0.97 0 0)";
  const lsFg = secondary ? getForeground(secondary.l) : "oklch(0.205 0 0)";
  const ds =
    secondary && darkSecondaryL !== null
      ? oklchString(darkSecondaryL, secondary.c, secondary.h)
      : "oklch(0.269 0 0)";
  const dsFg =
    secondary && darkSecondaryL !== null
      ? getForeground(darkSecondaryL)
      : "oklch(0.985 0 0)";

  const light = [
    `--primary: ${lp}`,
    `--primary-foreground: ${lpFg}`,
    `--secondary: ${ls}`,
    `--secondary-foreground: ${lsFg}`,
    `--ring: ${lp}`,
    `--sidebar-primary: ${lp}`,
    `--sidebar-primary-foreground: ${lpFg}`,
  ].join("; ");

  const dark = [
    `--primary: ${dp}`,
    `--primary-foreground: ${dpFg}`,
    `--secondary: ${ds}`,
    `--secondary-foreground: ${dsFg}`,
    `--ring: ${dp}`,
    `--sidebar-primary: ${dp}`,
    `--sidebar-primary-foreground: ${dpFg}`,
  ].join("; ");

  return { light, dark };
}
