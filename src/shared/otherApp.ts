/**
 * File marker of a full backup: { app: "komplet", trening: <training backup>, jadlospis: <diet backup> }. Each
 * part keeps the format of the app it came from (Trening and Jadłospis were separate apps before the merge), so
 * old files of either kind still import.
 */
export const COMBINED_APP = 'komplet';
