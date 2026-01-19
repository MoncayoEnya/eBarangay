import {
  Home,
  Users,
  FileText,
  AlertCircle,
  Megaphone,
  Calendar,
  Shield,
  Recycle,
  Heart,
  Activity,
  TrendingUp,
  Settings
} from "lucide-react";

export const sidebarNav = [
  { path: "/dashboard", icon: Home, label: "Dashboard" },
  { path: "/residents", icon: Users, label: "Residents" },
  { path: "/documents", icon: FileText, label: "Documents", badge: 24 },
  { path: "/incidents", icon: AlertCircle, label: "Incidents" },
  { path: "/announcements", icon: Megaphone, label: "Announcements" },
  { path: "/events", icon: Calendar, label: "Events" },
  { path: "/drrm", icon: Shield, label: "DRRM" },
  { path: "/waste-management", icon: Recycle, label: "Waste Management" },
  { path: "/social-welfare", icon: Heart, label: "Social Welfare" },
  { path: "/health-services", icon: Activity, label: "Health Services" },
  { path: "/finance", icon: TrendingUp, label: "Finance" },
  { path: "/settings", icon: Settings, label: "Settings" }
];