import { GenericApi } from './generic-api';

export class ImgurClient extends GenericApi {

	public host = 'https://api.imgur.com/3/';

	constructor( public clientId: string ) {
		super();
	}

	filterRequestOptions( options: RequestInit, method: string, endpoint: string ) {
		return {
			...options,
			headers: {
				...options.headers,
				'Authorization': `Client-ID ${this.clientId}`,
			},
		};
	}

	async uploadImage( image: Blob ): Promise<Imgur.Response<Imgur.Image>> {

		const data = new FormData();

		data.append( 'image', image );
		data.append( 'type', 'file' );

		return this.post( 'image', data );

	}

}

export namespace Imgur {

	export interface Response<T extends object> {
		data: T,
		success: boolean,
		status: number,
	}

	export interface Image {
		id: string,
		title: string,
		description: string,
		datetime: number,
		type: string,
		animated: boolean,
		width: number,
		height: number,
		size: number,
		views: number,
		bandwidth: number,
		vote: string,
		favorite: boolean,
		nsfw: boolean,
		section: string,
		account_url: string,
		account_id: number,
		is_ad: boolean,
		in_most_viral: boolean,
		tags: string[],
		ad_type: number,
		ad_url: string,
		in_gallery: boolean,
		deletehash: string,
		name: string,
		link: string,
	}

}
