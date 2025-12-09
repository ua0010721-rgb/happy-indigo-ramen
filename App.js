// App.js - Maza-style Lite (single-file)
// Paste this entire file into Expo Snack App.js and Run
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Image,
} from "react-native";

/* --------------------
   Helper / Fake Data
   -------------------- */
const initialUser = {
  id: "user_01",
  name: "KHAN_07™",
  followers: 286,
  following: 12,
  likes: 526,
  visitors: "1.5K",
  svipLevel: 0,
  svipExpiry: null,
  coins: 681,
  diamonds: 3,
  balanceUSD: 0.0,
};

const initialRooms = [
  { id: "r1", name: "Room 1", players: 1, max: 12 },
  { id: "r2", name: "Room 2", players: 2, max: 12 },
  { id: "r3", name: "Room 3", players: 0, max: 12 },
  { id: "r4", name: "Treasure Room", players: 8, max: 12 },
];

const svipLevels = [
  1,2,3,4,5,6,7,8,9,10,11
];

/* --------------------
   Small UI components
   -------------------- */
function Badge({ level }) {
  const colors = ["#C0C0C0","#FFD700", "#FF8C00", "#FF5E78", "#9B59B6", "#2ECC71","#1ABC9C","#3498DB","#E74C3C","#D35400","#7F8C8D"];
  const color = colors[(level-1) % colors.length] || "#ddd";
  return (
    <View style={[styles.badgeContainer, { borderColor: color }]}>
      <Text style={[styles.badgeText]}>SVIP {level}</Text>
    </View>
  );
}

/* --------------------
   Main App
   -------------------- */
