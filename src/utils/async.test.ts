import { createSerialQueue, withTimeout } from './async';

describe('createSerialQueue', () => {
  it('runs queued operations strictly in FIFO order', async () => {
    const enqueue = createSerialQueue();
    const events: string[] = [];
    let releaseFirst: () => void = () => undefined;

    const first = enqueue(async () => {
      events.push('first:start');
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      events.push('first:end');
      return 'one';
    });
    const second = enqueue(async () => {
      events.push('second:start');
      return 'two';
    });

    await Promise.resolve();
    expect(events).toEqual(['first:start']);

    releaseFirst();
    await expect(Promise.all([first, second])).resolves.toEqual(['one', 'two']);
    expect(events).toEqual(['first:start', 'first:end', 'second:start']);
  });

  it('continues running queued tasks after a failure', async () => {
    const enqueue = createSerialQueue();

    const failed = enqueue(async () => {
      throw new Error('boom');
    });
    const next = enqueue(async () => 'recovered');

    await expect(failed).rejects.toThrow('boom');
    await expect(next).resolves.toBe('recovered');
  });
});

describe('withTimeout', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves when the promise settles before the timeout', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1_000)).resolves.toBe('ok');
  });

  it('rejects with the given message when the timeout expires', async () => {
    jest.useFakeTimers();
    const never = new Promise<string>(() => undefined);
    const pending = withTimeout(never, 250, 'Timed out waiting.');

    jest.advanceTimersByTime(250);
    await expect(pending).rejects.toThrow('Timed out waiting.');
  });
});
