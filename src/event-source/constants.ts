export const MOCK_DATA = {
    HOST_URL: 'http://localhost:3000/',
    FILENAME_JSON: 'coding-challenge-input.json',
}
export const MOCK_DATA_URL_DEFAULT = MOCK_DATA.HOST_URL + MOCK_DATA.FILENAME_JSON;

export enum EventName {
    OC_ACCOUNT_UPDATE = 'account-event',
    SERVICE_UPDATE = 'service-event',
    DEFAULT = OC_ACCOUNT_UPDATE
}