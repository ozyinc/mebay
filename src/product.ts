import mongoOps, {IDBProduct, IProduct, IUser} from "./mongoOps";
import {Application, IRoute, IState, IUpdateResult, LOAD_ROUTE, RELOAD_USERS, renderTemplate} from "./framework";

interface IProductState extends IState {
    error?: string;
    productQuantities: {
        [key: string]: number,
    }
}

const BUY_PRODUCT = "buy_product";
const INCREASE_QUANTITY = "increase_quantity";
const DECREASE_QUANTITY = "decrease_quantity";
const CLOSE_ERROR = "close_error";
const SET_ERROR = "set_error";
const REMOVE_PRODUCT = "remove_product";
const ADD_PRODUCT = "add_product";

(window as any).BUY_PRODUCT = BUY_PRODUCT;
(window as any).INCREASE_QUANTITY = INCREASE_QUANTITY;
(window as any).DECREASE_QUANTITY = DECREASE_QUANTITY;
(window as any).REMOVE_PRODUCT = REMOVE_PRODUCT;
(window as any).ADD_PRODUCT = ADD_PRODUCT;
(window as any).CLOSE_ERROR = CLOSE_ERROR;

export const PRODUCT_ROUTE = "Products";

export class ProductRoute implements IRoute<IProductState> {
    public appearOnMenu = true;
    public name = PRODUCT_ROUTE;

    private readonly getCurrentUser: () => string;

    constructor(app: Application) {
        this.getCurrentUser = app.getCurrentUser;
    }

    public render(currentState: IProductState): string {
        const currUser = this.getCurrentUser();
        const products = ProductRoute.getProductsOfUsers(currentState.users)
            .map((product) => {
                let actions;
                if (product.sellerName === currUser) {
                    actions = renderTemplate("productOwnerActions", {name: product.name})
                } else {
                    const wanted = this.getProductQuantity(currentState, product.name, product.sellerName);
                    const wallet = currentState.users.find(user => user.username === currUser).wallet;
                    const decrementDisabled = wanted === 0;
                    const incrementDisabled = wanted === product.quantity ||
                        wallet < (wanted + 1) * product.price
                    ;
                    const buyDisabled = wanted === 0
                        || wallet < wanted * product.price
                    ;

                    actions = renderTemplate("productBuyerActions", {
                        name: product.name,
                        sellerName: product.sellerName,
                        wanted: wanted.toString(),
                        // For some reason disableds are rendered small case
                        decrementdisabled: decrementDisabled ? "disabled" : "",
                        incrementdisabled: incrementDisabled ? "disabled" : "",
                        buydisabled: buyDisabled ? "disabled" : "",
                    });
                }
                return renderTemplate("productListRow", {actions, ...(product as any)});
            })
            .join("");
        let error = "";
        if (currentState.error) {
            error = renderTemplate("productListError", {message: currentState.error});
        }
        return renderTemplate("productList", {products, error});
    };

    private setProductQuantity(state: IProductState, name: string, seller: string, change: number) {
        state.productQuantities[`${name}:${seller}`] = (state.productQuantities[`${name}:${seller}`] || 0) + change;
        return state;
    }

    private getProductQuantity(state: IProductState, name: string, seller: string) {
        return state.productQuantities[`${name}:${seller}`] || 0;
    }

    private static getProductsOfUsers(users: IUser[]): IProduct[] {
        return users.reduce((acc, user) => acc.concat(...user.store), []);
    }

    public update(currentState: IProductState, action: string, data?: any): IUpdateResult<IProductState> {
        switch (action) {
            case LOAD_ROUTE:
            case RELOAD_USERS:
                return {state: {...currentState, productQuantities: {}}};
            case INCREASE_QUANTITY:
            case DECREASE_QUANTITY:
                const change = action === INCREASE_QUANTITY ? 1 : -1;
                return {state: this.setProductQuantity(currentState, data.name, data.seller, change)};
            case BUY_PRODUCT:
                return {
                    task: async () => {
                        const products: IProduct[] = ProductRoute.getProductsOfUsers(currentState.users);
                        const result = await mongoOps.buy(
                            this.getCurrentUser(),
                            products.find(product => product.sellerName == data.seller && product.name == data.name),
                            this.getProductQuantity(currentState, data.name, data.seller),
                        );
                        if (result) {
                            return {action: SET_ERROR, body: result};
                        }
                        return {action: RELOAD_USERS};
                    },
                };
            case REMOVE_PRODUCT:
                return {
                    task: async () => {
                        await mongoOps.deleteProduct(this.getCurrentUser(), data);
                        return {action: RELOAD_USERS}
                    },
                };
            case CLOSE_ERROR:
                return {state: {...currentState, error: undefined}};
            case SET_ERROR:
                return {state: {...currentState, error: data}};
            case ADD_PRODUCT:
                return {
                    task: async () => {
                        const product: IDBProduct = {
                            name: $("#newName").val() as string,
                            photo: $("#newUrl").val() as string,
                            price: Number.parseFloat($("#newPrice").val() as string),
                            quantity: Number.parseInt($("#newQuantity").val() as string),
                        };
                        await mongoOps.sell(this.getCurrentUser(), product);
                        return {action: RELOAD_USERS};
                    },
                }
        }
    }

}
