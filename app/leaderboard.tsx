import BackButton from "@/components/backButton";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { DataTable } from "react-native-paper";
import { UserService } from "@/services/auth.service";
import { User } from "@/interface/User";
import useUserStore from "@/core/userState";
import { StatusBar } from "expo-status-bar";

const Leaderboard = () => {
  const [page, setPage] = useState<number>(0);
  const theme = useUserStore(s => s.theme);
  const user = useUserStore(s => s.user);
  const [numberOfItemsPerPageList] = useState([5, 10, 15]);
  const [itemsPerPage, onItemsPerPageChange] = useState(
    numberOfItemsPerPageList[0]
  );

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userService = new UserService();

  const getHighQualityImageUrl = (url: string | null | undefined): string | undefined => {
    if (!url || typeof url !== 'string') return undefined;
    return url
      .replace(/_normal(\.[a-z]+)$/i, '_400x400$1')
      .replace(/_mini(\.[a-z]+)$/i, '_400x400$1')
      .replace(/_bigger(\.[a-z]+)$/i, '_400x400$1');
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await userService.getLeaderboard();
        setUsers(response.users);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, users.length);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'expert':
        return '#FF6B6B';
      case 'advanced':
        return '#00FF66';
      case 'intermediate':
        return '#61728C';
      case 'beginner':
        return '#A78BFA';
      default:
        return '#61728C';
    }
  };

  const getTopThreeUsers = () => {
    const topThree = users.slice(0, 3);
    return {
      first: topThree[0] || null,
      second: topThree[1] || null,
      third: topThree[2] || null
    };
  };

  const getRemainingUsers = () => {
    const remainingUsers = users.slice(3, 10).map((userData, index) => ({
      key: index + 4,
      rank: index + 4,
      name: userData.name,
      xp: userData.xp,
      id: userData.id,
      isCurrentUser: user?.id === userData.id,
    }));

    const currentUserInTop3 = users.slice(0, 3).some(userData => userData.id === user?.id);
    const currentUserInTop10 = users.slice(0, 10).some(userData => userData.id === user?.id);
    
    if (user && !currentUserInTop3 && !currentUserInTop10) {
      const currentUserRank = users.findIndex(userData => userData.id === user.id) + 1;
      
      if (currentUserRank > 10) {
        remainingUsers.push({
          key: currentUserRank + 1000,
          rank: currentUserRank,
          name: user.name,
          xp: user.xp,
          id: user.id,
          isCurrentUser: true,
        });
      }
    }

    return remainingUsers;
  };

  const { first, second, third } = getTopThreeUsers();
  const remainingUsers = getRemainingUsers();

  if (loading) {
    return (
      <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
        <View style={styles.topNav}>
          <BackButton />
          <Text style={styles.heading}>Leaderboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme === "dark" ? "#00FF66" : "#000"} />
          <Text style={[styles.loadingText, theme === "dark" && { color: "#E0E0E0" }]}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
        <View style={styles.topNav}>
          <BackButton />
          <Text style={styles.heading}>Leaderboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, theme === "dark" && { color: "#E0E0E0" }]}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <StatusBar  style={theme === "dark" ? "light" : "dark"} />
      <View style={styles.topNav}>
        <BackButton />
        <Text style={[styles.heading, theme === "dark" && { color: "#E0E0E0" }]}>Leaderboard</Text>
      </View>

      <Text style={[styles.subText, theme === "dark" && { color: "#A0A0A0" }]}>
        See how you rank against other learners and climb your way to the top.
      </Text>

      <View style={styles.board}>
        <View style={styles.topthree}>
          {second && (
            <View style={[
              styles.second, 
              user?.id === second.id 
                ? (theme === "dark" ? {backgroundColor: "#00FF66"} : {backgroundColor: "#000"})
                : (theme === "dark" ? {backgroundColor: "#2E3033"} : {backgroundColor: "#EDF3FC"})
            ]}>
              <Image source={require("@/assets/images/silver.png")} style={styles.medal} />
              <View style={styles.avatarWrapper}>
                <Image source={getHighQualityImageUrl(second?.profilePictureURL) ? { uri: getHighQualityImageUrl(second?.profilePictureURL) } : require("@/assets/images/memoji.png")} style={styles.avatar} />
              </View>
              <Text style={[
                styles.name, 
                user?.id === second.id 
                  ? (theme === "dark" ? {color: "#000"} : {color: "#fff"})
                  : (theme === "dark" ? {color: "#E0E0E0"} : {color: "#2D3C52"})
              ]}>{second.name}</Text>
              <Text style={[
                styles.level, 
                user?.id === second.id 
                  ? (theme === "dark" ? {color: "#000"} : {color: "#fff"})
                  : { color: getLevelColor(second.level) }
              ]}>
                {second.level || 'Novice'}
              </Text>
              <View style={styles.xpContainer}>
                <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.badgeIcon} />
                <Text style={[
                  styles.xp, 
                  user?.id === second.id 
                    ? (theme === "dark" ? {color: "#000"} : {color: "#fff"})
                    : (theme === "dark" ? {color: "#A0A0A0"} : {color: "#61728C"})
                ]}>{second.xp} XP</Text>
              </View>
            </View>
          )}

          {first && (
            <View style={[
              styles.first, 
              user?.id === first.id 
                ? (theme === "dark" ? {backgroundColor: "#00FF66"} : {backgroundColor: "#000"})
                : (theme === "dark" ? {backgroundColor: "#00FF80"} : {backgroundColor: "#000"})
            ]}>
              <Image source={require("@/assets/images/gold.png")} style={styles.medal} />
              <View style={styles.avatarWrapper}>
                <Image source={getHighQualityImageUrl(first?.profilePictureURL) ? { uri: getHighQualityImageUrl(first?.profilePictureURL) } : require("@/assets/images/memoji.png")} style={styles.avatar} />
              </View>
              <Text style={[styles.name, theme === "dark" ? { color: "#000" } : {color: "#00FF66"}]}>{first.name}</Text>
              <Text style={[styles.level, theme === "dark" ? { color: "#000" } : {color: "#00FF66"}]}>
                {first.level || 'Novice'}
              </Text>
              <View style={styles.xpContainer}>
                <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.badgeIcon} />
                <Text style={[styles.xp, theme === "dark" ? { color: "#000" } : {color: "#00FF66"}]}>{first.xp} XP</Text>
              </View>
            </View>
          )}

          {third && (
          <View style={[
            styles.third, 
            user?.id === third.id 
              ? (theme === "dark" ? {backgroundColor: "#00FF66"} : {backgroundColor: "#000"})
              : (theme === "dark" ? {backgroundColor: "#2E3033"} : {backgroundColor: "#F5F3FF"})
          ]}>
              <Image source={require("@/assets/images/bronze.png")} style={styles.medal} />
              <View style={styles.avatarWrapper}>
                <Image source={getHighQualityImageUrl(third?.profilePictureURL) ? { uri: getHighQualityImageUrl(third?.profilePictureURL) } : require("@/assets/images/memoji.png")} style={styles.avatar} />
              </View>
              <Text style={[
                styles.name, 
                user?.id === third.id 
                  ? (theme === "dark" ? {color: "#000"} : {color: "#fff"})
                  : (theme === "dark" ? {color: "#E0E0E0"} : {color: "#2D3C52"})
              ]}>{third.name}</Text>
              <Text style={[
                styles.level, 
                user?.id === third.id 
                  ? (theme === "dark" ? {color: "#000"} : {color: "#fff"})
                  : { color: getLevelColor(third.level) }
              ]}>
                {third.level || 'Novice'}
              </Text>
              <View style={styles.xpContainer}>
                <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.badgeIcon} />
                <Text style={[
                  styles.xp, 
                  user?.id === third.id 
                    ? (theme === "dark" ? {color: "#000"} : {color: "#fff"})
                    : (theme === "dark" ? {color: "#A0A0A0"} : {color: "#61728C"})
                ]}>{third.xp} XP</Text>
              </View>
            </View>
          )}
        </View>
        
        {remainingUsers.length > 0 && (
          <View style={[styles.tableContainer, theme === "dark" && { backgroundColor: "#131313" }]}>
            <DataTable style={[styles.table, theme === "dark" && { backgroundColor: "#131313" }]}>
              {remainingUsers.slice(from, to).map((userData) => (
                <DataTable.Row 
                  key={userData.key} 
                  style={[
                    styles.tableRow, 
                    userData.isCurrentUser && (theme === "dark" ? styles.currentUserRowDark : styles.currentUserRowLight),
                    theme === "dark" && { borderBottomColor: "#2E3033" }
                  ]}
                >
                  <DataTable.Cell style={styles.rankColumn}>
                    <Text style={[
                      styles.rankText, 
                      userData.isCurrentUser 
                        ? { color: "#000" }
                        : (theme === "dark" ? { color: "#E0E0E0" } : { color: "#2D3C52" })
                    ]}>{userData.rank}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.nameColumn}>
                    <Text style={[
                      styles.nameText, 
                      userData.isCurrentUser 
                        ? { color: "#000" }
                        : (theme === "dark" ? { color: "#E0E0E0" } : { color: "#2D3C52" })
                    ]}>{userData.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.xpColumn}>
                    <View style={styles.xpColumnContent}>
                      <Image 
                        source={require("@/assets/images/icons/medal-05.png")} 
                        style={styles.tableIcon} 
                      />
                      <Text style={[
                        styles.xpText, 
                        userData.isCurrentUser 
                          ? { color: "#000" }
                          : (theme === "dark" ? { color: "#A0A0A0" } : { color: "#61728C" })
                      ]}>{userData.xp} XP</Text>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}

              {remainingUsers.length > itemsPerPage && (
                <View style={styles.paginationContainer}>
                  <DataTable.Pagination
                    page={page}
                    numberOfPages={Math.ceil(remainingUsers.length / itemsPerPage)}
                    onPageChange={(page) => setPage(page)}
                    onItemsPerPageChange={onItemsPerPageChange}
                    showFastPaginationControls
                    style={[styles.pagination]}
                    theme={{
                      colors: {
                        primary: theme === "dark" ? "#00FF66" : "#000",
                        onSurface: theme === "dark" ? "#E0E0E0" : "#2D3C52",
                        surface: theme === "dark" ? "#131313" : "#fff",
                        onSurfaceVariant: theme === "dark" ? "#A0A0A0" : "#61728C",
                      }
                    }}
                  />
                </View>
              )}
            </DataTable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FBFC",
    padding: 20,
    flex: 1,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
    marginTop: 50

  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Satoshi",
  },
  subText: {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 20,
    color: "#61728C",
    fontWeight: "400",
    marginTop: 10,
  },
  board: {
    marginTop: 70,
  },
  topthree: {
    flexDirection: "row",
    justifyContent: "center",
  },
  first: {
    backgroundColor: "#000",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    width: 140,
    height: 195, 
    zIndex: 2,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
  },
  second: {
    backgroundColor: "#EDF3FC",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: 125,
    height: 175, 
    zIndex: 1,
    alignSelf: "flex-end",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  third: {
    backgroundColor: "#F5F3FF",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: 120,
    height: 170, 
    zIndex: 1,
    alignSelf: "flex-end",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  medal: {
    position: "absolute",
    top: -25,
    width: 45,
    height: 45,
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarWrapper: {
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: 3,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
    color: "#2D3C52",
    fontFamily: "Satoshi",
    textAlign: "center",
    flexShrink: 1,
    paddingHorizontal: 4,
    width: '100%',
    flexWrap: 'wrap',
  },
  level: {
    fontSize: 9,
    fontFamily: "Satoshi",
    fontWeight: "500",
    marginTop: 1,
    textAlign: "center",
    flexShrink: 1,
    paddingHorizontal: 4,
    width: '100%',
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2
  },
  badgeIcon: {
    width: 10,
    height: 10,
    marginRight: 3,
  },
  xp: {
    fontSize: 10,
    fontWeight: "500",
    color: "#61728C",
    fontFamily: "Satoshi",
    lineHeight: 12
  },
  tableContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Satoshi",
    marginBottom: 10,
    marginLeft: 5,
  },
  table: {
    backgroundColor: '#fff',
  },
  tableHeader: {
    backgroundColor: '#F9FBFC',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3FC',
    fontFamily: "Satoshi",
    paddingVertical: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankColumn: {
    flex: 0.15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameColumn: {
    flex: 0.5,
    justifyContent: 'center',
  },
  xpColumn: {
    flex: 0.35,
    justifyContent: 'center',
  },
  xpColumnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  tableIcon: {
    width: 14,
    height: 14,
  },
  pagination: {
    paddingHorizontal: 0,
  },
  paginationContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rankText: {
    fontFamily: "Satoshi",
    textAlign: 'center',
  },
  nameText: {
    fontFamily: "Satoshi",
  },
  xpText: {
    fontFamily: "Satoshi",
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: "Urbanist",
    fontSize: 16,
    color: "#61728C",
    marginTop: 20,
  },
  errorText: {
    fontFamily: "Urbanist",
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: 'center',
    marginTop: 100,
  },
  currentUserRowDark: {
    backgroundColor: "#00FF80",
    shadowColor: "#00FF80",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  currentUserRowLight: {
    backgroundColor: "#00FF80",
    shadowColor: "#00FF80",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default Leaderboard;
