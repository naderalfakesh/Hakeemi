import { spawn } from 'node:child_process';

const firebaseCommand = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';
const firebaseArguments = [
  'emulators:start',
  '--project',
  'hakeemi-portfolio-dev',
  '--import',
  '.firebase/emulator-data',
  '--export-on-exit',
  '.firebase/emulator-data',
];

let recentOutput = '';
let seedProcess = null;
let seedStarted = false;
let shuttingDown = false;

const emulatorProcess = spawn(firebaseCommand, firebaseArguments, {
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
});

function relayOutput(destination, chunk) {
  destination.write(chunk);
  recentOutput = `${recentOutput}${chunk.toString()}`.slice(-4_000);

  if (!seedStarted && recentOutput.includes('All emulators ready')) {
    seedStarted = true;
    seedProcess = spawn(
      process.execPath,
      ['functions/lib/seed/run-seed.js', '--project', 'hakeemi-portfolio-dev', '--emulator'],
      {
        env: process.env,
        stdio: 'inherit',
      },
    );

    seedProcess.once('exit', (code, signal) => {
      seedProcess = null;

      if (code === 0) {
        process.stdout.write(
          '\nCurrent rolling provider availability is ready for the native app.\n\n',
        );
        return;
      }

      process.stderr.write(
        `\nFailed to refresh emulator availability${signal ? ` (${signal})` : ''}.\n`,
      );
      process.exitCode = code ?? 1;
      emulatorProcess.kill('SIGINT');
    });
  }
}

emulatorProcess.stdout.on('data', (chunk) => relayOutput(process.stdout, chunk));
emulatorProcess.stderr.on('data', (chunk) => relayOutput(process.stderr, chunk));

emulatorProcess.once('error', (error) => {
  process.stderr.write(`Unable to start the Firebase Emulator Suite: ${error.message}\n`);
  process.exitCode = 1;
});

emulatorProcess.once('exit', (code, signal) => {
  if (!shuttingDown && code !== 0) {
    process.stderr.write(
      `Firebase Emulator Suite stopped${signal ? ` (${signal})` : ` with exit code ${code}`}.\n`,
    );
  }

  process.exitCode ??= code ?? (signal ? 0 : 1);
});

function stop(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  seedProcess?.kill(signal);
  emulatorProcess.kill(signal);
}

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
