export class EventGuard {
  private approved = false;

  isApproved(): boolean {
    return this.approved;
  }

  async runApproved(submit: () => Promise<void>): Promise<void> {
    this.approved = true;
    try {
      await submit();
    } finally {
      this.approved = false;
    }
  }
}
