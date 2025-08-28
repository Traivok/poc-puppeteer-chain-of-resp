// Step contract
export abstract class Step<I, O> {
  name?: string;
  abstract run(input: I): Promise<O> | O;
}

type Guard<T> = (input: T) => boolean | Promise<boolean>;

interface StepEntry<I, O> {
  step: Step<I, O>;
  guard?: Guard<I>;
}

export interface PipelineHooks {
  onStart?: (data?: unknown) => void | Promise<void>;
  onFinish?: (data?: unknown) => void | Promise<void>;
  onBeforeStep?: (data: { stepName?: string; data?: unknown }) => void | Promise<void>;
  onAfterStepSuccess?: (data: { stepName?: string; data?: unknown }) => void | Promise<void>;
  onFail?: (data: { stepName?: string; data?: unknown; error?: unknown }) => void | Promise<void>;
}

export interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

// Default logger using console
const defaultLogger: Logger = console;

export class Pipeline<I, O = I> {
  private steps: StepEntry<any, any>[] = [];
  private hooks: PipelineHooks = {};
  private logger: Logger;
  private initialArgs?: I;

  constructor(initialArgs?: I, logger: Logger = defaultLogger) {
    this.initialArgs = initialArgs;
    this.logger = logger;
  }

  setHooks(hooks: PipelineHooks): this {
    this.hooks = hooks;
    return this;
  }

  addStep<NextOut>(step: Step<O, NextOut>): Pipeline<I, NextOut> {
    this.steps.push({ step });
    return (this as unknown) as Pipeline<I, NextOut>;
  }

  addGuard(guard: Guard<O>): this {
    if (this.steps.length === 0) {
      throw new Error("No step to attach guard to. Call addStep() before addGuard().");
    }
    const last = this.steps[this.steps.length - 1];
    last.guard = guard as Guard<any>;
    return this;
  }

  async run(input?: I): Promise<O> {
    let data: any = input ?? this.initialArgs;

    // onStart hook (default logs)
    if (this.hooks.onStart) {
      await this.hooks.onStart(data);
    } else {
      this.logger.log("[Pipeline] onStart:", data);
    }

    for (const { step, guard } of this.steps) {
      try {
        // onBeforeStep (default logs)
        if (this.hooks.onBeforeStep) {
          await this.hooks.onBeforeStep({ stepName: step.name, data });
        } else {
          this.logger.log("[Pipeline] Before step:", step.name, data);
        }

        // Guard short-circuit
        if (guard && !(await guard(data))) {
          this.logger.log("[Pipeline] Guard failed, short-circuiting step:", step.name);
          return data as O;
        }

        data = await step.run(data);

        // onAfterStepSuccess (default logs)
        if (this.hooks.onAfterStepSuccess) {
          await this.hooks.onAfterStepSuccess({ stepName: step.name, data });
        } else {
          this.logger.log("[Pipeline] After step success:", step.name, data);
        }
      } catch (error) {
        // onFail (default logs)
        if (this.hooks.onFail) {
          await this.hooks.onFail({ stepName: step.name, data, error });
        } else {
          this.logger.error("[Pipeline] Step failed:", step.name, error);
        }
        throw error; // propagate
      }
    }

    if (this.hooks.onFinish) {
      await this.hooks.onFinish(data);
    } else {
      this.logger.log("[Pipeline] onFinish:", data);
    }

    return data as O;
  }
}
