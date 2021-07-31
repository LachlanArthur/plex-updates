import { AlpineApp } from './alpine';
import { PlexApi } from './plex-api';

import type { Plex } from 'types/plex-api';
import { Mailjet } from './mailjet';
import { JMAP } from './jmap';
import type { JmapApi } from 'types/jmap-api';

export class PlexUpdates extends AlpineApp {

	plexUrl: string = '';
	plexToken: string = '';
	plexApi: PlexApi;

	jmap: JMAP;
	jmapHost: string = '';
	jmapUsername: string = '';
	jmapPassword: string = '';
	jmapDraftMailboxId: string = '';
	jmapContacts: JmapApi.EmailAddress[] = [];
	jmapFromName: string = '';
	jmapFromEmail: string = '';
	jmapCreateSuccess: any = null;

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
		this.jmapContacts = Array.from<JmapApi.EmailAddress>( JSON.parse( localStorage.getItem( 'jmapContacts' ) || '[]' ) ).filter( Boolean );
		this.jmapFromName = localStorage.getItem( 'jmapFromName' ) || '';
		this.jmapFromEmail = localStorage.getItem( 'jmapFromEmail' ) || '';

		this.jmap = new JMAP( this.jmapHost, this.jmapUsername, this.jmapPassword );
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

		this.$watch( 'jmapContacts', ( value: JmapApi.EmailAddress[] ) => {
			localStorage.setItem( 'jmapContacts', JSON.stringify( value.filter( Boolean ) ) );
		} );

		this.$watch( 'jmapFromName', ( value: string ) => {
			localStorage.setItem( 'jmapFromName', value );
		} );

		this.$watch( 'jmapFromEmail', ( value: string ) => {
			localStorage.setItem( 'jmapFromEmail', value );
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

	async downloadImage( url: string ): Promise<{ type: string, data: string }> {

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

			const [ dataUri, type, data ] = reader.result.toString().match( /^data:(.+?)(?:;.+?)*;base64,(.+)$/ ) || [];

			return {
				type,
				data,
			};

		} catch ( e ) {
			return {
				type: 'image/gif',
				data: 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
			};
		}

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

	async onclick_sendUpdate() {

		this.jmapCreateSuccess = null;

		const selectedMedia = this.recentlyAdded.filter( media => this.selectedMediaKeys.includes( media.key ) );

		// let mediaIndex = 0;
		// for ( const media of selectedMedia ) {

		// 	const poster = this.getMediaPoster( media );
		// 	const background = this.getMediaBackground( media );

		// 	const posterData = await this.downloadImage( poster );
		// 	const backgroundData = await this.downloadImage( background );

		// 	mj_emails.Globals!.InlinedAttachments?.push( {
		// 		ContentType: posterData.type,
		// 		Base64Content: posterData.data,
		// 		Filename: `media-${mediaIndex}-poster.jpg`,
		// 		ContentID: `media-${mediaIndex}-poster`,
		// 	} );

		// 	mj_emails.Globals!.InlinedAttachments?.push( {
		// 		ContentType: backgroundData.type,
		// 		Base64Content: backgroundData.data,
		// 		Filename: `media-${mediaIndex}-background.jpg`,
		// 		ContentID: `media-${mediaIndex}-background`,
		// 	} );

		// 	mj_updates.push( {
		// 		backgroundCid: `cid:media-${mediaIndex}-background`,
		// 		posterCid: `cid:media-${mediaIndex}-poster`,
		// 		href: `https://app.plex.tv/desktop#!/server/${this.server.machineIdentifier}/details?` + new URLSearchParams( { key: media.key } ).toString(),
		// 		title: this.getMediaTitle( media ),
		// 		year: media.year.toString(),
		// 		summary: media.summary,
		// 		genres: ( media.Genre || [] ).map( genre => genre.tag ).join( ', ' ),
		// 	} );

		// 	mediaIndex++;
		// }

		const emails: Partial<JmapApi.Email>[] = this.jmapContacts.map( contact => ( {
			from: [ { name: this.jmapFromName, email: this.jmapFromEmail } ],
			to: [ contact ],
			subject: `What’s new on Plex`,
			keywords: { $draft: true },
			mailboxIds: { [ this.jmapDraftMailboxId ]: true },
			bodyValues: { body: { value: 'Hello!\n\nThis email was sent using JMAP.' } },
			textBody: [ { partId: 'body', type: 'text/plain' } ],
		} ) );

		this.jmapCreateSuccess = await this.jmap.createEmails( ...emails );






		// const mj_updates: {
		// 	backgroundCid: string,
		// 	posterCid: string,
		// 	href: string,
		// 	title: string,
		// 	year: string,
		// 	summary: string,
		// 	genres: string,
		// }[] = [];

		// let mediaIndex = 0;
		// for ( const media of selectedMedia ) {

		// 	const poster = this.getMediaPoster( media );
		// 	const background = this.getMediaBackground( media );

		// 	const posterData = await this.downloadImage( poster );
		// 	const backgroundData = await this.downloadImage( background );

		// 	mj_emails.Globals!.InlinedAttachments?.push( {
		// 		ContentType: posterData.type,
		// 		Base64Content: posterData.data,
		// 		Filename: `media-${mediaIndex}-poster.jpg`,
		// 		ContentID: `media-${mediaIndex}-poster`,
		// 	} );

		// 	mj_emails.Globals!.InlinedAttachments?.push( {
		// 		ContentType: backgroundData.type,
		// 		Base64Content: backgroundData.data,
		// 		Filename: `media-${mediaIndex}-background.jpg`,
		// 		ContentID: `media-${mediaIndex}-background`,
		// 	} );

		// 	mj_updates.push( {
		// 		backgroundCid: `cid:media-${mediaIndex}-background`,
		// 		posterCid: `cid:media-${mediaIndex}-poster`,
		// 		href: `https://app.plex.tv/desktop#!/server/${this.server.machineIdentifier}/details?` + new URLSearchParams( { key: media.key } ).toString(),
		// 		title: this.getMediaTitle( media ),
		// 		year: media.year.toString(),
		// 		summary: media.summary,
		// 		genres: ( media.Genre || [] ).map( genre => genre.tag ).join( ', ' ),
		// 	} );

		// 	mediaIndex++;
		// }

		// const mj_contacts = this.mailjetContacts.filter( contact => this.mailjetSelectedContactIds.includes( contact.ID.toString() ) );

		// if ( !mj_contacts.length ) {
		// 	console.error( 'No contacts selected' );
		// 	return;
		// }

		// for ( const contact of mj_contacts ) {
		// 	mj_emails.Messages.push( {
		// 		To: [ {
		// 			Name: contact.Name,
		// 			Email: contact.Email,
		// 		} ],
		// 	} );
		// }

		// mj_emails.Globals!.Variables = {
		// 	...mj_emails.Globals!.Variables,
		// 	updates: mj_updates,
		// };

		// this.mailjet.sendTransactionalEmail( mj_emails );

		// // console.log( emails );

	}

	addContact() {
		this.jmapContacts.push( { name: '', email: '' } );
	}

	removeContact( index: number ) {
		this.jmapContacts.splice( index, 1 );
	}

	buildEmailTemplate() {
		
	}

}
