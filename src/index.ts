import 'alpinejs';
import '@github/time-elements';
import { PlexUpdates } from './plex-updates';

declare global {
	interface Window {
		PlexUpdates: typeof PlexUpdates,
	}
}

window.PlexUpdates = PlexUpdates;
