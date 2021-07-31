export namespace JmapApi {

	interface Session {
		[ key: string ]: any,
		apiUrl: string,
		primaryAccounts: Record<JmapUri, string>,
		/**
		 * An object specifying the capabilities of this server.
		 * Each key is a URI for a capability supported by the server.
		 * The value for each of these keys is an object with further information about the server’s capabilities in relation to that capability.
		 */
		capabilities: {
			/**
			 * Information on server capabilities
			 */
			'urn:ietf:params:jmap:core': {
				/**
				 * The maximum file size, in octets, that the server will accept for a single file upload (for any purpose).
				 * Suggested minimum: 50,000,000.
				 */
				maxSizeUpload: number,
				/**
				 * The maximum number of concurrent requests the server will accept to the upload endpoint.
				 * Suggested minimum: 4.
				 */
				maxConcurrentUpload: number,
				/**
				 * The maximum size, in octets, that the server will accept for a single request to the API endpoint.
				 * Suggested minimum: 10,000,000.
				 */
				maxSizeRequest: number,
				/**
				 * The maximum number of concurrent requests the server will accept to the API endpoint.
				 * Suggested minimum: 4.
				 */
				maxConcurrentRequests: number,
				/**
				 * The maximum number of method calls the server will accept in a single request to the API endpoint.
				 * Suggested minimum: 16.
				 */
				maxCallsInRequest: number,
				/**
				 * The maximum number of objects that the client may request in a single /get type method call.
				 * Suggested minimum: 500.
				 */
				maxObjectsInGet: number,
				/**
				 * The maximum number of objects the client may send to create, update, or destroy in a single /set type method call.
				 * This is the combined total, e.g., if the maximum is 10, you could not create 7 objects and destroy 6, as this would be 13 actions, which exceeds the limit.
				 * Suggested minimum: 500.
				 */
				maxObjectsInSet: number,
				/**
				 * A list of identifiers for algorithms registered in the collation registry, as defined in [@!RFC4790], that the server supports for sorting when querying records.
				 */
				collationAlgorithms: string[],
			}
			[ key: string ]: object,
		},
		/**
		 * A map of an account id to an Account object for each account the user has access to.
		 */
		accounts: {
			[ accountId: string ]: {
				/**
				 * A user-friendly string to show when presenting content from this account, e.g., the email address representing the owner of the account.
				 */
				name: string,
				/**
				 * This is true if the account belongs to the authenticated user rather than a group account or a personal account of another user that has been shared with them.
				 */
				isPersonal: boolean,
				/**
				 * This is true if the entire account is read-only.
				 */
				isReadOnly: boolean,
				/**
				 * The set of capability URIs for the methods supported in this account.
				 * Each key is a URI for a capability that has methods you can use with this account.
				 * The value for each of these keys is an object with further information about the account’s permissions and restrictions with respect to this capability,
				 * as defined in the capability’s specification.
				 */
				accountCapabilities: {
					[ uri: string ]: object,
				},
			},
		},
		/**
		 * A map of capability URIs to the account id that is considered to be the user’s main or default account for data pertaining to that capability.
		 */
		primaryAccounts: {
			[ uri: string ]: string,
		},
		/**
		 * The username associated with the given credentials, or the empty string if none.
		 */
		username: string,
		/**
		 * The URL to use for JMAP API requests.
		 */
		apiUrl: string,
		/**
		 * The URL endpoint to use when downloading files, in URI Template (level 1) format [@!RFC6570].
		 */
		downloadUrl: string,
		/**
		 * The URL endpoint to use when uploading files, in URI Template (level 1) format [@!RFC6570].
		 */
		uploadUrl: string,
		/**
		 * The URL to connect to for push events, as described in Section 7.3, in URI Template (level 1) format [@!RFC6570].
		 */
		eventSourceUrl: string,
		/**
		 * A (preferably short) string representing the state of this object on the server.
		 * If the value of any other property on the Session object changes, this string will change.
		 * The current value is also returned on the API Response object, allowing clients to quickly determine if the session
		 * information has changed (e.g., an account has been added or removed), so they need to refetch the object.
		 */
		state: string,
	}

	interface Request {
		/**
		 * The set of capabilities the client wishes to use.
		 */
		using: string[],
		/**
		 * An array of method calls to process on the server.
		 */
		methodCalls: InvocationRequest[],
		/**
		 * A map of a creation id to the id the server assigned when a record was successfully created.
		 */
		createdIds?: Record<string, string>,
	}

	interface Response {
		/**
		 * An array of responses, in the same format as the methodCalls on the Request object.
		 */
		methodResponses: InvocationResponse[],
		/**
		 * A map of a creation id to the id the server assigned when a record was successfully created.
		 */
		createdIds?: Record<string, string>,
		/**
		 * The current value of the “state” string on the Session object
		 */
		sessionState: string,
	}

	type InvocationRequest = {
		[ T in keyof JmapInvocationRequestMap ]: [
			name: T,
			arguments: JmapInvocationRequestMap[ T ],
			methodCallId: string,
		]
	}[ keyof JmapInvocationRequestMap ]

	type InvocationResponse = {
		[ T in keyof JmapInvocationResponseMap ]: [
			name: T,
			arguments: JmapInvocationResponseMap[ T ],
			methodCallId: string,
		]
	}[ keyof JmapInvocationResponseMap ]

	interface Identity {
		id: string,
		name: string,
		email: string,
		replyTo: EmailAddress[] | null,
		bcc: EmailAddress[] | null,
		textSignature: string,
		htmlSignature: string,
		mayDelete: boolean,
	}

	interface EmailAddress {
		name?: string,
		email: string,
	}

	interface EmailAddressGroup {
		name?: string,
		addresses: EmailAddress[],
	}

	interface Mailbox {
		readonly id: string,
		name: string,
		parentId?: string,
		role?: string,
		sortOrder?: number,
		readonly totalEmails: number,
		readonly unreadEmails: number,
		readonly totalThreads: number,
		readonly unreadThreads: number,
		readonly myRights: MailboxRights,
		isSubscribed: boolean,
	}

	interface MailboxRights {
		readonly mayReadItems: boolean,
		readonly mayAddItems: boolean,
		readonly mayRemoveItems: boolean,
		readonly maySetSeen: boolean,
		readonly maySetKeywords: boolean,
		readonly mayCreateChild: boolean,
		readonly mayRename: boolean,
		readonly mayDelete: boolean,
		readonly maySubmit: boolean,
	}

	interface Email {
		readonly id: string,
		readonly blobId: string,
		readonly threadId: string,
		mailboxIds: Record<string, boolean>,
		keywords?: Record<string, boolean>
		readonly size: number,
		readonly receivedAt: string,
		readonly messageId?: string[],
		readonly inReplyTo?: string[],
		readonly references?: string[],
		readonly sender?: EmailAddress[],
		readonly from?: EmailAddress[],
		readonly to?: EmailAddress[],
		readonly cc?: EmailAddress[],
		readonly bcc?: EmailAddress[],
		readonly replyTo?: EmailAddress[],
		readonly subject?: string,
		readonly sentAt?: Date,
		readonly bodyStructure: EmailBodyPart,
		readonly bodyValues: Record<string, EmailBodyValue>,
		readonly textBody: EmailBodyPart[],
		readonly htmlBody: EmailBodyPart[],
		readonly attachments: EmailBodyPart[],
		readonly hasAttachment: boolean,
		readonly preview: string,
	}

	interface EmailBodyPart {
		partId?: string,
		blobId?: string,
		size?: number,
		headers?: EmailHeader[],
		name?: string,
		type: string,
		charset?: string,
		disposition?: string,
		cid?: string,
		language?: string[],
		location?: string,
		subParts?: EmailBodyPart[],
	}

	interface EmailBodyValue {
		value: string
		isEncodingProblem?: boolean
		isTruncated?: boolean
	}

	interface EmailSubmission {
		readonly id: string,
		readonly identityId: string,
		readonly emailId: string,
		readonly threadId: string,
		readonly envelope?: JmapEnvelope,
		readonly sendAt: string,
		readonly undoStatus: 'pending' | 'final' | 'canceled';
		readonly deliveryStatus?: Record<string, JmapDeliveryStatus>,
		readonly dsnBlobIds: string[],
		readonly mdnBlobIds: string[],
	}

}

