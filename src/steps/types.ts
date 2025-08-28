import type { Browser, Page } from "puppeteer";

export interface WithBrowser {
    browser: Browser;
}

export interface WithContext<TContext> {
    context: TContext;
}

export interface WithPage {
    page: Page;
}

export type WithWorkingPage = WithPage & WithBrowser;
