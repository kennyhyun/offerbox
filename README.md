# OfferBox

## Goals

- As a user, I want to find a deal for the specific item
  - In Coles/Woolworths weekly catalogs
  - Can check previous deals for see the trend
- As a user, I want to find half price items for this week (today)
  - no duplicates items in variations
  - Sort/Filter by
    - Discount ratio
    - Category

## Bootstraping the project

### Cloning the repo

This includes sumbodule(s) so you will need init those.

```
$ git submodule init
$ git submodule update
```

Or alternatively, clone with the `--recurse-submodules` option

```
$ git clone --recurse-submodules git@github.com:kennyhyun/pobox.git
``` 

### Running

```
$ yarn && yarn bootstrap
```

`storage/.env` is required for the minio. Copy storage/.env.sample to storage/.env before starting.

```
$yarn start
```

This is running traefik with nginx, minio, and thumbnail generator for now.

### Config

To allow public access to the bucket, refer https://github.com/kennyhyun/nodejs-s3-thumbnail-generator#make-the-minio-bucket-public

## TODOs

- [ ] Sign in/up
- [ ] Web crawler
- [ ] Discover deals (list w/ link)
- [ ] Backend database and APIs

## License

MIT
