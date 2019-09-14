import {Application, IRoute, LOAD_ROUTE} from "./framework";
import {USER_SELECT_ROUTE} from "./userSelect";

export class LogoutRoute implements IRoute<{users}> {
    public appearOnMenu = true;
    public name = "Logout";

    constructor() {
    }

    public render(state) {
        return "";
    }

    public update(state, action: string, data?: any) {
        switch (action) {
            case LOAD_ROUTE:
                return {newRoute: USER_SELECT_ROUTE, newUser: null};
        }
    }
}