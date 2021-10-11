import { tokenSessionKey, getLocalStorage } from "@/storage";

export default class HTTPService {
    constructor() {}

    getHeaders() {
        try {
            let { token } = getLocalStorage({ key: tokenSessionKey });
            return {
                authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };
        } catch (error) {
            return {
                "Content-Type": "application/json",
            };
        }
    }

    getToken() {
        try {
            let { token } = getLocalStorage({ key: tokenSessionKey });
            return token;
        } catch (error) {}
    }

    encodeRoute(route, method) {
        console.debug(`${method}: ${route}`);
        return encodeURI(route);
    }

    async get({ route }) {
        let headers = this.getHeaders();
        route = this.encodeRoute(route, "GET");
        let response = await fetch(`/api${route}`, {
            method: "GET",
            headers,
        });
        return response;
    }

    async post({ route, body }) {
        route = this.encodeRoute(route, "POST");
        let headers = this.getHeaders();
        let response = await fetch(`/api${route}`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });
        return response;
    }

    async put({ route, body }) {
        route = this.encodeRoute(route, "PUT");
        let response = await fetch(`/api${route}`, {
            method: "PUT",
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        return response;
    }

    async delete({ route }) {
        route = this.encodeRoute(route, "DELETE");
        let response = await fetch(`/api${route}`, {
            method: "delete",
            headers: this.getHeaders(),
        });
        return response;
    }
}
