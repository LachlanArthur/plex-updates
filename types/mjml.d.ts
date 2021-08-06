import type { MJMLJsonObject, MJMLParsingOptions, MJMLParseResults } from 'mjml-core';

declare global {
	interface Window {
		mjml2html( input: string | MJMLJsonObject, options?: MJMLParsingOptions ): MJMLParseResults;
	}
}
