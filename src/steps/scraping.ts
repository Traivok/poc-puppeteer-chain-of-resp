import type { WithWorkingPage } from "./types";
import { Step } from "../pipeline";

export interface Quote {
    text: string;
    author: string;
    tags: string[];
}

export class ExtractQuotesStep<T extends WithWorkingPage> extends Step<T, T & { data: Quote[] }> {
    name = "ExtractQuotesStep";

    async run(input: T): Promise<T & { data: Quote[] }> {
        // Wait for quotes to be available on the page
        await input.page.waitForSelector('.quote', { timeout: 10000 });
        
        // Use $$eval for more efficient data extraction
        const quotes = await input.page.$$eval('.quote', (quoteElements) => {
            const results: Array<{text: string, author: string, tags: string[]}> = [];
            
            quoteElements.forEach((quote) => {
                const textElement = quote.querySelector('.text');
                const authorElement = quote.querySelector('.author');
                const tagElements = quote.querySelectorAll('.tag');
                
                if (textElement && authorElement) {
                    results.push({
                        text: textElement.textContent?.trim() || '',
                        author: authorElement.textContent?.trim() || '',
                        tags: Array.from(tagElements).map((tag: any) => tag.textContent?.trim() || '')
                    });
                }
            });
            
            return results;
        });
        
        return {
            ...input,
            data: quotes
        };
    }
}
