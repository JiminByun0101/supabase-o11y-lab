import '@supabase/supabase-js/tracing';
import {
  WebTracerProvider,
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';

const provider = new WebTracerProvider({
  // Print each finished trace to the browser console.
  spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
});

provider.register({ contextManager: new ZoneContextManager() });
