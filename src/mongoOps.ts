import * as stitch from "mongodb-stitch-browser-sdk";


export interface IDBProduct {

    name: string;
    photo: string;
    price: number;
    quantity: number;
}

export interface IProduct extends IDBProduct {
    sellerName: string;
    sellerRating: number;
}

export interface IOrder {
    productName: string;
    sellerName: string;
    rating: number | null;
}

interface IDBUser {

    username: string;
    wallet: number;
    rating: number | null;
    store: IDBProduct[];
    orders: IOrder[];
}

export interface IUser {
    username: string;
    wallet: number;
    rating: number | null;
    store: IProduct[];
    orders: IOrder[];
}

class MongoOps {
    private users: stitch.RemoteMongoCollection<IDBUser>;
    private readonly initPromise;

    constructor() {

        const client = stitch.Stitch.initializeDefaultAppClient("cloud-frontend-lsbbq");
        this.initPromise = client.auth.loginWithCredential(new stitch.AnonymousCredential());
        const db = client.getServiceClient(stitch.RemoteMongoClient.factory, "mongodb-atlas").db("meBay");
        this.users = db.collection<IDBUser>("users");
    }

    public createUser = async (username: string) => {
        await this.initPromise;
        await this.users.insertOne({username, orders: [], store: [], rating: null, wallet: 0});
    };

    public deleteUser = async (username: string) => {
        await this.initPromise;
        await this.users.deleteOne({username});
    };

    public getState = async (): Promise<IUser[]> => {
        await this.initPromise;
        const users_ = await this.users.find({}, {projection: {_id: 0}}).asArray();
        return users_.map((user) => {
            const newUser: IUser = {
                ...user,
                store: user.store.map((item) => {
                    return {...item, sellerName: user.username, sellerRating: user.rating}
                }),
            };
            return newUser;
        });
    };

    public getUser = async (username: string) => {
        await this.initPromise;
        return await this.users.findOne({username});
    };

    public depositMoney = async (username: string, amount: number) => {
        await this.initPromise;
        await this.users.findOneAndUpdate({username}, {$inc: {wallet: amount}});
    };

    public withdrawMoney = async (username: string, amount: number) => {
        await this.depositMoney(username, -1 * amount);
    };

    public buy = async (username: string, product: IProduct, amount: number): Promise<string | null> => {
        await this.initPromise;
        const totalPrice = product.price * amount;
        if (product.quantity < amount) {
            return `Quantity ${product.quantity} lower than amount${amount}`;
        }
        const buyer = await this.users.findOne({username});
        if (buyer.wallet < totalPrice) {
            return `You can not afford this, total price is: ${totalPrice} while you have ${buyer.wallet}`;
        }

        const newOrder = {
            sellerName: product.sellerName,
            productName: product.name,
            rating: null,
        };
        await this.users.findOneAndUpdate({username: buyer.username}, {
            $inc: {wallet: -totalPrice},
            $push: {orders: newOrder},
        });

        const seller = await this.users.findOneAndUpdate({username: product.sellerName}, {$inc: {wallet: totalPrice}});
        const newStore = seller.store.map((prod) => {
            if (product.name === prod.name) {
                return {...prod, quantity: prod.quantity - amount};
            }
            return prod;
        });
        await this.users.findOneAndUpdate({username: seller.username}, {$set: {store: newStore}});
        return null;
    };

    public sell = async (username: string, product: IDBProduct) => {
        await this.initPromise;
        await this.users.findOneAndUpdate({username}, {$push: {store: product}});
    };

    public rate = async (username: string, productName: string, productSellerName: string, rating: number) => {
        await this.initPromise;

        const buyer = await this.users.findOne({username});
        let success = false;
        const newOrders = buyer.orders.map((order) => {
            if (order.sellerName === productSellerName && order.productName === productName && order.rating === null) {
                success = true;
                return {...order, rating};
            }
            return order;
        });
        if (!success) {
            debugger;
            return;
        }
        await this.users.findOneAndUpdate({username}, {$set: {orders: newOrders}});
        const userResults = await this.users.find({orders: {$elemMatch: {sellerName: productSellerName}}}).asArray();
        const ordersOfSeller = userResults.reduce((acc, user) => [...acc, ...user.orders.filter(order => order.sellerName === productSellerName)], [])
        const ratingSum = ordersOfSeller.reduce((acc, order: IOrder) => order.rating ? order.rating + acc : acc, 0);
        const ratingCount = ordersOfSeller.reduce((acc, order: IOrder) => order.rating ? 1 + acc : acc, 0);
        const newRating = ratingCount === 0 ? null : ratingSum / ratingCount;
        debugger;
        await this.users.findOneAndUpdate({username: productSellerName}, {$set: {rating: newRating}});

    };
    public deleteProduct = async (username: string, productName: string) => {
        await this.initPromise;
        await this.users.findOneAndUpdate({username}, {$pull: {store: {name: productName}}});
    }
}

const mongoOps = new MongoOps();
export default mongoOps;