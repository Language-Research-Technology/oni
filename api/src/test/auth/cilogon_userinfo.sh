[ ! -f .env ] || export $(grep -v '^#' .env | xargs)

CILOGON_ACCESS_TOKEN=$(jq -r .access_token < cilogon-token-response.json)
#enable refresh tocken in the comanage client
CILOGON_REFRESH_TOKEN=$(jq -r .refresh_token < cilogon-token-response.json)

curl -d access_token=${CILOGON_ACCESS_TOKEN} \
     -d refresh_token=$CILOGON_REFRESH_TOKEN \
  https://test.cilogon.org/oauth2/userinfo
