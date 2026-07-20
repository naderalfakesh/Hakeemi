import { I18nManager, Platform } from 'react-native';

import { resetLayoutDirectionSyncForTests, syncNativeLayoutDirection } from './layout-direction';

describe('syncNativeLayoutDirection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetLayoutDirectionSyncForTests();
  });

  it('does nothing on web', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});

    expect(syncNativeLayoutDirection('ar')).toBe(false);
    expect(forceRTL).not.toHaveBeenCalled();
  });

  it('keeps the current direction when it already matches the locale', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest.replaceProperty(I18nManager, 'isRTL', false);
    jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});

    expect(syncNativeLayoutDirection('en')).toBe(false);
    expect(forceRTL).not.toHaveBeenCalled();
  });

  it('forces RTL and reports a pending restart when Arabic is selected', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest.replaceProperty(I18nManager, 'isRTL', false);
    const allowRTL = jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});

    expect(syncNativeLayoutDirection('ar')).toBe(true);
    expect(allowRTL).toHaveBeenCalledWith(true);
    expect(forceRTL).toHaveBeenCalledWith(true);
  });

  it('undoes a pending direction change when the locale flips back before a restart', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest.replaceProperty(I18nManager, 'isRTL', false);
    jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});

    expect(syncNativeLayoutDirection('ar')).toBe(true);
    expect(syncNativeLayoutDirection('en')).toBe(false);
    expect(forceRTL).toHaveBeenNthCalledWith(1, true);
    expect(forceRTL).toHaveBeenNthCalledWith(2, false);
  });

  it('restores LTR when English is selected on an RTL layout', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.replaceProperty(I18nManager, 'isRTL', true);
    jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});

    expect(syncNativeLayoutDirection('en')).toBe(true);
    expect(forceRTL).toHaveBeenCalledWith(false);
  });
});
