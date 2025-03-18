export interface Config {
    RELEASE_DATE: Date;
    CONTRACT_ADDRESS: string;
    DISPLAY: {
        DATE_SHORT: string;
        DATE_FULL: string;
        TIME: string;
    };
}
export declare const DEFAULT_CONFIG: Config;
export declare function getEnvVar(name: string, defaultValue?: string): string;
export declare function createConfig(overrides?: Partial<Config>): Config;
