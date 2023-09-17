import { MS_CONFIG } from '../../common/config';

/** The default HTTP source where the mock json data set is to be retrieved */
export const MOCK_SRC = {
  HOST_URL: 'http://localhost:' + MS_CONFIG.PORT_EXPOSED + '/',
  FILENAME_JSON: 'coding-challenge-input.json',
};
export const MOCK_DATA_URL = MOCK_SRC.HOST_URL + MOCK_SRC.FILENAME_JSON;

/** The list of supported event names the Event Source Service can emit */
export enum EEventName {
  ACCOUNT_UPDATE = 'account-update',
  SERVICE_UPDATE = 'service-event',
  DEFAULT = ACCOUNT_UPDATE,
}

/** The maximum duration in ms between the cast of 2 successive events */
export const EVENT_CASTING_MAX_INTERVAL_MS = 1000;
