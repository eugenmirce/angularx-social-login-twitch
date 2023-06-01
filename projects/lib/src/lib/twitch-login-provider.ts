import { BaseLoginProvider } from '@abacritt/angularx-social-login';
import { SocialUser } from '@abacritt/angularx-social-login';
import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { UtilsService } from './utils.service';

export interface TwitchInitOptions {
    /**
     * Your app’s registered redirect URI. The access token is sent to this URI.
     * Make sure they match or the authentication will not work.
     */
    redirectUri: string;
    /**
     * Set to true to force the user to re-authorize your app’s access to their resources.
     * The default is false.
     */
    forceVerify?: boolean;
    /**
     * Must be set to token
     * (We are using the implicit grant authentication flow)
     */
    responseType?: string;
    /**
     * A list of scopes. The APIs that you’re calling identify the scopes you must list.
     */
    scopes: string | string[];
}

export class TwitchLoginProvider extends BaseLoginProvider {

    public static readonly PROVIDER_ID: string = 'TWITCH';

    private static readonly TWITCH_AUTH_URL: string = 'https://id.twitch.tv/oauth2/authorize';
    private static readonly TWITCH_TOKEN_VALIDATE_URL: string = 'https://id.twitch.tv/oauth2/validate';
    private static readonly TWITCH_REVOKE_TOKEN: string = 'https://id.twitch.tv/oauth2/revoke';
    private static readonly TWITCH_USER_URL: string = 'https://api.twitch.tv/helix/users';

    constructor(
        private clientId: string,
        private readonly initOptions: TwitchInitOptions,
    ) {
        super();
    }

