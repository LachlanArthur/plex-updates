export namespace Plex {

	interface MediaContainer {
		allowSync: boolean,
		art: string,
		identifier: string,
		librarySectionID: number,
		librarySectionTitle: string,
		librarySectionUUID: string,
		mediaTagPrefix: string,
		mediaTagVersion: number,
		size: number,
		thumb: string,
		title1: string,
		title2: string,
		viewGroup: string,
		viewMode: number,
	}

	interface Directory {
		allowSync: boolean,
		art: string,
		composite: string,
		filters: boolean,
		refreshing: boolean,
		thumb: string,
		key: string,
		type: string,
		title: string,
		agent: string,
		scanner: string,
		language: string,
		uuid: string,
		updatedAt: number,
		createdAt: number,
		scannedAt: number,
		content: boolean,
		directory: boolean,
		contentChangedAt: number,
		hidden: number,
		Location: Location[],
	}

	type DirectoryMediaContainer = MediaContainer & { Directory: Directory[] }

	interface Location {
		id: number,
		path: string,
	}

	interface Metadata {
		addedAt: number,
		art: string,
		audienceRating: number,
		audienceRatingImage: string,
		chapterSource: string,
		contentRating: string,
		Country: [],
		Director: [],
		duration: number,
		Genre: Genre[],
		grandparentArt: string,
		grandparentGuid: string,
		grandparentKey: string,
		grandparentRatingKey: string,
		grandparentThumb: string,
		grandparentTitle: string,
		guid: string,
		index: number,
		key: string,
		lastViewedAt: number,
		Media: Media[],
		originallyAvailableAt: string,
		parentGuid: string,
		parentIndex: number,
		parentKey: string,
		parentRatingKey: string,
		parentThumb: string,
		parentTitle: string,
		primaryExtraKey: string,
		rating: number,
		ratingImage: string,
		ratingKey: string,
		Role: [],
		studio: string,
		summary: string,
		tagline: string,
		thumb: string,
		title: string,
		titleSort: string,
		type: string,
		updatedAt: number,
		viewCount: number,
		Writer: [],
		year: number,
	}

	type MetadataMediaContainer = MediaContainer & { Metadata: Metadata[] }

	interface Media {
		id: number,
		duration: number,
		bitrate: number,
		width: number,
		height: number,
		aspectRatio: number,
		audioChannels: number,
		audioCodec: string,
		videoCodec: string,
		videoResolution: string,
		container: string,
		videoFrameRate: string,
		audioProfile: string,
		videoProfile: string,
		Part: Part[],
	}

	interface Part {
		id: number,
		key: string,
		duration: number,
		file: string,
		size: number,
		audioProfile: string,
		container: string,
		videoProfile: string,
	}

	interface Genre {
		tag: string,
	}

	interface Director {
		tag: string,
	}

	interface Writer {
		tag: string,
	}

	interface Country {
		tag: string,
	}

	interface Role {
		tag: string,
	}

	interface Server {
		name: string,
		host: string,
		address: string,
		port: number,
		machineIdentifier: string,
		version: string,
	}

	type ServerMediaContainer = MediaContainer & { Server: Server[] }

}
