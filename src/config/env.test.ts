import { parsePublicEnvironment } from './env';

describe('public environment', () => {
  it('accepts a known build channel', () => {
    expect(parsePublicEnvironment('preview', 'hakeemi-portfolio-dev', 'false')).toEqual({
      appEnvironment: 'preview',
      firebaseProjectId: 'hakeemi-portfolio-dev',
      useFirebaseEmulators: false,
    });
  });

  it('rejects an unknown build channel', () => {
    expect(() => parsePublicEnvironment('staging', 'hakeemi-portfolio-dev', 'true')).toThrow(
      'Invalid public environment configuration',
    );
  });

  it('rejects malformed Firebase configuration', () => {
    expect(() => parsePublicEnvironment('development', 'Hakeemi Dev', 'yes')).toThrow(
      'Invalid public environment configuration',
    );
  });
});
