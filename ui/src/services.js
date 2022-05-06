
import {
  tokenSessionKey,
  removeLocalStorage,
  getLocalStorage
} from "@/storage";

export function logoutService() {
  //delete this.$store.state.user;
  removeLocalStorage({key: tokenSessionKey});
  removeLocalStorage({key: 'isLoggedIn'});
}

export function isLoggedInService() {
  return getLocalStorage({ key: 'isLoggedIn' });
}
