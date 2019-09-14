import {IRoute, IState, IUpdateResult, RELOAD_USERS, renderTemplate} from "./framework";
import mongoOps from "./mongoOps";
import {PRODUCT_ROUTE} from "./product";
import {USER_HOME_ROUTE} from "./userHome";

interface IUserSelectState extends IState {
}

export const USER_SELECT_ROUTE = "user_select";

const ADD_USERS = "add_user";
const DELETE_USER = "deleteUser";
const LOGIN_AS_USER = "loginasuser";
(window as any).ADD_USERS = ADD_USERS;
(window as any).DELETE_USER = DELETE_USER;
(window as any).LOGIN_AS_USER = LOGIN_AS_USER;

export default class UserSelectRoute implements IRoute<IUserSelectState> {
    public name = USER_SELECT_ROUTE;
    public appearOnMenu = false;

    public afterRender(state: IUserSelectState): void {
        return;
    }

    public render(currentState: IUserSelectState): string {
        const items = currentState.users
            .map((user) => renderTemplate("UserSelectRow", {username: user.username}))
            .join("");
        return renderTemplate("UserSelect", {items});
    }

    public update(currentState: IUserSelectState, action: string, data?: any): IUpdateResult<IUserSelectState> {
        switch (action) {
            case ADD_USERS:
                const username = jQuery("#newUsername").val() as string;
                if (!username) {
                    return;
                }
                return {
                    task: async () => {
                        await mongoOps.createUser(username);
                        return {action: RELOAD_USERS};
                    },
                };
            case DELETE_USER:
                return {
                    task: async () => {
                        await mongoOps.deleteUser(data);
                        return {action: RELOAD_USERS};
                    },
                };
            case LOGIN_AS_USER:
                return {
                    newRoute: USER_HOME_ROUTE,
                    newUser: data,
                }
        }
    }
}