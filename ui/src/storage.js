export const loginSessionKey = "nyingarn-login-session-data";
export const tokenSessionKey = "nyingarn-user-token";

// local storage handlers
export function putLocalStorage({ key, data }) {
    window.localStorage.setItem(key, JSON.stringify(data));
}
export function getLocalStorage({ key }) {
    return JSON.parse(window.localStorage.getItem(key));
}
export function removeLocalStorage({ key }) {
    window.localStorage.removeItem(key);
}
