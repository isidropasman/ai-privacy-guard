import { DomProviderAdapter } from "../shared/DomProviderAdapter";
import { composerSelectors, sendButtonSelectors } from "../shared/selectors";

const hostnames = new Set(["claude.ai"]);

export class ClaudeAdapter extends DomProviderAdapter {
  constructor(document: Document) {
    super(document, {
      id: "claude",
      hostnames,
      composerSelectors,
      sendButtonSelectors,
    });
  }
}
