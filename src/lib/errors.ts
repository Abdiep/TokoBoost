// A custom error class for Firestore permission errors.
// This allows us to capture rich contextual information about the
// request that was denied by Firestore Security Rules.
export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
    context: SecurityRuleContext;

    constructor(context: SecurityRuleContext) {
        const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
            context,
            null,
            2
        )}`;
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;

        // This is necessary for transitioning to a custom Error type.
        Object.setPrototypeOf(this, FirestorePermissionError.prototype);
    }
}