export default function App() {
  // navigation simulated
  const [tab, setTab] = useState("home");

  // user + data state
  const [user, setUser] = useState(initialUser);
  const [rooms, setRooms] = useState(initialRooms);
  const [history, setHistory] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [modal, setModal] = useState({ open: false, name: "", data: null });

  // SVIP purchase & coin recharge amounts
  const rechargePacks = [
    { id: "p1", coins: 50, price: 5 },
    { id: "p2", coins: 200, price: 18 },
    { id: "p3", coins: 500, price: 40 },
  ];

  // simulate some periodic updates (players join/leave)
  useEffect(() => {
    const t = setInterval(() => {
      setRooms((prev) =>
        prev.map((r) => {
          if (Math.random() > 0.7) {
            let change = Math.random() > 0.5 ? 1 : -1;
            let newPlayers = Math.max(0, Math.min(r.max, r.players + change));
            return { ...r, players: newPlayers };
          }
          return r;
        })
      );
    }, 2000);
    return () => clearInterval(t);
  }, []);

  function openModal(name, data = null) {
    setModal({ open: true, name, data });
  }
  function closeModal() {
    setModal({ open: false, name: "", data: null });
  }

  function buyCoins(pack) {
    setUser((u) => {
      const updated = { ...u, coins: u.coins + pack.coins };
      setHistory((h) => [
        { id: Date.now().toString(), type: "Recharge", text: `+${pack.coins} coins`, date: new Date().toLocaleString() },
        ...h,
      ]);
      return updated;
    });
    Alert.alert("Success", `${pack.coins} coins added to wallet`);
  }

  function buySVIP(level) {
    const priceCoins = level * 100;
    if (user.coins < priceCoins) {
      Alert.alert("Not enough coins", `You need ${priceCoins} coins to buy SVIP ${level}`);
      return;
    }
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    setUser((u) => {
      const updated = {
        ...u,
        coins: u.coins - priceCoins,
        svipLevel: level,
        svipExpiry: expiry.toDateString(),
      };
      setHistory((h) => [
        { id: Date.now().toString(), type: "SVIP", text: `Purchased SVIP ${level}`, date: new Date().toLocaleString() },
        ...h,
      ]);
      return updated;
    });
    Alert.alert("SVIP Activated", `SVIP ${level} active till ${expiry.toDateString()}`);
    closeModal();
  }

  function joinRoom(roomId) {
    setRooms((rms) => {
      const updated = rms.map((r) => (r.id === roomId && r.players < r.max ? { ...r, players: r.players + 1 } : r));
      return updated;
    });
    setHistory((h) => [
      { id: Date.now().toString(), type: "Room", text: `Joined room ${roomId}`, date: new Date().toLocaleString() },
      ...h,
    ]);
  }

  function playLuckyWheel() {
    if (user.coins < 10) {
      Alert.alert("Not enough coins", "You need 10 coins to spin the wheel");
      return;
    }
    setUser((u) => ({ ...u, coins: u.coins - 10 }));
    const prizes = [
      { type: "coins", amount: 20 },
      { type: "coins", amount: 50 },
      { type: "diamond", amount: 1 },
      { type: "coins", amount: 100 },
      { type: "nothing", amount: 0 },
    ];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    if (prize.type === "coins") {
      setUser((u) => ({ ...u, coins: u.coins + prize.amount }));
      setHistory((h) => [{ id: Date.now().toString(), type: "Wheel", text: `Won ${prize.amount} coins`, date: new Date().toLocaleString() }, ...h]);
      Alert.alert("Wheel Result", `You won ${prize.amount} coins!`);
    } else if (prize.type === "diamond") {
      setUser((u) => ({ ...u, diamonds: u.diamonds + prize.amount }));
      setHistory((h) => [{ id: Date.now().toString(), type: "Wheel", text: `Won ${prize.amount} diamond`, date: new Date().toLocaleString() }, ...h]);
      Alert.alert("Wheel Result", `You won ${prize.amount} diamond!`);
    } else {
      setHistory((h) => [{ id: Date.now().toString(), type: "Wheel", text: `No prize`, date: new Date().toLocaleString() }, ...h]);
      Alert.alert("Wheel Result", "Better luck next time!");
    }
  }

  function requestWithdraw(amount) {
    if (!amount || isNaN(amount)) {
      Alert.alert("Enter valid amount");
      return;
    }
    const amt = parseInt(amount);
    if (user.coins < amt) {
      Alert.alert("Insufficient coins");
      return;
    }
    const req = { id: Date.now().toString(), amount: amt, status: "Pending", userId: user.id };
    setWithdrawRequests((s) => [req, ...s]);
    setUser((u) => ({ ...u, coins: u.coins - amt }));
    setHistory((h) => [{ id: Date.now().toString(), type: "Withdraw", text: `Requested -${amt} coins`, date: new Date().toLocaleString() }, ...h]);
    Alert.alert("Withdraw", "Request sent to admin");
  }

  function adminApproveWithdraw(reqId) {
    setWithdrawRequests((s) => s.map((r) => (r.id === reqId ? { ...r, status: "Approved" } : r)));
    Alert.alert("Admin", "Withdraw approved");
  }
  function adminGiveSVIP(userId, level) {
    setUser((u) => ({ ...u, svipLevel: level, svipExpiry: new Date(new Date().setDate(new Date().getDate() + 30)).toDateString() }));
    setHistory((h) => [{ id: Date.now().toString(), type: "Admin", text: `Admin granted SVIP ${level}`, date: new Date().toLocaleString() }, ...h]);
  }

  function HomeTab() {
    return (
      <ScrollView style={styles.page}>
        <View style={styles.profileCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={{ uri: "https://i.pravatar.cc/120?img=5" }} style={styles.avatar} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.username}>{user.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                {user.svipLevel > 0 ? <Badge level={user.svipLevel} /> : <Text style={{ color: "#888" }}>No SVIP</Text>}
                <Text style={{ marginLeft: 8, color: "#666" }}>{user.svipLevel ? `Expires: ${user.svipExpiry}` : ""}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{user.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{user.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{user.likes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{user.visitors}</Text>
              <Text style={styles.statLabel}>Visitors</Text>
            </View>
          </View>

/* App truncated for preview; full file available in message from assistant. */
