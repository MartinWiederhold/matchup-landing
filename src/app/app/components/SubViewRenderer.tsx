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
import GameReview from "./subviews/GameReview";
import TennisLive from "./subviews/TennisLive";
import GameResult from "./subviews/GameResult";
import Leaderboard from "./subviews/Leaderboard";
import BrowsePeople from "./subviews/BrowsePeople";
import ExpensesView from "./subviews/ExpensesView";
import ScheduleView from "./subviews/ScheduleView";
import TourProfileEdit from "./subviews/TourProfileEdit";
import TourPlayers from "./subviews/TourPlayers";
import TourPlayerView from "./subviews/TourPlayerView";
import TourDeadlines from "./subviews/TourDeadlines";
import TourVisa from "./subviews/TourVisa";
import TourPlanner from "./subviews/TourPlanner";
import ServicesHub from "./subviews/ServicesHub";
import TourTournament from "./subviews/TourTournament";
import ServiceProviderDetail from "./subviews/ServiceProviderDetail";
import MyTeam from "./subviews/MyTeam";
import ProviderListingForm from "./subviews/ProviderListingForm";
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
      return <CreateGame invite={subView.invite} sport={subView.sport} />;
    case "edit-game":
      return <CreateGame gameId={subView.gameId} />;
    case "game-review":
      return <GameReview gameId={subView.gameId} />;
    case "tennis-live":
      return <TennisLive />;
    case "game-result":
      return <GameResult gameId={subView.gameId} />;
    case "leaderboard":
      return <Leaderboard />;
    case "people-browse":
      return <BrowsePeople />;
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
    case "tour-expenses":
      return <ExpensesView />;
    case "tour-schedule":
      return <ScheduleView addKind={subView.addKind} />;
    case "tour-profile-edit":
      return <TourProfileEdit />;
    case "tour-players":
      return <TourPlayers />;
    case "tour-player-view":
      return <TourPlayerView playerId={subView.playerId} role={subView.role} playerName={subView.playerName} />;
    case "tour-deadlines":
      return <TourDeadlines />;
    case "tour-visa":
      return <TourVisa />;
    case "tour-planner":
      return <TourPlanner />;
    case "services":
      return <ServicesHub />;
    case "tour-tournament":
      return <TourTournament tournamentId={subView.tournamentId} />;
    case "service-detail":
      return <ServiceProviderDetail providerId={subView.providerId} />;
    case "my-team":
      return <MyTeam />;
    case "list-provider":
      return <ProviderListingForm />;
    default:
      return null;
  }
}
