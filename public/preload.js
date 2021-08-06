const { contextBridge } = require( 'electron' );
const mjml2html = require( 'mjml' );

contextBridge.exposeInMainWorld( 'mjml2html', mjml2html );
