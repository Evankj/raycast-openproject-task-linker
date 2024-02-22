import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  openProjectUrl: string;
  apiKey: string;
}

export function getPreferences(): Preferences {
  return getPreferenceValues<Preferences>();
}
