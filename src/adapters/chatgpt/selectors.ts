export const composerSelectors = [
  '[role="textbox"][contenteditable="true"]',
  '[contenteditable="true"]',
  "textarea",
  '[aria-label*="prompt" i]',
  '[aria-label*="message" i]',
] as const;

export const sendButtonSelectors = [
  '[data-testid="send-button"]',
  'button[aria-label*="send" i]',
  'button[type="submit"]',
] as const;

export function findFirstElement(
  root: ParentNode,
  selectors: readonly string[],
): HTMLElement | null {
  for (const selector of selectors) {
    const element = root.querySelector<HTMLElement>(selector);
    if (element !== null) {
      return element;
    }
  }

  return null;
}
