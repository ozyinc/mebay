import * as jQuery from "jquery";
import "popper.js";
import "bootstrap";
import MongoOps, {IUser} from "./mongoOps";
import mongoOps from "./mongoOps";

// APP LOGIC


interface IState {
    users: IUser[];
}

interface IAppState<T extends IState> {
    currentUser?: string;
    routeState: T;
    isLoading: boolean;
    currentRoute: string;
    users: IUser[];
}

interface ITaskResult {
    action: string;
    body?: any;
}

interface IUpdateResult<T extends IState> {
    state?: T;
    task?: () => Promise<ITaskResult>;
    newUser?: string;
    newRoute?: string;
}

interface IRoute<T extends IState> {
    render: (currentState: T) => string; // Gets state, returns HTML as txt
    update: (currentState: T, action: string, data?: any) => IUpdateResult<T>;
    afterRender?: (state: T) => void;
    name: string;
    appearOnMenu: boolean
}

// NAVBAR

const CHANGE_ROUTE = "redirect";
(window as any).CHANGE_ROUTE = CHANGE_ROUTE;
const RELOAD_USERS = "userReload";
const USERS_RELOADED = "usersReloaded";

class Application {

    private state: IAppState<any>;
    private routes: { [key: string]: IRoute<any> };
    private debug;
    private users: IUser[];

    constructor(debug: boolean = false, user?: string) {
        this.state = {
            routeState: null,
            currentUser: user || undefined,
            currentRoute: null,
            isLoading: true,
            users: [],
        };
        this.routes = {};
        if (debug) {
            this.debug = (...str) => {
                console.log(...str);
            };
        } else {
            this.debug = (..._) => undefined;
        }
    }

    private static renderMenuItem(currentRoute: string, title: string, routeTo: string) {
        return `
        <li class="nav-item ${currentRoute === routeTo ? "active" : ""}">
            <a class="nav-link" href="#" onclick="dispatch(CHANGE_ROUTE, '${routeTo}')">${title}</a>
        </li>`
    }

    private renderNavbar() {
        let content = jQuery("#HeaderTemplate").html();
        if (!this.state.currentUser) {
            return "";
        }
        content = content.replace("{{ username }}", this.state.currentUser);
        const menu_items = Object.keys(this.routes).filter((key: string) => this.routes[key].appearOnMenu).map((key) => {
            return Application.renderMenuItem(this.state.currentRoute, key, key);
        });
        content = content.replace("{{ items }}", menu_items.join(" "));
        return content;
    }

    private updateInternalState(state: IAppState<any>, action: string, data?: any): IUpdateResult<IAppState<any>> {
        switch (action) {
            case CHANGE_ROUTE:
                return {newRoute: data};
            case RELOAD_USERS:
                return {
                    task: async () => {
                        const users = await mongoOps.getState();
                        return {body: users, action: USERS_RELOADED}
                    },
                };
            case USERS_RELOADED:
                this.users = data;
                this.state.routeState.users = data;
        }
    }

    public loadRoute = (newRoute: IRoute<any>) => {
        this.routes[newRoute.name] = newRoute;
    };

    public initialize = (initialRoute: string) => {
        mongoOps.getState().then((users) => {
            this.users = users;
            this.state.currentRoute = initialRoute;
            this.state.routeState = {users};
            this.state.isLoading = false;
            this.dispatch(LOAD_ROUTE);
        })
    };

    public dispatch = (action: string, data?: any) => {
        /*
        * Dispatcher:
        * 1. If there is a task, run it
        * 2. If a user is updated set new user
        * 3. If a new route exists load that route and trigger it's construction, return
        * 4. Update state according to current route
        * 5. Render loaded route
        * */
        let currentRoute = this.routes[this.state.currentRoute];
        this.debug("Action: ", action, "With data: ", data);
        let result = currentRoute.update(this.state.routeState, action, data);
        let route_result = this.updateInternalState(this.state, action, data) || {};

        result = result || {}; // Maybe the action didn't match anything
        result.task = result.task || route_result.task;
        if (result.task) {
            this.debug(`Trigger Task`);
            this.state.isLoading = true;
            result.task().then((task_result: ITaskResult) => {
                this.state.isLoading = false;
                this.debug(`Task done, result: ${JSON.stringify(task_result)}, dispatching action: ${task_result.action}`);
                this.dispatch(task_result.action, task_result.body)
            });
        }
        if (result.newUser !== undefined) {
            this.debug(`Set user to ${result.newUser}`);
            this.state.currentUser = result.newUser;
        }
        let new_route;
        if (result.newRoute) {
            new_route = result.newRoute;
        }
        if (route_result.newRoute) {
            new_route = route_result.newRoute;
        }
        if (new_route) {
            this.debug(`Re-routing app to: ${new_route}`);
            this.state.currentRoute = new_route;
            result.state = result.state || {};
            result.state.users = this.users;
            this.debug(`result.state:`, result.state);
            this.dispatch(LOAD_ROUTE, result.state);
            return;
        }
        if (result.state) {
            this.state.routeState = result.state;
        }
        this.debug(`Rendering on route: ${this.state.currentRoute} with state:`, this.state.routeState);
        jQuery("#header").html(this.renderNavbar());
        if (this.state.isLoading) {
            jQuery("#overlay").show();
        } else {
            jQuery("#innerApp").html(currentRoute.render(this.state.routeState));
            jQuery("#overlay").hide();
        }
        if (currentRoute.afterRender) {
            currentRoute.afterRender(this.state.routeState);
        }
    };

    public getCurrentUser = () => {
        return this.state.currentUser;
    }

}

const renderTemplate = (templateID: string, context?: { [key: string]: string }): string => {
    let template = jQuery(`#${templateID}`).html();
    if (context !== undefined) {
        for (const key of Object.keys(context)) {
            const reg = new RegExp(`{{ ${key} }}`, "g");
            template = template.replace(reg, context[key]);
        }
    }
    return template;
}

const LOAD_ROUTE = "load_route"; // Used when new route is loaded and innerApp can do some ajax

export {
    LOAD_ROUTE,
    IRoute,
    IUpdateResult,
    IAppState,
    IState,
    ITaskResult,
    renderTemplate,
    Application,
    RELOAD_USERS,
    USERS_RELOADED,
};
