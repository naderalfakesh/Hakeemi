import { getContrastRatio } from './contrast';
import { darkTheme, lightTheme } from './themes';

describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
] as const)('%s theme contrast', (_name, theme) => {
  it('keeps primary and secondary text readable on the canvas', () => {
    expect(getContrastRatio(theme.colors.textPrimary, theme.colors.canvas)).toBeGreaterThanOrEqual(
      7,
    );
    expect(
      getContrastRatio(theme.colors.textSecondary, theme.colors.canvas),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps inverse text readable on the brand color', () => {
    expect(getContrastRatio(theme.colors.textInverse, theme.colors.brand)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});