type JmapUri =
	| 'urn:ietf:params:jmap:core'
	| 'urn:ietf:params:jmap:mail'
	| 'urn:ietf:params:jmap:vacationresponse'
	| 'urn:ietf:params:jmap:submission'
	;

type JmapCoreRequestGet = {
	accountId: string,
	ids?: string[],
	properties?: string[],
}

type JmapCoreResponseGet<T extends object> = {
	accountId: string,
	state: string,
	list: T[],
	notFound: string[],
}

type JmapCoreRequestChanges = {
	accountId: string,
	sinceState: string,
	maxChanges?: number,
}

type JmapCoreResponseChanges = {
	accountId: string,
	oldState: string,
	newState: string,
	hasMoreChanges: boolean,
	created: string[],
	updated: string[],
	destroyed: string[],
}

type JmapCoreRequestSet<T extends object> = {
	accountId: string,
	ifInState?: string,
	create?: Record<string, T>,
	update?: Record<string, JmapPatchObject>,
	destroy?: string[],
}

type JmapCoreResponseSet<T> = {
	accountId: string,
	oldState: string | null
	newState: string,
	created: Record<string, T> | null,
	updated: Record<string, T | null> | null,
	destroyed: string[] | null,
	notCreated: Record<string, JmapCoreError<JmapCoreErrorTypeSet>> | null,
	notUpdated: Record<string, JmapCoreError<JmapCoreErrorTypeSet>> | null,
	notDestroyed: Record<string, JmapCoreError<JmapCoreErrorTypeSet>> | null,
}

