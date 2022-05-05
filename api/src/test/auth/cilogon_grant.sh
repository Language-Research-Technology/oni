[ ! -f .env ] || export $(grep -v '^#' .env | xargs)

curl -d grant_type=authorization_code \
     -d client_id=$CILOGON_CLIENT_ID \
     -d client_secret=$CILOGON_CLIENT_SECRET \
     -d code=$CILOGON_CODE \
     -d redirect_uri=$CILOGON_REDIRECT_URI \
  https://cilogon.org/oauth2/token \
  > cilogon-token-response.json
