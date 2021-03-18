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
	mailjetSelectedContactIds: string[] = [];
	mailjetTemplates: Mailjet.Template[] = [];
	mailjetSelectedTemplateId: string = '';

	servers: Plex.Server[] = [];
	librarySections: Plex.Directory[] = [];
	recentlyAdded: Plex.Metadata[] = [];

	selectedLibrarySectionsKeys: string[] = [];
	selectedMediaKeys: string[] = [];

	campaignFromName: string = '';
	campaignFromEmail: string = '';

	constructor() {
		super();

		this.plexUrl = localStorage.getItem( 'plexUrl' ) || '';
		this.plexToken = localStorage.getItem( 'plexToken' ) || '';

		this.selectedLibrarySectionsKeys = ( localStorage.getItem( 'selectedLibrarySectionsKeys' ) || '' ).split( ',' ).filter( String );

		this.plexApi = new PlexApi( this.plexUrl, this.plexToken );

		this.mailjetApiPublic = localStorage.getItem( 'mailjetApiPublic' ) || '';
		this.mailjetApiSecret = localStorage.getItem( 'mailjetApiSecret' ) || '';
		this.mailjetSelectedListId = localStorage.getItem( 'mailjetSelectedListId' ) || '';
		this.mailjetSelectedTemplateId = localStorage.getItem( 'mailjetSelectedTemplateId' ) || '';

		this.campaignFromName = localStorage.getItem( 'campaignFromName' ) || '';
		this.campaignFromEmail = localStorage.getItem( 'campaignFromEmail' ) || '';

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
			this.getContacts();
		} );

		this.$watch( 'mailjetSelectedTemplateId', ( value: string ) => {
			localStorage.setItem( 'mailjetSelectedTemplateId', value );
		} );

		this.$watch( 'campaignFromName', ( value: string ) => {
			localStorage.setItem( 'campaignFromName', value );
		} );

		this.$watch( 'campaignFromEmail', ( value: string ) => {
			localStorage.setItem( 'campaignFromEmail', value );
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

	async onclick_connectToMailjet() {

		try {
			this.mailjetProfile = await this.mailjet.getMyProfile();
		} catch ( e ) {
			console.error( e );
			this.mailjetProfile = null;
			return;
		}

		this.mailjetLists = await this.mailjet.getLists();

		await this.getContacts();

		this.mailjetTemplates = await this.mailjet.getTemplates();

	}

	async getContacts() {

		this.mailjetSelectedContactIds = [];

		if ( !this.mailjetSelectedListId ) return;

		try {
			this.mailjetContacts = await this.mailjet.getContacts( parseInt( this.mailjetSelectedListId ) );
		} catch ( e ) {
			this.mailjetContacts = [];
			console.error( e );
			return;
		}

	}

	async onclick_sendUpdate() {

		const selectedMedia = this.recentlyAdded.filter( media => this.selectedMediaKeys.includes( media.key ) );

		const emails: Mailjet.SendOptions = {
			Messages: [],
			Globals: {
				From: {
					Name: this.campaignFromName,
					Email: this.campaignFromEmail,
				},
				TemplateErrorReporting: {
					Name: this.campaignFromName,
					Email: this.campaignFromEmail,
				},
				Subject: `What's new on Plex`,
				InlinedAttachments: [],
				Variables: {},
				TemplateID: parseInt( this.mailjetSelectedTemplateId ),
				TemplateLanguage: true,
				CustomCampaign: 'Plex Updates for ' + new Intl.DateTimeFormat( 'en-AU', { dateStyle: 'long' } ).format( new Date() ),
			},
			// SandboxMode: true,
		};

		const updates: {
			backgroundCid: string,
			posterCid: string,
			href: string,
			title: string,
			year: string,
			summary: string,
			genres: string,
		}[] = [];

		let mediaIndex = 0;
		for ( const media of selectedMedia ) {

			const poster = this.getMediaPoster( media );
			const background = this.getMediaBackground( media );

			const posterData = await this.downloadImage( poster );
			const backgroundData = await this.downloadImage( background );

			emails.Globals!.InlinedAttachments?.push( {
				ContentType: posterData.type,
				Base64Content: posterData.data,
				Filename: `media-${mediaIndex}-poster.jpg`,
				ContentID: `media-${mediaIndex}-poster`,
			} );

			emails.Globals!.InlinedAttachments?.push( {
				ContentType: backgroundData.type,
				Base64Content: backgroundData.data,
				Filename: `media-${mediaIndex}-background.jpg`,
				ContentID: `media-${mediaIndex}-background`,
			} );

			updates.push( {
				backgroundCid: `cid:media-${mediaIndex}-background`,
				posterCid: `cid:media-${mediaIndex}-poster`,
				href: `https://app.plex.tv/desktop#!/server/${this.server.machineIdentifier}/details?` + new URLSearchParams( { key: media.key } ).toString(),
				title: this.getMediaTitle( media ),
				year: media.year.toString(),
				summary: media.summary,
				genres: ( media.Genre || [] ).map( genre => genre.tag ).join( ', ' ),
			} );

			mediaIndex++;
		}

		const contacts = this.mailjetContacts.filter( contact => this.mailjetSelectedContactIds.includes( contact.ID.toString() ) );

		if ( !contacts.length ) {
			console.error( 'No contacts selected' );
			return;
		}

		for ( const contact of contacts ) {
			emails.Messages.push( {
				To: [ {
					Name: contact.Name,
					Email: contact.Email,
				} ],
			} );
		}

		emails.Globals!.Variables = {
			...emails.Globals!.Variables,
			updates,
		};

		this.mailjet.sendTransactionalEmail( emails );

		// console.log( emails );

	}

}
