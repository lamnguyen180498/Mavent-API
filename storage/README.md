### Create Private & Public Key

```bash
openssl genrsa -out api_private.key 2048
```

```bash
openssl rsa -in api_private.key -pubout > api_public.key
```