import { SettingsRepository } from "../src/storage/SettingsRepository";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    const repository = new SettingsRepository(browser.storage.local);
    void repository.get().then((settings) => repository.save(settings));
  });
});