type JmapCoreRequestCopy<T extends object> = {
	fromAccountId: string,
	ifFromInState?: string,
	accountId: string,
	ifInState?: string,
	create: Record<string, T>,
	onSuccessDestroyOriginal?: boolean,
	destroyFromIfInState?: string,
}

type JmapCoreResponseCopy<T extends object> = {
	fromAccountId: string,
	accountId: string,
	oldState: string | null,
	newState: string,
	created: Record<string, T> | null,
	notCreated: Record<string, JmapCoreError<JmapCoreErrorTypeCopy>> | null,
}

type JmapCoreRequestQuery<T extends object> = {
	accountId: string,
	filter?: JmapFilterOperator<T> | JmapFilterCondition<T>,
	sort?: JmapComparator[],
	position?: number,
	anchor?: number,
	anchorOffset?: number,
	limit?: number,
	calculateTotal?: boolean,
}

type JmapCoreResponseQuery = {
	accountId: string,
	queryState: string,
	canCalculateChanges: boolean,
	position: number,
	ids: string[],
	total?: number,
	limit?: number,
}

type JmapCoreRequestQueryChanges<T extends object> = {
	accountId: string,
	filter?: JmapFilterOperator<T> | JmapFilterCondition<T>,
	sort?: JmapComparator[],
	sinceQueryState: string,
	maxChanges?: number,
	upToId?: string,
	calculateTotal?: boolean,
}

type JmapCoreResponseQueryChanges = {
	accountId: string,
	oldQueryState: string,
	newQueryState: string,
	total?: number,
	removed: string[],
	added: {
		id: string,
		index: number,
	}[],
}

type JmapCoreError<T extends string = JmapCoreErrorType> = {
	type: T,
	description: string | null,
}

type JmapCoreErrorType =
	| 'serverUnavailable'
	| 'serverFail'
	| 'serverPartialFail'
	| 'unknownMethod'
	| 'invalidArguments'
	| 'invalidResultReference'
	| 'forbidden'
	| 'accountNotFound'
	| 'accountNotSupportedByMethod'
	| 'accountReadOnly'
	;

type JmapCoreErrorTypeSet =
	| JmapCoreErrorType
	| 'forbidden'
	| 'overQuota'
	| 'tooLarge'
	| 'rateLimit'
	| 'notFound'
	| 'invalidPatch'
	| 'willDestroy'
	| 'invalidProperties'
	| 'singleton'
	;