    initialize(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Gets the logged in socialUser details
     * @returns SocialUser
     */
    getLoginStatus(): Promise<SocialUser> {
        return new Promise((resolve, reject) => {
            const accessToken = this.retrieveToken();
            if (accessToken) {
                //Check if the token is still valid
                this.isValid(accessToken).then((isValid) => {
                    if (isValid) {
                        resolve(this.getUserInformation(accessToken))
                    } else {
                        //Clear token since it is invalid
                        this.clearToken();
                        reject(`Access token for ${TwitchLoginProvider.PROVIDER_ID} is not valid`);
                    }
                });
            } else {
                reject(`No user is currently logged in with ${TwitchLoginProvider.PROVIDER_ID}`);
            }
        });
    }

    /**
     * Opens the popup window for Twitch authentication
     * @returns SocialUser
     */
    signIn(): Promise<SocialUser> {
        return new Promise(async (resolve, reject) => {
            const popupWidth = 500;
            const popupHeight = 600;
            const left = window.screen.width / 2 - popupWidth / 2;
            const top = window.screen.height / 2 - popupHeight / 2;

            const popupWindow = window.open(
                this.getAuthorizationUrl(),
                'twitch-popup',
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
            );

            if (popupWindow) {
                const checkAccessToken = setInterval(() => {
                    try {
                        if (popupWindow.closed) {
                            clearInterval(checkAccessToken);
                            reject('Twitch authentication window was closed.');
                        }

                        if (popupWindow.location.origin === window.location.origin) {
                            clearInterval(checkAccessToken);
                            popupWindow.close();

                            const hash = popupWindow.location.hash;
                            if (hash) {
                                const urlParams = new URLSearchParams(hash.replace('#', '?'));
                                const accessToken = urlParams.get('access_token');

                                if (accessToken) {
                                    this.persistToken(accessToken);
                                    this.getUserInformation(accessToken)
                                        .then((socialUser) => {
                                            this.persistToken(accessToken);
                                            resolve(socialUser);
                                        })
                                        .catch((error) => {
                                            reject(error);
                                        });
                                } else {
                                    reject('Twitch authentication failed.');
                                }
                            } else {
                                //If no hash was found than probably an error might have happened
                                const urlParams = new URLSearchParams(popupWindow.location.search);
                                if (urlParams.get('error')) {
                                    reject(`Twitch authentication failed: ${urlParams.get('error_description')}`);
                                }
                            }
                        }
                    } catch (error: any) {
                        const errorMessage = error.toString();
                        //Ignore the blocked a frame since it happens because of Cross Origin requests
                        if (!errorMessage.includes('Blocked a frame with origin')) {
                            reject(`Twitch authentication failed: ${errorMessage}`);
                            clearInterval(checkAccessToken);
                            popupWindow.close();
                        }
                    }
                }, 100);
            } else {
                reject('Unable to open Twitch authentication popup window.');
                return;
            }
        });
    }

    /**
     * Logout user and revoke token
     */
    signOut(): Promise<void> {
        return new Promise((resolve, reject) => {
            const accessToken = this.retrieveToken();

            if (accessToken) {
                //Attempt to revoke token first
                this.revokeToken(accessToken)
                    .then(() => {
                        this.clearToken();
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } else {
                reject(`No user is currently logged in with ${TwitchLoginProvider.PROVIDER_ID}`);
            }

        })
    }

    /**
     * Get user details from Twitch
     * @param accessToken the accessToken
     * @returns SocialUser
     */
    private getUserInformation(accessToken: string): Promise<SocialUser> {
        return new Promise((resolve, reject) => {
            const headers = new HttpHeaders()
                .set('Authorization', 'Bearer ' + accessToken)
                .set('Client-Id', this.clientId);

            UtilsService.sendRequest(TwitchLoginProvider.TWITCH_USER_URL, 'GET', headers)
                .then(response => {
                    let data = response.data[0];
                    const socialUser = {
                        provider: TwitchLoginProvider.PROVIDER_ID,
                        id: data.id,
                        name: data.display_name,
                        email: data.email,
                        authToken: accessToken,
                        idToken: '',
                        authorizationCode: '',
                        photoUrl: data.profile_image_url,
                        firstName: '',
                        lastName: '',
                        response: '',
                    }
                    resolve(socialUser);
                }, error => {
                    reject(error);
                })
        });
    }

    /**
     * Check if accessToken is valid
     * @param accessToken the accessToken
     * @returns boolean [true|false]
     */
    private isValid(accessToken: string): Promise<boolean> {
        return new Promise((resolve) => {
            const headers = new HttpHeaders()
                .set('Authorization', 'OAuth ' + accessToken);

            UtilsService.sendRequest(TwitchLoginProvider.TWITCH_TOKEN_VALIDATE_URL, 'GET', headers)
                .then(() => {
                    resolve(true);
                }, () => {
                    resolve(false);
                });
        });
    }

    /**
     * Save token in localStorage
     * @param token the accessToken
     */
    persistToken(token: string) {
        localStorage.setItem(`${TwitchLoginProvider.PROVIDER_ID}_token`, token);
    }

    /**
     * Retrieve token from localStorage
     * @returns String
     */
    retrieveToken() {
        return localStorage.getItem(`${TwitchLoginProvider.PROVIDER_ID}_token`);
    }

    /**
     * Remove token from localStorage
     */
    clearToken() {
        localStorage.removeItem(`${TwitchLoginProvider.PROVIDER_ID}_token`);
    }

    /**
     * Constructs the authorization url with the needed and optional parameters
     * @returns String
     */
    private getAuthorizationUrl(): string {
        let scope;
        if (Array.isArray(this.initOptions.scopes)) {
            scope = this.initOptions.scopes.join(',');
        } else {
            scope = this.initOptions.scopes;
        }
        const params = new HttpParams()
            .set('client_id', this.clientId)
            .set('force_verify', this.initOptions.forceVerify || 'false')
            .set('redirect_uri', this.initOptions.redirectUri)
            .set('response_type', this.initOptions.responseType || 'token')
            .set('scope', scope);
        let request = new HttpRequest('GET', TwitchLoginProvider.TWITCH_AUTH_URL, null, {params});

        return request.urlWithParams;
    }

    /**
     * Revoke token request
     * @param accessToken the accessToken
     */
    private revokeToken(accessToken: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const headers = new HttpHeaders()
                .set('Content-Type', 'application/x-www-form-urlencoded')
            const params = new HttpParams()
                .set('client_id', this.clientId)
                .set('token', accessToken)
            UtilsService.sendRequest(TwitchLoginProvider.TWITCH_REVOKE_TOKEN, 'POST', headers, params)
                .then(() => {
                    resolve();
                }, error => {
                    reject(error);
                })
        });
    }
}