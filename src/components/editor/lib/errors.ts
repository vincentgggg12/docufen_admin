export class DocumentLockedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentLockedException";
    Object.setPrototypeOf(this, DocumentLockedException.prototype);
  }
}

export class UnableToLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnableToLockError";
    Object.setPrototypeOf(this, UnableToLockError.prototype);
  }
}

export class BusyException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusyException";
    Object.setPrototypeOf(this, BusyException.prototype);
  }
}

export class NoCommentsSelected extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoCommentsSelected";
    Object.setPrototypeOf(this, NoCommentsSelected.prototype);
  }
}

export class FileNotSaved extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileNotSaved";
    Object.setPrototypeOf(this, FileNotSaved.prototype);
  }
}

export class FileNotUploaded extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileNotUploaded";
    Object.setPrototypeOf(this, FileNotUploaded.prototype);
  }
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}

export class StaleSessionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaleSessionException";
    Object.setPrototypeOf(this, StaleSessionException.prototype);
  }
}

export class NotLoggedInError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotLoggedInError";
    Object.setPrototypeOf(this, NotLoggedInError.prototype);
  }
}

export class DocumentSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentSyncError";
    Object.setPrototypeOf(this, DocumentSyncError.prototype);
  }
}

export class UploadFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadFileError";
    Object.setPrototypeOf(this, UploadFileError.prototype);
  }
}

export class DocumentAlteredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentAlteredError";
    Object.setPrototypeOf(this, DocumentAlteredError.prototype);
  }
}

export class TableNotSelectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TableNotSelectedError";
    Object.setPrototypeOf(this, TableNotSelectedError.prototype);
  }
}

export class CellNotEmptyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CellNotEmptyError";
    Object.setPrototypeOf(this, CellNotEmptyError.prototype);
  }
}

export class DialogAlreadyOpen extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DialogAlreadyOpen";
    Object.setPrototypeOf(this, DialogAlreadyOpen.prototype);
  }
}

export class UserNotConfigured extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserNotConfigured";
    Object.setPrototypeOf(this, UserNotConfigured.prototype);
  }
}

export class InTableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InTableError"
    Object.setPrototypeOf(this, InTableError.prototype)
  }
}

export class TryingToEditSignature extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TryingToEditSignature"
    Object.setPrototypeOf(this, TryingToEditSignature.prototype)
  }
}

export class SigningTwiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SigningTwiceError"
    Object.setPrototypeOf(this, SigningTwiceError.prototype)
  }
}

export class UnsuportedFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnsupportedFileError"
    Object.setPrototypeOf(this, UnsuportedFileError.prototype)
  }
}

export class NoWritePermissions extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NoWritePermissions"
    Object.setPrototypeOf(this, NoWritePermissions.prototype)
  }
}

export class AttachmentTooLarge extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentTooLarge";
    Object.setPrototypeOf(this, AttachmentTooLarge.prototype);
  }
}

export class MultipleParaGraphsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MultipleParaGraphsError";
    Object.setPrototypeOf(this, MultipleParaGraphsError.prototype);
  }
}

export class AttachmentCorrectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentCorrectionError";
    Object.setPrototypeOf(this, AttachmentCorrectionError.prototype);
  }
}
