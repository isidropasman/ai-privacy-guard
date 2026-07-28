import { DomProviderAdapter } from "../shared/DomProviderAdapter";
import { composerSelectors, sendButtonSelectors } from "./selectors";

const hostnames = new Set(["chatgpt.com", "chat.openai.com"]);

export class ChatGPTAdapter extends DomProviderAdapter {
  constructor(document: Document) {
    super(document, {
      id: "chatgpt",
      hostnames,
      composerSelectors,
      sendButtonSelectors,
    });
  }
}
