import { GenericApi } from './generic-api';
import type { JmapApi } from '../types/jmap-api';

export class JMAP extends GenericApi {

	protected session: JmapApi.Session | undefined;

	constructor( public host: string, public username: string, public password: string ) {
		super();
	}

	filterRequestOptions( options: RequestInit, method: string, endpoint: string ) {
		return {
			...options,
			headers: {
				...options.headers,
				'Authorization': 'Basic ' + btoa( `${this.username}:${this.password}` ),
				'Accept': 'application/json',
			},
		};
	}

	async getSession( force = false ) {

		if ( !this.session || force ) {
			this.session = await this.get( '/.well-known/jmap' );
		}

		return this.session!;

	}

	async jmapRequest<T extends JmapApi.Response>( request: JmapApi.Request ): Promise<T> {

		const session = await this.getSession();

		return this.postJson( session.apiUrl, request ) as Promise<T>;

	}

	async getIdentities() {

		const session = await this.getSession();

		const accountId = session.primaryAccounts[ 'urn:ietf:params:jmap:mail' ];

		const response = await this.postJson( session.apiUrl, {
			using: [
				'urn:ietf:params:jmap:core',
				'urn:ietf:params:jmap:mail',
				'urn:ietf:params:jmap:submission',
			],
			methodCalls: [
				[
					'Identity/get',
					{ accountId },
					'a',
				],
			],
		} );

		return response.methodResponses[ 0 ][ 1 ][ 'list' ] as JmapApi.Identity[];

	}

	async getDraftsMailbox(): Promise<string> {

		const session = await this.getSession();

		const accountId = session.primaryAccounts[ 'urn:ietf:params:jmap:mail' ];

		const response = await this.postJson( session.apiUrl, {
			using: [
				'urn:ietf:params:jmap:core',
				'urn:ietf:params:jmap:mail',
			],
			methodCalls: [
				[
					'Mailbox/query',
					{ accountId, filter: { role: 'drafts' } },
					'a',
				],
			],
		} );

		return response[ 'methodResponses' ][ 0 ][ 1 ][ 'ids' ][ 0 ];

	}

	async createEmails( ...emails: Partial<JmapApi.Email>[] ) {

		const session = await this.getSession();

		const accountId = session.primaryAccounts[ 'urn:ietf:params:jmap:mail' ];

		return this.postJson( session.apiUrl, {
			using: [
				'urn:ietf:params:jmap:core',
				'urn:ietf:params:jmap:mail',
				'urn:ietf:params:jmap:submission',
			],
			methodCalls: emails.map( (email, index) => [
				'Email/set',
				{
					accountId,
					create: { email },
				},
				`email${index}`,
			] ),
		} );

	}

}
