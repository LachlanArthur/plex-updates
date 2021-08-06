export class MjmlTemplate {

	public getContent: Promise<string>;

	constructor( public name: string, public variables: Record<string, string | MjmlTemplate | ( string | MjmlTemplate )[]> = {} ) {

		this.getContent = fetch( `./mjml/${this.name}.mjml` )
			.then( response => response.text() );

	}

	async render() {

		return MjmlTemplate.replaceVariables( await this.getContent, await MjmlTemplate.flattenVariables( this.variables ) );

	}

	static async flattenVariables( variables: Record<string, string | MjmlTemplate | ( string | MjmlTemplate )[]> ): Promise<Record<string, string>> {

		const entriesPromises = Object.entries( variables )
			.map( ( [ name, values ] ) => {
				return new Promise<[ string, string ]>( async resolve => {

					if ( !Array.isArray( values ) ) {
						values = [ values ];
					}
	
					const strings = ( await Promise.all( values.map( value => {
						if ( value instanceof MjmlTemplate ) {
							return value.render();
						} else {
							return value;
						}
					} ) ) ).join( '\n' );
	
					resolve( [ name, strings ] );

				} );
			} );

		return Object.fromEntries( await Promise.all( entriesPromises ) );

	}

	static replaceVariables( content: string, variables: Record<string, string> ): string {

		return content.replace( /(?:\{\{ *(.+?) *\}\}|\{!! *(.+?) *!!\})/g, ( _, safe?: string, unsafe?: string ) => {

			const name = safe || unsafe || '';

			let value = '';

			if ( name in variables ) {

				value = variables[ name ];

				if ( safe ) {
					value = this.escapeHtml( value );
				}

			}

			return value;
		} );

	}

	static stripHtml( text: string ) {
		const root = document.createElement( 'div' );
		root.innerHTML = text;
		return root.textContent!;
	}

	static escapeHtml( html: string ) {
		const root = document.createElement( 'div' );
		root.textContent = html;
		return root.innerHTML;
	}

	static escapeAttribute( text: string ) {
		const root = document.createElement( 'div' );
		root.setAttribute( 'a', text );
		return root.outerHTML.slice( 8, -8 ); // Remove '<div a="' and '"></div>'
	}

	static escapeRegex( regex: string ) {
		return regex.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	}

}
