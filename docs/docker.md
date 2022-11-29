## Docker


#### Build on different platforms

This is included in the `build-production-containers.sh` file

To enable buildx, go to the docker desktop on mac and enable:

```json
"features": {
    "buildkit": true
  }
```

Then `buildx` should work

```bash
docker buildx create --use
echo '>> Building the API code'
docker buildx build --push --platform linux/amd64,linux/arm64 --rm -t arkisto/oni-api:latest -f Dockerfile.api-build .
```
