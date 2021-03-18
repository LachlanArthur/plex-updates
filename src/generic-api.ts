export abstract class GenericApi {

	abstract host: string;

	filterRequestOptions( options: RequestInit, method: string, endpoint: string ) {
		return options;
	}

	async request( method: string, endpoint: string, options: RequestInit = {} ) {

		options.method = method;

		options = this.filterRequestOptions( options, method, endpoint );

		const response = await fetch( new URL( endpoint, this.host ).toString(), options );

		if ( !response.ok ) {
			console.error( response );
			throw new Error( response.statusText );
		}

		return response.json();
	}

	async get( endpoint: string, params: Record<string, string> = {}, options: RequestInit = {} ) {

		const searchParams = new URLSearchParams( params ).toString();

		if ( searchParams.length ) {
			endpoint += '?' + searchParams;
		}

		return this.request( 'get', endpoint, options );
	}

	async post( endpoint: string, body: BodyInit, options: RequestInit = {} ) {

		return this.request( 'post', endpoint, {
			...options,
			body,
		} );

	}

	async postJson( endpoint: string, body: any, options: RequestInit = {} ) {

		return this.post( endpoint, JSON.stringify( body ), {
			...options,
			headers: {
				...options.headers,
				'Content-Type': 'application/json',
			},
		} );

	}

}
