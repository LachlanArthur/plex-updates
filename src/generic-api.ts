export abstract class GenericApi {

	abstract host: string;

	filterRequestOptions( options: RequestInit, method: string, endpoint: string ) {
		return options;
	}

	async request( method: string, endpoint: string, options: RequestInit = {} ) {

		options = this.filterRequestOptions( options, method, endpoint );

		const response = await fetch( new URL( endpoint, this.host ).toString(), options );

		if ( !response.ok ) {
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

}