type JmapCoreErrorTypeCopy =
	| JmapCoreErrorType
	| 'alreadyExists'
	;

type JmapFilterOperator<T extends object = {}> = {
	operator: 'AND' | 'OR' | 'NOT',
	conditions: ( JmapFilterOperator<T> | JmapFilterCondition<T> )[],
}

type JmapFilterCondition<T extends object = {}> = Omit<T, 'operator'>;

type JmapComparator = {
	property: string,
	isAscending?: boolean,
	collation?: string,
}

type JmapEnvelope = {
	mailFrom: JmapEnvelopeAddress,
	rcptTo: JmapEnvelopeAddress[],
}

type JmapEnvelopeAddress = {
	email: string,
	parameters?: Record<string, string>,
}

type JmapDeliveryStatus = {
	smtpReply: string,
	delivered: 'queued' | 'yes' | 'no' | 'unknown',
	displayed: 'unknown' | 'yes',
}

interface JmapInvocationRequestMap {

	'Mailbox/get': JmapCoreRequestGet,
	'Mailbox/changes': JmapCoreRequestChanges,
	'Mailbox/query': JmapCoreRequestQuery<JmapApi.Mailbox> & {
		sortAsTree?: boolean,
		filterAsTree?: boolean,
	},
	'Mailbox/queryChanges': JmapCoreRequestQueryChanges<JmapApi.Mailbox>,
	'Mailbox/set': JmapCoreRequestSet<JmapApi.Mailbox> & {
		onDestroyRemoveEmails?: boolean,
	},

	'Thread/get': JmapCoreRequestGet,
	'Thread/changes': JmapCoreRequestChanges,

	'Email/get': JmapCoreRequestGet & {
		bodyProperties?: string[],
		fetchTextBodyValues?: boolean,
		fetchHTMLBodyValues?: boolean,
		fetchAllBodyValues?: boolean,
		maxBodyValueBytes?: number,
	},
	'Email/changes': JmapCoreRequestChanges,
	'Email/query': JmapCoreRequestQuery<{
		inMailbox?: string,
		inMailboxOtherThan?: string[],
		before?: string,
		after?: string,
		minSize?: number,
		maxSize?: number,
		allInThreadHaveKeyword?: string,
		someInThreadHaveKeyword?: string,
		noneInThreadHaveKeyword?: string,
		hasKeyword?: string,
		notKeyword?: string,
		hasAttachment?: boolean,
		text?: string,
		from?: string,
		to?: string,
		cc?: string,
		bcc?: string,
		subject?: string,
		body?: string,
		header?: String[],
	}> & {
		collapseThreads?: boolean,
	},
	'Email/queryChanges': JmapCoreRequestQueryChanges<JmapApi.Email> & {
		collapseThreads?: boolean,
	},
	'Email/set': JmapCoreRequestSet<JmapApi.Email>,
	'Email/copy': JmapCoreRequestCopy<JmapApi.Email>,
	// 'Email/import': ,
	// 'Email/parse': ,

	'Identity/get': JmapCoreRequestGet,

}

interface JmapInvocationResponseMap {

	'error': JmapCoreError<string>,

	'Mailbox/get': JmapCoreResponseGet,
	'Mailbox/changes': JmapCoreResponseChanges & {
		updatedProperties: string[] | null,
	},
	'Mailbox/query': JmapCoreResponseQuery,
	'Mailbox/queryChanges': JmapCoreResponseQueryChanges,
	'Mailbox/set': JmapCoreResponseSet<JmapApi.Mailbox>,

	'Thread/get': JmapCoreResponseGet,
	'Thread/changes': JmapCoreResponseChanges,

	'Email/get': JmapCoreResponseGet<JmapApi.Email>,
	'Email/changes': JmapCoreResponseChanges,
	'Email/query': JmapCoreResponseQuery,
	'Email/queryChanges': JmapCoreResponseQueryChanges,
	'Email/set': JmapCoreResponseSet<JmapApi.Email>,
	'Email/copy': JmapCoreResponseCopy<JmapApi.Email>,
	// 'Email/import': ,
	// 'Email/parse': ,

	'Identity/get': JmapCoreResponseGet<JmapApi.Identity>,

}
