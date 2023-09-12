/** The HTTP source where the mock json data set is to be retrieved */
export const MOCK_DATA = {
  HOST_URL: 'http://localhost:3000/',
  FILENAME_JSON: 'coding-challenge-input.json',
};
export const MOCK_DATA_URL = MOCK_DATA.HOST_URL + MOCK_DATA.FILENAME_JSON;

/** The list of supported event names the Event Source Service can emit */
export enum EEventName {
  OC_ACCOUNT_UPDATE = 'account-event',
  SERVICE_UPDATE = 'service-event',
  DEFAULT = OC_ACCOUNT_UPDATE,
}

/** The maximum duration in ms between the cast of 2 successive events */
export const EVENT_CASTING_MAX_INTERVAL_MS = 1000;
