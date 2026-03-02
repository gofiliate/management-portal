# Setup 

The following is a step by step guide of how we initialised our One True Portal. Meant as a guide to recreated the setup.

## App Creation

Create a new Angular Application from the CLI, include `routing` flag and `scss` as the style.

```
ng new one-true-portal --routing --style=scss
```


## Migrating Base Template Styles

Follow the steps below to quickly copy the template style sheets from the existing `affiliate-portal` repository.



### Generic Enviroment

```
cp -r {/path/to/affiliate-portal}/src/assets/* {/path/to/one-true-portal}/src/assets

```

### Current Dev Enviroment

```
cp -r /Users/dav/development/angular/affiliate_portal/src/assets/* /Users/dav/development/angular/one-true-portal/src/assets

```

## Pre-install Style Package References

```
npm install bootstrap@latest
ng add @angular/material [Indigo/Pink -> N global Angular Material typography -> Enable Animation]
npm install @mdi/font
```

## Copy `styles.scss` from Base Template

### Generic Dev Enviroment

```
cp  {/path/to/affiliate-portal}/src/styles.scss {/path/to/one-true-portal}/one-true-portal/src/styles.scss
```

### Current Dev Enviroment

```
cp  /Users/dav/development/angular/affiliate_portal/src/styles.scss /Users/dav/development/angular/one-true-portal/src/styles.scss

```


## Create `environments`

Alternatively you can use the GUI for this step and not have to change permissions

```
# Define your environment user and group (macOS / Linux)
user="dav"
group="staff"

# Create the directory
mkdir -p {/path/to/one-true-portal}/environments

# Change the ownership
sudo chown "$user:$group" {/path/to/one-true-portal}/environments
```

### `environment.ts`

```
export const environment = {
  production: false,
  mode: 'group-admin',
  api: "http://api.gofiliate.localhost:8081"
};
```

### `environment.prod.ts`

```
export const environment = {
  production: true,
  mode: 'group-admin',
  api: "http://api.gofiliate.localhost:8081"
};
```

## Handle Modes

Create a `service` to handle the application mode

```
ng generate service services/mode
```

### Boilerplate initial version

```
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModeService {
  private mode = environment.mode;
  private baseApi = environment.api;

  constructor() {}

  getMode(): string {
    return this.mode;
  }

  getApiUrl(path: string): string {
    return `${this.baseApi}/${this.mode}/${path}`;
  }
}
```

## Setup rudimentary AuthGuard for routing

Create a `guard` to police the routing between `modes`.

```
ng generate guard guards/auth [CanActivate]
```

### Boilerplate initial example

```
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('bearer'); // or use a dedicated AuthService

    if (!token) {
      this.router.navigate(['/sign-in']);
      return false;
    }

    return true;
  }
}


```

## Start constructing layout structure

Create the following `components` to handle our layout in different portal modes

```
ng generate component layouts/logged-out
ng generate component layouts/logged-in
ng generate component layouts/public

```

## Create Base Components for Dashboards and base routing

```
ng generate component components/dashboards/public-dashboard
ng generate component components/dashboards/admin-dashboard
ng generate component components/dashboards/affiliate-dashboard
ng generate component components/dashboards/group-admin-dashboard
ng generate component components/account/sign-in
ng generate component components/dashboards/dynamic-dashboard-loader

```






