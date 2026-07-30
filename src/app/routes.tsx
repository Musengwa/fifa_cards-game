import { createBrowserRouter } from "react-router";
import Root from "./pages/Root";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import CreateGroup from "./pages/CreateGroup";
import GroupDetail from "./pages/GroupDetail";
import JoinGroup from "./pages/JoinGroup";
import Invites from "./pages/Invites";
import Analytics from "./pages/Analytics";
import CreateCard from "./pages/CreateCard";
import TestConnection from "./pages/TestConnection";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "dashboard", Component: Dashboard },
      { path: "create-group", Component: CreateGroup },
      { path: "group/:groupId", Component: GroupDetail },
      { path: "group/:groupId/analytics", Component: Analytics },
      { path: "create-card", Component: CreateCard },
      { path: "join/:groupId", Component: JoinGroup },
      { path: "invites", Component: Invites },
      { path: "test", Component: TestConnection },
      { path: "*", Component: NotFound },
    ],
  },
]);