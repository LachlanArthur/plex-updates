import { AlpineApp } from './alpine';
import { PlexApi } from './plex-api';

import type { Plex } from 'types/plex-api';
import { Mailjet } from './mailjet';

export class PlexUpdates extends AlpineApp {

	plexUrl: string = '';
	plexToken: string = '';
	plexApi: PlexApi;

	mailjet: Mailjet;
	mailjetApiPublic: string = '';
	mailjetApiSecret: string = '';
	mailjetProfile: Mailjet.Profile | null = null;
	mailjetLists: Mailjet.ContactList[] = [];
	mailjetSelectedListId: string = '';
	mailjetContacts: Mailjet.Contact[] = [];
	mailjetSelectedContactIds: number[] = [];
	mailjetTemplates: Mailjet.Template[] = [];
	mailjetSelectedTemplateId: string = '';

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

		this.mailjetApiPublic = localStorage.getItem( 'mailjetApiPublic' ) || '';
		this.mailjetApiSecret = localStorage.getItem( 'mailjetApiSecret' ) || '';
		this.mailjetSelectedListId = localStorage.getItem( 'mailjetSelectedListId' ) || '';

		this.mailjetSelectedContactIds = ( localStorage.getItem( 'mailjetSelectedContactIds' ) || '' ).split( ',' ).filter( String ).map( Number );

		this.mailjet = new Mailjet( this.mailjetApiPublic, this.mailjetApiSecret );
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

		this.$watch( 'selectedLibrarySectionsKeys', ( value: string[] ) => {
			localStorage.setItem( 'selectedLibrarySectionsKeys', value.join( ',' ) );
		} );

		this.$watch( 'mailjetApiPublic', ( value: string ) => {
			localStorage.setItem( 'mailjetApiPublic', value );
			this.mailjet.public_api_key = value;
		} );

		this.$watch( 'mailjetApiSecret', ( value: string ) => {
			localStorage.setItem( 'mailjetApiSecret', value );
			this.mailjet.private_api_key = value;
		} );

		this.$watch( 'mailjetSelectedListId', ( value: string ) => {
			localStorage.setItem( 'mailjetSelectedListId', value );
		} );

		this.$watch( 'mailjetSelectedContactIds', ( value: number[] ) => {
			localStorage.setItem( 'mailjetSelectedContactIds', value.join( ',' ) );
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

		return new URL( '/photo/:/transcode' + '?' + new URLSearchParams( {
			'X-Plex-Token': this.plexToken,
			width: '300',
			height: '450',
			minSize: '1',
			url: path + '?' + new URLSearchParams( { 'X-Plex-Token': this.plexToken } ),
		} ), this.plexUrl ).toString();

	}

	getMediaBackground( media: Plex.Metadata ): string {

		let path: string | undefined = undefined;

		switch ( media.type ) {

			default:
				return 'about:blank';

			case 'movie':
				path = media.art;
				break;

			case 'episode':
				path = media.grandparentArt || media.art;
				break;

		}

		return new URL( '/photo/:/transcode' + '?' + new URLSearchParams( {
			'X-Plex-Token': this.plexToken,
			width: '1200',
			height: '600',
			minSize: '1',
			opacity: '10',
			background: '343a3f',
			url: path + '?' + new URLSearchParams( { 'X-Plex-Token': this.plexToken } ),
		} ), this.plexUrl ).toString();

	}

	async onclick_sendUpdate() {

		const selectedMedia = this.recentlyAdded.filter( media => this.selectedMediaKeys.includes( media.key ) );

		const data: Record<string, string>[] = [];

		for ( const media of selectedMedia ) {

			const poster = this.getMediaPoster( media );
			const background = this.getMediaBackground( media );

			data.push( {
				title: this.getMediaTitle( media ),
				poster,
				posterData: await this.downloadImage( poster ),
				background,
				backgroundData: await this.downloadImage( background ),
				year: media.year.toString(),
				href: `https://app.plex.tv/desktop#!/server/${this.server.machineIdentifier}/details?` + new URLSearchParams( { key: media.key } ).toString(),
				genres: ( media.Genre || [] ).map( genre => genre.tag ).join( ', ' ),
				summary: media.summary,
			} );

		}

		console.log( selectedMedia, data );

	}

	getMediaAddedAtIso( media: Plex.Metadata ) {
		return new Date( media.addedAt * 1000 ).toISOString();
	}

	getMediaAddedAtLocal( media: Plex.Metadata ) {
		return new Date( media.addedAt * 1000 ).toLocaleDateString();
	}

	async downloadImage( url: string ): Promise<string> {

		try {

			const response = await fetch( url );

			if ( !response.ok ) {
				throw new Error();
			}

			const blob = await response.blob();

			const reader = new FileReader();

			await new Promise( resolve => {
				reader.onload = resolve;
				reader.readAsDataURL( blob );
			} );

			if ( !reader.result ) {
				throw new Error();
			}

			return reader.result as string;

		} catch ( e ) {
			return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
		}

	}

	async onclick_connectToMailjet() {

		try {
			this.mailjetProfile = await this.mailjet.getMyProfile();
		} catch ( e ) {
			console.error( e );
			this.mailjetProfile = null;
			return;
		}

		this.mailjetLists = await this.mailjet.getLists();

		this.mailjetTemplates = await this.mailjet.getTemplates();

	}

	async onclick_getContacts() {

		try {
			this.mailjetContacts = await this.mailjet.getContacts( parseInt( this.mailjetSelectedListId ) );
		} catch ( e ) {
			this.mailjetContacts = [];
			console.error( e );
			return;
		}

	}

}
