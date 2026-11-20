/**
 * @file memory-success-bias
 * @description Custom dimension: which recalled experiences reach the prompt.
 *
 * Responsibilities:
 * - Declare the memory-success-bias dimension and its options
 * - Filter the episodic recall by recorded success/failure (the hook)
 *
 * The shared memory service recalls successful and failed task experiences
 * together. Whether failures teach more than successes is an empirical question
 * per task, so this dimension makes the mix the comparison axis: "both" mounts
 * the recall unchanged, "success" mounts only successes, "failure" only failures.
 *
 * Read-side only: it changes what the prompt sees, never what is stored. The
 * semantic layer carries facts, not outcomes, and is left untouched.
 *
 * Reference implementation for a custom dimension package.
 */

import type { CustomDimension, CustomMemoryInput, MemoryRecallResult } from "@agentprism/contracts";

/** Resolves the option to the `success` value to keep, or null for no shaping. */
export function successFilterFor(value: string): boolean | null {
  if (value === "success") return true;
  if (value === "failure") return false;
  return null;
}

/** Keeps only episodic entries whose recorded outcome matches the filter. */
function filterEpisodic(recall: MemoryRecallResult, wantSuccess: boolean): MemoryRecallResult {
  return {
    ...recall,
    episodic: recall.episodic.filter((entry) => entry.success === wantSuccess),
  };
}

/** The memory-success-bias dimension: mount successes, failures, or both. */
export const memorySuccessBiasDimension: CustomDimension = {
  id: "memory_success_bias",
  label: "Memory success bias",
  subtitle: "Which recalled past experiences enter the prompt: successes, failures, or both",
  options: [
    { value: "both", label: "Both", description: "Mount successes and failures (default)." },
    { value: "success", label: "Successes", description: "Mount only successful experiences." },
    { value: "failure", label: "Failures", description: "Mount only failed experiences." },
  ],
  default: "both",
  promptHint: "\n[Memory: success bias {value}]",
  hooks: {
    memory: (input: CustomMemoryInput, value) => {
      const wantSuccess = successFilterFor(value);
      if (wantSuccess === null) return undefined;
      const recall = input.recall;
      if (recall === undefined) return undefined;
      return { recall: filterEpisodic(recall, wantSuccess) };
    },
  },
};
