export interface PedalSetting {
    name: string;
    type: string;
    settings: Record<string, string | number>;
}