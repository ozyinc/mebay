import "./mongoOps";
import {Application} from "./framework";
import UserSelectRoute, {USER_SELECT_ROUTE} from "./userSelect";
import {ProductRoute} from "./product";
import {LogoutRoute} from "./logout";
import UserHomeRoute from "./userHome";

const app = new Application();
app.loadRoute(new UserSelectRoute());
app.loadRoute(new UserHomeRoute(app));
app.loadRoute(new ProductRoute(app));
app.loadRoute(new LogoutRoute());
(window as any).dispatch = app.dispatch;
app.initialize(USER_SELECT_ROUTE);
