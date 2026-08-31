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
import AuthRequired from "./components/AuthRequired";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "dashboard", element: <AuthRequired><Dashboard /></AuthRequired> },
      { path: "create-group", element: <AuthRequired><CreateGroup /></AuthRequired> },
      { path: "group/:groupId", element: <AuthRequired><GroupDetail /></AuthRequired> },
      { path: "group/:groupId/analytics", element: <AuthRequired><Analytics /></AuthRequired> },
      { path: "create-card", Component: CreateCard },
      { path: "join/:groupId", element: <AuthRequired><JoinGroup /></AuthRequired> },
      { path: "invites", element: <AuthRequired><Invites /></AuthRequired> },
      { path: "test", element: <AuthRequired><TestConnection /></AuthRequired> },
      { path: "*", Component: NotFound },
    ],
  },
]);
