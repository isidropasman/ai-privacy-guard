import { DomProviderAdapter } from "../shared/DomProviderAdapter";
import { composerSelectors, sendButtonSelectors } from "../shared/selectors";

const hostnames = new Set(["gemini.google.com"]);

export class GeminiAdapter extends DomProviderAdapter {
  constructor(document: Document) {
    super(document, {
      id: "gemini",
      hostnames,
      composerSelectors,
      sendButtonSelectors,
    });
  }
}
