import { parsePublicEnvironment } from './env';

describe('public environment', () => {
  it('accepts a known build channel', () => {
    expect(parsePublicEnvironment('preview').appEnvironment).toBe('preview');
  });

  it('rejects an unknown build channel', () => {
    expect(() => parsePublicEnvironment('staging')).toThrow(
      'Invalid public environment configuration',
    );
  });
});
