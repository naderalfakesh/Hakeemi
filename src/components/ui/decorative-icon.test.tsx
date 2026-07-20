import { render } from '@testing-library/react-native';
import { I18nManager } from 'react-native';

import { DecorativeIcon } from './decorative-icon';

const iconSet = (
  <>
    <DecorativeIcon name="arrow-back" size={20} />
    <DecorativeIcon name="arrow-forward" size={20} />
    <DecorativeIcon name="chevron-back" size={20} />
    <DecorativeIcon name="chevron-forward" size={20} />
    <DecorativeIcon name="calendar-outline" size={20} />
  </>
);

function readGlyphs(tree: ReturnType<Awaited<ReturnType<typeof render>>['toJSON']>) {
  const nodes = Array.isArray(tree) ? tree : (tree?.children ?? []);

  return nodes.map((node) => {
    const glyph = typeof node === 'object' ? node.children?.[0] : null;

    if (typeof glyph !== 'string') {
      throw new Error('Expected a text glyph child');
    }

    return glyph;
  });
}

describe('DecorativeIcon', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mirrors directional icons in RTL layouts and leaves the rest unchanged', async () => {
    jest.replaceProperty(I18nManager, 'isRTL', false);
    const ltrView = await render(iconSet);
    const [backLtr, forwardLtr, chevronBackLtr, chevronForwardLtr, calendarLtr] = readGlyphs(
      ltrView.toJSON(),
    );
    await ltrView.unmount();

    jest.replaceProperty(I18nManager, 'isRTL', true);
    const rtlView = await render(iconSet);
    const [backRtl, forwardRtl, chevronBackRtl, chevronForwardRtl, calendarRtl] = readGlyphs(
      rtlView.toJSON(),
    );

    expect(backRtl).toBe(forwardLtr);
    expect(forwardRtl).toBe(backLtr);
    expect(chevronBackRtl).toBe(chevronForwardLtr);
    expect(chevronForwardRtl).toBe(chevronBackLtr);
    expect(calendarRtl).toBe(calendarLtr);
    expect(backRtl).not.toBe(backLtr);
  });
});
