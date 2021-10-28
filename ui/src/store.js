import { cloneDeep } from "lodash";
import { createStore } from "vuex";

const mutations = {
    reset: (state) => {
        state = cloneDeep(resetState());
    },
};

const actions = {};

export const store = new createStore({
    state: resetState(),
    mutations,
    actions,
    modules: {},
    // plugins: [vuexLocal.plugin],
});

function resetState() {
    return {};
}