import ShellComponent from "@/components/Shell.component.vue";
import UserComponent from "@/components/User.component.vue";
import LoginComponent from "@/components/Login.component.vue";
import WelcomeComponent from "@/components/Welcome.component.vue";
import HelpComponent from "@/components/Help.component.vue";
import CallbackOauthLogin from "@/components/authentication/OauthCallback.component.vue";

import HTTPService from "./http.service";
import { createRouter, createWebHistory } from "vue-router";
import {
  loginSessionKey,
  tokenSessionKey,
  putLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from "@/components/storage";

const routes = [
  {
    path: "/",
    name: "root",
    component: ShellComponent,
    children: [ {
      path: "welcome",
      name: "welcome",
      component: WelcomeComponent
    }, {
      path: "help",
      name: "help",
      component: HelpComponent
    }, {
      path: "user",
      name: "user",
      component: UserComponent,
      meta: {
        requiresAuth: true,
      },
      children: [],
    }, {
      path: "/login",
      name: "login",
      component: LoginComponent
    } ],
  },
  {
    name: "callback-github-login",
    path: "/auth/github/callback",
    component: CallbackOauthLogin,
  },
  {
    name: "callback-ci-login",
    path: "/auth/ci/callback",
    component: CallbackOauthLogin,
  }
];

const router = createRouter({
  history: createWebHistory("/"),
  routes,
});
router.beforeEach(onAuthRequired);

async function onAuthRequired(to, from, next) {
  const httpService = new HTTPService({router, loginPath: '/login'});
  let isAuthed = await httpService.get({ route: "/authenticated" });
  if (isAuthed.status === 200) {
    putLocalStorage({ key: 'isLoggedIn', data: true });
  }
  if (isAuthed.status === 200 && to.path === "/login") {
    return next({ path: "/" });
  }
  if (to.meta?.requiresAuth) {
    console.log(`requires Auth ${ to.path }`);
    try {
      if (isAuthed.status === 401 && from.path !== "/login") return next({ path: "/login" });
    } catch (error) {
      if (from.path !== "/login") return next({ path: "/login" });
    }
  }
  next();
}

export default router;
