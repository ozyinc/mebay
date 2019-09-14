import {Application, IRoute, IState, IUpdateResult, RELOAD_USERS, renderTemplate} from "./framework";
import mongoOps, {IOrder, IUser} from "./mongoOps";

interface IUserHomeState extends IState {
}

export const USER_HOME_ROUTE = "Home";
(window as any).USER_HOME_ROUTE = USER_HOME_ROUTE;

export const WITHDRAW = "withdraw";
export const DEPOSIT = "deposit";
export const RATE = "rate";
(window as any).WITHDRAW = WITHDRAW;
(window as any).DEPOSIT = DEPOSIT;
(window as any).RATE = RATE;

export default class UserHomeRoute implements IRoute<IUserHomeState>{

    private readonly getCurrentUser: () => string;

    constructor(app: Application) {
        this.getCurrentUser = app.getCurrentUser;
    }

    private getRatingOfSeller(users: IUser[], sellerName: string): string {
         const rating = users.find(user => user.username=== sellerName).rating;
         if(rating) {
             return rating.toString();
         }
         return "(none)";
    }

    public render(currentState: IUserHomeState) {
        const currUser = currentState.users.find(user => user.username === this.getCurrentUser());
        const orders = currUser.orders.map((order: IOrder) => {
            let rateWidget;
            const {rating, ...rest} = order;
            if (! order.rating) {
                rateWidget = [1,2,3,4,5].map((rating) => {
                    return renderTemplate("userOrderRatingRadio", {...rest, rating: rating.toString()});
                }).join("");
                rateWidget += renderTemplate("userOrderRatingSubmitButton", {...rest});
            } else {
                rateWidget = `Rated: ${order.rating}`;
            }
            return renderTemplate("userOrderRow", {...rest, sellerRating: this.getRatingOfSeller(currentState.users, rest.sellerName), rateWidget});
        }).join("");

        return renderTemplate("userHomePage", {balance: currUser.wallet.toString(), orders, username: currUser.username});
    }
    public update(currentState, action: string, data?: any) {
        switch (action) {
            case WITHDRAW:
                return {task: async () => {
                    const amount = Number.parseInt($("#userMoneyInput").val() as string);
                    await mongoOps.withdrawMoney(this.getCurrentUser(), amount);
                    return {action: RELOAD_USERS};
                    }};
            case DEPOSIT:
                return {task: async () => {
                    const amount = Number.parseInt($("#userMoneyInput").val() as string);
                    await mongoOps.depositMoney(this.getCurrentUser(), amount);
                    return {action: RELOAD_USERS};
                    }};
            case RATE:
                return {task: async () => {
                    const rawVal = $("input[name='" + data.sellerName + "-" + data.productName + "-rating']:checked").val();
                    const rating = Number.parseInt(rawVal as string);
                    await mongoOps.rate(this.getCurrentUser(), data.productName, data.sellerName, rating);
                    return {action: RELOAD_USERS};
                    }}
        }
    }
    public name = USER_HOME_ROUTE;
    public appearOnMenu = true;
}