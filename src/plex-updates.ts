import { AlpineApp } from './alpine';
import { PlexApi } from './plex-api';

import type { Plex } from 'types/plex-api';
import { JMAP } from './jmap';
import type { JmapApi } from 'types/jmap-api';
import { MjmlTemplate } from './mjml';
import { ImgurClient } from './imgur';

interface Contact {
	name: string
	email: string
	active: boolean
}

export class PlexUpdates extends AlpineApp {

	plexUrl: string = '';
	plexToken: string = '';
	plexApi: PlexApi;

	jmap: JMAP;
	jmapHost: string = '';
	jmapUsername: string = '';
	jmapPassword: string = '';
	jmapDraftMailboxId: string = '';
	jmapContacts: Contact[] = [];
	jmapFromName: string = '';
	jmapFromEmail: string = '';
	jmapCreateSuccess: any = null;

	imgur: ImgurClient;
	imgurClientId: string = '';

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

		this.jmapHost = localStorage.getItem( 'jmapHost' ) || '';
		this.jmapUsername = localStorage.getItem( 'jmapUsername' ) || '';
		this.jmapPassword = localStorage.getItem( 'jmapPassword' ) || '';
		this.jmapContacts = Array.from<Contact>( JSON.parse( localStorage.getItem( 'jmapContacts' ) || '[]' ) )
			.filter( Boolean )
			.map( contact => ( {
				name: contact.name || '',
				email: contact.email || '',
				active: Boolean( contact.active ),
			} ) );
		this.jmapFromName = localStorage.getItem( 'jmapFromName' ) || '';
		this.jmapFromEmail = localStorage.getItem( 'jmapFromEmail' ) || '';

		this.jmap = new JMAP( this.jmapHost, this.jmapUsername, this.jmapPassword );

		this.imgurClientId = localStorage.getItem( 'imgurClientId' ) || '';
		this.imgur = new ImgurClient( this.imgurClientId );
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

		this.$watch( 'jmapHost', ( value: string ) => {
			localStorage.setItem( 'jmapHost', value );
			this.jmap.host = value;
		} );

		this.$watch( 'jmapUsername', ( value: string ) => {
			localStorage.setItem( 'jmapUsername', value );
			this.jmap.username = value;
		} );

		this.$watch( 'jmapPassword', ( value: string ) => {
			localStorage.setItem( 'jmapPassword', value );
			this.jmap.password = value;
		} );

		this.$watch( 'jmapContacts', ( value: Contact[] ) => {
			this.saveContacts( value );
		} );

		this.$watch( 'jmapFromName', ( value: string ) => {
			localStorage.setItem( 'jmapFromName', value );
		} );

		this.$watch( 'jmapFromEmail', ( value: string ) => {
			localStorage.setItem( 'jmapFromEmail', value );
		} );

		this.$watch( 'imgurClientId', ( value: string ) => {
			localStorage.setItem( 'imgurClientId', value );
			this.imgur.clientId = this.imgurClientId;
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

	getMediaAddedAtIso( media: Plex.Metadata ) {
		return new Date( media.addedAt * 1000 ).toISOString();
	}

	getMediaAddedAtLocal( media: Plex.Metadata ) {
		return new Date( media.addedAt * 1000 ).toLocaleDateString();
	}

	async downloadImage( url: string ): Promise<Blob> {

		const response = await fetch( url );

		if ( !response.ok ) {
			throw new Error( response.statusText );
		}

		return response.blob();

	}

	async onclick_connectToJmap() {

		try {
			this.jmapDraftMailboxId = await this.jmap.getDraftsMailbox();
		} catch ( e ) {
			console.error( e );
			this.jmapDraftMailboxId = '';
			return;
		}

	}

	get activeContacts() {
		return this.jmapContacts.filter( contact => contact.active );
	}

	async onclick_sendUpdate() {

		this.trigger_saveContacts();

		const selectedMedia = this.recentlyAdded.filter( media => this.selectedMediaKeys.includes( media.key ) );

		const html = await this.buildEmailTemplate( selectedMedia );

		this.jmapCreateSuccess = null;

		const emails: Partial<JmapApi.Email>[] = this.activeContacts.map( contact => {

			const body = MjmlTemplate.replaceVariables( html, {
				to_name: contact.name || 'there',
				from_name: this.jmapFromName,
			} );

			return {
				from: [ { name: this.jmapFromName, email: this.jmapFromEmail } ],
				to: [ contact ],
				subject: `What’s new on Plex`,
				keywords: { $draft: true },
				mailboxIds: { [ this.jmapDraftMailboxId ]: true },
				bodyValues: { body: { value: body } },
				htmlBody: [ { partId: 'body', type: 'text/html' } ],
			};

		} );

		this.jmapCreateSuccess = await this.jmap.createEmails( ...emails );

	}

	onclick_addContact() {
		this.jmapContacts.push( { name: '', email: '', active: true } );
	}

	onclick_removeContact( index: number ) {
		this.jmapContacts.splice( index, 1 );
	}

	trigger_saveContacts() {
		this.$nextTick( () => {
			this.saveContacts( this.jmapContacts );
		} );
	}

	saveContacts( contacts: Contact[] ) {
		localStorage.setItem( 'jmapContacts', JSON.stringify( contacts.filter( Boolean ) ) );
	}

	async buildEmailTemplate( selectedMedia: Plex.Metadata[] ) {

		const mediaSections: MjmlTemplate[] = [];

		for ( const media of selectedMedia ) {

			const posterUrl = this.getMediaPoster( media );
			const backgroundUrl = this.getMediaBackground( media );

			const posterBlob = await this.downloadImage( posterUrl );
			const backgroundBlob = await this.downloadImage( backgroundUrl );

			const { data: { link: posterLink } } = await this.imgur.uploadImage( posterBlob );
			const { data: { link: backgroundLink } } = await this.imgur.uploadImage( backgroundBlob );

			mediaSections.push( new MjmlTemplate( 'section-update-movie', {
				background: backgroundLink,
				poster: posterLink,
				href: `https://app.plex.tv/desktop#!/server/${this.server.machineIdentifier}/details?` + new URLSearchParams( { key: media.key } ),
				title: this.getMediaTitle( media ),
				year: media.year.toString(),
				summary: media.summary,
				genres: ( media.Genre || [] ).map( genre => genre.tag ).join( ', ' ),
			} ) )

		}

		const template = new MjmlTemplate( 'base', {
			sections: [

				new MjmlTemplate( 'section-header', {
					logo_url: 'https://xy10n.mjt.lu/tplimg/xy10n/b/s2tz8/2yrq.png',
					logo_width: '50px',
					logo_height: '50px',
				} ),

				new MjmlTemplate( 'section-text', {
					html: `<p>Hey {{ to_name }},<br>
						I just added some more stuff to Plex.<br>
						Enjoy!</p>
						<p>— {{ from_name }}</p>`,
				} ),

				...mediaSections,

				new MjmlTemplate( 'section-footer', {
					unsubscribe: `mailto:${this.jmapFromEmail}?` + ( new URLSearchParams( {
						subject: 'Please unsubscribe me from Plex Updates',
					} ) ).toString().replaceAll( '+', '%20' ),
				} ),

			],
		} );

		const mjml = await template.render();

		return window.mjml2html( mjml ).html;

	}

}
