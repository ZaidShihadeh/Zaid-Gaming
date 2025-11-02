import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  Users as UsersIcon,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  User as UserType,
  UsersListResponse,
  UserActionRequest,
} from "@shared/auth";
import { getAuthToken, getUserData } from "@/lib/auth-utils";

export default function Users() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tempBanDuration, setTempBanDuration] = useState<string>("24");
  const [kickReason, setKickReason] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUserData();
    const token = getAuthToken();

    if (!userData || !token) {
      navigate("/signin");
      return;
    }

    setCurrentUser(userData);

    if (!userData.isAdmin) {
      navigate("/profile");
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data: UsersListResponse = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: "ban" | "unban" | "kick" | "tempban",
    duration?: number,
    reason?: string,
  ) => {
    setActionLoading(userId);

    try {
      const actionData: UserActionRequest = {
        userId,
        action,
        duration,
        reason,
      };
      const response = await fetch("/api/users/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(actionData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the users list to get updated status
        fetchUsers();
        toast({
          title: "Success!",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} user.`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-neon-blue">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Background Pattern */}
      <div
        className={
          'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23404040" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-20'
        }
      ></div>

      {/* Header */}
      <header className="relative z-10 border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/profile"
              className="flex items-center text-neon-blue hover:text-neon-purple transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-neon-purple" />
              <span className="text-neon-purple font-medium">
                Admin Dashboard
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Card className="bg-gaming-card/80 border-gaming-border">
          <CardHeader>
            <CardTitle className="flex items-center text-neon-purple">
              <UsersIcon className="mr-2 h-6 w-6" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage all registered users and their access permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-gaming-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-gaming-border hover:bg-gaming-dark/50">
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-gaming-border hover:bg-gaming-dark/30"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.profilePicture}
                              alt={user.name}
                            />
                            <AvatarFallback className="bg-neon-blue/20 text-neon-blue text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <Badge
                            variant="destructive"
                            className="bg-red-500/20 text-red-400 border-red-500/30"
                          >
                            Banned
                          </Badge>
                        ) : user.tempBannedUntil &&
                          new Date(user.tempBannedUntil) > new Date() ? (
                          <Badge
                            variant="destructive"
                            className="bg-orange-500/20 text-orange-400 border-orange-500/30"
                          >
                            Temp Banned
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="bg-green-500/20 text-green-400 border-green-500/30"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-gaming-border"
                          >
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.id !== currentUser?.id && !user.isAdmin && (
                          <div className="flex justify-end space-x-1">
                            {user.isBanned ||
                            (user.tempBannedUntil &&
                              new Date(user.tempBannedUntil) > new Date()) ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-400 border-green-500/50 hover:bg-green-500/10"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-gaming-card border-gaming-border">
                                  <DialogHeader>
                                    <DialogTitle className="text-neon-blue">
                                      Unban User
                                    </DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to unban{" "}
                                      <span className="font-medium text-green-400">
                                        {user.name}
                                      </span>
                                      ? They will regain access to the platform.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      onClick={() =>
                                        handleUserAction(user.id, "unban")
                                      }
                                      className="bg-green-600 hover:bg-green-700"
                                      disabled={actionLoading === user.id}
                                    >
                                      {actionLoading === user.id
                                        ? "Unbanning..."
                                        : "Unban User"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <>
                                {/* Kick Button */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10"
                                      title="Kick user"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-gaming-card border-gaming-border">
                                    <DialogHeader>
                                      <DialogTitle className="text-yellow-400">
                                        Kick User
                                      </DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to kick{" "}
                                        <span className="font-medium text-yellow-400">
                                          {user.name}
                                        </span>
                                        ? This will completely remove their
                                        account from the database. They can sign
                                        up again with the same email if needed.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <Label htmlFor="kickReason">
                                        Reason for kick (optional)
                                      </Label>
                                      <Input
                                        id="kickReason"
                                        value={kickReason}
                                        onChange={(e) =>
                                          setKickReason(e.target.value)
                                        }
                                        className="bg-gaming-dark/50 border-gaming-border mt-2"
                                        placeholder="Enter reason for kicking this user..."
                                      />
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        onClick={() =>
                                          handleUserAction(
                                            user.id,
                                            "kick",
                                            undefined,
                                            kickReason,
                                          )
                                        }
                                        className="bg-yellow-600 hover:bg-yellow-700"
                                        disabled={actionLoading === user.id}
                                      >
                                        {actionLoading === user.id
                                          ? "Kicking..."
                                          : "Kick User"}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                {/* Temporary Ban Button */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-orange-400 border-orange-500/50 hover:bg-orange-500/10"
                                      title="Temporary ban"
                                    >
                                      <UserX className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-gaming-card border-gaming-border">
                                    <DialogHeader>
                                      <DialogTitle className="text-orange-400">
                                        Temporary Ban
                                      </DialogTitle>
                                      <DialogDescription>
                                        How long do you want to ban{" "}
                                        <span className="font-medium text-orange-400">
                                          {user.name}
                                        </span>
                                        ?
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <Label htmlFor="duration">
                                        Duration (hours)
                                      </Label>
                                      <Input
                                        id="duration"
                                        type="number"
                                        min="1"
                                        max="168"
                                        value={tempBanDuration}
                                        onChange={(e) =>
                                          setTempBanDuration(e.target.value)
                                        }
                                        className="bg-gaming-dark/50 border-gaming-border"
                                      />
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        onClick={() =>
                                          handleUserAction(
                                            user.id,
                                            "tempban",
                                            parseInt(tempBanDuration),
                                          )
                                        }
                                        className="bg-orange-600 hover:bg-orange-700"
                                        disabled={
                                          actionLoading === user.id ||
                                          !tempBanDuration ||
                                          parseInt(tempBanDuration) <= 0
                                        }
                                      >
                                        {actionLoading === user.id
                                          ? "Banning..."
                                          : "Temporary Ban"}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                {/* Permanent Ban Button */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-400 border-red-500/50 hover:bg-red-500/10"
                                      title="Permanent ban"
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-gaming-card border-gaming-border">
                                    <DialogHeader>
                                      <DialogTitle className="text-red-400 flex items-center">
                                        <AlertTriangle className="mr-2 h-5 w-5" />
                                        Permanent Ban
                                      </DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to permanently ban{" "}
                                        <span className="font-medium text-red-400">
                                          {user.name}
                                        </span>
                                        ? This action is severe and they will
                                        lose permanent access to the platform.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button
                                        onClick={() =>
                                          handleUserAction(user.id, "ban")
                                        }
                                        variant="destructive"
                                        disabled={actionLoading === user.id}
                                      >
                                        {actionLoading === user.id
                                          ? "Banning..."
                                          : "Permanent Ban"}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
