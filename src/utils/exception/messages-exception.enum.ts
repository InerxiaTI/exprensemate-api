export enum MESSAGES_EXCEPTION {
  REQUEST_CLIENT_EXCEPTION = 'REQUEST_CLIENT_EXCEPTION',
  BUSINESS_EXCEPTION = 'BUSINESS_EXCEPTION',
  BUSINESS_EXCEPTION_PROVIDER_DUPLICATED = 'BUSINESS_EXCEPTION_PROVIDER_DUPLICATED',
  SERVER_EXCEPTION = 'SERVER_EXCEPTION',
  SERVER_EXCEPTION_MESSAGE = 'SERVER_EXCEPTION_MESSAGE',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  PURCHASE_NOT_FOUND = 'Purchase does not exist.',
  MEMBER_NOT_FOUND = 'Member does not exist.',
  LIST_NOT_FOUND = 'The list does not exist.',
  CATEGORY_NOT_FOUND = 'The category does not exist.',
  USER_NOT_ACTIVE = 'The user is not active.',
  USER_NOT_FOUND = 'The user does not exist.',
  PERMISSIONS_NOT_FOUND = 'PERMISSIONS_NOT_FOUND',
  DATA_DUPLICATE_EXCEPTION = 'DATA_DUPLICATE_EXCEPTION',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  DUPLICATE_USER_ON_PURCHASE_LIST = 'Duplicate user on purchase list.',
  PERCENT_NOT_ALLOWED = 'Percent not allowed.',
  AMOUNT_NOT_ALLOWED = 'Amount not allowed.',
  ADD_PURCHASE_NOT_ALLOWED = 'Add purchase not allowed.',
  ADD_COLLABORATOR_NOT_ALLOWED = 'Add collaborator not allowed.',
  ENABLE_COLLABORATOR_NOT_ALLOWED = 'Enable collaborator not allowed.',
  SUM_OF_PERCENTAGES_EXCEEDS_100_PERCENT = 'SUM_OF_PERCENTAGES_EXCEEDS_100_PERCENT',
  TOTAL_PERCENTAGES_MUST_BE_100_PERCENT = 'Total percentages must be 100 percent.',
  PARTNER_REQUEST_REJECTED = 'Partner request rejected.',
  REQUEST_ALREADY_APPROVED = 'Request already approved.',
  REQUEST_HAS_NOT_BEEN_APPROVED = 'Request has not been approved.',
  PERCENT_CHANGE_TO_CREATOR_NOT_ALLOWED = 'PERCENT_CHANGE_TO_CREATOR_NOT_ALLOWED',
  CHANGE_REQUEST_STATUS_TO_CREATOR_NOT_ALLOWED = "Changing the status of the creator's request is not allowed.",
  NOT_ALLOWED_ENABLE = 'Approve/Reject is not allowed because it is not the creating user.',
  HAS_PENDING_REQUESTS = 'It is not allowed to start the list with pending requests.',
}
