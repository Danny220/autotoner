export interface AppSettings {
  ai_model_chain: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  ai_model_chain: ["gemini-3.8-flash", "gemini-3.8-flash-lite"],
};
