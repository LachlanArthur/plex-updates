import type { Plex } from 'types/plex-api';
import { GenericApi } from './generic-api';

export class PlexApi extends GenericApi {

	constructor( public host: string, public token: string ) {
		super();
	}

	filterRequestOptions( options: RequestInit, method: string, endpoint: string ) {
		return {
			...options,
			headers: {
				...options.headers,
				'X-Plex-Token': this.token,
				'Accept': 'application/json',
			},
		};
	}

	async getServers( options: RequestInit = {} ): Promise<Plex.ServerMediaContainer> {
		return ( await this.get( '/servers', {}, options ) ).MediaContainer;
	}

	async getLibrarySections( options: RequestInit = {} ): Promise<Plex.DirectoryMediaContainer> {
		return ( await this.get( '/library/sections', {}, options ) ).MediaContainer;
	}

	async getRecentlyAdded( sectionKey: string, options: RequestInit = {} ): Promise<Plex.MetadataMediaContainer> {
		return ( await this.get( `/library/sections/${sectionKey}/recentlyAdded`, {}, options ) ).MediaContainer;
	}

}
