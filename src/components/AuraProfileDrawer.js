/**
 * AuraProfileDrawer.js
 * AURA Bistro slide-in profile drawer from the RIGHT side.
 * Dark glassmorphism style with gold accent - unique AURA identity.
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Switch,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "../utils/SafeLinearGradient";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useOrders } from "../context/OrdersContext";

const { width, height } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(width * 0.82, 340);

export default function AuraProfileDrawer({ visible, onClose, navigation }) {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { orders } = useOrders();

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const getInitials = (name) => {
    if (!name) return "AU";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const activeOrders = (orders || []).filter((o) =>
    ["Pending", "Preparing", "Ready"].includes(o.status)
  );

  const handleLogout = async () => {
    onClose();
    setTimeout(async () => {
      if (Platform.OS === "web") {
        const ok = window.confirm("Are you sure you want to log out?");
        if (!ok) return;
      }
      await logout();
    }, 300);
  };

  const NavItem = ({ icon, label, onPress, badge }) => (
    <TouchableOpacity
      onPress={() => { onClose(); setTimeout(onPress, 300); }}
      style={styles.navItem}
      activeOpacity={0.7}
    >
      <View style={[styles.navIconWrap, { backgroundColor: colors.primary + "18" }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.navLabel, { color: colors.textPrimary }]}>{label}</Text>
      {badge > 0 && (
        <View style={[styles.navBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.navBadgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }], backgroundColor: isDark ? "#0F0F0F" : "#FFFFFF" },
        ]}
      >
        <LinearGradient colors={["#1a0533", "#2d0a4e", "#1a0533"]} style={styles.drawerHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#ffffff99" />
          </TouchableOpacity>
          <Text style={styles.brandStamp}>AURA BISTRO</Text>
          <Text style={styles.brandTagline}>Culinary Excellence</Text>
          <LinearGradient colors={["#d4a843", "#f5c842", "#d4a843"]} style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: 74, height: 74, borderRadius: 37 }} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
              )}
            </View>
          </LinearGradient>
          <Text style={styles.userName}>{user?.name || "Customer"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
          {user?.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
          <View style={styles.memberBadge}>
            <Ionicons name="star" size={10} color="#d4a843" />
            <Text style={styles.memberBadgeText}>{user?.membership || "Member"}</Text>
          </View>
        </LinearGradient>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

        <View style={styles.navSection}>
          <NavItem
            icon="person-circle-outline"
            label="My Profile & Settings"
            onPress={() => navigation?.navigate("Profile")}
            badge={0}
          />
          <NavItem icon="receipt-outline" label="Order History" onPress={() => {}} badge={0} />
          <NavItem
            icon="restaurant-outline"
            label="Active Orders"
            onPress={() => navigation?.navigate("TrackTab")}
            badge={activeOrders.length}
          />
          <NavItem
            icon="calendar-outline"
            label="My Reservations"
            onPress={() => navigation?.navigate("Reservations")}
            badge={0}
          />
          <NavItem icon="heart-outline" label="Saved Favourites" onPress={() => {}} badge={0} />
          <View style={styles.navItem}>
            <View style={[styles.navIconWrap, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name={isDark ? "moon" : "sunny-outline"} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.navLabel, { color: colors.textPrimary }]}>
              {isDark ? "Dark Mode" : "Light Mode"}
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              thumbColor={isDark ? colors.primary : "#f5c842"}
              trackColor={{ false: "#cccccc", true: colors.primary + "55" }}
            />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

        <View style={styles.signOutSection}>
          <TouchableOpacity onPress={handleLogout} style={styles.signOutBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={["#7f1d1d", "#991b1b", "#7f1d1d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signOutGradient}
            >
              <Ionicons name="log-out-outline" size={18} color="#FFF" />
              <Text style={styles.signOutText}>Log Out</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            AURA Restaurant v1.0
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000000AA" },
  drawer: {
    position: "absolute", top: 0, right: 0,
    width: DRAWER_WIDTH, height: height,
    shadowColor: "#000", shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 30,
  },
  drawerHeader: {
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    paddingBottom: 24, paddingHorizontal: 22, alignItems: "center",
  },
  closeBtn: {
    position: "absolute", top: Platform.OS === "ios" ? 52 : 14, right: 16,
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#ffffff15",
    alignItems: "center", justifyContent: "center",
  },
  brandStamp: { color: "#d4a84399", fontSize: 10, fontWeight: "800", letterSpacing: 3, marginBottom: 2 },
  brandTagline: { color: "#ffffff55", fontSize: 9, letterSpacing: 2, marginBottom: 18 },
  avatarRing: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12, padding: 3 },
  avatarInner: { width: 74, height: 74, borderRadius: 37, backgroundColor: "#1a0533", alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: "#f5c842", fontSize: 28, fontWeight: "900", letterSpacing: 2 },
  userName: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginBottom: 4 },
  userEmail: { color: "#ffffff88", fontSize: 12, marginBottom: 2 },
  userPhone: { color: "#ffffff66", fontSize: 12, marginBottom: 8 },
  memberBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#d4a84322", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "#d4a84344", marginTop: 4,
  },
  memberBadgeText: { color: "#d4a843", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  divider: { height: 1 },
  navSection: { paddingVertical: 8, paddingHorizontal: 16 },
  navItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  navIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navLabel: { fontSize: 14, fontWeight: "600", flex: 1 },
  navBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  navBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  signOutSection: { padding: 20, marginTop: "auto" },
  signOutBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 14 },
  signOutGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 20 },
  signOutText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14, letterSpacing: 0.3 },
  versionText: { textAlign: "center", fontSize: 10, letterSpacing: 0.5 },
});
