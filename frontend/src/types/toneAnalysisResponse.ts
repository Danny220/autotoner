import type {AmpSettings} from "./ampSettings.ts";
import type {PedalSetting} from "./pedalSetting.ts";

export interface ToneAnalysisResponse {
    detected_genre: string;
    tone_character: string;
    amp: AmpSettings;
    pedals: PedalSetting[];
    tips: string[];
}