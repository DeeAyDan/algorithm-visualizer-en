// @ts-nocheck
import { get } from 'svelte/store';
import {
	algorithmStatus,
	resumeSignal,
	speed,
	activeLine,
	consoleLog,
	currentStep,
	runId
} from './store.svelte.js';

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function log(message: string) {
	consoleLog.update((logs) => [...logs, message]);
	currentStep.update((n) => n + 1);
}

export class RunCancelled extends Error {
	constructor() {
		super('Algorithm run was cancelled');
	}
}

export async function pauseIfNeeded(expectedRunId: number = get(runId)): Promise<void> {
	if (get(runId) !== expectedRunId) throw new RunCancelled();

	if (get(algorithmStatus) === 'paused') {
		await waitUntilResume(expectedRunId);
	}

	if (get(runId) !== expectedRunId) throw new RunCancelled();
}

export function waitUntilResume(expectedRunId: number = get(runId)): Promise<void> {
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			unsubResume();
			unsubRun();
		};

		const unsubResume = resumeSignal.subscribe(() => {
			const status = get(algorithmStatus);
			const current = get(runId);

			if (current !== expectedRunId) {
				cleanup();
				reject(new RunCancelled());
			} else if (status === 'running') {
				cleanup();
				resolve();
			}
		});

		const unsubRun = runId.subscribe((current) => {
			if (current !== expectedRunId) {
				cleanup();
				reject(new RunCancelled());
			}
		});
	});
}