import type { CapacitorConfig } from '@capacitor/cli';

// Android application IDs cannot start a segment with a digit, so the
// reverse-domain uses kelime21; the brand stays 21kelime everywhere else.
const config: CapacitorConfig = {
	appId: 'com.kelime21.app',
	appName: '21kelime',
	webDir: 'build-mobile'
};

export default config;
