import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Team() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");

  const teamQuery = trpc.team.list.useQuery(undefined, {
    enabled: currentUser?.role === "admin",
  });

  const inviteUserMutation = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitación enviada exitosamente");
      teamQuery.refetch();
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("user");
    },
    onError: (error) => {
      toast.error(error.message || "Error al enviar invitación");
    },
  });

  const removeUserMutation = trpc.team.remove.useMutation({
    onSuccess: () => {
      toast.success("Usuario eliminado del equipo");
      teamQuery.refetch();
    },
    onError: () => {
      toast.error("Error al eliminar usuario");
    },
  });

  const updateRoleMutation = trpc.team.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Rol actualizado");
      teamQuery.refetch();
    },
    onError: () => {
      toast.error("Error al actualizar rol");
    },
  });

  const handleInviteUser = () => {
    if (!inviteEmail.trim()) {
      toast.error("Por favor ingresa un email");
      return;
    }

    inviteUserMutation.mutate({
      email: inviteEmail,
      name: inviteName || undefined,
      role: inviteRole,
    });
  };

  const handleRemoveUser = (userId: number) => {
    removeUserMutation.mutate({ userId });
  };

  const handleUpdateRole = (userId: number, role: "user" | "admin") => {
    updateRoleMutation.mutate({ userId, role });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Acceso Restringido</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Solo los administradores pueden acceder a la gestión de equipo
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (teamQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando equipo...</p>
        </div>
      </div>
    );
  }

  const teamMembers = teamQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Equipo</h1>
            <p className="text-muted-foreground">
              Administra los miembros de tu equipo y sus permisos
            </p>
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invitar Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Envía una invitación para que un nuevo miembro se una a tu equipo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="inviteEmail">Email *</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="inviteName">Nombre (opcional)</Label>
                  <Input
                    id="inviteName"
                    placeholder="Juan Pérez"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="inviteRole">Rol</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "user" | "admin")}>
                    <SelectTrigger id="inviteRole">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Los administradores tienen acceso completo a todas las funciones
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleInviteUser} disabled={inviteUserMutation.isPending}>
                  {inviteUserMutation.isPending ? "Enviando..." : "Enviar Invitación"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Miembros del Equipo ({teamMembers.length})
            </CardTitle>
            <CardDescription>
              Lista de todos los miembros con acceso a la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay miembros en el equipo</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member: any) => {
                    const isCurrentUser = member.id === currentUser.id;
                    
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.name || "Sin nombre"}
                          {isCurrentUser && (
                            <Badge variant="secondary" className="ml-2">Tú</Badge>
                          )}
                        </TableCell>
                        <TableCell>{member.email || "-"}</TableCell>
                        <TableCell>
                          {isCurrentUser ? (
                            <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                              {member.role === "admin" ? "Administrador" : "Usuario"}
                            </Badge>
                          ) : (
                            <Select
                              value={member.role}
                              onValueChange={(role) => handleUpdateRole(member.id, role as "user" | "admin")}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Usuario</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.lastSignedIn
                            ? new Date(member.lastSignedIn).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {!isCurrentUser && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará a {member.name || member.email} del equipo.
                                    Perderá acceso a la plataforma.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveUser(member.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
