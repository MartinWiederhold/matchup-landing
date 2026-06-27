"use client";

import type { SubViewState } from "./appNav";
import ChatDetail from "./subviews/ChatDetail";
import FullProfile from "./subviews/FullProfile";
import EditProfile from "./subviews/EditProfile";
import Settings from "./subviews/Settings";
import GroupDetail from "./subviews/GroupDetail";
import CreateGroup from "./subviews/CreateGroup";
import GameDetail from "./subviews/GameDetail";
import CreateGame from "./subviews/CreateGame";
import GameRequests from "./subviews/GameRequests";
import Comments from "./subviews/Comments";
import CreatePost from "./subviews/CreatePost";
import Support from "./subviews/Support";
import TicketChat from "./subviews/TicketChat";
import CreateTicket from "./subviews/CreateTicket";
import BlockedUsers from "./subviews/BlockedUsers";

export default function SubViewRenderer({
  subView,
}: {
  subView: SubViewState;
}) {
  switch (subView.type) {
    case "chat":
      return <ChatDetail matchId={subView.matchId} />;
    case "full-profile":
      return (
        <FullProfile userId={subView.userId} viewOnly={subView.viewOnly} />
      );
    case "edit-profile":
      return <EditProfile />;
    case "settings":
      return <Settings />;
    case "group-detail":
    case "group-chat":
      return <GroupDetail groupId={subView.groupId} />;
    case "create-group":
      return <CreateGroup />;
    case "game-detail":
      return <GameDetail gameId={subView.gameId} />;
    case "create-game":
      return <CreateGame />;
    case "game-requests":
      return <GameRequests gameId={subView.gameId} />;
    case "comments":
      return <Comments postId={subView.postId} />;
    case "create-post":
      return <CreatePost />;
    case "support":
      return <Support />;
    case "ticket-chat":
      return <TicketChat ticketId={subView.ticketId} />;
    case "create-ticket":
      return <CreateTicket />;
    case "blocked-users":
      return <BlockedUsers />;
    default:
      return null;
  }
}
