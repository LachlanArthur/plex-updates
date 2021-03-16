import { AlpineApp } from './alpine';
import { PlexApi } from './plex-api';

import type { Plex } from 'types/plex-api';

export class PlexUpdates extends AlpineApp {

	plexUrl: string = '';
	plexToken: string = '';
	plexApi: PlexApi;

	servers: Plex.Server[] = [];
	librarySections: Plex.Directory[] = [];
	recentlyAdded: Plex.Metadata[] = [];

	selectedLibrarySectionsKeys: string[] = [];
	selectedMediaKeys: string[] = [];

	constructor() {
		super();

		this.plexUrl = localStorage.getItem( 'plexUrl' ) || '';
		this.plexToken = localStorage.getItem( 'plexToken' ) || '';

		this.selectedLibrarySectionsKeys = ( localStorage.getItem( 'selectedLibrarySectionsKeys' ) || '' ).split( ',' ).filter( String );

		this.plexApi = new PlexApi( this.plexUrl, this.plexToken );
	}

	init() {

		this.$watch( 'plexUrl', ( value: string ) => {
			localStorage.setItem( 'plexUrl', value );
			this.plexApi.host = value;
		} );

		this.$watch( 'plexToken', ( value: string ) => {
			localStorage.setItem( 'plexToken', value );
			this.plexApi.token = value;
		} );

		this.$watch( 'selectedLibrarySectionsKeys', value => {
			localStorage.setItem( 'selectedLibrarySectionsKeys', value.join( ',' ) );
		} );

	}

	get server() {
		return this.servers[ 0 ];
	}

	protected updateServers_last?: Symbol;

	async connectToServer() {
		let servers: Plex.Server[];

		const stackKey = Symbol( 'key' );
		this.updateServers_last = stackKey;

		try {
			servers = ( await this.plexApi.getServers() ).Server;
		} catch ( e ) {
			servers = [];
			console.error( e );
		}

		if ( this.updateServers_last === stackKey ) {
			this.servers = servers;
		}
	}

	async onclick_connectToServer() {
		await this.connectToServer();

		if ( this.server ) {
			await this.updateLibrarySections();
		}
	}

	protected updateLibrarySections_last?: Symbol;

	async updateLibrarySections() {
		let librarySections: Plex.Directory[];

		const stackKey = Symbol( 'key' );
		this.updateLibrarySections_last = stackKey;

		try {
			librarySections = ( await this.plexApi.getLibrarySections() ).Directory;
		} catch ( e ) {
			librarySections = [];
			console.error( e );
		}

		if ( this.updateLibrarySections_last === stackKey ) {
			this.librarySections = librarySections;
		}
	}

	protected onclick_getRecentlyAdded_last?: Symbol;

	async onclick_getRecentlyAdded() {
		let recentlyAdded: Plex.Metadata[];

		const stackKey = Symbol( 'key' );
		this.onclick_getRecentlyAdded_last = stackKey;

		try {
			recentlyAdded = ( await Promise.all( this.selectedLibrarySectionsKeys.map( key => this.plexApi.getRecentlyAdded( key ) ) ) )
				.map( MediaContainer => MediaContainer.Metadata )
				.flat()
				.sort( ( a, b ) => b.addedAt - a.addedAt )
				.slice( 0, 50 );
		} catch ( e ) {
			recentlyAdded = [];
			console.error( e );
		}

		if ( this.onclick_getRecentlyAdded_last === stackKey ) {
			this.recentlyAdded = recentlyAdded;
			console.log( this.recentlyAdded );
		}
	}

	getMediaTitle( media: Plex.Metadata ): string {

		let title: string | undefined = undefined;

		switch ( media.type ) {

			default:
				title = media.title;
				break;

			case 'movie':
				title = media.title;
				break;
			
			case 'episode':
				title = `${media.grandparentTitle} - S${media.parentIndex} E${media.index}: ${media.title}`;
				break;

		}

		return title;

	}

	getMediaPoster( media: Plex.Metadata ): string {

		let path: string | undefined = undefined;

		switch ( media.type ) {

			default:
				return 'about:blank';

			case 'movie':
				path = media.thumb;
				break;
			
			case 'episode':
				path = media.grandparentThumb || media.parentThumb || media.thumb;
				break;

		}

		return new URL( path + '?' + new URLSearchParams( { 'X-Plex-Token': this.plexToken } ), this.plexUrl ).toString();

	}

	async onclick_sendUpdate() {

		const selectedMedia = this.recentlyAdded.filter( media => this.selectedMediaKeys.includes( media.key ) );

		const data = selectedMedia.map( media => {
			return {
				title: this.getMediaTitle( media ),
				poster: this.getMediaPoster( media ),
				year: media.year,
				href: `https://app.plex.tv/desktop#!/server/${this.server.machineIdentifier}/details?` + new URLSearchParams( { key: media.key } ).toString(),
				genres: ( media.Genre || [] ).map( genre => genre.tag ).join( ', ' ),
				summary: media.summary,
			};
		} );

		console.log( selectedMedia, data );

	}

	getMediaAddedAtIso( media: Plex.Metadata ) {
		return new Date( media.addedAt * 1000 ).toISOString();
	}

	getMediaAddedAtLocal( media: Plex.Metadata ) {
		return new Date( media.addedAt * 1000 ).toLocaleDateString();
	}

}
