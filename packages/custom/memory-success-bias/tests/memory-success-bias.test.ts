/**
 * @file memory-success-bias tests
 * @description Locks the dimension: option resolution, episodic filtering,
 * semantic pass-through, and the descriptor shape.
 */

import { describe, expect, it } from "vitest";
import type { MemoryRecallResult } from "@agentprism/contracts";
import { memorySuccessBiasDimension, successFilterFor } from "../src/index.js";

function episodic(id: string, success: boolean): MemoryRecallResult["episodic"][number] {
  return {
    id,
    task: `task ${id}`,
    framework: "native",
    model: "test-model",
    success,
    keyActions: [],
    lessons: "",
    timestamp: 0,
    workspaceTag: "",
  };
}

function recall(): MemoryRecallResult {
  return {
    episodic: [episodic("e-ok-1", true), episodic("e-bad-1", false), episodic("e-ok-2", true)],
    semantic: [
      {
        id: "s1",
        subject: "subject",
        predicate: "is",
        object: "x",
        confidence: 1,
        validFrom: 0,
        source: "test",
      },
    ],
  };
}

function invoke(value: string, input: MemoryRecallResult | undefined) {
  const hook = memorySuccessBiasDimension.hooks?.memory;
  if (hook === undefined) throw new Error("memory-success-bias must expose a memory hook");
  return hook(
    { recall: input, limits: { episodic: 3, semantic: 5 }, context: { question: "", custom: {} } },
    value,
  );
}

describe("successFilterFor", () => {
  it("maps the three choices and treats anything else as no shaping", () => {
    expect(successFilterFor("success")).toBe(true);
    expect(successFilterFor("failure")).toBe(false);
    expect(successFilterFor("both")).toBeNull();
    expect(successFilterFor("unknown")).toBeNull();
  });
});

describe("memorySuccessBiasDimension", () => {
  it("declares the axis, options, default, and prompt hint", () => {
    expect(memorySuccessBiasDimension.id).toBe("memory_success_bias");
    expect(memorySuccessBiasDimension.options.map((option) => option.value)).toEqual(["both", "success", "failure"]);
    expect(memorySuccessBiasDimension.default).toBe("both");
    expect(memorySuccessBiasDimension.promptHint).toContain("{value}");
  });

  it("does not shape the both choice", () => {
    expect(invoke("both", recall())).toBeUndefined();
  });

  it("keeps only successful episodic experiences", () => {
    const shaped = invoke("success", recall());
    expect(shaped?.recall?.episodic.map((entry) => entry.id)).toEqual(["e-ok-1", "e-ok-2"]);
    expect(shaped?.recall?.semantic).toHaveLength(1);
  });

  it("keeps only failed episodic experiences", () => {
    const shaped = invoke("failure", recall());
    expect(shaped?.recall?.episodic.map((entry) => entry.id)).toEqual(["e-bad-1"]);
  });

  it("leaves the semantic layer untouched", () => {
    const input = recall();
    const shaped = invoke("failure", input);
    expect(shaped?.recall?.semantic).toEqual(input.semantic);
  });

  it("returns an empty episodic layer when nothing matches", () => {
    const shaped = invoke("failure", { episodic: [episodic("e-ok", true)], semantic: [] });
    expect(shaped?.recall?.episodic).toEqual([]);
  });

  it("does not invent a recall when none was provided", () => {
    expect(invoke("success", undefined)).toBeUndefined();
  });

  it("treats an unknown value as no shaping", () => {
    expect(invoke("unexpected", recall())).toBeUndefined();
  });
});
