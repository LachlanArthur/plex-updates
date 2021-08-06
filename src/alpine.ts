export interface AlpineApp {
	$el: HTMLElement
	$refs: Record<string, HTMLElement>
	$watch: ( property: string, callback: ( value: any ) => void ) => void | ( () => void )
	$nextTick: ( callback: () => void ) => void
}

export class AlpineApp {

	static alpine( ...constructorArgs: any ) {
		return createFlatObjectFromClass( this, ...constructorArgs );
	}

}

export function createFlatObjectFromClass<T>( classObject: ( new ( ...args: any ) => T ), ...constructorArgs: any ): object {
	const instance = classObject.prototype.__proto__ ? createFlatObjectFromClass( classObject.prototype.__proto__.constructor ) : {};

	const properties = {
		...Object.getOwnPropertyDescriptors( classObject.prototype ),
		...Object.getOwnPropertyDescriptors( new classObject( ...constructorArgs ) ),
	};

	// Make all functions enumerable
	for ( const property of Object.values( properties ) ) {
		if ( typeof property.value === 'function' ) {
			property.enumerable = true;
		}
	}

	Object.defineProperties( instance, properties );

	return instance;
}
