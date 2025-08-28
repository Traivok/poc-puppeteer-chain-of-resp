import { Pipeline } from "./pipeline";
import { 
    OpenBrowserStep, 
    OpenPageStep, 
    NavigateToStep, 
    FinishExecutionStep, 
    InjectContextStep,
    ExtractQuotesStep,
    type WithWorkingPage,
    type Quote 
} from "./steps";

async function main() {
    const pipeline = new Pipeline()
        .addStep(new OpenBrowserStep())
        .addStep(new OpenPageStep())
        .addStep(new InjectContextStep<WithWorkingPage, { system: string }>({ system: "Quotes" }))
        .addStep(new NavigateToStep("https://quotes.toscrape.com/"))
        .addStep(new ExtractQuotesStep())
        .addGuard((output: { data: Quote[] }) => {
            console.log(`Guard: Found ${output.data.length} quotes`);
            // Only proceed if we found more than 5 quotes
            return output.data.length > 5;
        })
        .addStep(new FinishExecutionStep<Quote[]>());

    const result = await pipeline.run();
    console.log("Pipeline result:", result);
}

main().catch(console.error);
