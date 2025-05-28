import express, { Router } from "express";
import { UserRoutes } from "../app/modules/user/user.route";
import { AuthRoutes } from "../app/modules/auth/auth.route";
import { DependentRoutes } from "../app/modules/dependents/dependents.route";
import { MessageRoutes } from "../app/modules/message/message.route";
import { CarpoolRoutes } from "../app/modules/carpool/carpool.route";
import { ContactRoutes } from "../app/modules/contact/contact.route";

const router: Router = express.Router();

const apiRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/dependents",
    route: DependentRoutes,
  },
  {
    path: "/chat",
    route: MessageRoutes,
  },
  {
    path:"/carpool",
    route:CarpoolRoutes
  },
  {
    path: "/contact",
    route: ContactRoutes,
  }
];
apiRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
