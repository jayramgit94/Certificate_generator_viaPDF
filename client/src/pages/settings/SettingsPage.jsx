import { useMutation } from "@tanstack/react-query";
import { Lock, Save, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import Card, { CardContent, CardHeader } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const profileMutation = useMutation({
    mutationFn: (data) => api.put("/auth/me", data),
    onSuccess: ({ data }) => {
      setUser(data.data);
      localStorage.setItem("user", JSON.stringify(data.data));
      toast.success("Profile updated!");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => api.put("/auth/change-password", data),
    onSuccess: () => {
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed!");
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile Information
          </h3>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              profileMutation.mutate(profile);
            }}
            className="space-y-4"
          >
            <Input
              label="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={profileMutation.isPending}>
                <Save className="w-4 h-4" />
                {profileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Change Password
          </h3>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (passwords.newPassword !== passwords.confirmPassword) {
                toast.error("Passwords don't match");
                return;
              }
              passwordMutation.mutate({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
              });
            }}
            className="space-y-4"
          >
            <Input
              label="Current Password"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
            />
            <Input
              label="New Password"
              type="password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmPassword: e.target.value })
              }
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={passwordMutation.isPending}>
                <Lock className="w-4 h-4" />
                {passwordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
