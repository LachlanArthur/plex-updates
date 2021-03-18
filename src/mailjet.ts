import { GenericApi } from './generic-api';

export class Mailjet extends GenericApi {

	public host = 'https://api.mailjet.com';

	constructor( public public_api_key: string, public private_api_key: string ) {
		super();
	}

	filterRequestOptions( options: RequestInit, method: string, endpoint: string ) {
		return {
			...options,
			headers: {
				...options.headers,
				'Authorization': 'Basic ' + btoa( `${this.public_api_key}:${this.private_api_key}` ),
				'Accept': 'application/json',
			},
		};
	}

	async getMyProfile() {

		const response = await this.get( '/v3/REST/myprofile' ) as Mailjet.PagedResponse<Mailjet.Profile>;

		if ( response.Total === 0 ) {
			throw new Error();
		}

		return response.Data[ 0 ];

	}

	async getLists() {

		const response = await this.get( '/v3/REST/contactslist', {
			Limit: '1000',
		} ) as Mailjet.PagedResponse<Mailjet.ContactList>;

		return response.Data;

	}

	async getContacts( listId: number ) {

		const response = await this.get( '/v3/REST/contact', {
			ContactsList: listId.toString(),
			Limit: '1000',
		} ) as Mailjet.PagedResponse<Mailjet.Contact>;

		return response.Data.filter( contact => {
			if ( contact.IsExcludedFromCampaigns || contact.IsOptInPending || contact.IsSpamComplaining ) {
				return false;
			}
			return true;
		} );

	}

	async getTemplates() {

		const response = await this.get( '/v3/REST/template', {
			Purposes: 'transactional',
			PurposesSelectionMethod: 'containsall',
			Limit: '1000',
		} ) as Mailjet.PagedResponse<Mailjet.Template>;

		return response.Data;

	}

	async sendTransactionalEmail( sendOptions: Mailjet.SendOptions, options: RequestInit = {} ) {

		const response = await this.postJson( '/v3.1/send', sendOptions, options );
	
		if ( !response.ok ) {
			console.error( response );
			throw new Error( response.statusText );
		}
	
		const data = await response.json();
	
	
	}
	

}

export namespace Mailjet {

	export interface SendOptions {
		Messages: Message[],
		SandboxMode?: boolean,
		AdvanceErrorHandling?: boolean,
		Globals?: Partial<Omit<Message, 'To'>>,

	}

	export interface Message {
		From?: EmailAddress,
		Sender?: EmailAddress,
		To?: EmailAddress[],
		Cc?: EmailAddress[],
		Bcc?: EmailAddress[],
		ReplyTo?: EmailAddress,
		Subject?: string,
		TextPart?: string,
		HTMLPart?: string,
		TemplateID?: number,
		TemplateLanguage?: boolean,
		TemplateErrorReporting?: EmailAddress,
		TemplateErrorDeliver?: boolean,
		Attachments?: Attachment[],
		InlinedAttachments?: InlinedAttachment[],
		Priority?: number,
		CustomCampaign?: string,
		DeduplicateCampaign?: boolean,
		TrackOpens?: 'account_default' | 'disabled' | 'enabled',
		TrackClicks?: 'account_default' | 'disabled' | 'enabled',
		CustomID?: string,
		EventPayload?: string,
		URLTags?: string,
		Headers?: Record<string, string>,
		Variables?: Record<string, any>,
	}

	export interface EmailAddress {
		Email: string,
		Name?: string,
	}

	export interface Attachment {
		Filename: string,
		ContentType: string,
		Base64Content: string,
	}

	export interface InlinedAttachment extends Attachment {
		ContentID?: string,
	}

	export interface PagedResponse<T> {
		Count: number,
		Total: number,
		Data: T[],
	}

	export interface ContactList {
		Name: string,
		Address: string,
		CreatedAt: string,
		ID: number,
		SubscriberCount: number,
	}

	export interface Contact {
		IsExcludedFromCampaigns: boolean,
		Name: string,
		CreatedAt: string,
		DeliveredCount: number,
		Email: string,
		ExclusionFromCampaignsUpdatedAt: string,
		ID: number,
		IsOptInPending: boolean,
		IsSpamComplaining: boolean,
		LastActivityAt: string,
		LastUpdateAt: string,
		UnsubscribedAt: string,
		UnsubscribedBy: string,
	}

	export interface Profile {
		AddressCity: string,
		AddressCountry: string,
		AddressPostalCode: string,
		AddressState: string,
		AddressStreet: string,
		BillingEmail: string,
		BirthdayAt: string,
		CompanyName: string,
		CompanyNumOfEmployees: string,
		ContactPhone: string,
		EstimatedVolume: number,
		Features: string,
		Firstname: string,
		Industry: number,
		JobTitle: string,
		Lastname: string,
		VATNumber: string,
		Website: string,
		ID: number,
		VAT: string,
		UserID: number,
	}

	export interface Template {
		Author: string,
		Categories: string,
		Copyright: string,
		Description: string,
		EditMode: number,
		IsStarred: boolean,
		IsTextPartGenerationEnabled: boolean,
		Locale: string,
		Name: string,
		OwnerType: string,
		Presets: string,
		Purposes: string,
		ID: number,
		OwnerId: number,
		Previews: string,
		CreatedAt: string,
		LastUpdatedAt: string,
	}

}
