import puppeteer, { type LaunchOptions } from "puppeteer";
import { Step } from "../pipeline";
import type { WithBrowser, WithWorkingPage } from "./types";

export class OpenBrowserStep extends Step<never, WithBrowser> {
    name = "OpenBrowserStep";

    constructor(private options?: LaunchOptions) {
        super();
    }

    async run(): Promise<WithBrowser> {
        const browser = await puppeteer.launch({
            headless: false,
            ...this.options,
        });
        return { browser } as WithBrowser;
    }
}

export class CloseBrowserStep<TIn extends WithBrowser> extends Step<TIn, void> {
    name = "CloseBrowserStep";

    async run(data: TIn): Promise<void> {
        await data.browser.close();
    }
}

export class FinishExecutionStep<T, TIn extends WithBrowser & { data: T } = WithBrowser & { data: T }> extends Step<TIn, T> {
    name = "FinishExecutionStep";

    async run(input: TIn): Promise<T> {
        await input.browser.close();
        return input.data;
    }
}

export class OpenPageStep<TIn extends WithBrowser, Tout extends WithWorkingPage> extends Step<TIn, Tout> {
    name = "OpenPageStep";

    async run(data: TIn): Promise<Tout> {
        const page = await data.browser.newPage();
        return { browser: data.browser, page } as Tout;
    }
}

export class NavigateToStep<T extends WithWorkingPage = WithWorkingPage> extends Step<T, T> {
    name = "NavigateToStep";

    constructor(
        private url: string,
        private waitUntil:
            | "load"
            | "domcontentloaded"
            | "networkidle0"
            | "networkidle2" = "networkidle2"
    ) {
        super();
    }

    async run(data: T): Promise<T> {
        await data.page.goto(this.url, { waitUntil: this.waitUntil });
        return data;
    }
}

/**
 * Injects a context object into the input data.
 * @description if there is collision between the input data and the context, the context will override the input data.
 */
export class InjectContextStep<TInput, TContext> extends Step<TInput, TInput & TContext> {
    name = "InjectContextStep";

    constructor(private context: TContext) {
        super();
    }

    async run(data: TInput): Promise<TInput & TContext> {
        return Object.assign({}, data, this.context) as TInput & TContext;
    }
}
