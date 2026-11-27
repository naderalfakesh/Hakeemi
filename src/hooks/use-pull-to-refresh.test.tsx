import { act, renderHook } from '@testing-library/react-native';

import { usePullToRefresh } from './use-pull-to-refresh';

describe('usePullToRefresh', () => {
  it('tracks refreshing state while the callback is in flight and resets afterward', async () => {
    let resolveRefresh: () => void = () => undefined;
    const onRefresh = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const { result } = await renderHook(() => usePullToRefresh(onRefresh));
    expect(result.current.isRefreshing).toBe(false);

    let pending: Promise<void> | undefined;
    await act(async () => {
      pending = result.current.handleRefresh();
    });
    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      resolveRefresh();
      await pending;
    });
    expect(result.current.isRefreshing).toBe(false);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('resets refreshing state even if the callback rejects', async () => {
    const onRefresh = jest.fn().mockRejectedValue(new Error('network error'));
    const { result } = await renderHook(() => usePullToRefresh(onRefresh));

    await expect(
      act(async () => {
        await result.current.handleRefresh();
      }),
    ).rejects.toThrow('network error');

    expect(result.current.isRefreshing).toBe(false);
  });
});
