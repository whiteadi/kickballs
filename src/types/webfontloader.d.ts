declare module 'webfontloader' {
  interface WebFontConfig {
    google?: {
      families: string[];
    };
    custom?: {
      families: string[];
      urls?: string[];
    };
    active?: () => void;
    inactive?: () => void;
    loading?: () => void;
    fontloading?: (familyName: string, fvd: string) => void;
    fontactive?: (familyName: string, fvd: string) => void;
    fontinactive?: (familyName: string, fvd: string) => void;
  }

  interface WebFont {
    load(config: WebFontConfig): void;
  }

  const WebFont: WebFont;
  export default WebFont;
}