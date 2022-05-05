[ ! -f .env ] || export $(grep -v '^#' .env | xargs)

echo "${CILOGON_URL}?response_type=code&client_id=${CILOGON_CLIENT_ID}&redirect_uri=${CILOGON_REDIRECT_URI}&scope=openid+profile+email+org.cilogon.userinfo"



