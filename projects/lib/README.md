# Twitch Angular Social Login

## Description
Twitch social login extension for [@abacritt/angularx-social-login](https://github.com/abacritt/angularx-social-login) Angular Library.

## Installation

### Install via npm
```bash
npm i @abacritt/angularx-social-login @eugenmirce/anguarx-social-login-twitch
```
Also installing the angularx-social-login module as it is a dependency.


### Import the module
Import the `angularx-social-login` modules needed for the social login.  
Add `SocialLoginModule` and `SocialAuthServiceConfig` in your `AppModule`. Then import the `TwitchLoginProvider` and then configure the `SocialLoginModule` with the `TwitchLoginProvider`.
```javascript
import {SocialLoginModule, SocialAuthServiceConfig} from '@abacritt/angularx-social-login';
import {TwitchLoginProvider} from '@eugenmirce/angularx-social-login-twitch';

@NgModule({
  declarations: [
    ...
  ],
  imports: [
    ...
      SocialLoginModule
  ],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: TwitchLoginProvider.PROVIDER_ID,
            provider: new TwitchLoginProvider(
              'YOUR_CLIENT_ID',
              {
                redirectUri: 'YOUR_REDIRECT_URL',
                scopes: ['user:read:email']
              }
            )
          }
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    }],
  // other module configurations
})
export class AppModule { }
```

### Sign in with Twitch

```javascript

import { SocialAuthService } from "@abacritt/angularx-social-login";
import { TwitchLoginProvider } from "@eugenmirce/angularx-social-login-twitch";

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent {

  constructor(private authService: SocialAuthService) { }

signInWithTwitch(): void {
  this.authService.signIn(TwitchLoginProvider.PROVIDER_ID);
}

signOut(): void {
  this.authService.signOut();
}
}
```

### Specifying custom scopes
```javascript
const twitchInitOptions: {
  redirectUri: 'YOUR_REDIRECT_URI',
  scopes: ['user:read:email'], // To get access to logged in user email information
  forceVerify: false, // Force the user to re-authorize on each login [default is false]
  responseType: 'token' // Use token for implicit grant authentication flow that is the one supported
};
```
You can use them in the `AppModule`
```javascript
...
providers: [
  {
    id: TwitchLoginProvider.PROVIDER_ID,
    provider: new TwitchLoginProvider(
      'YOUR_CLIENT_ID', twitchInitOptions
    )
  }
]
...
```

### Check our other social login providers in Angular

| Name                          | Repository                                                            | NPM                                                                            |
|-------------------------------|-----------------------------------------------------------------------|--------------------------------------------------------------------------------|
| angularx-social-login-discord | [Github](https://github.com/eugenmirce/angularx-social-login-discord) | [npm](https://www.npmjs.com/package/@eugenmirce/angularx-social-login-discord) |
| angularx-social-login-spotify | [Github](https://github.com/eugenmirce/angularx-social-login-spotify) | [npm](https://www.npmjs.com/package/@eugenmirce/angularx-social-login-spotify) |
